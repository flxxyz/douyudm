/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../node_modules/fast-text-encoding/text.min.js":
/*!******************************************************!*\
  !*** ../node_modules/fast-text-encoding/text.min.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {(function(l){function m(){}function k(b,a){b=void 0===b?"utf-8":b;a=void 0===a?{fatal:!1}:a;if(-1==n.indexOf(b.toLowerCase()))throw new RangeError("Failed to construct 'TextDecoder': The encoding label provided ('"+b+"') is invalid.");if(a.fatal)throw Error("Failed to construct 'TextDecoder': the 'fatal' option is unsupported.");}if(l.TextEncoder&&l.TextDecoder)return!1;var n=["utf-8","utf8","unicode-1-1-utf-8"];Object.defineProperty(m.prototype,"encoding",{value:"utf-8"});m.prototype.encode=function(b,
a){a=void 0===a?{stream:!1}:a;if(a.stream)throw Error("Failed to encode: the 'stream' option is unsupported.");a=0;for(var g=b.length,f=0,c=Math.max(32,g+(g>>1)+7),e=new Uint8Array(c>>3<<3);a<g;){var d=b.charCodeAt(a++);if(55296<=d&&56319>=d){if(a<g){var h=b.charCodeAt(a);56320===(h&64512)&&(++a,d=((d&1023)<<10)+(h&1023)+65536)}if(55296<=d&&56319>=d)continue}f+4>e.length&&(c+=8,c*=1+a/b.length*2,c=c>>3<<3,h=new Uint8Array(c),h.set(e),e=h);if(0===(d&4294967168))e[f++]=d;else{if(0===(d&4294965248))e[f++]=
d>>6&31|192;else if(0===(d&4294901760))e[f++]=d>>12&15|224,e[f++]=d>>6&63|128;else if(0===(d&4292870144))e[f++]=d>>18&7|240,e[f++]=d>>12&63|128,e[f++]=d>>6&63|128;else continue;e[f++]=d&63|128}}return e.slice?e.slice(0,f):e.subarray(0,f)};Object.defineProperty(k.prototype,"encoding",{value:"utf-8"});Object.defineProperty(k.prototype,"fatal",{value:!1});Object.defineProperty(k.prototype,"ignoreBOM",{value:!1});k.prototype.decode=function(b,a){a=void 0===a?{stream:!1}:a;if(a.stream)throw Error("Failed to decode: the 'stream' option is unsupported.");
b.buffer instanceof ArrayBuffer&&(b=b.buffer);b=new Uint8Array(b);a=0;for(var g=[],f=[];;){var c=a<b.length;if(!c||a&65536){f.push(String.fromCharCode.apply(null,g));if(!c)return f.join("");g=[];b=b.subarray(a);a=0}c=b[a++];if(0===c)g.push(0);else if(0===(c&128))g.push(c);else if(192===(c&224)){var e=b[a++]&63;g.push((c&31)<<6|e)}else if(224===(c&240)){e=b[a++]&63;var d=b[a++]&63;g.push((c&31)<<12|e<<6|d)}else if(240===(c&248)){e=b[a++]&63;d=b[a++]&63;var h=b[a++]&63;c=(c&7)<<18|e<<12|d<<6|h;65535<
c&&(c-=65536,g.push(c>>>10&1023|55296),c=56320|c&1023);g.push(c)}}};l.TextEncoder=m;l.TextDecoder=k})("undefined"!==typeof window?window:"undefined"!==typeof global?global:this);

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../build/node_modules/webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "../node_modules/ws/browser.js":
/*!*************************************!*\
  !*** ../node_modules/ws/browser.js ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function() {
  throw new Error(
    'ws does not work in the browser. Browser clients must use the native ' +
      'WebSocket object'
  );
};


/***/ }),

/***/ "../src/bufferCoder.js":
/*!*****************************!*\
  !*** ../src/bufferCoder.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(/*! fast-text-encoding */ "../node_modules/fast-text-encoding/text.min.js");

function BufferCoder() {
  this.buffer = new ArrayBuffer(0), this.decoder = new TextDecoder(), this.encoder = new TextEncoder(), this.littleEndian = !0, this.readLength = 0;
}

/**
 * blob转arraybuffer
 * @param {Blob} blob 待转换的Blob类型参数
 */

/**
 * arraybuffer转blob
 * @param {ArrayBuffer} ab 待转换的ArrayBuffer类型参数
 */
BufferCoder.prototype.concat = function () {
  var a = [];

  for (var b = 0; b < arguments.length; b++) a[b] = arguments[b];

  return a.reduce(function (a, b) {
    var c = b instanceof ArrayBuffer ? new Uint8Array(b) : b;
    var d = new Uint8Array(a.length + c.length);
    return d.set(a, 0), d.set(c, a.length), d;
  }, new Uint8Array(0));
}, BufferCoder.prototype.decode = function (a, b, c) {
  for (c = c || this.littleEndian, this.buffer = this.concat(this.buffer, a).buffer; this.buffer && this.buffer.byteLength > 0;) {
    if (0 === this.readLength) {
      if (this.buffer.byteLength < 4) return;
      this.readLength = new DataView(this.buffer).getUint32(0, c), this.buffer = this.buffer.slice(4);
    }

    if (this.buffer.byteLength < this.readLength) return;
    var d = this.decoder.decode(this.buffer.slice(8, this.readLength - 1));
    this.buffer = this.buffer.slice(this.readLength), this.readLength = 0, b(d);
  }
}, BufferCoder.prototype.encode = function (a, b) {
  b = b || this.littleEndian;
  var c = this.concat(this.encoder.encode(a), Uint8Array.of(0));
  var d = 8 + c.length;
  var e = new DataView(new ArrayBuffer(d + 4));
  var f = 0;
  return e.setUint32(f, d, b), f += 4, e.setUint32(f, d, b), f += 4, e.setInt16(f, 689, b), f += 2, e.setInt8(f, 0), f += 1, e.setInt8(f, 0), f += 1, (new Uint8Array(e.buffer).set(c, f), e.buffer);
}, BufferCoder.prototype.blob2ab = function (a) {
  return new Promise(b => {
    var c = new FileReader();
    c.onload = function (a) {
      b(a.target.result);
    }, c.readAsArrayBuffer(a);
  });
}, BufferCoder.prototype.ab2blob = function (a) {
  return new Blob([a]);
}, module.exports = new BufferCoder();

/***/ }),

/***/ "../src/client.js":
/*!************************!*\
  !*** ../src/client.js ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var config = __webpack_require__(/*! ./config */ "../src/config.js");

var event = __webpack_require__(/*! ./clientEvent */ "../src/clientEvent.js");

var stt = __webpack_require__(/*! ./stt */ "../src/stt.js");

var util = __webpack_require__(/*! ./util */ "../src/util.js");

var bufferCoder = __webpack_require__(/*! ./bufferCoder */ "../src/bufferCoder.js");

var messageEvent = __webpack_require__(/*! ./messageEvent */ "../src/messageEvent.js");

class Client {
  constructor(a, b) {
    this.roomId = a, this.ws = null, this.heartbeatTask = null, this.messageEvent = messageEvent, this.ignore = [], this.options = this.setOptions(b || {}), this.clientEvent = {
      connect: {
        name: 'open',
        listener: event.open
      },
      disconnect: {
        name: 'close',
        listener: event.close
      },
      error: {
        name: 'error',
        listener: event.error
      }
    };
  }

  initSocket(a) {
    this.ws = new a(config.URL), this.ws.on('open', this.clientEvent.connect.listener.bind(this)), this.ws.on('error', this.clientEvent.error.listener.bind(this)), this.ws.on('close', this.clientEvent.disconnect.listener.bind(this)), this.ws.on('message', event.message.bind(this));
  }

  send(a) {
    this.ws.send(bufferCoder.encode(stt.serialize(a)));
  }

  getMessage(a) {
    return new Promise(b => {
      bufferCoder.decode(a, a => {
        b(stt.deserialize(a));
      });
    });
  }

  login() {
    this.send({
      type: 'loginreq',
      roomid: this.roomId
    });
  }

  joinGroup() {
    this.send({
      type: 'joingroup',
      rid: this.roomId,
      gid: 0
    });
  }

  heartbeat() {
    this.heartbeatTask = setInterval(() => {
      this.send({
        type: 'mrkl'
      });
    }, config.HEARBEAT_INTERVAL * 1e3);
  }

  logout() {
    this.send({
      type: 'logout'
    }), clearInterval(this.heartbeatTask), this.ws.close();
  }

  run(a) {
    var b = a || __webpack_require__(/*! ./websocket */ "../src/websocket.js");

    this.initSocket(b);
  }

  setIgnore(a, b) {
    if (util.isObject(a)) for (var c in a) a[c] && this.ignore.push(c);else b && this.ignore.push(a);
    return this;
  }

  setOptions(a) {
    var b = {
      debug: false,
      logfile: "".concat(this.roomId, ".log")
    };
    var c = {};
    return util.isObject(a) ? (a.hasOwnProperty('debug') && util.isBoolean(a.debug) && (c.debug = a.debug), a.hasOwnProperty('logfile') && util.isString(a.logfile) && (c.logfile = a.logfile), Object.assign(b, c)) : b;
  }

  on(a, b) {
    var c = Object.keys(this.clientEvent).find(b => b === a.toLocaleLowerCase());

    if (c) {
      //在创建连接是触发connect事件时，发送登入，加入组，监听心跳消息
      if (c === 'connect') {
        var e = b;

        b = function (a) {
          this.login(), this.joinGroup(), this.heartbeat(), e.bind(this)(a);
        };
      } else if (c === 'disconnect') {
        var f = b;

        b = function (a) {
          this.logout(), f.bind(this)(a);
        };
      }

      this.clientEvent[a].listener = b.bind(this);
    }

    var d = Object.keys(this.messageEvent).find(b => b === a.toLocaleLowerCase());
    d && (this.messageEvent[a] = b.bind(this));
  }

}

module.exports = Client;

/***/ }),

/***/ "../src/clientEvent.js":
/*!*****************************!*\
  !*** ../src/clientEvent.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

function asyncGeneratorStep(a, b, c, d, e, f, g) { try { var h = a[f](g); var i = h.value; } catch (a) { return void c(a); } h.done ? b(i) : Promise.resolve(i).then(d, e); }

function _asyncToGenerator(a) { return function () { var b = this, c = arguments; return new Promise(function (d, e) { function f(a) { asyncGeneratorStep(h, d, e, f, g, "next", a); } function g(a) { asyncGeneratorStep(h, d, e, f, g, "throw", a); } var h = a.apply(b, c); f(undefined); }); }; }

var bufferCoder = __webpack_require__(/*! ./bufferCoder */ "../src/bufferCoder.js");

var util = __webpack_require__(/*! ./util */ "../src/util.js");

var logger = __webpack_require__(/*! ./logger */ "../src/logger.js");

function open() {
  //登入
  //加入组
  this.login(), this.joinGroup(), this.heartbeat();
}

function error() {}

function close() {
  this.logout();
}

function message() {
  return _message.apply(this, arguments);
}

function _message() {
  return _message = _asyncToGenerator(function* (a) {
    var b = a;
    typeof MessageEvent !== 'undefined' && (b = yield bufferCoder.blob2ab(a.data));
    var c = yield this.getMessage(b);

    if (Object.keys(this.messageEvent).filter(a => !this.ignore.includes(a)).includes(c.type) && this.messageEvent[c.type](c), this.options.debug) {
      var d = util.isBrowser() ? this.roomId : this.options.logfile;
      logger.init(d), logger.echo(c);
    }
  }), _message.apply(this, arguments);
}

module.exports = {
  open,
  error,
  close,
  message
};

/***/ }),

/***/ "../src/config.js":
/*!************************!*\
  !*** ../src/config.js ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var util = __webpack_require__(/*! ./util */ "../src/util.js"); //目前已知的弹幕服务器


var port = 8500 + util.random(1, 6);
var URL = "wss://danmuproxy.douyu.com:".concat(port, "/");
var HEARBEAT_INTERVAL = 45;
var MSG_LIVE_ON = '主播正在直播';
var MSG_LIVE_OFF = '主播没有直播';
var MSG_ROOM_RSS = '房间开播提醒';
var MSG_BC_BUY_DESERVE = '赠送酬勤通知';
var MSG_SSD = '超级弹幕';
var MSG_ROOM_SPBC = '房间内礼物广播';
module.exports = {
  URL,
  HEARBEAT_INTERVAL: 45,
  MSG_LIVE_ON: "\u4E3B\u64AD\u6B63\u5728\u76F4\u64AD",
  MSG_LIVE_OFF: "\u4E3B\u64AD\u6CA1\u6709\u76F4\u64AD",
  MSG_ROOM_RSS: "\u623F\u95F4\u5F00\u64AD\u63D0\u9192",
  MSG_BC_BUY_DESERVE: "\u8D60\u9001\u916C\u52E4\u901A\u77E5",
  MSG_SSD: "\u8D85\u7EA7\u5F39\u5E55",
  MSG_ROOM_SPBC: "\u623F\u95F4\u5185\u793C\u7269\u5E7F\u64AD"
};

/***/ }),

/***/ "../src/index.js":
/*!***********************!*\
  !*** ../src/index.js ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var danmaku = __webpack_require__(/*! ./client */ "../src/client.js");

danmaku.stt = __webpack_require__(/*! ./stt */ "../src/stt.js"), danmaku.util = __webpack_require__(/*! ./util */ "../src/util.js"), danmaku.logger = __webpack_require__(/*! ./logger */ "../src/logger.js"), danmaku.Websocket = __webpack_require__(/*! ./websocket */ "../src/websocket.js"), module.exports = danmaku;

/***/ }),

/***/ "../src/logger.js":
/*!************************!*\
  !*** ../src/logger.js ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

function asyncGeneratorStep(a, b, c, d, e, f, g) { try { var h = a[f](g); var i = h.value; } catch (a) { return void c(a); } h.done ? b(i) : Promise.resolve(i).then(d, e); }

function _asyncToGenerator(a) { return function () { var b = this, c = arguments; return new Promise(function (d, e) { function f(a) { asyncGeneratorStep(h, d, e, f, g, "next", a); } function g(a) { asyncGeneratorStep(h, d, e, f, g, "throw", a); } var h = a.apply(b, c); f(undefined); }); }; }

var util = __webpack_require__(/*! ./util */ "../src/util.js");

var Logger = function () {
  this.dbname = 'unknown', this.db = null, this.inited = false;
};

Logger.prototype.init = function (a) {
  this.inited || (this.dbname = a, util.isBrowser() ? (window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB, this._sql = indexedDB.open('danmaku', 1), this._sql.addEventListener('success', () => {
    void 0, this.db = event.target.result;
  }), this._sql.addEventListener('upgradeneeded', () => {
    this.db = event.target.result, this.db.createObjectStore(this.dbname, {
      keyPath: 'id',
      autoIncrement: true
    });
  }), this._sql.addEventListener('error', () => {})) : this._fs = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js"), this.inited = true);
}, util.isBrowser() ? (Logger.prototype.echo = function (a) {
  if (this.db !== null) {
    var b = this.db.transaction(this.dbname, 'readwrite');
    var c = b.objectStore(this.dbname);
    c.add({
      t: new Date().getTime(),
      frame: a
    });
  }
}, Logger.prototype.all = function () {
  var a = this.db.transaction(this.dbname, 'readonly');
  var b = a.objectStore(this.dbname);
  return new Promise(function (a, c) {
    var d = b.getAll();
    d.addEventListener('success', function () {
      a(d.result);
    }), d.addEventListener('error', function () {
      c(false);
    });
  });
}, Logger.prototype.len = function () {
  var a = this.db.transaction(this.dbname, 'readonly');
  var b = a.objectStore(this.dbname);
  return new Promise(function (a, c) {
    var d = b.count();
    d.addEventListener('success', function () {
      a(d.result);
    }), d.addEventListener('error', function () {
      c(false);
    });
  });
}, Logger.prototype.export = /*#__PURE__*/_asyncToGenerator(function* () {
  var a = yield this.all();
  var b = '';
  return a.forEach(a => {
    b += "".concat(JSON.stringify({
      t: a.t,
      frame: a.frame
    }), "\n");
  }), util.download(this.dbname, b), b;
})) : (Logger.prototype.echo = function (a) {
  this._fs.appendFile(this.dbname, JSON.stringify({
    t: new Date().getTime(),
    frame: a
  }) + '\n', function (a) {});
}, Logger.prototype.all = function () {
  return new Promise((a, b) => {
    this._fs.readFile(this.dbname, 'utf8', function (c, d) {
      c ? b(c) : a(d);
    });
  });
}, Logger.prototype.len = function () {
  var a = this;
  return new Promise( /*#__PURE__*/function () {
    var b = _asyncToGenerator(function* (b) {
      var c = yield a.all();
      b(c.split('\n').filter(a => a !== '').length);
    });

    return function () {
      return b.apply(this, arguments);
    };
  }());
}, Logger.prototype.export = function () {
  return this._fs.readFileSync(this.dbname, 'utf8');
}), module.exports = new Logger();

/***/ }),

/***/ "../src/messageEvent.js":
/*!******************************!*\
  !*** ../src/messageEvent.js ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var config = __webpack_require__(/*! ./config */ "../src/config.js");

module.exports = {
  loginres: function loginres() {// 登录响应
    // 服务端返回登录响应消息,完整的数据部分应包含的字段如下:
    // 字段说明
    //     type             表示为“登录”消息,固定为 loginres
    //     userid           用户 ID
    //     roomgroup        房间权限组
    //     pg               平台权限组
    //     sessionid        会话 ID
    //     username         用户名
    //     nickname         用户昵称
    //     is_signed        是否已在房间签到
    //     signed_count     日总签到次数
    //     live_stat        直播状态
    //     npv              是否需要手机验证
    //     best_dlev        最高酬勤等级
    //     cur_lev          酬勤等级
  },
  chatmsg: function chatmsg() {},
  uenter: function uenter() {},
  upgrade: function upgrade() {// 用户等级提升
  },
  rss: function rss() {},
  bc_buy_deserve: function bc_buy_deserve() {// 赠送酬勤通知
    // 用户赠送酬勤时,服务端发送此消息至客户端。完整的数据部分应包含的字段如 下:
    // 字段说明
    //     type   表示为“赠送酬勤通知”消息,固定为 bc_buy_deserve
    //     rid    房间 ID
    //     gid    弹幕分组 ID
    //     level  用户等级
    //     cnt    赠送数量
    //     hits   赠送连击次数
    //     lev    酬勤等级
    //     sui    用户信息序列化字符串,详见下文。注意,此处为嵌套序列化,需注 意符号的转义变换。(转义符号参见 2.2 序列化)
  },
  ssd: function ssd() {// 超级弹幕
    // 超级弹幕主要部分应包含的字段如下:
    // 字段说明
    //     type     表示为“超级弹幕”消息,固定为 ssd
    //     rid      房间 id
    //     gid      弹幕分组 id
    //     sdid     超级弹幕 id
    //     trid     跳转房间 id
    //     content  超级弹幕的内容
  },
  spbc: function spbc() {},
  dgb: function dgb() {// 赠送礼物
    // 用户在房间赠送礼物时,服务端发送此消息给客户端。完整的数据部分应包含的 字段如下:
    // 字段说明
    //     type   表示为“赠送礼物”消息,固定为 dgb
    //     rid    房间 ID
    //     gid    弹幕分组 ID
    //     gfid   礼物 id
    //     gs     礼物显示样式
    //     uid    用户 id
    //     nn     用户昵称
    //     str    用户战斗力
    //     level  用户等级
    //     dw     主播体重
    //     gfcnt  礼物个数:默认值 1(表示 1 个礼物)
    //     hits   礼物连击次数:默认值 1(表示 1 连击)
    //     dlv    酬勤头衔:默认值 0(表示没有酬勤)
    //     dc     酬勤个数:默认值 0(表示没有酬勤数量)
    //     bdl    全站最高酬勤等级:默认值 0(表示全站都没有酬勤)
    //     rg     房间身份组:默认值 1(表示普通权限用户)
    //     pg     平台身份组:默认值 1(表示普通权限用户)
    //     rpid   红包 id:默认值 0(表示没有红包)
    //     slt    红包开启剩余时间:默认值 0(表示没有红包)
    //     elt    红包销毁剩余时间:默认值 0(表示没有红包)
  },
  onlinegift: function onlinegift() {},
  ggbb: function ggbb() {// 房间用户抢红包
    // 房间赠送礼物成功后效果(赠送礼物效果,连击数)主要部分应包含的字段如下:
    // 字段说明
    //     type  表示“房间用户抢红包”信息,固定为 ggbb
    //     rid   房间 id
    //     gid   弹幕分组 id
    //     sl    抢到的鱼丸数量
    //     sid   礼包产生者 id
    //     did   抢礼包者 id
    //     snk   礼包产生者昵称
    //     dnk   抢礼包者昵称
    //     rpt   礼包类型
  },
  rankup: function rankup() {// 房间内top10变化消息
    // 房间内 top10 排行榜变化后,广播。主要部分应包含的字段如下:
    // 字段说明
    // type  表示为“房间 top10 排行榜变换”,固定为 rankup
    // rid   房间 id
    // gid   弹幕分组 id
    // uid   用户 id
    // drid  目标房间 id
    // rt    房间所属栏目类型
    // bt    广播类型:1-房间内广播,2-栏目广播,4-全站广播
    // sz    展示区域:1-聊天区展示,2-flash 展示,3-都显示
    // nk    用户昵称
    // rkt   top10 榜的类型 1-周榜 2-总榜 4-日榜
    // rn    上升后的排名
  },
  ranklist: function ranklist() {// 广播排行榜消息
  },
  mrkl: function mrkl() {// 心跳
  },
  erquizisn: function erquizisn() {// 鱼丸预言，参数未知
  },
  blab: function blab() {// 粉丝等级升级
    // 字段说明
    // type  表示为“粉丝等级升级”,固定为 blab
    // rid   房间 id
    // uid   用户 id
    // nn  用户昵称
    // bl  升级后的等级
    // bnn 升级的粉丝牌
    // lbl 未知（猜测未升级前的等级）
    // ba  未知
  },
  rri: function rri() {// 未知的消息事件
  },
  synexp: function synexp() {},
  noble_num_info: function noble_num_info() {// 未知的消息事件
  },
  gbroadcast: function gbroadcast() {// 未知的消息事件
  },
  qausrespond: function qausrespond() {// 未知的消息事件
  },
  wiru: function wiru() {// 未知的消息事件
  },
  wirt: function wirt() {// 未知的消息事件
  },
  mcspeacsite: function mcspeacsite() {// 未知的消息事件
  },
  rank_change: function rank_change() {// 未知的消息事件
  },
  srres: function srres() {// 未知的消息事件
  },
  anbc: function anbc() {// 未知的消息事件
  }
};

/***/ }),

/***/ "../src/stt.js":
/*!*********************!*\
  !*** ../src/stt.js ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var util = __webpack_require__(/*! ./util */ "../src/util.js");

function escape(a) {
  return a = a.toString(), a = a.replace(/@/g, '@A'), a = a.replace(/\//g, '@S'), a;
}

function unescape(a) {
  return a = a.toString(), a = a.replace(/@A/g, '@'), a = a.replace(/@S/g, '/'), a;
}

function serialize(a) {
  if (util.isObject(a)) {
    var d = '';

    for (var b = 0, c = Object.entries(a); b < c.length; b++) {
      var [e, f] = c[b];
      d += "".concat(escape(serialize(e)), "@=").concat(escape(serialize(f)), "/");
    }

    return d;
  }

  return util.isArray(a) ? a.map(a => "".concat(escape(serialize(a)), "/")).join('') : util.isString(a) || util.isNumber(a) ? a.toString() : '';
}

function deserialize(a) {
  var b = {};
  if (util.isUndefined(b) || a.length <= 0) return b;
  var c = a.split('/');

  for (var d = c.length - 2; d >= 0; d--) {
    var e = c[d].split('@=');
    var f = e[0];
    var g = e[1];
    /^\w+@A=(.*?)@S$/.test(g) && (g = deserialize(unescape(g))), b[f] = g;
  }

  return b;
}

module.exports = {
  serialize,
  deserialize
};

/***/ }),

/***/ "../src/util.js":
/*!**********************!*\
  !*** ../src/util.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

function Util() {
  ['Object', 'Array', 'String', 'Number', 'Boolean', 'Function', 'RegExp', 'Date', 'Undefined', 'Null', 'Symbol', 'Blob', 'ArrayBuffer'].forEach(a => {
    this["is".concat(a)] = b => Object.prototype.toString.call(b).slice(8, -1) === a;
  });
} //判断浏览器环境


//随机数生成
//web端下载文件
Util.prototype.isBrowser = () => typeof window !== 'undefined', Util.prototype.random = (a, b) => Math.floor(Math.random() * (b - a + 1) + a), Util.prototype.download = function (a, b) {
  if (this.isBrowser()) {
    var c = document.createElement('a');
    c.style.display = 'none';
    var d = new Blob([b]);
    c.download = "".concat(a, ".log"), c.href = URL.createObjectURL(d), document.body.appendChild(c), c.click(), URL.revokeObjectURL(d), document.body.removeChild(c);
  }
}, module.exports = new Util();

/***/ }),

/***/ "../src/websocket.js":
/*!***************************!*\
  !*** ../src/websocket.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var util = __webpack_require__(/*! ./util */ "../src/util.js");

class websocket {
  constructor(a) {
    this.listener = {}, this.socket = new WebSocket(a);
  }

  send(a) {
    this.socket.send(a);
  }

  close(a, b) {
    this.socket.close(a, b);
  }

  on(a, b) {
    var c = ['open', 'error', 'close', 'message'].find(b => b === a.toLocaleLowerCase());
    c && (Object.keys(this.listener).includes(c) && this.socket.removeEventListener(c, this.listener[c]), this.listener[c] = b, this.socket.addEventListener(c, b));
  }

}

module.exports = util.isBrowser() ? websocket : __webpack_require__(/*! ws */ "../node_modules/ws/browser.js");

/***/ }),

/***/ "./index.js":
/*!******************!*\
  !*** ./index.js ***!
  \******************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _src_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../src/index */ "../src/index.js");
/* harmony import */ var _src_index__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_src_index__WEBPACK_IMPORTED_MODULE_0__);



window.douyudanmaku = _src_index__WEBPACK_IMPORTED_MODULE_0___default.a, window.danmaku = _src_index__WEBPACK_IMPORTED_MODULE_0___default.a;

/***/ }),

/***/ "./node_modules/node-libs-browser/mock/empty.js":
/*!******************************************************!*\
  !*** ./node_modules/node-libs-browser/mock/empty.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {



/***/ }),

/***/ "./node_modules/webpack/buildin/global.js":
/*!***********************************!*\
  !*** (webpack)/buildin/global.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ })

/******/ });
//# sourceMappingURL=douyudanmaku.js.map