// 柳津の七日堂裸まいり「縄のぼり」（4章 会津・10/7 本人「アトラクションはもっと増やして」「新しい遊び方を少しずつ」→「柳津：七日堂裸まいり」）
// 確かめた事（10/7 ネット）：毎年1月7日の夜、合図の鐘で 下帯姿の男たちが 113段の石段を 駆け上がり、圓藏寺の本堂の 鰐口から 下がる 麻縄を よじ登る。無病息災を願う
// 遊び方：「左手」「右手」を 交互に さわると 縄を のぼる。同じ手を 続けると ずり落ちる。手を 止めると じわじわ 下がる。時間内に 鰐口まで 届けば おまけ
// 計算は画面と切り離す（画面は FieldScene の startHadaka）。高さ h は 0（床）〜1（鰐口）
import { exchangePrize } from './fishing.js?v=252';

export const ENTRY_PRICE = 20;
export const TIME_MS = 20000;
export const CLIMB = 0.045; // 正しく 交互に つかむと 上がる高さ（約23回で 鰐口）
export const SLIP = 0.06; // 同じ手を 続けると ずり落ちる
export const HOLD_MS = 700; // これより 長く 手を 止めると 下がりはじめる
export const SLIDE = 0.12; // 1秒あたりに 下がる高さ
export const TOP_BONUS = 5; // 鰐口に 届いた おまけ

export const newRound = () => ({ h: 0, last: null, tLast: 0, top: false, best: 0, slips: 0 });

// いまの高さ（手を 止めた分だけ 下がる）
export function heightAt(r, t) {
  if (r.top) return 1;
  const idle = Math.max(0, t - r.tLast - HOLD_MS);
  return Math.max(0, r.h - (idle / 1000) * SLIDE);
}
export const timeLeft = (r, t) => Math.max(0, TIME_MS - t);
export const roundDone = (r, t) => r.top || timeLeft(r, t) <= 0;

// さわった（side＝'L' か 'R'）
export function grab(r, side, t) {
  if (roundDone(r, t)) return { r, ok: false };
  const now = heightAt(r, t);
  const ok = side !== r.last;
  const h = ok ? Math.min(1, now + CLIMB) : Math.max(0, now - SLIP);
  const top = h >= 1;
  return { r: { ...r, h, last: side, tLast: t, top, best: Math.max(r.best, h), slips: r.slips + (ok ? 0 : 1) }, ok, top };
}

// 点＝のぼった いちばん高い所（10段）＋鰐口に 届いた おまけ
export const roundPts = (r) => Math.floor(r.best * 10 + 1e-9) + (r.top ? TOP_BONUS : 0);

export function enterRound(game) {
  if (game.mon < ENTRY_PRICE) return { ok: false, game };
  return { ok: true, game: { ...game, mon: game.mon - ENTRY_PRICE } };
}
export function addRope(game, r) {
  return { ...game, hadakaPts: (game.hadakaPts ?? 0) + roundPts(r), hadakaBest: Math.max(game.hadakaBest ?? 0, Math.round(r.best * 100)) };
}

// 景品＝4章の戦いで効く物。あわまんじゅう＝柳津の名物（福島グルメの判子）
export const HADAKA_PRIZES = {
  g_awaman: { kind: 'item', id: 'g_awaman', n: 1, pts: 5 },
  tokujou: { kind: 'item', id: 'tokujou', n: 1, pts: 4 },
  goshinsui: { kind: 'item', id: 'goshinsui', n: 1, pts: 6 },
  kusuribako: { kind: 'item', id: 'kusuribako', n: 1, pts: 9 },
};
export const exchangeHadaka = (game, prizeId, who = null) => exchangePrize(game, HADAKA_PRIZES[prizeId], 'hadakaPts', who);
