const util = require('./util')

const Logger = function (dbname) {
    this.dbname = dbname
    this.db = null

    if (util.isBrowser()) {
        window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
        const sql = indexedDB.open('danmaku', 1)
        sql.addEventListener('success', e => {
            console.log('连接数据库成功')
            this.db = event.target.result
        })

        sql.addEventListener('upgradeneeded', e => {
            this.db = event.target.result
            this.db.createObjectStore(this.dbname, {
                keyPath: 'id',
                autoIncrement: true
            })
        })

        sql.addEventListener('error', e => {
            console.log('连接数据库出错 Error:', e)
        })
    }
}

if (!util.isBrowser()) {
    const fs = require('fs')

    Logger.prototype.echo = function (data) {
        fs.appendFile(
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
            fs.readFile(this.dbname, 'utf8', function (err, str) {
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
        return fs.readFileSync(this.dbname, 'utf8')
    }
} else {
    Logger.prototype.echo = function (data) {
        const tx = this.db.transaction(this.dbname, 'readwrite')
        const store = tx.objectStore(this.dbname)
        store.add({
            t: new Date().getTime(),
            frame: data
        })
    }

    Logger.prototype.all = function () {
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

    Logger.prototype.len = function () {
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

    Logger.prototype.export = async function () {
        const r = await this.all()
        let text = ''
        r.forEach((value, index) => {
            text += `${JSON.stringify({
                t: value.t,
                frame: value.frame,
            })}\n`
        })
        download(this.dbname, text)
        return text
    }
}

module.exports = Logger