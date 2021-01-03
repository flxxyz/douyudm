const assert = require('assert');
const danmaku = require('../src/index');
const Packet = danmaku.Packet;
const STT = danmaku.STT;
const oldPacket = require('./old/BufferCoder');
const testValue = require('./value');

describe('packet.js 消息编码', function () {
    it('发送构建的消息', function () {
        const msg = STT.serialize({
            type: 'chatmsg',
            rid: '3898464',
            ct: '1',
            uid: '148225335',
            nn: '套你个猴碎碎宝宝',
            txt: '感觉你家里里有人[宝宝][宝宝][宝宝]',
            cid: 'c58f68064dff4503e596fd0000000000',
            ic: 'avatar_v3/201809/8382101f4ec4c609911ba482ae249059',
            level: '28',
            sahf: '0',
            cst: '1609565837998',
            bnn: '',
            bl: '0',
            brid: '0',
            hc: '',
            cbid: '88888',
            el: '',
            lk: '',
            urlev: '4',
            dms: '4',
            pdg: '42',
            pdk: '93',
            ext: ''
        })
        const oldMsg = oldPacket.Encode(msg);

        assert.deepStrictEqual(Packet.Encode(msg), oldMsg);
    })
})

describe('packet.js 消息解码', function () {
    it('多条消息响应', function () {
        const loginresBuf = oldPacket.Encode(testValue.loginres);
        const pingreqBuf = oldPacket.Encode(testValue.pingreq);
        const loginMsg = oldPacket.concat(loginresBuf, pingreqBuf);

        Packet.Decode(loginMsg, data => {
            const r = STT.deserialize(data);
            if (r.type === 'loginres') {
                assert.strictEqual(testValue.loginres, data);
            } else {
                assert.strictEqual(testValue.pingreq, data);
            }
        })
    })

    it('单条消息响应', function () {
        const uenterBuf = oldPacket.Encode(testValue.uenter);

        Packet.Decode(uenterBuf, data => {
            assert.strictEqual(testValue.uenter, data);
        })
    })
})