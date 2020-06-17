require('fast-text-encoding')
const util = require('./util')

function BufferCoder() {
    this.buffer = new ArrayBuffer(0)
    this.decoder = new TextDecoder()
    this.encoder = new TextEncoder()
    this.littleEndian = !0
    this.readLength = 0
}

BufferCoder.prototype.concat = function () {
    const arr = []
    for (let n = 0; n < arguments.length; n++) arr[n] = arguments[n]

    return arr.reduce(function (arr, buf) {
        const message = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf
        const t = new Uint8Array(arr.length + message.length)
        t.set(arr, 0)
        t.set(message, arr.length)
        return t
    }, new Uint8Array(0))
}

BufferCoder.prototype.Decode = function (buf, callback, LE) {
    LE = LE || this.littleEndian
    this.buffer = this.concat(this.buffer, buf).buffer
    for (; this.buffer && this.buffer.byteLength > 0;) {
        if (0 === this.readLength) {
            if (this.buffer.byteLength < 4) return;

            this.readLength = new DataView(this.buffer).getUint32(0, LE)
            this.buffer = this.buffer.slice(4)
        }

        if (this.buffer.byteLength < this.readLength) return;

        const str = this.decoder.decode(this.buffer.slice(8, this.readLength - 1))
        this.buffer = this.buffer.slice(this.readLength)
        this.readLength = 0
        callback(str)
    }
}

BufferCoder.prototype.Encode = function (str, LE) {
    LE = LE || this.littleEndian
    let message = this.concat(this.encoder.encode(str), Uint8Array.of(0))
    let len = 8 + message.length
    let r = new DataView(new ArrayBuffer(len + 4))
    let offset = 0

    r.setUint32(offset, len, LE)
    offset += 4
    r.setUint32(offset, len, LE)
    offset += 4
    r.setInt16(offset, 689, LE)
    offset += 2
    r.setInt8(offset, 0)
    offset += 1
    r.setInt8(offset, 0)
    offset += 1

    return new Uint8Array(r.buffer).set(message, offset), r.buffer
}

/**
 * blob转arraybuffer
 * @param {Blob} blob 待转换的Blob类型参数
 */
BufferCoder.prototype.blob2ab = function (blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = function (e) {
            resolve(e.target.result)
        }
        reader.readAsArrayBuffer(blob)
    })
}

/**
 * arraybuffer转blob
 * @param {ArrayBuffer} ab 待转换的ArrayBuffer类型参数
 */
BufferCoder.prototype.ab2blob = function (ab) {
    return new Blob([ab])
}

const browser = new BufferCoder()

class Packet {
    constructor() {
        this.HEADER_LEN_SIZE = 4
        this.HEADER_LEN_TYPECODE = 2
        this.HEADER_LEN_ENCRYPT = 1
        this.HEADER_LEN_PLACEHOLDER = 1
        this.HEADER_LEN_TOTAL = this.HEADER_LEN_SIZE * 2 +
            this.HEADER_LEN_TYPECODE +
            this.HEADER_LEN_ENCRYPT +
            this.HEADER_LEN_PLACEHOLDER
        this.buffer = Buffer.alloc(0)
    }

    nodeEncode(data) {
        const msgHeader = Buffer.alloc(this.HEADER_LEN_TOTAL)
        const msgBody = Buffer.from(data, 'utf8')
        const msgTotalLen = msgBody.length + this.HEADER_LEN_TOTAL + 1
        msgHeader.writeInt32LE(msgTotalLen - this.HEADER_LEN_SIZE, 0)
        msgHeader.writeInt32LE(msgTotalLen - this.HEADER_LEN_SIZE, 4)
        msgHeader.writeInt16LE(689, 8)
        return Buffer.concat([msgHeader, msgBody], msgTotalLen)
    }

    browserEncode(data) {
        return browser.Encode(data)
    }

    Encode(data) {
        return util.isBrowser() ? this.browserEncode(data) : this.nodeEncode(data)
    }

    nodeDecode(buf, callback) {
        this.buffer = Buffer.concat([this.buffer, buf])
        for (let offset = 0; this.buffer.length > 0; offset = 0) {
            if (0 === offset) {
                if (this.buffer.length < this.HEADER_LEN_SIZE) return;
                offset = this.buffer.readInt32LE(this.HEADER_LEN_SIZE)
                this.buffer = this.buffer.slice(this.HEADER_LEN_SIZE)
            }

            if (this.buffer.length < offset) return;

            const message = this.buffer.slice(this.HEADER_LEN_SIZE * 2, offset - 1).toString('utf8')
            this.buffer = this.buffer.slice(offset)
            callback(message)
        }
    }

    browserDecode(buf, callback) {
        browser.Decode(buf, callback)
    }

    Decode(buf, callback) {
        util.isBrowser() ? this.browserDecode(buf, callback) : this.nodeDecode(buf, callback)
    }
}

module.exports = new Packet()