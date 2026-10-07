// 旅の状態（居場所・文・持ち物・仲間の HP・元に戻したボス・記録）。画面と切り離す＝Node で試験する
// ここの関数は game を書き換えずに、新しい game を返す
import { IWAKI_ROWS } from './iwaki_map.js?v=270';
import { kanbanAt } from './kanban.js?v=270';
import { SOMA_ROWS } from './soma_map.js?v=270';
import { KENPOKU_ROWS } from './kenpoku_map.js?v=270';
import { KENCHU_ROWS } from './kenchu_map.js?v=270';
import { AIZU_ROWS } from './aizu_map.js?v=270';
import { FIELD_TERRAIN, TOWN_TERRAIN } from './tiles.js?v=270';
import { TOWNS, townEntry, roofCells } from './towns.js?v=270';
import { withGates } from './castle.js?v=270';
import { ITEMS, PRICE, OLD_ITEM } from '../data/items.js?v=270';
import { ZAKO, ZAKO_TELL } from '../data/zako.js?v=270';
import { statsAt, levelFor, EXP_TO, PARTY_IDS, ALL_IDS, MAX_PARTY, membersOf, statsWithGear, memberStats } from '../battle/levels.js?v=270';
import { COMPANIONS, COMPANION_SPELLS, JOIN_AFTER, LEARN_AFTER_LOSS, KUNOICHI } from '../data/companions.js?v=270';
import { EQUIP, canWear, startEquip, migrateEquip } from '../data/equip.js?v=270';
import { becomeKunoichi } from './kagewatari.js?v=270';
import { JOBS, JOB_IDS, JOB_SPELLS, QUESTS, jobOf, jobSpellsOf, chapterSkillsDone } from '../data/jobs.js?v=270';
import { QUEST_ART } from '../data/quest_assets.js?v=270'; // 師匠の 試しの 絵（10/8）

// v2＝職業の旅（10/5 本人「前の記録は使えない＝はじめから」）。v1 の記録は読まない
export const SAVE_KEY = 'fq-save-v2';
// 記憶①〜③（10/7 本人「冒頭に『記憶①』～『記憶③』を。いろいろな組み合わせで楽しむため」）。①は前からの置き場＝今までの記録はそのまま①
export const SLOT_COUNT = 3;
export const slotKey = (n) => (n > 1 ? `${SAVE_KEY}-${n}` : SAVE_KEY);
// 題の画面の札に出す ひと言（名前・職業・Lv・元に戻した主の数）。記録が無ければ null
export function slotSummary(g) {
  if (!g) return null;
  const name = g.heroName || '旅の者';
  const job = JOBS[g.jobs?.tabi]?.name ?? '';
  const n = Object.keys(g.cleared ?? {}).length;
  return `${name}（${job}）Lv${g.lv ?? 1}・主 ${n}体`;
}

// 地図の字 → ボス（episodes.js の enemy.id）と、もやの壁 → 晴れる条件
export const BOSS_AT = { S: 'matsukawa', K: 'kashinuma', J: 'jagan', R: 'ryuto', Z: 'zarukaburi', D: 'daihisan', L: 'tenaga', G: 'sumitora', A: 'amekai', F: 'gobou', C: 'mukade', V: 'heppiri', B: 'onibaba', h: 'jakotsu', m: 'miharugoma', d: 'otakimaru', n: 'nekonaki', t: 'tengu', q: 'takuzen', p: 'kappa', z: 'kiyohime', 亀: 'kamehime', 猫: 'nekoma', 足: 'ashinaga', 朱: 'shunobon', 牛: 'akabeko', 河: 'nawakappa', 狐: 'okon', 沼: 'numagozen' }; // 亀〜沼＝4章 会津（10/6・漢字1字） // A〜B＝2章 県北（10/4）・h〜z＝3章 県中・県南（10/4）
export const WALL_OPENED_BY = { 1: 'matsukawa', 2: 'kashinuma', 3: 'jagan', 4: 'ryuto', 5: 'zarukaburi', 6: 'daihisan', 7: 'tenaga', 8: 'sumitora', 9: 'amekai', 0: 'gobou', '%': 'mukade', '&': 'heppiri', '(': 'onibaba', ')': 'jakotsu', '[': 'otakimaru', ']': 'tengu', '{': 'kappa', '}': 'miharugoma', '<': 'nekonaki', '>': 'takuzen', 峠: 'kiyohime', 一: 'kamehime', 二: 'nekoma', 三: 'ashinaga', 四: 'shunobon', 五: 'akabeko', 六: 'nawakappa', 七: 'okon' }; // 峠＝4章 会津への もや（10/6） // 8〜＝2章 県北（10/4）・(〜＝3章 県中・県南（}<>＝10/4 本人「戦わない3話を戦う形で」「もやで」）
// 元に戻すと 道が現れるマス（本人 10/3「序章の龍燈の龍を倒したら、相馬への道を繋げて欲しい。現在は草原なので、わかりずらい」）＝それまでは草原・通れるのは同じ
export const ROAD_OPENED_BY = { r: 'ryuto' };

// 歩く地図（10/3 1章〜）：field＝いわき（序章）・soma＝相馬（1章）・kenpoku＝県北（2章・10/4）。口の字で行き来する
export const FIELDS = { field: withGates('field', IWAKI_ROWS), soma: withGates('soma', SOMA_ROWS), kenpoku: withGates('kenpoku', KENPOKU_ROWS), kenchu: withGates('kenchu', KENCHU_ROWS), aizu: withGates('aizu', AIZU_ROWS) }; // 10/7 お城クエストの 入口の字を 重ねる（castle.js） // kenchu＝県中・県南（3章・10/4）・aizu＝会津（4章・10/6）
export const isField = (map) => Object.hasOwn(FIELDS, map);
// 口：地図ごと・字ごとに、行き先と「出た先は口の1歩内側」の向き
//   E＝いわきの北の端 ⇔ 相馬の南の端／X＝相馬の西の端（虎捕山の先）⇔ 県北の東の端（霊山）
const EXITS = {
  field: { E: { to: 'soma', dx: 0, dy: -1, dir: 'up' } },
  soma: { E: { to: 'field', dx: 0, dy: 1, dir: 'down' }, X: { to: 'kenpoku', dx: -1, dy: 0, dir: 'left' } },
  kenpoku: { X: { to: 'soma', dx: 1, dy: 0, dir: 'right' }, I: { to: 'kenchu', dx: 0, dy: 1, dir: 'down' } },
  kenchu: { I: { to: 'kenpoku', dx: 0, dy: -1, dir: 'up' }, 関: { to: 'aizu', dx: -1, dy: 0, dir: 'left' } }, // I＝二本松の南（鬼婆を戻すと開く）⇔ 県中・県南の北の端・関＝白河の西の甲子峠 ⇔ 会津の東の端（10/6）
  aizu: { 関: { to: 'kenchu', dx: 1, dy: 0, dir: 'right' } },
};

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
// 強さの表の名前＝職業（'job_<職業>'・10/5）。職業の無い前の形（試験の古い仲間）は id のまま
export const statKey = (game, id) => {
  const j = jobOf(game, id);
  if (j) return `job_${j}`;
  return id === 'shiori' && game?.flags?.[KUNOICHI.flag] ? KUNOICHI.form : id;
};
export const maxOf = (game, id) => memberStats(id, statKey(game, id), lvOf(game, id));

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

// ---- 職業を選ぶ（本人 10/5「①初めから4人 ②職業を選択してからスタート」）----
// pick＝{ tabi: 主人公の職業, shiori: しおりの職業, mates: [仲間2人の職業] }。4人とも別の職業。仲間の id は職業の id
export const DEFAULT_PICK = { tabi: 'bushi', shiori: 'miko', mates: ['sou', 'yumi'] }; // 試験と、選ばずに始めたとき
export function validPick(pick) {
  const all = [pick?.tabi, pick?.shiori, ...(pick?.mates ?? [])];
  return all.length === 4 && all.every((j) => JOB_IDS.includes(j)) && new Set(all).size === 4;
}
// あなたの名前（本人 10/5「『あなた』はすきな名前が付けられる。ひらがな4文字まで」）。無い・正しくない時は「旅の者」
export const HERO_NAME_MAX = 4;
export const validHeroName = (name) => typeof name === 'string' && /^[ぁ-ゖー]+$/.test(name) && [...name].length <= HERO_NAME_MAX;
export function newGame(pick = DEFAULT_PICK) {
  if (!validPick(pick)) throw new Error('職業の選び方が正しくない');
  const members = ['tabi', 'shiori', ...pick.mates];
  const base = { jobs: { tabi: pick.tabi, shiori: pick.shiori }, members, skills: Object.fromEntries(members.map((id) => [id, []])), lv: 1, ...(validHeroName(pick.name) ? { heroName: pick.name } : {}), heroSex: pick.sex === 'f' ? 'f' : 'm' }; // heroSex＝あなたの 男・女（10/7・src/field/hero.js）
  return {
    ...base,
    somaW: 36, // 相馬の地図の幅（10/4 に40→36列へ詰めた）。無い記録は前の幅＝読み込むときに位置を直す
    pos: { ...START },
    fieldPos: { x: START.x, y: START.y }, // 町に入る前に立っていた所（町を出るとここへ）
    mon: 30,
    items: { yakusou: 2, jouyakusou: 1, reisui: 1 },
    party: fullParty(base),
    exp: 0,
    equip: startEquip(base),
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
  const ch = mapRows(map)[y]?.[x];
  const ex = EXITS[map]?.[ch];
  if (!ex) return null;
  const rows = FIELDS[ex.to];
  const ty = rows.findIndex((r) => r.includes(ch));
  const tx = rows[ty].indexOf(ch);
  return { ...game, pos: { map: ex.to, x: tx + ex.dx, y: ty + ex.dy, dir: ex.dir } };
}

export function terrainAt(map, x, y) {
  const rows = mapRows(map);
  if (y < 0 || y >= rows.length || x < 0 || x >= rows[0].length) return null;
  const ch = rows[y][x];
  const t = (isField(map) ? FIELD_TERRAIN : TOWN_TERRAIN)[ch];
  return { ch, tile: t[0], walk: t[1] };
}

export function wallOpen(game, ch) {
  return !!game.cleared[WALL_OPENED_BY[ch]] && (!WALL_NEEDS_SKILLS[ch] || chapterSkillsDone(game, WALL_NEEDS_SKILLS[ch]));
}
// 章の出口（本人 10/5「4人とも その章の技を習うまで通さない」）＝壁の字 → 章。8＝1章の出口（相馬→県北）。2章・3章の出口は段階②③で足す
export const WALL_NEEDS_SKILLS = { 8: 1, '(': 2, 峠: 3, 七: 4 }; // 七＝金山への山（沼御前の手前・10/6 本人「沼御前の手前で必要」＝4人とも 会津の温泉で 4つ目の技） // 峠＝3章の出口（白河の西→会津・10/6） // '('＝2章の出口（県北→県中・鬼婆で晴れる・10/5 夜 段階②）
// 技の要る壁の 向こう側（もう越えた側）＝そこに立つ人は 戻れる（10/6 本人「会津で閉じ込められた」＝v190・v191 で 七を 越えたあと、v192 から 4つ目の技が要る 決まりが入り、金山から 北の 温泉地へ 戻れなかった）
const WALL_FAR = { 七: (pos, x, y) => pos.y > y }; // 七＝金山への山（横一列）。南が 向こう側
export function onFarSide(game, map, ch, x, y, from = null) {
  const far = WALL_FAR[ch];
  if (!far) return false;
  if (from) return far(from, x, y);
  return game.pos?.map === map && far(game.pos, x, y);
}
export const WALL_NEEDS_FLAG = {}; // 前の形（武士・くノ一の印）の名残
// ボスは戻したが、その章の技を まだ習っていない人がいるときに ぶつかると出る言葉（関所の番人）
export const WALL_QUEST_LINES = {
  8: ['西の 口の 番人「待たれよ。相馬と 小高の 師匠に 技を 認められた 者しか、県北へは 通せぬ。」', 'しおり「4人とも、師匠の 試しを 受けましょう。」'],
  '(': ['南の 口の 番人「待たれよ。福島と 二本松の 師匠に 技を 認められた 者しか、県中へは 通せぬ。」', 'しおり「4人とも、師匠の 試しを 受けましょう。」'],
  峠: ['甲子峠の 番人「待たれよ。県中・県南の 温泉の 師匠に 技を 認められた 者しか、会津へは 通せぬ。」', 'しおり「4人とも、温泉の 師匠の 試しを 受けましょう。」'],
  七: ['金山への 山の 番人「待たれよ。会津の 温泉の 師匠に 技を 認められた 者しか、沼沢湖へは 通せぬ。」', 'しおり「4人とも、会津の 温泉の 師匠の 試しを 受けましょう。」'],
};
// その章の技を まだ習っていない人（番人の言葉に 名前を出す）
export function missingSkills(game, ch) {
  return membersOf(game).filter((id) => {
    const j = JOBS[jobOf(game, id)];
    return j && !(game.skills?.[id] ?? []).includes(j.skills[ch - 1]);
  });
}
export function wallQuestLines(game, ch) {
  const base = WALL_QUEST_LINES[ch];
  const need = WALL_NEEDS_SKILLS[ch];
  if (!base || !need) return base ?? null;
  const left = missingSkills(game, need).map((id) => {
    const q = QUESTS[need]?.[jobOf(game, id)];
    return `${nameOf(game, id)}（${q ? `${TOWN_LABEL[q.town] ?? q.town}の ${q.master}` : '師匠'}）`;
  });
  return [base[0], `しおり「まだ 習っていないのは、${left.join('・')}よ。」`];
}
const TOWN_LABEL = { odaka: '小高', nakamura: '相馬', fukushima: '福島', nihonmatsu: '二本松', koriyama: '郡山', sukagawa: '須賀川', shirakawa: '白河', iizaka: '飯坂温泉', takayu: '高湯温泉', tsuchiyu: '土湯温泉', dake: '岳温泉', bandaiatami: '磐梯熱海温泉', bohata: '母畑温泉', nekonakiyu: '猫啼温泉', futamata: '二岐温泉', kashi: '甲子温泉', nakanosawa: '中ノ沢温泉', higashiyama: '東山温泉', ashinomaki: '芦ノ牧温泉', nishiyama: '西山温泉', hayato: '早戸温泉' };

// そのマスへ歩けるか（町の人の立つマスは画面の側で見る）
// ⭐屋根のマス（10/5 夜 本人「町や城で、屋根の上に乗るのは辞めて」）＝町の建物の絵（props）の はみ出し
// 歩く地図の城（look.js が shiro を置く字）の真上は止めない（本人「上から二本松城に入れない」）＝FieldScene が 真上に立つ間だけ 城の絵を人の手前に重ねる
export const CASTLE_CHARS = ['H', 'M', 'W', 'v', '若']; // 若＝会津若松（鶴ヶ城の城下・10/6）
export const ROOFS = Object.fromEntries(Object.entries(TOWNS).map(([id, t]) => [id, roofCells(t.props)]));

// from＝いま立っている所（画面の居場所。無ければ game.pos）＝技の要る壁の 向こう側から 戻れるかに使う
export function canWalk(game, map, x, y, from = null) {
  const t = terrainAt(map, x, y);
  if (!t) return false;
  if (ROOFS[map]?.has(`${x},${y}`)) return false;
  if (isField(map) && WALL_OPENED_BY[t.ch]) return wallOpen(game, t.ch) || (!!game.cleared[WALL_OPENED_BY[t.ch]] && onFarSide(game, map, t.ch, x, y, from));
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
  return { ...game, fieldMap: game.pos.map, fieldPos: { x: game.pos.x, y: game.pos.y }, pos: { map: town, ...townEntry(town), dir: 'up' }, justEntered: town };
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

// 師匠の 試しを 受けられるか（10/8 本人「巫女のしおりが死んでいるのに巫女のクエストが受けられる、おかしい」）＝力つきた 者は 受けられない
export const canTakeQuest = (game, who) => !!who && !game.party?.[who]?.dead;

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
  const g = { ...game, savePos: { ...game.pos }, saveFieldPos: { ...game.fieldPos }, saveFieldMap: game.fieldMap ?? 'field', saveCastleFrom: game.castleFrom ?? null, intro: false }; // saveCastleFrom＝大広間で 記録した とき 出口の 行き先（10/7 夜）
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
    if (!g.jobs || !validPick({ tabi: g.jobs.tabi, shiori: g.jobs.shiori, mates: (g.members ?? []).slice(2) })) return null; // 職業の無い記録（v1）は読まない
    return fixTownPos(migrateEquip(fixSomaWidth({ ...g, items, stolen, skills: g.skills ?? {} }))); // 10/5 武器と防具は職業ごと＝前の品を同じ段の品へ
  } catch {
    return null;
  }
}


// ⭐10/5 夜 町の形を作り直した（本人「街並みがパターン化してつまらない」）＝前の記録の 町の中の位置が 建物・屋根・水に なったら、その町の入口へ
export function fixTownPos(g) {
  const fix = (p) => (p && TOWNS[p.map] && !canWalk(g, p.map, p.x, p.y) ? { map: p.map, ...townEntry(p.map), dir: 'up' } : p);
  return { ...g, pos: fix(g.pos), ...(g.savePos ? { savePos: fix(g.savePos) } : {}) };
}

// ⭐10/4 相馬の地図を40→36列へ詰めた（本人「右側に海を入れて」＝列21・22・29・30を消した）。前の記録の相馬の位置を、詰めた後の列へ読み替える
export function somaOldToNewX(x) {
  if (x <= 20) return x;
  if (x <= 22) return 21; // 消した列は隣の残った列へ
  if (x <= 28) return x - 2;
  if (x <= 30) return 26;
  return x - 4;
}
// 歩けない所に落ちたら、いちばん近い歩ける所へ
function nearestWalkable(game, map, x, y) {
  if (canWalk(game, map, x, y)) return { x, y };
  for (let r = 1; r < 8; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === r && canWalk(game, map, x + dx, y + dy)) return { x: x + dx, y: y + dy };
      }
    }
  }
  return { x, y };
}
export function fixSomaWidth(g) {
  if (g.somaW === 36) return g;
  const fix = (p) => ({ ...p, ...nearestWalkable(g, 'soma', somaOldToNewX(p.x), p.y) });
  const out = { ...g, somaW: 36 };
  if (g.pos?.map === 'soma') out.pos = fix(g.pos);
  if (g.fieldMap === 'soma' && g.fieldPos) out.fieldPos = fix(g.fieldPos);
  if (g.savePos?.map === 'soma') out.savePos = fix(g.savePos);
  if (g.saveFieldMap === 'soma' && g.saveFieldPos) out.saveFieldPos = fix(g.saveFieldPos);
  return out;
}

// ---- 戦いとのやりとり ----
// 歩く地図から戦うときの話のデータ：仲間は今の HP・術で、道具は持ち物から
export function battleData(game, ep0) {
  let ep = ep0;
  const items = Object.fromEntries(Object.entries(game.items)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => [id, { ...ITEMS[id], count: n }]));
  // 仲間2人（職業の人物）を、話のデータの2人（主人公・しおり）の後ろに足す。職業の無い前の形は 昔話の味方
  const joined = membersOf(game).filter((id) => !ep.allies.some((a) => a.id === id))
    .map((id) => (JOBS[id] ? { id, name: nameOf(game, id), spells: [] } : { id, name: COMPANIONS[id]?.name ?? id, spells: COMPANIONS[id]?.spells ?? [], gun: !!COMPANIONS[id]?.gun }));
  const allies = [...ep.allies, ...joined].map((a0) => {
    const a = formOf(game, a0.id === 'tabi' ? { ...a0, name: nameOf(game, 'tabi') } : a0);
    const m = statsWithGear(a.id, lvOf(game, a.id), game.equip ?? {}, statKey(game, a.id));
    const p = game.party[a.id] ?? {};
    // 力つきて幽霊の仲間は戦いに出ない（alive:false・HP 0）
    if (p.dead) return { ...a, ...m, maxHp: m.hp, maxMp: m.mp, hp: 0, mp: p.mp ?? 0, alive: false };
    return {
      ...a, ...m, maxHp: m.hp, maxMp: m.mp,
      hp: Math.max(1, p.hp ?? m.hp), mp: p.mp ?? m.mp, curse: !!p.curse, ghost: !!p.ghost,
    };
  });
  // 託善和尚の助言（3章・本人 10/4「弱点のヒント」）＝託善和尚を元に戻していると、弱点の術が mult 倍効き、戦いの始めに しおりが思い出す
  const hint = ep.enemy.hint;
  if (hint && game.cleared?.[hint.after]) {
    const w = ep.enemy.weakness;
    ep = { ...ep, spells: { ...ep.spells, [w]: { ...ep.spells[w], power: Math.round(ep.spells[w].power * hint.mult) } }, enemy: { ...ep.enemy, hintText: hint.text } };
  }
  // ⭐必ず負ける1回目（2章 鬼婆・本人 10/4「鬼婆は最強なので、一度全滅→町で祐慶と合流し、再トライ」）
  const fl = ep.enemy.firstLose;
  if (fl && !game.flags?.[fl.until ?? `${ep.enemy.id}Lost`]) { // until＝その印が付くまで必ず負ける（鬼婆＝僧が如意輪の経を学ぶまで・10/4 夜）
    const enemy = {
      ...ep.enemy, hp: fl.hp, atk: fl.atk, def: fl.def, forcedLose: true, tellBlock: fl.tellBlock,
      introText: fl.introText, loseLines: fl.loseLines, mist: { ...ep.enemy.mist, min: fl.mistMin ?? ep.enemy.mist?.min },
    };
    return { ...ep, enemy: { ...enemy, loseLines: heroLines(enemy.loseLines, game), restoreLines: heroLines(enemy.restoreLines, game) }, allies, items, spells: { ...ep.spells, ...COMPANION_SPELLS, ...JOB_SPELLS } };
  }
  // 勝った後の文にも あなたの名前（10/5 夕 バグ出し：三春駒「旅の者は 三春駒の 術を 授かった！」が名前を付けても残った）
  return { ...ep, enemy: { ...ep.enemy, loseLines: heroLines(ep.enemy.loseLines, game), restoreLines: heroLines(ep.enemy.restoreLines, game) }, allies, items, spells: { ...ep.spells, ...COMPANION_SPELLS, ...JOB_SPELLS } };
}

// 必ず負ける1回目のあと（2章 鬼婆）：文は減らさず、町（二本松）の宿で目をさます
// 学び（LEARN_AFTER_LOSS）があれば、その仲間が術を おぼえる（10/4 夜 本人「祐慶に替わるは無しで、赤井岳の僧のまま、祐慶にお経を教わる形で」）。justLearned＝町に入ったら 教わる台詞を見せる
export function afterForcedLose(game, enemyId) {
  const le = LEARN_AFTER_LOSS[enemyId];
  let g = { ...game, flags: { ...game.flags, [`${enemyId}Lost`]: true }, steps: 0 };
  if (le) g = { ...g, flags: { ...g.flags, [le.flag]: true }, justLearned: enemyId };
  g = { ...g, party: fullParty(g) };
  const town = le?.town;
  if (!town) return { ...g, ...afterLose({ ...g, mon: g.mon * 2 }), mon: g.mon };
  // 町の入口に立つ（町を出ると、ボスの手前の 地図の場所へ）
  return { ...g, pos: { map: town, ...townEntry(town), dir: 'up' }, justEntered: null };
}

// 影渡りに受かった（10/4 夜）：くノ一になり、しおりの HP と術の力を くノ一の満タンへ（しおりの術の力は 0 だった）
export function afterKagewatari(game) {
  const r = becomeKunoichi(game, EQUIP);
  const m = maxOf(r.game, 'shiori');
  const p = r.game.party?.shiori ?? {};
  return { ...r, game: { ...r.game, party: { ...r.game.party, shiori: { ...p, hp: m.hp, mp: m.mp, dead: false } } } };
}

// 職業と学びを 戦いの味方に映す（10/5）：職業の技（はじめから＋習った物）・持ち味（かいしん・二連撃・つっぱり・射る・調合）・しおりの如意輪の経
const ATTACK_TEXT = { rikishi: 'つっぱり', yumi: '矢' };
export function formOf(game, a) {
  const f = game?.flags ?? {};
  let out = a;
  const job = jobOf(game, a.id);
  if (job) {
    const j = JOBS[job];
    out = { ...out, job, spells: [...(a.spells ?? []), ...jobSpellsOf(game, a.id)], ...(j.passive ?? {}), ...(ATTACK_TEXT[job] ? { attackText: ATTACK_TEXT[job] } : {}) };
  }
  const le = Object.values(LEARN_AFTER_LOSS).find((x) => x.who === a.id && f[x.flag]);
  if (le) out = { ...out, spells: [...(out.spells ?? []).filter((id) => id !== le.spell), le.spell] };
  return out;
}

// ---- 技を習う（章の町の師匠の試しに受かる）----
export function learnSkill(game, who, ch) {
  const j = JOBS[jobOf(game, who)];
  const sk = j?.skills[ch - 1];
  if (!sk) return { ok: false, game };
  const have = game.skills?.[who] ?? [];
  if (have.includes(sk)) return { ok: false, game, skill: sk };
  return { ok: true, skill: sk, game: { ...game, skills: { ...game.skills, [who]: [...have, sk] } } };
}
// その町で 試しを受けられる人（師匠ごと）：{ who, job, master, form, done }
export function questsAt(game, town, ch = 1) {
  return membersOf(game).flatMap((id) => {
    const job = jobOf(game, id);
    const q = QUESTS[ch]?.[job];
    if (!q || q.town !== town) return [];
    return [{ who: id, job, ...q, skill: JOBS[job].skills[ch - 1], done: (game.skills?.[id] ?? []).includes(JOBS[job].skills[ch - 1]) }];
  });
}

// 戦いのあとに持ち帰る物：HP・術・呪い・取り憑き・残りの名物・盗まれた物・取られた文
// 力つきた仲間は幽霊のまま（dead・HP 0）＝寺社で生き返らせる（本人 10/2）
function settle(game, state) {
  // 戦いに出ていない仲間（戦いの後に加わった人など）の欄は残す（10/4 試運転：二度押しで加わったばかりの猟師の欄が消え、地図が落ちた）
  const party = Object.fromEntries(state.allies.map((a) => [a.id, a.alive === false || a.hp <= 0
    ? { hp: 0, mp: a.mp, dead: true, curse: false, ghost: false }
    : { hp: a.hp, mp: a.mp, curse: !!a.curse, ghost: !!a.ghost }]));
  return {
    ...game, party: { ...game.party, ...party }, items: { ...state.items },
    stolen: [...(game.stolen ?? []), ...(state.stolen ?? [])],
    mon: Math.max(0, game.mon - (state.monLost ?? 0)),
    steps: 0,
  };
}

// 勝った：ボスを元に戻した印・残った道具・HP（力つきた仲間は幽霊のまま）
// ボスを元に戻したお礼の文（本人 10/2「ボスを倒した際は、お金を多めに出して。ここでは50文」＝松川様50・あとは順に増やす＝Claudeの決め）
export const BOSS_MON = { onigajo: 160, usunuma: 280, oniishi: 560, kenkatsura: 1050, kagaminuma: 1700, matsukawa: 50, kashinuma: 70, jagan: 90, ryuto: 120, zarukaburi: 150, daihisan: 170, tenaga: 190, sumitora: 240, amekai: 280, gobou: 300, mukade: 360, heppiri: 380, onibaba: 500, jakotsu: 540, miharugoma: 560, otakimaru: 620, nekonaki: 640, tengu: 700, takuzen: 720, kappa: 780, kiyohime: 1000, kamehime: 1050, nekoma: 1100, ashinaga: 1150, shunobon: 1200, akabeko: 1250, nawakappa: 1300, okon: 1350, numagozen: 1600 }; // 4章（10/6） // 3章（10/4） // 1章は順に多め（Claudeの決め）・ザルカブリは10/4から戦う（本人）

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
    const b = memberStats(id, statKey(g, id), before[id]);
    const a = memberStats(id, statKey(g, id), lv);
    return [id, { ...p, hp: p.hp + a.hp - b.hp, mp: p.mp + a.mp - b.mp }];
  }));
  g = { ...g, party };
  if (g.lv > before.tabi) lines.push(`${nameOf(g, 'tabi')}たちは レベル ${g.lv}に 上がった！`);
  for (const id of membersOf(g)) if (g.expOf?.[id] != null && lvOf(g, id) > before[id]) lines.push(`${nameOf(g, id)}は レベル ${lvOf(g, id)}に 上がった！`);
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
  const zone = map === 'field' ? zoneOf(y) : map;
  // 相馬（1章）・県北（2章）＝その章の10体（10/4 本人「章ごとで、雑魚キャラを変えて」）。章のボスを元に戻すほど強い顔ぶれ（chapterPool）
  // その章の10体の絵がそろうまでは いわきの北の顔ぶれを強めて出す（ZONE_SCALE）
  const chapterList = CHAPTER_OF_MAP[map] ? chapterPool(game, CHAPTER_OF_MAP[map]) : [];
  const pool = map === 'field' ? zone : 'north';
  const list = chapterList.length ? chapterList : Object.keys(ZAKO).filter((id) => !ZAKO[id].pending && !ZAKO[id].retired).filter((id) => ZAKO[id].zones.includes(pool)
    || (ch === '=' && ZAKO[id].zones.includes('road'))
    || (ch === ',' && ZAKO[id].zones.includes('coast')));
  return list.length ? { id: list[Math.floor(rng() * list.length)], zone } : null;
}

// 章の地図と、その章のボス（元に戻した数で 出てくる雑魚の強さの上限が上がる）
export const CHAPTER_OF_MAP = { soma: 1, kenpoku: 2, kenchu: 3, aizu: 4 };
export const CHAPTER_BOSSES = { 1: ['zarukaburi', 'daihisan', 'tenaga', 'sumitora'], 2: ['amekai', 'gobou', 'mukade', 'heppiri', 'onibaba'], 3: ['jakotsu', 'miharugoma', 'otakimaru', 'nekonaki', 'tengu', 'takuzen', 'kappa', 'kiyohime'], 4: ['kamehime', 'nekoma', 'ashinaga', 'shunobon', 'akabeko', 'nawakappa', 'okon', 'numagozen'] };
// 出てくる雑魚：tier が 上限（はじめ4・ボス1体ごとに+2・最大10）以下で、上限より7つ以上は下でない物＝弱い物は だんだん出なくなる
export function chapterPool(game, chapter) {
  // その章の10体の絵が そろうまでは 使わない（1体だけ届いた所で その1体ばかり出た＝10/4 海坊主）
  const all = Object.values(ZAKO).filter((z) => z.chapter === chapter && !z.retired);
  if (!all.length || all.some((z) => z.pending)) return [];
  const done = (CHAPTER_BOSSES[chapter] ?? []).filter((id) => game.cleared?.[id]).length;
  const cap = Math.min(10, 4 + 2 * done);
  return Object.keys(ZAKO).filter((id) => {
    const z = ZAKO[id];
    return z.chapter === chapter && !z.pending && !z.retired && z.tier <= cap && z.tier > cap - 7;
  });
}

// 1歩：歩数を数え、取り憑かれた仲間は HP が1減る（1で止まる）
export function walkStep(game) {
  const party = Object.fromEntries(Object.entries(game.party).map(([id, p]) => [id, p.ghost && !p.dead ? { ...p, hp: Math.max(1, p.hp - 1) } : p]));
  return { ...game, party, steps: (game.steps ?? 0) + 1 };
}

// 道中の戦いの話のデータ（ボスの話と同じ形にして、戦いの画面を使い回す）
// 帯ごとの専用の背景（Gemini・2026-10-02。それまではボスの背景を借りていた）
export const ZONE_BG = { ...Object.fromEntries(['south', 'midSouth', 'midNorth', 'north'].map((z) => [z, `assets/bg_dochu_${z}.png`])), soma: 'assets/bg_dochu_north.png', kenpoku: 'assets/bg_dochu_north.png', kenchu: 'assets/bg_dochu_midNorth.png', aizu: 'assets/bg_dochu_north.png' }; // aizu＝4章（背景の絵が届くまで 借りる）
// 帯ごとの強さの倍率（1章の相馬・HP／攻／守を別々に・もらう経験と文も多め）
export const ZONE_SCALE = { soma: { hp: 6, atk: 3.4, def: 3, reward: 2.5 }, kenpoku: { hp: 9, atk: 4.6, def: 4.2, reward: 3.6 }, kenchu: { hp: 15, atk: 7.0, def: 5.4, reward: 4.7 }, aizu: { hp: 21, atk: 9.4, def: 7.2, reward: 6.2 } }; // aizu＝4章（仮・ボスの試算の あとで 合わせる） // kenchu＝10/4 夜 通しの調整で 12/5.8/5.4→15/7.0/5.4（くノ一が加わり Lv15で1戦1.9T・HP減4%と易しすぎた→2.3T・9%＝tests/_zako_chapter.mjs） // kenpoku＝10/4 仮（2章のボスの試算のあとで合わせる） // 10/3 試算：1.5倍ではLv6の4人が1ターンで倒した＝この倍率で1戦2〜3ターン・HP約1割減（いわきの道中と同じ手ごたえ）
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
      bgm: { soma: 'somaBattle', kenpoku: 'kenpokuBattle', kenchu: 'kenchuBattle', aizu: 'aizuBattle' }[zone], // 1章の道中の曲（10/3「章ごとにBGMは新しく」） // ⚠ reward はボスの「倒したときの文」と同じ名前＝別の名前にする
      weakness: null, noWeak: true, canFlee: true, trick: z.trick ?? null, special: null,
      biteName: z.biteName, introText: z.introText, tellLines: [ZAKO_TELL], restoreLines: z.restoreLines,
      loseLines: ['旅の者たちは 力つきた……'],
      itemNames: Object.fromEntries(Object.entries(ITEMS).map(([id, it]) => [id, it.name])),
    },
  };
  return battleData(game, ep);
}

// 須賀川の松明あかし（3章・10/4）＝御神火に手を合わせると、生きている全員の術が満タン（文はいらない・何度でも）
export function prayGojinka(game) {
  const party = Object.fromEntries(membersOf(game).map((id) => {
    const p = game.party[id] ?? {};
    return [id, p.dead ? p : { ...p, mp: maxOf(game, id).mp }];
  }));
  return { ...game, party };
}

// 猫啼温泉（3章・和泉式部の猫を元に戻すと開く）＝湯につかると HP・術が満タン、呪いと取り憑きも落ちる（猫の病が治った湯）。力つきた仲間は戻らない（寺社で）
export const ONSEN_PRICE = 30;
export function soakOnsen(game, price = ONSEN_PRICE) {
  if (game.mon < price) return { ok: false, game };
  const party = Object.fromEntries(Object.entries(fullParty(game, true)).map(([id, p]) => [id, { ...p, curse: false, ghost: false }]));
  return { ok: true, game: { ...game, mon: game.mon - price, party } };
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
  return { ...game, mon: Math.floor(game.mon / 2), party: fullParty(game), steps: 0, pos: { ...back }, fieldPos: inField ? { x: back.x, y: back.y } : { ...(game.saveFieldPos ?? game.fieldPos) }, fieldMap: inField ? back.map : game.saveFieldMap ?? 'field', castleFrom: TOWNS[back.map]?.inside === 'castle' ? game.saveCastleFrom ?? null : null };
}

// 歩いている間に道具を使う：HP の物は一番弱っている仲間に、術の物は術を使う仲間に
export const NAME = { ...Object.fromEntries(Object.entries(COMPANIONS).map(([id, c]) => [id, c.name])), ...Object.fromEntries(Object.entries(JOBS).map(([id, j]) => [id, j.name])), tabi: '旅の者', shiori: 'しおり' };
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
    text: `${nameOf(game, who)}に ${it.name}を 使った！ ${key === 'mp' ? '術の力' : 'HP'}が ${after - before} もどった！`,
  };
}

// ---- 装備を買う ----
// 買うと その場で着ける。前の品は半値で引き取り。着けられない人・文が足りないときは買えない
export function buyEquip(game, id, who) {
  const e = EQUIP[id];
  if (!canWear(game, id, who)) return { ok: false, reason: 'who', game }; // 武器は その職業の系統だけ（10/5）
  if (game.mon < e.price) return { ok: false, reason: 'money', game };
  const equip = structuredClone(game.equip ?? {});
  equip[who] ??= { weapon: null, armor: null, charm: null }; // 仲間が加わる前の記録には その人の欄が無い
  const old = equip[who][e.slot];
  const refund = old ? Math.floor(EQUIP[old].price / 2) : 0;
  equip[who][e.slot] = id;
  return { ok: true, old, refund, game: { ...game, equip, mon: game.mon - e.price + refund } };
}

// 強さを見る（どうぐ → そうび）
export function partyView(game) {
  return membersOf(game).map((id) => ({
    id, job: jobOf(game, id), ...statsWithGear(id, lvOf(game, id), game.equip ?? {}, statKey(game, id)),
    gear: game.equip?.[id] ?? {},
  }));
}

// ---- 昔話の味方が仲間に加わる（本人 10/2）。最大4人・加わるとそのレベルの満タン ----
export const GUN_JOIN_TAMA = 5;
export function join(game, id) {
  const members = membersOf(game);
  if (!COMPANIONS[id] || members.includes(id) || members.length >= MAX_PARTY) return { ok: false, game };
  // 始めの2人より JOIN_LV_BELOW 下のレベルで加わる（Lv1 より下にはならない）
  const lv = Math.max(1, (game.lv ?? 1) - JOIN_LV_BELOW);
  // 鉄砲を使う仲間（猟師）は 玉を持って加わる（10/4 夜 通しの調整：玉を持たないと ボスの勝率が6割前後まで下がる）
  const items = COMPANIONS[id].gun ? { ...game.items, tama: (game.items?.tama ?? 0) + GUN_JOIN_TAMA } : game.items;
  const g = { ...game, items, members: [...members, id], expOf: { ...game.expOf, [id]: EXP_TO[lv] } };
  const m = maxOf(g, id);
  return { ok: true, game: { ...g, party: { ...game.party, [id]: { hp: m.hp, mp: m.mp } } } };
}

// 名前（あなた＝付けた名前か 旅の者・しおり・仲間＝職業の名前・10/5）
export const nameOf = (game, id) => (id === 'tabi' && validHeroName(game?.heroName) ? game.heroName : NAME[id] ?? id);
// 話のデータの「旅の者たちは 力つきた」などを あなたの名前に
const heroLines = (lines, game) => (validHeroName(game?.heroName) && lines ? lines.map((t) => t.replace(/^旅の者/, game.heroName)) : lines);

// ---- 相馬の道場（本人 10/4「旅の者は、途中クエストを受け剣術使いの『武士』に変更」・選んだ＝1章 相馬・道場の試し合い・居合い斬り）----
// 師範と木刀で 3本勝負（2本先に取れば 免状）。旅の者ひとりで戦う。強さは そのときの旅の者に合わせる（いつ来ても勝負になる）
// 1本ごとに傷は手当てしてもらえる（木刀の試し合い）。2本取られたら「出直してこい」＝数は0へ戻り、また挑める（文は取られない）
export const DOJO_WIN = 2;
export const DOJO_ROUNDS = [1.02, 1.02, 1.02]; // 10/5 職業の一騎打ちへ広げたので 1.03→1.02（5職業×Lv5〜11で 1本 7〜9割・合格 8〜10割＝tests/_tune_duel.mjs。⚠1.00 で ほぼ全勝・1.03 で 4割台の段＝整数の丸めで急に変わる） // 本目ごとの師範の強さ（10/4 測った：本目で上げると 体力の1太刀の差で急に勝てなくなる＝そろえる。1本 約6〜8割・免状まで 約6〜9割＝tests/_tune_dojo.mjs）
export const DOJO_ART = 'assets/dojo_shihan.png'; // 10/4 師範の絵が届いた（294zkl・art_src/prep_dojo.py）
// 10/5〜 一騎打ちは 武士・力士・妖術使い・忍者・山伏の試し（jobs.js の QUESTS の form 'duel'）＝ who（その人ひとり）と 師匠
export function duelData(game, round, who = game.flags?.dojo?.who ?? 'tabi') {
  const lv = lvOf(game, who);
  const m = statsWithGear(who, lv, game.equip ?? {}, statKey(game, who));
  const q = QUESTS[game.flags?.dojo?.ch ?? 1]?.[jobOf(game, who)];
  const master = q?.master ?? '道場の師範';
  const k = DOJO_ROUNDS[round - 1] ?? 1;
  // 相手の絵：相馬の 剣術道場の 師範（1章の 武士）だけ 描いた絵（DOJO_ART）。ほかの 師匠は 話しかけた その人の 歩く絵を 大きく（BattleScene が 正面の1コマから 作る）
  const look = game.flags?.dojo?.look ?? null;
  const own = (game.flags?.dojo?.ch ?? 1) === 1 && jobOf(game, who) === 'bushi';
  const art = own || !look ? { dark: DOJO_ART, light: DOJO_ART } : { dark: `people:${look}`, light: `people:${look}`, look };
  // 1ターンに入る見込み（師匠の守り＝攻撃力の6割）。10/5 職業の持ち味（二連撃・つっぱり・射る）も数える＝どの職業でも 同じくらいの勝負になる
  const one = formOf(game, { id: who, name: nameOf(game, who), spells: [] });
  const def = m.atk * 0.6;
  const pierce = one.pierce ?? (one.dual ? 0.7 : 1);
  const hit = Math.max(1, one.dual ? 2 * (m.atk * 0.7 - (def * pierce) / 2) : m.atk * (one.atkMult ?? 1) - (def * pierce) / 2);
  const enemy = {
    id: `dojo-${round}`, duel: round, name: master,
    hp: Math.round(hit * 5.6 * k), atk: Math.round((m.def / 2 + m.hp / 5.4) * k), def: Math.round(def), agi: m.agi,
    weakness: null, noWeak: true, canFlee: false, trick: null, special: null,
    bgm: 'somaBattle', biteName: '木刀の 打ちこみ',
    introText: `${round}本目、はじめ！`,
    tellLines: ['がんばって！ 相手の 木刀を よく 見て！'],
    restoreLines: [], loseLines: [`${nameOf(game, who)}は 一本 取られた……`],
  };
  // 一騎打ちは たたかう だけ（持ち味は効く＝力士の つっぱり・忍者の 二連撃・武士の かいしん）
  const me = { ...one, spells: [], ...m, maxHp: m.hp, maxMp: m.mp, hp: m.hp, mp: m.mp, alive: true };
  return {
    art: { ...art, bg: QUEST_ART.duel_bg ?? [ZONE_BG.soma, ZONE_BG.soma, ZONE_BG.kenpoku, ZONE_BG.kenchu][game.flags?.dojo?.ch ?? 1] ?? ZONE_BG.soma, glowDark: 0xffd27a, glowLight: 0xffd27a }, // 10/8 道場の 絵（届けば）
    allies: [me], items: {}, spells: {}, enemy,
  };
}
// 1本の勝ち負けのあと。next＝つぎの本目（決まったら null）・bushi＝いま武士になった。HP と術は戦いの前のまま（木刀の試し合いは傷を残さない）
// 一騎打ちを始める（町の師匠に話して「試しを受ける」）
// look＝話しかけた 師匠の 見た目（10/5 夜 本人「必殺技のクエストで、話す人と戦う人が違うことがある。剣の試合は同じ人」＝戦いの相手を その師匠の絵に）
export function startDuel(game, who, ch = 1, look = null) {
  return { ...game, flags: { ...game.flags, dojo: { who, ch, look, wins: 0, losses: 0 } } };
}
export function afterDuel(game, round, won) {
  const d = { who: 'tabi', ch: 1, wins: 0, losses: 0, ...(game.flags?.dojo ?? {}) };
  if (won) d.wins += 1; else d.losses += 1;
  const q = QUESTS[d.ch]?.[jobOf(game, d.who)];
  const master = q?.master ?? '師範';
  const lines = [won ? `一本！ ${round}本目は ${nameOf(game, d.who)}の 勝ち！` : `一本！ ${round}本目は ${master}の 勝ち。`];
  let g = { ...game, flags: { ...game.flags, dojo: d } };
  let next = round + 1;
  let learned = null;
  if (d.wins >= DOJO_WIN) {
    g = { ...g, flags: { ...g.flags, dojo: null } };
    next = null;
    const r = learnSkill(g, d.who, d.ch);
    g = r.game;
    learned = r.skill ?? null;
    const sp = JOB_SPELLS[r.skill];
    lines.push(`${master}「見事！ その 腕、しかと 認めよう。」`,
      `${master}「わが 奥義、${sp?.name ?? ''}を さずける。」`,
      `${nameOf(game, d.who)}は ${sp?.name ?? ''}を おぼえた！`);
  } else if (d.losses >= DOJO_WIN) {
    g = { ...g, flags: { ...g.flags, dojo: null } };
    next = null;
    lines.push(`${master}「まだまだ。腕を みがいて 出直して こい。」`);
  }
  return { game: g, lines, next, learned, bushi: false };
}
