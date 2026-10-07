// 第九話 飴買い幽霊（2章 県北・中ボス・呑まれた良い存在）（本人 10/4「順番に制作を」「飴買い幽霊も戦う（他の話とそろえる）」）
// 話（県教委「うつくしま電子事典」・問い合わせ先 伊達市教育委員会＝vault 日本昔話/2026-10-04-調査-福島昔話クエスト2章県北5話.md）：
// 女性が毎晩 掛田の店へ飴を買いに来る。主人が後をつけると隣村 柱田の墓地で消えた。城主 遠藤氏の妻（身ごもったまま亡くなった）の墓で、
// 掘ると赤子が飴をなめていた（その日が四十九日）。子はのちに伊達家の家臣になったと伝わる。柱田の遠藤家の墓地＝田元の地蔵（子育て地蔵）
// 原典には敵はいない＝ゲームでは、忘れられて黒いもやに呑まれた母の霊。弱点＝「子を守る約束」。原典は紙芝居④で しおりが語る
// ⚠身ごもった母の死・墓の赤子＝絵と語りは直接見せず、やさしく語る
// 絵＝10/4 届いた。プロンプト＝art_src/Geminiプロンプト_2章県北.md
import { BASIC_ITEMS } from './basic_items.js?v=254';

export const AMEKAI = {
  art: {
    dark: 'assets/amekai_dark.png', light: 'assets/amekai_light.png', bg: 'assets/bg_amekai.png', // 10/4 絵が届いた（ng9l8f・q5ld7m・挿絵 wygk69・背景 oxvwii＝柱田の墓地と霊山）
    glowDark: 0x9fb4ff, glowLight: 0xffe6c8, // 墓地の月明かり → 戻ったら やわらかな 灯
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['komori'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    komori: {
      name: '子を守る約束', cost: 7, power: 26, weakMult: 3, plainMult: 0.5,
      weakText: '「この子は、わたしたちが 守る」――約束の 声が、母の 霊に とどいた！',
      plainText: '約束の 声は、夜の 風に まぎれた……',
    },
  },
  enemy: {
    id: 'amekai',
    name: '飴買いの霊',
    episode: '第九話',
    tale: '飴買い幽霊',
    place: '福島県伊達市',
    autoWinTarget: 0.93, // 2章の目安（章ボス0.90・中ボスは少し高め）
    // 強さ＝試算（node tests/_autotune.mjs <id>・その話に着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/4）
    expectLv: 10,
    hp: 598, atk: 90, def: 84, agi: 10, // 10/4 夜 通しの調整＝猟師の玉3発を持つ前提で合わせ直した（前 hp520 atk79） ⭐10/5 職業の旅＝代表の5組の平均で仮に合わせ直した（1章の技まで・2章3章の技は段階②③で合わせ直す）
    bgm: 'amekai',
    weakness: 'komori',
    mist: { min: 1, max: 3, rise: 0.2 },
    // 必殺技＝夜の 飴売りの 鈴（墓地の 冷たい 風が 全員を 包む）
    special: { name: '墓地の 夜風', chance: 0.26, power: 49, flash: [170, 190, 255], sfx: 'yokaze', cutin: 'assets/cutin/amekai_yokaze.png' },
    biteName: '冷たい 手で ふれる',
    introText: '夜の 墓地に、飴の 包みを 抱いた 女の 人が、ぼうっと 立っていた……',
    tellLines: [
      'むかし、霊山の ふもとの 掛田の 店に、毎晩 飴を 買いに くる 女の 人が いたの。',
      '店の 主人が 後を つけると、女の 人は 柱田の 墓地で、すうっと 消えて しまったのよ。',
      'その 墓から 赤ちゃんの 泣き声が して……墓の 中で、赤ちゃんが 飴を なめていたの。母の 霊が、子を 育てていたのね。',
    ],
    story: {
      tell: [
        { img: 'assets/story/amekai_1.png', voice: 'assets/story/amekai_1.mp3', text: 'むかし、霊山の ふもとの 掛田の 店に、毎晩 飴を 買いに くる 女の 人が いたの。白い 顔で、ひとことも しゃべらなかったそうよ。' },
        { img: 'assets/story/amekai_2.png', voice: 'assets/story/amekai_2.mp3', text: 'ふしぎに 思った 店の 主人が 後を つけると、女の 人は 柱田の 墓地で、すうっと 消えて しまったの。' },
        { img: 'assets/story/amekai_3.png', voice: 'assets/story/amekai_3.mp3', text: 'けれど その 話を 語る 人も いなくなって、子を 思う 母の 霊は、黒い もやに 呑まれて しまった……。思い出させて あげましょう。' },
      ],
      after: [
        { img: 'assets/story/amekai_4.png', voice: 'assets/story/amekai_4.mp3', text: 'ほんとうの お話では、墓の 中で、赤ちゃんが 飴を なめていたの。母の 霊が、飴で 子を 育てていたのよ。その 子は 立派に 育ち、墓は いまも 子育て地蔵として 守られているわ。' },
      ],
    },
    revealText: '飴買いの霊の 弱点が 明かされた！ 子を守る約束が よく効くように なった。',
    restoreLines: [
      '黒い もやが、夜明けの 光に とけていく……',
      '母の 霊は、やさしい 顔に もどり、そっと 頭を さげた。',
    ],
    hosoku: 'ほんとうの お話では、母の 霊は 飴で 墓の 中の 赤ちゃんを 育てていたの。その 子は 立派に 育ち、お墓は いまも 子育て地蔵として 守られているのよ。',
    reward: '母の 霊が、信夫山への 道の もやを 払ってくれた！',
    loseLines: ['旅の者たちは 力つきた……', '霊山の 墓地に、飴の 甘い 香りだけが ただよっている……'],
  },
};
