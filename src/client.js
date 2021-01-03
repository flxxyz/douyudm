const WebSocket = require('ws');
const config = require('./config');
const clientEvent = require('./clientEvent');
const messageEvent = require('./messageEvent');
const STT = require('./stt');
const Packet = require('./packet');
const Logger = require('./logger');

class Client {
    static initOpts = {
        debug: false,
        ignore: [],
    };

    constructor(roomId, opts = Client.initOpts) {
        this.roomId = roomId;
        this._ws = null;
        this._heartbeatTask = null;
        this.clientEvent = clientEvent;
        this.messageEvent = messageEvent;

        this.logger = new Logger(this.roomId);
        this.debug = opts.debug;
        this.ignore = opts.ignore;
    }

    _initSocket = url => {
        this._ws = new WebSocket(url);
        this._ws.on('open', this.clientEvent.connect.bind(this));
        this._ws.on('error', this.clientEvent.error.bind(this));
        this._ws.on('close', this.clientEvent.disconnect.bind(this));
        this._ws.on('message', this.messageHandle.bind(this));
    }

    send(message) {
        this._ws.send(Packet.Encode(STT.serialize(message)));
    }

    login = () => {
        this.send({
            type: 'loginreq',
            roomid: this.roomId,
        });
    }

    joinGroup = () => {
        this.send({
            type: 'joingroup',
            rid: this.roomId,
            gid: -9999,
        });
    }

    heartbeat = () => {
        const delay = config.HEARBEAT_INTERVAL * 1000;
        this._heartbeatTask = setInterval(() => this.send({ type: 'mrkl' }), delay);
    }

    logout = () => {
        this.send({ type: 'logout' });
        clearInterval(this._heartbeatTask);
    }

    run = url => {
        //目前已知的弹幕服务器
        const port = 8500 + ((min, max) => Math.floor(Math.random() * (max - min + 1) + min))(1, 6);
        this._initSocket(url || `wss://danmuproxy.douyu.com:${port}/`);
    }

    messageHandle(data) {
        Packet.Decode(data, m => {
            const r = STT.deserialize(m);

            if (this.debug) {
                this.logger.write(r.type, m);
            }

            const isExist = Object.keys(this.messageEvent)
                .filter(eventName => !this.ignore.includes(eventName))
                .includes(r.type);
            if (isExist) {
                this.messageEvent[r.type](r);
            }
        });
    }

    on(method, callback) {
        method = method.toLocaleLowerCase();

        if (this.clientEvent.hasOwnProperty(method)) {
            const clientEvent = this.clientEvent[method];
            const listener = callback;
            callback = function (e) {
                if (['connect', 'disconnect'].includes(method)) {
                    clientEvent.bind(this)();
                }
                listener.bind(this)(e);
            }

            this.clientEvent[method] = callback;
        }

        if (this.messageEvent.hasOwnProperty(method)) {
            this.messageEvent[method] = callback.bind(this);
        }
    }
}

module.exports = Client
