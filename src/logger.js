const util = require('./util')

const Logger = function () {
    this.dbname = 'unknown'
    this.db = null
    this.inited = false
}

Logger.prototype.init = function (dbname) {
    if (!this.inited) {
        this.dbname = dbname

        if (util.isBrowser()) {
            window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
            this._sql = indexedDB.open('danmaku', 1)
            this._sql.addEventListener('success', e => {
                console.log('连接数据库成功')
                this.db = event.target.result
            })

            this._sql.addEventListener('upgradeneeded', e => {
                this.db = event.target.result
                this.db.createObjectStore(this.dbname, {
                    keyPath: 'id',
                    autoIncrement: true
                })
            })

            this._sql.addEventListener('error', e => {
                console.log('连接数据库出错 Error:', e)
            })
        } else {
            this._fs = require('fs')
        }
        this.inited = true
    }
}

if (!util.isBrowser()) {
    Logger.prototype.echo = function (data) {
        this._fs.appendFile(
            this.dbname,
            JSON.stringify({
                t: new Date().getTime(),
                frame: data
            }) + '\n',
            function (err) {
                if (err) {
                    console.error('日志保存出错, Error:', err)
                }
            })
    }

    Logger.prototype.all = function () {
        return new Promise((resolve, reject) => {
            this._fs.readFile(this.dbname, 'utf8', function (err, str) {
                if (err) {
                    reject(err)
                } else {
                    resolve(str)
                }
            })
        })
    }

    Logger.prototype.len = function () {
        return new Promise(async (resolve, reject) => {
            const content = await this.all()
            resolve(content.split('\n').filter(v => v !== '').length)
        })
    }

    Logger.prototype.export = function () {
        return this._fs.readFileSync(this.dbname, 'utf8')
    }

    Logger.prototype.clear = function () {

    }
} else {
    Logger.prototype.echo = function (data) {
        if (this.db !== null) {
            const tx = this.db.transaction(this.dbname, 'readwrite')
            const store = tx.objectStore(this.dbname)
            store.add({
                t: new Date().getTime(),
                frame: data
            })
        }
    }

    Logger.prototype.all = function () {
        if (this.db !== null) {
            const tx = this.db.transaction(this.dbname, 'readonly')
            const store = tx.objectStore(this.dbname)
            return new Promise(function (resolve, reject) {
                const req = store.getAll()
                req.addEventListener('success', function (e) {
                    resolve(req.result)
                })
                req.addEventListener('error', function (e) {
                    reject(false)
                })
            })
        }

    }

    Logger.prototype.len = function () {
        if (this.db !== null) {
            const tx = this.db.transaction(this.dbname, 'readonly')
            const store = tx.objectStore(this.dbname)
            return new Promise(function (resolve, reject) {
                const req = store.count()
                req.addEventListener('success', function (e) {
                    resolve(req.result)
                })
                req.addEventListener('error', function (e) {
                    reject(false)
                })
            })
        }

    }

    Logger.prototype.export = async function () {
        if (this.db !== null) {
            const r = await this.all()
            let text = ''
            r.forEach((value, index) => {
                text += `${JSON.stringify({
                t: value.t,
                frame: value.frame,
            })}\n`
            })
            util.download(this.dbname, text)
            return text
        }

    }

    Logger.prototype.clear = function () {
        if (this.db !== null) {
            const tx = this.db.transaction(this.dbname, 'readwrite')
            const store = tx.objectStore(this.dbname)
            store.clear()
        }
    }
}

module.exports = new Logger()