// 仲間のレベルと強さ（道中の敵の回・本人 10/1「本来のドラクエらしく」）。序章は1→6くらい
import { gearBonus } from '../data/equip.js?v=103';

// EXP_TO[lv]＝そのレベルになるのに要る経験の合計。STATS＝レベル1の強さと、1つ上がるごとの伸び
export const EXP_TO = [0, 0, 10, 30, 60, 100, 150, 210, 280, 360, 450, 550, 660]; // 10/3 1章で Lv12 まで（間は 10・20・30…と広がる）
export const MAX_LV = EXP_TO.length - 1;

const STATS = {
  tabi: { base: { hp: 60, mp: 20, atk: 12, def: 6, agi: 8 }, grow: { hp: 8, mp: 3, atk: 2, def: 1, agi: 1 } },
  shiori: { base: { hp: 45, mp: 0, atk: 7, def: 4, agi: 10 }, grow: { hp: 6, mp: 0, atk: 1.5, def: 1, agi: 1 } },
  // 昔話の味方（src/data/companions.js・本人 10/2）。猟師＝力の強い たたかう役／閼伽井嶽の僧＝術が多く守り役
  kariudo: { base: { hp: 70, mp: 0, atk: 15, def: 7, agi: 6 }, grow: { hp: 9, mp: 0, atk: 2.5, def: 1.5, agi: 1 } }, // 術は使わず鉄砲（玉）
  sou: { base: { hp: 50, mp: 24, atk: 8, def: 5, agi: 7 }, grow: { hp: 6, mp: 4, atk: 1.5, def: 1, agi: 1 } },
};
// 始めの2人。昔話の味方は加わると game.members に足される（最大4人）
export const PARTY_IDS = ['tabi', 'shiori'];
export const ALL_IDS = Object.keys(STATS);
export const MAX_PARTY = 4;
export const membersOf = (game) => game?.members ?? PARTY_IDS;

export function statsAt(id, lv) {
  const { base, grow } = STATS[id];
  return Object.fromEntries(Object.keys(base).map((k) => [k, Math.round(base[k] + grow[k] * (lv - 1))]));
}

export function levelFor(exp) {
  let lv = 1;
  while (lv < MAX_LV && exp >= EXP_TO[lv + 1]) lv += 1;
  return lv;
}

// レベルの強さに装備を足した物（ward＝厄除け守）
export function statsWithGear(id, lv, equip) {
  const s = statsAt(id, lv);
  const b = gearBonus(equip?.[id]);
  return { ...s, lv, atk: s.atk + b.atk, def: s.def + b.def, agi: s.agi + b.agi, ward: b.ward }; // lv＝鉄砲の当たりやすさに使う
}

// 話のデータの味方を、そのレベル（と装備）の強さにした物（術・語るなどはそのまま）
export function alliesAt(allies, lv, equip = null) {
  return allies.map((a) => ({ ...a, ...statsWithGear(a.id, lv, equip) }));
}
