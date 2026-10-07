// 第二十話 カッパのわび証文（3章 県中・県南・ボス・呑まれたカッパの大将）（本人 10/4「3章の製作に」）
// 話（うつくしま電子事典「カッパのわび証文」＝vault 調査ノートの9）：殿様 馬場八郎左衛門が碁の帰りに増水した釈迦堂川を馬で渡ると、馬が暴れて落馬。
// 馬のしっぽにぶら下がっていたカッパの大将を地べたに叩きつけて捕らえ、「人や馬にいたずらをしない」「大水を出して田畑を荒らさない」を石に証文として書かせて許した。
// 証文は丘に埋めて杉を植え、不開（あかず）神社と名づけた＝いまの赤津神社の由来。⚠頭の皿・きゅうりは この原典に無い
// ゲームでは、忘れられて黒いもやに呑まれたカッパの大将。弱点＝「石の証文」。⭐託善和尚（第十九話）を元に戻していると、証文が もっと効く（hint）
import { BASIC_ITEMS } from './basic_items.js?v=270';

export const KAPPA = {
  art: {
    dark: 'assets/kappa_dark.png', light: 'assets/kappa_light.png', bg: 'assets/bg_kappa.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['shomon'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    shomon: {
      name: '石の証文', cost: 9, power: 38, weakMult: 3, plainMult: 0.5,
      weakText: '殿様に 書かされた 石の 証文を 突きつけた！ カッパの 大将は 頭を かかえた！',
      plainText: 'カッパは 石を ちらりと 見て、知らん顔を した……',
    },
  },
  enemy: {
    id: 'kappa',
    name: 'カッパの大将',
    episode: '第二十話',
    tale: 'カッパのわび証文',
    place: '福島県天栄村',
    autoWinTarget: 0.86,
    // 強さ＝試算（node tests/_autotune.mjs <id>・着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/4）
    expectLv: 18,
    hp: 998, atk: 179, def: 138, agi: 13, // 10/4 夜 くノ一・僧の如意輪の経・鉄砲2倍で合わせ直した（_autotune・前 hp780 atk115） // 10/4 夜 通しの調整＝猟師の玉3発を持つ前提で合わせ直した（前 hp624 atk163） ⭐10/5 職業の旅＝代表の5組の平均で仮に合わせ直した（1章の技まで・2章3章の技は段階②③で合わせ直す） // 10/5 夜 段階②（2章の技が入った）で 5組の平均に合わせ直した（_autotune・前 atk157 必殺技87）
    bgm: 'kappa',
    weakness: 'shomon',
    // 託善和尚（第十九話・狸森）を元に戻していると、弱点の術が もっと効く（game.js の battleData）
    hint: { after: 'takuzen', mult: 1.25, text: '託善和尚さまが 言っていたわ。カッパの 大将は、石の 証文を いちばん こわがるって！' },
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: '釈迦堂川の 大水', chance: 0.25, power: 99, flash: [110, 170, 255], sfx: 'oomizu', cutin: 'assets/cutin/kappa_oomizu.png' },
    biteName: '水かきで ひっかく',
    introText: '釈迦堂川の 水面から、カッパの 大将が 顔を 出した。……一族を ひきつれ、黒い もやを まとっている！',
    tellLines: [
      'むかし、殿様 馬場八郎左衛門が 夜に 釈迦堂川を 馬で 渡ると、馬が あばれて 殿様は 落ちて しまったの。',
      '見ると、馬の しっぽに カッパの 大将が しがみついていた。殿様は カッパを つかまえて、二度と いたずらを しないと 石に 証文を 書かせたのよ。',
      '……その 石の 証文が、カッパの 弱みよ。',
    ],
    story: {
      tell: [
        { img: 'assets/story/kappa_1.png', voice: 'assets/story/kappa_1.mp3', text: 'むかし、殿様 馬場八郎左衛門は、川向こうの お寺の 和尚さんと 碁を 打つ 仲だったの。ある 秋の 夜、その 帰りに 水の ふえた 釈迦堂川を 馬で 渡ったのよ。' },
        { img: 'assets/story/kappa_2.png', voice: 'assets/story/kappa_2.mp3', text: '川の なかほどで 馬が あばれ、殿様は 落ちて しまった。見ると、馬の しっぽに カッパの 大将が しがみついていたの。殿様は カッパを つかまえ、石に わびの 証文を 書かせたわ。' },
        { img: 'assets/story/kappa_3.png', voice: 'assets/story/kappa_3.mp3', text: 'その 話も 忘れられて、カッパの 大将は 黒い もやに 呑まれて しまった……。思い出させて あげましょう。石の 証文を。' },
      ],
      after: [
        { img: 'assets/story/kappa_4.png', voice: 'assets/story/kappa_4.mp3', text: 'ほんとうの お話では、殿様は 証文を 丘に 埋めて 杉を 植え、開かずの 社と 名づけたの。春に カッパが 取り返しに 来たけれど、証文は 見つからなかった。それが いまの 天栄の 赤津神社の はじまりよ。' },
      ],
    },
    revealText: 'カッパの 弱点が 明かされた！ 石の証文が よく効くように なった。',
    restoreLines: [
      '黒い もやが、川の 流れに 運ばれていく……',
      'カッパの 大将は 手を ついて、ぺこりと 頭を さげた。',
    ],
    hosoku: 'ほんとうの お話では、カッパは 人や 馬に いたずらを しない、大水を 出さないと 約束して ゆるされたの。証文を 埋めた 丘の 社が、いまの 赤津神社の はじまりと 伝わっているわ。',
    reward: 'カッパの 一族が 道を あけ、南の 白河への もやが 晴れた！',
    loseLines: ['旅の者たちは 力つきた……', '釈迦堂川に、カッパの 笑い声が ひびいている……'],
  },
};
