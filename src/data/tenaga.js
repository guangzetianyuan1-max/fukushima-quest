// 第七話 手長明神（1章 相馬・中ボス・呑まれた良い存在）（本人 10/3「4話分進めて」）
// 話（うみのみんわ・南相馬市の民俗の頁で確かめた所だけ）：新地の鹿狼山の手長明神は、白い鹿と白い狼を従えた手の長い神さまで、
// 生きものや人々の暮らしを見守っていた。鹿狼山は海から岸へ戻る舟の目印。新地貝塚は食べた貝を捨てた跡と伝わる。
// 漁師になった少年 長吉は、海から戻ると海のめぐみと無事に帰れたことへの感謝を忘れなかった
// ゲームでは、忘れられて黒いもやに呑まれた暮らしの守り神。弱点＝「海の幸への感謝」。倒すと元に戻り、長い腕で虎捕山への もやを払う
// 絵＝10/3 届いた（1ukroq 呑まれた・z1hpg6 元の姿・3dcp6z 長い腕。①→挿絵→②の順で頼んで姿がそろった）。背景も届いた。プロンプト＝art_src/Geminiプロンプト_1章相馬.md
import { BASIC_ITEMS } from './basic_items.js?v=239';

export const TENAGA = {
  art: {
    dark: 'assets/tenaga_dark.png', light: 'assets/tenaga_light.png', bg: 'assets/bg_tenaga.png', // 10/3 絵と背景が届いた
    glowDark: 0x9fb4ff, glowLight: 0xffe6a0,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['kansha'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    kansha: {
      name: '海の幸への感謝', cost: 6, power: 22, weakMult: 3, plainMult: 0.5,
      weakText: '海の めぐみへの 感謝が、手長明神の 胸に とどいた！',
      plainText: '感謝の 声は、波の 音に まぎれた……',
    },
  },
  enemy: {
    id: 'tenaga',
    name: '手長明神',
    episode: '第七話',
    tale: '手長明神',
    place: '福島県新地町',
    autoWinTarget: 0.95,
    expectLv: 8,
    // 強さ＝試算（node tests/_tune.mjs '{}' <id>・その話に着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/3）
    // 10/3 装備を1段強くした（本人「武器や防具、道具も強く」）ので体力 360→420（試算 自動0.96）
    hp: 483, atk: 84, def: 72, agi: 9, // 10/4 夜 通しの調整＝猟師の玉3発を持つ前提で合わせ直した（前 hp420 atk72） ⭐10/5 職業の旅＝代表の5組（tests/_party.js の COMPS）の平均で合わせ直した（tests/_autotune.mjs）
    bgm: 'tenaga', // 話ごとの戦いの曲（本人 10/3「1章の4話はBGMも全て変えて」・chip.js）
    weakness: 'kansha',
    mist: { min: 1, max: 3, rise: 0.2 },
    // 必殺技＝長い腕（山の上から 海まで とどく腕で 全員を なぎはらう）
    special: { name: '長い腕', chance: 0.28, power: 44, flash: [220, 200, 140], sfx: 'ude', cutin: 'assets/cutin/tenaga_nagaiude.png' },
    biteName: '長い 手で つかむ',
    introText: '鹿狼山の 上から、長い 長い 腕が のびてきた……',
    tellLines: [
      '鹿狼山の 手長明神さまは、白い 鹿と 白い 狼を 従えた、手の 長い 神さま。',
      '海と 山の 生きもの、そして 人の 暮らしを 見守っていたの。海から 帰る 舟は、鹿狼山を 目印に したのよ。',
      '新地の 貝塚は、食べた 貝を 捨てた 跡だと 伝わるわ。海の めぐみに 感謝を 忘れては いけないの。',
    ],
    // 紙芝居（本人 10/2「次回以降全て」）＝影絵4枚＋しおりの声4束。台本とプロンプト＝art_src/紙芝居_1章相馬.md。絵と声が届くまでは文字だけで流れる
    story: {
      tell: [
        { img: 'assets/story/tenaga_1.png', voice: 'assets/story/tenaga_1.mp3', text: 'むかし、新地の 鹿狼山に、手の 長い 神さまが いたの。白い 鹿と 白い 狼を 従えて、海と 山の 暮らしを 見守っていたのよ。' },
        { img: 'assets/story/tenaga_2.png', voice: 'assets/story/tenaga_2.mp3', text: '少年の 長吉は、はじめて 父の 舟で 海に 出た日、岸へ 帰る 目印に、鹿狼山を 教わったの。' },
        { img: 'assets/story/tenaga_3.png', voice: 'assets/story/tenaga_3.mp3', text: 'やがて、神さまの 話を 語る 人が いなくなり、手長明神さまは、黒い もやに 呑まれて しまった……。思い出させて あげましょう。海の めぐみへの 感謝を。' },
      ],
      after: [
        { img: 'assets/story/tenaga_4.png', voice: 'assets/story/tenaga_4.mp3', text: 'ほんとうの お話では、漁師に なった 長吉は、海から 帰ると、海の めぐみと 無事に 帰れた ことに、感謝を 忘れなかったの。食べた 貝を 捨てた 跡が、新地貝塚だと 伝わるのよ。' },
      ],
    },
    revealText: '手長明神の 弱点が 明かされた！ 海の幸への感謝が よく効くように なった。',
    restoreLines: [
      '黒い もやが、潮風に 吹かれて 消えていく……',
      '手長明神は 元の すがたを 取りもどした！ 白い 鹿と 白い 狼が、そばに 寄りそった。',
    ],
    hosoku: 'ほんとうの お話では、手長明神は 暮らしを 見守る 神さま。海から 帰った 漁師は、海の めぐみと 無事に 帰れた ことに 感謝を 忘れなかったと 伝わるのよ。',
    reward: '手長明神の 長い 腕が、虎捕山への 山道の もやを 払った！',
    loseLines: ['旅の者たちは 力つきた……', '鹿狼山に、波の 音だけが とどいている……'],
  },
};
