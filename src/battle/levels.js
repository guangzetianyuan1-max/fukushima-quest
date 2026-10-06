// 仲間のレベルと強さ（道中の敵の回・本人 10/1「本来のドラクエらしく」）。序章は1→6くらい
import { gearBonus } from '../data/equip.js?v=204';

// EXP_TO[lv]＝そのレベルになるのに要る経験の合計。STATS＝レベル1の強さと、1つ上がるごとの伸び
export const EXP_TO = [0, 0, 10, 30, 60, 100, 150, 210, 280, 360, 450, 550, 660, 780, 910, 1050, 1200, 1360, 1530, 1710, 1900, 2110, 2340, 2590, 2860, 3150]; // 10/6 4章 会津で Lv25 まで // 10/3 1章で Lv12 まで（間は 10・20・30…と広がる）・10/4 2章で Lv16 まで・3章で Lv20 まで
export const MAX_LV = EXP_TO.length - 1;

import { JOBS, statsOfPoints } from '../data/jobs.js?v=204';
const STATS = {
  tabi: { base: { hp: 60, mp: 20, atk: 12, def: 6, agi: 8 }, grow: { hp: 8, mp: 3, atk: 2, def: 1, agi: 1 } },
  shiori: { base: { hp: 45, mp: 0, atk: 7, def: 4, agi: 10 }, grow: { hp: 6, mp: 0, atk: 1.5, def: 1, agi: 1 } },
  // 昔話の味方（src/data/companions.js・本人 10/2）。猟師＝力の強い たたかう役／閼伽井嶽の僧＝術が多く守り役
  kariudo: { base: { hp: 70, mp: 0, atk: 15, def: 7, agi: 6 }, grow: { hp: 9, mp: 0, atk: 2.5, def: 1.5, agi: 1 } }, // 術は使わず鉄砲（玉）
  sou: { base: { hp: 50, mp: 24, atk: 8, def: 5, agi: 7 }, grow: { hp: 6, mp: 4, atk: 1.5, def: 1, agi: 1 } },
  // 東光坊の祐慶（⛔10/4 夜 仲間にしないと決め直した＝前の記録を読むためだけに残す）
  yukei: { base: { hp: 52, mp: 28, atk: 10, def: 5, agi: 8 }, grow: { hp: 6.5, mp: 4.5, atk: 1.8, def: 1, agi: 1 } },
};
// 着替えた姿の強さ（仲間の id とは別の表＝ALL_IDS には入れない）。kunoichi＝くノ一になった しおり（本人 10/4 夜「しおりが弱すぎる。女くノ一として」）
// しおり（攻7＋1.5／Lv・術の力0）→ 攻は旅の者と同じくらい・いちばん素早い・妖術の術の力。Lv15＝HP150・術72・攻43・守20・速32
const FORMS = {
  kunoichi: { base: { hp: 52, mp: 16, atk: 12, def: 5, agi: 14 }, grow: { hp: 7, mp: 4, atk: 2.2, def: 1.1, agi: 1.3 } },
};
// 始めの2人。昔話の味方は加わると game.members に足される（最大4人）
export const PARTY_IDS = ['tabi', 'shiori'];
export const ALL_IDS = Object.keys(STATS);
export const MAX_PARTY = 4;
export const membersOf = (game) => game?.members ?? PARTY_IDS;

// 職業の強さ（10/5〜）＝ 'job_<職業>'。能力の点（合計30）から jobs.js の statsOfPoints で出す
const JOB_STATS = Object.fromEntries(Object.entries(JOBS).map(([id, j]) => [`job_${id}`, statsOfPoints(j.points)]));
export function statsAt(id, lv) {
  const { base, grow } = STATS[id] ?? FORMS[id] ?? JOB_STATS[id];
  return Object.fromEntries(Object.keys(base).map((k) => [k, Math.round(base[k] + grow[k] * (lv - 1))]));
}

// 語り部の術の力（10/5）：弱点の術（主人公）・如意輪の経（しおり）は 話の術＝どの職業でも使えるように、主人公としおりは 職業の術の力に これを足す
// （力士は精神力0＝職業の術の力は0。それでも 主人公なら弱点の術を 前の旅の者の6割ほど 唱えられる）
export const STORY_MP = { tabi: [16, 2.5], shiori: [8, 1.5] };
export function memberStats(id, key, lv) {
  const s = statsAt(key, lv);
  const b = String(key).startsWith('job_') && STORY_MP[id];
  return b ? { ...s, mp: s.mp + Math.round(b[0] + b[1] * (lv - 1)) } : s;
}

export function levelFor(exp) {
  let lv = 1;
  while (lv < MAX_LV && exp >= EXP_TO[lv + 1]) lv += 1;
  return lv;
}

// レベルの強さに装備を足した物（ward＝厄除け守）
// key＝強さの表の名前（くノ一になった しおりは 'kunoichi'・装備は id の欄のまま）
export function statsWithGear(id, lv, equip, key = id) {
  const s = memberStats(id, key, lv);
  const b = gearBonus(equip?.[id]);
  return { ...s, int: s.int ?? Math.round(s.atk * 0.8), lv, atk: s.atk + b.atk, def: s.def + b.def, agi: s.agi + b.agi, ward: b.ward }; // lv＝鉄砲の当たりやすさに使う
}

// 話のデータの味方を、そのレベル（と装備）の強さにした物（術・語るなどはそのまま）
export function alliesAt(allies, lv, equip = null) {
  return allies.map((a) => ({ ...a, ...statsWithGear(a.id, lv, equip, a.form ?? a.id) }));
}
