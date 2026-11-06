import type {
  IWebSocket,
  IClient,
  ClientOptions,
  ClientEventName,
  ClientEventHandler,
  MessageEventType,
  STTObject,
  WebSocketFactory,
  RoomIdResolver,
} from './types';
import { STT } from './core/stt';
import { Packet } from './core/packet';
import { HEARTBEAT_INTERVAL } from './core/config';
import { normalizeRoomId, resolveRoomId } from './core/room';
import { createDefaultMessageEvents, type MessageHandler, type MessageEventMap } from './events/messageEvent';

export { STT } from './core/stt';
export { Packet } from './core/packet';
export { resolveRoomId } from './core/room';
export * from './core/danmaku';
export type {
  STTValue,
  STTObject,
  STTArray,
  IWebSocket,
  IClient,
  ClientOptions,
  ClientEventName,
  ClientEventHandler,
  MessageEventType,
  WebSocketFactory,
  RoomIdResolver,
  ChatMsg,
  LoginRes,
  UEnter,
  RecordMeta,
  RecordedMessage,
  ParsedRecord,
  ConvertWindow,
  FilterScript,
  FilterRules,
  DanmakuItem,
  LayoutConfig,
  PositionedDanmaku,
  AssOptions,
} from './types';

function defaultWsFactory(url: string): IWebSocket {
  // Node.js: always use ws package (Node v21+ has built-in WebSocket via undici
  // but its onmessage event.data is Blob, not Buffer — incompatible with our Packet decoder)
  if (typeof process !== 'undefined' && process.versions?.node) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WS = require('ws');
    return new WS(url) as unknown as IWebSocket;
  }
  // Browser: native WebSocket
  return new WebSocket(url) as unknown as IWebSocket;
}

export const DANMU_PORTS = [8501, 8502, 8503, 8504, 8505, 8506];

function shuffledPorts(): number[] {
  const ports = [...DANMU_PORTS];
  for (let i = ports.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ports[i], ports[j]] = [ports[j], ports[i]];
  }
  return ports;
}

const WS_CONNECTING = 0;
const WS_OPEN = 1;

/** ws 的 ErrorEvent / DOM ErrorEvent / Error / 其他值统一转 Error（String(event) 会得到无用的 "[object Object]"） */
function toError(event: unknown): Error {
  if (event instanceof Error) return event;
  if (typeof event === 'object' && event !== null) {
    const e = event as { error?: unknown; message?: unknown };
    if (e.error instanceof Error) return e.error;
    if (e.message) return new Error(String(e.message));
  }
  return new Error(String(event));
}

export class Client implements IClient {
  readonly requestedRoomId: string | number;
  private _roomId: string | number;
  /** 解析成功后为真实 rid；解析前为传入的房间号。 */
  get roomId(): string | number { return this._roomId; }

  private _ws: IWebSocket | null = null;
  private _heartbeatTask: ReturnType<typeof setInterval> | null = null;
  private _ignore: Set<MessageEventType>;
  private _wsFactory: WebSocketFactory;
  private _userEvents: Record<ClientEventName, ClientEventHandler[]>;
  private _messageEvents: MessageEventMap;
  private _retries: number;
  private _retryDelay: number;
  private _retriesLeft = 0;
  private _retryTimer: ReturnType<typeof setTimeout> | null = null;
  private _portQueue: number[] = [];
  private _lastPort = 0;
  private _customUrl?: string;
  private _resolveRoomId?: boolean;
  private _roomIdResolver: RoomIdResolver;
  private _resolveController: AbortController | null = null;
  private _runId = 0;

  constructor(
    roomId: string | number,
    opts: ClientOptions = {},
    wsFactory?: WebSocketFactory,
  ) {
    this.requestedRoomId = this._roomId = roomId;
    this._resolveRoomId = opts.resolveRoomId;
    this._roomIdResolver = opts.roomIdResolver ?? resolveRoomId;
    if (opts.roomIdResolver && opts.resolveRoomId === undefined) this._resolveRoomId = true;
    this._ignore = new Set(opts.ignore ?? []);
    this._retries = opts.retries ?? 5;
    this._retryDelay = opts.retryDelay ?? 1000;
    this._wsFactory = wsFactory ?? defaultWsFactory;
    this._userEvents = { connect: [], disconnect: [], error: [] };
    this._messageEvents = createDefaultMessageEvents();
  }

  on(event: ClientEventName, cb: ClientEventHandler): this;
  on(event: MessageEventType, cb: MessageHandler): this;
  on(event: ClientEventName | MessageEventType, cb: ClientEventHandler | MessageHandler): this {
    if (event === 'connect' || event === 'disconnect' || event === 'error') {
      this._userEvents[event].push(cb as ClientEventHandler);
    } else {
      this._messageEvents[event as MessageEventType] = cb as MessageHandler;
    }
    return this;
  }

  run(url?: string): void {
    const runId = ++this._runId;
    this._resolveController?.abort();
    this._resolveController = null;
    this._cancelRetry();
    this._stopConnection();
    this._customUrl = url;
    this._retriesLeft = this._retries;
    this._portQueue = [];
    const shouldResolve = this._resolveRoomId ??
      (!url && typeof process !== 'undefined' && !!process.versions?.node);
    if (!shouldResolve) {
      this._roomId = this.requestedRoomId;
      this._connect();
      return;
    }
    const controller = new AbortController();
    this._resolveController = controller;
    // Promise 链也捕获自定义解析器同步抛出的异常。
    void Promise.resolve().then(() => {
      if (runId !== this._runId) return;
      return this._roomIdResolver(this.requestedRoomId, controller.signal);
    }).then((rid) => {
      if (runId !== this._runId) return;
      this._roomId = normalizeRoomId(rid!);
      this._resolveController = null;
      this._connect();
    }).catch((error: unknown) => {
      if (runId !== this._runId) return;
      this._resolveController = null;
      this._emit('error', toError(error));
    });
  }

  private _stopConnection(): void {
    // 重复连接：先拆掉旧连接，避免泄漏和旧 socket 事件串扰
    if (this._ws) {
      this._teardown(this._ws);
      this._ws = null;
    }
    if (this._heartbeatTask !== null) {
      clearInterval(this._heartbeatTask);
      this._heartbeatTask = null;
    }
  }

  private _connect(): void {
    this._stopConnection();
    const wsUrl = this._customUrl ?? `wss://danmuproxy.douyu.com:${this._nextPort()}/`;
    const ws = this._wsFactory(wsUrl);
    this._ws = ws;
    let opened = false;

    // 每个回调先检查触发事件的 socket 还是不是当前这个（this._ws === ws），
    // 不是就忽略——换连接后旧 socket 迟到的事件不会串进来
    ws.onopen = () => {
      if (this._ws !== ws) return;
      opened = true;
      this._emit('connect');
    };

    // 建连前失败（斗鱼部分端口对部分网络直接 RST）：静默换端口重试，
    // 耗尽后才向用户 emit。建连后的错误/断开不重试（断线重连不在此 feature 范围）。
    ws.onerror = (event) => {
      if (this._ws !== ws) return;
      if (!opened && this._scheduleRetry(ws)) return;
      this._emit('error', toError(event));
    };

    ws.onclose = () => {
      if (this._ws !== ws) return;
      // RST 可能只触发 close 不触发 error，同样走重试
      if (!opened && this._scheduleRetry(ws)) return;
      this._ws = null;
      this._emit('disconnect');
    };

    ws.onmessage = (event) => {
      if (this._ws !== ws) return;
      const data = event.data;
      if (data instanceof Blob) {
        data.arrayBuffer().then((buf) => {
          if (this._ws === ws) this._messageHandle(buf);
        });
      } else {
        this._messageHandle(data as ArrayBuffer);
      }
    };
  }

  /** 还有剩余次数就关掉失败的 socket、定时发起下一次连接，返回 true（调用方不向用户报错）。
   *  _ws 置 null 后，这个 socket 后续再触发的 error/close 会因"不是当前 socket"被忽略，
   *  所以一次失败即使先后触发 error 和 close，也只消耗一次重试机会 */
  private _scheduleRetry(ws: IWebSocket): boolean {
    if (this._retriesLeft <= 0) return false;
    this._retriesLeft--;
    this._teardown(ws);
    this._ws = null;
    this._retryTimer = setTimeout(() => {
      this._retryTimer = null;
      this._connect();
    }, this._retryDelay);
    return true;
  }

  private _cancelRetry(): void {
    if (this._retryTimer !== null) {
      clearTimeout(this._retryTimer);
      this._retryTimer = null;
    }
  }

  /** 按随机排好的顺序取端口，一轮内不重复；6 个都用过就重排一轮，
   *  新一轮的第一个不取刚失败的那个 */
  private _nextPort(): number {
    if (this._portQueue.length === 0) {
      this._portQueue = shuffledPorts();
      if (this._portQueue[0] === this._lastPort) {
        this._portQueue.push(this._portQueue.shift() as number);
      }
    }
    const port = this._portQueue.shift() as number;
    this._lastPort = port;
    return port;
  }

  send(message: STTObject): void {
    if (!this._ws) throw new Error('Not connected');
    this._ws.send(Packet.encode(STT.serialize(message)));
  }

  close(): void {
    ++this._runId;
    this._resolveController?.abort();
    this._resolveController = null;
    this._cancelRetry();
    this._logout();
    const ws = this._ws;
    if (!ws) return;
    if (ws.readyState === WS_CONNECTING) {
      // 连接未建立：直接拆除。ws 库在 close-before-established 时会 emit 'error'，
      // 不吞掉会向用户抛出无意义的错误事件
      this._teardown(ws);
      this._ws = null;
      return;
    }
    // 已建立（或关闭中）的连接：不立刻置空，close 帧完成后 onclose 里统一清理并触发 disconnect
    ws.close();
  }

  /** 解绑事件并关闭 socket；onerror 换成空函数而不是 null——
   *  ws 在 close-before-established 时 emit 'error'，无监听器会崩掉进程 */
  private _teardown(ws: IWebSocket): void {
    ws.onopen = ws.onclose = ws.onmessage = null;
    ws.onerror = () => {};
    ws.close();
  }

  private _emit(event: ClientEventName, err?: Error): void {
    if (event === 'connect') {
      this._login();
      this._joinGroup();
      this._heartbeat();
    } else if (event === 'disconnect') {
      this._logout();
    }

    const handlers = this._userEvents[event];
    if (event === 'error' && handlers.length === 0) {
      console.error(err);
      return;
    }
    for (const handler of handlers) {
      handler(this, err);
    }
  }

  private _login(): void {
    this.send({ type: 'loginreq', roomid: String(this.roomId) });
  }

  private _joinGroup(): void {
    this.send({ type: 'joingroup', rid: String(this.roomId), gid: '-9999' });
  }

  private _heartbeat(): void {
    if (this._heartbeatTask !== null) clearInterval(this._heartbeatTask);
    this._heartbeatTask = setInterval(() => {
      // socket 非 OPEN 时跳过（连接切换/关闭的窗口期，send 会抛异常）
      if (this._ws && (this._ws.readyState === undefined || this._ws.readyState === WS_OPEN)) {
        this.send({ type: 'mrkl' });
      }
    }, HEARTBEAT_INTERVAL * 1000);
  }

  private _logout(): void {
    // readyState 缺省（自定义 factory 未实现）视为 OPEN；CONNECTING/CLOSING/CLOSED 时发 send 会抛异常
    if (this._ws && (this._ws.readyState === undefined || this._ws.readyState === WS_OPEN)) {
      this.send({ type: 'logout' });
    }
    if (this._heartbeatTask !== null) {
      clearInterval(this._heartbeatTask);
      this._heartbeatTask = null;
    }
  }

  private _messageHandle(data: unknown): void {
    const buf = data as ArrayBuffer;

    Packet.decode(buf, (raw) => {
      const r = STT.deserialize(raw) as STTObject;

      const type = String(r.type) as MessageEventType;
      if (!this._ignore.has(type)) {
        const handler = this._messageEvents[type];
        if (handler) handler(r, this);
      }
    });
  }
}

export default Client;
