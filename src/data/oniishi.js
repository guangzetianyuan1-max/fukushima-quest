// お城クエスト 二本松城のお題 鬼石の鬼（10/7 本人「二本松＝鬼石の鬼（安達太良山）」）
// 話（安達地方広域行政組合「あだち野のむかし物語」）：原瀬村才木から深堀へ行く街道に安達太良山の鬼が現れ、旅人や村人を襲う。若者の大三が名乗り出て、酒や魚を背負って行く。
// 川辺で水を飲む鬼に食べさせ飲ませながら静かに言い聞かせると、鬼は改心し、自分に似た石を道の端に置いて山へ帰った＝鬼石。のち大江山の酒呑童子に（語りだけ）
// ⚠首をはねる場面と墓（寺）は出さない。弱点＝「大三の もてなし」
import { BASIC_ITEMS } from './basic_items.js?v=359';

export const ONIISHI = {
  art: {
    // 10/7 本人の Gemini の絵（①②・必殺技の 挿絵2枚・背景）
    dark: 'assets/oniishi_dark.png', light: 'assets/oniishi_light.png', bg: 'assets/bg_oniishi.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['motenashi'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    motenashi: {
      name: "大三の もてなし", cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: "大三が 鬼に 酒と 魚を ふるまった 話を 思い出し、静かに 語りかけた！ 鬼の 手が 止まった！",
      plainText: "声は 川の 音に まぎれた……",
    },
  },
  enemy: {
    id: 'oniishi',
    name: "安達太良山の鬼",
    episode: "お城のお題", // 10/7 本人「この5話は例外だから数えなくて良い」＝話数を 付けない
    tale: "鬼石の鬼",
    place: "福島県二本松市",
    autoWinTarget: 0.85, // お城クエスト（二本松城）（10/7）
    // 強さ＝仮（10/6）。tests/_autotune.mjs で 代表の5組の平均を 目安に 合わせる
    expectLv: 14, // ⭐10/9 本人「いわきの殿様クエストの鬼が強い。エリアレベル相当に」＝お題が 出る 時期（その 章の 最後の ボスの あと）の レベル（前＝16）
    // 10/9 お題が 出る レベルで 合わせ直した（いちばん 弱い 組でも 勝率 0.72 以上・前＝hp 950・atk 165）
    hp: 760, atk: 157, def: 120, agi: 12,
    bgm: 'oniishi', // 自分の 戦いの曲（10/7 本人「BGMを変えて」）
    side: true, // お城クエストの 寄り道（castle.js の SIDE_BOSSES）
    weakness: 'motenashi',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: "鬼の 大石", kind: 'one', chance: 0.24, power: 117, flash: [190, 170, 140], sfx: 'oishi', cutin: 'assets/cutin/oniishi_ishi.png' },
    special2: { name: "山の おたけび", chance: 0.12, power: 59, stun: 1, flash: [255, 120, 80], sfx: 'otakebi', cutin: 'assets/cutin/oniishi_otakebi.png' },
    biteName: "太い 腕で なぐる",
    introText: "安達太良山の ふもとの 川辺で、大きな 鬼が 水を 飲んでいた。……黒い もやを まとい、こちらを にらんだ！",
    tellLines: [
      "安達太良山には むかし 鬼が すんでいて、原瀬の 才木から 深堀へ ゆく 街道に たびたび あらわれたの。",
      "旅の 人や 山仕事の 村人が おそわれ、村の 人は 困りはてたわ。",
      "……若者の 大三は、鬼に 食べさせ 飲ませながら、静かに 言い聞かせたと 伝わるの。",
    ],
    // 紙芝居は 出さない（10/7 本人「お城クエストで紙芝居は要らない」）＝語りは tellLines・結末は hosoku の 文で
    revealText: "安達太良山の鬼の 弱点が 明かされた！ 大三の もてなしが よく効くように なった。",
    restoreLines: [
      "川辺の 風に、黒い もやが ほどけていく……",
      "鬼は 道の 端に 大きな 石を ひとつ 置き、安達太良山へ 帰っていった。",
    ],
    hosoku: "ほんとうの お話では、大三は「人が 通らないので 腹が へっているんだな」と 思い、鬼に 酒と 魚を ふるまって、悪さを しないよう 静かに 言い聞かせたの。鬼は 心を あらため、自分に 似た 形の 石を 道の 端に 置いて 山へ 帰った。それが「鬼石」よ。その 鬼は のちに 都の 近くの 大江山へ 行き、酒呑童子と よばれたとも 伝わるわ。",
    reward: "安達太良山の もやが 晴れた！ 二本松の お殿様に 知らせよう。",
    loseLines: ['旅の者たちは 力つきた……', "街道に、鬼の 足音が ひびいている……"],
  },
};
