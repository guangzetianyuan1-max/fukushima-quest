// 第五話 ザルカブリ山の化け物（1章 相馬・中ボス・呑まれた良い存在）（本人 10/3「次は1章ですよ、南相馬を先に」「4話分進めて」）
// 話（南相馬市の民俗の頁で確かめた所だけ）：小高区金谷の山中。鹿を追って山に入った猟師の前に、竹のざる（笊籬）のような頭の女の化け物が
// 乱れ髪を地面に引きずって微笑んで現れ、猟師はそれから殺生をやめた。獲りすぎる猟師を山の神が戒めた姿と伝わる（原典では倒されない）
// ゲームでは、忘れられて黒いもやに呑まれた山の神の使い。⭐10/4 本人「敵と戦う形にして欲しい」＝戦う（10/3「C」の誓いの出会いは取りやめ）
// 原典で倒されない所は、勝った後の紙芝居④と hosoku で しおりが補う。見た目は ざるのまま描き直す（本人 10/4・名前もそのまま）
// 絵＝10/4 描き直し（sd30b3・czv1hg・必殺技 38x7zb＝ざるが頭をまるごと覆う）。旧＝10/3 qil8fg・13r9vr・pgmdxj。背景は10/3のまま。プロンプト＝art_src/Geminiプロンプト_1章相馬.md
import { BASIC_ITEMS } from './basic_items.js?v=243';

export const ZARUKABURI = {
  art: {
    dark: 'assets/zarukaburi_dark.png', light: 'assets/zarukaburi_light.png', bg: 'assets/bg_zarukaburi.png', // 10/3 絵と背景が届いた
    glowDark: 0x9fb4ff, glowLight: 0xb8f0c0, // 山の月明かり → 戻ったら 山の 緑の 光
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['chikai'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    chikai: {
      name: '獲りすぎない誓い', cost: 6, power: 18, weakMult: 3, plainMult: 0.5,
      weakText: '「獲りすぎない」と 誓う 声が、山に しみこんだ！',
      plainText: '誓いの 声は、山の 風に まぎれた……',
    },
  },
  enemy: {
    id: 'zarukaburi',
    name: 'ザルカブリ山の化け物',
    episode: '第五話',
    tale: 'ザルカブリ山',
    place: '福島県南相馬市',
    autoWinTarget: 0.95, // 1章の目安（本人 10/1「章が進むほど勝ちにくく」＝序章99→1章95）
    expectLv: 6,
    // 強さ＝試算（node tests/_tune.mjs '{}' <id>・その話に着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/3）
    hp: 299, atk: 52, def: 60, agi: 11, // 10/4 夜 通しの調整＝猟師の玉3発を持つ前提で合わせ直した（前 hp260 atk62） ⭐10/5 職業の旅＝代表の5組（tests/_party.js の COMPS）の平均で合わせ直した（tests/_autotune.mjs）
    bgm: 'zarukaburi', // 話ごとの戦いの曲（本人 10/3「1章の4話はBGMも全て変えて」・chip.js）
    weakness: 'chikai',
    mist: { min: 1, max: 2, rise: 0.2 },
    // 必殺技＝乱れ髪（地面を引きずる髪が 全員に からみつく）
    special: { name: '乱れ髪', chance: 0.25, power: 28, flash: [150, 90, 200], sfx: 'kami', cutin: 'assets/cutin/zarukaburi_midaregami.png' },
    biteName: 'ざるの 頭突き',
    introText: '山の 奥から、ざるの ような 頭の 女が、髪を 引きずって あらわれた……',
    tellLines: [
      'むかし、鹿を 追って この 山に 入った 猟師が いたの。',
      '山の 奥で、ざるの ような 頭の 女の 化け物が、乱れ髪を 地面に 引きずって、にっこり 笑ったのよ。',
      'それから 猟師は、殺生を やめた。獲りすぎる 猟師を、山の 神さまが 戒めた すがただと 伝わるの。',
    ],
    // 紙芝居（本人 10/2「次回以降全て」）＝影絵4枚＋しおりの声4束。台本とプロンプト＝art_src/紙芝居_1章相馬.md。絵と声が届くまでは文字だけで流れる
    story: {
      tell: [
        { img: 'assets/story/zarukaburi_1.png', voice: 'assets/story/zarukaburi_1.mp3', text: 'むかし、金谷の 山へ、鹿を 追って 猟師が 入っていったの。この 猟師は、獲りすぎる 猟師だったと 伝わるわ。' },
        { img: 'assets/story/zarukaburi_2.png', voice: 'assets/story/zarukaburi_2.mp3', text: '山の 奥で、ざるの ような 頭の 女が あらわれた。乱れ髪を 地面に 引きずって、にっこりと 笑ったの。猟師は、震えあがったのよ。' },
        { img: 'assets/story/zarukaburi_3.png', voice: 'assets/story/zarukaburi_3.mp3', text: 'けれど、その 話を 語る 人も いなくなって、山の 神さまの お使いは、黒い もやに 呑まれて しまった……。思い出させて あげましょう。' },
      ],
      after: [
        { img: 'assets/story/zarukaburi_4.png', voice: 'assets/story/zarukaburi_4.mp3', text: 'ほんとうの お話では、化け物は 倒されないの。獲りすぎる 猟師を、山の 神さまが 戒めた すがた。猟師は それから、殺生を やめたと 伝わるのよ。' },
      ],
    },
    revealText: 'ザルカブリ山の化け物の 弱点が 明かされた！ 獲りすぎない誓いが よく効くように なった。',
    restoreLines: [
      '黒い もやが、山の 風に 散っていく……',
      '山の 神さまの お使いは、元の すがたを 取りもどした！',
    ],
    hosoku: 'ほんとうの お話では、ザルカブリ山の 化け物は 倒されないの。獲りすぎる 猟師を 山の 神さまが 戒めた すがただと 伝わり、猟師は それから 殺生を やめたのよ。',
    reward: '山の 神さまの お使いが、大悲山への 道の もやを 払ってくれた！',
    loseLines: ['旅の者たちは 力つきた……', '金谷の 山に、女の 笑い声だけが ひびいている……'],
  },
};
