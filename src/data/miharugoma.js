// 第十五話 三春駒（3章 県中・県南・中ボス・呑まれた木の馬の群れ）（本人 10/4「戦わない3話を戦う形で作成しなおして」「道上ではなく、もやで」）
// 話（うつくしま電子事典「三春駒」＝vault 調査ノートの1）：坂上田村麻呂が京を発つとき、りっぱな寺のお坊さんから木彫りの馬百頭の箱を贈られる。
// 大滝根山の大多鬼丸との戦で押されたとき、どこからか百頭の馬が駆けこんで勝たせ、消えた。箱の木馬は どれも汗でぬれていた。村人が偲んで彫ったのが三春駒
// ⚠原典には寺の名も僧の名も無い（清水寺・延鎮は工房の由来書き）＝「りっぱな お寺の お坊さま」。⚠田村麻呂がこの地へ来た文献は無い（田村市）＝伝説として語る
// ゲームでは、忘れられて黒いもやに呑まれ、三春の野を暴れまわる木の馬の群れ。弱点＝「お坊さまの木箱」（馬たちの帰る所）。勝つと三春駒の術（大多鬼丸の弱点）を授かり、大滝根山への もやが晴れる
import { BASIC_ITEMS } from './basic_items.js?v=298';

export const MIHARUGOMA = {
  art: {
    dark: 'assets/miharugoma_dark.png', light: 'assets/miharugoma_light.png', bg: 'assets/bg_miharugoma.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['kibako'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    kibako: {
      name: 'お坊さまの木箱', cost: 8, power: 34, weakMult: 3, plainMult: 0.5,
      weakText: 'お坊さまの 木箱の ふたを 開けた！ 馬たちは 足を 止め、箱の ほうを ふりかえった！',
      plainText: '馬たちは 箱に 目も くれず、駆けぬけていった……',
    },
  },
  enemy: {
    id: 'miharugoma',
    name: '百頭の木の馬',
    episode: '第十五話',
    tale: '三春駒',
    place: '福島県三春町',
    autoWinTarget: 0.89,
    // 強さ＝試算（node tests/_autotune.mjs <id>・着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/4）
    expectLv: 15,
    hp: 870, atk: 142, def: 118, agi: 15, // 10/4 夜 くノ一・僧の如意輪の経・鉄砲2倍で合わせ直した（_autotune・前 hp680 atk99） // 10/4 夜 通しの調整＝猟師の玉3発を持つ前提で合わせ直した（前 hp544 atk134） ⭐10/5 職業の旅＝代表の5組の平均で仮に合わせ直した（1章の技まで・2章3章の技は段階②③で合わせ直す） // 10/5 夜 段階②（2章の技が入った）で 5組の平均に合わせ直した（_autotune・前 atk124 必殺技70）
    bgm: 'miharugoma',
    weakness: 'kibako',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: '百頭の 駆けぬけ', chance: 0.25, power: 80, flash: [255, 220, 150], sfx: 'hizume', cutin: 'assets/cutin/miharugoma_kakenuke.png' },
    biteName: 'ひづめで 蹴りあげる',
    introText: '三春の 野を、黒い もやを まとった 馬の 群れが 駆けてきた。……よく 見ると、どれも 木で できている！',
    tellLines: [
      'むかし、坂上田村麻呂が 京を 発つとき、りっぱな お寺の お坊さまから、木彫りの 馬 百頭の 入った 箱を おくられたの。',
      '大多鬼丸との 戦で 押されたとき、どこからか 百頭の 馬が 駆けこんで、田村麻呂を 助けたのよ。戦が 終わると、馬たちは 消えて しまった。',
      '箱を 開けると、木の 馬は どれも 汗で ぬれていたの。……馬たちが 帰る 木箱が、この 群れの 弱みよ。',
    ],
    story: {
      tell: [
        { img: 'assets/story/miharugoma_1.png', voice: 'assets/story/miharugoma_1.mp3', text: 'むかし、坂上田村麻呂が 東北の 豪族を 討つため 京を 発つとき、りっぱな お寺の お坊さまから、木彫りの 馬 百頭の 入った 箱を おくられたの。' },
        { img: 'assets/story/miharugoma_2.png', voice: 'assets/story/miharugoma_2.mp3', text: '大滝根山の 大多鬼丸との 戦で、田村麻呂の 馬は つかれはて、軍は 押されたの。そこへ どこからか 百頭の 馬が 駆けこんで、敵の 陣を 打ち破ったのよ。' },
        { img: 'assets/story/miharugoma_3.png', voice: 'assets/story/miharugoma_3.mp3', text: 'その 話も 忘れられて、木の 馬たちは 黒い もやに 呑まれ、帰る 所を なくして しまった……。お坊さまの 木箱を 開けましょう。' },
      ],
      after: [
        { img: 'assets/story/miharugoma_4.png', voice: 'assets/story/miharugoma_4.mp3', text: 'ほんとうの お話では、戦の あと 箱を 開けると、木の 馬は どれも 汗で びっしょり ぬれていたの。村の 人たちが その 馬を しのんで 彫りはじめたのが、いまの 三春駒の はじまりと いわれているわ。' },
      ],
    },
    revealText: '木の 馬たちの 弱点が 明かされた！ お坊さまの木箱が よく効くように なった。',
    restoreLines: [
      '黒い もやが、馬たちの たてがみから ほどけていく……',
      '木の 馬たちは 汗に ぬれたまま、一頭ずつ 木箱へ 帰っていった。',
      '旅の者は 三春駒の 術を 授かった！',
    ],
    hosoku: 'ほんとうの お話では、戦の あと 箱の 木の 馬は どれも 汗で ぬれていたの。その 馬を しのんで 彫られたのが、いまの 三春駒と いわれているのよ。',
    reward: '馬たちが 駆けぬけた あとに、大滝根山への 山道が ひらけた！',
    loseLines: ['旅の者たちは 力つきた……', '三春の 野に、ひづめの 音が ひびいている……'],
  },
};
