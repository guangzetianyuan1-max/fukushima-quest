// 第六話 大悲山の大蛇（1章 相馬・ボス・よみがえった悪役）（本人 10/3「4話分進めて」）
// 話（ふくしまの義務教育の頁で確かめた所だけ）：琵琶法師の玉都が大悲山の薬師堂にこもって琵琶を弾いていた。堂の前の池の大蛇が武士に化けて来て
// 「体が大きくなり、この池に住めないので、この地に大雨を降らせ大沼にしたい」と言った。玉都は迷った末に小高城の殿様へ訴え、
// 殿様の陣営は大蛇の苦手な鉄の釘を山や谷に打った。大蛇は玉都をさらったが、退治された。今は大悲山の石仏（国の史跡）と大悲山大蛇物語公園
// ゲームでは、忘れの力でよみがえった大蛇。弱点＝「鉄の釘」。助っ人＝玉都（本人 10/3「戦いの中で琵琶を弾く助っ人」）＝語って弱点が明かされると
// 琵琶が鳴り、大蛇は聞き入って2回動けない。その後も ときどき琵琶で止める
// 絵＝10/3 届いた（2noh3h 大蛇・xf4m56 封じられた姿）。必殺技の挿絵＝描き直し（貼り付け・使用済み_絵／大悲山_大雨_描き直し_貼り付け.jpg。1回目 vxa4qk は封じられた姿と山高帽で描かれた）。背景も届いた。プロンプト＝art_src/Geminiプロンプト_1章相馬.md
import { BASIC_ITEMS } from './basic_items.js?v=244';

export const DAIHISAN = {
  art: {
    dark: 'assets/daihisan_dark.png', light: 'assets/daihisan_light.png', bg: 'assets/bg_daihisan.png', // 10/3 絵と背景が届いた
    glowDark: 0x9fb4ff, glowLight: 0xd8e2f0,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['kugi'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    kugi: {
      name: '鉄の釘', cost: 6, power: 20, weakMult: 3, plainMult: 0.5,
      verb: '鉄の 釘を 打ちこんだ',
      weakText: '鉄の 釘が、大蛇の 動きを 封じた！',
      plainText: '釘は 大蛇の 鱗に はじかれた……',
    },
  },
  enemy: {
    id: 'daihisan',
    name: '大悲山の大蛇',
    episode: '第六話',
    tale: '大悲山',
    place: '福島県南相馬市',
    autoWinTarget: 0.95,
    expectLv: 7,
    // 強さ＝試算（node tests/_tune.mjs '{}' <id>・その話に着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/3）
    //   玉都の琵琶が効きすぎた（攻1.8倍でも自動97%）＝琵琶の見込み 0.25→0.2・攻を上げた
    // 10/3 装備を1段強くした（本人「武器や防具、道具も強く」）ので体力 320→350（試算 自動0.96）
    hp: 402, atk: 125, def: 66, agi: 10, // 10/4 夜 通しの調整＝猟師の玉3発を持つ前提で合わせ直した（前 hp350 atk88） ⭐10/5 職業の旅＝代表の5組（tests/_party.js の COMPS）の平均で合わせ直した（tests/_autotune.mjs）
    bgm: 'daihisan', // 話ごとの戦いの曲（本人 10/3「1章の4話はBGMも全て変えて」・chip.js）
    weakness: 'kugi',
    mist: { min: 1, max: 3, rise: 0.2 },
    // 必殺技＝大雨（この地を大沼にしたい＝原典の大蛇のたくらみ）
    special: { name: '大雨', chance: 0.28, power: 66, flash: [70, 110, 190], sfx: 'ame', cutin: 'assets/cutin/daihisan_ooame.png' },
    helper: {
      name: '玉都',
      revealText: '玉都の 琵琶が 鳴りひびいた！ 大蛇は 聞き入って 動きを 止めた！',
      revealBind: 2,
      boundText: 'は 琵琶の 音に 聞き入って 動けない！',
      chance: 0.2, bind: true,
      text: '玉都が、もう いちど 琵琶を かき鳴らした！',
    },
    biteName: 'まきつき',
    introText: '池の ほとりに 若い 武士が 立っている……いや、水に 映る 影は 大蛇だ！',
    tellLines: [
      'むかし、大悲山の 薬師堂で、玉都という 琵琶法師が 琵琶を 弾いていたの。',
      '池の 大蛇が 武士に 化けて 来て、「この 地に 大雨を 降らせて、大沼に したい」と 言ったのよ。',
      '玉都は 迷った 末に、殿様に 知らせた。殿様は、大蛇の 苦手な 鉄の 釘を 山や 谷に 打たせたの。',
    ],
    // 紙芝居（本人 10/2「次回以降全て」）＝影絵4枚＋しおりの声4束。台本とプロンプト＝art_src/紙芝居_1章相馬.md。絵と声が届くまでは文字だけで流れる
    story: {
      tell: [
        { img: 'assets/story/daihisan_1.png', voice: 'assets/story/daihisan_1.mp3', text: 'むかし、大悲山の 薬師堂に、玉都という 琵琶法師が こもって、琵琶を 弾いていたの。ある日、堂の 前の 池から、若い 武士が たずねて 来た。' },
        { img: 'assets/story/daihisan_2.png', voice: 'assets/story/daihisan_2.mp3', text: '武士の 正体は、池の 大蛇。「体が 大きくなって、池に 住めない。この 地に 大雨を 降らせて、大沼に したい」と 打ち明けたのよ。' },
        { img: 'assets/story/daihisan_3.png', voice: 'assets/story/daihisan_3.mp3', text: '玉都は 迷った 末に、小高の 殿様へ 知らせた。殿様は、大蛇の 苦手な 鉄の 釘を、山や 谷に 打たせたの。……その 大蛇が、いま、よみがえったのよ。' },
      ],
      after: [
        { img: 'assets/story/daihisan_4.png', voice: 'assets/story/daihisan_4.mp3', text: 'ほんとうの お話では、大蛇は 玉都を さらったけれど、殿様の 陣営に 退治されたの。大悲山には いまも 古い 石仏が 残り、大蛇の 物語を 伝えているのよ。' },
      ],
    },
    revealText: '大悲山の大蛇の 弱点が 明かされた！ 鉄の釘が よく効くように なった。',
    restoreLines: [
      '大蛇は 鉄の 釘に 動きを 封じられ、池の 底へ 沈んでいった……',
      '大悲山に、琵琶の 音だけが 静かに 残った。',
    ],
    hosoku: 'ほんとうの お話では、玉都は 迷った 末に 殿様へ 大蛇の たくらみを 知らせたの。大蛇は 玉都を さらったけれど、鉄の 釘で 退治されたと 伝わるのよ。',
    reward: '大蛇の 大雨が 止んで、北の 浜街道の もやが 晴れた！',
    loseLines: ['旅の者たちは 力つきた……', '大悲山に、雨の 音だけが 降りつづいている……'],
  },
};
