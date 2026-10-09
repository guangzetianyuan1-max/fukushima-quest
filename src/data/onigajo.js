// お城クエスト 磐城平城のお題 鬼ヶ城山の鬼（10/7 本人「言い伝えのある怪物だけ」「平＝鬼ヶ城山の鬼」）
// 話（広報いわき 2023年3月号「鬼ヶ城山と地域づくり」）：川前町上桶売の鬼ヶ城山（標高887m）は矢大臣山に次ぐ市第二の高峰。山頂の大岩に鬼が住み、村人に岩を投げつけたり悪さをしたりしていたという鬼伝説。
// 地方自治研究機構「鬼の条例」（孫引き）：朝廷の圧政に抵抗したといわれる大多鬼丸の一味とも
// ⚠退治の話・鬼の名前・岩を投げた理由は 公的な資料に無い＝紙芝居④で「伝わっていない」と補う。弱点＝「里の語り」（いまも川前の人が語り継ぐ＝忘れの もやに効く）
import { BASIC_ITEMS } from './basic_items.js?v=322';

export const ONIGAJO = {
  art: {
    // 10/7 本人の Gemini の絵（②は 左の 脚の かけらと もやを fix_keep_largest.py で 消した）
    dark: 'assets/onigajo_dark.png', light: 'assets/onigajo_light.png', bg: 'assets/bg_onigajo.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['satogatari'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    satogatari: {
      name: "里の語り", cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: "川前の 里の 人が 語り継ぐ 鬼の 話を、声に 出して 語った！ 鬼の 手が 止まった！",
      plainText: "声は 山の 風に まぎれた……",
    },
  },
  enemy: {
    id: 'onigajo',
    name: "鬼ヶ城山の鬼",
    episode: "お城のお題", // 10/7 本人「この5話は例外だから数えなくて良い」＝話数を 付けない
    tale: "鬼ヶ城山の鬼",
    place: "福島県いわき市",
    autoWinTarget: 0.85, // お城クエスト（磐城平城）（10/7）
    // 強さ＝仮（10/6）。tests/_autotune.mjs で 代表の5組の平均を 目安に 合わせる
    expectLv: 5, // ⭐10/9 本人「いわきの殿様クエストの鬼が強い。エリアレベル相当に」＝お題が 出る 時期（その 章の 最後の ボスの あと）の レベル（前＝7）
    // 10/9 お題が 出る レベルで 合わせ直した（いちばん 弱い 組でも 勝率 0.72 以上・前＝hp 420・atk 101）
    hp: 420, atk: 65, def: 66, agi: 10,
    bgm: 'onigajo', // 自分の 戦いの曲（10/7 本人「BGMを変えて」）
    side: true, // お城クエストの 寄り道（castle.js の SIDE_BOSSES）
    weakness: 'satogatari',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: "大岩 投げ", kind: 'one', chance: 0.24, power: 35, flash: [200, 170, 120], sfx: 'oiwa', cutin: 'assets/cutin/onigajo_iwa.png' },
    biteName: "太い 腕で なぐる",
    introText: "鬼ヶ城山の 頂の 大岩の 上に、大きな 鬼の 影が 立ちあがった。……黒い もやを まとい、岩を つかんでいる！",
    tellLines: [
      "いわきの 川前に ある 鬼ヶ城山は、いわきで 二番目に 高い 山なの。",
      "山頂の 大岩には 鬼が すんでいて、村の 人に 岩を 投げつけたり、悪さを したと 伝わるわ。",
      "……川前の 里の 人たちは、いまも この 鬼の 話を 語り継いでいるの。",
    ],
    // 紙芝居は 出さない（10/7 本人「お城クエストで紙芝居は要らない」）＝語りは tellLines・結末は hosoku の 文で
    revealText: "鬼ヶ城山の鬼の 弱点が 明かされた！ 里の語りが よく効くように なった。",
    restoreLines: [
      "山頂の 風に、黒い もやが ほどけていく……",
      "大岩の 上の 鬼の 影は、ふもとの 里を ながめ、静かに 岩の 中へ 消えた。",
    ],
    hosoku: "ほんとうの お話では、鬼が 退治された 話は 伝わっていないの。鬼の 名前も、なぜ 岩を 投げたのかも わからない。それでも 川前の 人たちは、山の 名と いっしょに 鬼の 話を 語り継いで、いまも 地域づくりに 生かしているわ。",
    reward: "鬼ヶ城山の もやが 晴れた！ 平の お殿様に 知らせよう。",
    loseLines: ['旅の者たちは 力つきた……', "鬼ヶ城山に、岩の 転がる 音が ひびいている……"],
  },
};
