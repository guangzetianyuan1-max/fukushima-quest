// 第十話 信夫山のご坊狐（2章 県北・小ボス・呑まれた良い存在）（本人 10/4「順番に制作を」）
// 話（福島市信夫山情報サイト NPO法人ストリートふくしま「信夫山の『ねこ稲荷』のいわれ」）：
// 信夫山の三狐の一匹 ご坊狐が、御山の和尚に化けて木の葉の小判で魚を買って悪さをした。仲間の鴨左衛門に「尻尾で釣りを」とだまされ、
// 真冬の黒沼で尻尾が凍って切れ、神通力を失った。和尚に諭され、蚕を食うネズミを退治して恩を返し、蚕の守り神「ねこ稲荷」に祀られた
// ゲームでは、忘れられて黒いもやに呑まれた信夫山の狐。弱点＝「尻尾の釣り」（凍った黒沼）。倒すと元に戻り、ムカデとオロチへの もやを払う
// 絵＝10/4 届いた。プロンプト＝art_src/Geminiプロンプト_2章県北.md
import { BASIC_ITEMS } from './basic_items.js?v=263';

export const GOBOU = {
  art: {
    dark: 'assets/gobou_dark.png', light: 'assets/gobou_light.png', bg: 'assets/bg_gobou.png', // 10/4 絵が届いた（ukupff・nzgnh9・挿絵 j24ni1・背景 qnfr0r＝信夫山の雪の参道・上の切れた杉の帯は夜空で塗った）
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['shippo'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    shippo: {
      name: '尻尾の釣り', cost: 7, power: 28, weakMult: 3, plainMult: 0.5,
      weakText: '「黒沼で 尻尾を 垂らせば、魚が 釣れるぞ」――ご坊狐は 凍った 沼に 尻尾を 垂らし、動けなくなった！',
      plainText: 'ご坊狐は ふふんと 鼻で わらった……',
    },
  },
  enemy: {
    id: 'gobou',
    name: 'ご坊狐',
    episode: '第十話',
    tale: '信夫山のご坊狐',
    place: '福島県福島市',
    autoWinTarget: 0.93,
    // 強さ＝試算（node tests/_autotune.mjs <id>・その話に着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/4）
    expectLv: 11,
    hp: 700, atk: 102, def: 92, agi: 13, // 10/4 夜 通しの調整＝猟師の玉3発を持つ前提で合わせ直した（前 hp560 atk83） ⭐10/5 職業の旅＝代表の5組の平均で仮に合わせ直した（1章の技まで・2章3章の技は段階②③で合わせ直す）
    bgm: 'gobou',
    weakness: 'shippo',
    mist: { min: 1, max: 3, rise: 0.2 },
    // 必殺技＝木の葉の 小判（化かしの 木の葉が 舞い、全員の 目を くらます）
    special: { name: '木の葉の 小判', chance: 0.27, power: 55, flash: [255, 220, 120], sfx: 'koban', cutin: 'assets/cutin/gobou_konoha.png' },
    biteName: '和尚に 化けて ひっかく',
    introText: '信夫山の 坂に、袈裟を 着た 和尚さんが 立っていた。……その 足もとから、ふさふさの 尻尾が のぞいている！',
    tellLines: [
      'むかし、信夫山には 三匹の 化け狐が いて、その 一匹が ご坊狐。お山の 和尚さんに 化けては、木の葉の 小判で 魚を 買って いたの。',
      'ある 冬、仲間の 狐に「黒沼で 尻尾を 垂らせば、魚が 釣れる」と だまされて、ご坊狐は 凍った 沼に 尻尾を 垂らしたのよ。',
      '尻尾は 凍りついて 切れ、ご坊狐は 化ける 力を なくした。……尻尾の 釣りの 話が、この 狐の 弱みなの。',
    ],
    story: {
      tell: [
        { img: 'assets/story/gobou_1.png', voice: 'assets/story/gobou_1.mp3', text: 'むかし、信夫山の ご坊狐は、お山の 和尚さんに 化けて 町の 魚屋に 来ては、木の葉の 小判で 魚を 買っていったの。' },
        { img: 'assets/story/gobou_2.png', voice: 'assets/story/gobou_2.mp3', text: 'ある 冬の 夜、仲間の 狐に「黒沼で 尻尾を 垂らせば、魚が 釣れる」と だまされて、凍った 沼に 尻尾を 垂らしたのよ。' },
        { img: 'assets/story/gobou_3.png', voice: 'assets/story/gobou_3.mp3', text: 'その 話も 忘れられて、ご坊狐は 黒い もやに 呑まれて しまった……。思い出させて あげましょう。尻尾の 釣りの 話を。' },
      ],
      after: [
        { img: 'assets/story/gobou_4.png', voice: 'assets/story/gobou_4.mp3', text: 'ほんとうの お話では、尻尾を なくした ご坊狐は 和尚さんに 諭されて 改心し、蚕を 食べる ネズミを 退治したの。いまも 蚕の 守り神、ねこ稲荷として まつられているわ。' },
      ],
    },
    revealText: 'ご坊狐の 弱点が 明かされた！ 尻尾の釣りが よく効くように なった。',
    restoreLines: [
      '黒い もやが、冬の 風に 散っていく……',
      'ご坊狐は 元の すがたを 取りもどし、しょんぼりと 頭を さげた。',
    ],
    hosoku: 'ほんとうの お話では、ご坊狐は 和尚さんに 諭されて 改心し、蚕を 食べる ネズミを 退治したの。いまは 蚕の 守り神、ねこ稲荷として まつられているのよ。',
    reward: 'ご坊狐が 化ける 術で、信夫山の 奥への もやを 払ってくれた！',
    loseLines: ['旅の者たちは 力つきた……', '信夫山に、狐の 笑い声が こだましている……'],
  },
};
