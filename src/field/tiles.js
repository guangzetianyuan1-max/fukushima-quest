// 歩く地図のマス目の絵（16×16ドット）を、プログラムで描く（本人 10/1「Claudeがドットで描く」）
// 画面では2倍（1マス32ドット）。絵は1本の横長の帯（tileset）にして Phaser の tilemap に渡す
import { makeRng } from '../battle/rules.js?v=328';

export const TILE = 16;

// ---- 1マスずつの描き方（c＝描く道具。x,y は0〜15）----
function painter(ctx, ox) {
  const p = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(ox + x, y, 1, 1); };
  const r = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(ox + x, y, w, h); };
  const specks = (seed, n, col) => { const g = makeRng(seed); for (let i = 0; i < n; i++) p(Math.floor(g() * 16), Math.floor(g() * 16), col); };
  return { p, r, specks };
}

const GRASS = '#4c9a3f';
const SAND = '#e3cf96';
const SEA = '#2f5fb3';
const RIVER = '#4f86d6';
const ROAD = '#c8a86a';
const STONE = '#b9b3a5';

function grass(c, seed = 1) { c.r(0, 0, 16, 16, GRASS); c.specks(seed, 12, '#3f8434'); c.specks(seed + 9, 6, '#6cb85a'); }
function water(c, base, light, seed) {
  c.r(0, 0, 16, 16, base);
  for (const [x, y] of [[2, 3], [9, 6], [4, 11], [11, 13]]) c.r(x, y, 3, 1, light);
  c.specks(seed, 4, light);
}
function mist(c) {
  c.r(0, 0, 16, 16, '#241532');
  for (const [x, y, w] of [[1, 2, 6], [8, 5, 7], [2, 9, 8], [6, 13, 7]]) c.r(x, y, w, 2, '#4b2f66');
  c.specks(7, 10, '#7b5aa0');
}
function torii(c) {
  c.r(3, 3, 10, 2, '#c8372d'); c.r(2, 2, 12, 1, '#2a1a12');
  c.r(4, 5, 8, 1, '#c8372d'); c.r(4, 5, 2, 10, '#c8372d'); c.r(10, 5, 2, 10, '#c8372d');
}
function roof(c, x, y, w, col, dark) { c.r(x, y, w, 2, dark); c.r(x + 1, y + 2, w - 2, 2, col); }
function house(c, x, y, wall = '#e8dcc0') { roof(c, x, y, 7, '#6b4a33', '#3c2a1e'); c.r(x + 1, y + 4, 5, 4, wall); c.r(x + 3, y + 5, 1, 3, '#3c2a1e'); }

const DRAW = {
  grass: (c) => grass(c),
  sand: (c) => { c.r(0, 0, 16, 16, SAND); c.specks(3, 10, '#cdb67c'); },
  sea: (c) => water(c, SEA, '#7fa7e8', 4),
  river: (c) => water(c, RIVER, '#a9c9f2', 5),
  pond: (c) => water(c, '#22406e', '#4b6fa6', 6),
  road: (c) => { c.r(0, 0, 16, 16, ROAD); c.specks(8, 10, '#a98c52'); c.specks(18, 5, '#dcc490'); },
  forest: (c) => {
    grass(c, 2);
    for (const [x, y] of [[1, 1], [8, 0], [4, 8], [11, 8]]) {
      c.r(x, y + 1, 5, 4, '#1f5e2a'); c.r(x + 1, y, 3, 1, '#1f5e2a'); c.r(x + 1, y + 1, 2, 2, '#2f7d37'); c.r(x + 2, y + 5, 1, 2, '#5b3a22');
    }
  },
  mountain: (c) => {
    grass(c, 3);
    for (let i = 0; i < 7; i++) c.r(8 - i - 1, 2 + i * 2, (i + 1) * 2 + 1, 2, i < 2 ? '#e8e8e8' : '#8a6a44');
    c.r(9, 6, 1, 10, '#6e5333'); c.specks(13, 6, '#6e5333');
  },
  bridge: (c) => { water(c, RIVER, '#a9c9f2', 5); c.r(2, 0, 12, 16, '#9b6b3c'); for (let y = 1; y < 16; y += 3) c.r(2, y, 12, 1, '#6e4a26'); c.r(1, 0, 1, 16, '#5a3a1e'); c.r(14, 0, 1, 16, '#5a3a1e'); },
  mist,
  gate: (c) => { grass(c, 4); c.r(1, 2, 14, 3, '#3c2a1e'); c.r(2, 5, 2, 10, '#6b4a33'); c.r(12, 5, 2, 10, '#6b4a33'); c.r(2, 7, 12, 1, '#6b4a33'); },
  town_taira: (c) => { grass(c, 5); c.r(5, 0, 6, 2, '#3c2a1e'); c.r(6, 2, 4, 3, '#f2efe6'); c.r(4, 5, 8, 2, '#3c2a1e'); c.r(5, 7, 6, 2, '#f2efe6'); house(c, 0, 8); house(c, 9, 8); },
  town_yumoto: (c) => { grass(c, 6); house(c, 1, 1); house(c, 8, 4); c.r(1, 11, 7, 4, '#7fb7d9'); c.r(2, 6, 1, 4, '#ffffff'); c.r(4, 5, 1, 5, '#ffffff'); c.r(6, 6, 1, 4, '#ffffff'); },
  town_onahama: (c) => { c.r(0, 0, 16, 16, SAND); c.r(0, 11, 16, 5, SEA); house(c, 1, 1); house(c, 8, 2); c.r(3, 12, 6, 2, '#6b4a33'); c.r(5, 9, 1, 3, '#f2efe6'); },
  boss: (c) => { grass(c, 7); c.r(3, 3, 10, 10, '#241532'); c.r(2, 5, 12, 6, '#241532'); c.r(5, 5, 6, 6, '#4b2f66'); c.r(7, 7, 2, 2, '#c33a3a'); },
  boss_sand: (c) => { c.r(0, 0, 16, 16, SAND); c.r(3, 3, 10, 10, '#241532'); c.r(2, 5, 12, 6, '#241532'); c.r(5, 5, 6, 6, '#4b2f66'); c.r(7, 7, 2, 2, '#c33a3a'); },
  cleared: (c) => { grass(c, 8); torii(c); },
  cleared_sand: (c) => { c.r(0, 0, 16, 16, SAND); torii(c); },
  // ---- 町の中 ----
  stone: (c) => { c.r(0, 0, 16, 16, STONE); for (const [x, y, w] of [[0, 0, 7], [8, 0, 8], [0, 8, 4], [5, 8, 7], [13, 8, 3]]) c.r(x, y, w, 1, '#8f8a7e'); c.r(7, 0, 1, 8, '#8f8a7e'); c.r(4, 8, 1, 8, '#8f8a7e'); c.r(12, 8, 1, 8, '#8f8a7e'); },
  wall: (c) => { c.r(0, 0, 16, 16, '#6b4a33'); for (let y = 3; y < 16; y += 4) c.r(0, y, 16, 1, '#4a3222'); c.r(0, 0, 16, 2, '#3c2a1e'); },
  floor: (c) => { c.r(0, 0, 16, 16, '#d9c58a'); c.r(0, 7, 16, 1, '#b8a46a'); c.r(7, 0, 1, 16, '#b8a46a'); },
  counter: (c) => { c.r(0, 0, 16, 16, '#d9c58a'); c.r(0, 4, 16, 9, '#8a5a2e'); c.r(0, 4, 16, 2, '#b47a40'); c.r(0, 12, 16, 1, '#4a3222'); },
  tree: (c) => { grass(c, 9); c.r(2, 1, 12, 9, '#1f5e2a'); c.r(4, 0, 8, 1, '#1f5e2a'); c.r(4, 2, 5, 4, '#2f7d37'); c.r(7, 10, 2, 5, '#5b3a22'); },
  hall: (c) => { c.r(0, 0, 16, 16, '#3c2a1e'); c.r(0, 4, 16, 3, '#6b4a33'); c.r(1, 7, 14, 9, '#a0322a'); c.r(3, 9, 2, 5, '#2a1a12'); c.r(11, 9, 2, 5, '#2a1a12'); },
  torii: (c) => { c.r(0, 0, 16, 16, STONE); torii(c); },
  onsen: (c) => { water(c, '#7fb7d9', '#e6f2fa', 10); c.r(3, 2, 1, 3, '#ffffff'); c.r(8, 1, 1, 4, '#ffffff'); c.r(12, 3, 1, 3, '#ffffff'); },
};

export const TILE_NAMES = Object.keys(DRAW);
export const TILE_INDEX = Object.fromEntries(TILE_NAMES.map((n, i) => [n, i]));

// 字 → マス目の絵と、通れるか（地図の字の意味は art_src/make_map.py の頭）
export const FIELD_TERRAIN = {
  '~': ['sea', false], ',': ['sand', true], '.': ['grass', true], T: ['forest', true], '^': ['mountain', false],
  w: ['river', false], o: ['pond', false], '=': ['road', true], b: ['bridge', true],
  1: ['mist', false], 2: ['mist', false], 3: ['mist', false], 4: ['mist', false], 5: ['mist', false], 6: ['mist', false], 7: ['mist', false],
  E: ['road', true], Q: ['town_yumoto', true], Z: ['boss', true], D: ['boss', true], L: ['boss', true], G: ['boss', true], M: ['town_taira', true], // 10/3 1章：E＝地図の口（いわき⇔相馬）・Q＝小高の町・Z／D＝ザルカブリ山／大悲山
  r: ['grass', true], // 龍燈を元に戻すと道になる（相馬への道・10/3）
  P: ['grass', true], // 雲雀ヶ原の祭場地（相馬野馬追の神旗争奪戦・10/3）
  N: ['gate', true], H: ['town_taira', true], Y: ['town_yumoto', true], O: ['town_onahama', true],
  S: ['boss_sand', true], K: ['boss', true], J: ['boss', true], R: ['boss', true],
  // 10/4 2章 県北：X＝相馬⇔県北の口・A／F／C／V／B＝飴買い幽霊／ご坊狐／ムカデとオロチ／へっぴり嫁／鬼婆・U＝福島の町・W＝二本松の町・k＝提灯祭り
  X: ['road', true], A: ['boss', true], F: ['boss', true], C: ['boss', true], V: ['boss', true], B: ['boss', true],
  U: ['town_taira', true], W: ['town_taira', true], k: ['grass', true],
  8: ['mist', false], 9: ['mist', false], 0: ['mist', false], '%': ['mist', false], '&': ['mist', false],
  // 10/4 3章 県中・県南：I＝県北⇔県中の口・h／d／t／p／z＝蛇骨地蔵／大多鬼丸／天狗／カッパ／清姫・g／s／v＝郡山／須賀川／白河の町
  //   m／n／q＝三春駒／和泉式部の猫（猫啼温泉）／託善和尚もボス（10/4 本人「戦う形で」）・a＝松明あかし・( ) [ ] {＝もやの壁
  I: ['road', true], h: ['boss', true], d: ['boss', true], t: ['boss', true], p: ['boss', true], z: ['boss', true],
  // 10/5 夜 温泉地（e f j l＝県北・c x u y i＝県中・県南）
  e: ['town_yumoto', true], f: ['town_yumoto', true], j: ['town_yumoto', true], l: ['town_yumoto', true],
  c: ['town_yumoto', true], x: ['town_yumoto', true], u: ['town_yumoto', true], y: ['town_yumoto', true], i: ['town_yumoto', true],
  沢: ['town_yumoto', true], 東: ['town_yumoto', true], 芦: ['town_yumoto', true], 西: ['town_yumoto', true], 早: ['town_yumoto', true], // 4章 会津の温泉地（10/6）
  g: ['town_taira', true], s: ['town_taira', true], v: ['town_taira', true], m: ['boss', true], n: ['boss', true], q: ['boss', true], a: ['grass', true],
  '(': ['mist', false], ')': ['mist', false], '[': ['mist', false], ']': ['mist', false], '{': ['mist', false], '}': ['mist', false], '<': ['mist', false], '>': ['mist', false],
  // 10/6 4章 会津（漢字1字＝英字と記号は 使い切った）：関＝3章⇔会津の口・峠＝3章の西の もや（清姫＋3章の技）・苗／若／津＝猪苗代／会津若松／柳津の町
  //   亀／猫／足／朱／牛／河／狐／沼＝亀姫／猫魔ヶ岳の化け猫／手長足長／朱の盤／赤べこ／河童の恩返し／母子狐／沼御前・一〜七＝もやの壁
  関: ['road', true], 峠: ['mist', false], 苗: ['town_yumoto', true], 若: ['town_taira', true], 津: ['town_taira', true],
  亀: ['boss', true], 猫: ['boss', true], 足: ['boss', true], 朱: ['boss', true], 牛: ['boss', true], 河: ['boss', true], 狐: ['boss', true], 沼: ['boss', true],
  一: ['mist', false], 二: ['mist', false], 三: ['mist', false], 四: ['mist', false], 五: ['mist', false], 六: ['mist', false], 七: ['mist', false],
  // 10/8 終章 南会津：南＝会津⇔南会津の口・八＝その もや（沼御前）・檜＝檜枝岐の村・婆＝橋場のばんば（段1は 印だけ）・九＝参道の もや（ばんば）・舞＝檜枝岐の舞台（段1は 印だけ）
  南: ['road', true], 八: ['mist', false], 檜: ['town_yumoto', true], 田: ['town_yumoto', true], 婆: ['grass', false], 九: ['mist', false], 十: ['mist', false], 只: ['town_yumoto', true], 舞: ['grass', false], 駒: ['grass', false], 滝: ['grass', false], // 駒＝会津駒ヶ岳の 登り口・滝＝モーカケの滝（10/8 段2a・いまは 印だけ）
  ア: ['grass', true], イ: ['grass', true], ウ: ['grass', true], エ: ['grass', true], オ: ['grass', true], // 10/7 お城クエストの 入口（お題を 受けると ひらく・castle.js）
};
export const TOWN_TERRAIN = {
  '.': ['grass', true], '=': ['stone', true], ',': ['sand', true], '#': ['wall', false], _: ['floor', true],
  c: ['counter', false], T: ['tree', false], '~': ['sea', false], u: ['onsen', false], z: ['hall', false],
  t: ['torii', true], x: ['stone', true],
  // 10/5 夜 町の形を作り直した（art_src/make_towns.py）
  k: ['tree', false], K: ['tree', false], m: ['tree', false], Y: ['tree', false], S: ['tree', false], R: ['wall', false], l: ['wall', false],
  r: ['sea', false], p: ['sea', false], b: ['stone', true], d: ['stone', true], H: ['wall', false], a: ['wall', false], P: ['stone', true], w: ['wall', false],
  // 10/7 お城クエスト（src/field/castle.js）：N＝襖の壁・上＝上段の間・J＝畳・B＝板の間／鬼〜鏡＝お題の 怪物の 場所
  N: ['wall', false], 上: ['floor', true], J: ['floor', true], B: ['floor', true],
  鬼: ['stone', true], 臼: ['stone', true], 石: ['stone', true], 剣: ['stone', true], 鏡: ['stone', true],
  q: ['stone', true], 豆: ['stone', true], // 10/9 q＝只見の 町の 奥の 沢への 口・豆＝只見川の 沢の 小豆洗い
};

// 絵の帯を1枚作って Phaser に登録する（1度だけ）
export function makeTileset(scene) {
  if (scene.textures.exists('tiles')) return;
  const tex = scene.textures.createCanvas('tiles', TILE * TILE_NAMES.length, TILE);
  const ctx = tex.getContext();
  TILE_NAMES.forEach((n, i) => DRAW[n](painter(ctx, i * TILE)));
  tex.refresh();
}
