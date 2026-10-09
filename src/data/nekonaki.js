// 第十七話 和泉式部と猫（3章 県中・県南・中ボス・呑まれた猫）（本人 10/4「戦わない3話を戦う形で作成しなおして」「道上ではなく、もやで」）
// 話（猫啼温泉の開湯伝説・るるぶ／Wikipedia「猫啼温泉」＝vault 調査ノートの7）：石川の地で生まれたと伝わる和泉式部が都へ上るとき、かわいがっていた猫を残していった。
// 猫は主人を慕って鳴き続けて重い病になったが、泉に浸かると元気を取り戻した。里人が湯治場を開き「猫啼」と名づけた
// ⚠式部の生まれは「石川と 言い伝えられている」まで・宿の実名は出さない・式部との再会は どの出どころにも無い
// ⚠化け猫にしない（後の章に化け猫のボスがある見込み・猫は「慕って鳴きつづける猫」のまま）
// ゲームでは、忘れられて黒いもやに呑まれ、泉のほとりで鳴きつづける猫。弱点＝「猫啼の湯」（病が治った泉）。勝つと湯につかれる（温泉）・鮫川への もやが晴れる
import { BASIC_ITEMS } from './basic_items.js?v=287';

export const NEKONAKI = {
  art: {
    dark: 'assets/nekonaki_dark.png', light: 'assets/nekonaki_light.png', bg: 'assets/bg_nekonaki.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['yu'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    yu: {
      name: '猫啼の湯', cost: 8, power: 35, weakMult: 3, plainMult: 0.5,
      weakText: '泉の 湯を すくって かけた！ あたたかな 湯気に つつまれ、猫の 声が やわらいだ！',
      plainText: '湯は 黒い もやに はじかれた……',
    },
  },
  enemy: {
    id: 'nekonaki',
    name: '鳴きつづける猫',
    episode: '第十七話',
    tale: '和泉式部と猫',
    place: '福島県石川町',
    autoWinTarget: 0.88,
    // 強さ＝試算（node tests/_autotune.mjs <id>・着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/4）
    expectLv: 16,
    hp: 922, atk: 145, def: 124, agi: 16, // 10/4 夜 くノ一・僧の如意輪の経・鉄砲2倍で合わせ直した（_autotune・前 hp720 atk108） // 10/4 夜 通しの調整＝猟師の玉3発を持つ前提で合わせ直した（前 hp576 atk149） ⭐10/5 職業の旅＝代表の5組の平均で仮に合わせ直した（1章の技まで・2章3章の技は段階②③で合わせ直す） // 10/5 夜 段階②（2章の技が入った）で 5組の平均に合わせ直した（_autotune・前 atk145 必殺技79）
    bgm: 'nekonaki',
    weakness: 'yu',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: '慕い鳴き', kind: 'silence', chance: 0.25, power: 79, flash: [200, 180, 255], sfx: 'shitainaki', cutin: 'assets/cutin/nekonaki_naki.png' },
    biteName: '爪で ひっかく',
    introText: '泉の ほとりで、黒い もやを まとった 猫が 鳴いていた。……その 声は、だれかを 呼んでいる。',
    tellLines: [
      '歌人の 和泉式部は、この 石川の 地で 生まれたと 言い伝えられているの。都へ 上るとき、かわいがっていた 猫を ふるさとに 残していったのよ。',
      '猫は 式部を 慕って 鳴きつづけ、とうとう 重い 病に なって しまったの。',
      'けれど 川の ほとりの 泉に つかると、猫は 元気を 取りもどしたそうよ。……その 泉の 湯が、この 猫の 弱みよ。',
    ],
    story: {
      tell: [
        { img: 'assets/story/nekonaki_1.png', voice: 'assets/story/nekonaki_1.mp3', text: '歌人の 和泉式部は、この 石川の 地で 生まれたと 言い伝えられているの。都へ 上るとき、かわいがっていた 猫を ふるさとに 残していったのよ。' },
        { img: 'assets/story/nekonaki_2.png', voice: 'assets/story/nekonaki_2.mp3', text: '猫は 式部を 慕って、夜も 昼も 鳴きつづけたの。そして とうとう、重い 病に なって しまったわ。' },
        { img: 'assets/story/nekonaki_3.png', voice: 'assets/story/nekonaki_3.mp3', text: 'その 話も 忘れられて、猫は 黒い もやに 呑まれ、いまも 鳴きつづけているの……。泉の 湯を 届けましょう。' },
      ],
      after: [
        { img: 'assets/story/nekonaki_4.png', voice: 'assets/story/nekonaki_4.mp3', text: 'ほんとうの お話では、猫は 川の ほとりの 泉に つかって 元気を 取りもどしたの。それを 見た 里の 人たちが 湯治場を 開き、この 地を 猫啼と 名づけたと いうわ。' },
      ],
    },
    revealText: '猫の 弱点が 明かされた！ 猫啼の湯が よく効くように なった。',
    restoreLines: [
      '黒い もやが、湯気に まじって 消えていく……',
      '猫は 鳴くのを やめ、泉の ほとりで 気持ちよさそうに 目を 細めた。',
      '猫啼の 湯に つかれるように なった！',
    ],
    hosoku: 'ほんとうの お話では、猫は 泉の 湯で 元気を 取りもどしたの。里の 人たちが 湯治場を 開いて、この 地を 猫啼と 名づけたと いわれているのよ。',
    reward: '湯気の 向こうに、東の 鮫川への 道が 見えた！',
    loseLines: ['旅の者たちは 力つきた……', '泉の ほとりに、猫の 鳴き声が ひびいている……'],
  },
};
