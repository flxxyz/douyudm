#!/usr/bin/env node

const program = require('commander')
const package = require('../package.json')
const client = require('../src/client')

program
    .requiredOption('-i, --id <number>', '输入房间id')
    .option('-j, --uenter', '忽略用户进入房间的消息', false)
    .option('-u, --upgrade', '忽略用户进入房间的消息', false)
    .option('-r, --rss', '忽略用户进入房间的消息', false)
    .option('-b, --bc_buy_deserve', '忽略用户进入房间的消息', false)
    .option('-s, --ssd', '忽略用户进入房间的消息', false)
    .option('-p, --spbc', '忽略用户进入房间的消息', false)
    .option('-d, --dgb', '忽略用户进入房间的消息', false)
    .option('-o, --onlinegift', '忽略用户进入房间的消息', false)
    .option('-g, --ggbb', '忽略用户进入房间的消息', false)
    .option('-r, --rankup', '忽略用户进入房间的消息', false)
    .option('-l, --ranklist', '忽略用户进入房间的消息', false)
    .version(package.version)
    .parse(process.argv)

const c = new client(program.id)
c.setIgnore({
    uenter: program.uenter,
    upgrade: program.upgrade,
    rss: program.rss,
    bc_buy_deserve: program.bc_buy_deserve,
    ssd: program.ssd,
    spbc: program.spbc,
    dgb: program.dgb,
    onlinegift: program.onlinegift,
    ggbb: program.ggbb,
    rankup: program.rankup,
    ranklist: program.ranklist,
}).run()