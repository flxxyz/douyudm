/**
 * Client 生命周期回归测试(2026-07 审查修复 1/2/5),使用 mock WebSocketFactory,无真实网络。
 */
import { Client, Packet, STT } from '../src/index';
import * as roomLookup from '../src/core/room';
import type { ClientOptions, IWebSocket, STTObject } from '../src/types';

class MockWS implements IWebSocket {
  readyState = 0; // CONNECTING
  sent: ArrayBuffer[] = [];
  closed = false;
  onopen: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onclose: ((event: unknown) => void) | null = null;
  onmessage: ((event: { data: ArrayBuffer | Buffer }) => void) | null = null;

  send(data: ArrayBuffer | Uint8Array): void {
    if (this.readyState !== 1) throw new Error(`send on readyState ${this.readyState}`);
    this.sent.push(data as ArrayBuffer);
  }

  close(): void {
    this.closed = true;
    const was = this.readyState;
    this.readyState = 3;
    if (was === 0) {
      // 模拟 ws 库行为:连接建立前 close 会 emit 'error';
      // 真实 EventEmitter 在无监听器时会崩掉进程,这里用 throw 等价模拟
      const err = new Error('WebSocket was closed before the connection was established');
      if (this.onerror) this.onerror(err);
      else throw err;
    }
    if (was !== 3 && this.onclose) this.onclose({});
  }

  // 测试辅助:模拟服务端完成握手
  open(): void {
    this.readyState = 1;
    if (this.onopen) this.onopen({});
  }

  sentTypes(): string[] {
    const types: string[] = [];
    for (const buf of this.sent) {
      Packet.decode(buf, (raw) => types.push(String((STT.deserialize(raw) as STTObject).type)));
    }
    return types;
  }
}

function makeClient(opts: ClientOptions = {}): { client: Client; sockets: MockWS[]; urls: string[] } {
  const sockets: MockWS[] = [];
  const urls: string[] = [];
  const client = new Client(9999, { resolveRoomId: false, ...opts }, (url) => {
    urls.push(url);
    const ws = new MockWS();
    sockets.push(ws);
    return ws;
  });
  return { client, sockets, urls };
}

describe('Client 生命周期', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('close() 在 CONNECTING 阶段不抛异常', () => {
    const { client, sockets } = makeClient();
    client.run();
    expect(sockets[0].readyState).toBe(0);
    expect(() => client.close()).not.toThrow();
    expect(sockets[0].closed).toBe(true);
    expect(sockets[0].sent).toHaveLength(0); // 未发出任何帧(含 logout)
  });

  test('close() 在 CONNECTING 阶段不向用户 error handler 派发噪音', () => {
    const { client, sockets } = makeClient();
    const onError = jest.fn();
    client.on('error', onError);
    client.run();
    client.close();
    expect(sockets[0].closed).toBe(true);
    expect(onError).not.toHaveBeenCalled();
  });

  test('第一条连接尚未建立时重复 run() 不崩溃(ws 会对未建立连接的 close emit error)', () => {
    const { client, sockets } = makeClient();
    client.run(); // socket0 停在 CONNECTING
    expect(() => client.run()).not.toThrow();
    expect(sockets[0].closed).toBe(true);
    expect(sockets).toHaveLength(2);
    client.close();
  });

  test('close() 在 OPEN 阶段发送 logout 并触发 disconnect', () => {
    const { client, sockets } = makeClient();
    const disconnected = jest.fn();
    client.on('disconnect', disconnected);
    client.run();
    sockets[0].open();
    client.close();
    expect(sockets[0].sentTypes()).toEqual(['loginreq', 'joingroup', 'logout']);
    expect(sockets[0].closed).toBe(true);
    expect(disconnected).toHaveBeenCalledTimes(1);
  });

  test('重复 run() 关闭旧连接,旧 socket 不再串扰新连接', () => {
    const { client, sockets } = makeClient();
    client.run();
    sockets[0].open();
    client.run();
    expect(sockets[0].closed).toBe(true);
    expect(sockets).toHaveLength(2);

    sockets[1].open();
    // 旧 socket 关闭事件不应向新连接发送 logout
    expect(sockets[1].sentTypes()).toEqual(['loginreq', 'joingroup']);
    client.close(); // 清理心跳 interval,否则 jest 不退出
  });

  test('重复 run() 心跳不叠加', () => {
    jest.useFakeTimers();
    const { client, sockets } = makeClient();
    client.run();
    sockets[0].open();
    client.run();
    sockets[1].open();

    jest.advanceTimersByTime(45_000);
    const mrkl = sockets[1].sentTypes().filter((t) => t === 'mrkl');
    expect(mrkl).toHaveLength(1); // 叠加则为 2
    client.close();
  });

  test('重复 run() 后新连接握手完成前,旧心跳不向 CONNECTING socket 发包', () => {
    jest.useFakeTimers();
    const { client, sockets } = makeClient();
    client.run();
    sockets[0].open(); // 心跳启动
    client.run(); // 新 socket 尚未 open
    expect(() => jest.advanceTimersByTime(90_000)).not.toThrow();
    expect(sockets[1].sent).toHaveLength(0);
    client.close();
  });

  test('服务端断开后心跳停止,不再向已关闭 socket 发送', () => {
    jest.useFakeTimers();
    const { client, sockets } = makeClient();
    client.run();
    sockets[0].open();
    sockets[0].close(); // 模拟服务端断开 → onclose
    const before = sockets[0].sent.length;
    expect(() => jest.advanceTimersByTime(90_000)).not.toThrow();
    expect(sockets[0].sent.length).toBe(before);
  });

  test('多个 error handler 全部触发(不再只有最后一个生效)', () => {
    const { client, sockets } = makeClient();
    const h1 = jest.fn();
    const h2 = jest.fn();
    client.on('error', h1).on('error', h2);
    client.run();
    sockets[0].open(); // 建连后的错误直接派发（建连前的会走端口重试）
    sockets[0].onerror?.(new Error('boom'));
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
    expect(h1.mock.calls[0][1]?.message).toBe('boom');
    client.close();
  });

  test('多个 connect handler 全部触发且内建登录流程照常', () => {
    const { client, sockets } = makeClient();
    const h1 = jest.fn();
    const h2 = jest.fn();
    client.on('connect', h1).on('connect', h2);
    client.run();
    sockets[0].open();
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
    expect(sockets[0].sentTypes()).toEqual(['loginreq', 'joingroup']);
    client.close();
  });

  test('无 error handler 时回退 console.error 且不抛出', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { client, sockets } = makeClient();
    client.run();
    sockets[0].open();
    expect(() => sockets[0].onerror?.(new Error('boom'))).not.toThrow();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
    client.close();
  });

  test('消息分发:收到 chatmsg 触发注册的 handler', () => {
    const { client, sockets } = makeClient();
    const onChat = jest.fn();
    client.on('chatmsg', onChat);
    client.run();
    sockets[0].open();
    sockets[0].onmessage?.({
      data: Packet.encode(STT.serialize({ type: 'chatmsg', nn: 'tester', txt: 'hi' })),
    });
    expect(onChat).toHaveBeenCalledTimes(1);
    expect(onChat.mock.calls[0][0]).toMatchObject({ type: 'chatmsg', nn: 'tester', txt: 'hi' });
    client.close();
  });
});

const portOf = (url: string): string => new URL(url).port;

describe('连接失败自动换端口重试', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test('建连前 error 静默重试:不向用户派发,换端口重连', () => {
    const { client, sockets, urls } = makeClient();
    const onError = jest.fn();
    client.on('error', onError);
    client.run();
    sockets[0].onerror?.(new Error('read ECONNRESET'));
    expect(onError).not.toHaveBeenCalled();
    expect(sockets).toHaveLength(1); // 重试在 delay 之后
    jest.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(2);
    expect(portOf(urls[1])).not.toBe(portOf(urls[0]));
    sockets[1].open(); // 重试成功,登录流程照常
    expect(sockets[1].sentTypes()).toEqual(['loginreq', 'joingroup']);
    expect(onError).not.toHaveBeenCalled();
    client.close();
  });

  test('建连前 close(RST 不触发 error 只触发 close)同样重试,且不派发 disconnect', () => {
    const { client, sockets } = makeClient();
    const onDisconnect = jest.fn();
    client.on('disconnect', onDisconnect);
    client.run();
    sockets[0].readyState = 3;
    sockets[0].onclose?.({});
    expect(onDisconnect).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(2);
    client.close();
  });

  test('同一失败 socket 的 error+close 只消耗一次重试', () => {
    const { client, sockets } = makeClient({ retries: 2 });
    client.run();
    sockets[0].onerror?.(new Error('rst'));
    sockets[0].onclose?.({}); // 已不是当前 socket,该事件被忽略,不额外消耗次数
    jest.advanceTimersByTime(1000);
    sockets[1].onerror?.(new Error('rst'));
    jest.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(3); // 1 初始 + 2 重试,恰好耗尽
    client.close();
  });

  test('重试耗尽后向用户 emit error 一次', () => {
    const { client, sockets } = makeClient({ retries: 1 });
    const onError = jest.fn();
    client.on('error', onError);
    client.run();
    sockets[0].onerror?.(new Error('rst-1'));
    jest.advanceTimersByTime(1000);
    sockets[1].onerror?.(new Error('rst-final'));
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][1]?.message).toBe('rst-final');
    jest.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(2); // 不再重试
  });

  test('retries: 0 关闭重试,保持旧行为立即派发', () => {
    const { client, sockets } = makeClient({ retries: 0 });
    const onError = jest.fn();
    client.on('error', onError);
    client.run();
    sockets[0].onerror?.(new Error('rst'));
    expect(onError).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(1);
  });

  test('重试等待期间 close() 取消挂起重试且不派发事件', () => {
    const { client, sockets } = makeClient();
    const onError = jest.fn();
    const onDisconnect = jest.fn();
    client.on('error', onError).on('disconnect', onDisconnect);
    client.run();
    sockets[0].onerror?.(new Error('rst'));
    client.close();
    jest.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(1);
    expect(onError).not.toHaveBeenCalled();
    expect(onDisconnect).not.toHaveBeenCalled();
  });

  test('重试等待期间再次 run() 取消旧重试并重置重试次数', () => {
    const { client, sockets } = makeClient({ retries: 1 });
    client.run();
    sockets[0].onerror?.(new Error('rst'));
    client.run(); // 立即重连,旧挂起重试作废
    expect(sockets).toHaveLength(2);
    jest.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(2);
    sockets[1].onerror?.(new Error('rst')); // 次数已重置,仍可重试
    jest.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(3);
    client.close();
  });

  test('连接建立后的 error/close 不触发重试(断线重连不在范围)', () => {
    const { client, sockets } = makeClient();
    const onDisconnect = jest.fn();
    client.on('disconnect', onDisconnect);
    client.run();
    sockets[0].open();
    sockets[0].close(); // 服务端断开
    expect(onDisconnect).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(1);
  });

  test('一轮重试内端口不重复,6 个端口各试一次', () => {
    const { client, sockets, urls } = makeClient();
    client.run();
    for (let i = 0; i < 5; i++) {
      sockets[i].onerror?.(new Error('rst'));
      jest.advanceTimersByTime(1000);
    }
    expect(sockets).toHaveLength(6);
    expect(new Set(urls.map(portOf)).size).toBe(6);
    client.close();
  });

  test('超过一轮后重新洗牌,且不紧接着重试刚失败的端口', () => {
    const { client, sockets, urls } = makeClient({ retries: 11 });
    client.run();
    for (let i = 0; i < 11; i++) {
      sockets[i].onerror?.(new Error('rst'));
      jest.advanceTimersByTime(1000);
    }
    expect(sockets).toHaveLength(12);
    expect(portOf(urls[6])).not.toBe(portOf(urls[5])); // 第二轮首个 ≠ 第一轮末个
    client.close();
  });

  test('自定义 url 重试沿用同一地址,不换端口', () => {
    const { client, sockets, urls } = makeClient({ retries: 2 });
    client.run('wss://my-proxy.example.com:9000/');
    sockets[0].onerror?.(new Error('rst'));
    jest.advanceTimersByTime(1000);
    expect(urls).toEqual([
      'wss://my-proxy.example.com:9000/',
      'wss://my-proxy.example.com:9000/',
    ]);
    client.close();
  });

  test('retryDelay 可配置', () => {
    const { client, sockets } = makeClient({ retryDelay: 5000 });
    client.run();
    sockets[0].onerror?.(new Error('rst'));
    jest.advanceTimersByTime(4999);
    expect(sockets).toHaveLength(1);
    jest.advanceTimersByTime(1);
    expect(sockets).toHaveLength(2);
    client.close();
  });
});

const flushResolution = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

describe('连接前解析靓号', () => {
  beforeEach(() => jest.spyOn(roomLookup, 'resolveRoomId').mockResolvedValue('6979222'));
  afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });
  test('登录、入组和 connect 回调均使用真实 rid', async () => {
    const resolver = jest.mocked(roomLookup.resolveRoomId).mockResolvedValue('6979222');
    const { client, sockets } = makeClient({ resolveRoomId: true });
    const connected = jest.fn();
    client.on('connect', connected);
    client.run();
    expect(sockets).toHaveLength(0);
    await flushResolution();
    sockets[0].open();
    const messages: STTObject[] = [];
    sockets[0].sent.forEach(buf => Packet.decode(buf, raw => messages.push(STT.deserialize(raw) as STTObject)));
    expect(messages).toEqual([
      { type: 'loginreq', roomid: '6979222' },
      { type: 'joingroup', rid: '6979222', gid: '-9999' },
    ]);
    expect(client.roomId).toBe('6979222');
    expect(connected.mock.calls[0][0].roomId).toBe('6979222');
    client.close();
  });

  test('close 中止解析并忽略迟到的结果', async () => {
    let finish!: (rid: string) => void;
    const resolver = jest.mocked(roomLookup.resolveRoomId).mockImplementation((_id, _signal) => new Promise<string>(resolve => { finish = resolve; }));
    const { client, sockets } = makeClient({ resolveRoomId: true });
    client.run();
    await flushResolution();
    client.close();
    expect(resolver.mock.calls[0][1]?.aborted).toBe(true);
    finish('6979222');
    await flushResolution();
    expect(sockets).toHaveLength(0);
  });

  test('重复 run 关闭旧连接且旧解析结果不会覆盖新结果', async () => {
    let finish!: (rid: string) => void;
    const resolver = jest.mocked(roomLookup.resolveRoomId).mockImplementationOnce(() => new Promise<string>(r => { finish = r; }))
      .mockResolvedValueOnce('6979222');
    const { client, sockets } = makeClient({ resolveRoomId: true });
    client.run();
    await flushResolution();
    client.run();
    await flushResolution();
    finish('123');
    await flushResolution();
    expect(sockets).toHaveLength(1);
    expect(client.roomId).toBe('6979222');
    client.run(); // 旧 socket 在新解析开始前关闭
    expect(sockets[0].closed).toBe(true);
    client.close();
    await flushResolution();
  });

  test('解析异常经 error 报告，不建立错误房间连接', async () => {
    jest.mocked(roomLookup.resolveRoomId).mockRejectedValue(new Error('lookup failed'));
    const { client, sockets } = makeClient({ resolveRoomId: true });
    const error = jest.fn();
    client.on('error', error);
    client.run();
    await flushResolution();
    expect(error).toHaveBeenCalledTimes(1);
    expect(sockets).toHaveLength(0);
    client.close();
  });

  test('被新 run 取消的解析错误不向用户派发', async () => {
    let fail!: (error: Error) => void;
    const resolver = jest.mocked(roomLookup.resolveRoomId).mockImplementationOnce(() => new Promise((_r, reject) => { fail = reject; }))
      .mockResolvedValue('6979222');
    const { client, sockets } = makeClient({ resolveRoomId: true });
    const error = jest.fn();
    client.on('error', error);
    client.run();
    await flushResolution();
    client.run();
    fail(new Error('aborted'));
    await flushResolution();
    expect(error).not.toHaveBeenCalled();
    expect(sockets).toHaveLength(1);
    client.close();
  });

  test('端口重试复用解析结果', async () => {
    jest.useFakeTimers();
    const resolver = jest.mocked(roomLookup.resolveRoomId).mockResolvedValue('6979222');
    const { client, sockets } = makeClient({ resolveRoomId: true });
    client.run();
    await flushResolution();
    sockets[0].onerror?.(new Error('rst'));
    jest.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(2);
    expect(resolver).toHaveBeenCalledTimes(1);
    expect(client.roomId).toBe('6979222');
    client.close();
    jest.useRealTimers();
  });

  test('显式关闭解析时不发起查询', () => {
    const resolver = jest.mocked(roomLookup.resolveRoomId);
    const { client, sockets } = makeClient({ resolveRoomId: false });
    client.run();
    expect(sockets).toHaveLength(1);
    expect(resolver).not.toHaveBeenCalled();
    client.close();
  });

  test('Node 默认解析，显式自定义 URL 默认不解析', async () => {
    jest.mocked(roomLookup.resolveRoomId).mockRestore();
    const original = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    global.fetch = fetchMock;
    try {
      const sockets: MockWS[] = [];
      const client = new Client(6657, {}, () => { const ws = new MockWS(); sockets.push(ws); return ws; });
      const error = jest.fn();
      client.on('error', error);
      client.run();
      await flushResolution();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalledTimes(1);
      expect(sockets).toHaveLength(0);
      client.run('wss://custom.example');
      expect(sockets).toHaveLength(1);
      client.close();
    } finally { global.fetch = original; }
  });
});
