// 第二十二話 亀姫（4章 会津・中ボス）（本人 10/6「次進めてください」）
// 話（『老媼茶話』巻3＝vault 調査ノートの1）：寛永17年、猪苗代城（亀ヶ城）の城代 堀部主膳の前に頭をそった子どもが現れ「城主（亀姫）に挨拶をせよ」と告げる。
// 主膳は取りあわず、城に怪しいことが続いて主膳は亡くなる。その夏、水をくむ7尺の大入道を城の武士が一刀で斬ると、大きな狢だった。以後 怪異はやんだ。
// ⭐亀姫は一度も姿を見せず、倒されない＝紙芝居④で補う。⚠城代の死の日数・場面は語らない
// ゲームでは、忘れられて黒いもやに呑まれた城の主の影。弱点＝「城侍の一刀」（狢＝大入道の正体を斬った刀）
import { BASIC_ITEMS } from './basic_items.js?v=251';

export const KAMEHIME = {
  art: {
    // ✅10/6 本人が AI Studio で 描いた（d1oqyb＝呑まれた姿・lye1wk＝元の姿・vrgfdw＝挿絵）。⏳背景は 届くまで 飴買い幽霊の 背景を 借りる
    dark: 'assets/kamehime_dark.png', light: 'assets/kamehime_light.png', bg: 'assets/bg_kamehime.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['ichito'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    ichito: {
      name: "城侍の一刀", cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: "城の 侍が 大入道を 斬った 一刀を 思い出し、まっすぐ 打ちこんだ！ 姫の 影が ゆらいだ！",
      plainText: "刀は もやを 斬るばかり……姫の 影には とどかない。",
    },
  },
  enemy: {
    id: 'kamehime',
    name: "亀姫",
    episode: "第二十二話",
    tale: "亀姫",
    place: "福島県猪苗代町",
    autoWinTarget: 0.85, // 4章 会津の中ボス（10/6）
    // 強さ＝仮（10/6）。tests/_autotune.mjs で 代表の5組の平均を 目安に 合わせる
    expectLv: 20,
    hp: 1050, atk: 225, def: 150, agi: 13,
    bgm: 'kamehime',
    weakness: 'ichito',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: "天守の 怪し火", chance: 0.36, power: 117, flash: [180, 120, 255], sfx: 'ayashibi', cutin: 'assets/cutin/kamehime_ayashibi.png' },
    biteName: "長い 袖で はらう",
    introText: "亀ヶ城の 石垣の 上に、十二単の 姫の 影が 立った。……黒い もやを まとい、こちらを 見下ろしている！",
    tellLines: [
      "むかし、猪苗代の 亀ヶ城には、姿を 見せない 城の 主が いると 伝わっていたの。亀姫と いう 名の 主よ。",
      "あるとき、城代の 前に 頭を そった 子どもが あらわれ、「城主に 挨拶を せよ」と 告げた。城代は とりあわなかったのよ。",
      "……城の 侍の 一刀が、怪しい ものの 正体を 斬ったと 伝わるわ。",
    ],
    story: {
      tell: [
        { img: 'assets/story/kamehime_1.png', voice: 'assets/story/kamehime_1.mp3', text: "むかし、猪苗代の 亀ヶ城には、姿を 見せない 城の 主が いると 伝わっていたの。姫路の おさかべ姫と ならぶ、亀姫と いう 名の 主よ。" },
        { img: 'assets/story/kamehime_2.png', voice: 'assets/story/kamehime_2.mp3', text: "あるとき、城代の 前に 頭を そった 子どもが あらわれ、「まだ 城主に 挨拶を していない」と 告げた。城代は「この 城の 主は わが 殿だ」と とりあわなかったの。" },
        { img: 'assets/story/kamehime_3.png', voice: 'assets/story/kamehime_3.mp3', text: "それから 城では 怪しい ことが つづいた。いまは 話も 忘れられ、亀姫は 黒い もやに 呑まれて しまった……。思い出させて あげましょう。" },
      ],
      after: [
        { img: 'assets/story/kamehime_4.png', voice: 'assets/story/kamehime_4.mp3', text: "ほんとうの お話では、亀姫は 一度も 姿を 見せず、斬られても いないの。その 夏、田の そばで 水を くむ 大入道を 城の 侍が 一刀で 斬ると、正体は 大きな 狢だった。それから 城の 怪しい ことは やんだと 伝わるわ。" },
      ],
    },
    revealText: "亀姫の 弱点が 明かされた！ 城侍の一刀が よく効くように なった。",
    restoreLines: [
      "黒い もやが、湖の 風に ほどけていく……",
      "石垣の 上の 姫の 影は、静かに 頭を さげて 消えた。",
    ],
    hosoku: "ほんとうの お話では、亀姫は 一度も 姿を 見せず、斬られても いないの。その 夏、田の そばで 水を くむ 大入道を 城の 侍が 一刀で 斬ると、正体は 大きな 狢だった。それから 城の 怪しい ことは やんだと 伝わるわ。",
    reward: "亀ヶ城の もやが 晴れ、北の 猫魔ヶ岳への 道が ひらけた！",
    loseLines: ['旅の者たちは 力つきた……', "亀ヶ城に、だれかの 笑い声が ひびいている……"],
  },
};
