// 第二十四話 磐梯山の手長足長（4章 会津・ボス・2体同時）
// 話（ローカリティ！・休暇村裏磐梯・磐梯山ジオパーク＝vault 調査ノートの3）：昔「病悩山」と呼ばれた磐梯山の頂に、足の長い夫と手の長い妻が住む。
// 足長は峰をまたいで雲を集め、手長は猪苗代湖の水をまき散らし、会津に日が差さず作物が取れない。旅の僧が二人を小さくして器に封じ、山頂に埋める。
// 二人は磐梯明神として祀られ、病悩山は磐梯山と改められた。僧は弘法大師と伝わる。⚠器は「壺」とも「鉄鉢」とも＝ゲームは旅の僧が持つ「鉄鉢」
// 2体同時（twin）。弱点＝「旅の僧の鉄鉢」。⭐弘法大師が出る3話のうち、会うのは この1話だけ（ほかは語りで）
import { BASIC_ITEMS } from './basic_items.js?v=278';

export const ASHINAGA = {
  art: {
    // ⏳絵が 届くまで tenaga の 絵を 借りる（10/6・本人が AI Studio で 描く＝福島昔話クエストRPG\Geminiプロンプト_4章会津.md）
    dark: 'assets/ashinaga_dark.png', light: 'assets/ashinaga_light.png', bg: 'assets/bg_ashinaga.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['teppatsu'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    teppatsu: {
      name: "旅の僧の鉄鉢", cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: "旅の お坊さんが 二人を 封じた 小さな 鉄鉢を かかげた！ 手長足長の 体が ちぢんでいく！",
      plainText: "鉄鉢は 雲の 中で かすかに 鳴った……",
    },
  },
  enemy: {
    id: 'ashinaga',
    name: "手長足長",
    episode: "第二十四話",
    tale: "磐梯山の手長足長",
    place: "福島県磐梯町",
    autoWinTarget: 0.83, // 4章 会津のボス（10/6）
    // 強さ＝仮（10/6）。tests/_autotune.mjs で 代表の5組の平均を 目安に 合わせる
    expectLv: 21,
    hp: 904, atk: 117, def: 150, agi: 12,
    bgm: 'ashinaga',
    weakness: 'teppatsu',
    mist: { min: 1, max: 3, rise: 0.2 },
    twin: { names: ["足長", "手長"], bites: ["長い 足で ふみつける", "長い 手で 湖の 水を あびせる"] },
    special: { name: "雲を 集める", chance: 0.28, power: 85, flash: [160, 170, 190], sfx: 'kumoatsume', cutin: 'assets/cutin/ashinaga_kumo.png' },
    special2: { name: "湖の 水まき", chance: 0.12, power: 102, flash: [90, 160, 255], sfx: 'mizumaki', cutin: 'assets/cutin/ashinaga_mizu.png' },
    biteName: "長い 足で ふみつける",
    introText: "磐梯山の 頂に、峰を またぐ 足長と、湖へ 手を のばす 手長が あらわれた。……二人とも 黒い もやを まとっている！",
    tellLines: [
      "磐梯山は むかし「病悩山」と よばれていたの。頂に、足の 長い 夫と 手の 長い 妻、手長足長が すんでいたのよ。",
      "足長は 雲を 集め、手長は 猪苗代湖の 水を まいて、会津には 日が 差さなかった。",
      "……旅の お坊さんが、二人を 小さくして 鉄鉢に 封じたと 伝わるの。",
    ],
    story: {
      tell: [
        { img: 'assets/story/ashinaga_1.png', voice: 'assets/story/ashinaga_1.mp3', text: "磐梯山の 頂に、足の 長い 夫と 手の 長い 妻、手長足長が すんでいたの。会津の 田と 里を 見下ろす、山の 神さまのような 二人だったわ。" },
        { img: 'assets/story/ashinaga_2.png', voice: 'assets/story/ashinaga_2.mp3', text: "足長は 峰を またいで 雲を 集め、手長は 猪苗代湖の 水を すくって まいた。会津は いつも 雲と 霧に つつまれ、作物が 実らなくなったの。" },
        { img: 'assets/story/ashinaga_3.png', voice: 'assets/story/ashinaga_3.mp3', text: "その 話も 忘れられて、二人は 黒い もやに 呑まれて しまった……。思い出させて あげましょう。旅の お坊さんの 鉄鉢を。" },
      ],
      after: [
        { img: 'assets/story/ashinaga_4.png', voice: 'assets/story/ashinaga_4.mp3', text: "ほんとうの お話では、通りかかった 旅の お坊さんが 二人を 小さくして 器に 封じ、頂に 埋めたの。二人は 磐梯明神として まつられ、病悩山は 磐梯山と あらためられた。お坊さんは 弘法大師だったと 伝わるわ。" },
      ],
    },
    revealText: "手長足長の 弱点が 明かされた！ 旅の僧の鉄鉢が よく効くように なった。",
    restoreLines: [
      "雲が 割れ、猪苗代湖に 日が 差した……",
      "手長と 足長は 頂に 腰を おろし、里を 見守るように 目を 細めた。",
    ],
    hosoku: "ほんとうの お話では、通りかかった 旅の お坊さんが 二人を 小さくして 器に 封じ、頂に 埋めたの。二人は 磐梯明神として まつられ、病悩山は 磐梯山と あらためられた。お坊さんは 弘法大師だったと 伝わるわ。",
    reward: "磐梯山の もやが 晴れ、南の 会津若松への 道が ひらけた！",
    loseLines: ['旅の者たちは 力つきた……', "磐梯山は、雲に つつまれた ままだ……"],
  },
};
