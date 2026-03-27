---
name: TypeScript + Rollup 重构方案
description: douyudm v3.0.0 完整技术方案，含架构、构建、API 设计、CI/CD、已知 Bug 修复
type: project
---

## 重构目标

将 douyudm 从 CommonJS JavaScript 重构为 TypeScript，用 Rollup 打包，支持：
1. Node.js CJS (`require`)
2. Node.js/bundler ESM (`import`)
3. 浏览器 IIFE (`douyudm.Client`，全局变量小写)
4. CLI 二进制 (`douyudm -i <roomId>`)
5. STT 协议 100% 测试覆盖率

**Why:** 原始 JS 代码无类型安全，无法在浏览器直接使用（依赖 Node 专有 API `ws`/`lowdb`/`fs`）。

**How to apply:** 新功能开发遵循此架构；发布 npm 包前运行 `pnpm run build`；核心协议层修改后必须保持 100% 覆盖率。

---

## 目录结构

```
src/
├── core/
│   ├── stt.ts          # STT 序列化/反序列化（纯逻辑，无环境依赖）
│   ├── packet.ts       # 二进制协议编解码（纯逻辑）
│   └── config.ts       # 常量（心跳间隔、提示文案等）
├── types/
│   └── index.ts        # 所有 TS 接口和类型定义
├── events/
│   └── messageEvent.ts # 30+ 消息类型默认处理器
├── utils/
│   └── noop-logger.ts  # ILogger 空实现（browser 用）
├── platform/
│   ├── node.ts         # 简单 re-export Client（Rollup CJS/ESM 入口）
│   └── browser.ts      # 简单 re-export Client（Rollup IIFE 入口）
├── cli/
│   ├── cmd.ts          # CLI 入口（commander v14），不含 shebang（由 rollup banner 注入）
│   └── logger.ts       # NodeLogger（lowdb + fs，仅 Node）
└── index.ts            # Client 核心类（环境无关）

__tests__/
├── stt.test.ts         # STT 完整测试（100% 覆盖）
└── packet.test.ts      # Packet 完整测试（100% 覆盖）

examples/
├── node/index.js       # Node.js CJS 示例
└── browser/index.html  # 浏览器单文件示例（React）
```

---

## 核心架构设计

### WebSocket 环境检测

**不能**用 `typeof WebSocket !== 'undefined'` 判断浏览器，因为 Node.js v21+ 内置了原生 WebSocket（undici），会误判。

正确方案：用 `process.versions?.node` 判断是否 Node.js 环境：

```typescript
function defaultWsFactory(url: string): IWebSocket {
  if (typeof process !== 'undefined' && process.versions?.node) {
    const WS = require('ws');  // Node.js 强制用 ws 包
    return new WS(url) as unknown as IWebSocket;
  }
  return new WebSocket(url) as unknown as IWebSocket;  // 浏览器用原生
}
```

**Why:** Node.js v21+ 原生 WebSocket（undici）的 `event.data` 是 `Blob`，不是 `Buffer`，会导致 `Packet.decode` 崩溃。

### 浏览器 Blob 处理

浏览器原生 WebSocket 的 `onmessage` 返回 `Blob`，需异步转换：

```typescript
this._ws.onmessage = (event) => {
  const data = event.data;
  if (data instanceof Blob) {
    data.arrayBuffer().then((buf) => this._messageHandle(buf));
  } else {
    this._messageHandle(data as ArrayBuffer);
  }
};
```

### Client 公共方法

```typescript
class Client implements IClient {
  readonly roomId: string | number;
  send(message: STTObject): void;
  close(): void;  // 发送 logout + 停止心跳 + 关闭 ws
  on(event: ClientEventName, cb: ClientEventHandler): this;
  on(event: MessageEventType, cb: MessageHandler): this;
  run(url?: string): void;
}
```

`close()` 必须显式调用才能真正断开，仅置空引用不会关闭 WebSocket。

---

## 事件回调 API 设计

### 系统事件（connect / disconnect / error）

```typescript
type ClientEventHandler = (client: IClient, err?: Error) => void;
```

第一个参数是 `IClient` 实例，支持箭头函数访问 `client.roomId`、`client.send()` 等。

### 消息事件（chatmsg / uenter 等）

```typescript
type MessageHandler = (r: STTObject, client?: IClient) => void;
```

第一个参数是消息数据，第二个参数 `client` 可选。

**Why:** 原设计用 `function(this: Client)` 绑定 `this`，箭头函数无法访问 `this.roomId`。改为显式参数后两种写法都支持。

### IClient 接口

```typescript
interface IClient {
  readonly roomId: string | number;
  send(message: STTObject): void;
  close(): void;
}
```

---

## Rollup 构建配置

### 4 个输出

```typescript
// rollup.config.ts
export default [
  // 1. CJS - Node.js require()
  { input: 'src/platform/node.ts', output: { file: 'dist/index.cjs.js', format: 'cjs' }, external: ['ws', 'lowdb', ...] },

  // 2. ESM - 现代打包器 / Node ESM
  { input: 'src/platform/node.ts', output: { file: 'dist/index.esm.js', format: 'esm' }, external: ['ws', 'lowdb', ...] },

  // 3. IIFE - 浏览器直接引用（压缩），全局变量名 douyudm（小写）
  { input: 'src/platform/browser.ts', output: { file: 'dist/douyudm.browser.min.js', format: 'iife', name: 'douyudm' }, plugins: [..., terser()] },

  // 4. CLI binary，shebang 由 banner 注入，cmd.ts 本身不写 shebang
  { input: 'src/cli/cmd.ts', output: { file: 'dist/cli/cmd.js', format: 'cjs', banner: '#!/usr/bin/env node' }, external: ['ws', 'lowdb', 'commander'] },
]
```

### 注意事项

- `ws` / `lowdb` 标记为 `external`，不打包进库，保留为运行时 `dependencies`
- `jest.config.js`（不是 `.ts`），避免引入 `ts-node` 依赖
- `cmd.ts` 不写 `#!/usr/bin/env node`，由 rollup `banner` 注入，否则双重 shebang 导致语法错误

---

## 测试策略

### Jest + ts-jest（替换原 Mocha）

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/core/stt.ts', 'src/core/packet.ts'],
  coverageThreshold: {
    global: { branches: 100, functions: 100, lines: 100, statements: 100 },
  },
};
```

### 已知协议 Quirk（有测试文档化）

`qausrespond` 和 `rri` 消息包含重复 key（两个 `rid` 字段）。JS 对象语义下后者覆盖前者，round-trip 无法还原原始报文。这是**服务端协议设计问题**，不是 STT 实现 bug。测试中显式断言此行为。

---

## CI/CD（GitHub Actions）

触发规则：push tag `v*.*.*`

```yaml
# .github/workflows/publish.yml
on:
  push:
    tags:
      - 'v*.*.*'
```

流程：
1. `pnpm/action-setup@v4` 安装 pnpm
2. 用 `jq` 从 tag 提取版本号写入 `package.json`，commit 回 master
3. `pnpm install --frozen-lockfile`
4. `pnpm run test:coverage`（必须 100% 通过）
5. `pnpm run build`
6. `npm publish --provenance`

**注意：**
- npm token 类型必须是 `Automation`，否则触发 OTP 验证失败（`EOTP` 错误）
- 用 `jq` 而非 `npm version`，避免版本号相同时报 `Version not changed` 错误
- CI 推回 master 时本地 master 需要 `git pull --rebase origin master` 才能继续推送

### 发布步骤

```bash
git tag v3.x.x
git push origin v3.x.x
```

---

## 依赖变更

| 操作 | 包 | 原因 |
|------|-----|------|
| 移除 | `fast-text-encoding` | Node 12+/现代浏览器原生支持 TextEncoder/TextDecoder |
| 移除 | `mocha` | 替换为 Jest |
| 移除 | `tslib` | 未配置 `importHelpers`，无需此包 |
| 升级 | `commander` → v14 | 使用 `program.opts()` 替代旧式访问 |
| 升级 | `ws` → v8 | 支持 DOM-style API (`onopen` 等) |
| 保留 | `lowdb` v1 | v2+ 改为 ESM-only + async，通过 ILogger 接口可后续单独替换 |
| 新增 (dev) | `typescript`, `rollup`, `jest`, `ts-jest`, `@rollup/plugin-*` | 构建和测试基础设施 |

---

## browser example 设计（examples/browser/index.html）

React 单文件（CDN 引入），功能：
- 输入房间号，连接/断开按钮（连接防抖 300ms）
- 消息过滤折叠面板，勾选后**立即生效**（用 `ignoredRef` 持有最新状态，不传给 Client）
- 过滤项和房间号持久化到 `localStorage`
- 消息列表置底，新消息追加到底部，自动滚动
- 订阅事件：`chatmsg` / `uenter` / `dgb`（赠送礼物）/ `spbc`（礼物广播）/ `error`
- 消息 key 用自增 id，避免 `Date.now()` 同毫秒重复

---

## 结果

- **58 个测试**，全部通过
- **100% 覆盖率**（STT + Packet：statements / branches / functions / lines）
- **4 个构建输出**，零警告
