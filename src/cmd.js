#!/usr/bin/env node

const program = require('commander');
const package = require('../package.json');
const { client } = require('../src/index');

program
    .requiredOption('-i, --id <number>', '输入房间id')
    .option('-j, --uenter', '忽略用户进入房间', false)
    .option('--debug', '开启debug模式，输出消息内容保存到文件', false)
    .option('--ignore [list]', '忽略掉一些消息事件', '')
    .version(package.version)
    .parse(process.argv);

const ignore = program.ignore
    .split(',')
    .filter(Boolean);

const opts = {
    debug: program.debug,
    ignore,
};

new client(program.id, opts).run();