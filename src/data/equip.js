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
  // 1章 相馬の町（中村）の刀屋で買える物（10/3・Claudeの決め）
  tachi: { name: '太刀', slot: 'weapon', who: ['tabi'], atk: 16, price: 220 },
  naginata: { name: '薙刀', slot: 'weapon', who: ['shiori'], atk: 11, price: 160 },
  kumayari: { name: '熊槍', slot: 'weapon', who: ['kariudo'], atk: 14, price: 180 },
  shakujo: { name: '錫杖', slot: 'weapon', who: ['sou'], atk: 10, price: 130 },
  domaru: { name: '胴丸', slot: 'armor', who: ['tabi', 'shiori', 'kariudo', 'sou'], def: 10, price: 150 },
  // 相馬の町（中村）の刀屋の新しい品（本人 10/3「武器や防具、道具も、強い敵に合わせて強く」）。太刀・薙刀・熊槍・錫杖・胴丸は 小高の よろず屋へ移した
  nodachi: { name: '野太刀', slot: 'weapon', who: ['tabi'], atk: 24, price: 380 },
  oonaginata: { name: '大薙刀', slot: 'weapon', who: ['shiori'], atk: 17, price: 280 },
  jumonji: { name: '十文字槍', slot: 'weapon', who: ['kariudo'], atk: 21, price: 330 },
  tetsushakujo: { name: '鉄の錫杖', slot: 'weapon', who: ['sou'], atk: 15, price: 230 },
  kusari: { name: '鎖帷子', slot: 'armor', who: ['tabi', 'shiori', 'kariudo', 'sou'], def: 15, price: 300 },
  // 防具とお守りは4人とも着けられる（10/2 仲間が加わった）
  kasa: { name: '旅の笠', slot: 'armor', who: ['tabi', 'shiori', 'kariudo', 'sou'], def: 2, price: 15 },
  kyahan: { name: '脚絆', slot: 'armor', who: ['tabi', 'shiori', 'kariudo', 'sou'], def: 3, agi: 2, price: 30 },
  mino: { name: '蓑', slot: 'armor', who: ['tabi', 'shiori', 'kariudo', 'sou'], def: 6, price: 60 },
  kachimori: { name: '勝守', slot: 'charm', who: ['tabi', 'shiori', 'kariudo', 'sou'], atk: 2, price: 25 }, // 八幡さま＝武運の神さまと伝わる
  // 小名浜の釣りの景品だけ（本人 10/2「何か景品付けて」）。えびす様＝漁の神さまと伝わる。店では売らない（price 0＝引き取りも0）
  ebisu: { name: 'えびす様の守り', slot: 'charm', who: ['tabi', 'shiori', 'kariudo', 'sou'], atk: 2, def: 2, agi: 2, price: 0 },
  // 相馬野馬追の神旗争奪戦の景品だけ（本人 10/3）。店では売らない
  jinbaori: { name: '陣羽織', slot: 'armor', who: ['tabi', 'shiori', 'kariudo', 'sou'], def: 9, agi: 4, price: 0 },
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

// ボスに着くころの装備（試算と試験の前提。そのころの文で無理なく買える物）
export const EXPECT_GEAR = {
  1: START_EQUIP,
  2: START_EQUIP,
  3: { tabi: { weapon: 'bokuto', armor: null, charm: null }, shiori: { weapon: 'sensu', armor: null, charm: null } },
  // 4〜5は加わった仲間の分も（猟師＝賢沼のあと・僧＝蛇岸淵のあと。加わったばかりは安い得物だけ）
  4: { tabi: { weapon: 'bokuto', armor: 'kasa', charm: null }, shiori: { weapon: 'sensu', armor: 'kasa', charm: null }, kariudo: { weapon: 'nata', armor: null, charm: null } },
  5: { tabi: { weapon: 'katana', armor: 'kasa', charm: null }, shiori: { weapon: 'sensu', armor: 'kasa', charm: null }, kariudo: { weapon: 'nata', armor: 'kasa', charm: null }, sou: { weapon: 'kashizue', armor: null, charm: null } },
  // 6〜9＝1章 相馬（10/3・同日 本人「強い敵に合わせて強く」で品を1段足した）。6＝ザルカブリ（いわきの品のまま着く）・7＝大悲山（小高の よろず屋の品）・8＝手長明神（相馬の刀屋の得物）・9＝橘墨虎（相馬の得物と鎖帷子）
  6: { tabi: { weapon: 'katana', armor: 'mino', charm: null }, shiori: { weapon: 'tessen', armor: 'kasa', charm: null }, kariudo: { weapon: 'yamagatana', armor: 'kasa', charm: null }, sou: { weapon: 'kongozue', armor: 'kasa', charm: null } },
  7: { tabi: { weapon: 'tachi', armor: 'mino', charm: null }, shiori: { weapon: 'naginata', armor: 'mino', charm: null }, kariudo: { weapon: 'kumayari', armor: 'mino', charm: null }, sou: { weapon: 'shakujo', armor: 'mino', charm: null } },
  8: { tabi: { weapon: 'nodachi', armor: 'domaru', charm: null }, shiori: { weapon: 'naginata', armor: 'mino', charm: null }, kariudo: { weapon: 'jumonji', armor: 'domaru', charm: null }, sou: { weapon: 'shakujo', armor: 'mino', charm: null } },
  9: { tabi: { weapon: 'nodachi', armor: 'kusari', charm: null }, shiori: { weapon: 'oonaginata', armor: 'domaru', charm: null }, kariudo: { weapon: 'jumonji', armor: 'kusari', charm: null }, sou: { weapon: 'tetsushakujo', armor: 'domaru', charm: null } },
};
