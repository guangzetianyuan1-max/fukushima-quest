// 第十二話 へっぴり嫁（2章 県北・中ボス・呑まれた良い存在）（10/1 に作りかけ・10/4 本人「順番に制作を」で2章に入れた）
// 話（川俣町公式「へっぴり嫁（部屋の由来の話）」語り 佐藤庄吉＝vault 日本昔話/2026-10-04-調査-福島昔話クエスト2章県北5話.md）：
// 気立てのよい嫁が「大きな屁をたれる癖」を打ち明ける。臼につかまった姑と婿は吹き飛ばされ、嫁は里へ帰される。
// 帰る途中、馬を連れた商人と賭けて屁で梨の実を落とし、馬と反物をもらう。婿は「宝嫁」と呼び戻し、姑が奥に一間を造った＝「へ屋＝部屋」の始まり
// 必殺技は「すごいおなら」（本人 10/1「おなら」→10/4「おおきな屁」→同日「すごいおなら」・おならの効果音・くらうと全員しばらく気絶）。⛔下品に振れさせない（音・臭いを書かない。可笑しみは真面目に語ることから）・子ども向けの絵柄に寄せない
// ゲームでは、忘れられて黒いもやに呑まれた嫁。弱点＝「迎えの言葉」（遠慮は いらんよ）。倒すと元に戻り、二本松への道の大岩を吹き飛ばす
// 絵＝まだ（仮に道中の娘の絵）。プロンプト＝art_src/Geminiプロンプト_2章県北.md
import { BASIC_ITEMS } from './basic_items.js?v=180';

export const HEPPIRI = {
  art: {
    dark: 'assets/heppiri_dark.png', light: 'assets/heppiri_light.png', bg: 'assets/bg_heppiri.png', // 10/4 ①②と背景（koqqyt＝川俣の夕暮れの農村）が届いた
    glowDark: 0xc9a0ff, glowLight: 0xffc8a0, // 夕暮れの薄紫 → 戻ったら あたたかい茜色
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['mukae'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    mukae: {
      name: '迎えの言葉', cost: 8, power: 32, weakMult: 3, plainMult: 0.5,
      weakText: '「遠慮は いらんよ。帰って おいで」――迎えの 声が、嫁の 胸に とどいた！',
      plainText: '言葉は 風に まぎれて 消えた……',
    },
  },
  enemy: {
    id: 'heppiri',
    name: 'へっぴり嫁',
    episode: '第十二話',
    tale: 'へっぴり嫁',
    place: '福島県川俣町',
    autoWinTarget: 0.93,
    // 強さ＝試算（node tests/_autotune.mjs <id>・その話に着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/4）
    expectLv: 13,
    hp: 587, atk: 70, def: 135, agi: 10, // 10/4 気絶を足したので攻め 90→65（tests/_tune_onara.mjs で自動の勝率0.93） // 10/4 夜 通しの調整＝猟師の玉3発を持つ前提で合わせ直した（前 hp640 atk65） ⭐10/5 職業の旅＝代表の5組の平均で仮に合わせ直した（1章の技まで・2章3章の技は段階②③で合わせ直す）
    bgm: 'heppiri',
    weakness: 'mukae',
    mist: { min: 1, max: 3, rise: 0.2 },
    // 必殺技（本人 10/4「へっぴり嫁の必殺技は『すごいおなら』に」「おならの効果音を」「くらったら全員しばらくの間、気絶」）
    // stun＝くらった全員が その数だけ 自分の番を休む（気絶）。気絶している人がいる間は この技を出さない（続けて出て 何もできないまま負けるのを防ぐ）
    // sfxSolo＝ふつうの必殺技の「ドガァン」を重ねず、おならの音だけ
    special: { name: 'すごいおなら', chance: 0.2, power: 34, stun: 2, flash: [255, 245, 210], sfx: 'onara', sfxSolo: true, cutin: 'assets/cutin/heppiri_onara.png' },
    biteName: '臼で ひと振り',
    introText: '川俣の 道に、お嫁さんが ひとり。何かを じっと こらえている……',
    tellLines: [
      'むかし、川俣の 村に 気立ての よい 娘が 嫁に 来たの。けれど 嫁には、大きな 屁を する くせが あったのよ。',
      '打ち明けて 放った 一発で、姑も 婿も 吹き飛ばされて、嫁は 里へ 帰されることに なったの。',
      'それでも 嫁は、帰る 途中で 困っている 人を 助けた。ほんとうは やさしい 嫁なの。「遠慮は いらん」と 迎えて あげて。',
    ],
    story: {
      tell: [
        { img: 'assets/story/heppiri_1.png', voice: 'assets/story/heppiri_1.mp3', text: 'むかし、川俣の 村に 気立ての よい 娘が 嫁に 来たの。けれど 嫁には、大きな 屁を する くせが あったのよ。' },
        { img: 'assets/story/heppiri_2.png', voice: 'assets/story/heppiri_2.mp3', text: '打ち明けて 放った 一発で、臼に つかまった 姑と 婿は 吹き飛ばされ、嫁は 里へ 帰されることに なったの。' },
        { img: 'assets/story/heppiri_3.png', voice: 'assets/story/heppiri_3.mp3', text: 'その 話も 忘れられて、嫁は 黒い もやに 呑まれて しまった……。迎えの 言葉を、とどけましょう。' },
      ],
      after: [
        { img: 'assets/story/heppiri_4.png', voice: 'assets/story/heppiri_4.mp3', text: 'ほんとうの お話では、嫁は 帰る 途中で 梨の 実を 落として 商人を 助け、馬と 反物を もらったの。家に 呼び戻され、姑が 造った へ屋が、部屋の 始まりと 伝わるのよ。' },
      ],
    },
    revealText: 'へっぴり嫁の 弱点が 明かされた！ 迎えの言葉が よく効くように なった。',
    restoreLines: [
      '黒い もやが、風に 吹かれて 消えていく……',
      'へっぴり嫁は 元の すがたを 取りもどし、はずかしそうに わらった。',
    ],
    hosoku: 'ほんとうの お話では、嫁は 帰される途中で 梨の実を 落として 人を助け、家に 迎えられたの。姑が 建てさせた へ屋が、部屋の 始まりと 伝わるのよ。',
    reward: 'へっぴり嫁の 一発で、二本松への 道を ふさぐ もやが 吹き飛んだ！',
    loseLines: ['旅の者たちは 力つきた……', '川俣の 里に、夕暮れの 風だけが 吹いている……'],
  },
};
