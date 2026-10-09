// 第三十三話（10/9 繰り下げ・前＝第三十二話） 橋場のばんば（参道の 門番＝大将戦の 前）（終章 南会津・10/8 本人「お伊勢参りの台本は橋場のばんばと戦う」「スタンプが揃っていない場合、敵は現れず、橋場のばんばはただニコニコしている」）
// 話（確かめた事・10/8）：檜枝岐村居平の 石像の 姥神。鎮守神社（舞台）へ 続く 参道の 途中。もとは 子どもを 水難から 守る 水神とされ、
//   頭に お椀を かぶせて 祈ると 願いが かなうと 伝わる。縁結び・縁切りの 願いで はさみを 納める（⚠切れる／切れないの 対応は 出どころで 逆＝言わない）。絵馬も 多い
//   出どころ＝travel.watch.impress.co.jp/docs/news/tabirepo/1436238.html ほか
// 紙芝居の 影絵＝本人の 動画「橋場のばんば」の 影絵（banba/橋場のばんば）C10・C34・C13・C38 を 正方形に 切って 使う（10/8 本人「橋場のばんばは影絵を使ってください」）
// ⭐ばんばの 必殺技＝縁切りの はさみ（本人「はさみは必殺技に使って」）・弱点＝お椀の 願い。勝つと「お伊勢参りの 台本」（game.js の RELIC_FROM_BOSS・台本を 預かっていたのは ゲームの 作り）
// 筋の芯（10/8 本人）＝もやは 大将の 怨念＝ここでは「山を こえて 流れてきた もや」とだけ 言う（明かすのは 大将の 戦い）
import { BASIC_ITEMS } from './basic_items.js?v=304';

export const BANBA = {
  art: {
    // 10/8 夜 本人が Gemini で 描いた（yv37dh・jcb5x1・vk2w6b＝art_src/sets_api.json の banba）
    dark: 'assets/banba_dark.png', light: 'assets/banba_light.png', bg: 'assets/bg_banba.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['owan'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    owan: {
      name: 'お椀の 願い', cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: 'ばんばさまの 頭に そっと お椀を かぶせて 祈った！ 願いが とどいて、もやが ゆらぐ！',
      plainText: 'お椀の 願いは、黒い もやに さえぎられた……',
    },
  },
  enemy: {
    id: 'banba',
    name: '橋場の ばんば',
    episode: '第三十三話', // 10/9 繰り下げ
    tale: '橋場のばんば',
    place: '福島県檜枝岐村',
    autoWinTarget: 0.8, // 終章（目安0.70）の 中ボス＝少し 高め。10/8 0.75→0.80＝守りの技の無い組・術の組が 0.39〜0.46 まで 落ちた（沼御前と 同じ 手当て）
    // 強さ＝tests/_autotune.mjs で 代表の 6組の 平均を 目安に 合わせる（10/8）
    expectLv: 27, // 10/8 第三十二話（家来・姫の霊 27 の あと・大将 28 の 前）。前は 26＝話の 順で 調べて 直した
    hp: 1118, atk: 477, def: 150, agi: 14,
    bgm: 'banba',
    weakness: 'owan',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: '縁切りの はさみ', kind: 'one', chance: 0.22, power: 185, flash: [200, 225, 255], sfx: 'hasami', cutin: 'assets/cutin/banba_hasami.png' },
    special2: { name: '縁結びの 紐', kind: 'silence', chance: 0.12, power: 130, flash: [255, 150, 190], sfx: 'himo', cutin: 'assets/cutin/banba_himo.png' },
    biteName: '石の 手で 打つ',
    introText: '参道の 雪が 舞いあがり、石の ばんばさまが 黒い もやを まとって 立ちあがった！ その手には、大きな はさみ……！',
    tellLines: [
      '檜枝岐の 参道には、橋場の ばんばと よばれる 石の 姥神さまが いるの。',
      'もとは 子どもを 水難から 守る 神さまで、縁結びや 縁切りの 願いで はさみを 納めるのよ。',
      '……頭に お椀を かぶせて 祈ると、願いが かなうと 伝わっているわ。',
    ],
    story: {
      tell: [
        { img: 'assets/story/banba_1.png', voice: 'assets/story/banba_1.mp3', text: '檜枝岐の 鎮守さまへ 続く 参道に、橋場の ばんばと よばれる 石の 姥神さまが いるの。子どもを 水難から 守る 神さまで、頭に お椀を かぶせて 祈ると、願いが かなうと 伝わるわ。' },
        { img: 'assets/story/banba_2.png', voice: 'assets/story/banba_2.mp3', text: '村の 人は、縁を 結びたい ときも、縁を 切りたい ときも、ばんばさまに はさみを 納めてきた。ばんばさまは にこにこと、村の 願いを 聞いてきたの。' },
        { img: 'assets/story/banba_3.png', voice: 'assets/story/banba_3.mp3', text: 'けれど 山を こえて 流れてきた 黒い もやが、ばんばさまを 呑みこんで しまった……。思い出させて あげましょう。お椀の 願いを。' },
      ],
      after: [
        { img: 'assets/story/banba_4.png', voice: 'assets/story/banba_4.mp3', text: 'ほんとうの お話では、ばんばさまは いまも 参道で 村を 見守って いるの。はさみや 絵馬が たくさん 納められて、縁結びと 縁切りの 願いを 聞いて くれると 伝わるわ。' },
      ],
    },
    revealText: '橋場の ばんばの 弱点が 明かされた！ お椀の 願いが よく効くように なった。',
    restoreLines: [
      '参道に、黒い もやが ほどけて 消えていく……',
      'ばんばさまは、また にこにこと ほほえんで いる。',
    ],
    hosoku: 'ほんとうの お話では、ばんばさまは いまも 参道で 村を 見守って いるの。はさみや 絵馬が たくさん 納められて、縁結びと 縁切りの 願いを 聞いて くれると 伝わるわ。',
    reward: '参道の もやが 晴れた！ ばんばさまが「お伊勢参りの 台本」を そっと 差し出した。',
    loseLines: ['旅の者たちは 力つきた……', '雪の 参道で、はさみの 音が ひびいている……'],
  },
};
