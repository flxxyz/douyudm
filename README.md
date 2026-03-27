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

# 忽略指定事件
douyudm -i 9999 --ignore mrkl,uenter

# 查看所有选项
douyudm --help
```

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

## 选项

```typescript
new Client(roomId, opts?)
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `roomId` | `string \| number` | — | 房间号 |
| `opts.ignore` | `string[]` | `[]` | 忽略的消息事件列表 |

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
```

## 后话

坑太多了，github上的库大部分都是不能使用的，如果近期更新的可以判断使用的新接口，review了几乎所有相关的库，都是依据斗鱼自己官方平台的方法发起tcp连接？但根本连不上，一直拒绝...

看了下能使用的库，都是通过websocket建立的连接，立马修改，不出片刻撸完，发现发送数据的格式有点难搞，虽说示意图挺清楚的，但是用Buffer传输死活没有相应的消息，调试太磨人心性了，玛德，直接去把斗鱼网页上的方法扒下来。

通过webpack打包混淆代码乍一眼看去很混乱，其实仔细观察还是有规律寻找的。

文档中编码的几个固定参数均为数字，在webpack中数字的混淆我还没见过，按这个思路精准的找到这段代码。经过我十几分钟的理解，提取出二进制编解码逻辑，斗鱼自有的序列化、反序列化方法可以查看 [STT 协议](#stt-协议) 章节。

## License

MIT
