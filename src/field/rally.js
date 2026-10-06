// 3つのスタンプラリー（10/6 本人「3つの道具はスタンプラリー(コレクション)を集めてもらえる。①福島温泉めぐり、各温泉に入り、スタンプをもらう。
// ②福島グルメ登場させ、各お店より購入する。③お城クエスト、各お城のお殿様に合い、クエストのお題を授かる」→案を「この案で進める」）
// そろうと 終章の 舞台の 幕を 開ける 道具が もらえる（お城＝揚羽蝶の旗／温泉＝駒ヶ岳の花／グルメ＝お伊勢参りの台本）
// 画面と切り離した計算だけ（FieldScene が 湯・買い物・お殿様の 話で 呼ぶ）。記録は game.stamps＝{ onsen:{}, gourmet:{}, castle:{} }・game.relics
import { TOWNS } from './towns.js?v=208';

// 温泉めぐり（15か所）＝湯に つかると 判子
export const ONSEN_RALLY = ['yumoto', 'iizaka', 'takayu', 'tsuchiyu', 'dake', 'bandaiatami', 'bohata', 'nekonakiyu', 'futamata', 'kashi', 'nakanosawa', 'higashiyama', 'ashinomaki', 'nishiyama', 'hayato'];

// 福島グルメ（11品）＝その町の 店で 名物を 買うと 判子（名物は 10/6 ネットで 確かめた。小高・須賀川は 確かな 名物が 見つからず 外した）
export const GOURMET_RALLY = {
  taira: 'g_unikai', onahama: 'g_mehikari', yumoto: 'g_manju', nakamura: 'g_hokki', fukushima: 'g_momo', nihonmatsu: 'tamayokan',
  koriyama: 'g_usukawa', shirakawa: 'g_ramen', inawashiro: 'g_soba', aizuwakamatsu: 'g_kozuyu', yanaizu: 'g_awaman',
};

// お城クエスト（5つ）＝お殿様の お題を 果たして 話しかけると 判子。need＝boss（その主を 元に戻す）か item（その品を 1つ 届ける）
export const CASTLE_RALLY = {
  taira: { castle: '磐城平城', lord: '平の お殿様', need: { boss: 'ryuto' }, ask: '磐城の 海に 灯を ともす 龍が、黒い もやに 呑まれて おる。龍燈の 龍を 鎮めて まいれ。' },
  nakamura: { castle: '相馬中村城', lord: '相馬の お殿様', need: { boss: 'sumitora' }, ask: '虎捕山に ひそむ 山賊、橘墨虎を 鎮めて まいれ。' },
  nihonmatsu: { castle: '二本松城', lord: '二本松の お殿様', need: { item: 'g_usukawa' }, ask: '郡山の 宿場で 生まれた 薄皮饅頭を、ひとつ 届けて くれぬか。' },
  shirakawa: { castle: '白河小峰城', lord: '白河の お殿様', need: { boss: 'kiyohime' }, ask: '安珍を 追う 清姫の 炎が、もやに 呑まれて 荒れて おる。鎮めて まいれ。' },
  aizuwakamatsu: { castle: '鶴ヶ城', lord: '会津の お殿様', need: { item: 'g_awaman' }, ask: '柳津の あわまんじゅうを、ひとつ 届けて くれぬか。二度と 災難に あわぬ ように との 菓子じゃ。' },
};

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
// 名物を 買った（その町の 名物なら 判子）
export const stampGourmet = (game, town, itemId) => (GOURMET_RALLY[town] === itemId ? addStamp(game, 'gourmet', town) : { game, lines: [], added: false });

// お殿様に 話しかけた：お題が まだなら お題・果たして いれば 判子（品は 1つ 受けとる）・済んで いれば お礼
export function lordTalk(game, town) {
  const q = CASTLE_RALLY[town];
  if (!q) return { game, lines: [], done: false };
  if (hasStamp(game, 'castle', town)) return { game, lines: [`${q.lord}「よう 来た。そなたらの 働き、${q.castle}の 者は みな 忘れぬぞ。」`], done: true };
  const met = q.need.boss ? !!game.cleared?.[q.need.boss] : (game.items?.[q.need.item] ?? 0) > 0;
  if (!met) return { game, lines: [`${q.lord}「旅の 者か。ひとつ 頼みが ある。」`, `${q.lord}「${q.ask}」`], done: false };
  let g = game;
  if (q.need.item) g = { ...g, items: { ...g.items, [q.need.item]: g.items[q.need.item] - 1 } };
  const r = addStamp(g, 'castle', town);
  return { game: r.game, lines: [`${q.lord}「おお、果たして くれたか。礼を 言うぞ。」`, ...r.lines], done: true };
}
