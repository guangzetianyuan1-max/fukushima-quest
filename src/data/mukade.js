// 第十一話 信夫山のムカデとオロチ（2章 県北・ボス・よみがえった悪役・2体同時）（本人 10/4「2体同時のボス」）
// 話（福島市信夫山情報サイト「その15 信夫山の二匹の妖怪」・江戸後期の古文書と書くが名は無し）：
// 信夫山の北の七曲り坂に大ムカデ、南の黒沼に大オロチ。どちらも「信夫山の主」を名乗った。
// 二匹は山の西の端の鴉が崎で出会い、たがいに傷つけ合って滅んだ。文久2年の山火事で、焼け残ったムカデの白骨が見つかった
// ゲームでは、忘れの力でよみがえった二匹。2体同時（twin＝毎ターン二匹とも動く）。
// 弱点＝「主の名乗り」（どちらが主かと問うと、二匹は にらみあって ぶつかる）。明かされたあとは ときどき二匹が かみつきあう（helper の作りを使う）
// 原典では人は関わらず相打ち＝紙芝居④で しおりが語る
// 絵＝まだ（仮に道中のムカデの絵）。二匹を1枚に描く。プロンプト＝art_src/Geminiプロンプト_2章県北.md
import { BASIC_ITEMS } from './basic_items.js?v=133';

export const MUKADE = {
  art: {
    dark: 'assets/mukade_dark.png', light: 'assets/mukade_light.png', bg: 'assets/bg_mukade.png', // 10/4 絵が届いた（nbslan・2匹を1枚に・挿絵2枚・背景 gkhahd＝信夫山の黒沼と赤い月）
    glowDark: 0xb090ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['nanori'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    nanori: {
      name: '主の名乗り', cost: 8, power: 30, weakMult: 3, plainMult: 0.5,
      weakText: '「信夫山の 主は、どっちだ！」――二匹は にらみあい、たがいに ぶつかった！',
      plainText: '問いかけは、二匹の 吠え声に かき消された……',
    },
  },
  enemy: {
    id: 'mukade',
    name: 'ムカデとオロチ',
    episode: '第十一話',
    tale: '信夫山のムカデとオロチ',
    place: '福島県福島市',
    autoWinTarget: 0.91,
    // 強さ＝試算（node tests/_autotune.mjs <id>・その話に着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/4）
    expectLv: 12,
    hp: 720, atk: 49, def: 92, agi: 11,
    bgm: 'mukade',
    weakness: 'nanori',
    // 2体同時（本人 10/4）：毎ターン 二匹とも動く。かみつく名前は 二匹それぞれ
    twin: { names: ['大ムカデ', '大オロチ'], bites: ['毒の あごで かみつく', '黒沼の 水で しめつける'] },
    // 明かされたあと、ときどき 二匹が かみつきあう（原典の相打ち）
    helper: {
      revealText: '大ムカデと 大オロチが、にらみあった……！ どちらも 信夫山の 主を ゆずらない。',
      chance: 0.3, dmg: 60,
      text: '大ムカデと 大オロチが、たがいに かみつきあった！',
    },
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: '七曲りの 毒', chance: 0.22, power: 27, flash: [170, 120, 255], sfx: 'doku', cutin: 'assets/cutin/mukade_doku.png' },
    special2: { name: '黒沼の 大水', chance: 0.14, power: 32, flash: [90, 140, 255], sfx: 'kuronuma', cutin: 'assets/cutin/mukade_oomizu.png' },
    biteName: 'かみつき',
    introText: '信夫山の 北の 坂から 大ムカデが、南の 黒沼から 大オロチが、同時に あらわれた！',
    tellLines: [
      'むかし、信夫山の 北の 坂には 大きな ムカデ、南の 黒沼には 大きな オロチが すんでいたの。',
      'どちらも 自分こそ「信夫山の 主」だと 名乗って、ゆずらなかったのよ。',
      'だから……どちらが 主かと 問えば、二匹は きっと ぶつかりあうわ。',
    ],
    story: {
      tell: [
        { img: 'assets/story/mukade_1.png', voice: 'assets/story/mukade_1.mp3', text: 'むかし、信夫山の 北の 坂には 大きな ムカデが すみ、畑を 荒らして「信夫山の 主」を 名乗っていたの。' },
        { img: 'assets/story/mukade_2.png', voice: 'assets/story/mukade_2.mp3', text: '南の 黒沼には 大きな オロチが すみ、こちらも「信夫山の 主」を 名乗っていたのよ。' },
        { img: 'assets/story/mukade_3.png', voice: 'assets/story/mukade_3.mp3', text: '忘れの 力で、その 二匹が よみがえって しまった……。二匹の 名乗りを、思い出させましょう。' },
      ],
      after: [
        { img: 'assets/story/mukade_4.png', voice: 'assets/story/mukade_4.mp3', text: 'ほんとうの お話では、二匹は 山の 西の はしで 出くわして、たがいに 傷つけあい、二匹とも ほろんだの。ずっと あとの 山火事で、焼け残った ムカデの 骨が 見つかったと 伝わるわ。' },
      ],
    },
    revealText: 'ムカデとオロチの 弱点が 明かされた！ 主の名乗りが よく効くように なった。',
    restoreLines: [
      '二匹は たがいに 傷つけあい、黒い もやと ともに 消えていった……',
    ],
    hosoku: 'ほんとうの お話では、人は 関わらず、二匹は たがいに 傷つけあって ほろんだの。山火事の あとに、ムカデの 骨が 見つかったと 伝わるのよ。',
    reward: '信夫山の 南の 道の もやが 晴れた！',
    loseLines: ['旅の者たちは 力つきた……', '信夫山に、二匹の 吠え声が ひびいている……'],
  },
};
