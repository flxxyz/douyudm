const { Client } = require('douyudm')

const client = new Client(102965)

client.on('connect', (client) => console.log(`[connect] 已连接到房间 ${client.roomId}`))
client.on('disconnect', (client) => console.log(`[disconnect] 已断开房间 ${client.roomId}`))
client.on('error', (client, err) => console.error(`[error] 房间 ${client.roomId}`, err))

client.on('chatmsg', (res) => console.log(`<lv ${res.level}> [${res.nn}]: ${res.txt}`))
client.on('uenter', (res) => console.log(`${res.nn} 进入了房间`))
client.on('dgb', (res) => console.log(`${res.nn} 赠送了 ${res.gfn}`))

client.run()
