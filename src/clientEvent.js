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
    let r = await this.getMessage(data)

    if (Object.keys(this.messageEvent).filter(v => {
            return !this.ignore.includes(v)
        }).includes(r.type)) {
        this.messageEvent[r.type](r)
    }
}

module.exports = {
    open,
    error,
    close,
    message,
}