// 第二十三話 猫魔ヶ岳の化け猫（4章 会津・ボス）
// 話（磐梯山ジオパーク「猫石」・新編会津風土記＝vault 調査ノートの2）：猫魔ヶ岳には昔 猫又が棲み、山の名になった。魚を目当てに老女に化けた猫を桧原村の郷士が斬り、
// 山の主の猫王は仕返しに郷士の奥方を奪う。郷士は家の宝刀で猫王を討った。別の版＝弘法大師が法力で調伏した姿が猫石。慧日寺の僧がネズミ除けに猫王を祀ったとも
// ⭐「良い存在が呑まれる」形＝慧日寺が祀った山の主の猫王。⚠奥方の場面は見せない・宝刀や郷士の名は原典に無い＝出さない
// 弱点＝「郷士の宝刀」
import { BASIC_ITEMS } from './basic_items.js?v=239';

export const NEKOMA = {
  art: {
    // ⏳絵が 届くまで nekonaki の 絵を 借りる（10/6・本人が AI Studio で 描く＝福島昔話クエストRPG\Geminiプロンプト_4章会津.md）
    dark: 'assets/nekoma_dark.png', light: 'assets/nekoma_light.png', bg: 'assets/bg_nekoma.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['houtou'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    houtou: {
      name: "郷士の宝刀", cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: "桧原の 郷士が 猫王を 討った 宝刀の 話を 突きつけた！ 猫王が 身を すくめた！",
      plainText: "刀の 光は、猫の 目に 吸いこまれた……",
    },
  },
  enemy: {
    id: 'nekoma',
    name: "猫王",
    episode: "第二十三話",
    tale: "猫魔ヶ岳の化け猫",
    place: "福島県北塩原村",
    autoWinTarget: 0.83, // 4章 会津のボス（10/6）
    // 強さ＝仮（10/6）。tests/_autotune.mjs で 代表の5組の平均を 目安に 合わせる
    expectLv: 21,
    hp: 1150, atk: 217, def: 155, agi: 15,
    bgm: 'nekoma',
    weakness: 'houtou',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: "猫又の 爪", chance: 0.36, power: 113, flash: [255, 220, 120], sfx: 'nekotsume', cutin: 'assets/cutin/nekoma_tsume.png' },
    special2: { name: "魔性の 鳴き声", chance: 0.18, power: 54, stun: 1, flash: [200, 80, 255], sfx: 'mashou', cutin: 'assets/cutin/nekoma_nakigoe.png' },
    biteName: "大きな 前足で なぐる",
    introText: "猫魔ヶ岳の 大岩の 上に、山ほどの 猫の 影が 起きあがった。……黒い もやを まとい、目が 金に 光る！",
    tellLines: [
      "猫魔ヶ岳には むかし 猫又が すんでいて、それで 山の 名が ついたと 伝わるの。",
      "慧日寺の お坊さんたちは、ネズミを ふせいでもらおうと、山に 猫王を まつったとも いうわ。",
      "……桧原の 郷士は、家の 宝刀で 猫王を 討ったの。",
    ],
    story: {
      tell: [
        { img: 'assets/story/nekoma_1.png', voice: 'assets/story/nekoma_1.mp3', text: "猫魔ヶ岳の 頂の 大岩には、山の 主の 猫王が いたの。ふもとの 慧日寺の お坊さんたちは、ネズミから 寺を 守ってもらおうと、猫王を まつったとも 伝わるわ。" },
        { img: 'assets/story/nekoma_2.png', voice: 'assets/story/nekoma_2.mp3', text: "ある日、魚を ほしがって 老女に 化けた 猫を、桧原の 郷士が 斬って しまった。山の 主の 猫王は 怒って、郷士の 奥方を うばったの。" },
        { img: 'assets/story/nekoma_3.png', voice: 'assets/story/nekoma_3.mp3', text: "それから 長い 時が すぎ、話も 忘れられて、猫王は 黒い もやに 呑まれて しまった……。思い出させて あげましょう。" },
      ],
      after: [
        { img: 'assets/story/nekoma_4.png', voice: 'assets/story/nekoma_4.mp3', text: "ほんとうの お話では、郷士が 家の 宝刀で 猫王を 討ち、奥方の 仇を とったの。弘法大師が 法力で しずめた 姿が、山の 猫石だとも いわれる。猫石は いまも 雄国沼を 見下ろしているわ。" },
      ],
    },
    revealText: "猫王の 弱点が 明かされた！ 郷士の宝刀が よく効くように なった。",
    restoreLines: [
      "黒い もやが、山の 霧に まじって 晴れていく……",
      "大岩の 上で、猫王は 背を 丸め、静かに 目を 閉じた。",
    ],
    hosoku: "ほんとうの お話では、郷士が 家の 宝刀で 猫王を 討ち、奥方の 仇を とったの。弘法大師が 法力で しずめた 姿が、山の 猫石だとも いわれる。猫石は いまも 雄国沼を 見下ろしているわ。",
    reward: "猫魔ヶ岳の もやが 晴れ、西の 磐梯山への 道が ひらけた！",
    loseLines: ['旅の者たちは 力つきた……', "猫魔ヶ岳に、猫の 鳴き声が こだましている……"],
  },
};
