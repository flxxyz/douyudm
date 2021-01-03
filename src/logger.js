const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const LocalStorage = require('lowdb/adapters/LocalStorage');

class Logger {
    constructor(roomId) {
        let adapter = null;
        if (typeof MessageEvent !== 'undefined') {
            adapter = this._browser(roomId);
        } else {
            adapter = this._nodejs(roomId);
        }
        this._init(adapter);
    }

    _browser(roomId) {
        this.dbname = `db-${roomId}`;
        return new LocalStorage(this.dbname);
    }

    _nodejs(roomId) {
        this.dbname = `${roomId}.json`;
        return new FileSync(this.dbname);
    }

    _init = (adapter) => {
        this.db = low(adapter);
        this._struct = {};
    }

    write(type, message) {
        if (!this.db.has(type).value()) {
            this._struct[type] = [];
            this.db.defaults(this._struct).write();
        }
        this.db.get(type).push({ timestamp: new Date().valueOf(), message }).write();
    }

    read = (type) => {
        return this.db.get(type).value();
    }
}

module.exports = Logger;