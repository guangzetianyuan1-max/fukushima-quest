// 第八話 虎捕山の白狼（1章 相馬・章ボス 凶賊 橘墨虎・よみがえった悪役）（本人 10/3「4話分進めて」）
// 話（福島県の観光の頁・山津見神社の言い伝えで確かめた所だけ）：平安時代、凶賊 橘墨虎を討とうとした源頼義は、山に隠れた墨虎を
// 白狼の足跡に導かれて捕らえた。それで「虎捕山」と名付けられた。山津見神社は山の神 大山津見神を祀り、ふもとの拝殿に白狼の像、
// 天井に復元された242枚の狼の天井絵がある
// ゲームでは、忘れの力でよみがえった墨虎。語って弱点が明かされるまでは岩穴の闇に隠れて、たたかう・鉄砲の半分がとどかない（hide）。
// 明かされると白狼が現れて足跡で隠れ家を暴き、ときどき墨虎に とびかかる（helper）。弱点＝「白狼の足跡」
// 絵＝10/3 届いた（pbl37p 墨虎・2uh591 捕らえられた姿＝肌が緑に描かれたので prep_art で人の肌へ・9mqri4 闇討ち・achnd8 火矢の雨）。背景も届いた。プロンプト＝art_src/Geminiプロンプト_1章相馬.md
import { BASIC_ITEMS } from './basic_items.js?v=305';

export const SUMITORA = {
  art: {
    dark: 'assets/sumitora_dark.png', light: 'assets/sumitora_light.png', bg: 'assets/bg_sumitora.png', // 10/3 絵と背景が届いた
    glowDark: 0x9fb4ff, glowLight: 0xe8ecf4, // 山の月明かり → 白狼の白
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['ashiato'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    ashiato: {
      name: '白狼の足跡', cost: 7, power: 24, weakMult: 3, plainMult: 0.5,
      verb: '白狼の 足跡を たどって 斬りこんだ',
      weakText: '足跡の 先、岩穴の 奥の 墨虎に とどいた！',
      plainText: '足跡は 闇の 中で 途切れた……',
    },
  },
  enemy: {
    id: 'sumitora',
    name: '凶賊 橘墨虎',
    episode: '第八話',
    tale: '虎捕山の白狼',
    place: '福島県飯舘村',
    autoWinTarget: 0.95, // 10/6 0.92→0.95＝守りの技の無い組（1章は1つ目の技だけ）が 0.73 だった // 章の最後のボスは少し手ごわく（序章の龍燈と同じ考え）
    expectLv: 9,
    // 強さ＝試算（node tests/_tune.mjs '{}' <id>・その話に着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/3）
    // 10/3 装備を1段強くした（本人「武器や防具、道具も強く」）ので体力 420→520・攻 72→76（試算 自動0.91）
    hp: 598, atk: 88, def: 76, agi: 12, // 10/4 夜 通しの調整＝猟師の玉3発を持つ前提で合わせ直した（前 hp520 atk76） ⭐10/5 職業の旅＝代表の5組（tests/_party.js の COMPS）の平均で合わせ直した（tests/_autotune.mjs）
    bgm: 'sumitora', // 話ごとの戦いの曲（本人 10/3「1章の4話はBGMも全て変えて」・chip.js）
    weakness: 'ashiato',
    mist: { min: 1, max: 3, rise: 0.2 },
    hide: { chance: 0.5, text: '墨虎は 岩穴の 闇に 身を 隠した！ とどかない！' },
    helper: {
      name: '白狼',
      revealText: '白い 狼が あらわれた！ 足跡を たどり、墨虎の 隠れる 岩穴へ 導いてくれる！',
      chance: 0.35, dmg: 26,
      text: '白狼が 墨虎に とびかかった！',
    },
    special: { name: '闇討ち', kind: 'one', chance: 0.25, power: 30, flash: [60, 40, 80], sfx: 'yamiuchi', cutin: 'assets/cutin/sumitora_yamiuchi.png' },
    special2: { name: '火矢の雨', chance: 0.12, power: 41, flash: [255, 120, 40], sfx: 'hiya', cutin: 'assets/cutin/sumitora_hiya.png' },
    biteName: '山刀',
    introText: '岩穴の 闇から、凶賊 橘墨虎が すがたを あらわした……！',
    tellLines: [
      '平安の むかし、この 山に 橘墨虎という 凶賊が いたの。',
      '源頼義が 墨虎を 討とうと すると、墨虎は 山の 奥に 隠れてしまった。',
      'そのとき、白い 狼が あらわれて、足跡で 墨虎の 隠れ家へ 導いたと 伝わるの。',
    ],
    // 紙芝居（本人 10/2「次回以降全て」）＝影絵4枚＋しおりの声4束。台本とプロンプト＝art_src/紙芝居_1章相馬.md。絵と声が届くまでは文字だけで流れる
    story: {
      tell: [
        { img: 'assets/story/sumitora_1.png', voice: 'assets/story/sumitora_1.mp3', text: 'むかし、平安の ころ。この 山に、橘墨虎という 凶賊が いて、人々を 苦しめていたの。' },
        { img: 'assets/story/sumitora_2.png', voice: 'assets/story/sumitora_2.mp3', text: '源頼義が 墨虎を 討とうと すると、墨虎は 山の 奥に 隠れて しまった。どこを さがしても、見つからないの。' },
        { img: 'assets/story/sumitora_3.png', voice: 'assets/story/sumitora_3.mp3', text: 'そのとき、白い 狼が あらわれて、足跡で 隠れ家へ 導いたと 伝わるわ。……忘れの 力で、墨虎が よみがえったの。白狼を 信じましょう。' },
      ],
      after: [
        { img: 'assets/story/sumitora_4.png', voice: 'assets/story/sumitora_4.mp3', text: 'ほんとうの お話では、頼義は 白狼に 導かれて、墨虎を 捕らえたの。それで この 山は「虎捕山」。山津見神社には いまも、白い 狼の 像と、242枚の 狼の 天井絵が あるのよ。' },
      ],
    },
    revealText: '橘墨虎の 弱点が 明かされた！ 白狼の足跡が よく効くように なった。',
    restoreLines: [
      '墨虎は ついに 捕らえられた！',
      '白狼は、山の 奥へ 静かに 帰っていった……',
    ],
    hosoku: 'ほんとうの お話では、源頼義が 白狼に 導かれて 墨虎を 捕らえたの。だから この山は「虎捕山」と よばれ、山津見神社には いまも 白い 狼の 像と、242枚の 狼の 天井絵が あるのよ。',
    reward: '1章「相馬」の 昔話を 取りもどした！',
    loseLines: ['旅の者たちは 力つきた……', '虎捕山の 闇の 奥で、墨虎の 笑い声が ひびいた……'],
  },
};
