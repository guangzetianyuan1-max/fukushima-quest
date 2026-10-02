// 装備（本人 10/1「武器、防具の採用は無いか？」→「3」＝刀屋と装備の回）
// 1人に3か所：weapon 武器／armor 防具／charm お守り。who＝着けられる人。買うとその場で着け、前の品は半値で引き取ってもらう
// 序章いわきで買える所：平の刀屋（武器）・平の荒物屋（防具）・平の八幡さま（勝守）・湯本のお寺（厄除け守）
export const EQUIP = {
  bou: { name: '木の棒', slot: 'weapon', who: ['tabi'], atk: 2, price: 0 },
  bokuto: { name: '木刀', slot: 'weapon', who: ['tabi'], atk: 5, price: 30 },
  katana: { name: '刀', slot: 'weapon', who: ['tabi'], atk: 10, price: 100 },
  sensu: { name: '扇子', slot: 'weapon', who: ['shiori'], atk: 3, price: 20 },
  tessen: { name: '鉄扇', slot: 'weapon', who: ['shiori'], atk: 7, price: 70 },
  // 仲間の武器（本人 10/2「猟師、僧侶用の武器、防具はありますか？」）。猟師の武器は鉄砲の威力にも効く（rules.js の shoot は攻撃力から）
  nata: { name: '鉈', slot: 'weapon', who: ['kariudo'], atk: 4, price: 25 },
  yamagatana: { name: '山刀', slot: 'weapon', who: ['kariudo'], atk: 9, price: 90 },
  kashizue: { name: '樫の杖', slot: 'weapon', who: ['sou'], atk: 3, price: 20 },
  kongozue: { name: '金剛杖', slot: 'weapon', who: ['sou'], atk: 6, price: 60 },
  // 防具とお守りは4人とも着けられる（10/2 仲間が加わった）
  kasa: { name: '旅の笠', slot: 'armor', who: ['tabi', 'shiori', 'kariudo', 'sou'], def: 2, price: 15 },
  kyahan: { name: '脚絆', slot: 'armor', who: ['tabi', 'shiori', 'kariudo', 'sou'], def: 3, agi: 2, price: 30 },
  mino: { name: '蓑', slot: 'armor', who: ['tabi', 'shiori', 'kariudo', 'sou'], def: 6, price: 60 },
  kachimori: { name: '勝守', slot: 'charm', who: ['tabi', 'shiori', 'kariudo', 'sou'], atk: 2, price: 25 }, // 八幡さま＝武運の神さまと伝わる
  // 小名浜の釣りの景品だけ（本人 10/2「何か景品付けて」）。えびす様＝漁の神さまと伝わる。店では売らない（price 0＝引き取りも0）
  ebisu: { name: 'えびす様の守り', slot: 'charm', who: ['tabi', 'shiori', 'kariudo', 'sou'], atk: 2, def: 2, agi: 2, price: 0 },
  yakuyoke: { name: '厄除け守', slot: 'charm', who: ['tabi', 'shiori', 'kariudo', 'sou'], ward: true, price: 25 }, // 呪い・取り憑きを半分はね返す
};

export const SLOTS = ['weapon', 'armor', 'charm'];
export const SLOT_NAME = { weapon: '武器', armor: '防具', charm: 'お守り' };

export const START_EQUIP = {
  tabi: { weapon: 'bou', armor: null, charm: null },
  shiori: { weapon: null, armor: null, charm: null },
  kariudo: { weapon: null, armor: null, charm: null },
  sou: { weapon: null, armor: null, charm: null },
};

// 効き目の短い書き方（店の右に出す）：攻+5 守+2 速+2 厄除け
export function equipNote(id) {
  const e = EQUIP[id];
  return [e.atk && `攻+${e.atk}`, e.def && `守+${e.def}`, e.agi && `速+${e.agi}`, e.ward && '厄除け'].filter(Boolean).join(' ');
}

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

// ボスに着くころの装備（試算と試験の前提。そのころの文で無理なく買える物）
export const EXPECT_GEAR = {
  1: START_EQUIP,
  2: START_EQUIP,
  3: { tabi: { weapon: 'bokuto', armor: null, charm: null }, shiori: { weapon: 'sensu', armor: null, charm: null } },
  // 4〜5は加わった仲間の分も（猟師＝賢沼のあと・僧＝蛇岸淵のあと。加わったばかりは安い得物だけ）
  4: { tabi: { weapon: 'bokuto', armor: 'kasa', charm: null }, shiori: { weapon: 'sensu', armor: 'kasa', charm: null }, kariudo: { weapon: 'nata', armor: null, charm: null } },
  5: { tabi: { weapon: 'katana', armor: 'kasa', charm: null }, shiori: { weapon: 'sensu', armor: 'kasa', charm: null }, kariudo: { weapon: 'nata', armor: 'kasa', charm: null }, sou: { weapon: 'kashizue', armor: null, charm: null } },
};
