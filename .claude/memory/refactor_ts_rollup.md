---
name: TypeScript + Rollup 重构方案
description: douyudm v3.0.0 重构为 TypeScript + Rollup 的完整技术方案，包含架构设计、构建配置、测试策略
type: project
---

## 重构目标

将 douyudm 从 CommonJS JavaScript 重构为 TypeScript，用 Rollup 打包，支持：
1. Node.js CJS (`require`)
2. Node.js/bundler ESM (`import`)
3. 浏览器 IIFE (`window.DouyuDM`)
4. CLI 二进制 (`douyudm -i <roomId>`)
5. STT 协议 100% 测试覆盖率

**Why:** 原始 JS 代码无类型安全，无法在浏览器直接使用（依赖 Node 专有 API `ws`/`lowdb`/`fs`）。

**How to apply:** 新功能开发遵循此架构；发布 npm 包前运行 `npm run build`；核心协议层修改后必须保持 100% 覆盖率。

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
│   ├── node.ts         # NodeClient：注入 ws 作为 WebSocket 实现
│   └── browser.ts      # BrowserClient：注入 native WebSocket
├── cli/
│   ├── cmd.ts          # CLI 入口（commander v14）
│   └── logger.ts       # NodeLogger（lowdb + fs，仅 Node）
└── index.ts            # Client 核心类（环境无关）

__tests__/
├── stt.test.ts         # STT 完整测试（100% 覆盖）
└── packet.test.ts      # Packet 完整测试（100% 覆盖）
```

---

## 核心架构设计

### 环境隔离方案

`Client` 核心类对 WebSocket 实现和 Logger 完全无感知，通过构造函数注入：

```typescript
class Client {
  constructor(
    roomId: string | number,
    opts: ClientOptions = {},
    wsFactory?: WebSocketFactory,  // 注入 WebSocket 实现
    logger?: ILogger,              // 注入 Logger 实现
  )
}
```

| 环境 | WebSocketFactory | Logger |
|------|-----------------|--------|
| Node.js | `new WebSocket(url)` from `ws` | `NodeLogger`（lowdb） |
| Browser | `new WebSocket(url)` native | `NoOpLogger`（空实现） |

### 关键接口

```typescript
interface IWebSocket {
  send(data: ArrayBuffer | Uint8Array): void;
  close(): void;
  onopen: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onclose: ((event: unknown) => void) | null;
  onmessage: ((event: { data: ArrayBuffer | Buffer }) => void) | null;
}

interface ILogger {
  write(type: string, message: string): void;
  read?(type: string): unknown;
}
```

**WebSocket API 选择 DOM-style（`onopen` 而非 `.on('open')`）**，因为 `ws@8` 同时支持两种，而浏览器原生 WebSocket 只支持 DOM-style，统一后 `Client` 无需条件分支。

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

  // 3. IIFE - 浏览器直接引用（压缩）
  { input: 'src/platform/browser.ts', output: { file: 'dist/douyudm.browser.min.js', format: 'iife', name: 'DouyuDM' }, plugins: [..., terser()] },

  // 4. CLI binary
  { input: 'src/cli/cmd.ts', output: { file: 'dist/cli/cmd.js', format: 'cjs', banner: '#!/usr/bin/env node' }, external: ['ws', 'lowdb', 'commander'] },
]
```

`ws` / `lowdb` 标记为 `external`（不打包进库），保留为运行时 `dependencies`。

### 构建命令

```bash
npm run build
# 等价于：
rollup -c rollup.config.ts --configPlugin @rollup/plugin-typescript
```

注意：`tsconfig.rollup.json` 专供 rollup 配置文件编译（与 `tsconfig.json` 分离），避免 moduleResolution 冲突。

---

## package.json 关键字段

```json
{
  "main": "dist/index.cjs.js",
  "module": "dist/index.esm.js",
  "browser": "dist/douyudm.browser.min.js",
  "bin": { "douyudm": "dist/cli/cmd.js" },
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.cjs.js",
      "browser": "./dist/douyudm.browser.min.js"
    }
  },
  "files": ["dist", "README.md", "LICENSE"]
}
```

---

## 测试策略

### Jest + ts-jest（替换原 Mocha）

```typescript
// jest.config.ts
export default {
  preset: 'ts-jest',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/core/stt.ts', 'src/core/packet.ts'],
  coverageThreshold: {
    global: { branches: 100, functions: 100, lines: 100, statements: 100 },
  },
};
```

### STT 测试覆盖的分支

| 函数 | 分支 | 测试方式 |
|------|------|---------|
| `escape` | `@`→`@A`，`/`→`@S`，无特殊字符 | 单元测试 |
| `unescape` | `@S`→`/`，`@A`→`@`，无特殊字符 | 单元测试 |
| `serialize` | scalar、flat object、nested object、array、empty array | 单元测试 |
| `deserialize` | scalar、object（含`@=`）、array（含`//`）、empty value（`key@=/`） | 单元测试 |
| 全部 | 31 个真实协议消息 round-trip | fixture 测试 |

### 已知协议 Quirk（有测试文档化）

`qausrespond` 和 `rri` 消息包含重复 key（两个 `rid` 字段）。JS 对象语义下后者覆盖前者，round-trip 无法还原原始报文。这是**服务端协议设计问题**，不是 STT 实现 bug。测试中显式断言此行为。

---

## 依赖变更

| 操作 | 包 | 原因 |
|------|-----|------|
| 移除 | `fast-text-encoding` | `TextEncoder`/`TextDecoder` 在 Node 12+ 和现代浏览器原生可用，TS `lib: ["DOM"]` 已包含 |
| 升级 | `commander` → v14 | 使用 `program.opts()` 替代旧的 `program.id` 直接访问 |
| 升级 | `ws` → v8 | 支持 DOM-style API (`onopen` 等) |
| 保留 | `lowdb` v1 | v2+ 改为 ESM-only + async，升级成本高；通过 ILogger 接口可后续单独替换 |
| 新增 (dev) | `typescript`, `rollup`, `jest`, `ts-jest`, `@rollup/plugin-*` | 构建和测试基础设施 |

---

## 结果

- **58 个测试**，全部通过
- **100% 覆盖率**（STT + Packet：statements / branches / functions / lines）
- **4 个构建输出**，零警告
