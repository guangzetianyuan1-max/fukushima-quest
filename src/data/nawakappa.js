// 第二十七話 河童の恩返し（4章 会津・中ボス）
// 話（広報にしあいづ「にしあいづ物語100選 その2」＝vault 調査ノートの6）：縄沢村の喜四郎が渕で馬に水を飲ませていると、飼葉桶に赤ん坊のような河童がへばりつく。
// 打ち殺そうとする村人に、河童は「桶が欲しかっただけ。助けてくれれば村の水難をなくす」と頼み、渕へ帰される。村は水害に遭わなくなり、凶作の翌年には
// 神社の池に稲束が沈んでいて、その籾で大豊作に。種籾池は今も御稷神社の境内に残る。⚠3章の天栄のカッパ（大将と一族・約束させて許す）と姿も筋も分ける
// 弱点＝「飼葉桶」（河童が欲しかった物）
import { BASIC_ITEMS } from './basic_items.js?v=347';

export const NAWAKAPPA = {
  art: {
    // ⏳絵が 届くまで kappa の 絵を 借りる（10/6・本人が AI Studio で 描く＝福島昔話クエストRPG\Geminiプロンプト_4章会津.md）
    dark: 'assets/nawakappa_dark.png', light: 'assets/nawakappa_light.png', bg: 'assets/bg_nawakappa.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['kaibaoke'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    kaibaoke: {
      name: "飼葉桶", cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: "河童が ほしがった 飼葉桶を、そっと さしだした！ 河童の 手が とまった！",
      plainText: "桶は 渕の 渦に のまれた……",
    },
  },
  enemy: {
    id: 'nawakappa',
    name: "渕の河童",
    episode: "第二十七話",
    tale: "河童の恩返し",
    place: "福島県西会津町",
    autoWinTarget: 0.85, // 4章 会津の中ボス（10/6）
    // 強さ＝仮（10/6）。tests/_autotune.mjs で 代表の5組の平均を 目安に 合わせる
    expectLv: 23,
    hp: 1300, atk: 269, def: 175, agi: 14,
    bgm: 'nawakappa',
    weakness: 'kaibaoke',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: "底知れぬ 渕", kind: 'one', chance: 0.45, power: 139, flash: [70, 120, 200], sfx: 'fuchi', cutin: 'assets/cutin/nawakappa_fuchi.png' },
    biteName: "水かきで はたく",
    introText: "縄沢の 渕の 水が 黒く にごり、小さな 河童の 影が 山ほどに ふくれあがった！",
    tellLines: [
      "西会津の 縄沢の 渕には、底の 知れない 深みが あったの。",
      "喜四郎が 馬に 水を のませていると、飼葉桶に 赤ん坊のような 河童が しがみついていた。村人は 打ちころそうと したのよ。",
      "……でも 河童は「桶が ほしかっただけ。助けてくれれば 水難を なくします」と たのんだの。",
    ],
    story: {
      tell: [
        { img: 'assets/story/nawakappa_1.png', voice: 'assets/story/nawakappa_1.mp3', text: "西会津の 縄沢の 渕には、底の 知れない 深みが あったの。夕方、喜四郎が 岸に 飼葉桶を 置いて 馬に 水を のませていると、桶が ひっくりかえったのよ。" },
        { img: 'assets/story/nawakappa_2.png', voice: 'assets/story/nawakappa_2.mp3', text: "桶には 赤ん坊のような 河童が へばりついていた。「桶が ほしかっただけ。助けてくれれば、村の 水難を なくします」。村人は あわれに 思って、渕へ 帰したの。" },
        { img: 'assets/story/nawakappa_3.png', voice: 'assets/story/nawakappa_3.mp3', text: "その 話も 忘れられて、河童は 黒い もやに 呑まれて しまった……。あの 飼葉桶を 思い出させて あげましょう。" },
      ],
      after: [
        { img: 'assets/story/nawakappa_4.png', voice: 'assets/story/nawakappa_4.mp3', text: "ほんとうの お話では、それから 村は 水の わざわいに あわなくなったの。凶作の 翌年には 神社の 池に 稲束が 沈んでいて、その 籾を まくと 大豊作。河童が 種籾を めぐんでくれたと、村人は 感謝したと 伝わるわ。" },
      ],
    },
    revealText: "渕の河童の 弱点が 明かされた！ 飼葉桶が よく効くように なった。",
    restoreLines: [
      "渕の 水が、もとの 青さに すんでいく……",
      "小さな 河童は 水面から 顔を 出し、ぺこりと 頭を さげた。",
    ],
    hosoku: "ほんとうの お話では、それから 村は 水の わざわいに あわなくなったの。凶作の 翌年には 神社の 池に 稲束が 沈んでいて、その 籾を まくと 大豊作。河童が 種籾を めぐんでくれたと、村人は 感謝したと 伝わるわ。",
    reward: "渕の もやが 晴れ、東の 芹沼への 道が ひらけた！",
    loseLines: ['旅の者たちは 力つきた……', "渕の 水面に、小さな 渦が まわっている……"],
  },
};
