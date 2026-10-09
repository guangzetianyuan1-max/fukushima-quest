// 第三十一話（10/9 繰り下げ・前＝第三十話） 駒ヶ岳の落人の家来（終章 南会津・10/8 本人「駒ヶ岳の花は駒ヶ岳に行き、平家の落人の家来と戦い、勝てばもらえる」）
// ⚠家来の 話は ゲームの 作り（言い伝えは 無い）＝紙芝居④で「このゲームの語り」と 言う。伝わるのは 檜枝岐に 平家の 落人が 住みついたと いう 言い伝え
// 確かめた事（10/8）：会津駒ヶ岳の 山頂 近くに 湿原と 池塘・駒ノ大池は 空や 山頂を 映す・ハクサンコザクラ や チングルマ が 咲く（福島県 尾瀬の コラム）
//   ⛔山の 名の 由来（残雪の 馬の 形）は 原典を 確かめきれていない＝言わない
// 弱点＝駒ノ大池の 水鏡・勝つと「駒ヶ岳の花」（rally.js の RELICS.onsen）
import { BASIC_ITEMS } from './basic_items.js?v=354';

export const OCHIKERAI = {
  art: {
    // 10/8 夜 本人が Gemini で 描いた（y9qmtd・dv3yjj・t1wkmp＝art_src/sets_api.json の ochikerai）
    dark: 'assets/ochikerai_dark.png', light: 'assets/ochikerai_light.png', bg: 'assets/bg_ochikerai.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['mizukagami'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    mizukagami: {
      name: '駒ノ大池の 水鏡', cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: '駒ノ大池の 水面に、空と 山の 頂が 映った！ 家来は、遠い 故郷の 空を 思い出した！',
      plainText: '水鏡は、黒い もやに 曇った……',
    },
  },
  enemy: {
    id: 'ochikerai',
    name: '落人の 家来',
    episode: '第三十一話', // 10/9 小豆洗い（第三十話）を 足して 繰り下げ
    tale: '駒ヶ岳の落人の家来',
    place: '福島県檜枝岐村',
    autoWinTarget: 0.8, // 終章の 中ボス（ばんばと 同じ 手当て・10/8）
    expectLv: 27,
    hp: 1100, atk: 415, def: 160, agi: 16,
    bgm: 'ochikerai',
    weakness: 'mizukagami',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: '雪崩 落とし', kind: 'all', chance: 0.22, power: 148, flash: [230, 240, 255], sfx: 'nadare', cutin: 'assets/cutin/ochikerai_nadare.png' },
    special2: { name: '太刀の 一閃', kind: 'one', chance: 0.14, power: 166, flash: [255, 255, 255], sfx: 'issen', cutin: 'assets/cutin/ochikerai_issen.png' },
    biteName: '太刀で 斬りつける',
    introText: '駒ノ大池の ほとりの 雪の 中から、古い 鎧の 武者が 立ちあがった！ 「この 花には、指一本 ふれさせぬ……！」',
    tellLines: [
      '会津駒ヶ岳の 頂の 近くには、湿原と 駒ノ大池が あるの。',
      '夏には ハクサンコザクラや チングルマが 咲いて、池の 水面は 空と 山を 映すのよ。',
      '……この 家来は、その 花を ずっと 守ってきたみたい。水鏡を 見せて あげましょう。',
    ],
    story: {
      tell: [
        { img: 'assets/story/ochikerai_1.png', voice: 'assets/story/ochikerai_1.mp3', text: '檜枝岐には、むかし 平家の 落人が 山を こえて 住みついたと 伝わるの。会津駒ヶ岳の 頂の 近くには、空を 映す 駒ノ大池と、花の 咲く 湿原が あるわ。' },
        { img: 'assets/story/ochikerai_2.png', voice: 'assets/story/ochikerai_2.mp3', text: '落人の 家来の ひとりが、主の ために 山の 花を 摘みに 登ったの。家来は 花畑を 守り、主の もとへ 花を とどける 日を 待っていた。' },
        { img: 'assets/story/ochikerai_3.png', voice: 'assets/story/ochikerai_3.mp3', text: 'けれど 山を こえて 流れてきた 黒い もやが、家来を 呑みこんで しまった……。思い出させて あげましょう。駒ノ大池の 水鏡を。' },
      ],
      after: [
        { img: 'assets/story/ochikerai_4.png', voice: 'assets/story/ochikerai_4.mp3', text: '家来の 話は、このゲームの 語りなの。ほんとうに 伝わっているのは、檜枝岐に 平家の 落人が 住みついたと いう 言い伝え。駒ヶ岳の 湿原には、いまも 夏に たくさんの 花が 咲くわ。' },
      ],
    },
    revealText: '落人の 家来の 弱点が 明かされた！ 駒ノ大池の 水鏡が よく効くように なった。',
    restoreLines: [
      '湿原に、黒い もやが ほどけて 消えていく……',
      '家来は 太刀を おさめ、雪の 上に 小さな 花束を 置いた。',
    ],
    hosoku: '家来の 話は、このゲームの 語りなの。ほんとうに 伝わっているのは、檜枝岐に 平家の 落人が 住みついたと いう 言い伝え。駒ヶ岳の 湿原には、いまも 夏に たくさんの 花が 咲くわ。',
    reward: '駒ヶ岳の もやが 晴れた！ 家来が「駒ヶ岳の花」を そっと 差し出した。',
    loseLines: ['旅の者たちは 力つきた……', '駒ノ大池に、雪が 静かに 降りつもる……'],
  },
};
