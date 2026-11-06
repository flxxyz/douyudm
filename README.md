# douyudm

基于 WebSocket 实时获取斗鱼弹幕，支持 Node.js 与浏览器。

<a href="https://npmcharts.com/compare/douyudm?minimal=true"><img src="https://img.shields.io/npm/dm/douyudm.svg?sanitize=true" alt="Downloads" /></a>
<a href="https://www.npmjs.com/package/douyudm"><img src="https://img.shields.io/npm/v/douyudm.svg?sanitize=true" alt="Version" /></a>
<a href="https://www.npmjs.com/package/douyudm"><img src="https://img.shields.io/npm/l/douyudm.svg?sanitize=true" alt="License" /></a>

## 安装

**作为库使用**

```shell
# npm
npm i douyudm

# pnpm
pnpm add douyudm
```

**全局 CLI 工具**

```shell
# npm
npm i -g douyudm

# pnpm
pnpm add -g douyudm
```

## CLI 使用

```shell
# 监听房间弹幕
douyudm -i 9999

# 已知真实 rid，跳过靓号查询（不发起额外 HTTP 请求）
douyudm -i 6979222 --no-resolve-room-id

# 忽略指定事件
douyudm -i 9999 --ignore mrkl,uenter

# 查看所有选项
douyudm --help
```

### 录制与 ASS 字幕导出

```shell
# 边看边录制为 JSONL（默认只录 chatmsg，Ctrl+C 停止）
douyudm -i 9999 --record live.jsonl

# 追加录制其他事件
douyudm -i 9999 --record live.jsonl --record-events chatmsg,uenter,gdp

# 转换为 ASS 字幕（配合录播视频加载）
douyudm convert live.jsonl -o live.ass

# 裁剪时间段 + 整体延迟（对齐视频）
douyudm convert live.jsonl --from 10:00 --to 1:30:00 --delay=-2.5

# 过滤：正则剔除弹幕/用户（可重复，支持 /pattern/flags）
douyudm convert live.jsonl --filter '/666+/' --filter-user '^bot'

# 可编程过滤（如接大模型批量判定），脚本 default export 二选一：
#   (msg) => boolean | Promise<boolean>          逐条，true 保留
#   { batch: async (msgs) => msgs的保留子集 }     批量
douyudm convert live.jsonl --filter-script ./my-filter.mjs

# 画布/样式调整
douyudm convert live.jsonl --width 1280 --height 720 --fontsize 36 --duration 8 --opacity 0.6
```

录制文件为 JSONL 格式：第一行记录房间号和开始时刻，之后每行一条消息（收到时刻 `ts` + 消息原始字段）。文件只追加不改写，中途崩溃最多丢正在写的一行。过滤只在 convert 时生效，原始录制文件不会被改动，可以反复用不同条件重新导出。过滤脚本示例见 [examples/filter-scripts/](examples/filter-scripts/)。

录制/转换在浏览器里同样可用（解析、过滤、排版、渲染都是纯逻辑，已打进浏览器构建）：[examples/browser/](examples/browser/) 的页面支持连接时录制（写入浏览器本地数据库，刷新不丢）、下载 `.jsonl`、本地转换出 `.ass`。

## API 使用

### Node.js

```javascript
// CJS
const { Client } = require('douyudm')

const client = new Client(9999)

client.on('connect', (client) => console.log(`[connect] roomId=${client.roomId}`))
client.on('disconnect', (client) => console.log(`[disconnect] roomId=${client.roomId}`))
client.on('error', (client, err) => console.error(`[error] roomId=${client.roomId}`, err))

client.on('chatmsg', (res) => console.log(`<lv ${res.level}> [${res.nn}] ${res.txt}`))
client.on('uenter', (res) => console.log(`${res.nn} 进入房间`))

client.run()
```

```typescript
// ESM / TypeScript
import { Client } from 'douyudm'

const client = new Client(9999, { ignore: ['mrkl'] })
client.on('chatmsg', (res) => console.log(`[${res.nn}] ${res.txt}`))
client.run()
```

### 浏览器

```html
<script src="https://unpkg.com/douyudm/dist/douyudm.browser.min.js"></script>
<script>
  const client = new douyudm.Client(9999)
  client.on('chatmsg', (res) => console.log(res.nn, res.txt))
  client.run()
</script>
```

完整示例见 [examples/](examples/) 目录。

### 靓号与真实房间号

Node.js 下 `Client` 和 CLI 默认会在连接前把靓号转换为真实 rid。例如 `6657`
对应的实际房间为 `6979222`，仅使用靓号登录可能收到 `loginres` 却收不到 `chatmsg`。
现有的 `new Client(6657); client.run()` 用法无需修改。

连接前请求一次 `https://m.douyu.com/<roomId>`，从房间元数据读取真实 rid，超时为 10 秒。
端口重试直接复用本次查询结果，不重复请求；不缓存跨连接的房间映射。
解析失败通过 `error` 事件报告，不继续登录未经确认的房间。

已知真实 rid 时可跳过查询：`new Client(6979222, { resolveRoomId: false })`；
CLI 对应 `--no-resolve-room-id`。`client.roomId` 在解析成功后变为真实 rid，
CLI 录制文件头也使用真实 rid。

浏览器受跨域限制，默认不查询移动页，请传入真实 rid。
`run(customUrl)` 默认也跳过查询，可显式设置 `resolveRoomId: true` 启用。
调用 `close()` 或再次 `run()` 会取消旧查询并忽略迟到的结果。

## 选项

```typescript
new Client(roomId, opts?)
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `roomId` | `string \| number` | — | 房间号 |
| `opts.ignore` | `string[]` | `[]` | 忽略的消息事件列表 |
| `opts.retries` | `number` | `5` | 连接建立前失败的最大重试次数（自动轮换 6 个弹幕端口），`0` 关闭 |
| `opts.retryDelay` | `number` | `1000` | 相邻两次连接尝试的间隔（ms） |
| `opts.resolveRoomId` | `boolean` | Node.js 为 `true` | 连接前解析靓号；浏览器及自定义 URL 默认关闭 |

斗鱼的 6 个弹幕端口在部分网络下不是每个都能连上。连接建立**之前**失败时会自动换一个端口重试，重试过程中不触发 `error` 事件，次数全部用完还连不上才触发。连接建立**之后**的断开不会自动重连。

## 事件列表

### 系统事件

回调签名：`(client: Client, err?: Error) => void`

| 事件 | 描述 |
|:----:|:----:|
| `connect` | 连接成功 |
| `disconnect` | 连接断开 |
| `error` | 连接错误 |

```javascript
client.on('connect', (client) => console.log(`[connect] roomId=${client.roomId}`))
client.on('error', (client, err) => console.error(`[error] roomId=${client.roomId}`, err))
```

### 消息事件

回调签名：`(res: STTObject, client?: Client) => void`

第二个参数 `client` 为可选，需要访问实例时才传入。

| 事件 | 描述 |
|:----:|:----:|
| `loginres` | 登录响应 |
| `chatmsg` | 弹幕消息 |
| `uenter` | 用户进入房间 |
| `upgrade` | 用户等级提升 |
| `rss` | 房间开播/关播提醒 |
| `bc_buy_deserve` | 赠送酬勤通知 |
| `ssd` | 超级弹幕 |
| `spbc` | 全站礼物广播（大额礼物，不限本房间）|
| `dgb` | 赠送礼物（原始事件）|
| `gdp` | 本房间礼物事件（xx 赠送礼物 xN）|
| `onlinegift` | 领取在线鱼丸 |
| `ggbb` | 房间用户抢红包 |
| `rankup` | 房间 Top10 变化 |
| `ranklist` | 广播排行榜 |
| `mrkl` | 心跳 |
| `blab` | 粉丝等级升级 |
| `frank` | 粉丝排行榜变化 |
| `anbc` | 全站礼物广播 |
| `cthn` | 跨房间弹幕 |
| `configscreen` | 全屏广播 |
| `nlkstatus` | 大乱斗状态 |
| `tsgs` | 宝箱礼物 |
| `tsboxb` | 宝箱广播 |
| `ro_game_succ` | 游戏成功 |
| `pandoraboxinfo` | 潘多拉盒子 |
| `lucky_wheel_star_pool` | 幸运转盘 |
| `noble_num_info` | 贵族数量 |
| `synexp` | 经验同步 |
| `wirt` | 直播间互动 |
| `rnewbc` | 新广播 |

```javascript
// 只用消息数据
client.on('chatmsg', (res) => console.log(`[${res.nn}] ${res.txt}`))

// 同时访问 Client 实例
client.on('chatmsg', (res, client) => console.log(`roomId=${client.roomId} [${res.nn}] ${res.txt}`))
```

## STT 协议

斗鱼自定义序列化格式，规则如下：

- 键值对使用 `@=` 分隔：`key@=value`
- 字段使用 `/` 分隔
- `@` 转义为 `@A`，`/` 转义为 `@S`

```typescript
import { STT } from 'douyudm'

// 序列化
STT.serialize({ type: 'mrkl' })  // => 'type@=mrkl/'

// 反序列化
STT.deserialize('type@=chatmsg/nn@=用户/txt@=hello/')
// => { type: 'chatmsg', nn: '用户', txt: 'hello' }
```

## 开发

```shell
# 构建
npm run build

# 测试（含覆盖率）
npm run test:coverage

# 构建后验证 CJS、原生 ESM、CLI 和 TypeScript 包入口（使用本地 WebSocket 服务）
npm run test:entrypoints

# 真实浏览器端到端测试（需公网及正在产生弹幕的真实 rid）
pnpm exec playwright install chromium
DOUYUDM_TEST_ROOM=138243 npm run test:browser
# 已安装系统 Chromium 时可省略下载，设置 CHROMIUM_PATH=/usr/bin/chromium
```

浏览器测试使用当前分支构建替换示例页中的 douyudm CDN 脚本，其他 CDN 资源仍正常加载并校验完整性。
它验证真实 WebSocket 弹幕、IndexedDB 录制、刷新保留、JSONL 下载、ASS 转换、历史删除，
以及环境允许时直接打开 HTML 文件的页面加载和转换（管理员策略禁止 `file://` 时单独报告跳过）。
该测试需要先安装 Chromium；
`DOUYUDM_TEST_ROOM` 应为当前活跃房间的真实 rid，房间无弹幕时会报告超时，不算通过。
Playwright 仅用于开发测试，不增加运行时依赖。

## 后话

坑太多了，github上的库大部分都是不能使用的，如果近期更新的可以判断使用的新接口，review了几乎所有相关的库，都是依据斗鱼自己官方平台的方法发起tcp连接？但根本连不上，一直拒绝...

看了下能使用的库，都是通过websocket建立的连接，立马修改，不出片刻撸完，发现发送数据的格式有点难搞，虽说示意图挺清楚的，但是用Buffer传输死活没有相应的消息，调试太磨人心性了，玛德，直接去把斗鱼网页上的方法扒下来。

通过webpack打包混淆代码乍一眼看去很混乱，其实仔细观察还是有规律寻找的。

文档中编码的几个固定参数均为数字，在webpack中数字的混淆我还没见过，按这个思路精准的找到这段代码。经过我十几分钟的理解，提取出二进制编解码逻辑，斗鱼自有的序列化、反序列化方法可以查看 [STT 协议](#stt-协议) 章节。

## License

MIT
