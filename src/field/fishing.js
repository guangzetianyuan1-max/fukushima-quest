// 小名浜の釣り（本人 10/2「小名浜のまちがあまり機能しない」→案1「漁港で釣り」＋「何か景品付けて」）
// 釣り番の漁師に 竿代を払って1回釣る → 釣れた魚で「釣り点」がたまる → 釣り番で景品と換える
// 釣りの手順（画面は FieldScene の fishing*）：①うきが沈んで「！」が出たら さわる（早すぎ・遅すぎは逃げる）
//                                          ②左右に動く針が緑の帯に入ったら さわる（帯の幅と針の速さは魚しだい）
// 画面と切り離す＝Node で試験する。ここの関数は game を書き換えずに新しい game を返す
import { EQUIP, canWear } from '../data/equip.js?v=224';

export const ROD_PRICE = 5;
// 「！」が出てから さわれる長さ（ミリ秒）と、「！」が出るまでの待ち
export const BITE_WINDOW_MS = 700;
export const WAIT_MS = [1200, 3500];

// w＝出やすさ・pt＝釣り点・zone＝緑の帯の幅（0〜1）・speed＝針が端から端まで動く秒数（小さいほど速い）
// 小名浜で揚がる魚（めひかり＝いわき市の魚・アイナメ・カレイ・カツオ）と、たまに大ダコ・古い長靴
export const FISH = {
  mehikari: { name: 'めひかり', w: 40, pt: 1, zone: 0.32, speed: 1.4, line: 'めひかりは いわき市の 魚。唐揚げが おいしいのよ。' },
  ainame: { name: 'アイナメ', w: 24, pt: 2, zone: 0.24, speed: 1.2, line: '岩の かげに すむ 魚ね。' },
  karei: { name: 'カレイ', w: 18, pt: 3, zone: 0.19, speed: 1.0, line: '砂に もぐって かくれるの。よく 見つけたわね！' },
  katsuo: { name: 'カツオ', w: 8, pt: 5, zone: 0.13, speed: 0.8, line: 'いわきでは にんにく醤油で 食べるのよ。' },
  oodako: { name: '大ダコ', w: 3, pt: 10, zone: 0.09, speed: 0.65, line: 'こんなに 大きな タコ、はじめて 見た！' },
  nagagutsu: { name: '古い長靴', w: 7, pt: 0, zone: 0.36, speed: 1.5, line: '……長靴ね。海は きれいに しないと。' },
};

export function rollFish(rng) {
  const total = Object.values(FISH).reduce((n, f) => n + f.w, 0);
  let r = rng() * total;
  for (const [id, f] of Object.entries(FISH)) {
    r -= f.w;
    if (r < 0) return id;
  }
  return 'mehikari';
}

// 緑の帯の位置（左端 0〜1-zone）を運で決める
export const zoneStart = (fishId, rng) => rng() * (1 - FISH[fishId].zone);
// 針の位置 p（0〜1）が帯に入っているか
export const inZone = (fishId, start, p) => p >= start && p <= start + FISH[fishId].zone;

// 竿を借りる（竿代を払う）
export function rentRod(game) {
  if (game.mon < ROD_PRICE) return { ok: false, game };
  return { ok: true, game: { ...game, mon: game.mon - ROD_PRICE } };
}

// 釣れた：釣り点と、魚ごとの数（釣り帳）を足す
export function addCatch(game, fishId) {
  const f = FISH[fishId];
  const book = { ...(game.fishBook ?? {}), [fishId]: (game.fishBook?.[fishId] ?? 0) + 1 };
  return { ...game, fishPts: (game.fishPts ?? 0) + f.pt, fishBook: book };
}

// 景品（本人「何か景品付けて」「景品は実用的なもので」）＝どれも戦いで効く物：道具・玉・防具・お守りと、ここでしか手に入らない「えびす様の守り」（えびす様＝漁の神さまと伝わる）
// kind 'item'＝持ち物に n こ足す／'equip'＝お守り（だれが着けるかは画面で選ぶ）
// 投網・大漁の酒・えびす様の守りは ここでしか手に入らない
export const PRIZES = {
  g_mehikari: { kind: 'item', id: 'g_mehikari', n: 1, pts: 3 }, // 10/7 小名浜の名物＝グルメの判子
  reisui: { kind: 'item', id: 'reisui', n: 1, pts: 5 },
  tama: { kind: 'item', id: 'tama', n: 3, pts: 6 },
  toami: { kind: 'item', id: 'toami', n: 1, pts: 6 },
  sake: { kind: 'item', id: 'sake', n: 1, pts: 10 },
  yakuyoke: { kind: 'equip', id: 'yakuyoke', pts: 12 },
  mino: { kind: 'equip', id: 'mino', pts: 20 },
  ebisu: { kind: 'equip', id: 'ebisu', pts: 30 },
};

// 景品と換える。お守り・防具は who に着ける（前の品は店と同じく半値で引き取り）
export const exchange = (game, prizeId, who = null) => exchangePrize(game, PRIZES[prizeId], 'fishPts', who);

// 景品の換え方（釣り点＝fishPts・野馬追の旗点＝flagPts で共通）
export function exchangePrize(game, p, key, who = null) {
  if ((game[key] ?? 0) < p.pts) return { ok: false, reason: 'pts', game };
  let g = { ...game, [key]: game[key] - p.pts };
  if (p.kind === 'item') {
    g = { ...g, items: { ...g.items, [p.id]: (g.items[p.id] ?? 0) + p.n } };
    return { ok: true, game: g };
  }
  const e = EQUIP[p.id];
  if (!who || !(game.members ?? ['tabi', 'shiori']).includes(who) || !canWear(game, p.id, who)) return { ok: false, reason: 'who', game }; // 10/5 職業の旅：旅にいる人・武器は その職業の系統
  const equip = structuredClone(g.equip ?? {});
  equip[who] ??= { weapon: null, armor: null, charm: null };
  const old = equip[who][e.slot];
  const refund = old ? Math.floor(EQUIP[old].price / 2) : 0;
  equip[who][e.slot] = p.id;
  return { ok: true, old, refund, game: { ...g, equip, mon: g.mon + refund } };
}
