// 終わりの 場面（10/8 段6・本人「語り返し＋エンドロール」）：画面と 切り離した 計算だけ（src/scenes/EndingScene.js が 見せる）
// 流れ＝幕が 下りる → 福島じゅうの もやが 晴れ、落人たちが 光に なって 昇る → 元に 戻した 主たちが 話の 順に 流れる → しおりの 語りで 締める → 作り手 →「おわり」→ 題の 画面
// ⭐筋の芯（10/8 本人）＝大将の 怨念が 県内の もやを 作っていた・4人が 制覇すると 晴れて 落人も 成仏
import { EPISODES, PRELUDE } from '../data/episodes.js?v=281';
import { ORDERED } from './collection.js?v=281';

export const ENDING_OPEN = [
  '幕が、静かに 下りた……',
  '福島じゅうの 黒い もやが、ほどけて 消えていく。',
  '手下も、家来も、姫も、大将も、光に なって 空へ 昇っていった。',
];

// 元に 戻した 主たち（話の 順・お城の お題も）。絵＝元の 姿（art.light）
export function endingRoll(game) {
  return ORDERED.filter((e) => game?.cleared?.[e.enemy.id]).map((e) => ({ // 10/9 図鑑と 同じ 並び（お城の お題は 最後）
    id: e.enemy.id, episode: e.enemy.episode, tale: e.enemy.tale, place: e.enemy.place.replace(/^福島県/, ''), img: e.art.light,
  }));
}

// しおりの 語りで 締める（語り返し）
export const ENDING_SHIORI = [
  'わたしたちが 語り返した 昔話は、ぜんぶで {n}話。',
  '昔話は、語られて いるかぎり、忘れられたり しないわ。',
  'だから これからも、だれかに 語って あげてね。',
  'いっしょに 旅を して くれて、ありがとう。',
];
// 数は 話数を 数える 本筋だけ（10/8＝前は 手下（前座）と お城の お題まで 数えて 34〜39話と 出た）＝大将まで 来た 記録なら 33話
export const talesTold = (game) => EPISODES.filter((e) => game?.cleared?.[e.enemy.id] && !PRELUDE[e.enemy.id] && !e.enemy.side).length;
export const shioriLines = (game) => ENDING_SHIORI.map((t) => t.replace('{n}', String(talesTold(game))));
// しおりの 締めの 声（10/8 本人「しおりの締めに声」＝Gemini TTS の Sulafat・art_src/gemini_tts.py <紙芝居_終章南会津.md> ending_shiori）
//   1行目は「さんじゅうさんわ」と 読む＝話の 数が 33 の 時だけ 流す（ほかの 数なら 字だけ）
export const ENDING_TALES = 33;
export const shioriVoices = (game) => ENDING_SHIORI.map((_, i) => (i === 0 && talesTold(game) !== ENDING_TALES ? null : `assets/story/ending_shiori_${i + 1}.mp3`));

// 作り手（確かな 事だけ）
export const CREDITS = [
  ['福島昔話クエストRPG', ''],
  ['作り', '日本昔話クエスト'],
  ['絵', 'Gemini で 描いた ドット絵と 影絵'],
  ['声', 'Gemini の 声（語り部 しおり・題の 読み・大将）'],
  ['曲と 効果音', 'ゲームの 中で 作った 音'],
  ['昔話', '福島県の 各地に 伝わる お話'],
];

// 終えた 印（記録に 残す＝題の 画面の 記憶の 札に ★）
export const markEnded = (game) => ({ ...game, ended: true });
