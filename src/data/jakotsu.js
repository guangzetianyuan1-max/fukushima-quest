// 第十四話 蛇骨地蔵（3章 県中・県南・中ボス・呑まれた良い存在）（本人 10/4「3章の製作に」）
// 話（Style郡山 2024-07-26「郡山の昔話」＝vault 日本昔話/2026-10-04-調査-福島昔話クエスト3章県中県南.md の2）：
// 日和田の領主 浅香忠繁の娘 あやめ姫は、家臣 浅香玄蕃に殺され安積沼に沈められた（⚠語りは直接見せない）。姫の恨みは大蛇になり、村に娘の生贄を求め続けた。
// 三十三人目に、大和国から来た佐世姫が身代わりを申し出て、沼のほとりで法華経を唱える。大蛇は天女の姿に変わって成仏し、残った骨で地蔵が作られた＝西方寺の蛇骨地蔵
// ゲームでは、忘れられて黒いもやに呑まれた あやめ姫の大蛇。弱点＝佐世姫の「法華経」。倒すと天女の姿に戻り（blessing）、郡山への もやを払う
// ⚠出どころは地域メディア1本・記事自身が「諸説あり」
import { BASIC_ITEMS } from './basic_items.js?v=283';

export const JAKOTSU = {
  art: {
    dark: 'assets/jakotsu_dark.png', light: 'assets/jakotsu_light.png', bg: 'assets/bg_jakotsu.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['hokekyo'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    hokekyo: {
      name: '佐世姫の法華経', cost: 8, power: 34, weakMult: 3, plainMult: 0.5,
      weakText: '佐世姫の 法華経の 声が 沼に ひびき、大蛇の うろこが 光に ほどけていく！',
      plainText: '経の 声は、黒い 水に 吸いこまれた……',
    },
  },
  enemy: {
    id: 'jakotsu',
    name: '安積沼の大蛇',
    episode: '第十四話',
    tale: '蛇骨地蔵',
    place: '福島県郡山市',
    autoWinTarget: 0.88, // 3章の目安（章ボス0.85・中ボスは少し高め）
    // 強さ＝試算（node tests/_autotune.mjs <id>・着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/4）
    expectLv: 15,
    hp: 819, atk: 160, def: 120, agi: 11, // 10/4 夜 くノ一・僧の如意輪の経・鉄砲2倍で合わせ直した（_autotune・前 hp640 atk103） // 10/4 夜 通しの調整＝猟師の玉3発を持つ前提で合わせ直した（前 hp512 atk141） ⭐10/5 職業の旅＝代表の5組の平均で仮に合わせ直した（1章の技まで・2章3章の技は段階②③で合わせ直す） // 10/5 夜 段階②（2章の技が入った）で 5組の平均に合わせ直した（_autotune・前 atk132 必殺技73）
    bgm: 'jakotsu',
    weakness: 'hokekyo',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: '安積沼の 大波', chance: 0.25, power: 89, flash: [120, 180, 255], sfx: 'hebinami', cutin: 'assets/cutin/jakotsu_oonami.png' },
    trick: { kind: 'poisonall', chance: 0.12, text: '大蛇は 沼の 底から 毒の 霧を 吐いた！' }, // 蛇の ボスは 毒の 息で 全員を 毒に（10/7 本人「蛇のボスは全員に毒」）
    biteName: '巻きついて しめつける',
    introText: '日和田の 沼の 水が、とつぜん もりあがった。……黒い もやを まとった 大蛇が、こちらを 見下ろしている！',
    tellLines: [
      'むかし、日和田の 領主の 娘 あやめ姫は、家来の 玄蕃に 命を うばわれ、安積沼に 沈められたの。',
      '姫の 恨みは 大蛇に なって、村に 毎年 娘を さしだせと たたったのよ。',
      '三十三人目の 年、大和の国から 来た 佐世姫が 身代わりに なって、沼の ほとりで 法華経を 唱えたの。……法華経の 声が、この 大蛇の 弱みよ。',
    ],
    story: {
      tell: [
        { img: 'assets/story/jakotsu_1.png', voice: 'assets/story/jakotsu_1.mp3', text: 'むかし、日和田の 領主の 娘 あやめ姫は、家来の 玄蕃に 命を うばわれ、安積沼に 沈められたの。姫の 恨みは 大蛇に なって、村に 娘を さしだせと たたったのよ。' },
        { img: 'assets/story/jakotsu_2.png', voice: 'assets/story/jakotsu_2.mp3', text: '三十三人目の 年、大和の国から 来た 佐世姫が、身代わりに なると 申し出たの。佐世姫は 沼の ほとりに すわり、一心に 法華経を 唱えたわ。' },
        { img: 'assets/story/jakotsu_3.png', voice: 'assets/story/jakotsu_3.mp3', text: 'その 話も 忘れられて、大蛇は 黒い もやに 呑まれて しまった……。思い出させて あげましょう。佐世姫の 法華経を。' },
      ],
      after: [
        { img: 'assets/story/jakotsu_4.png', voice: 'assets/story/jakotsu_4.mp3', text: 'ほんとうの お話では、大蛇は 経の 力で 天女の すがたに 変わり、佐世姫に お礼を 言って 成仏したの。残った 骨で お地蔵さまが 作られ、いまも 日和田の 西方寺に 蛇骨地蔵として まつられているわ。' },
      ],
    },
    // 元に戻ったあとに現れる人＝天女（原典：経の力で天女の姿に変わって成仏）
    blessing: {
      image: 'assets/tennyo.png',
      lines: ['大蛇の すがたが ほどけ、光の 中に 天女が あらわれた。', '天女「……ありがとう。やっと 沼から 出られます」', '天女は 空へ のぼっていった。'],
    },
    revealText: '大蛇の 弱点が 明かされた！ 佐世姫の法華経が よく効くように なった。',
    restoreLines: [
      '黒い もやが、沼の 霧に まじって 消えていく……',
      '大蛇の 体が、やわらかな 光に つつまれた。',
    ],
    hosoku: 'ほんとうの お話では、大蛇は 法華経の 力で 天女に 変わって 成仏したの。残った 骨で 作られた お地蔵さまが、いまも 日和田の 西方寺に まつられているのよ。',
    reward: '天女の 光が、郡山への もやを 払ってくれた！',
    loseLines: ['旅の者たちは 力つきた……', '安積沼の 水面が、黒く うねっている……'],
  },
};
