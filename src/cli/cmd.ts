import { program } from 'commander';
import { Client } from '../index';
import type { MessageEventType } from '../types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../../package.json') as { version: string };

program
  .requiredOption('-i, --id <number>', '输入房间id')
  .option('-j, --uenter', '忽略用户进入房间', false)
  .option('--ignore [list]', '忽略掉一些消息事件', '')
  .version(version)
  .parse(process.argv);

const opts = program.opts<{
  id: string;
  uenter: boolean;
  ignore: string;
}>();

const ignoreList: MessageEventType[] = opts.ignore
  .split(',')
  .filter(Boolean) as MessageEventType[];

if (opts.uenter) {
  ignoreList.push('uenter');
}

const client = new Client(opts.id, { ignore: ignoreList });

client.run();
