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
  | 'bc_buy_deserve' | 'ssd' | 'spbc' | 'dgb' | 'gdp' | 'onlinegift'
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
  /** 连接建立前失败的最大重试次数（自动轮换弹幕端口），0 关闭重试。默认 5 */
  retries?: number;
  /** 相邻两次连接尝试的间隔 ms。默认 1000 */
  retryDelay?: number;
  /** 连接前解析真实 rid。Node.js 默认开启，浏览器及自定义 WebSocket URL 默认关闭。 */
  resolveRoomId?: boolean;
}

// ─── WebSocket Abstraction ────────────────────────────────────────────────────

export interface IWebSocket {
  /** 0=CONNECTING 1=OPEN 2=CLOSING 3=CLOSED；可选以兼容自定义 factory，缺省视为 OPEN */
  readyState?: number;
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

// ─── Danmaku Record / ASS Convert ─────────────────────────────────────────────

/** 录制文件（JSONL）第一行的 meta 记录 */
export interface RecordMeta {
  __meta: 'douyudm-record';
  version: number;
  rid: string;
  /** 录制开始时刻 epoch ms，也是字幕 0 点 */
  startedAt: number;
}

/** 录制的一条消息：收到时刻 + JSON 化的原始 STT 字段 */
export interface RecordedMessage {
  /** 收到时刻 epoch ms */
  ts: number;
  /** 消息类型（chatmsg 等） */
  type: string;
  /** 弹幕文本（chatmsg 才有） */
  txt?: string;
  /** 发送者昵称 */
  nn?: string;
  [key: string]: unknown;
}

export interface ParsedRecord {
  meta: RecordMeta | null;
  messages: RecordedMessage[];
  /** 无法解析而被跳过的行数 */
  badLines: number;
}

/** RecordedMessage → 字幕时间轴的换算窗口 */
export interface ConvertWindow {
  /** 字幕 0 点 epoch ms（通常 = meta.startedAt） */
  zeroAt: number;
  /** 裁剪起点（秒，相对 zeroAt）；裁剪后字幕 0 点对齐到这里 */
  from?: number;
  /** 裁剪终点（秒，相对 zeroAt） */
  to?: number;
  /** 整体平移秒，可负 */
  delay?: number;
}

/** 过滤 hook：predicate（true 保留）或 batch（返回保留集合） */
export type FilterScript =
  | ((msg: RecordedMessage) => boolean | Promise<boolean>)
  | { batch: (msgs: RecordedMessage[]) => RecordedMessage[] | Promise<RecordedMessage[]> };

export interface FilterRules {
  /** 匹配 txt 即剔除 */
  text?: RegExp[];
  /** 匹配 nn 即剔除 */
  user?: RegExp[];
  script?: FilterScript;
}

/** 参与排版/渲染的最小弹幕单元 */
export interface DanmakuItem {
  /** 相对字幕 0 点的出现时刻（秒） */
  start: number;
  text: string;
}

export interface LayoutConfig {
  width: number;
  height: number;
  fontSize: number;
  /** 单条弹幕从进入到完全离开的秒数 */
  duration: number;
}

export interface PositionedDanmaku extends DanmakuItem {
  /** = start + duration */
  end: number;
  /** 估算像素宽 */
  width: number;
  x1: number;
  x2: number;
  y: number;
}

export interface AssOptions {
  width?: number;
  height?: number;
  fontSize?: number;
  fontName?: string;
  duration?: number;
  /** 0(全透明)~1(不透明)，默认 0.8 */
  opacity?: number;
}
