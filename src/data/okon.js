// 第二十八話 母子狐の仇討ち（4章 会津・中ボス・3匹同時＋助っ人）
// 話（広報にしあいづ「その16」＝vault 調査ノートの7）：天保のころ、性悪の古狐 猪鼻与吉は手下の森之進・太郎丸と組み、花見の夜に正直者の狐 根々兵衛を酔いつぶして命を奪う。
// 妻の おこんは双子を産み育て、子が15のとき稲荷大明神に願をかけ、白狐慶信に弟子入りして咬み合いを習う。芹沼の3匹に挑み、稲荷大明神の加護で仇を討つ。
// ⭐悪狐を討ったのは おこん母子＝ゲームでは おこん母子が助っ人として一緒に戦い、紙芝居④で補う。⚠殺す場面は見せない（酔いつぶれるまで）・仇討ちを煽らない
// 3匹同時（twin）。弱点＝「稲荷大明神の加護」
import { BASIC_ITEMS } from './basic_items.js?v=232';

export const OKON = {
  art: {
    // ⏳絵が 届くまで gobou の 絵を 借りる（10/6・本人が AI Studio で 描く＝福島昔話クエストRPG\Geminiプロンプト_4章会津.md）
    dark: 'assets/okon_dark.png', light: 'assets/okon_light.png', bg: 'assets/bg_okon.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['inari'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    inari: {
      name: "稲荷大明神の加護", cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: "稲荷大明神の 加護を ねがった！ 空に 銀の 光が 差し、悪狐たちが ひるんだ！",
      plainText: "願いの 声は、狐の 笑いに かき消された……",
    },
  },
  enemy: {
    id: 'okon',
    name: "三匹の悪狐",
    episode: "第二十八話",
    tale: "母子狐の仇討ち",
    place: "福島県西会津町",
    autoWinTarget: 0.85, // 4章 会津の中ボス（10/6）
    // 強さ＝仮（10/6）。tests/_autotune.mjs で 代表の5組の平均を 目安に 合わせる
    expectLv: 23,
    hp: 1148, atk: 51, def: 160, agi: 16,
    bgm: 'okon',
    weakness: 'inari',
    mist: { min: 1, max: 3, rise: 0.2 },
    twin: { names: ["猪鼻与吉", "森之進", "太郎丸"], bites: ["牙で かみつく", "爪で ひっかく", "尾で はらう"] },
    helper: { name: "おこん母子", image: "assets/okon_haha.png", revealText: "おこんと 双子の 子狐が あらわれた！ 白狐慶信に ならった 咬み合いの 技で、いっしょに 戦ってくれる！", chance: 0.35, dmg: 70, text: "おこん母子が 悪狐に とびかかった！" },
    special: { name: "酒の まどわし", chance: 0.18, power: 34, stun: 1, flash: [255, 200, 150], sfx: 'sakemado', cutin: 'assets/cutin/okon_sake.png' },
    special2: { name: "三匹の 咬みつき", chance: 0.14, power: 60, flash: [220, 120, 60], sfx: 'mitsukami', cutin: 'assets/cutin/okon_kamitsuki.png' },
    biteName: "牙で かみつく",
    introText: "越後街道の 芹沼の 野に、三匹の 悪狐が 目だけを 光らせて あらわれた！",
    tellLines: [
      "天保の ころ、芝草村に 正直者の 狐 根々兵衛と、妻の おこんが すんでいたの。",
      "性悪の 古狐 猪鼻与吉は、手下と くんで 根々兵衛を 酔いつぶし、命を うばったのよ。",
      "……おこんは 双子を 育て、稲荷大明神の 加護を ねがったの。",
    ],
    story: {
      tell: [
        { img: 'assets/story/okon_1.png', voice: 'assets/story/okon_1.mp3', text: "天保の ころ、西会津の 芝草村に、正直者の 狐 根々兵衛と、器量よしの 妻 おこんが 寄りそって くらしていたの。" },
        { img: 'assets/story/okon_2.png', voice: 'assets/story/okon_2.mp3', text: "性悪の 古狐 猪鼻与吉は、手下の 二匹と くんで、花見の 夜に 根々兵衛を 酔いつぶし、命を うばって しまったのよ。" },
        { img: 'assets/story/okon_3.png', voice: 'assets/story/okon_3.mp3', text: "その 話も 忘れられて、三匹の 悪狐は 黒い もやを まとって よみがえった……。おこん母子と いっしょに、稲荷大明神の 加護を ねがいましょう。" },
      ],
      after: [
        { img: 'assets/story/okon_4.png', voice: 'assets/story/okon_4.mp3', text: "ほんとうの お話では、悪狐を 討ったのは おこん母子なの。双子が 十五に なったとき、白狐慶信に 弟子入りして 咬み合いを ならい、稲荷大明神の 加護を 受けて 仇を 討った。いまは 稲荷の 御社に 住んでいると 伝わるわ。" },
      ],
    },
    revealText: "三匹の悪狐の 弱点が 明かされた！ 稲荷大明神の加護が よく効くように なった。",
    restoreLines: [
      "悪狐たちの もやが、夜明けの 野に 散っていく……",
      "おこん母子は 並んで すわり、稲荷の 社の ほうへ 歩いていった。",
    ],
    hosoku: "ほんとうの お話では、悪狐を 討ったのは おこん母子なの。双子が 十五に なったとき、白狐慶信に 弟子入りして 咬み合いを ならい、稲荷大明神の 加護を 受けて 仇を 討った。いまは 稲荷の 御社に 住んでいると 伝わるわ。",
    reward: "芹沼の もやが 晴れ、南の 金山への 道が ひらけた！",
    loseLines: ['旅の者たちは 力つきた……', "芹沼の 野に、狐の 笑い声が ひびいている……"],
  },
};
