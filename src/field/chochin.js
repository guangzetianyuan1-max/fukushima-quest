// 二本松の提灯祭り（2章のイベント・本人 10/4「各章1つ、イベントを」→ 2章＝二本松の提灯祭り）
// 確かめた事（二本松市・福島県の紹介）：二本松神社の例大祭・350年以上・宵祭りに 7つの町の太鼓台が集まり、神社の御神火を紅い提灯に灯す・太鼓台1台に 約300の提灯
// 遊び方：太鼓の拍に合わせて さわると、太鼓台の提灯が灯る（ぴったり＝3つ・少しずれ＝1つ・大太鼓の拍は2倍）。灯した10個で 提灯点 1点 → 景品
// 計算は画面と切り離す（画面は FieldScene の startChochin）
import { exchangePrize } from './fishing.js?v=171';

export const ENTRY_PRICE = 15;
export const BEAT_MS = 600; // 100拍/分（お囃子の太鼓くらい）
export const BEATS = 32;
export const LEAD_MS = 1800; // はじめの「よーい」
export const GOOD_MS = 110; // ぴったり（±）
export const OK_MS = 220; // 少しずれ（±）
export const LANTERNS = 100; // 画面の太鼓台に並べる提灯の数（灯しきれば満開）
export const PER_POINT = 10; // 灯した10個で1点
export const REST_P = 0.12; // 休みの拍（打たない）
export const BIG_EVERY = 8; // 8拍ごとに大太鼓（2倍灯る）
// 巫女の師匠の 神楽の試し（10/5）＝同じ遊びで 舞の冴え（灯した数）が KAGURA_PASS 以上・拍の無い所で さわったのが KAGURA_MISS 回まで なら合格
// （やみくもに さわり続けると 灯る数は届く＝10/5 試験で 0.44秒ごとに さわって73。拍の外れを数えて 落とす）
export const KAGURA_PASS = 50; // 10/5 ブラウザで 0.07秒きざみに合わせて 51＝人の手で 60 は きびしい
export const KAGURA_MISS = 8; // 休みの拍（約4つ）で つい さわっても 受かる幅
export const kaguraPassed = (round) => round.lit >= KAGURA_PASS && round.misses <= KAGURA_MISS;

// 拍の並び：{ t, big } の列。休みの拍は入れない（はじめの4拍と大太鼓の拍は休まない）
export function planBeats(rng) {
  const beats = [];
  for (let i = 0; i < BEATS; i++) {
    const big = i % BIG_EVERY === BIG_EVERY - 1;
    if (i >= 4 && !big && rng() < REST_P) continue;
    beats.push({ t: LEAD_MS + i * BEAT_MS, big });
  }
  return beats;
}

export function newRound(rng) {
  return { beats: planBeats(rng), hit: [], lit: 0, misses: 0, combo: 0, best: 0 };
}

// さわった時刻 t（ms）を判定：まだ打っていない拍のうち一番近い拍が OK_MS 以内なら当たり
export function tapAt(round, t) {
  let bi = -1;
  let bd = Infinity;
  round.beats.forEach((b, i) => {
    if (round.hit.includes(i)) return;
    const d = Math.abs(b.t - t);
    if (d < bd) { bd = d; bi = i; }
  });
  if (bi < 0 || bd > OK_MS) {
    return { round: { ...round, misses: round.misses + 1, combo: 0 }, grade: 'miss', add: 0 };
  }
  const grade = bd <= GOOD_MS ? 'yoi' : 'maa';
  const add = (grade === 'yoi' ? 3 : 1) * (round.beats[bi].big ? 2 : 1);
  const combo = round.combo + 1;
  return {
    round: { ...round, hit: [...round.hit, bi], lit: Math.min(LANTERNS, round.lit + add), combo, best: Math.max(round.best, combo) },
    grade, add, beat: bi,
  };
}

// 打ちそびれた拍（もう OK_MS を過ぎた拍）を数える
export const missedBeats = (round, t) => round.beats.filter((b, i) => !round.hit.includes(i) && t > b.t + OK_MS).length;
export const roundEnd = (round) => round.beats[round.beats.length - 1].t + OK_MS + 400;
export const roundPts = (round) => Math.floor(round.lit / PER_POINT);

export function enterRound(game) {
  if (game.mon < ENTRY_PRICE) return { ok: false, game };
  return { ok: true, game: { ...game, mon: game.mon - ENTRY_PRICE } };
}

export function addLanterns(game, lit) {
  return { ...game, chochinPts: (game.chochinPts ?? 0) + Math.floor(lit / PER_POINT), chochinBest: Math.max(game.chochinBest ?? 0, lit) };
}

// 景品＝2章の戦いで効く物。玉羊羹は二本松の名物・御神火の守りは ここでしか手に入らない
export const CHOCHIN_PRIZES = {
  tamayokan: { kind: 'item', id: 'tamayokan', n: 1, pts: 3 },
  goshinsui: { kind: 'item', id: 'goshinsui', n: 1, pts: 5 },
  sake: { kind: 'item', id: 'sake', n: 1, pts: 6 },
  kusuribako: { kind: 'item', id: 'kusuribako', n: 1, pts: 8 },
  gojinka: { kind: 'equip', id: 'gojinka', pts: 24 },
};
export const exchangeChochin = (game, prizeId, who = null) => exchangePrize(game, CHOCHIN_PRIZES[prizeId], 'chochinPts', who);
