// 第三十話 只見川の小豆洗い（終章 南会津の 1戦目・10/9 本人「檜枝岐村以前に、もうひとつ戦いを増やしてほしい」「只見を作る」）
// 出どころ＝国際日本文化研究センター 怪異・妖怪伝承データベース「小豆洗い」（地域＝金山町）：
//   「只見川の中の沢には小豆洗いが出て、ザックザックと音をさせて小豆を研ぐ。怖いから沢の近くは通らなかった。」
// ⚠記録は 金山町（只見川の 下流）＝只見町の 記録では ない。補足（hosoku）で そう 言う。姿を 見た 話は 無い＝聞こえるのは 音だけ
// ⭐悪者に しない：もやに 呑まれて 暴れた・戻すと また 静かに 小豆を 研ぐ だけの 者
// 場所＝只見の 町の 奥の 只見川の 沢（castle.js の SAWA・字 豆）。勝つと 田島の 南の 壁 十 が 晴れて 檜枝岐へ
// 絵（ボス・挿絵・背景）・紙芝居（影絵 4枚と 声）・アイキャッチ（挿絵 小豆の 雨から）は 10/9 そろった
import { BASIC_ITEMS } from './basic_items.js?v=330';

export const AZUKIARAI = {
  art: {
    // 10/9 本人が Gemini で 描いた（kp3gqa・sl1xqe・myodkd＝art_src/sets_api.json の azukiarai）
    dark: 'assets/azukiarai_dark.png', light: 'assets/azukiarai_light.png', bg: 'assets/bg_azukiarai.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['seseragi'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    seseragi: {
      name: '只見川の せせらぎ', cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: '只見川の 澄んだ せせらぎが 沢に ひびいた！ 小豆洗いは、もとの 静かな 水の 音を 思い出した！',
      plainText: 'せせらぎの 音は、黒い もやに かき消された……',
    },
  },
  enemy: {
    id: 'azukiarai',
    name: '小豆洗い',
    episode: '第三十話',
    tale: '只見川の小豆洗い',
    place: '福島県金山町', // 記録の 地域（戦う 場所は 只見の 町の 奥の 沢＝補足で 言う）
    autoWinTarget: 0.8, // 終章の 中ボス（家来・姫の霊・ばんばと 同じ）
    expectLv: 26, // 終章の 1戦目（家来 27 の 前）
    hp: 1000, atk: 380, def: 150, agi: 15,
    bgm: 'azukiarai',
    weakness: 'seseragi',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: '小豆の 雨', kind: 'all', chance: 0.24, power: 140, flash: [200, 90, 80], sfx: 'azukiame', cutin: 'assets/cutin/azukiarai_ame.png' }, // 10/9 ipc1kc
    special2: { name: 'ザックザックの 音', kind: 'silence', chance: 0.14, power: 120, flash: [180, 200, 255], sfx: 'zakuzaku', cutin: 'assets/cutin/azukiarai_zaku.png' }, // 10/9 af5mpf・術封じ（研ぐ 音で 声が とどかない）
    biteName: '笊で たたく',
    introText: '沢の 闇から、ザックザック、ザックザックと 小豆を 研ぐ 音……。黒い もやを まとった 影が あらわれた！',
    tellLines: [
      '只見川の 沢には、小豆洗いが 出ると いわれて いたの。',
      '夜に なると、ザックザックと 小豆を 研ぐ 音が する。怖くて、だれも 沢の 近くを 通らなかった そうよ。',
      '……もやに 呑まれて しまったのね。只見川の せせらぎを 聞かせて あげましょう。',
    ],
    // 紙芝居（10/9 本人の 影絵 4qq2bc・3r5g0s・o742nb・e7fn31／声＝AI Studio Sulafat・台本＝置き場 紙芝居_只見の小豆洗い.md）
    story: {
      tell: [
        { img: 'assets/story/azukiarai_1.png', voice: 'assets/story/azukiarai_1.mp3', text: '只見川の 沢には、むかしから 小豆洗いが 出ると 伝わるの。夜に なると、ザックザック、ザックザックと、小豆を 研ぐ 音が 聞こえてきた そうよ。' },
        { img: 'assets/story/azukiarai_2.png', voice: 'assets/story/azukiarai_2.mp3', text: '姿を 見た 人は いないの。聞こえるのは、小豆を 研ぐ 音だけ。村の 人たちは 怖がって、沢の 近くを 通らなかった そうよ。' },
        { img: 'assets/story/azukiarai_3.png', voice: 'assets/story/azukiarai_3.mp3', text: 'けれど 山を こえて 流れてきた 黒い もやが、沢の 小豆洗いを 呑みこんで しまった……。思い出させて あげましょう。只見川の せせらぎを。' },
      ],
      after: [
        { img: 'assets/story/azukiarai_4.png', voice: 'assets/story/azukiarai_4.mp3', text: 'ほんとうに 伝わっているのは、只見川の 沢に 小豆洗いが 出たと いう 言い伝え。記録に 残っているのは、只見川の 流れる、金山町の お話なの。' },
      ],
    },
    revealText: '小豆洗いの 弱点が 明かされた！ 只見川の せせらぎが よく効くように なった。',
    restoreLines: [
      '沢に、黒い もやが ほどけて 消えていく……',
      '小豆洗いは 背を 向け、また 静かに 小豆を 研ぎはじめた。',
    ],
    hosoku: '小豆洗いの 話は、只見川の 沢に 伝わる 言い伝え。記録に 残っているのは、只見川の 流れる 金山町の 話なの。姿を 見た 人は いなくて、聞こえるのは 小豆を 研ぐ 音だけ だったそうよ。',
    reward: '只見川の 沢の もやが 晴れた！ 只見の 人たちが 雪崩の 雪を 掘り出し、檜枝岐への 道が ひらけた！', // 10/9 本人「檜枝岐村には雪崩で通れない理由で」
    loseLines: ['旅の者たちは 力つきた……', '沢に、ザックザックと 小豆を 研ぐ 音が ひびいている……'],
  },
};
