// 須賀川の松明あかし「火移し」（3章のイベント・10/5 夜 本人「須賀川のイベント祭りが無い」→ 案「火移し」に「おＫ」）
// 遊び方：五老山に並ぶ 大松明（TORCHES 本）の上を、火の粉が 左右に ゆれて 動く。光っている松明の 真上に 火の粉が来た瞬間に さわると 点火。
//   はずすと 火の粉が 散って 残り時間が 2秒 減る。点けるたびに 火の粉が 少し速くなる。時間内に 何本 灯せるか。灯した1本で 松明点 1点・全部 灯すと おまけ
// 計算は画面と切り離す（画面は FieldScene の startTaimatsu）
import { exchangePrize } from './fishing.js?v=310';

export const ENTRY_PRICE = 15;
export const TORCHES = 10;
export const TIME_MS = 30000;
export const HALF = 0.05; // 当たりの幅（画面の幅に対する半分）
export const AMP = 0.42; // 火の粉の ゆれ幅
export const SPEED = 1.5; // ゆれの速さ（1秒あたりの角度）
export const SPEEDUP = 0.08; // 1本 灯すごとに 速くなる割合
export const ALL_BONUS = 3; // 全部 灯した おまけの点
export const MISS_MS = 2000; // はずすと 火の粉が 散って 残り時間が 減る（やみくもに さわり続けると すぐ 時間切れ＝10/5 夜 試験で 平均9本 灯った）

// 松明の 並び（0〜1・左から右へ）
export const torchX = (i) => 0.1 + (0.8 * i) / (TORCHES - 1);

export function newRound(rng) {
  // 灯す順は 毎回 まぜる（左から順だと 待つだけになる）
  const order = [...Array(TORCHES).keys()];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { order, lit: [], misses: 0, phase: rng() * Math.PI * 2, base: 0, t0: 0, end: false };
}
export const target = (r) => r.order[r.lit.length] ?? null;
export function sparkAngle(r, t) {
  const v = SPEED * (1 + SPEEDUP * r.lit.length);
  return r.phase + r.base + ((t - r.t0) / 1000) * v;
}
export const sparkX = (r, t) => 0.5 + AMP * Math.sin(sparkAngle(r, t));
export const timeLeft = (r, t) => Math.max(0, TIME_MS - t - r.misses * MISS_MS);
export const roundDone = (r, t) => r.lit.length >= TORCHES || timeLeft(r, t) <= 0;

// さわった：火の粉が 目当ての松明の 真上なら 点火
export function tapAt(r, t) {
  if (roundDone(r, t)) return { r, hit: false };
  const i = target(r);
  const hit = Math.abs(sparkX(r, t) - torchX(i)) <= HALF;
  if (!hit) return { r: { ...r, misses: r.misses + 1 }, hit: false };
  // 速さが変わっても 火の粉の位置が飛ばないよう、その時の角度を base に足して t0 を置き直す
  return { r: { ...r, lit: [...r.lit, i], base: sparkAngle(r, t) - r.phase, t0: t }, hit: true };
}
export const roundPts = (r) => r.lit.length + (r.lit.length >= TORCHES ? ALL_BONUS : 0);

export function enterRound(game) {
  if (game.mon < ENTRY_PRICE) return { ok: false, game };
  return { ok: true, game: { ...game, mon: game.mon - ENTRY_PRICE } };
}
export function addTorches(game, r) {
  return { ...game, taimatsuPts: (game.taimatsuPts ?? 0) + roundPts(r), taimatsuBest: Math.max(game.taimatsuBest ?? 0, r.lit.length) };
}

// 景品＝3章の戦いで効く物
export const TAIMATSU_PRIZES = {
  tokujou: { kind: 'item', id: 'tokujou', n: 1, pts: 3 },
  goshinsui: { kind: 'item', id: 'goshinsui', n: 1, pts: 5 },
  kusuribako: { kind: 'item', id: 'kusuribako', n: 1, pts: 8 },
};
export const exchangeTaimatsu = (game, prizeId, who = null) => exchangePrize(game, TAIMATSU_PRIZES[prizeId], 'taimatsuPts', who);

// 次に 火の粉が 目当ての松明の 真上に来る 時刻（確かめ・試験用）
export function nextOver(r, t) {
  const i = target(r);
  if (i == null) return null;
  for (let dt = 0; dt < 15000; dt += 2) if (Math.abs(sparkX(r, t + dt) - torchX(i)) < 0.01) return t + dt;
  return null;
}
