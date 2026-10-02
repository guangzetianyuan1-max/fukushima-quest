// 歩く地図の見た目（Gemini の絵・2026-10-02 本人「いわきを作り直し」）
// 1マス＝地面（assets/tiles/g_*.png・32×32）＋上に置く物（o_*.png・下の辺をマスの下にそろえる）
// 通れるかどうかは tiles.js の TERRAIN のまま（見た目だけを変える）
import { BOSS_AT, WALL_OPENED_BY } from './game.js?v=82';

export const GROUNDS = ['grass', 'sand', 'road', 'stone', 'floor', 'paddy', 'sea', 'river', 'pond', 'onsen'];
export const OBJECTS = [
  'tree', 'forest', 'rockmtn', 'rock', 'plank', 'snowmtn', 'bridge', 'vortex', 'mistwall',
  'minka', 'mise', 'yadoya', 'torii', 'jinja', 'tera', 'shiro', 'sekisho', 'counter', 'hei', 'fune', 'toro',
  'icon_minka', 'icon_yadoya', 'icon_mise', 'icon_torii',
];

// 同じ物ばかり並ぶと単調＝マスの場所で少し散らす
const vary = (x, y) => (x * 7 + y * 13) % 5;

// 歩く地図：字 → { ground, objs: [名前…] }
export function fieldLook(game, ch, x, y) {
  const boss = BOSS_AT[ch];
  if (boss) {
    const ground = ch === 'S' ? 'sand' : 'grass';
    return { ground, objs: [game.cleared?.[boss] ? 'icon_torii' : 'vortex'] };
  }
  if (WALL_OPENED_BY[ch]) {
    // 1・2＝川に架かる橋の上、3〜6＝道の上（4＝いわきから相馬への口・5＝大悲山への入口・6＝相馬の北）。晴れたら橋（道）だけ
    const onRoad = Number(ch) >= 3;
    const ground = onRoad ? 'road' : 'river';
    const deck = onRoad ? [] : ['plank'];
    return { ground, objs: game.cleared?.[WALL_OPENED_BY[ch]] ? deck : [...deck, 'mistwall'] };
  }
  switch (ch) {
    case '~': return { ground: 'sea', objs: [] };
    case ',': return { ground: 'sand', objs: [] };
    case 'w': return { ground: 'river', objs: [] };
    case 'o': return { ground: 'pond', objs: [] };
    case '=': return { ground: 'road', objs: [] };
    case 'b': return { ground: 'river', objs: ['plank'] };
    case 'T': return { ground: 'grass', objs: [vary(x, y) < 3 ? 'forest' : 'tree'] };
    case '^': return { ground: 'grass', objs: [x <= 3 && vary(x, y) < 2 ? 'snowmtn' : 'rockmtn'] };
    case 'N': return { ground: 'road', objs: ['sekisho'] };
    case 'H': return { ground: 'grass', objs: ['shiro'] };
    case 'Y': return { ground: 'grass', objs: ['icon_yadoya'] };
    case 'O': return { ground: 'sand', objs: ['icon_mise'] };
    case 'Q': return { ground: 'grass', objs: ['icon_yadoya'] }; // 小高の町（10/3 1章）
    case 'M': return { ground: 'grass', objs: ['shiro'] }; // 相馬の町（中村城の城下・10/3 1章）
    case 'E': return { ground: 'road', objs: ['sekisho'] }; // 地図の口（いわき⇔相馬）＝関所の門
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
