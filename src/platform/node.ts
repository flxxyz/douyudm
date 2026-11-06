export { Client, default } from '../index';
export { STT } from '../core/stt';
export { Packet } from '../core/packet';
export * from '../core/danmaku';
export type {
  ClientOptions,
  IWebSocket,
  WebSocketFactory,
  MessageEventType,
  RecordMeta,
  RecordedMessage,
  ParsedRecord,
  ConvertWindow,
  FilterScript,
  FilterRules,
  DanmakuItem,
  AssOptions,
} from '../types';
