// 装備（本人 10/1「武器、防具の採用は無いか？」→「3」＝刀屋と装備の回）
// 1人に3か所：weapon 武器／armor 防具／charm お守り。who＝着けられる人。買うとその場で着け、前の品は半値で引き取ってもらう
// 序章いわきで買える所：平の刀屋（武器）・平の荒物屋（防具）・平の八幡さま（勝守）・湯本のお寺（厄除け守）
import { JOBS, jobOf } from './jobs.js?v=163';

export const EQUIP = {
  // ---- 武器＝職業の系統ごとに7段（本人 10/5「職業を選んでスタート」＝武器は その職業の系統だけ着けられる・jobs.js の weapon）
  // 段0＝はじめに持つ（値段0）・段1〜2＝序章の平・段3＝1章の小高・段4＝1章の相馬・段5＝2章・段6＝3章。強さは段ごとに どの系統も同じ
  // 刀（武士）
  bou: { name: '木の棒', slot: 'weapon', line: 'katana', tier: 0, atk: 2, price: 0 },
  bokuto: { name: '木刀', slot: 'weapon', line: 'katana', tier: 1, atk: 5, price: 30 },
  katana: { name: '刀', slot: 'weapon', line: 'katana', tier: 2, atk: 10, price: 100 },
  tachi: { name: '太刀', slot: 'weapon', line: 'katana', tier: 3, atk: 16, price: 220 },
  nodachi: { name: '野太刀', slot: 'weapon', line: 'katana', tier: 4, atk: 24, price: 380 },
  meito: { name: '名刀', slot: 'weapon', line: 'katana', tier: 5, atk: 33, price: 640 },
  ootachi: { name: '大太刀', slot: 'weapon', line: 'katana', tier: 6, atk: 44, price: 1000 },
  // 扇と薙刀（妖術使い・巫女）
  hiougi: { name: '檜扇', slot: 'weapon', line: 'ougi', tier: 0, atk: 2, price: 0 },
  sensu: { name: '鉄の扇', slot: 'weapon', line: 'ougi', tier: 1, atk: 5, price: 30 },
  tessen: { name: '鉄扇', slot: 'weapon', line: 'ougi', tier: 2, atk: 10, price: 100 },
  naginata: { name: '薙刀', slot: 'weapon', line: 'ougi', tier: 3, atk: 16, price: 220 },
  oonaginata: { name: '大薙刀', slot: 'weapon', line: 'ougi', tier: 4, atk: 24, price: 380 },
  hokonaginata: { name: '鉾', slot: 'weapon', line: 'ougi', tier: 5, atk: 33, price: 640 },
  nagamaki: { name: '長巻', slot: 'weapon', line: 'ougi', tier: 6, atk: 44, price: 1000 },
  // 短剣（忍者）
  kogatana: { name: '小刀', slot: 'weapon', line: 'blade', tier: 0, atk: 2, price: 0 },
  tanto: { name: '短刀', slot: 'weapon', line: 'blade', tier: 1, atk: 5, price: 30 },
  wakizashi: { name: '脇差', slot: 'weapon', line: 'blade', tier: 2, atk: 10, price: 100 },
  kunai: { name: '苦無', slot: 'weapon', line: 'blade', tier: 3, atk: 16, price: 220 },
  shinobigatana: { name: '忍び刀', slot: 'weapon', line: 'blade', tier: 4, atk: 24, price: 380 },
  yoroidoshi: { name: '鎧通し', slot: 'weapon', line: 'blade', tier: 5, atk: 33, price: 640 },
  kodachi: { name: '小太刀', slot: 'weapon', line: 'blade', tier: 6, atk: 44, price: 1000 },
  // 槍（力士）
  konbo: { name: '棍棒', slot: 'weapon', line: 'yari', tier: 0, atk: 2, price: 0 },
  nata: { name: '鉈', slot: 'weapon', line: 'yari', tier: 1, atk: 5, price: 30 },
  yamagatana: { name: '山刀', slot: 'weapon', line: 'yari', tier: 2, atk: 10, price: 100 },
  kumayari: { name: '熊槍', slot: 'weapon', line: 'yari', tier: 3, atk: 16, price: 220 },
  jumonji: { name: '十文字槍', slot: 'weapon', line: 'yari', tier: 4, atk: 24, price: 380 },
  matagiyari: { name: '狩り槍', slot: 'weapon', line: 'yari', tier: 5, atk: 33, price: 640 },
  oomiyari: { name: '大身槍', slot: 'weapon', line: 'yari', tier: 6, atk: 44, price: 1000 },
  // 杖（僧・陰陽師・薬師・山伏）
  kinotsue: { name: '木の杖', slot: 'weapon', line: 'tsue', tier: 0, atk: 2, price: 0 },
  kashizue: { name: '樫の杖', slot: 'weapon', line: 'tsue', tier: 1, atk: 5, price: 30 },
  kongozue: { name: '金剛杖', slot: 'weapon', line: 'tsue', tier: 2, atk: 10, price: 100 },
  shakujo: { name: '錫杖', slot: 'weapon', line: 'tsue', tier: 3, atk: 16, price: 220 },
  tetsushakujo: { name: '鉄の錫杖', slot: 'weapon', line: 'tsue', tier: 4, atk: 24, price: 380 },
  ginshakujo: { name: '銀の錫杖', slot: 'weapon', line: 'tsue', tier: 5, atk: 33, price: 640 },
  kinshakujo: { name: '金の錫杖', slot: 'weapon', line: 'tsue', tier: 6, atk: 44, price: 1000 },
  // 弓（弓矢使い）
  takeyumi: { name: '竹の弓', slot: 'weapon', line: 'bow', tier: 0, atk: 2, price: 0 },
  hankyu: { name: '半弓', slot: 'weapon', line: 'bow', tier: 1, atk: 5, price: 30 },
  yumi: { name: '弓', slot: 'weapon', line: 'bow', tier: 2, atk: 10, price: 100 },
  shigetou: { name: '重籐の弓', slot: 'weapon', line: 'bow', tier: 3, atk: 16, price: 220 },
  tsuyoyumi: { name: '強弓', slot: 'weapon', line: 'bow', tier: 4, atk: 24, price: 380 },
  nurigome: { name: '塗籠籐の弓', slot: 'weapon', line: 'bow', tier: 5, atk: 33, price: 640 },
  daikyu: { name: '大弓', slot: 'weapon', line: 'bow', tier: 6, atk: 44, price: 1000 },
  // ---- 防具とお守り（だれでも着けられる）
  // 仲間の武器（本人 10/2「猟師、僧侶用の武器、防具はありますか？」）。猟師の武器は鉄砲の威力にも効く（rules.js の shoot は攻撃力から）
  domaru: { name: '胴丸', slot: 'armor', def: 10, price: 150 },
  // 相馬の町（中村）の刀屋の新しい品（本人 10/3「武器や防具、道具も、強い敵に合わせて強く」）。太刀・薙刀・熊槍・錫杖・胴丸は 小高の よろず屋へ移した
  kusari: { name: '鎖帷子', slot: 'armor', def: 15, price: 300 },
  // 防具とお守りは4人とも着けられる（10/2 仲間が加わった）
  kasa: { name: '旅の笠', slot: 'armor', def: 2, price: 15 },
  kyahan: { name: '脚絆', slot: 'armor', def: 3, agi: 2, price: 30 },
  mino: { name: '蓑', slot: 'armor', def: 6, price: 60 },
  kachimori: { name: '勝守', slot: 'charm', atk: 2, price: 25 }, // 八幡さま＝武運の神さまと伝わる
  // 小名浜の釣りの景品だけ（本人 10/2「何か景品付けて」）。えびす様＝漁の神さまと伝わる。店では売らない（price 0＝引き取りも0）
  ebisu: { name: 'えびす様の守り', slot: 'charm', atk: 2, def: 2, agi: 2, price: 0 },
  // 相馬野馬追の神旗争奪戦の景品だけ（本人 10/3）。店では売らない
  jinbaori: { name: '陣羽織', slot: 'armor', def: 9, agi: 4, price: 0 },
  // 二本松の提灯祭りの景品（10/4）＝宵祭りで提灯に灯す 二本松神社の御神火にちなむ お守り（ゲームの作り）。ここでしか手に入らない
  gojinka: { name: '御神火の守り', slot: 'charm', atk: 4, def: 3, agi: 2, price: 0 },
  yoroi: { name: '大鎧', slot: 'armor', def: 22, price: 520 },
  gusoku: { name: '当世具足', slot: 'armor', def: 30, price: 820 },
  yakuyoke: { name: '厄除け守', slot: 'charm', ward: true, price: 25 }, // 呪い・取り憑きを半分はね返す
};

// その人が いま着けられるか（武器＝その人の職業の系統だけ・防具とお守り＝だれでも）
export function canWear(game, id, who) {
  const e = EQUIP[id];
  if (!e) return false;
  if (e.slot !== 'weapon') return true;
  return JOBS[jobOf(game, who)]?.weapon === e.line;
}

export const SLOTS = ['weapon', 'armor', 'charm'];
export const SLOT_NAME = { weapon: '武器', armor: '防具', charm: 'お守り' };

// はじめの装備＝職業の系統の段0の武器
export function startEquipFor(job) {
  const w = Object.entries(EQUIP).find(([, e]) => e.line === JOBS[job]?.weapon && e.tier === 0);
  return { weapon: w ? w[0] : null, armor: null, charm: null };
}
export function startEquip(game) {
  return Object.fromEntries((game.members ?? []).map((id) => [id, startEquipFor(jobOf(game, id))]));
}
export const START_EQUIP = {}; // 前の形の名残（職業の旅では startEquip(game)）

// 効き目の短い書き方（店の右に出す）：攻+5 守+2 速+2 厄除け
export function equipNote(id) {
  const e = EQUIP[id];
  return [e.atk && `攻+${e.atk}`, e.def && `守+${e.def}`, e.agi && `速+${e.agi}`, e.ward && '厄除け'].filter(Boolean).join(' ');
}

// 着け替えたら どう変わるか（本人 10/3「装備は間違えて買うことが無いように、装備中、-10(着ることによりさがる)など、注記してほしい」）
// id＝これから着ける品・nowId＝その人が その場所に いま着けている品（無ければ null）
export function equipDiff(id, nowId) {
  const a = EQUIP[id];
  const b = EQUIP[nowId] ?? {};
  return { atk: (a.atk ?? 0) - (b.atk ?? 0), def: (a.def ?? 0) - (b.def ?? 0), agi: (a.agi ?? 0) - (b.agi ?? 0), ward: Number(!!a.ward) - Number(!!b.ward) };
}
// 店の右に出す字：装備中／攻+6 守-4（＋は上がる・－は下がる）／変わらない
export function diffNote(id, nowId) {
  if (id === nowId) return '装備中';
  const d = equipDiff(id, nowId);
  const sg = (n) => (n > 0 ? `+${n}` : `${n}`);
  const parts = [d.atk && `攻${sg(d.atk)}`, d.def && `守${sg(d.def)}`, d.agi && `速${sg(d.agi)}`, d.ward > 0 && '厄除け', d.ward < 0 && '厄除け無し'].filter(Boolean);
  return parts.length ? parts.join(' ') : '変わらない';
}
// 着けると どれか1つでも下がるか（字を赤くする）
export const diffDown = (id, nowId) => id !== nowId && Object.values(equipDiff(id, nowId)).some((n) => n < 0);

// 装備の足し算
export function gearBonus(equip) {
  const b = { atk: 0, def: 0, agi: 0, ward: false };
  for (const s of SLOTS) {
    const e = EQUIP[equip?.[s]];
    if (!e) continue;
    b.atk += e.atk ?? 0;
    b.def += e.def ?? 0;
    b.agi += e.agi ?? 0;
    b.ward = b.ward || !!e.ward;
  }
  return b;
}

// ボスに着くころの装備（試算と試験の前提。そのころの文で無理なく買える物）＝ レベルごとに 武器の段・防具・お守り
// （10/5 職業の旅へ作り替え：前の表の「旅の者の刀の段」と防具を そのまま使った）
const GEAR_AT = {
  1: [0, null], 2: [0, null], 3: [1, null], 4: [1, 'kasa'], 5: [2, 'kasa'], 6: [2, 'mino'], 7: [3, 'mino'], 8: [4, 'domaru'], 9: [4, 'kusari'],
  10: [4, 'kusari'], 11: [5, 'kusari'], 12: [5, 'kusari'], 13: [5, 'yoroi'], 14: [5, 'yoroi'], 15: [5, 'yoroi'], 16: [6, 'yoroi'], 17: [6, 'gusoku'], 18: [6, 'gusoku'], 19: [6, 'gusoku'], 20: [6, 'gusoku'],
};
export function expectEquipFor(lv, job) {
  const [tier, armor] = GEAR_AT[Math.min(20, Math.max(1, lv))];
  const w = Object.entries(EQUIP).find(([, e]) => e.line === JOBS[job]?.weapon && e.tier === tier);
  return { weapon: w ? w[0] : null, armor, charm: null };
}
// その旅の4人ぶん（id → 装備）
export function expectEquip(lv, game) {
  return Object.fromEntries((game.members ?? []).map((id) => [id, expectEquipFor(lv, jobOf(game, id))]));
}
