// 3つのスタンプラリー（10/6 本人「3つの道具はスタンプラリー(コレクション)を集めてもらえる。①福島温泉めぐり、各温泉に入り、スタンプをもらう。
// ②福島グルメ登場させ、各お店より購入する。③お城クエスト、各お城のお殿様に合い、クエストのお題を授かる」→案を「この案で進める」）
// そろうと 終章の 舞台の 幕を 開ける 道具が もらえる（お城＝揚羽蝶の旗／温泉＝駒ヶ岳の花／グルメ＝お伊勢参りの台本）
// 画面と切り離した計算だけ（FieldScene が 湯・買い物・お殿様の 話で 呼ぶ）。記録は game.stamps＝{ onsen:{}, gourmet:{}, castle:{} }・game.relics
import { TOWNS } from './towns.js?v=281';
import { CASTLE_QUESTS, questAccepted, acceptQuest } from './castle.js?v=281';
const CASTLE_NAME = { taira: '磐城平城', nakamura: '相馬中村城', nihonmatsu: '二本松城', shirakawa: '白河小峰城', aizuwakamatsu: '鶴ヶ城' };
const LORD_NAME = { taira: '平', nakamura: '相馬', nihonmatsu: '二本松', shirakawa: '白河', aizuwakamatsu: '会津' };

// 温泉めぐり（15か所）＝湯に つかると 判子
export const ONSEN_RALLY = ['yumoto', 'iizaka', 'takayu', 'tsuchiyu', 'dake', 'bandaiatami', 'bohata', 'nekonakiyu', 'futamata', 'kashi', 'nakanosawa', 'higashiyama', 'ashinomaki', 'nishiyama', 'hayato'];

// 福島グルメ（11品）＝その町の 店で 名物を 買うと 判子（名物は 10/6 ネットで 確かめた。小高・須賀川は 確かな 名物が 見つからず 外した）
export const GOURMET_RALLY = {
  taira: 'g_unikai', onahama: 'g_mehikari', yumoto: 'g_manju', nakamura: 'g_hokki', fukushima: 'g_momo', nihonmatsu: 'tamayokan',
  koriyama: 'g_usukawa', shirakawa: 'g_ramen', inawashiro: 'g_soba', aizuwakamatsu: 'g_kozuyu', yanaizu: 'g_awaman',
};

// お城クエスト（5つ）＝お殿様の お題を 果たして 話しかけると 判子
// ⭐10/7 作り直し（本人「お城の中に入って、お殿様よりクエストを受ける。新しい場所でモンスターを倒す」）＝お題は 言い伝えの 怪物（src/field/castle.js の CASTLE_QUESTS）
export const CASTLE_RALLY = Object.fromEntries(Object.entries(CASTLE_QUESTS).map(([t, q]) => [t, {
  castle: CASTLE_NAME[t], lord: `${LORD_NAME[t]}の お殿様`, need: { boss: q.boss }, ask: q.ask.join(''),
}]));

// 終章 檜枝岐の 舞台に 供える 道具。⭐10/8 本人「もらいかたは全て戦い」＝ラリーが そろうと 取りに 行ける（そろって いない 間は 敵が 現れない）
//   place＝取りに 行く 場所・foe＝そこで 戦う 相手（戦いは 段2b〜2d で 足す）
export const RELICS = {
  castle: { id: 'agehacho', name: '揚羽蝶の旗', place: 'モーカケの滝', foe: '落人の 姫の 霊', at: '滝', boss: 'mokake' }, // 10/8 段2d
  onsen: { id: 'komahana', name: '駒ヶ岳の花', place: '会津駒ヶ岳', foe: '平家の 落人の 家来', at: '駒', boss: 'ochikerai' }, // 10/8 段2c
  gourmet: { id: 'daihon', name: 'お伊勢参りの台本', place: '橋場のばんば', foe: '橋場の ばんばさま', at: '婆', boss: 'banba' }, // 10/8 段2b
};
// at＝南会津の 地図の 字・boss＝そこで 戦う 相手（episodes.js の id）。勝つと その 道具（game.js の afterWin）
export const RELIC_OF_BOSS = Object.fromEntries(Object.values(RELICS).filter((r) => r.boss).map((r) => [r.boss, r.id]));
// お城の お題の 褒美（10/8 夜）＝文と その土地に ちなむ お守り（equip.js の r_<町>・強さは お題の 順に 上がる）
export const CASTLE_REWARD = {
  taira: { mon: 300, charm: 'r_taira' }, nakamura: { mon: 500, charm: 'r_nakamura' }, nihonmatsu: { mon: 700, charm: 'r_nihonmatsu' },
  shirakawa: { mon: 900, charm: 'r_shirakawa' }, aizuwakamatsu: { mon: 1200, charm: 'r_aizuwakamatsu' },
};
// 褒美の お守りを who に 着ける（前の お守りは 家老に あずける＝消える）
export function wearReward(game, id, who) {
  const equip = { ...(game.equip ?? {}), [who]: { ...(game.equip?.[who] ?? {}), charm: id } };
  return { game: { ...game, equip }, old: game.equip?.[who]?.charm ?? null };
}
export const RALLY_NAME = { onsen: '福島温泉めぐり', gourmet: '福島グルメ', castle: 'お城クエスト' };

const LISTS = { onsen: ONSEN_RALLY, gourmet: Object.keys(GOURMET_RALLY), castle: Object.keys(CASTLE_RALLY) };
export const rallyKeys = (kind) => LISTS[kind];
export const hasStamp = (game, kind, key) => !!game?.stamps?.[kind]?.[key];
export const stampCount = (game, kind) => LISTS[kind].filter((k) => hasStamp(game, kind, k)).length;
// ラリーが そろったか（そろうと 道具を 取りに 行ける）
export const rallyDone = (game, kind) => stampCount(game, kind) === LISTS[kind].length;
// 舞台（字 舞）の 幕（10/8 段2e）：道具3つ そろうと 手下 → 大将。足りない 間は need に 道具の 名前
export function stageNext(game) {
  const need = Object.values(RELICS).filter((r) => !game.relics?.[r.id]).map((r) => r.name);
  if (need.length) return { need, next: null };
  if (!game.cleared?.teshita) return { need, next: 'teshita' };
  if (!game.cleared?.taisho) return { need, next: 'taisho' };
  return { need, next: null };
}
// その 字の 前で「はなす」と 戦いに なる 相手（ラリーが そろい、まだ 戻して いない とき だけ）。そろって いない 間は null＝敵は 現れない（ばんばは にこにこ）
export function relicFoeAt(game, ch) {
  const kind = Object.keys(RELICS).find((k) => RELICS[k].at === ch);
  const r = kind && RELICS[kind];
  if (!r?.boss || game.cleared?.[r.boss] || !rallyDone(game, kind)) return null;
  return r.boss;
}

// 道具を 守る 相手の 前だが まだ 戦えない（ラリーが そろって いない）＝あと いくつ（10/9 本人「橋場のばんばで戦えません」＝何が 足りないか 分からなかった）
export function relicWait(game, ch) {
  const kind = Object.keys(RELICS).find((k) => RELICS[k].at === ch);
  const r = kind && RELICS[kind];
  if (!r?.boss || game.cleared?.[r.boss] || rallyDone(game, kind)) return null;
  return { kind, name: RALLY_NAME[kind], left: LISTS[kind].length - stampCount(game, kind), relic: r.name };
}

// 終章の 印で いま 戦える か（10/9 本人「南会津はもやのマークが無いから分かりにくい」＝ほかの ボスと 同じ うずと 赤い 矢印を 出す 印）
//   婆・駒・滝＝ラリーが そろい まだ 戻して いない／舞＝道具 3つが そろい 手下か 大将が 残る
export const endFoeReady = (game, ch) => (ch === '舞' ? !!stageNext(game).next : !!relicFoeAt(game, ch));

// 終章の 印で もう一度 戦える 相手（10/9 本人「クリア後、今、檜枝岐村にいます。チェックをしたいのでそれぞれのボスと戦えるように」）
//   婆・駒・滝＝その 道具を 守る 相手を 戻した 後／舞＝手下・大将を 戻した 後（戦える 順）。返り＝[[名前, id]…]
export function endRematch(game, ch) {
  const ids = ch === '舞' ? ['teshita', 'taisho'] : Object.values(RELICS).filter((r) => r.at === ch && r.boss).map((r) => r.boss);
  const NAME = { teshita: '落人の 手下たち', taisho: '落人の 大将' };
  return ids.filter((id) => game.cleared?.[id]).map((id) => [NAME[id] ?? Object.values(RELICS).find((r) => r.boss === id).foe, id]);
}

// 判子を 押す。新しく 押せたら lines に 知らせ・そろったら 道具の 手がかり（道具は 渡さない＝10/8 戦って もらう）（もう 押してあれば 何もしない）
export function addStamp(game, kind, key) {
  if (!LISTS[kind].includes(key) || hasStamp(game, kind, key)) return { game, lines: [], added: false };
  const stamps = { ...(game.stamps ?? {}), [kind]: { ...(game.stamps?.[kind] ?? {}), [key]: true } };
  let g = { ...game, stamps };
  const n = stampCount(g, kind);
  const total = LISTS[kind].length;
  const place = kind === 'castle' ? CASTLE_RALLY[key].castle : TOWNS[key]?.name ?? key;
  const lines = [`${RALLY_NAME[kind]}：${place}の 判子を もらった！（${n} / ${total}）`];
  const relic = RELICS[kind];
  if (n === total) lines.push(`${RALLY_NAME[kind]}の 判子が ぜんぶ そろった！`, `「${relic.name}」の 手がかり：${relic.place}`);
  return { game: g, lines, added: true };
}

// 湯に つかった（その町が 温泉めぐりの 町なら 判子）
export const stampOnsen = (game, town) => (ONSEN_RALLY.includes(town) ? addStamp(game, 'onsen', town) : { game, lines: [], added: false });
// 名物を 景品で もらった（その町の 名物なら 判子）。⭐10/7 本人「グルメスタンプはアトラクションの景品で出るように。例：小名浜の釣りの景品でめひかり」
// ＝店で 買っても 判子は 出ない（店では 食べ物として 買える）。景品の 名物から その町を 引く
export const gourmetTownOf = (itemId) => Object.keys(GOURMET_RALLY).find((t) => GOURMET_RALLY[t] === itemId) ?? null;
export const stampGourmet = (game, itemId) => {
  const town = gourmetTownOf(itemId);
  return town ? { ...addStamp(game, 'gourmet', town), town } : { game, lines: [], added: false, town: null };
};

// お殿様に 話しかけた（城の 大広間で）：はじめは お題を 授かる（入口が ひらく）・怪物を 元に戻して いれば 判子・済んで いれば お礼
export function lordTalk(game, town) {
  const q = CASTLE_RALLY[town];
  const cq = CASTLE_QUESTS[town];
  if (!q) return { game, lines: [], done: false };
  const say = (t) => `${q.lord}「${t}」`;
  // 10/7 夜 判子が あっても 怪物を 戻して いなければ お題へ（10/6 の 決まりで 先に 判子を もらった 記録は、お題を 受けられず 鬼ヶ城山に 入れなかった）
  // 10/8 夜 褒美を もらったかは 判子と 別に 覚える（castleRewarded）＝褒美の 無い 版で 報告を 済ませた 記録も 1度だけ 褒美を もらえる
  if (game.castleRewarded?.[town] && game.cleared?.[cq.boss]) return { game, lines: [say(`よう 来た。そなたらの 働き、${q.castle}の 者は みな 忘れぬぞ。`)], done: true };
  if (game.cleared?.[cq.boss]) {
    // 10/8 夜 本人「殿様に報告しても何もない。味気が無い」＝侍が 並ぶ 中で 礼と 褒美（文＋お守り）→ 判子
    const rw = CASTLE_REWARD[town];
    const r = addStamp(game, 'castle', town);
    const g = { ...r.game, mon: (r.game.mon ?? 0) + rw.mon, castleRewarded: { ...(r.game.castleRewarded ?? {}), [town]: true } };
    const lines = [
      '侍たちが 大広間に ずらりと 並んだ……',
      say(`おお、${cq.place}の もやを はらって くれたか。礼を 言うぞ。`),
      say(`この 働き、${q.castle}の 者は みな 忘れぬ。褒美を とらせよう。`),
      `褒美に ${rw.mon}文を いただいた！`,
      ...r.lines,
    ];
    return { game: g, lines, done: true, charm: rw.charm };
  }
  // 依頼は その章を 終えてから（10/7 本人）＝章の 最後の ボスを 戻すまでは 断る
  if (!questAccepted(game, town) && !game.cleared?.[cq.after]) {
    return { game, lines: [say('旅の 者か。よう 来た。'), say(`いまは ${cq.busy}の 件で 手一杯じゃ。それが 鎮まったら、また 来て くれ。`)], done: false };
  }
  if (!questAccepted(game, town)) {
    return { game: acceptQuest(game, town), lines: [say('旅の 者か。よう 来た。ひとつ 頼みが ある。'), ...cq.ask.map(say), say(cq.hint), `お題を 受けた！ ${cq.place}への 入口が ひらいた。`], done: false, accepted: true };
  }
  return { game, lines: [say(`${cq.place}の 件、たのんだぞ。`), say(cq.hint)], done: false };
}

// 家老：お題を 受けて いれば 行き先を、まだなら ひと言
export function karoTalk(game, town, lines) {
  const cq = CASTLE_QUESTS[town];
  if (questAccepted(game, town) && !game.cleared?.[cq.boss]) return [`家老「${cq.place}へは、${cq.hint}」`];
  return lines;
}
