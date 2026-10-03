// 旅の状態（居場所・文・持ち物・仲間の HP・元に戻したボス・記録）。画面と切り離す＝Node で試験する
// ここの関数は game を書き換えずに、新しい game を返す
import { IWAKI_ROWS } from './iwaki_map.js?v=97';
import { SOMA_ROWS } from './soma_map.js?v=97';
import { FIELD_TERRAIN, TOWN_TERRAIN } from './tiles.js?v=97';
import { TOWNS, TOWN_ENTRY } from './towns.js?v=97';
import { ITEMS, PRICE, OLD_ITEM } from '../data/items.js?v=97';
import { ZAKO, ZAKO_TELL } from '../data/zako.js?v=97';
import { statsAt, levelFor, EXP_TO, PARTY_IDS, ALL_IDS, MAX_PARTY, membersOf, statsWithGear } from '../battle/levels.js?v=97';
import { COMPANIONS, COMPANION_SPELLS, JOIN_AFTER } from '../data/companions.js?v=97';
import { EQUIP, START_EQUIP } from '../data/equip.js?v=97';

export const SAVE_KEY = 'fq-save-v1';

// 地図の字 → ボス（episodes.js の enemy.id）と、もやの壁 → 晴れる条件
export const BOSS_AT = { S: 'matsukawa', K: 'kashinuma', J: 'jagan', R: 'ryuto', Z: 'zarukaburi', D: 'daihisan', L: 'tenaga', G: 'sumitora' };
export const WALL_OPENED_BY = { 1: 'matsukawa', 2: 'kashinuma', 3: 'jagan', 4: 'ryuto', 5: 'zarukaburi', 6: 'daihisan', 7: 'tenaga' };
// 元に戻すと 道が現れるマス（本人 10/3「序章の龍燈の龍を倒したら、相馬への道を繋げて欲しい。現在は草原なので、わかりずらい」）＝それまでは草原・通れるのは同じ
export const ROAD_OPENED_BY = { r: 'ryuto' };

// 歩く地図は2枚（10/3 1章〜）：field＝いわき（序章）・soma＝相馬（1章）。字 E の口で行き来する
export const FIELDS = { field: IWAKI_ROWS, soma: SOMA_ROWS };
export const isField = (map) => Object.hasOwn(FIELDS, map);
// 口：いわきの北の端の E ⇔ 相馬の南の端の E。出た先は口の1歩内側（いわきへは南・相馬へは北）
const EXITS = { field: { to: 'soma', dy: -1, dir: 'up' }, soma: { to: 'field', dy: 1, dir: 'down' } };

// 仲間の強さ＝レベルで決まる（src/battle/levels.js）。PARTY_BASE はレベル1の強さ
export const PARTY_BASE = Object.fromEntries(ALL_IDS.map((id) => [id, statsAt(id, 1)]));
// 仲間ごとのレベル（本人 10/3「合流メンバーが初めの2人といきなり同じLvはおかしい」）
// 始めの2人＝game.lv（経験 game.exp を2人で持つ）。昔話の味方＝自分の経験 game.expOf[id]（加わると JOIN_LV_BELOW 下のレベルの経験から）
// 経験は同じだけ入るので、レベルの段差（10・20・30…）が広がるぶん、加わった味方は少しずつ追いつく
export const JOIN_LV_BELOW = 2;
export function lvOf(game, id) {
  if (PARTY_IDS.includes(id) || game?.expOf?.[id] == null) return game?.lv ?? 1; // 前の記録には expOf が無い＝今のレベルのまま
  return levelFor(game.expOf[id]);
}
export const maxOf = (game, id) => statsAt(id, lvOf(game, id));

function findChar(rows, ch) {
  for (let y = 0; y < rows.length; y++) {
    const x = rows[y].indexOf(ch);
    if (x >= 0) return { x, y };
  }
  return null;
}

export const START = { map: 'field', ...findChar(IWAKI_ROWS, 'N'), dir: 'up' };

// 全快（呪い・取り憑きは残る＝町で治す）。力つきて幽霊の仲間は、宿では生き返らない（keepDead＝寺社でだけ）
const fullParty = (game, keepDead = false) => Object.fromEntries(membersOf(game).map((id) => {
  const m = maxOf(game ?? {}, id);
  const p = game?.party?.[id] ?? {};
  if (keepDead && p.dead) return [id, { ...p, hp: 0 }];
  return [id, { ...p, hp: m.hp, mp: m.mp, dead: false }];
}));

export function newGame() {
  return {
    pos: { ...START },
    fieldPos: { x: START.x, y: START.y }, // 町に入る前に立っていた所（町を出るとここへ）
    mon: 30,
    members: [...PARTY_IDS], // 昔話の味方が加わると増える（join）
    items: { yakusou: 2, jouyakusou: 1, reisui: 1 },
    party: fullParty(),
    lv: 1,
    exp: 0,
    equip: structuredClone(START_EQUIP),
    steps: 0, // 道中の敵に出会ってからの歩数
    stolen: [], // 盗まれた名物（小名浜の番屋に届く）
    cleared: {},
    savePos: { ...START },
    intro: true,
  };
}

// ---- 地図 ----
export function mapRows(map) {
  return FIELDS[map] ?? TOWNS[map].rows;
}

// 口（E）を踏んだら、つながる地図の口の1歩内側へ。口でなければ null
export function crossAt(game, map, x, y) {
  const ex = EXITS[map];
  if (!ex || mapRows(map)[y]?.[x] !== 'E') return null;
  const rows = FIELDS[ex.to];
  const ty = rows.findIndex((r) => r.includes('E'));
  const tx = rows[ty].indexOf('E');
  return { ...game, pos: { map: ex.to, x: tx, y: ty + ex.dy, dir: ex.dir } };
}

export function terrainAt(map, x, y) {
  const rows = mapRows(map);
  if (y < 0 || y >= rows.length || x < 0 || x >= rows[0].length) return null;
  const ch = rows[y][x];
  const t = (isField(map) ? FIELD_TERRAIN : TOWN_TERRAIN)[ch];
  return { ch, tile: t[0], walk: t[1] };
}

export function wallOpen(game, ch) {
  return !!game.cleared[WALL_OPENED_BY[ch]];
}

// そのマスへ歩けるか（町の人の立つマスは画面の側で見る）
export function canWalk(game, map, x, y) {
  const t = terrainAt(map, x, y);
  if (!t) return false;
  if (isField(map) && WALL_OPENED_BY[t.ch]) return wallOpen(game, t.ch);
  return t.walk;
}

// もやの壁を晴れた絵（橋）に、元に戻したボスの場所を鳥居の絵に
export function tileNameAt(game, map, x, y) {
  const t = terrainAt(map, x, y);
  if (!isField(map)) return t.tile;
  if (WALL_OPENED_BY[t.ch] && wallOpen(game, t.ch)) return 'bridge';
  if (ROAD_OPENED_BY[t.ch]) return game.cleared?.[ROAD_OPENED_BY[t.ch]] ? 'road' : 'grass';
  if (BOSS_AT[t.ch] && game.cleared[BOSS_AT[t.ch]]) return t.ch === 'S' ? 'cleared_sand' : 'cleared';
  return t.tile;
}

export const DELTA = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// ---- 町に入る・出る ----
export function enterTown(game, town) {
  return { ...game, fieldMap: game.pos.map, fieldPos: { x: game.pos.x, y: game.pos.y }, pos: { map: town, ...TOWN_ENTRY, dir: 'up' }, justEntered: town };
}

export function leaveTown(game) {
  return { ...game, pos: { map: game.fieldMap ?? 'field', x: game.fieldPos.x, y: game.fieldPos.y, dir: 'down' } }; // 入った地図へ戻る（前の記録は いわき）
}

// ---- 店・宿・記録 ----
export function buy(game, itemId) {
  const price = PRICE[itemId];
  if (game.mon < price) return { ok: false, game };
  return { ok: true, game: { ...game, mon: game.mon - price, items: { ...game.items, [itemId]: (game.items[itemId] ?? 0) + 1 } } };
}

export function stayInn(game, price) {
  if (game.mon < price) return { ok: false, game };
  return { ok: true, game: { ...game, mon: game.mon - price, party: fullParty(game, true) } };
}

// ---- 力つきた仲間（幽霊）を生き返らせる（本人 10/2「一人死んだら、幽霊になり、神社かお寺で有償復活」）----
// 平の八幡さま・湯本のお寺で。お代は 1人 15＋レベル×5 文。生き返ると HP・術は満タン
export const revivePrice = (game) => 15 + 5 * (game.lv ?? 1);
export function revive(game) {
  const dead = membersOf(game).filter((id) => game.party[id]?.dead);
  if (!dead.length) return { ok: false, reason: 'none', game, who: [] };
  const price = revivePrice(game) * dead.length;
  if (game.mon < price) return { ok: false, reason: 'money', game, who: dead, price };
  const party = { ...game.party };
  for (const id of dead) {
    const m = maxOf(game, id);
    party[id] = { ...party[id], dead: false, hp: m.hp, mp: m.mp };
  }
  return { ok: true, game: { ...game, mon: game.mon - price, party }, who: dead, price };
}

export function save(game) {
  const g = { ...game, savePos: { ...game.pos }, saveFieldPos: { ...game.fieldPos }, saveFieldMap: game.fieldMap ?? 'field', intro: false };
  return { game: g, text: JSON.stringify(g) };
}

// ボスを元に戻して地図へ戻ったときの自動セーブ（本人 10/3「各ボスを倒した時点で、自動セーブをして欲しい」）
// 勝った知らせ（justCleared／justJoined）は外してから残す＝読み戻しても2度は出ない
export function autoSaveAfterBoss(game) {
  return save({ ...game, justCleared: null, justJoined: null });
}

export function load(text) {
  try {
    const g = JSON.parse(text);
    if (!g?.pos || !g?.party || !g?.items) return null;
    // 名物のころの記録＝持ち物と盗まれた物を いまの道具に読み替える（知らない物は捨てる）
    const items = {};
    for (const [id, n] of Object.entries(g.items)) {
      const to = ITEMS[id] ? id : OLD_ITEM[id];
      if (to) items[to] = (items[to] ?? 0) + n;
    }
    const stolen = (g.stolen ?? []).map((id) => (ITEMS[id] ? id : OLD_ITEM[id])).filter(Boolean);
    return { ...g, items, stolen };
  } catch {
    return null;
  }
}

// ---- 戦いとのやりとり ----
// 歩く地図から戦うときの話のデータ：仲間は今の HP・術で、道具は持ち物から
export function battleData(game, ep) {
  const items = Object.fromEntries(Object.entries(game.items)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => [id, { ...ITEMS[id], count: n }]));
  // 加わった昔話の味方を、話のデータの2人の後ろに足す
  const joined = membersOf(game).filter((id) => COMPANIONS[id] && !ep.allies.some((a) => a.id === id))
    .map((id) => ({ id, name: COMPANIONS[id].name, spells: COMPANIONS[id].spells, gun: !!COMPANIONS[id].gun }));
  const allies = [...ep.allies, ...joined].map((a) => {
    const m = statsWithGear(a.id, lvOf(game, a.id), game.equip ?? START_EQUIP);
    const p = game.party[a.id] ?? {};
    // 力つきて幽霊の仲間は戦いに出ない（alive:false・HP 0）
    if (p.dead) return { ...a, ...m, maxHp: m.hp, maxMp: m.mp, hp: 0, mp: p.mp ?? 0, alive: false };
    return {
      ...a, ...m, maxHp: m.hp, maxMp: m.mp,
      hp: Math.max(1, p.hp ?? m.hp), mp: p.mp ?? m.mp, curse: !!p.curse, ghost: !!p.ghost,
    };
  });
  return { ...ep, allies, items, spells: { ...ep.spells, ...COMPANION_SPELLS } };
}

// 戦いのあとに持ち帰る物：HP・術・呪い・取り憑き・残りの名物・盗まれた物・取られた文
// 力つきた仲間は幽霊のまま（dead・HP 0）＝寺社で生き返らせる（本人 10/2）
function settle(game, state) {
  const party = Object.fromEntries(state.allies.map((a) => [a.id, a.alive === false || a.hp <= 0
    ? { hp: 0, mp: a.mp, dead: true, curse: false, ghost: false }
    : { hp: a.hp, mp: a.mp, curse: !!a.curse, ghost: !!a.ghost }]));
  return {
    ...game, party, items: { ...state.items },
    stolen: [...(game.stolen ?? []), ...(state.stolen ?? [])],
    mon: Math.max(0, game.mon - (state.monLost ?? 0)),
    steps: 0,
  };
}

// 勝った：ボスを元に戻した印・残った道具・HP（力つきた仲間は幽霊のまま）
// ボスを元に戻したお礼の文（本人 10/2「ボスを倒した際は、お金を多めに出して。ここでは50文」＝松川様50・あとは順に増やす＝Claudeの決め）
export const BOSS_MON = { matsukawa: 50, kashinuma: 70, jagan: 90, ryuto: 120, daihisan: 170, tenaga: 190, sumitora: 240 }; // 1章は順に多め（Claudeの決め）・ザルカブリは戦わない（10/3 本人「C」）のでお礼の文は無し

// 元に戻したボスによっては、昔話の味方が仲間に加わる（JOIN_AFTER＝賢沼のあと猟師・蛇岸淵のあと閼伽井嶽の僧）
export function afterWin(game, enemyId, state) {
  const s = settle(game, state);
  let g = { ...s, mon: s.mon + (BOSS_MON[enemyId] ?? 0), cleared: { ...game.cleared, [enemyId]: true }, justCleared: enemyId };
  const r = JOIN_AFTER[enemyId] ? join(g, JOIN_AFTER[enemyId]) : { ok: false };
  if (r.ok) g = { ...r.game, justJoined: [JOIN_AFTER[enemyId]] };
  return g;
}

// 道中の敵：勝ったら 経験・文・落とし物・レベル上げ。逃げた・盗まれたときは持ち帰りだけ
export function afterZako(game, zakoId, state) {
  let g = settle(game, state);
  const lines = [];
  if (state.over !== 'win') return { game: g, lines };
  const z = ZAKO[zakoId];
  const k = state.enemy?.rewardRate ?? 1; // 帯の倍率（1章の相馬は多め）
  const exp = Math.round(z.exp * k);
  const mon = Math.round(z.mon * MON_RATE * k);
  const before = Object.fromEntries(membersOf(g).map((id) => [id, lvOf(g, id)]));
  // 経験：始めの2人は game.exp、加わった味方は自分の経験（幽霊には入らない）
  const expOf = Object.fromEntries(Object.entries(g.expOf ?? {}).map(([id, x]) => [id, g.party[id]?.dead ? x : x + exp]));
  g = { ...g, exp: (g.exp ?? 0) + exp, expOf, mon: g.mon + mon };
  lines.push(`経験 ${exp}と、文を ${mon} 手に入れた！`);
  if (z.drop) {
    g = { ...g, items: { ...g.items, [z.drop]: (g.items[z.drop] ?? 0) + 1 } };
    lines.push(`お礼に ${ITEMS[z.drop].name}を もらった！`);
  }
  g = { ...g, lv: levelFor(g.exp) };
  // 上がった分だけ HP と術の力も増える（ドラクエと同じ）。幽霊は伸びない（生き返ると今のレベルの満タン）
  const party = Object.fromEntries(membersOf(g).map((id) => {
    const p = g.party[id];
    const lv = lvOf(g, id);
    if (p.dead || lv === before[id]) return [id, p];
    const b = statsAt(id, before[id]);
    const a = statsAt(id, lv);
    return [id, { ...p, hp: p.hp + a.hp - b.hp, mp: p.mp + a.mp - b.mp }];
  }));
  g = { ...g, party };
  if (g.lv > before.tabi) lines.push(`旅の者たちは レベル ${g.lv}に 上がった！`);
  for (const id of membersOf(g)) if (!PARTY_IDS.includes(id) && lvOf(g, id) > before[id]) lines.push(`${NAME[id]}は レベル ${lvOf(g, id)}に 上がった！`);
  return { game: g, lines };
}

// ---- 道中の敵に出会う ----
// 地図を4つの帯に分ける（南＝勿来・鮫川／中南＝小名浜・湯本／中北＝平・賢沼／北＝好間・閼伽井嶽）
export function zoneOf(y) {
  if (y >= 41) return 'south';
  if (y >= 25) return 'midSouth';
  if (y >= 11) return 'midNorth';
  return 'north';
}
const ENCOUNTER_ON = { '.': 1 / 20, ',': 1 / 18, '=': 1 / 22, r: 1 / 22, T: 1 / 6 }; // 林は倍（本人 10/2「林は敵に遭遇する確率を倍に」1/12→1/6）
export const MIN_STEPS = 4; // 戦いのすぐあとは出ない
// 道中の敵から もらう文の倍率（本人 10/2「お金を増やすペースを倍に」）
export const MON_RATE = 2;

export function encounterAt(game, map, x, y, rng) {
  if (!isField(map)) return null;
  const ch = mapRows(map)[y][x];
  const rate = ENCOUNTER_ON[ch];
  if (!rate || (game.steps ?? 0) < MIN_STEPS || rng() >= rate) return null;
  // 相馬（1章）は いわきの北の顔ぶれを強めて出す（ZONE_SCALE）
  const zone = map === 'soma' ? 'soma' : zoneOf(y);
  const pool = zone === 'soma' ? 'north' : zone;
  const list = Object.keys(ZAKO).filter((id) => !ZAKO[id].pending && !ZAKO[id].retired).filter((id) => ZAKO[id].zones.includes(pool)
    || (ch === '=' && ZAKO[id].zones.includes('road'))
    || (ch === ',' && ZAKO[id].zones.includes('coast')));
  return list.length ? { id: list[Math.floor(rng() * list.length)], zone } : null;
}

// 1歩：歩数を数え、取り憑かれた仲間は HP が1減る（1で止まる）
export function walkStep(game) {
  const party = Object.fromEntries(Object.entries(game.party).map(([id, p]) => [id, p.ghost && !p.dead ? { ...p, hp: Math.max(1, p.hp - 1) } : p]));
  return { ...game, party, steps: (game.steps ?? 0) + 1 };
}

// 道中の戦いの話のデータ（ボスの話と同じ形にして、戦いの画面を使い回す）
// 帯ごとの専用の背景（Gemini・2026-10-02。それまではボスの背景を借りていた）
export const ZONE_BG = { ...Object.fromEntries(['south', 'midSouth', 'midNorth', 'north'].map((z) => [z, `assets/bg_dochu_${z}.png`])), soma: 'assets/bg_dochu_north.png' };
// 帯ごとの強さの倍率（1章の相馬・HP／攻／守を別々に・もらう経験と文も多め）
export const ZONE_SCALE = { soma: { hp: 6, atk: 3.4, def: 3, reward: 2.5 } }; // 10/3 試算：1.5倍ではLv6の4人が1ターンで倒した＝この倍率で1戦2〜3ターン・HP約1割減（いわきの道中と同じ手ごたえ）
export const HARAI = {
  name: '祓いの言葉', cost: 4, power: 14, weakMult: 1, plainMult: 1,
  weakText: '祓いの 言葉が もやを 打った！', plainText: '祓いの 言葉が もやを 打った！',
};
export function zakoData(game, zakoId, zone) {
  const z = ZAKO[zakoId];
  const img = `assets/zako_${zakoId}.png`;
  const ep = {
    art: { dark: img, light: img, bg: ZONE_BG[zone], glowDark: 0x9fb4ff, glowLight: 0xffd27a },
    allies: PARTY_IDS.map((id) => ({ id, name: id === 'tabi' ? '旅の者' : 'しおり', ...statsAt(id, 1), ...(id === 'tabi' ? { spells: ['harai'] } : { canTell: true }) })),
    items: {},
    spells: { harai: HARAI },
    enemy: {
      id: `zako-${zakoId}-${zone}`, zakoId, name: z.name, ...(() => { const k = ZONE_SCALE[zone] ?? {}; return { hp: Math.round(z.hp * (k.hp ?? 1)), atk: Math.round(z.atk * (k.atk ?? 1)), def: Math.round(z.def * (k.def ?? 1)) }; })(), agi: z.agi,
      rewardRate: ZONE_SCALE[zone]?.reward ?? 1,
      bgm: zone === 'soma' ? 'somaBattle' : undefined, // 1章の道中の曲（10/3「章ごとにBGMは新しく」） // ⚠ reward はボスの「倒したときの文」と同じ名前＝別の名前にする
      weakness: null, noWeak: true, canFlee: true, trick: z.trick ?? null, special: null,
      biteName: z.biteName, introText: z.introText, tellLines: [ZAKO_TELL], restoreLines: z.restoreLines,
      loseLines: ['旅の者たちは 力つきた……'],
      itemNames: Object.fromEntries(Object.entries(ITEMS).map(([id, it]) => [id, it.name])),
    },
  };
  return battleData(game, ep);
}

// ---- 町で治す ----
export const HARAI_PRICE = 15; // 平の八幡さまの お祓い
export const KUYO_PRICE = 10; // 湯本の お寺の 供養

function cure(game, flag, price) {
  if (!membersOf(game).some((id) => game.party[id]?.[flag])) return { ok: false, reason: 'none', game };
  if (game.mon < price) return { ok: false, reason: 'money', game };
  const party = Object.fromEntries(membersOf(game).map((id) => [id, { ...game.party[id], [flag]: false }]));
  return { ok: true, game: { ...game, mon: game.mon - price, party } };
}
export const purify = (game) => cure(game, 'curse', HARAI_PRICE);
export const kuyo = (game) => cure(game, 'ghost', KUYO_PRICE);

// 小名浜の番屋：盗まれた名物が全部 戻ってくる
export function returnStolen(game) {
  if (!game.stolen?.length) return { ok: false, game, got: [] };
  const items = { ...game.items };
  for (const id of game.stolen) items[id] = (items[id] ?? 0) + 1;
  return { ok: true, game: { ...game, items, stolen: [] }, got: [...game.stolen] };
}

// 負けた：最後にお参りした所へ戻り、文が半分。HP は戻る（持ち物と、元に戻したボスはそのまま）
export function afterLose(game) {
  const back = game.savePos ?? START;
  const inField = isField(back.map);
  return { ...game, mon: Math.floor(game.mon / 2), party: fullParty(game), steps: 0, pos: { ...back }, fieldPos: inField ? { x: back.x, y: back.y } : { ...(game.saveFieldPos ?? game.fieldPos) }, fieldMap: inField ? back.map : game.saveFieldMap ?? 'field' };
}

// 歩いている間に道具を使う：HP の物は一番弱っている仲間に、術の物は術を使う仲間に
export const NAME = { tabi: '旅の者', shiori: 'しおり', ...Object.fromEntries(Object.entries(COMPANIONS).map(([id, c]) => [id, c.name])) };
export function useItem(game, id) {
  const it = ITEMS[id];
  if (it.kind === 'ammo') return { ok: false, game, text: `${it.name}は 戦いで 猟師が 鉄砲に こめて 使う。` };
  if (it.kind === 'bind') return { ok: false, game, text: `${it.name}は 戦いで 敵に 投げて 使う。` };
  if (it.kind === 'hpall') {
    if (!(game.items[id] > 0)) return { ok: false, game, text: `${it.name}は もう ない。` };
    const party = Object.fromEntries(Object.entries(game.party).map(([w, p]) => [w, p.dead ? p : { ...p, hp: Math.min(maxOf(game, w).hp, p.hp + it.amount) }]));
    return { ok: true, game: { ...game, items: { ...game.items, [id]: game.items[id] - 1 }, party }, text: `${it.name}を みんなで 飲んだ！ HPが もどった！` };
  }
  if (!(game.items[id] > 0)) return { ok: false, game, text: `${it.name}は もう ない。` };
  const key = it.kind === 'mp' ? 'mp' : 'hp';
  const mx = (a) => maxOf(game, a)[key];
  const who = membersOf(game)
    .filter((a) => !game.party[a].dead && mx(a) > 0 && game.party[a][key] < mx(a)) // 幽霊には使えない
    .sort((a, b) => game.party[a][key] / mx(a) - game.party[b][key] / mx(b))[0];
  if (!who) return { ok: false, game, text: key === 'mp' ? '術の力は 満ちている。いまは 使わなくて よさそう。' : 'みんな 元気だ。いまは 使わなくて よさそう。' };
  const before = game.party[who][key];
  const after = Math.min(mx(who), before + it.amount);
  return {
    ok: true,
    game: { ...game, items: { ...game.items, [id]: game.items[id] - 1 }, party: { ...game.party, [who]: { ...game.party[who], [key]: after } } },
    text: `${NAME[who]}に ${it.name}を 使った！ ${key === 'mp' ? '術の力' : 'HP'}が ${after - before} もどった！`,
  };
}

// ---- 装備を買う ----
// 買うと その場で着ける。前の品は半値で引き取り。着けられない人・文が足りないときは買えない
export function buyEquip(game, id, who) {
  const e = EQUIP[id];
  if (!e.who.includes(who)) return { ok: false, reason: 'who', game };
  if (game.mon < e.price) return { ok: false, reason: 'money', game };
  const equip = structuredClone(game.equip ?? START_EQUIP);
  equip[who] ??= { weapon: null, armor: null, charm: null }; // 仲間が加わる前の記録には その人の欄が無い
  const old = equip[who][e.slot];
  const refund = old ? Math.floor(EQUIP[old].price / 2) : 0;
  equip[who][e.slot] = id;
  return { ok: true, old, refund, game: { ...game, equip, mon: game.mon - e.price + refund } };
}

// 強さを見る（どうぐ → そうび）
export function partyView(game) {
  return membersOf(game).map((id) => ({
    id, ...statsWithGear(id, lvOf(game, id), game.equip ?? START_EQUIP),
    gear: game.equip?.[id] ?? START_EQUIP[id] ?? {}, // 昔話の味方は装備なし（いまは）
  }));
}

// ---- 昔話の味方が仲間に加わる（本人 10/2）。最大4人・加わるとそのレベルの満タン ----
export function join(game, id) {
  const members = membersOf(game);
  if (!COMPANIONS[id] || members.includes(id) || members.length >= MAX_PARTY) return { ok: false, game };
  // 始めの2人より JOIN_LV_BELOW 下のレベルで加わる（Lv1 より下にはならない）
  const lv = Math.max(1, (game.lv ?? 1) - JOIN_LV_BELOW);
  const g = { ...game, members: [...members, id], expOf: { ...game.expOf, [id]: EXP_TO[lv] } };
  const m = maxOf(g, id);
  return { ok: true, game: { ...g, party: { ...game.party, [id]: { hp: m.hp, mp: m.mp } } } };
}
