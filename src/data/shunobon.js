// 第二十五話 朱の盤（4章 会津・中ボス）
// 話（『老媼茶話』『諸国百物語』＝vault 調査ノートの4）：会津の諏訪の宮の近くに「朱の盤」が出ると噂があり、確かめに出た若侍が道連れの侍に正体を尋ねると、
// 振り向いた顔が朱に裂けていた。若侍は気を失い、逃げこんだ家の女房にも同じ顔を見せられ、百日寝込んで亡くなる。別の話（越後の旅人）では刀で斬ると消えた。
// ⭐朱の盤は倒されない＝紙芝居④で補う。⚠⚠諏方神社は今もある神社＝化け物の巣にしない（神社から離れた夜道に出す）。顔の細部は描かず朱の光で
// 弱点＝「旅人の刀」（越後の旅人の話で、斬ると消えた）
import { BASIC_ITEMS } from './basic_items.js?v=193';

export const SHUNOBON = {
  art: {
    // ⏳絵が 届くまで onibaba の 絵を 借りる（10/6・本人が AI Studio で 描く＝福島昔話クエストRPG\Geminiプロンプト_4章会津.md）
    dark: 'assets/shunobon_dark.png', light: 'assets/shunobon_light.png', bg: 'assets/bg_shunobon.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['tabikatana'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    tabikatana: {
      name: "旅人の刀", cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: "朱の盤を 斬ると 消えた という、旅人の 話の 刀を 抜いた！ 朱の 顔が ゆがんだ！",
      plainText: "刀は 夜の 闇を 斬るばかり……",
    },
  },
  enemy: {
    id: 'shunobon',
    name: "朱の盤",
    episode: "第二十五話",
    tale: "朱の盤",
    place: "福島県会津若松市",
    autoWinTarget: 0.85, // 4章 会津の中ボス（10/6）
    // 強さ＝仮（10/6）。tests/_autotune.mjs で 代表の5組の平均を 目安に 合わせる
    expectLv: 22,
    hp: 978, atk: 206, def: 165, agi: 14,
    bgm: 'shunobon',
    weakness: 'tabikatana',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: "朱の 顔", chance: 0.36, power: 75, stun: 1, flash: [255, 60, 40], sfx: 'shugao', cutin: 'assets/cutin/shunobon_kao.png' },
    special2: { name: "二度目の 顔", chance: 0.18, power: 115, flash: [255, 140, 90], sfx: 'nidome', cutin: 'assets/cutin/shunobon_nidome.png' },
    biteName: "針の 髪で 打つ",
    introText: "諏方神社から 離れた 夜道で、道連れの 侍が ふり向いた。……顔が 朱に 裂け、黒い もやを 吐いている！",
    tellLines: [
      "会津の 諏訪の 宮の あたりには、朱の盤と いう 化け物が 出ると いう うわさが あったの。",
      "たしかめに 出た 若侍が、道連れの 侍に「朱の盤とは どんな 物か」と たずねると、ふり向いた 顔が 朱に 裂けていた。",
      "……別の 話では、旅人が 刀で 斬ると、朱の盤は 消えたと いうわ。",
    ],
    story: {
      tell: [
        { img: 'assets/story/shunobon_1.png', voice: 'assets/story/shunobon_1.mp3', text: "会津の 諏訪の 宮の 参道には、夜祭りの 提灯が ならんでいたの。そのころ、宮から 離れた 夜道に 朱の盤と いう 化け物が 出ると、うわさが 立ったのよ。" },
        { img: 'assets/story/shunobon_2.png', voice: 'assets/story/shunobon_2.mp3', text: "夜ふけ、たしかめに 出た 若侍は、道連れの 侍に「朱の盤とは どんな 物か」と たずねた。ふり向いた 顔は、朱を 流したように 赤かったの。" },
        { img: 'assets/story/shunobon_3.png', voice: 'assets/story/shunobon_3.mp3', text: "その 話も 忘れられて、朱の盤は 黒い もやを まとって よみがえって しまった……。旅人の 刀を 思い出しましょう。" },
      ],
      after: [
        { img: 'assets/story/shunobon_4.png', voice: 'assets/story/shunobon_4.mp3', text: "ほんとうの お話では、朱の盤は 倒されていないの。若侍は 気を 失い、逃げこんだ 家の 女房にも 同じ 顔を 見せられて、百日 寝こんだと 伝わるわ。越後の 旅人の 話では、刀で 斬ると 消えたと いうの。" },
      ],
    },
    revealText: "朱の盤の 弱点が 明かされた！ 旅人の刀が よく効くように なった。",
    restoreLines: [
      "朱の 光が、夜明けの 色に まじって 消えていく……",
      "夜道には、ただ 杉の 影だけが 残った。",
    ],
    hosoku: "ほんとうの お話では、朱の盤は 倒されていないの。若侍は 気を 失い、逃げこんだ 家の 女房にも 同じ 顔を 見せられて、百日 寝こんだと 伝わるわ。越後の 旅人の 話では、刀で 斬ると 消えたと いうの。",
    reward: "夜道の もやが 晴れ、西の 柳津への 道が ひらけた！",
    loseLines: ['旅の者たちは 力つきた……', "夜道に、朱い 顔が うかんでいる……"],
  },
};
