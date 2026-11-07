import { createWriteStream, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { program } from 'commander';
import { Client } from '../index';
import { createDefaultMessageEvents } from '../events/messageEvent';
import {
  ASS_DEFAULTS,
  applyFilters,
  compileFilterPattern,
  createRecordMeta,
  parseRecord,
  parseTimeParam,
  renderAss,
  serializeRecordLine,
  toDanmakuItems,
} from '../core/danmaku';
import type { FilterScript, MessageEventType, RecordedMessage } from '../types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../../package.json') as { version: string };

const collect = (value: string, prev: string[]): string[] => prev.concat([value]);

function numberOption(value: string, name: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    console.error(`error: ${name} 需要数字，收到: ${value}`);
    process.exit(1);
  }
  return n;
}

program.name('douyudm').version(version);

// ─── 默认命令：连接房间实时打印弹幕（douyudm -i 9999 原样兼容）────────────────

program
  .command('listen', { isDefault: true })
  .description('连接房间实时打印弹幕（默认命令，listen 可省略）')
  .option('-i, --id <number>', '输入房间id')
  .option('-j, --uenter', '忽略用户进入房间', false)
  .option('--ignore [list]', '忽略掉一些消息事件', '')
  .option('--no-resolve-room-id', '输入为真实 rid 时跳过靓号解析')
  .option('--record [file]', '同时录制为 JSONL（缺省文件名 douyudm-<房间id>-<时间戳>.jsonl）')
  .option('--record-events <list>', '要录制的消息事件，逗号分隔', 'chatmsg')
  .action((opts: {
    id?: string;
    uenter: boolean;
    ignore: string;
    record?: string | boolean;
    recordEvents: string;
    resolveRoomId: boolean;
  }) => {
    if (!opts.id) {
      // 与旧版 requiredOption 的报错文案保持一致
      console.error("error: required option '-i, --id <number>' not specified");
      process.exit(1);
    }

    const ignoreList = opts.ignore.split(',').filter(Boolean) as MessageEventType[];
    if (opts.uenter) ignoreList.push('uenter');

    const client = new Client(opts.id, { ignore: ignoreList, resolveRoomId: opts.resolveRoomId });
    client.on('error', (_client, error) => {
      console.error(error);
      process.exitCode = 1;
      client.close();
    });

    if (opts.record !== undefined) {
      const file = typeof opts.record === 'string'
        ? opts.record
        : `douyudm-${opts.id}-${Date.now()}.jsonl`;
      const stream = createWriteStream(file, { flags: 'a' });
      client.on('connect', (c) => {
        stream.write(serializeRecordLine(createRecordMeta(c.roomId, Date.now())));
      });
      client.on('error', () => stream.end());

      const events = [...new Set(opts.recordEvents.split(',').filter(Boolean))] as MessageEventType[];
      const defaults = createDefaultMessageEvents();
      for (const type of events) {
        const fallback = defaults[type];
        // 录制的同时保留默认的控制台输出（被 --ignore 忽略的事件不会走到这里）
        client.on(type, (msg, c) => {
          stream.write(serializeRecordLine({ ...msg, ts: Date.now() } as unknown as RecordedMessage));
          if (fallback) fallback(msg, c);
        });
      }

      client.on('disconnect', () => stream.end());
      process.on('SIGINT', () => {
        client.close();
        stream.end(() => process.exit(0));
      });
      console.log(`[record] 录制到 ${file}（事件: ${events.join(',')}），Ctrl+C 停止`);
    }

    client.run();
  });

// ─── convert：JSONL 录制文件 → ASS 字幕 ──────────────────────────────────────

program
  .command('convert')
  .description('把录制的 JSONL 转换为 ASS 字幕')
  .argument('<input>', '录制生成的 .jsonl 文件')
  .option('-o, --output <file>', '输出文件（默认与输入同名，扩展名改为 .ass）')
  .option('--from <time>', '裁剪起点，HH:MM:SS / MM:SS / 秒')
  .option('--to <time>', '裁剪终点，格式同 --from')
  .option('--delay <seconds>', '字幕整体平移秒数，可为负（负数写作 --delay=-3）', parseFloat)
  .option('--filter <regex>', '剔除 txt 匹配的弹幕，可重复，支持 /pattern/flags', collect, [])
  .option('--filter-user <regex>', '剔除昵称匹配的弹幕，可重复', collect, [])
  .option('--filter-script <path>', '自定义过滤脚本模块（default export 函数或 { batch }）')
  .option('--width <px>', 'ASS 画布宽', String(ASS_DEFAULTS.width))
  .option('--height <px>', 'ASS 画布高', String(ASS_DEFAULTS.height))
  .option('--fontsize <px>', '弹幕字号', String(ASS_DEFAULTS.fontSize))
  .option('--duration <seconds>', '单条弹幕滚动时长', String(ASS_DEFAULTS.duration))
  .option('--opacity <0-1>', '弹幕不透明度', String(ASS_DEFAULTS.opacity))
  .action(async (input: string, opts: {
    output?: string;
    from?: string;
    to?: string;
    delay?: number;
    filter: string[];
    filterUser: string[];
    filterScript?: string;
    width: string;
    height: string;
    fontsize: string;
    duration: string;
    opacity: string;
  }) => {
    try {
      const content = readFileSync(input, 'utf8');
      const { meta, messages, badLines } = parseRecord(content);
      if (badLines > 0) console.warn(`警告: 跳过 ${badLines} 行无法解析的记录`);
      if (!meta) console.warn('警告: 缺少 meta 行，以第一条消息的时间作为字幕 0 点');
      const zeroAt = meta?.startedAt ?? messages[0]?.ts ?? 0;

      let script: FilterScript | undefined;
      if (opts.filterScript) {
        const mod = (await import(pathToFileURL(resolve(opts.filterScript)).href)) as {
          default?: unknown;
        };
        const candidate = mod.default ?? mod;
        const isPredicate = typeof candidate === 'function';
        const isBatch = typeof (candidate as { batch?: unknown } | null)?.batch === 'function';
        if (!isPredicate && !isBatch) {
          throw new Error(`过滤脚本需 default export 函数或 { batch } 对象: ${opts.filterScript}`);
        }
        script = candidate as FilterScript;
      }

      const kept = await applyFilters(messages, {
        text: opts.filter.map(compileFilterPattern),
        user: opts.filterUser.map(compileFilterPattern),
        script,
      });

      const items = toDanmakuItems(kept, {
        zeroAt,
        from: opts.from !== undefined ? parseTimeParam(opts.from) : undefined,
        to: opts.to !== undefined ? parseTimeParam(opts.to) : undefined,
        delay: opts.delay,
      });

      const ass = renderAss(items, {
        width: numberOption(opts.width, '--width'),
        height: numberOption(opts.height, '--height'),
        fontSize: numberOption(opts.fontsize, '--fontsize'),
        duration: numberOption(opts.duration, '--duration'),
        opacity: numberOption(opts.opacity, '--opacity'),
      });

      const output = opts.output ?? input.replace(/\.jsonl?$/i, '') + '.ass';
      writeFileSync(output, ass, 'utf8');
      console.log(
        `已生成 ${output}: ${items.length} 条弹幕（读取 ${messages.length} 条，过滤剔除 ${messages.length - kept.length} 条）`,
      );
    } catch (e) {
      console.error(`error: ${(e as Error).message}`);
      process.exit(1);
    }
  });

program.parseAsync(process.argv).catch((e) => {
  console.error(e);
  process.exit(1);
});
