// 第十八話 天狗のいけにえ（3章 県中・県南・ボス・原典では姿を見せない天狗）（本人 10/4「3章の製作に」）
// 話（うつくしま電子事典「天狗のいけにえ」＝vault 調査ノートの8）：鮫川村の山奥の湯「上ノ湯」に、体の弱い男の子と母が湯治に来る。
// 湯が止まり「十一の男の子を天狗様にいけにえに出せば湯が戻る」と言われる。夜明け、母がうとうとした間に子は消え、湯はまた湧いた。母は「十一、十一」と叫び続けて鳥になった
// ⭐原典では天狗は姿も見せず、戦わず、子は戻らない（10/4 の決まり＝原典で倒されない相手も戦う）＝勝った後の紙芝居④で しおりが「昔話では戻らなかった」と語る
// ゲームでは、忘れられて黒いもやに呑まれ、湯を止めた天狗。弱点＝母の呼び声「十一」
import { BASIC_ITEMS } from './basic_items.js?v=177';

export const TENGU = {
  art: {
    dark: 'assets/tengu_dark.png', light: 'assets/tengu_light.png', bg: 'assets/bg_tengu.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['juichi'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    juichi: {
      name: '母の呼び声', cost: 9, power: 37, weakMult: 3, plainMult: 0.5,
      weakText: '「十一、十一……」母の 呼ぶ 声が 山に ひびき、天狗の 羽うちわが 止まった！',
      plainText: '呼ぶ 声は、谷の 風に かき消された……',
    },
  },
  enemy: {
    id: 'tengu',
    name: '鮫川の天狗',
    episode: '第十八話',
    tale: '天狗のいけにえ',
    place: '福島県鮫川村',
    autoWinTarget: 0.86,
    // 強さ＝試算（node tests/_autotune.mjs <id>・着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/4）
    expectLv: 17,
    hp: 901, atk: 158, def: 132, agi: 14, // 10/4 夜 くノ一・僧の如意輪の経・鉄砲2倍で合わせ直した（_autotune・前 hp800 atk113） // 10/4 夜 通しの調整＝猟師の玉3発を持つ前提で合わせ直した（前 hp563 atk166） ⭐10/5 職業の旅＝代表の5組の平均で仮に合わせ直した（1章の技まで・2章3章の技は段階②③で合わせ直す）
    bgm: 'tengu',
    weakness: 'juichi',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: '天狗の 羽うちわ', chance: 0.25, power: 86, flash: [200, 230, 255], sfx: 'hauchiwa', cutin: 'assets/cutin/tengu_uchiwa.png' },
    biteName: '高下駄で 蹴りつける',
    introText: '一枚岩の 橋の 上に、羽うちわを 持った 天狗が 舞いおりた。……黒い もやが、谷を おおっていく！',
    tellLines: [
      'むかし、鮫川の 山奥の 湯に、体の 弱い 男の子と お母さんが 湯治に 来ていたの。',
      'ある日 湯が 止まって、「十一の 男の子を 天狗様に さしだせ」と 言われたのよ。夜明けに、男の子は 消えて しまった。',
      'お母さんは「十一、十一」と 呼びつづけたの。……その 呼び声が、天狗の 弱みよ。',
    ],
    story: {
      tell: [
        { img: 'assets/story/tengu_1.png', voice: 'assets/story/tengu_1.mp3', text: 'むかし、鮫川の 山奥の 湯に、体の 弱い 男の子と お母さんが 湯治に 来ていたの。湯の おかげで、男の子は 元気に なっていったわ。' },
        { img: 'assets/story/tengu_2.png', voice: 'assets/story/tengu_2.mp3', text: 'ある日、湯が 止まって しまったの。「十一に なる 男の子を 天狗様に さしだせば、湯は 戻る」……村で 十一の 男の子は、その子 だけだったのよ。' },
        { img: 'assets/story/tengu_3.png', voice: 'assets/story/tengu_3.mp3', text: '夜明け、お母さんが うとうとした 間に、男の子は 消えて しまった。……忘れの 力で、天狗が 黒い もやを まとって あらわれたの。お母さんの 呼び声を 届けましょう。' },
      ],
      after: [
        { img: 'assets/story/tengu_4.png', voice: 'assets/story/tengu_4.mp3', text: 'ほんとうの お話では、天狗は 姿を 見せず、男の子は 戻らなかったの。お母さんは「十一、十一」と 呼びつづけて 鳥に なり、いまも 春に なると そう 鳴くと いうわ。鮫川の 上流には、天狗橋という 一枚岩の 橋が あるのよ。' },
      ],
    },
    revealText: '天狗の 弱点が 明かされた！ 母の呼び声が よく効くように なった。',
    restoreLines: [
      '黒い もやが、谷の 朝霧に とけていく……',
      '天狗は 羽うちわを おさめ、山の 奥へ 飛び去った。岩の 口から、湯が また 湧きだした。',
    ],
    hosoku: 'ほんとうの お話では、男の子は 戻らなかったの。お母さんは 鳥に なって、春に なると「十一」と 鳴くと 伝わっているわ。',
    reward: '湯が 戻り、西の 須賀川への もやが 晴れた！',
    loseLines: ['旅の者たちは 力つきた……', '谷に、天狗の 羽音が ひびいている……'],
  },
};
