const util = require('./util')

const Logger = function () {
    this.name = 'unknown'
    this.db = null
    this.inited = false
}

Logger.prototype.init = function (name) {
    if (!this.inited) {
        this.name = name

        if (util.isBrowser()) {
            window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
            this._sql = indexedDB.open('danmaku', 2)
            this._sql.addEventListener('success', e => {
                console.log('连接数据库成功')
                this.db = event.target.result
            })

            this._sql.addEventListener('upgradeneeded', e => {
                this.db = event.target.result
                this.db.createObjectStore('douyu', {
                    keyPath: 'id',
                    autoIncrement: true
                })
                this.db.createIndex('roomId', 'roomId', {
                    unique: false
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
            this.name,
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
            this._fs.readFile(this.name, 'utf8', function (err, str) {
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
        return this._fs.readFileSync(this.name, 'utf8')
    }

    Logger.prototype.clear = function () {
        try {
            return this._fs.writeFileSync(this.name, '', 'utf8')
        } catch (err) {
            return false
        }
    }
} else {
    Logger.prototype.echo = function (data) {
        if (this.db !== null) {
            const tx = this.db.transaction('douyu', 'readwrite')
            const store = tx.objectStore('douyu')
            store.add({
                roomId: this.name,
                timestamp: new Date().getTime(),
                frame: data
            })
        }
    }

    Logger.prototype.all = function () {
        if (this.db !== null) {
            const tx = this.db.transaction('douyu', 'readonly')
            const store = tx.objectStore('douyu')
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

    Logger.prototype._index = function (roomId) {
        if (this.db !== null) {
            const tx = this.db.transaction('douyu', 'readonly')
            const store = tx.objectStore('douyu')
            const req = store.index('roomId').get(roomId)
            return new Promise(function (resolve, reject) {
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
            const tx = this.db.transaction('douyu', 'readonly')
            const store = tx.objectStore('douyu')
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
            const r = await (roomId ? this._index(roomId) : this.all())
            const text = r.reduce((arr, row) => {
                const v = {
                    timestamp: row.timestamp,
                    frame: row.frame,
                }
                if (!roomId) v.roomId = this.name
                arr.push(JSON.stringify(v))
                return arr
            }, [])
            util.download(this.name, text.join('\n'))
            return text
        }

    }

    Logger.prototype.clear = function () {
        if (this.db !== null) {
            const tx = this.db.transaction('douyu', 'readwrite')
            const store = tx.objectStore('douyu')
            store.clear()
        }
    }
}

module.exports = new Logger()