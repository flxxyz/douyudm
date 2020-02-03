#!/usr/bin/env node

const program = require('commander')
const package = require('../package.json')
const client = require('../src/client')

program
    .requiredOption('-i, --id <number>', '输入房间id')
    .version(package.version)
    .parse(process.argv)

new client(program.id).run()