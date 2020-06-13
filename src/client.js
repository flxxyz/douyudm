const config = require('./config')
const event = require('./clientEvent')
const stt = require('./stt')
const util = require('./util')
const bufferCoder = require('./bufferCoder')
const messageEvent = require('./messageEvent')
const logger = require('./logger')

class Client {
    constructor(roomId, opts) {
        this.roomId = roomId
        this.ws = null
        this.heartbeatTask = null
        this.messageEvent = messageEvent
        this.ignore = []
        this.options = this.setOptions(opts || {})
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

    initSocket(ws) {
        this.ws = new ws(config.URL)
        this.ws.on('open', this.clientEvent.connect.listener.bind(this))
        this.ws.on('error', this.clientEvent.error.listener.bind(this))
        this.ws.on('close', this.clientEvent.disconnect.listener.bind(this))
        this.ws.on('message', event.message.bind(this))
    }

    send(message) {
        this.ws.send(bufferCoder.encode(stt.serialize(message)))
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

    run(websocket) {
        let ws = websocket || require('./websocket')
        this.initSocket(ws)
    }

    setIgnore(key, value) {
        if (util.isObject(key)) {
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

    setOptions(opts) {
        const defOpts = {
            debug: false,
            logfile: `${this.roomId}.log`,
        }
        const options = {}

        if (!util.isObject(opts)) {
            return defOpts
        }

        if (opts.hasOwnProperty('debug') && util.isBoolean(opts.debug)) {
            options.debug = opts.debug
        }

        if (opts.hasOwnProperty('logfile') && util.isString(opts.logfile)) {
            options.logfile = opts.logfile
        }

        return Object.assign(defOpts, options)
    }

    messageHandle(m) {
        bufferCoder.decode(m, (e) => {
            const r = stt.deserialize(e)
            console.log('[message]', e)

            if (Object.keys(this.messageEvent).filter(v => {
                    return !this.ignore.includes(v)
                }).includes(r.type)) {
                this.messageEvent[r.type](r)
            }

            if (this.options.debug) {
                const dbname = util.isBrowser() ? this.roomId : this.options.logfile
                logger.init(dbname)
                logger.echo(r)
            }
        })
    }

    on(method, callback) {
        const clientEventName = Object.keys(this.clientEvent).find(clientEvent => clientEvent === method.toLocaleLowerCase())
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

        const messageEventName = Object.keys(this.messageEvent).find(messageEvent => messageEvent === method.toLocaleLowerCase())
        if (messageEventName) {
            this.messageEvent[method] = callback.bind(this)
        }
    }
}

module.exports = Client