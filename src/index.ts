import type {
  IWebSocket,
  ILogger,
  IClient,
  ClientOptions,
  ClientEventName,
  ClientEventHandler,
  MessageEventType,
  STTObject,
  WebSocketFactory,
} from './types';
import { STT } from './core/stt';
import { Packet } from './core/packet';
import { HEARTBEAT_INTERVAL } from './core/config';
import { NoOpLogger } from './utils/noop-logger';
import { createDefaultMessageEvents, type MessageHandler, type MessageEventMap } from './events/messageEvent';

export { STT } from './core/stt';
export { Packet } from './core/packet';
export type {
  STTValue,
  STTObject,
  STTArray,
  IWebSocket,
  IClient,
  ILogger,
  ClientOptions,
  ClientEventName,
  ClientEventHandler,
  MessageEventType,
  WebSocketFactory,
  ChatMsg,
  LoginRes,
  UEnter,
} from './types';

function defaultWsFactory(url: string): IWebSocket {
  // Browser: native WebSocket
  if (typeof WebSocket !== 'undefined') {
    return new WebSocket(url) as unknown as IWebSocket;
  }
  // Node.js: ws package
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const WS = require('ws');
  return new WS(url) as unknown as IWebSocket;
}

const DANMU_PORTS = [8501, 8502, 8503, 8504, 8505, 8506];

function randomPort(): number {
  return DANMU_PORTS[Math.floor(Math.random() * DANMU_PORTS.length)];
}

export class Client implements IClient {
  readonly roomId: string | number;

  private _ws: IWebSocket | null = null;
  private _heartbeatTask: ReturnType<typeof setInterval> | null = null;
  private _debug: boolean;
  private _ignore: Set<MessageEventType>;
  private _logger: ILogger;
  private _wsFactory: WebSocketFactory;
  private _clientEvents: Record<ClientEventName, ClientEventHandler>;
  private _messageEvents: MessageEventMap;

  constructor(
    roomId: string | number,
    opts: ClientOptions = {},
    wsFactory?: WebSocketFactory,
    logger?: ILogger,
  ) {
    this.roomId = roomId;
    this._debug = opts.debug ?? false;
    this._ignore = new Set(opts.ignore ?? []);
    this._logger = logger ?? new NoOpLogger();
    this._wsFactory = wsFactory ?? defaultWsFactory;
    this._clientEvents = {
      connect: (_client) => {
        this._login();
        this._joinGroup();
        this._heartbeat();
      },
      disconnect: (_client) => {
        this._logout();
      },
      error: (_client, err) => {
        console.error(err);
      },
    };
    this._messageEvents = createDefaultMessageEvents();
  }

  on(event: ClientEventName, cb: ClientEventHandler): this;
  on(event: MessageEventType, cb: MessageHandler): this;
  on(event: ClientEventName | MessageEventType, cb: ClientEventHandler | MessageHandler): this {
    if (event === 'connect' || event === 'disconnect' || event === 'error') {
      const prev = this._clientEvents[event as ClientEventName];
      const next = cb as ClientEventHandler;
      this._clientEvents[event as ClientEventName] = (client, err) => {
        if (event === 'connect' || event === 'disconnect') {
          prev(client, err);
        }
        next(client, err);
      };
    } else {
      this._messageEvents[event as MessageEventType] = cb as MessageHandler;
    }
    return this;
  }

  run(url?: string): void {
    const port = randomPort();
    const wsUrl = url ?? `wss://danmuproxy.douyu.com:${port}/`;
    this._ws = this._wsFactory(wsUrl);

    this._ws.onopen = () => {
      this._clientEvents.connect(this);
    };

    this._ws.onerror = (event) => {
      this._clientEvents.error(this, event instanceof Error ? event : new Error(String(event)));
    };

    this._ws.onclose = () => {
      this._clientEvents.disconnect(this);
    };

    this._ws.onmessage = (event) => {
      this._messageHandle(event.data as ArrayBuffer);
    };
  }

  send(message: STTObject): void {
    if (!this._ws) throw new Error('Not connected');
    this._ws.send(Packet.encode(STT.serialize(message)));
  }

  private _login(): void {
    this.send({ type: 'loginreq', roomid: String(this.roomId) });
  }

  private _joinGroup(): void {
    this.send({ type: 'joingroup', rid: String(this.roomId), gid: '-9999' });
  }

  private _heartbeat(): void {
    this._heartbeatTask = setInterval(() => {
      this.send({ type: 'mrkl' });
    }, HEARTBEAT_INTERVAL * 1000);
  }

  private _logout(): void {
    if (this._ws) {
      this.send({ type: 'logout' });
    }
    if (this._heartbeatTask !== null) {
      clearInterval(this._heartbeatTask);
      this._heartbeatTask = null;
    }
  }

  private _messageHandle(data: unknown): void {
    // Packet.decode accepts any buffer-like (ArrayBuffer, Buffer, Uint8Array)
    const buf = data as ArrayBuffer;

    Packet.decode(buf, (raw) => {
      const r = STT.deserialize(raw) as STTObject;

      if (this._debug) {
        this._logger.write(String(r.type), raw);
      }

      const type = String(r.type) as MessageEventType;
      if (!this._ignore.has(type)) {
        const handler = this._messageEvents[type];
        if (handler) handler(r, this);
      }
    });
  }
}

export default Client;
