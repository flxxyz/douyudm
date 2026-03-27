import type { STTObject, MessageEventType } from '../types';
import { MSG_LIVE_ON, MSG_LIVE_OFF } from '../core/config';

export type MessageHandler = (r: STTObject) => void;
export type MessageEventMap = Partial<Record<MessageEventType, MessageHandler>>;

export function createDefaultMessageEvents(): MessageEventMap {
  return {
    loginres(_r) {
      console.log('[loginres]', '登录成功');
    },

    chatmsg(r) {
      const level = String(r.level ?? '');
      console.log('<lv %s> [%s]  %s', level + (Number(level) < 10 ? ' ' : ''), r.nn, r.txt);
    },

    uenter(r) {
      console.log(`欢迎<lv ${r.level}>${r.nn}进入了直播间`);
    },

    upgrade(_r) {},

    rss(r) {
      console.log('[开播提醒]', r.ss === '1' ? MSG_LIVE_ON : MSG_LIVE_OFF);
    },

    bc_buy_deserve(_r) {},
    ssd(_r) {},

    spbc(r) {
      console.log(`------------- 感谢[${r.sn}] 赠送的 ${r.gn}x${r.gc}`);
    },

    dgb(_r) {},

    onlinegift(r) {
      console.log(`------------- [${r.nn}] 领取鱼丸x${r.sil}`);
    },

    ggbb(_r) {},
    rankup(_r) {},
    ranklist(_r) {},
    mrkl(_r) {},
    erquizisn(_r) {},
    blab(_r) {},
    rri(_r) {},
    synexp(_r) {},
    noble_num_info(_r) {},
    gbroadcast(_r) {},
    qausrespond(_r) {},
    wiru(_r) {},
    wirt(_r) {},
    mcspeacsite(_r) {},
    rank_change(_r) {},
    srres(_r) {},
    anbc(_r) {},
    frank(_r) {},
    nlkstatus(_r) {},
    pandoraboxinfo(_r) {},
    ro_game_succ(_r) {},
    lucky_wheel_star_pool(_r) {},
    tsgs(_r) {},
    fswrank(_r) {},
    tsboxb(_r) {},
    cthn(_r) {},
    configscreen(_r) {},
    rnewbc(_r) {},
  };
}
