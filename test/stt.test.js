const assert = require('assert');
const danmaku = require('../src/index');
const STT = danmaku.STT;
const testValue = require('./value');

describe('stt.js 斗鱼序列化反序列化', function () {
    for (const [key, value] of Object.entries(testValue)) {
        it(`检查序列化 ${key}`, function () {
            if (['qausrespond', 'rri'].includes(key)) {
                assert.ifError(`已知问题 ${key} 消息存在两个同级 rid`);
            }
            let o = STT.deserialize(value);
            let newValue = STT.serialize(o);
            assert.deepStrictEqual(value, newValue);
        })
    }
})