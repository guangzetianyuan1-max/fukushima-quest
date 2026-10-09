// 最終話（10/9・前＝第三十三話） 平家の落人（大将・手下の 前座の あと）（終章 南会津・最後の 敵・10/6 本人「平家の落人の大将（名は伝わらない人）と手下」）
// ⭐筋の芯（10/8 本人）＝大将の 怨念が 福島県内に もやを 作っていた。4人が 制覇すると もやが 晴れ、平家の 落人も 成仏する
//   怨念は 悪で なく、弔われず 忘れられた 無念として 語る（悪者に しない・倒すと 礼を 言って 成仏）
// 確かめた事：檜枝岐には 平家の 落人が 住みついたと 伝わり、村に 多い 平野姓の 家紋は 揚羽蝶（たびこふれ）。⛔大将の 名は 伝わらない＝名を 出さない
//   舞台＝鎮守神社の 境内の 茅葺きの 舞台（いまも 歌舞伎が 奉納される）＝「怪物の 巣」に しない（最後の 演目として 舞台の 上で 戦う）
// 紙芝居の 影絵＝本人の 動画「平家の落人」（第5回）の 影絵 C19・C41・C42・C53 を 正方形に 切って 使う（10/8 本人「大将戦では昔話(影絵)を入れて欲しい。平家の落人のやつ」）
// 弱点＝昔話の 語り返し（設計書 10/1「旅の者が、これまで集めた昔話を語り返す」）。勝つと FieldScene が 終わりの 場面（EndingScene）へ
import { BASIC_ITEMS } from './basic_items.js?v=322';

export const TAISHO = {
  art: {
    // 10/8 夜 本人が Gemini で 描いた（czqnw2・② wmaoo5＝art_src/sets_api.json の taisho）。背景＝本人の 動画の 影絵の 檜枝岐の 舞台（banba/橋場のばんば C27・本人「大将戦の背景は、影絵の檜枝岐歌舞伎の舞台に」・真ん中を 縦に 41% 切る）
    dark: 'assets/taisho_dark.png', light: 'assets/taisho_light.png', bg: 'assets/bg_taisho.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['katarigaeshi'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    katarigaeshi: {
      name: '昔話の 語り返し', cost: 12, power: 46, weakMult: 3, plainMult: 0.5,
      weakText: '旅の者は、これまで 集めた 昔話を ひとつずつ 語り返した！ 大将の 怨念が ほどけていく！',
      plainText: '語りの 声は、怨念の もやに のまれた……',
    },
  },
  enemy: {
    id: 'taisho',
    name: '落人の 大将',
    episode: '最終話', // 10/9 本人「ラスボスは最終話にしてください」（前＝第三十三話）
    tale: '平家の落人',
    place: '福島県檜枝岐村',
    autoWinTarget: 0.75, // 終章の 最後（設計書 10/1「終章70%」）。10/8 0.70→0.75＝0.70 では 守りの技の無い組が 0.25 まで 落ちた（大技を 減らしても 届かない）
    expectLv: 28,
    // 10/9 本人「子分、ラスボスが弱い、全然技を使わない」＝田島の 8段目で 3〜6ターンで 倒れ 技を 出す 前に 終わった ⇒ 体力 1.35倍・必殺技を 出やすく・攻めを 合わせ直した（前＝hp 1200・atk 735・必殺技 25%/6%）
    hp: 1620, atk: 1099, def: 150, agi: 16,
    bgm: 'taisho',
    weakness: 'katarigaeshi',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: '怨念の 黒い 炎', kind: 'poison', chance: 0.3, power: 411, flash: [120, 60, 160], sfx: 'onnen', cutin: 'assets/cutin/taisho_onnen.png' },
    special2: { name: '源平の 太刀', kind: 'one', chance: 0.18, power: 522, flash: [255, 240, 200], sfx: 'genpei', cutin: 'assets/cutin/taisho_genpei.png' },
    biteName: '太刀で 斬りつける',
    introText: '幕の 奥から、揚羽蝶の 鎧の 大将が あらわれた！ 「福島の 道を ふさいだ もやは、わが 怨念……。弔われず、忘れられた 者たちの 無念よ！」',
    tellLines: [
      'この 村には、平家の 落人が 山を こえて 住みついたと 伝わるの。大将の 名は、伝わって いないわ。',
      '村の 人は、この 舞台で 物語を 演じて、語り継いできた。',
      '……忘れられた 無念なら、語って 返せば いいのよ。わたしたちが 集めた 昔話を。',
    ],
    story: {
      tell: [
        { img: 'assets/story/taisho_1.png', voice: 'assets/story/taisho_1.mp3', text: '檜枝岐には、むかし 平家の 落人が 山を こえて 住みついたと 伝わるの。村に 多い 平野の 家の 紋は、平家と 同じ 揚羽蝶。けれど 大将の 名は、伝わって いないわ。' },
        { img: 'assets/story/taisho_2.png', voice: 'assets/story/taisho_2.mp3', text: '大将は 弔われる ことなく、名も 忘れられて しまったの。その 無念は 怨念と なって、福島じゅうに 黒い もやを 流しだした。' },
        { img: 'assets/story/taisho_3.png', voice: 'assets/story/taisho_3.mp3', text: 'もやは 道を ふさぎ、昔話の 主たちを 呑みこんだ……。わたしたちの 旅は、ずっと この 怨念を 晴らす 旅だったのね。さあ、語って 返しましょう。' },
      ],
      after: [
        { img: 'assets/story/taisho_4.png', voice: 'assets/story/taisho_4.mp3', text: '大将の 話は、このゲームの 語りなの。ほんとうに 伝わっているのは、檜枝岐に 平家の 落人が 住みついたと いう 言い伝え。この 舞台では、いまも 村の 人が 歌舞伎を 奉納して いるわ。' },
      ],
    },
    revealText: '落人の 大将の 弱点が 明かされた！ 昔話の 語り返しが よく効くように なった。',
    restoreLines: [
      '舞台に、黒い もやが ほどけて 消えていく……',
      '揚羽蝶の 鎧の 大将が、元の 姿を 取りもどした。',
    ],
    // 10/8 本人「成仏させてくれてありがとうと礼を言って欲しい」＝金の 光と 琵琶の 音（BattleScene.playBlessing）。（10/8 は 3Dの 大将 hgkt3d を 出したが 10/9 に 外した）
    blessing: {
      // ⛔10/9 本人「最後のボスの3Dは消してください。2Dの戦い後の姿で」＝image を 持たない（戻った 2Dの 姿 taisho_light の まま 光と お礼）。前＝taisho_3d.png
      lines: [
        '金色の 光が、大将を やさしく つつんだ。', // 10/9 2Dの まま＝「姿を あらわした」は 合わない
        // 10/8 本人「最後の大将のお礼の声は？」「自動録音して入れて欲しい」＝大将が 話す 2行に 声（Gemini TTS の Algenib＝男の 低い 声・art_src/gemini_tts.py --voice Algenib）
        { text: '大将「旅の 者たちよ。わしらの 無念を 語り返し、成仏させて くれて……ありがとう。」', voice: 'assets/story/taisho_bless_1.mp3' },
        { text: '大将「福島の 昔話を、これからも 語り継いで くだされ。」', voice: 'assets/story/taisho_bless_2.mp3' },
        '大将と 落人たちは、光に なって 空へ 昇っていった。',
      ],
    },
    hosoku: '大将の 話は、このゲームの 語りなの。ほんとうに 伝わっているのは、檜枝岐に 平家の 落人が 住みついたと いう 言い伝え。この 舞台では、いまも 村の 人が 歌舞伎を 奉納して いるわ。',
    reward: '福島じゅうの もやが 晴れた！',
    loseLines: ['旅の者たちは 力つきた……', '舞台に、怨念の 炎が ゆらめいている……'],
  },
};
