---
name: douyudm 项目概览
description: douyudm 项目的核心架构、功能和技术栈概述
type: project
---

douyudm 是一个 Node.js npm 包，用于**实时获取斗鱼直播平台弹幕**，支持 CLI 和编程方式使用。

**Why:** 通过 WebSocket 连接斗鱼弹幕代理服务器（`wss://danmuproxy.douyu.com:850x/`），监听直播房间的弹幕及互动事件。

**How to apply:** 了解这是一个弹幕客户端库，核心是 WebSocket 通信 + 自定义协议的序列化/反序列化。

## 技术栈
- Node.js，CommonJS 模块
- `ws` — WebSocket 客户端
- `commander` — CLI 参数解析
- `lowdb` — 本地 JSON 数据库（用于 debug 日志）
- `fast-text-encoding` — TextEncoder/TextDecoder polyfill
- 测试：mocha

## 核心模块

| 文件 | 职责 |
|------|------|
| `src/index.js` | 入口，导出 Client，挂载 STT/Packet/Logger |
| `src/client.js` | WebSocket 客户端主类，管理连接/登录/心跳/消息分发 |
| `src/packet.js` | 二进制协议编解码（自定义 12 字节 header，typeCode=689） |
| `src/stt.js` | STT 序列化/反序列化（斗鱼自定义文本协议，`@=` `@S` `@A` 转义） |
| `src/messageEvent.js` | 消息事件处理器映射（chatmsg/uenter/spbc/dgb 等 30+ 事件） |
| `src/clientEvent.js` | WebSocket 生命周期事件（connect/error/disconnect） |
| `src/logger.js` | debug 模式日志，写入本地文件 |
| `src/cmd.js` | CLI 入口，`douyudm -i <roomId>` |
| `src/config.js` | 配置常量（心跳间隔 45s 等） |

## 协议细节
- **Packet**：自定义二进制协议，header 12 字节（4B 消息长度 x2 + 2B typeCode 固定 689 + 2B 加密/占位）
- **STT**：斗鱼专用文本序列化，`key@=value/` 格式，`@S`=`/`，`@A`=`@`，支持嵌套对象和数组

## 主要消息类型
- `loginres` — 登录响应
- `chatmsg` — 弹幕消息（核心）
- `uenter` — 用户进入直播间
- `spbc` — 礼物广播
- `dgb` — 赠送礼物
- `onlinegift` — 领取鱼丸
- `rss` — 开播/关播提醒
- `mrkl` — 心跳包

## 使用方式
```bash
# CLI
douyudm -i 123456

# 编程接口
const client = require('douyudm');
const c = new client(roomId);
c.on('chatmsg', (r) => console.log(r.nn, r.txt));
c.run();
```

## 版本
v2.1.1，作者 flxxyz，MIT 协议
