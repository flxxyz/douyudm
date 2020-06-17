const packet = require('../src/packet')
const assert = require('assert')
const stt = require('../src/stt')

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

BufferCoder.prototype.decode = function (buf, callback, LE) {
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

BufferCoder.prototype.encode = function (str, LE) {
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

const bufferCoder = new BufferCoder()

const oldEncode = (str) => {
    const ab = bufferCoder.encode(str)
    const buf = Buffer.from(ab, 'utf8')
    const dataView = new Uint8Array(ab)
    for (let i = 0; i < buf.length; i++) {
        buf[i] = dataView[i]
    }
    return buf
}

describe('packet.js 消息编码', function () {
    it('发送构建的消息', function () {
        const msg = stt.serialize({
            type: 'chatmsg',
            nn: '河马（￣。。￣）',
            ic: 'avatar_v3/201912/b99d77251eb643b5a88bb81863afea4e',
            cst: '1592152272402',
            brid: '0',
            lk: '',
            list: [{
                lev: '1',
                num: '2'
            }, {
                lev: '7',
                num: '3'
            }]
        })
        const oldMsg = oldEncode(msg)

        assert.deepEqual(packet.Encode(msg), oldMsg)
    })
})

describe('packet.js 消息解码', function () {
    it('多条消息响应', function () {
        const loginres = 'type@=loginres/userid@=0/roomgroup@=0/pg@=0/sessionid@=0/username@=/nickname@=/live_stat@=0/is_illegal@=0/ill_ct@=/ill_ts@=0/now@=0/ps@=0/es@=0/it@=0/its@=0/npv@=0/best_dlev@=0/cur_lev@=0/nrc@=1958850976/ih@=0/sid@=72193/sahf@=0/sceneid@=0/newrg@=0/regts@=0/ip@=27.17.93.42/'
        const pingreq = 'type@=pingreq/tick@=1592335920516/'
        const loginresBuf = oldEncode(loginres)
        const pingreqBuf = oldEncode(pingreq)
        const loginMsg = Buffer.concat([loginresBuf, pingreqBuf], loginresBuf.length + pingreqBuf.length)

        packet.Decode(loginMsg, data => {
            const r = stt.deserialize(data)
            if (r.type === 'loginres') {
                assert.equal(loginres, data)
            } else {
                assert.equal(pingreq, data)
            }
        })
    })

    it('单条消息响应', function () {
        const uenter = 'type@=uenter/rid@=102965/uid@=2069037/nn@=colaen/level@=29/ic@=avatar@S002@S06@S90@S37_avatar/rni@=0/el@=/sahf@=0/wgei@=0/'
        const uenterBuf = oldEncode(uenter)

        packet.Decode(uenterBuf, data => {
            assert.equal(uenter, data)
        })
    })
})