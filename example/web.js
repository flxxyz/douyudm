const http = require('http')
const path = require('path')
const douyu = require('douyudm')
const websocket = require('ws')
const express = require('express')
const app = express()

process.env.HOST = '0.0.0.0'
process.env.PORT = 8080

app.get('/ping', (req, res) => {
    res.status(200).send('pong')
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/web.html'))
})

const server = http.createServer(app)
const wss = new websocket.Server({
    noServer: true
})

server.on('upgrade', (req, socket, headers) => {
    wss.handleUpgrade(req, socket, headers, ws => {
        wss.emit('connection', ws, req)
    })
})

wss.on('connection', (ws, req) => {
    ws.isConn = false

    ws.on('message', function (data) {
        data = eval(`(${data})`)

        switch (data.type) {
            case 'connect':
                if (!this.isConn) {
                    this.isConn = true
                    this.room = newRoom.bind(this)(data.roomId)
                    this.send(`连接成功 roomId=${this.room.roomId}`)
                }
                break
            case 'exit':
                if (this.isConn) {
                    this.send(`断开连接 roomId=${this.room.roomId}`)
                    this.room.logout()
                    this.isConn = false
                }
                break
        }
    })
    ws.on('close', function (code, reason) {
        this.room.logout()
    })
    ws.on('error', function (err) {})
})

server.listen(process.env.PORT, process.env.HOST, _ => {
    console.log(`${new Date().toLocaleString()} Server is listening on ${process.env.HOST}:${process.env.PORT}`)
})

function newRoom(roomId) {
    const ws = this
    const room = new douyu(roomId)
    room.on('connect', function () {
        console.log('[connect] roomId=%s', this.roomId)
    })
    room.on('disconnect', function () {
        console.log('[disconnect] roomId=%s', this.roomId)
    })
    room.on('error', function (err) {
        console.log('[error] roomId=%s', this.roomId)
    })
    room.on('chatmsg', function (res) {
        console.log('[chatmsg]', `<lv ${res.level}> [${res.nn}] ${res.txt}`)
        ws.send(`[chatmsg] <lv ${res.level}> [${res.nn}] ${res.txt}`)
    })
    room.on('loginres', function (res) {
        console.log('[loginres]', '登录成功')
        ws.send('[loginres] 登录成功')
    })
    room.on('uenter', function (res) {
        console.log('[uenter]', `${res.nn}进入房间`)
        ws.send(`[uenter] ${res.nn}进入房间`)
    })
    room.on('dgb', function (res) {
        //斗鱼的礼物过多无法全部记录，20000以后可以判断为鱼翅购买，其他为系统赠送
        const gifts = {
            20000: '鱼丸',
            20001: '弱鸡',
            20002: '办卡',
            20003: '飞机',
            20004: '火箭',
            20005: '超级火箭',
            20006: '赞',
            20008: '超大丸星',
            20234: '爱心飞机',
            20387: '心动火箭',
            20417: '福袋',
            20541: '大气',
            20542: '666',
            20618: '魔法戒指',
            20624: '魔法彩蛋',
            20642: '能量电池',
            20643: '能量水晶',
            20644: '能量戒指',
            20710: '金鲨鱼',
            20725: '宠爱卡',
            20726: '挚爱超火',
            20727: '乖乖戴口罩',
            20728: '勤洗手',
            192: '赞(系统)',
            193: '弱鸡(系统)',
            519: '呵呵(系统)',
            520: '稳(系统)',
            712: '棒棒哒(系统)',
            714: '怂(系统)',
            824: '应援棒(系统)',
        }
        const gift = gifts[res.gfid] || '其他礼物'
        console.log('[dgb]', `感谢${res.nn}送出${gift}`, `礼物id=${res.gfid}`)
        ws.send(`[dgb] 感谢${res.nn}送出${gift}  礼物id=${res.gfid}`)
    })
    room.run()

    return room
}