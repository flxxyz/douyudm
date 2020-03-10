const websocket = require('./websocket')
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
        this.ignore = []
        this.clientEvent = {
            connect: {
                name: 'open',
                listener: event.open
            },
            disconnect: {
                name: 'close',
                listener: event.close
            },
            error: {
                name: 'error',
                listener: event.error
            },
        }
    }

    initSocket() {
        this.ws = new websocket(config.URL)
        this.ws.on('open', this.clientEvent.connect.listener.bind(this))
        this.ws.on('error', this.clientEvent.error.listener.bind(this))
        this.ws.on('close', this.clientEvent.disconnect.listener.bind(this))
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
            type: 'loginreq',
            roomid: this.roomId,
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
            this.send({
                type: 'mrkl'
            })
        }, config.HEARBEAT_INTERVAL * 1000)
    }

    logout() {
        this.send({
            type: 'logout',
        })

        clearInterval(this.heartbeatTask)
        this.ws.close()
    }

    run() {
        this.initSocket()
    }

    setIgnore(key, value) {
        if (stt.isType(key, 'object')) {
            for (let i in key) {
                if (key[i]) {
                    this.ignore.push(i)
                }
            }
        } else {
            if (value) {
                this.ignore.push(key)
            }
        }

        return this
    }

    on(method, callback) {
        let clientEventName = Object.keys(this.clientEvent).find(clientEvent => clientEvent === method.toLocaleLowerCase())
        if (clientEventName) {
            //在创建连接是触发connect事件时，发送登入，加入组，监听心跳消息
            if (clientEventName === 'connect') {
                let cb = callback
                callback = function (res) {
                    this.login()
                    this.joinGroup()
                    this.heartbeat()
                    cb.bind(this)(res)
                }
            } else if (clientEventName === 'disconnect') {
                let cb = callback
                callback = function (res) {
                    this.logout()
                    cb.bind(this)(res)
                }
            }
            this.clientEvent[method].listener = callback.bind(this)
        }

        let messageEventName = Object.keys(this.messageEvent).find(messageEvent => messageEvent === method.toLocaleLowerCase())
        if (messageEventName) {
            this.messageEvent[method] = callback.bind(this)
        }
    }
}

module.exports = Client