// 第三十三話 平家の落人の 前座＝舞台の落人の手下（話数は 大将と 同じ・紙芝居は 大将戦だけ＝episodes.js の PRELUDE）（終章 南会津・10/8 本人「手下の落人は大将の前に1戦」）
// ⚠手下の 話は ゲームの 作り＝紙芝居④で「このゲームの語り」と 言う。伝わるのは 檜枝岐に 平家の 落人が 住みついたと いう 言い伝えと、
//   墓を 廟所、便所を 雪隠と よぶ など 落人の 言い伝えを 思わせる ことばや 風習が 残る こと（たびこふれ）
// 2体同時（twin＝毎ターン 二人とも 動く・体力は ひとつ）。弱点＝揚羽蝶の 旗（主の 紋に 膝を つく）
// 駒ヶ岳の 家来（ochikerai）とは 姿と 名前を 分ける＝こちらは 鎧の 弓取りと 槍持ち
// 勝つと 地図へ 戻らず そのまま 大将（taisho）へ（FieldScene の FINAL_CHAIN）
import { BASIC_ITEMS } from './basic_items.js?v=280';

export const TESHITA = {
  art: {
    // 10/8 夜 本人が Gemini で 描いた（e0ja1y・g82l9g＝art_src/sets_api.json の teshita）。背景＝雪の 広場と 篝火 二つ（9si4k0・上を 12％ 切る＝篝火を 題の 帯の 上へ）
    dark: 'assets/teshita_dark.png', light: 'assets/teshita_light.png', bg: 'assets/bg_teshita.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['agehahata'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    agehahata: {
      name: '揚羽蝶の 旗', cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: '揚羽蝶の 旗を 高く かかげた！ 手下たちは 主の 紋を 見て、思わず 膝を ついた！',
      plainText: '旗は、黒い もやに かすんで 見えない……',
    },
  },
  enemy: {
    id: 'teshita',
    name: '落人の 手下たち',
    episode: '最終話', // 10/9 本人「ラスボスは最終話にしてください」（前＝第三十三話）
    tale: '平家の落人（手下）',
    place: '福島県檜枝岐村',
    autoWinTarget: 0.8, // 終章の 中ボス（10/8）
    expectLv: 28,
    // 10/9 本人「子分、ラスボスが弱い、全然技を使わない」＝田島の 8段目で 3〜6ターンで 倒れ 技を 出す 前に 終わった ⇒ 体力 1.35倍・必殺技を 出やすく・攻めを 合わせ直した（前＝hp 1200・atk 171・必殺技 20%/12%）
    hp: 1620, atk: 158, def: 150, agi: 15,
    bgm: 'teshita',
    weakness: 'agehahata',
    mist: { min: 1, max: 3, rise: 0.2 },
    twin: { names: ['落人の 弓取り', '落人の 槍持ち'], bites: ['弓で 射る', '槍で 突く'] },
    special: { name: '矢の 雨', kind: 'all', chance: 0.3, power: 128, flash: [255, 220, 160], sfx: 'yanoame', cutin: 'assets/cutin/teshita_yanoame.png' },
    special2: { name: '鬨の 声', kind: 'all', chance: 0.22, power: 99, flash: [255, 120, 80], sfx: 'tokinokoe', cutin: 'assets/cutin/teshita_tokinokoe.png' },
    biteName: '槍で 突く',
    introText: '舞台の 幕が 上がると、古い 鎧の 弓取りと 槍持ちが 立ちはだかった！ 「大将の 御前、通しは せぬ！」',
    tellLines: [
      'この 村には、平家の 落人が 山を こえて 住みついたと 伝わるの。',
      '墓を 廟所と よぶ など、落人の 言い伝えを 思わせる ことばも 残っているわ。',
      '……手下たちは、いまも 主の 紋を 待っているのね。揚羽蝶の 旗を 見せて あげましょう。',
    ],
    revealText: '落人の 手下たちの 弱点が 明かされた！ 揚羽蝶の 旗が よく効くように なった。',
    restoreLines: [
      '舞台に、黒い もやが ほどけて 消えていく……',
      '手下たちは 弓と 槍を おさめ、幕の 奥を 指さした。「大将が、お待ちだ……」',
    ],
    hosoku: '手下たちは 道を 開けたわ。幕の 奥で、大将が 待っている。', // 10/8 本人「このゲームの語りと2回は要らない」＝断りは 大将の 紙芝居④の 1回だけ
    reward: '手下たちの もやが 晴れた！ 幕の 奥に、大将の 影が 見える……',
    loseLines: ['旅の者たちは 力つきた……', '舞台に、鬨の 声が ひびいている……'],
  },
};
