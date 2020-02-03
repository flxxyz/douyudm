const cluster = require('cluster')

function open() {
    console.log('弹幕服务器连接成功……')
    this.login()
    this.joinGroup()
    this.heartbeat()
}

function error(err) {
    console.log('error() event', err)
}

function close() {
    console.log('close() event', this.roomId)
    clearInterval(this.heartbeatTask)
    this.logout()
}

async function message(data) {
    let r = await this.getMessage(data)
    // console.log('message() event', r)
    if (Object.keys(this.messageEvent).includes(r.type)) {
        this.messageEvent[r.type](r)
    }
}

module.exports = {
    open,
    error,
    close,
    message,
}