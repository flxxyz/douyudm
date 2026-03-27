import type { STTValue, STTObject, STTArray } from '../types';

export class STT {
  static escape(v: string | number | boolean): string {
    return String(v).replace(/@/g, '@A').replace(/\//g, '@S');
  }

  static unescape(v: string): string {
    return v.replace(/@S/g, '/').replace(/@A/g, '@');
  }

  static serialize(raw: STTValue): string {
    if (Array.isArray(raw)) {
      return (raw as STTArray).map((v) => STT.serialize(v)).join('');
    }
    if (typeof raw === 'object' && raw !== null) {
      return Object.entries(raw as STTObject)
        .map(([k, v]) => `${k}@=${STT.serialize(v)}`)
        .join('');
    }
    return STT.escape(String(raw)) + '/';
  }

  static deserialize(raw: string): STTValue {
    if (raw.includes('//')) {
      return raw
        .split('//')
        .filter((e) => e !== '')
        .map((item) => STT.deserialize(item));
    }

    if (raw.includes('@=')) {
      return raw
        .split('/')
        .filter((e) => e !== '')
        .reduce<STTObject>((o, s) => {
          const idx = s.indexOf('@=');
          const k = s.slice(0, idx);
          const v = s.slice(idx + 2);
          o[k] = v ? STT.deserialize(v) : '';
          return o;
        }, {});
    }

    return STT.unescape(raw);
  }
}
