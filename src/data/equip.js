// 装備（本人 10/1「武器、防具の採用は無いか？」→「3」＝刀屋と装備の回）
// 1人に3か所：weapon 武器／armor 防具／charm お守り。who＝着けられる人。買うとその場で着け、前の品は半値で引き取ってもらう
// 序章いわきで買える所：平の刀屋（武器）・平の荒物屋（防具）・平の八幡さま（勝守）・湯本のお寺（厄除け守）
export const EQUIP = {
  bou: { name: '木の棒', slot: 'weapon', who: ['tabi'], atk: 2, price: 0 },
  bokuto: { name: '木刀', slot: 'weapon', who: ['tabi'], atk: 5, price: 30 },
  katana: { name: '刀', slot: 'weapon', who: ['tabi'], atk: 10, price: 100 },
  sensu: { name: '扇子', slot: 'weapon', who: ['shiori'], retire: 'kunoichi', atk: 3, price: 20 },
  tessen: { name: '鉄扇', slot: 'weapon', who: ['shiori'], retire: 'kunoichi', atk: 7, price: 70 },
  // 仲間の武器（本人 10/2「猟師、僧侶用の武器、防具はありますか？」）。猟師の武器は鉄砲の威力にも効く（rules.js の shoot は攻撃力から）
  nata: { name: '鉈', slot: 'weapon', who: ['kariudo'], atk: 4, price: 25 },
  yamagatana: { name: '山刀', slot: 'weapon', who: ['kariudo'], atk: 9, price: 90 },
  kashizue: { name: '樫の杖', slot: 'weapon', who: ['sou', 'yukei'], atk: 3, price: 20 },
  kongozue: { name: '金剛杖', slot: 'weapon', who: ['sou', 'yukei'], atk: 6, price: 60 },
  // 1章 相馬の町（中村）の刀屋で買える物（10/3・Claudeの決め）
  tachi: { name: '太刀', slot: 'weapon', who: ['tabi'], atk: 16, price: 220 },
  naginata: { name: '薙刀', slot: 'weapon', who: ['shiori'], retire: 'kunoichi', atk: 11, price: 160 },
  kumayari: { name: '熊槍', slot: 'weapon', who: ['kariudo'], atk: 14, price: 180 },
  shakujo: { name: '錫杖', slot: 'weapon', who: ['sou', 'yukei'], atk: 10, price: 130 },
  domaru: { name: '胴丸', slot: 'armor', who: ['tabi', 'shiori', 'kariudo', 'sou', 'yukei'], def: 10, price: 150 },
  // 相馬の町（中村）の刀屋の新しい品（本人 10/3「武器や防具、道具も、強い敵に合わせて強く」）。太刀・薙刀・熊槍・錫杖・胴丸は 小高の よろず屋へ移した
  nodachi: { name: '野太刀', slot: 'weapon', who: ['tabi'], atk: 24, price: 380 },
  oonaginata: { name: '大薙刀', slot: 'weapon', who: ['shiori'], retire: 'kunoichi', atk: 17, price: 280 },
  jumonji: { name: '十文字槍', slot: 'weapon', who: ['kariudo'], atk: 21, price: 330 },
  tetsushakujo: { name: '鉄の錫杖', slot: 'weapon', who: ['sou', 'yukei'], atk: 15, price: 230 },
  kusari: { name: '鎖帷子', slot: 'armor', who: ['tabi', 'shiori', 'kariudo', 'sou', 'yukei'], def: 15, price: 300 },
  // 防具とお守りは4人とも着けられる（10/2 仲間が加わった）
  kasa: { name: '旅の笠', slot: 'armor', who: ['tabi', 'shiori', 'kariudo', 'sou', 'yukei'], def: 2, price: 15 },
  kyahan: { name: '脚絆', slot: 'armor', who: ['tabi', 'shiori', 'kariudo', 'sou', 'yukei'], def: 3, agi: 2, price: 30 },
  mino: { name: '蓑', slot: 'armor', who: ['tabi', 'shiori', 'kariudo', 'sou', 'yukei'], def: 6, price: 60 },
  kachimori: { name: '勝守', slot: 'charm', who: ['tabi', 'shiori', 'kariudo', 'sou', 'yukei'], atk: 2, price: 25 }, // 八幡さま＝武運の神さまと伝わる
  // 小名浜の釣りの景品だけ（本人 10/2「何か景品付けて」）。えびす様＝漁の神さまと伝わる。店では売らない（price 0＝引き取りも0）
  ebisu: { name: 'えびす様の守り', slot: 'charm', who: ['tabi', 'shiori', 'kariudo', 'sou', 'yukei'], atk: 2, def: 2, agi: 2, price: 0 },
  // 相馬野馬追の神旗争奪戦の景品だけ（本人 10/3）。店では売らない
  jinbaori: { name: '陣羽織', slot: 'armor', who: ['tabi', 'shiori', 'kariudo', 'sou', 'yukei'], def: 9, agi: 4, price: 0 },
  // 二本松の提灯祭りの景品（10/4）＝宵祭りで提灯に灯す 二本松神社の御神火にちなむ お守り（ゲームの作り）。ここでしか手に入らない
  gojinka: { name: '御神火の守り', slot: 'charm', who: ['tabi', 'shiori', 'kariudo', 'sou', 'yukei'], atk: 4, def: 3, agi: 2, price: 0 },
  // 2章 県北（福島・二本松の刀屋・10/4・Claudeの決め）＝1章より1段強く
  meito: { name: '名刀', slot: 'weapon', who: ['tabi'], atk: 33, price: 640 },
  hokonaginata: { name: '鉾', slot: 'weapon', who: ['shiori'], retire: 'kunoichi', atk: 24, price: 480 },
  matagiyari: { name: '狩り槍', slot: 'weapon', who: ['kariudo'], atk: 29, price: 560 },
  ginshakujo: { name: '銀の錫杖', slot: 'weapon', who: ['sou', 'yukei'], atk: 21, price: 400 },
  yoroi: { name: '大鎧', slot: 'armor', who: ['tabi', 'shiori', 'kariudo', 'sou', 'yukei'], def: 22, price: 520 },
  // 3章 県中・県南（10/4）＝郡山・須賀川・白河の刀屋
  ootachi: { name: '大太刀', slot: 'weapon', who: ['tabi'], atk: 44, price: 1000 },
  nagamaki: { name: '長巻', slot: 'weapon', who: ['shiori'], retire: 'kunoichi', atk: 32, price: 760 },
  oomiyari: { name: '大身槍', slot: 'weapon', who: ['kariudo'], atk: 38, price: 880 },
  kinshakujo: { name: '金の錫杖', slot: 'weapon', who: ['sou', 'yukei'], atk: 28, price: 640 },
  gusoku: { name: '当世具足', slot: 'armor', who: ['tabi', 'shiori', 'kariudo', 'sou', 'yukei'], def: 30, price: 820 },
  // くノ一の短剣（本人 10/4 夜「短剣と妖術使い」）。need＝くノ一になってから着ける。苦無＝黒脛巾組の頭から もらう（店では売らない）・鎧通し＝3章の刀屋
  kunai: { name: '苦無', slot: 'weapon', who: ['shiori'], need: 'kunoichi', atk: 24, price: 0 },
  yoroidoshi: { name: '鎧通し', slot: 'weapon', who: ['shiori'], need: 'kunoichi', atk: 32, price: 760 },
  yakuyoke: { name: '厄除け守', slot: 'charm', who: ['tabi', 'shiori', 'kariudo', 'sou', 'yukei'], ward: true, price: 25 }, // 呪い・取り憑きを半分はね返す
};

// その人が いま着けられるか（need＝その印が要る・retire＝その印が付くと着けない）
export const canWear = (flags, id, who) => {
  const e = EQUIP[id];
  return !!e && e.who.includes(who) && (!e.need || !!flags?.[e.need]) && (!e.retire || !flags?.[e.retire]);
};

export const SLOTS = ['weapon', 'armor', 'charm'];
export const SLOT_NAME = { weapon: '武器', armor: '防具', charm: 'お守り' };

export const START_EQUIP = {
  tabi: { weapon: 'bou', armor: null, charm: null },
  shiori: { weapon: null, armor: null, charm: null },
  kariudo: { weapon: null, armor: null, charm: null },
  sou: { weapon: null, armor: null, charm: null },
  yukei: { weapon: null, armor: null, charm: null },
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
  // 10〜14＝2章 県北（10/4）。10＝飴買い幽霊（相馬の品のまま）・11＝ご坊狐（福島の刀屋の得物）・12＝ムカデとオロチ・13＝へっぴり嫁（大鎧）・14＝鬼婆
  10: { tabi: { weapon: 'nodachi', armor: 'kusari', charm: null }, shiori: { weapon: 'oonaginata', armor: 'kusari', charm: null }, kariudo: { weapon: 'jumonji', armor: 'kusari', charm: null }, sou: { weapon: 'tetsushakujo', armor: 'kusari', charm: null } },
  11: { tabi: { weapon: 'meito', armor: 'kusari', charm: null }, shiori: { weapon: 'oonaginata', armor: 'kusari', charm: null }, kariudo: { weapon: 'jumonji', armor: 'kusari', charm: null }, sou: { weapon: 'tetsushakujo', armor: 'kusari', charm: null } },
  12: { tabi: { weapon: 'meito', armor: 'kusari', charm: null }, shiori: { weapon: 'hokonaginata', armor: 'kusari', charm: null }, kariudo: { weapon: 'matagiyari', armor: 'kusari', charm: null }, sou: { weapon: 'ginshakujo', armor: 'kusari', charm: null } },
  13: { tabi: { weapon: 'meito', armor: 'yoroi', charm: null }, shiori: { weapon: 'hokonaginata', armor: 'kusari', charm: null }, kariudo: { weapon: 'matagiyari', armor: 'yoroi', charm: null }, sou: { weapon: 'ginshakujo', armor: 'kusari', charm: null } },
  14: { tabi: { weapon: 'meito', armor: 'yoroi', charm: null }, shiori: { weapon: 'hokonaginata', armor: 'yoroi', charm: null }, kariudo: { weapon: 'matagiyari', armor: 'yoroi', charm: null }, sou: { weapon: 'ginshakujo', armor: 'yoroi', charm: null } },
  // 15〜19＝3章 県中・県南（10/4・仲間は 武士・くノ一・猟師・僧＝10/4 夜 祐慶は仲間にしない・しおりは くノ一＝苦無→鎧通し）。15＝蛇骨地蔵と三春駒（県北の品のまま）・16＝大多鬼丸と猫（郡山の得物）・17＝天狗と託善（具足を2人）・18〜19＝カッパと清姫（具足を4人）
  15: { tabi: { weapon: 'meito', armor: 'yoroi', charm: null }, shiori: { weapon: 'kunai', armor: 'yoroi', charm: null }, kariudo: { weapon: 'matagiyari', armor: 'yoroi', charm: null }, sou: { weapon: 'ginshakujo', armor: 'yoroi', charm: null } },
  16: { tabi: { weapon: 'ootachi', armor: 'yoroi', charm: null }, shiori: { weapon: 'yoroidoshi', armor: 'yoroi', charm: null }, kariudo: { weapon: 'oomiyari', armor: 'yoroi', charm: null }, sou: { weapon: 'kinshakujo', armor: 'yoroi', charm: null } },
  17: { tabi: { weapon: 'ootachi', armor: 'gusoku', charm: null }, shiori: { weapon: 'yoroidoshi', armor: 'yoroi', charm: null }, kariudo: { weapon: 'oomiyari', armor: 'gusoku', charm: null }, sou: { weapon: 'kinshakujo', armor: 'yoroi', charm: null } },
  18: { tabi: { weapon: 'ootachi', armor: 'gusoku', charm: null }, shiori: { weapon: 'yoroidoshi', armor: 'gusoku', charm: null }, kariudo: { weapon: 'oomiyari', armor: 'gusoku', charm: null }, sou: { weapon: 'kinshakujo', armor: 'gusoku', charm: null } },
  19: { tabi: { weapon: 'ootachi', armor: 'gusoku', charm: null }, shiori: { weapon: 'yoroidoshi', armor: 'gusoku', charm: null }, kariudo: { weapon: 'oomiyari', armor: 'gusoku', charm: null }, sou: { weapon: 'kinshakujo', armor: 'gusoku', charm: null } },
};
