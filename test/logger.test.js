const assert = require('assert');
const danmaku = require('../src/index');
const Logger = danmaku.Logger;
const testValue = require('./value');
const fs = require('fs');
const path = require('path');

describe('logger.js', function () {
    const roomId = 10086;
    let logger = null;

    it('清理', function () {
        fs.unlinkSync(path.resolve(`${roomId}.json`));
    })

    it('初始化', function () {
        logger = new Logger(roomId);
        assert.ok(logger)
    })

    for (const [key, value] of Object.entries(testValue)) {
        it(`写入 ${key}`, function () {
            logger.write(key, value);
        })
    }


    for (const [key, value] of Object.entries(testValue)) {
        it(`读取 ${key}`, function () {
            logger.read(key);
        })
    }
})