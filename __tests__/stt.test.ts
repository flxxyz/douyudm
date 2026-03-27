import { STT } from '../src/core/stt';
import type { STTObject } from '../src/types';

// ─── Test fixtures (real Douyu protocol messages) ─────────────────────────────
const fixtures: Record<string, string> = {
  mrkl: 'type@=mrkl/',
  pingreq: 'type@=pingreq/tick@=1592335920516/',
  loginres:
    'type@=loginres/userid@=0/roomgroup@=0/pg@=0/sessionid@=0/username@=/nickname@=/live_stat@=0/is_illegal@=0/ill_ct@=/ill_ts@=0/now@=0/ps@=0/es@=0/it@=0/its@=0/npv@=0/best_dlev@=0/cur_lev@=0/nrc@=528853104/ih@=0/sid@=75381/sahf@=0/sceneid@=0/newrg@=0/regts@=0/ip@=114.85.109.133/',
  chatmsg:
    'type@=chatmsg/rid@=102965/ct@=14/uid@=36216769/nn@=小老弟233/txt@=注意保暖/cid@=00bd3553ee494c929f45090100000000/ic@=avb8cbb3ff89cb026d88f/level@=38/sahf@=0/nl@=1/col@=1/rg@=4/cst@=1609614129227/bnn@=拒绝R/bl@=21/brid@=102965/hc@=d48b0bb9/ifs@=1/el@=/lk@=/fl@=21/urlev@=18/dms@=5/pdg@=49/pdk@=7/ext@=/',
  uenter:
    'type@=uenter/rid@=3898464/uid@=199997189/nn@=tiara佳尊/level@=40/ic@=avatar_v3@S201902@S2ef75ae27685acd22b2ba05379012994/rni@=0/el@=eid@AA=1500000113@ASetp@AA=1@ASsc@AA=1@ASef@AA=0@AS@S/sahf@=0/wgei@=0/',
  upgrade:
    'type@=upgrade/uid@=37716512/rid@=3898464/gid@=32533/nn@=月的星晨/level@=63/ic@=avatar_v3@S202007@Sbd33d5c01c034ba1835724b88836ecc5/sahf@=0/',
  spbc:
    'type@=spbc/sn@=我戒了专心/dn@=Ana丷/gn@=飘雪火箭/gc@=1/drid@=9157198/gs@=0/gb@=0/es@=1/gfid@=21196/eid@=21062/bgl@=3/ifs@=-1253966326/rid@=0/gid@=0/bid@=106001_1609565923_87841/sid@=392929380/cl2@=270/eic@=20674/bbi@=21062/from@=2/gpf@=1/pid@=1269/shid@=46114580/shn@=Ana丷/',
  dgb: 'type@=dgb/rid@=3898464/gfid@=824/gs@=0/uid@=176432111/nn@=户外就是锻炼/ic@=avanew@Sface@S201711@S08@S19@Sdee5e04ca606c4d8de09cd6512e2dd87/eid@=0/eic@=20052/level@=32/dw@=0/gfcnt@=1/hits@=5/bcnt@=5/bst@=2/ct@=1/el@=eid@AA=1500000113@ASetp@AA=1@ASsc@AA=1@ASef@AA=0@AS@S/cm@=0/bnn@=网时代/bl@=17/brid@=2790482/hc@=cd1f1db66e6acbb2c635802d56dd5bf5/sahf@=0/fc@=0/gpf@=1/pid@=268/bnid@=1/bnl@=1/receive_uid@=63235379/receive_nn@=桃桃桃桃子宝宝/from@=2/pfm@=32680/pma@=182896389/mss@=182896397/',
  rankup:
    'type@=rankup/rid@=3898464/gid@=0/drid@=3898464/rt@=0/bt@=1/sz@=3/uid@=37716512/nk@=月的星晨/rkt@=1/rn@=10/flag@=1/',
  blab: 'type@=blab/uid@=10043277/nn@=Biu丶水瓶/lbl@=1/bl@=3/ba@=1/bnn@=桃憨憨/rid@=3898464/',
  synexp:
    'type@=synexp/o_exp@=1468216348/o_lev@=56/o_minexp@=1404500000/o_upexp@=36283652/rid@=3898464/',
  wirt: 'type@=wirt/uid@=2810993/nick@=主播杨树/pos@=5/rid@=703747/',
  anbc: 'type@=anbc/rid@=0/gid@=0/bt@=1/uid@=15048751/hrp@=1/unk@=对影子说爱你丶/uic@=avatar_v3@S202012@S53e8ba245fc34ee89ac4fb3fd085ea60/drid@=9112612/donk@=是温清呀/nl@=4/ts@=1609566459/fov@=1/',
  ro_game_succ:
    'type@=ro_game_succ/rid@=3898464/nn@=桃桃桃桃子宝宝/uid@=37716512/unn@=月的星晨/gid@=1252/gnn@=冰雪魔杖/gnum@=2/send@=1/',
  tsgs: 'type@=tsgs/rid@=3898464/rpt@=102/sid@=37716512/snk@=月的星晨/did@=10043277/dnk@=Biu丶水瓶/silver@=83/lt@=0/lk@=0/',
  tsboxb:
    'type@=tsboxb/rid@=3898464/rpid@=64779131/rpt@=102/sid@=37716512/snk@=月的星晨/sic@=avatar_v3@S202007@Sbd33d5c01c034ba1835724b88836ecc5/tm@=1609566327/ot@=1609566510/dt@=1609566630/sd@=3/from@=2/',
  cthn: 'type@=cthn/rid@=0/gid@=0/cl@=2/cid@=270/uid@=211314350/nl@=0/unk@=眼镜蛇8/drid@=7646903/onk@=邹逸轩AyoM/chatmsg@=狗轩回来开播啦/ts@=1609566863/icon@=avatar_v3@S202012@Sc9f36527f8bd43bf843e81e5ff3fc8df/',
  rnewbc:
    'type@=rnewbc/rid@=0/gid@=0/bt@=1/uid@=36462031/unk@=跳跳/uic@=avatar_v3@S202012@S17fe62784f8b4e6ab10441ce2d66aaf7/drid@=430489/donk@=长沙乡村敢死队/nl@=9/',
};

// ─── escape / unescape ───────────────────────────────────────────────────────

describe('STT.escape', () => {
  it('escapes @ to @A', () => {
    expect(STT.escape('hello@world')).toBe('hello@Aworld');
  });

  it('escapes / to @S', () => {
    expect(STT.escape('hello/world')).toBe('hello@Sworld');
  });

  it('escapes both @ and / in order', () => {
    // @ must be escaped before / to avoid double-escaping
    expect(STT.escape('@/')).toBe('@A@S');
  });

  it('handles string with neither @ nor /', () => {
    expect(STT.escape('hello')).toBe('hello');
  });

  it('accepts numbers', () => {
    expect(STT.escape(42)).toBe('42');
  });

  it('accepts booleans', () => {
    expect(STT.escape(true)).toBe('true');
  });
});

describe('STT.unescape', () => {
  it('unescapes @S to /', () => {
    expect(STT.unescape('hello@Sworld')).toBe('hello/world');
  });

  it('unescapes @A to @', () => {
    expect(STT.unescape('hello@Aworld')).toBe('hello@world');
  });

  it('unescapes @S before @A to avoid double-unescaping', () => {
    expect(STT.unescape('@A@S')).toBe('@/');
  });

  it('handles string with neither @S nor @A', () => {
    expect(STT.unescape('hello')).toBe('hello');
  });
});

// ─── serialize ───────────────────────────────────────────────────────────────

describe('STT.serialize', () => {
  it('serializes a scalar string', () => {
    expect(STT.serialize('hello')).toBe('hello/');
  });

  it('serializes a number (via String coercion)', () => {
    expect(STT.serialize('42')).toBe('42/');
  });

  it('serializes a string with @ and / (escapes them)', () => {
    expect(STT.serialize('a@b/c')).toBe('a@Ab@Sc/');
  });

  it('serializes a flat object', () => {
    expect(STT.serialize({ type: 'mrkl' })).toBe('type@=mrkl/');
  });

  it('serializes a flat object with multiple keys', () => {
    const result = STT.serialize({ type: 'pingreq', tick: '123' });
    expect(result).toBe('type@=pingreq/tick@=123/');
  });

  it('serializes a nested object', () => {
    const result = STT.serialize({ el: { eid: '123', etp: '1' } });
    expect(result).toBe('el@=eid@=123/etp@=1/');
  });

  it('serializes an array of scalars', () => {
    const result = STT.serialize(['a', 'b']);
    expect(result).toBe('a/b/');
  });

  it('serializes an array of objects', () => {
    const result = STT.serialize([{ k: 'v1' }, { k: 'v2' }]);
    expect(result).toBe('k@=v1/k@=v2/');
  });

  it('serializes an empty array', () => {
    expect(STT.serialize([])).toBe('');
  });
});

// ─── deserialize ─────────────────────────────────────────────────────────────

describe('STT.deserialize', () => {
  it('deserializes a scalar string', () => {
    expect(STT.deserialize('hello')).toBe('hello');
  });

  it('deserializes scalar with unescape', () => {
    expect(STT.deserialize('@Aworld')).toBe('@world');
  });

  it('deserializes a simple object', () => {
    expect(STT.deserialize('type@=mrkl/')).toEqual({ type: 'mrkl' });
  });

  it('deserializes object with multiple keys', () => {
    expect(STT.deserialize('type@=pingreq/tick@=123/')).toEqual({
      type: 'pingreq',
      tick: '123',
    });
  });

  it('deserializes an array (// separator)', () => {
    const result = STT.deserialize('type@=mrkl///type@=pingreq/tick@=123//');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([{ type: 'mrkl' }, { type: 'pingreq', tick: '123' }]);
  });

  it('deserializes nested object (value contains @=)', () => {
    // When a value itself contains @=, it is recursively deserialized as an object.
    // The STT encoding of { a: { b: 'c' } } is: a@=b@=c/
    // But in round-trip, split('/') treats 'a@=b@=c' as one entry, giving { a: { b: 'c' } }.
    // However 'el@=eid@=123/etp@=1/' splits as ['el@=eid@=123','etp@=1'],
    // making el and etp sibling keys (el's value is deserialized from 'eid@=123' → {eid:'123'}).
    const result = STT.deserialize('el@=eid@=123/etp@=1/') as STTObject;
    expect(result.etp).toBe('1');
    expect(result.el).toEqual({ eid: '123' });
  });

  it('produces empty string for missing value (v ? ... : "")', () => {
    // "key@=/" splits to ["key@="], after split('/') and filter: k="key", v=""
    const result = STT.deserialize('key@=/') as STTObject;
    expect(result.key).toBe('');
  });

  it('deserializes loginres with empty username/nickname fields', () => {
    const result = STT.deserialize('type@=loginres/username@=/nickname@=/') as STTObject;
    expect(result.username).toBe('');
    expect(result.nickname).toBe('');
  });
});

// ─── round-trip tests with real protocol fixtures ─────────────────────────────

describe('STT round-trip (real protocol fixtures)', () => {
  for (const [key, value] of Object.entries(fixtures)) {
    it(`round-trips ${key}`, () => {
      const parsed = STT.deserialize(value);
      const reserialized = STT.serialize(parsed);
      expect(reserialized).toBe(value);
    });
  }
});

// ─── known protocol quirks ────────────────────────────────────────────────────

describe('STT known protocol quirks', () => {
  it('qausrespond: duplicate key "rid" — last value wins (server-side quirk)', () => {
    const raw = 'rid@=3898464/sc@=1311900/sctn@=0/rid@=-1/type@=qausrespond/';
    const result = STT.deserialize(raw) as STTObject;
    // The second rid@=-1 overwrites the first rid@=3898464
    expect(result.rid).toBe('-1');
    expect(result.type).toBe('qausrespond');
    // Round-trip is NOT expected to match original because duplicate key is lost
    const reserialized = STT.serialize(result);
    expect(reserialized).not.toBe(raw);
  });

  it('rri: starts without type key, has duplicate "rid" — last value wins', () => {
    const raw = 'uid@=63235379/rid@=3898464/cate_id@=1/rid@=-1/ri@=sc@A=107844200@Sidx@A=26@S/type@=rri/';
    const result = STT.deserialize(raw) as STTObject;
    expect(result.rid).toBe('-1');
    expect(result.type).toBe('rri');
  });
});
