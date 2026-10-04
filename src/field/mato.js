// 的当ての試し（本人 10/5 設計書「動く的を射る・新しい小さな遊び」）＝弓矢使いの師匠
// 的は左右に ゆれて動く。真ん中の 狙いの線に 重なった瞬間に さわると 当たる。矢は MATO_ARROWS 本・MATO_PASS 本 当てれば合格
// 1本 射るごとに 的が少し速くなる。計算は画面と切り離す（画面は FieldScene の startMato）
export const MATO_ARROWS = 8;
export const MATO_PASS = 5;
export const MATO_HALF = 0.07; // 当たりの幅（画面の幅に対する半分）
export const MATO_AMP = 0.38; // 的のゆれ幅
export const MATO_SPEED = 1.6; // ゆれの速さ（1秒あたりの角度）
export const MATO_SPEEDUP = 0.12; // 1本ごとに速くなる割合

export function newMato(rng) {
  return { phase: rng() * Math.PI * 2, shots: [], hits: 0, base: 0, t0: 0 };
}
// いまの的の位置（0〜1・0.5 が真ん中）。速さが変わっても位置が飛ばないよう、射るたびに その時の角度を base に足して t0 を置き直す
export function matoAngle(m, t) {
  const v = MATO_SPEED * (1 + MATO_SPEEDUP * m.shots.length);
  return m.phase + m.base + ((t - m.t0) / 1000) * v;
}
export const matoX = (m, t) => 0.5 + MATO_AMP * Math.sin(matoAngle(m, t));

export function shootMato(m, t) {
  if (matoDone(m)) return { m, hit: false };
  const x = matoX(m, t);
  const hit = Math.abs(x - 0.5) <= MATO_HALF;
  const base = matoAngle(m, t) - m.phase;
  return { m: { ...m, shots: [...m.shots, { t, x, hit }], hits: m.hits + (hit ? 1 : 0), base, t0: t }, hit };
}
export const matoDone = (m) => m.shots.length >= MATO_ARROWS;
export const matoPassed = (m) => matoDone(m) && m.hits >= MATO_PASS;
// 次に真ん中を通る時刻（確かめ・試験用）
export function nextCenter(m, t) {
  for (let dt = 0; dt < 10000; dt += 2) if (Math.abs(matoX(m, t + dt) - 0.5) < 0.01) return t + dt;
  return null;
}
