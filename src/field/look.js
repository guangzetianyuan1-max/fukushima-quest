// 歩く地図の見た目（Gemini の絵・2026-10-02 本人「いわきを作り直し」）
// 1マス＝地面（assets/tiles/g_*.png・32×32）＋上に置く物（o_*.png・下の辺をマスの下にそろえる）
// 通れるかどうかは tiles.js の TERRAIN のまま（見た目だけを変える）
import { BOSS_AT, WALL_OPENED_BY, ROAD_OPENED_BY, wallOpen } from './game.js?v=178';
import { kanbanAt, KANBAN_KINDS } from './kanban.js?v=178';

export const GROUNDS = ['grass', 'sand', 'road', 'stone', 'floor', 'paddy', 'sea', 'river', 'pond', 'onsen'];
export const OBJECTS = [
  'tree', 'forest', 'rockmtn', 'rock', 'plank', 'snowmtn', 'bridge', 'vortex', 'mistwall',
  'minka', 'mise', 'yadoya', 'torii', 'jinja', 'tera', 'shiro', 'sekisho', 'counter', 'hei', 'fune', 'toro',
  'icon_minka', 'icon_yadoya', 'icon_mise', 'icon_torii',
  // 福島らしい景色（10/4・art_src/prep_scenery.py）
  'sakura', 'shidare', 'sakura2', 'momo_hana', 'momo_mi', 'kuwa', 'kuwa2', 'yukisugi', 'yuki', 'yuki2', 'kaki', 'kaki2',
  // 浜の景色（10/4・art_src/prep_beach.py）
  'toudai', 'gyosen', 'katsuo', 'tetra', 'hamamatsu', 'hoshidana', 'kobune', 'kamome', 'ami',
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
export const SHIDARE_AT = { kenpoku: [10, 40] }; // しだれ桜は1本だけ（二本松の桜の林のまん中）

// 林（T）のマスに置く木
export function grovePiece(map, x, y) {
  const base = vary(x, y) < 3 ? 'forest' : 'tree';
  const sh = SHIDARE_AT[map];
  if (sh && sh[0] === x && sh[1] === y) return 'shidare';
  if (map === 'kenpoku') {
    const g = KENPOKU_GROVES.find((r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1);
    return g ? pick(g.kinds, x, y) : base; // 安達ヶ原（y45〜）は暗い杉のまま
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
  if (map === 'kenpoku' && x <= 4) {
    const h = hash100(x, y);
    return h < 40 ? 'yukisugi' : h < 52 ? pick(['yuki', 'yuki2'], x, y) : 'snowmtn';
  }
  return x <= 3 && vary(x, y) < 2 ? 'snowmtn' : 'rockmtn';
}

// 歩く地図：字 → { ground, objs: [名前…] }
export function fieldLook(game, ch, x, y, map = 'field') {
  // 名所の立て看板は 10/5 に消した（名前は 字だけ＝FieldScene.makeKanbanLabels）
  if (ROAD_OPENED_BY[ch]) return { ground: game.cleared?.[ROAD_OPENED_BY[ch]] ? 'road' : 'grass', objs: [] }; // 龍燈を戻すと現れる相馬への道（10/3）
  const boss = BOSS_AT[ch];
  if (boss) {
    const ground = ch === 'S' ? 'sand' : 'grass';
    return { ground, objs: [game.cleared?.[boss] ? 'icon_torii' : 'vortex'] };
  }
  if (WALL_OPENED_BY[ch]) {
    // 1・2＝川に架かる橋の上、ほか（3〜9・0・%・&）＝道の上（4＝いわきから相馬への口・5＝大悲山への入口・6＝相馬の北・8〜＝2章）。晴れたら橋（道）だけ
    const onRoad = ch !== '1' && ch !== '2';
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
    case 'Y': return { ground: 'grass', objs: ['icon_yadoya'] };
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
    default: return { ground: 'grass', objs: [] };
  }
}

// 町の中：字 → 地面と小物（建物は towns.js の props で、何マスかにまたがって置く）
const TOWN_GROUND = { '.': 'grass', '=': 'stone', ',': 'sand', '#': 'grass', _: 'floor', c: 'floor', T: 'grass', '~': 'sea', u: 'onsen', z: 'grass', t: 'stone', x: 'stone' };
export function townLook(ch, x, y) {
  const objs = ch === 'T' ? ['tree'] : ch === 't' ? ['torii'] : [];
  return { ground: TOWN_GROUND[ch] ?? 'grass', objs };
}
export const TOWN_CHARS = Object.keys(TOWN_GROUND);
