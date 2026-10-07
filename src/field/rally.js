// 3つのスタンプラリー（10/6 本人「3つの道具はスタンプラリー(コレクション)を集めてもらえる。①福島温泉めぐり、各温泉に入り、スタンプをもらう。
// ②福島グルメ登場させ、各お店より購入する。③お城クエスト、各お城のお殿様に合い、クエストのお題を授かる」→案を「この案で進める」）
// そろうと 終章の 舞台の 幕を 開ける 道具が もらえる（お城＝揚羽蝶の旗／温泉＝駒ヶ岳の花／グルメ＝お伊勢参りの台本）
// 画面と切り離した計算だけ（FieldScene が 湯・買い物・お殿様の 話で 呼ぶ）。記録は game.stamps＝{ onsen:{}, gourmet:{}, castle:{} }・game.relics
import { TOWNS } from './towns.js?v=268';
import { CASTLE_QUESTS, questAccepted, acceptQuest } from './castle.js?v=268';
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

// そろうと もらえる 道具（終章 檜枝岐の 舞台に 供える）
export const RELICS = {
  castle: { id: 'agehacho', name: '揚羽蝶の旗' },
  onsen: { id: 'komahana', name: '駒ヶ岳の花' },
  gourmet: { id: 'daihon', name: 'お伊勢参りの台本' },
};
export const RALLY_NAME = { onsen: '福島温泉めぐり', gourmet: '福島グルメ', castle: 'お城クエスト' };

const LISTS = { onsen: ONSEN_RALLY, gourmet: Object.keys(GOURMET_RALLY), castle: Object.keys(CASTLE_RALLY) };
export const rallyKeys = (kind) => LISTS[kind];
export const hasStamp = (game, kind, key) => !!game?.stamps?.[kind]?.[key];
export const stampCount = (game, kind) => LISTS[kind].filter((k) => hasStamp(game, kind, k)).length;

// 判子を 押す。新しく 押せたら lines に 知らせ・そろったら 道具も（もう 押してあれば 何もしない）
export function addStamp(game, kind, key) {
  if (!LISTS[kind].includes(key) || hasStamp(game, kind, key)) return { game, lines: [], added: false };
  const stamps = { ...(game.stamps ?? {}), [kind]: { ...(game.stamps?.[kind] ?? {}), [key]: true } };
  let g = { ...game, stamps };
  const n = stampCount(g, kind);
  const total = LISTS[kind].length;
  const place = kind === 'castle' ? CASTLE_RALLY[key].castle : TOWNS[key]?.name ?? key;
  const lines = [`${RALLY_NAME[kind]}：${place}の 判子を もらった！（${n} / ${total}）`];
  const relic = RELICS[kind];
  if (n === total && !g.relics?.[relic.id]) {
    g = { ...g, relics: { ...(g.relics ?? {}), [relic.id]: true } };
    lines.push(`${RALLY_NAME[kind]}の 判子が ぜんぶ そろった！`, `「${relic.name}」を 授かった！`);
  }
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
  if (hasStamp(game, 'castle', town) && game.cleared?.[cq.boss]) return { game, lines: [say(`よう 来た。そなたらの 働き、${q.castle}の 者は みな 忘れぬぞ。`)], done: true };
  if (game.cleared?.[cq.boss]) {
    const r = addStamp(game, 'castle', town);
    return { game: r.game, lines: [say(`おお、${cq.place}の もやを はらって くれたか。礼を 言うぞ。`), ...r.lines], done: true };
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
