const WebSocket = require('ws')
const config = require('./config')
const event = require('./clientEvent')
const stt = require('./stt')
const bufferCoder = require('./bufferCoder')
const messageEvent = require('./messageEvent')

class Client {
    constructor(roomId) {
        this.roomId = roomId
        this.ws = null
        this.heartbeatTask = null
        this.messageEvent = messageEvent
    }

    initSocket() {
        this.ws = new WebSocket(config.URL)
        this.ws.on('open', event.open.bind(this))
        this.ws.on('error', event.error.bind(this))
        this.ws.on('close', event.close.bind(this))
        this.ws.on('message', event.message.bind(this))
    }

    send(message) {
        this.ws.send(bufferCoder.encode(stt.serialize(message)))
    }

    getMessage(data) {
        return new Promise((resolve, reject) => {
            bufferCoder.decode(data, (e) => {
                resolve(stt.deserialize(e))
            })
        })
    }

    login() {
        this.send({
            'type': 'loginreq',
            'roomid': this.roomId,
        })
    }

    joinGroup() {
        this.send({
            type: 'joingroup',
            rid: this.roomId,
            gid: 0
        })
    }

    heartbeat() {
        this.heartbeatTask = setInterval(() => {
            // console.log('----------------{{{ ♥ }}}----------------')
            this.send({
                type: 'mrkl'
            })
        }, config.HEARBEAT_INTERVAL * 1000)
    }

    logout() {
        this.send({
            type: 'logout',
        })
    }

    run() {
        this.initSocket()
    }
}

module.exports = Client