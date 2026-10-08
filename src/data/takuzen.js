// 第十九話 狸森の託善和尚（3章 県中・県南・中ボス・呑まれた狸の名僧）（本人 10/4「戦わない3話を戦う形で作成しなおして」「道上ではなく、もやで」）
// 話（うつくしま電子事典「狸森の託善和尚」＝vault 調査ノートの5）：杉森村の宗徳寺の かしこい僧 託善が、会津の天寧寺の大法要で昼も夜も働いて眠りこむ。
// 目の見えない僧が体に触れると毛と尻尾があった。託善は「狸で、仏の御利益がほしくて化けて修行していた」と明かし、お釈迦様の涅槃の様子を見せて消えた。
// 遺品を埋めた山が経塚山、杉森村は狸森（むじなもり）と呼ばれるようになった
// ⚠悪い狸ではない（修行したい一心）・最期は直接見せない（碑で語る）・「狸」と書いて「むじな」・子ども向けの たぬきの絵柄にしない
// ゲームでは、忘れられて黒いもやに呑まれ、化けたまま正体を失った託善。弱点＝「手さぐりの歌」（目の見えない僧が触れて正体を知り、歌に書き残した）
// 勝つと、託善が カッパの弱みを教えてくれる（kappa.js の hint）・天栄の谷への もやが晴れる
import { BASIC_ITEMS } from './basic_items.js?v=285';

export const TAKUZEN = {
  art: {
    dark: 'assets/takuzen_dark.png', light: 'assets/takuzen_light.png', bg: 'assets/bg_takuzen.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['tesaguri'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    tesaguri: {
      name: '手さぐりの歌', cost: 9, power: 37, weakMult: 3, plainMult: 0.5,
      weakText: '目の 見えない お坊さまが 書き残した 歌を 詠んだ！ 託善の 化けの 皮が ゆらいだ！',
      plainText: '託善は 静かに 経を 読みつづけている……',
    },
  },
  enemy: {
    id: 'takuzen',
    name: '託善和尚',
    episode: '第十九話',
    tale: '狸森の託善和尚',
    place: '福島県須賀川市',
    autoWinTarget: 0.88,
    // 強さ＝試算（node tests/_autotune.mjs <id>・着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/4）
    expectLv: 17,
    hp: 998, atk: 169, def: 130, agi: 13, // 10/4 夜 くノ一・僧の如意輪の経・鉄砲2倍で合わせ直した（_autotune・前 hp780 atk112） // 10/4 夜 通しの調整＝猟師の玉3発を持つ前提で合わせ直した（前 hp624 atk153） ⭐10/5 職業の旅＝代表の5組の平均で仮に合わせ直した（1章の技まで・2章3章の技は段階②③で合わせ直す） // 10/5 夜 段階②（2章の技が入った）で 5組の平均に合わせ直した（_autotune・前 atk148 必殺技80）
    bgm: 'takuzen',
    weakness: 'tesaguri',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: '涅槃の まぼろし', chance: 0.25, power: 91, flash: [210, 220, 255], sfx: 'nehan', cutin: 'assets/cutin/takuzen_nehan.png' },
    biteName: '錫杖で 打ちすえる',
    introText: '狸森の 山道に、袈裟を 着た お坊さまが 立っていた。……黒い もやの 中で、衣の すそが ふさふさと ゆれている。',
    tellLines: [
      'むかし、杉森村の 宗徳寺に、託善という とても かしこい お坊さまが いたの。会津の 天寧寺の 大きな 法要で、託善は 昼も 夜も 働いたのよ。',
      'つかれて 眠った 託善の 体に、目の 見えない お坊さまが ふれると……毛が はえ、しっぽまで あったの。そのことを、お坊さまは 歌に 書き残したわ。',
      '託善は 狸で、仏さまの ご利益が ほしくて 化けて 修行していたのよ。……手さぐりの 歌が、託善の 弱みよ。',
    ],
    story: {
      tell: [
        { img: 'assets/story/takuzen_1.png', voice: 'assets/story/takuzen_1.mp3', text: 'むかし、杉森村の 宗徳寺に、託善という とても かしこい お坊さまが いたの。会津の 天寧寺で 大きな 法要が あったとき、託善は 中心に なって 昼も 夜も 働いたのよ。' },
        { img: 'assets/story/takuzen_2.png', voice: 'assets/story/takuzen_2.mp3', text: 'つかれて ぐっすり 眠った 託善の 体に、目の 見えない お坊さまが ふれると……毛が はえ、しっぽまで あったの。お坊さまは おどろいて、そのことを 歌に 書き残したわ。' },
        { img: 'assets/story/takuzen_3.png', voice: 'assets/story/takuzen_3.mp3', text: 'その 話も 忘れられて、託善は 黒い もやに 呑まれ、化けたまま 自分が だれかも 忘れて しまった……。手さぐりの 歌で、思い出させて あげましょう。' },
      ],
      after: [
        { img: 'assets/story/takuzen_4.png', voice: 'assets/story/takuzen_4.mp3', text: 'ほんとうの お話では、託善は 自分は 狸で、仏さまの ご利益が ほしくて 修行していたと 打ち明け、お釈迦さまの 最期の ようすを 見せて 消えたの。経文を 埋めた 山が 経塚山、杉森村は 狸森と 呼ばれるように なったのよ。' },
      ],
    },
    revealText: '託善の 弱点が 明かされた！ 手さぐりの歌が よく効くように なった。',
    restoreLines: [
      '黒い もやが、読経の 声に はらわれていく……',
      '託善和尚は 静かに 合掌し、ほほえんだ。',
      '託善「……ありがとう。天栄の 川の カッパなら、石の 証文を いちばん こわがりますぞ」',
    ],
    hosoku: 'ほんとうの お話では、託善は 狸で、仏さまの ご利益が ほしくて 修行していたの。経文を 埋めた 経塚山の 上には、いまも 託善和尚の 碑が あると 伝わっているのよ。',
    reward: '託善和尚の 読経が、天栄の 谷への もやを 払ってくれた！',
    loseLines: ['旅の者たちは 力つきた……', '狸森の 山に、読経の 声が こだましている……'],
  },
};
