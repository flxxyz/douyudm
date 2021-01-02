#!/usr/bin/env node

const program = require('commander')
const package = require('../package.json')
const client = require('../src/client')

program
    .requiredOption('-i, --id <number>', '输入房间id')
    .option('-j, --uenter', '忽略用户进入房间', false)
    .option('--debug', '开启debug模式，输出消息内容保存到文件', false)
    .version(package.version)
    .parse(process.argv);

const opts = {
    debug: program.debug,
};
const douyu = new client(program.id, opts)
douyu.setIgnore({ uenter: program.uenter }).run();