// ─── STT Types ───────────────────────────────────────────────────────────────

export type STTValue = string | STTObject | STTArray;
export interface STTObject {
  [key: string]: STTValue;
}
export type STTArray = STTValue[];

export type PacketDecodeCallback = (message: string) => void;

// ─── Message Event Types ──────────────────────────────────────────────────────

export type MessageEventType =
  | 'loginres' | 'chatmsg' | 'uenter' | 'upgrade' | 'rss'
  | 'bc_buy_deserve' | 'ssd' | 'spbc' | 'dgb' | 'onlinegift'
  | 'ggbb' | 'rankup' | 'ranklist' | 'mrkl' | 'erquizisn'
  | 'blab' | 'rri' | 'synexp' | 'noble_num_info' | 'gbroadcast'
  | 'qausrespond' | 'wiru' | 'wirt' | 'mcspeacsite' | 'rank_change'
  | 'srres' | 'anbc' | 'frank' | 'nlkstatus' | 'pandoraboxinfo'
  | 'ro_game_succ' | 'lucky_wheel_star_pool' | 'tsgs' | 'fswrank'
  | 'tsboxb' | 'cthn' | 'configscreen' | 'rnewbc';

export type ClientEventName = 'connect' | 'disconnect' | 'error';

export interface IClient {
  readonly roomId: string | number;
  send(message: STTObject): void;
  close(): void;
}

export type ClientEventHandler = (client: IClient, err?: Error) => void;

// ─── Client Options ───────────────────────────────────────────────────────────

export interface ClientOptions {
  ignore?: MessageEventType[];
}

// ─── WebSocket Abstraction ────────────────────────────────────────────────────

export interface IWebSocket {
  send(data: ArrayBuffer | Uint8Array): void;
  close(): void;
  onopen: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onclose: ((event: unknown) => void) | null;
  onmessage: ((event: { data: ArrayBuffer | Buffer }) => void) | null;
}

export type WebSocketFactory = (url: string) => IWebSocket;

// ─── Message Shapes ───────────────────────────────────────────────────────────

export interface ChatMsg extends STTObject {
  type: string;
  rid: string;
  uid: string;
  nn: string;
  txt: string;
  cid: string;
  level: string;
}

export interface LoginRes extends STTObject {
  type: string;
  userid: string;
  roomgroup: string;
  sessionid: string;
  username: string;
  nickname: string;
}

export interface UEnter extends STTObject {
  type: string;
  rid: string;
  uid: string;
  nn: string;
  level: string;
}
