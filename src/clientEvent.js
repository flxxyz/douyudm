const bufferCoder = require('./bufferCoder')
const util = require('./util')
if (!util.isBrowser()) {
    const fs = require('fs')
}

function open() {
    this.login() //登入
    this.joinGroup() //加入组
    this.heartbeat() //发送心跳，强制45秒
}

function error(err) {
    console.error(err)
}

function close() {
    this.logout()
}

async function message(data) {
    let m = data
    if (typeof MessageEvent !== 'undefined') {
        //无MessageEvent类型判断为node环境，转换数据为arraybuffer类型
        m = await bufferCoder.blob2ab(data.data)
    }
    let r = await this.getMessage(m)

    if (Object.keys(this.messageEvent).filter(v => {
            return !this.ignore.includes(v)
        }).includes(r.type)) {
        this.messageEvent[r.type](r)
    }

    if (this.options.debug) {
        if (!util.isBrowser()) {
            fs.appendFile(
            this.options.logfile,
            JSON.stringify({t: new Date().getTime(), frame: r}) + '\n',
            function (err) {
                if (err) {
                    console.error('Error:', err)
                }
            })
        }
    }
}

module.exports = {
    open,
    error,
    close,
    message,
}