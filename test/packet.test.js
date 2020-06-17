const packet = require('../src/packet')
const assert = require('assert')
const stt = require('../src/stt')

const oldEncode = (str) => {
    const ab = packet.browserEncode(str)
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