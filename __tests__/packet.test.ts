import { Packet } from '../src/core/packet';
import { STT } from '../src/core/stt';

// Legacy reference encoder (from test/old/BufferCoder.js)
function legacyEncode(data: string): ArrayBuffer {
  const encoder = new TextEncoder();
  const body = new Uint8Array([...encoder.encode(data), 0]);
  const messageLength = body.length + 8;
  const buf = new ArrayBuffer(body.length + 12);
  const view = new DataView(buf);
  view.setUint32(0, messageLength, true);
  view.setUint32(4, messageLength, true);
  view.setInt16(8, 689, true);
  view.setInt16(10, 0, true);
  new Uint8Array(buf).set(body, 12);
  return buf;
}

function arrayBuffersEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) return false;
  const va = new Uint8Array(a);
  const vb = new Uint8Array(b);
  return va.every((byte, i) => byte === vb[i]);
}

const testMsg = STT.serialize({
  type: 'chatmsg',
  rid: '3898464',
  ct: '1',
  uid: '148225335',
  nn: '套你个猴碎碎宝宝',
  txt: '感觉你家里里有人[宝宝][宝宝][宝宝]',
  cid: 'c58f68064dff4503e596fd0000000000',
  level: '28',
});

describe('Packet.encode', () => {
  it('produces identical bytes as legacy encoder', () => {
    const newBuf = Packet.encode(testMsg);
    const legacyBuf = legacyEncode(testMsg);
    expect(arrayBuffersEqual(newBuf, legacyBuf)).toBe(true);
  });

  it('starts with correct header (message length, typeCode=689)', () => {
    const buf = Packet.encode('type@=mrkl/');
    const dv = new DataView(buf);
    const bodyLen = new TextEncoder().encode('type@=mrkl/').length + 1; // +1 null byte
    const expectedLen = bodyLen + 8; // 4+4 of header size fields
    expect(dv.getUint32(0, true)).toBe(expectedLen);
    expect(dv.getUint32(4, true)).toBe(expectedLen);
    expect(dv.getInt16(8, true)).toBe(689);
    expect(dv.getInt16(10, true)).toBe(0);
  });
});

describe('Packet.decode', () => {
  it('decodes a single message', () => {
    const encoded = legacyEncode('type@=mrkl/');
    const results: string[] = [];
    Packet.decode(encoded, (msg) => results.push(msg));
    expect(results).toEqual(['type@=mrkl/']);
  });

  it('decodes multiple concatenated messages', () => {
    const loginres = 'type@=loginres/userid@=0/pg@=0/';
    const pingreq = 'type@=pingreq/tick@=1592335920516/';
    const a = new Uint8Array(legacyEncode(loginres));
    const b = new Uint8Array(legacyEncode(pingreq));
    const combined = new ArrayBuffer(a.length + b.length);
    const combined8 = new Uint8Array(combined);
    combined8.set(a, 0);
    combined8.set(b, a.length);

    const results: string[] = [];
    Packet.decode(combined, (msg) => results.push(msg));
    expect(results).toEqual([loginres, pingreq]);
  });

  it('round-trips encode then decode', () => {
    const original = 'type@=chatmsg/rid@=102965/nn@=user/txt@=hello/';
    const encoded = Packet.encode(original);
    const results: string[] = [];
    Packet.decode(encoded, (msg) => results.push(msg));
    expect(results).toEqual([original]);
  });

  it('handles Node.js Buffer input', () => {
    const encoded = Buffer.from(new Uint8Array(legacyEncode('type@=mrkl/')));
    const results: string[] = [];
    Packet.decode(encoded, (msg) => results.push(msg));
    expect(results).toEqual(['type@=mrkl/']);
  });

  it('returns early if buffer is too small to read length', () => {
    const tiny = new ArrayBuffer(3);
    const results: string[] = [];
    Packet.decode(tiny, (msg) => results.push(msg));
    expect(results).toHaveLength(0);
  });
});

describe('Packet legacy aliases', () => {
  it('Packet.Encode is same as Packet.encode', () => {
    expect(Packet.Encode).toBe(Packet.encode);
  });

  it('Packet.Decode is same as Packet.decode', () => {
    expect(Packet.Decode).toBe(Packet.decode);
  });
});

describe('Packet internal coverage', () => {
  it('decode returns early when buffer is truncated mid-packet (byteLength < readLength)', () => {
    // Build a valid packet then truncate it — decode should return without calling callback
    const full = new Uint8Array(Packet.encode('type@=mrkl/'));
    // Remove last 3 bytes to make it incomplete
    const truncated = full.slice(0, full.length - 3).buffer;
    const results: string[] = [];
    Packet.decode(truncated, (msg) => results.push(msg));
    expect(results).toHaveLength(0);
  });

  it('decode handles ArrayBuffer input (toArrayBuffer instanceof ArrayBuffer branch)', () => {
    const encoded = Packet.encode('type@=mrkl/');
    // encoded is a plain ArrayBuffer — hits the `instanceof ArrayBuffer` return early branch
    const results: string[] = [];
    Packet.decode(encoded, (msg) => results.push(msg));
    expect(results).toEqual(['type@=mrkl/']);
  });
});
