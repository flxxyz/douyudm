const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

class Logger {
    constructor(roomId) {
        this.dbname = `${roomId}.json`;
        this._init();
    }

    _init = () => {
        const adapter = new FileSync(this.dbname);
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