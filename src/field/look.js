// 歩く地図の見た目（Gemini の絵・2026-10-02 本人「いわきを作り直し」）
// 1マス＝地面（assets/tiles/g_*.png・32×32）＋上に置く物（o_*.png・下の辺をマスの下にそろえる）
// 通れるかどうかは tiles.js の TERRAIN のまま（見た目だけを変える）
import { AIZU_SNOW_FROM_Y } from './aizu_map.js?v=279';
import { BOSS_AT, WALL_OPENED_BY, ROAD_OPENED_BY, wallOpen } from './game.js?v=279';
import { kanbanAt, KANBAN_KINDS } from './kanban.js?v=279';
import { QUEST_BOSS_AT, GATE_OF, questAccepted } from './castle.js?v=279';
import { endFoeReady } from './rally.js?v=279';

// 温泉マーク（10/5 夜 l65904・岩の露天風呂と湯小屋）
export const ONSEN_ICON = 'icon_onsen';
export const GROUNDS = ['grass', 'sand', 'road', 'stone', 'floor', 'paddy', 'sea', 'river', 'pond', 'onsen', 'tatami', 'jodan', 'fusuma', 'itama', 'ochiba', 'ochiba2', 'yuki'];
export const OBJECTS = [
  'tree', 'forest', 'rockmtn', 'rock', 'plank', 'snowmtn', 'bridge', 'vortex', 'mistwall',
  'minka', 'mise', 'yadoya', 'torii', 'jinja', 'tera', 'shiro', 'sekisho', 'counter', 'hei', 'fune', 'toro',
  'icon_minka', 'icon_yadoya', 'icon_mise', 'icon_torii', 'icon_onsen',
  // 福島らしい景色（10/4・art_src/prep_scenery.py）
  'sakura', 'shidare', 'sakura2', 'momo_hana', 'momo_mi', 'kuwa', 'kuwa2', 'yukisugi', 'yuki', 'yuki2', 'kaki', 'kaki2',
  // 会津の 紅葉と 南会津の 雪の 木（10/8・art_src/prep_season_trees.py・足もとは 落ち葉と 雪）
  'momiji', 'icho', 'koyo', 'yukisugi2', 'kareki', 'yukimatsu',
  // 浜の景色（10/4・art_src/prep_beach.py）
  'toudai', 'gyosen', 'katsuo', 'tetra', 'hamamatsu', 'hoshidana', 'kobune', 'kamome', 'ami',
  // 町の建物（10/6・art_src/prep_buildings.py＝城下町・町の店・温泉と港）
  'tenshu', 'mon', 'ishigaki', 'bukeyashiki', 'hinomi', 'dobei', 'kura', 'machiya', 'katanaya', 'gusokuya', 'kusuriya', 'chaya', 'hatago', 'kashiya', 'sakaya', 'ido', 'yuya', 'tojiyado', 'yugoya', 'banya', 'ichiba', 'ashiyu', 'hokora',
  // 名所の立て看板（10/4・art_src/prep_kanban.py）
  ...KANBAN_KINDS.map((k) => `kanban_${k}`),
];

// 同じ物ばかり並ぶと単調＝マスの場所で少し散らす
const vary = (x, y) => (x * 7 + y * 13) % 5;
// 0〜99 の散らし（マスごとに決まる・遊ぶたびに変わらない）
const hash100 = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 100;
const pick = (list, x, y) => list[hash100(x * 3 + 1, y * 5 + 2) % list.length];

// ⭐福島らしい景色（本人 10/4「移動時の景色も福島らしさが欲しい。桜、雪、桑の木(川俣)、桃など…飽きのこない背景に」）
// 県北の林（T）は区画ごとに土地の実り：北＝福島・伊達の桃と柿／真ん中＝川俣の桑／南＝二本松の桜（しだれ桜を1本だけ目印に）／安達ヶ原の林は暗い杉のまま
export const KENPOKU_GROVES = [
  { x0: 0, y0: 0, x1: 35, y1: 16, kinds: ['momo_hana', 'momo_mi', 'momo_hana', 'kaki', 'kaki2'] },
  { x0: 0, y0: 17, x1: 12, y1: 30, kinds: ['momo_mi', 'momo_hana', 'kaki'] },
  { x0: 13, y0: 17, x1: 35, y1: 30, kinds: ['kuwa', 'kuwa2'] },
  { x0: 0, y0: 31, x1: 35, y1: 44, kinds: ['sakura', 'sakura', 'sakura2'] },
];
export const SHIDARE_AT = { kenpoku: [10, 40] };
// ⭐会津（4章・10/6 本人「会津は紅葉、南会津は雪で」）＝林は紅葉・南の端（AIZU_SNOW_FROM_Y から南＝金山・沼沢湖）は雪の杉と雪の小山
//   紅葉の木の絵が届くまでは 柿の木（実の橙）を借りる＝AIZU_AUTUMN を momiji に替える
export const AIZU_AUTUMN = ['momiji', 'koyo', 'icho', 'momiji', 'koyo']; // 10/8 本人「会津は紅葉の木多め」＝紅葉の 木だけ（赤を 多めに・udf4oy）
// 雪の 林（南会津と 会津の 南の 端）＝細い 雪の 杉を 主に、雪の 枯れ木・雪の 松・雪の 小山を 混ぜる（10/8 本人「南会津は雪の木多め」）
export function snowGrove(x, y) {
  const h = hash100(x, y);
  return h < 55 ? 'yukisugi2' : h < 75 ? 'kareki' : h < 90 ? 'yukimatsu' : pick(['yuki', 'yuki2'], x, y);
}

// 林（T）のマスに置く木
export function grovePiece(map, x, y) {
  const base = vary(x, y) < 3 ? 'forest' : 'tree';
  const sh = SHIDARE_AT[map];
  if (sh && sh[0] === x && sh[1] === y) return 'shidare';
  if (map === 'kenpoku') {
    const g = KENPOKU_GROVES.find((r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1);
    return g ? pick(g.kinds, x, y) : base; // 安達ヶ原（y45〜）は暗い杉のまま
  }
  if (map === 'minami') return snowGrove(x, y); // 終章 南会津は 全部 雪
  if (map === 'aizu') {
    if (y >= AIZU_SNOW_FROM_Y) return snowGrove(x, y);
    return pick(AIZU_AUTUMN, x, y);
  }
  const h = hash100(x, y);
  if (map === 'soma') return h < 22 ? 'sakura' : h < 30 ? 'sakura2' : base; // 相馬の林に桜をところどころ
  return h < 16 ? 'sakura' : h < 22 ? 'sakura2' : base; // いわき
}

// ⭐浜の景色（本人 10/4「浜はカツオ、灯台など、現代のものもOK」）
// 灯台は実在の岬に1本ずつ：いわき＝塩屋埼（平と小名浜のあいだ）／相馬＝松川浦の鵜ノ尾埼
export const TOUDAI_AT = { field: [31, 26], soma: [27, 4] };
// 砂浜（,）：浜の黒松・干物の干し棚・網と浮き玉・消波ブロックを ところどころ（3割）
export function sandPiece(map, x, y) {
  const t = TOUDAI_AT[map];
  if (t && t[0] === x && t[1] === y) return ['toudai'];
  return hash100(x, y) < 30 ? [pick(['hamamatsu', 'hoshidana', 'ami', 'tetra', 'hamamatsu'], x, y)] : [];
}
// 海（~）：漁船・小舟・跳ねるカツオ・カモメを まばらに（5%）
export function seaPiece(map, x, y) {
  return hash100(x + 11, y + 7) < 5 ? [pick(['gyosen', 'kobune', 'katsuo', 'kamome'], x, y)] : [];
}

// 山（^）のマスに置く物。県北の西の山すそ（吾妻）は雪をかぶった杉と雪の小山
export function mountainPiece(map, x, y) {
  if (map === 'minami') return vary(x, y) < 3 ? 'snowmtn' : 'yukisugi2'; // 終章 南会津（10/8・杉は 足もとが 雪の 方）
  if (map === 'aizu') {
    if (y >= AIZU_SNOW_FROM_Y - 1) return vary(x, y) < 3 ? 'snowmtn' : 'yukisugi2';
    return vary(x, y) < 1 ? 'snowmtn' : 'rockmtn'; // 磐梯山・猫魔ヶ岳の 頂は ところどころ 雪
  }
  if (map === 'kenpoku' && x <= 4) {
    const h = hash100(x, y);
    return h < 40 ? 'yukisugi' : h < 52 ? pick(['yuki', 'yuki2'], x, y) : 'snowmtn';
  }
  return x <= 3 && vary(x, y) < 2 ? 'snowmtn' : 'rockmtn';
}

// ⭐季節の 地面（10/8 本人「会津は緑の芝生→おうどいろの落ち葉、南会津は緑の芝生→白の雪」）＝芝生（grass）の マスだけ 張り替える（道・川・砂は そのまま）
//   会津＝落ち葉（2枚を マスごとに 散らす＝1枚だと 柄が 碁盤の 目に 見える）・南の端（AIZU_SNOW_FROM_Y から南）と 南会津＝雪。町の中（townLook）は 触らない
export function seasonGround(map, x, y) {
  if (map === 'minami' || (map === 'aizu' && y >= AIZU_SNOW_FROM_Y)) return 'yuki';
  if (map === 'aizu') return hash100(x + 5, y + 3) < 50 ? 'ochiba' : 'ochiba2';
  return 'grass';
}

// 歩く地図：字 → { ground, objs: [名前…] }
export function fieldLook(game, ch, x, y, map = 'field') {
  const look = baseLook(game, ch, x, y, map);
  return look.ground === 'grass' ? { ...look, ground: seasonGround(map, x, y) } : look;
}

function baseLook(game, ch, x, y, map) {
  const look = baseLook0(game, ch, x, y, map);
  // 10/9 終章の 印（婆・駒・滝・舞）は 戦える 間だけ 黒い うずを 重ねる（ほかの ボスと 同じ 目印）
  return END_MARKS.includes(ch) && game && endFoeReady(game, ch) ? { ...look, objs: [...look.objs, 'vortex'] } : look;
}
const END_MARKS = ['婆', '駒', '滝', '舞'];

function baseLook0(game, ch, x, y, map) {
  // 名所の立て看板は 10/5 に消した（名前は 字だけ＝FieldScene.makeKanbanLabels）
  if (ROAD_OPENED_BY[ch]) return { ground: game.cleared?.[ROAD_OPENED_BY[ch]] ? 'road' : 'grass', objs: [] }; // 龍燈を戻すと現れる相馬への道（10/3）
  // お城クエストの 入口（10/7）＝お題を 受けるまでは ただの 草地・受けると 道しるべ
  if (GATE_OF[ch]) return { ground: 'grass', objs: questAccepted(game, GATE_OF[ch]) ? ['kanban_michi'] : [] };
  const boss = BOSS_AT[ch];
  if (boss) {
    const ground = ch === 'S' ? 'sand' : 'grass';
    return { ground, objs: [game.cleared?.[boss] ? 'icon_torii' : 'vortex'] };
  }
  if (WALL_OPENED_BY[ch]) {
    // 1・2＝川に架かる橋の上、ほか（3〜9・0・%・&）＝道の上（4＝いわきから相馬への口・5＝大悲山への入口・6＝相馬の北・8〜＝2章）。晴れたら橋（道）だけ
    const onRoad = ch !== '1' && ch !== '2' && ch !== '五'; // 五＝只見川の 橋の 上（4章）
    const ground = onRoad ? 'road' : 'river';
    const deck = onRoad ? [] : ['plank'];
    // 晴れるのは ボスを戻し、その章のクエストも済んだとき（10/4 本人「クエストが終わっていない場合、進めないように」＝相馬の西の口は武士になるまで もやのまま）
    return { ground, objs: wallOpen(game, ch) ? deck : [...deck, 'mistwall'] };
  }
  switch (ch) {
    case '~': return { ground: 'sea', objs: seaPiece(map, x, y) };
    case ',': return { ground: 'sand', objs: sandPiece(map, x, y) };
    case 'w': return { ground: 'river', objs: [] };
    case 'o': return { ground: 'pond', objs: [] };
    case '=': return { ground: 'road', objs: [] };
    case 'b': return { ground: 'river', objs: ['plank'] };
    case 'T': return { ground: 'grass', objs: [grovePiece(map, x, y)] };
    case '^': return { ground: 'grass', objs: [mountainPiece(map, x, y)] };
    case 'N': return { ground: 'road', objs: ['sekisho'] };
    case 'H': return { ground: 'grass', objs: ['shiro'] };
    case 'Y': return { ground: 'grass', objs: [ONSEN_ICON] }; // 湯本温泉（10/6 本人「いわき湯本温泉は温泉です。温泉マークに」）
    case 'O': return { ground: 'sand', objs: ['icon_mise'] };
    case 'Q': return { ground: 'grass', objs: ['icon_yadoya'] }; // 小高の町（10/3 1章）
    case 'M': return { ground: 'grass', objs: ['shiro'] }; // 相馬の町（中村城の城下・10/3 1章）
    case 'P': return { ground: 'grass', objs: ['hei'] }; // 雲雀ヶ原の祭場地（矢来の囲い＋上に旗の目印・10/3）
    case 'E': return { ground: 'road', objs: ['sekisho'] }; // 地図の口（いわき⇔相馬）＝関所の門
    case 'X': return { ground: 'road', objs: ['sekisho'] }; // 地図の口（相馬⇔県北・10/4）
    case 'U': return { ground: 'grass', objs: ['icon_yadoya'] }; // 福島の町（信夫山のふもと・10/4 2章）
    case 'W': return { ground: 'grass', objs: ['shiro'] }; // 二本松の町（城下・10/4 2章）
    case 'k': return { ground: 'grass', objs: ['toro'] }; // 二本松の提灯祭り（イベント・10/4）
    // 3章 県中・県南（10/4）
    case 'I': return { ground: 'road', objs: ['sekisho'] }; // 地図の口（県北⇔県中）
    case 'g': return { ground: 'grass', objs: ['icon_yadoya'] }; // 郡山の町（奥州街道の宿場）
    case 's': return { ground: 'grass', objs: ['icon_mise'] }; // 須賀川の町
    case 'v': return { ground: 'grass', objs: ['shiro'] }; // 白河の町（小峰城の城下）
    case 'a': return { ground: 'grass', objs: ['toro'] }; // 須賀川の松明あかし（イベント）
    // 4章 会津（10/6）
    case '関': return { ground: 'road', objs: ['sekisho'] }; // 地図の口（甲子峠＝県中⇔会津）
    case '苗': return { ground: 'grass', objs: ['icon_yadoya'] }; // 猪苗代の町
    case '若': return { ground: 'grass', objs: ['shiro'] }; // 会津若松の町（鶴ヶ城の城下）
    case '津': return { ground: 'grass', objs: ['icon_mise'] }; // 柳津の町（圓藏寺の門前）
    case '南': return { ground: 'road', objs: ['sekisho'] }; // 地図の口（会津⇔南会津・10/8 終章）
    case '檜': return { ground: 'grass', objs: ['icon_minka'] }; // 檜枝岐の村
    case '田': return { ground: 'grass', objs: ['icon_yadoya'] }; // 田島の町（10/8 夜・会津西街道の 宿場）
    case '婆': return { ground: 'grass', objs: ['hokora'] }; // 橋場のばんば（参道の 途中の 祠・段1では 印だけ）
    case '舞': return { ground: 'grass', objs: ['jinja'] };
    case '駒': return { ground: 'grass', objs: ['snowmtn'] }; // 会津駒ヶ岳の 登り口（10/8・絵が届くまで 雪山）
    case '滝': return { ground: 'river', objs: ['rock'] }; // モーカケの滝（10/8・絵が届くまで 水と 岩） // 檜枝岐の舞台（鎮守神社の 境内・段1では 印だけ）
    case '.': return { ground: 'grass', objs: (map === 'minami' || (map === 'aizu' && y >= AIZU_SNOW_FROM_Y)) && hash100(x, y) < 22 ? [pick(['yuki', 'yuki2'], x, y)] : [] }; // 南会津の雪（雪の地面の絵が届くまで 雪の 小山を 散らす）
    // 温泉地（10/5 夜）＝温泉マーク（絵が届くまで 宿屋の記号を借りる・ONSEN_ICON）。名前は 立て看板と同じ 字だけ（kanban.js）
    case 'e':
    case 'f':
    case 'j':
    case 'l':
    case 'c':
    case 'x':
    case 'u':
    case 'y':
    case 'i':
    case '沢':
    case '東':
    case '芦':
    case '西':
    case '早':
      return { ground: 'grass', objs: [ONSEN_ICON] };
    default: return { ground: 'grass', objs: [] };
  }
}

// 町の中：字 → 地面と小物（建物は towns.js の props で、何マスかにまたがって置く）
// 10/5 夜 町の形を作り直した（art_src/make_towns.py の GROUND・OBJ と同じ）。堀と池（p）は 川の水の色（沼の色は 黒く沈んだ）
const TOWN_GROUND = { '.': 'grass', '=': 'stone', ',': 'sand', '#': 'grass', _: 'floor', c: 'floor', T: 'grass', '~': 'sea', u: 'onsen', z: 'grass', t: 'stone', x: 'stone',
  k: 'grass', K: 'grass', m: 'grass', Y: 'grass', R: 'grass', l: 'stone', r: 'river', b: 'river', p: 'river', d: 'road', H: 'sand', a: 'sand', P: 'sea', S: 'grass', w: 'paddy',
  N: 'fusuma', 上: 'jodan', J: 'tatami', B: 'itama', 鬼: 'stone', 臼: 'stone', 石: 'stone', 剣: 'stone', 鏡: 'stone' }; // 10/7 お城の 大広間（絵は art_src/make_castle_tiles.py）
const TOWN_OBJ = { T: 'tree', t: 'torii', k: 'sakura', K: 'kaki', m: 'momo_hana', Y: 'yukisugi', R: 'rock', l: 'toro', b: 'bridge', H: 'hoshidana', a: 'ami', P: 'plank', S: 'shidare' };
// ⭐町の 中の 季節（10/9 本人「南会津は町中も雪」「会津は町中も紅葉」）＝会津の 町は 紅葉・南会津の 町は 雪（お城の 大広間と お題の 場所は 変えない）
//   会津の 町は どれも 地図の 雪の 線（AIZU_SNOW_FROM_Y）より 北（試験＝look.test が 地図の 場所から 確かめる）
export const AUTUMN_TOWNS = ['inawashiro', 'aizuwakamatsu', 'yanaizu', 'nakanosawa', 'higashiyama', 'ashinomaki', 'nishiyama', 'hayato'];
export const SNOW_TOWNS = ['hinoemata', 'tajima'];
export const townSeason = (town) => (AUTUMN_TOWNS.includes(town) ? 'autumn' : SNOW_TOWNS.includes(town) ? 'snow' : null);
const TREE_CHARS = ['T', 'Y', 'K', 'k', 'm']; // 町の 木（足もとが 緑の 草の 絵）＝季節の 町では 季節の 木に 替える
export function townLook(ch, x, y, game = null, town = null) {
  // お題の 怪物の 場所（10/7）：もやの 渦・元に戻すと 鳥居
  if (QUEST_BOSS_AT[ch]) return { ground: 'stone', objs: [game?.cleared?.[QUEST_BOSS_AT[ch]] ? 'icon_torii' : 'vortex'] };
  let objs = TOWN_OBJ[ch] ? [TOWN_OBJ[ch]] : [];
  let ground = TOWN_GROUND[ch] ?? 'grass';
  const season = townSeason(town);
  if (season) {
    if (ground === 'grass') ground = season === 'snow' ? 'yuki' : hash100(x + 5, y + 3) < 50 ? 'ochiba' : 'ochiba2';
    if (TREE_CHARS.includes(ch)) objs = [season === 'snow' ? pick(['yukisugi2', 'yukisugi2', 'kareki', 'yukimatsu'], x, y) : pick(AIZU_AUTUMN, x, y)];
  }
  return { ground, objs };
}
export const TOWN_CHARS = Object.keys(TOWN_GROUND);
