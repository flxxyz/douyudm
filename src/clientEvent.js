module.exports = {
    connect: function () {
        this.login(); //登入
        this.joinGroup(); //加入组
        this.heartbeat(); //发送心跳，强制45秒
    },
    error: function (err) {
        console.error(err);
    },
    disconnect: function () {
        this.logout();
    },
}