const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { WebSocketServer } = require('ws');
const { Packet, STT } = require('../dist/index.cjs.js');
const root = resolve(__dirname, '..');

for (const format of ['CJS', 'ESM']) {
  test(`${format} package entry logs in and receives chat via its default WebSocket factory`, async () => {
    const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
    await new Promise((resolve) => server.once('listening', resolve));
    const received = [];
    server.on('connection', (ws) =>
      ws.on('message', (data) =>
        Packet.decode(data, (raw) => {
          const message = STT.deserialize(raw);
          received.push(message);
          if (message.type === 'joingroup') {
            ws.send(
              Packet.encode(
                STT.serialize({ type: 'chatmsg', rid: '6979222', txt: 'entrypoint check' }),
              ),
            );
          }
        }),
      ),
    );
    const url = `ws://127.0.0.1:${server.address().port}/`;
    const source = `${format === 'ESM' ? "import { Client } from 'douyudm';" : "const { Client } = require('douyudm');"}
      const client = new Client(6979222, { resolveRoomId: false });
      const timer = setTimeout(() => { client.close(); process.exitCode = 1; }, 5000);
      client.on('chatmsg', message => {
        if (message.txt !== 'entrypoint check') process.exitCode = 1;
        console.log('chat received'); clearTimeout(timer); client.close();
      });
      client.on('error', (_client, error) => {
        console.error(error); clearTimeout(timer); client.close(); process.exitCode = 1;
      });
      client.run(${JSON.stringify(url)});`;
    try {
      const child = spawn(
        process.execPath,
        [...(format === 'ESM' ? ['--input-type=module'] : []), '-e', source],
        { cwd: root },
      );
      let output = '';
      child.stdout.on('data', (data) => {
        output += data;
      });
      child.stderr.on('data', (data) => {
        output += data;
      });
      const status = await new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('close', resolve);
      });
      assert.equal(status, 0, output);
      assert.match(output, /chat received/);
      assert.deepEqual(received.slice(0, 2), [
        { type: 'loginreq', roomid: '6979222' },
        { type: 'joingroup', rid: '6979222', gid: '-9999' },
      ]);
    } finally {
      for (const ws of server.clients) ws.terminate();
      await new Promise((resolve) => server.close(resolve));
    }
  });
}

test('CLI starts and converts a JSONL recording to ASS', () => {
  const cli = join(root, 'dist/cli/cmd.js');
  const help = spawnSync(process.execPath, [cli, 'listen', '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /--no-resolve-room-id/);
  const dir = mkdtempSync(join(tmpdir(), 'douyudm-cli-'));
  try {
    const input = join(dir, 'record.jsonl');
    const output = join(dir, 'record.ass');
    writeFileSync(
      input,
      [
        { __meta: 'douyudm-record', version: 1, rid: '6979222', startedAt: 1000 },
        { ts: 2000, type: 'chatmsg', txt: 'entrypoint check' },
      ]
        .map(JSON.stringify)
        .join('\n') + '\n',
    );
    const result = spawnSync(process.execPath, [cli, 'convert', input, '-o', output], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(readFileSync(output, 'utf8'), /Dialogue:.*entrypoint check/);
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test('published TypeScript entry exists and type-checks as a package import', () => {
  const dir = mkdtempSync(join(root, 'node_modules/.douyudm-types-'));
  try {
    const source = join(dir, 'check.mts');
    writeFileSync(
      source,
      `import { Client, STT } from 'douyudm';
      const client = new Client(6657, { resolveRoomId: true });
      client.on('chatmsg', message => { STT.serialize(message); });
      client.close();`,
    );
    const result = spawnSync(
      process.execPath,
      [
        join(root, 'node_modules/typescript/bin/tsc'),
        '--noEmit',
        '--strict',
        '--skipLibCheck',
        '--target',
        'ES2020',
        '--module',
        'NodeNext',
        '--moduleResolution',
        'NodeNext',
        source,
      ],
      { encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
  } finally {
    rmSync(dir, { recursive: true });
  }
});
