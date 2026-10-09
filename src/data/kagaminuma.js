// お城クエスト 鶴ヶ城のお題 鏡ヶ沼の大蛇（10/7 本人「会津＝鏡ヶ沼の大蛇」）
// 話（下郷町観光協会 ガイド資料「鏡ヶ沼の怪」・妖怪DB）：狩人の大蔵が愛犬と三本槍ヶ岳へ鹿狩りに行き、霧で迷って沼に出る。蛙の皮の笛を吹くと霧が晴れ、沼の真ん中の美しい女性がニッと笑う。
// 犬が吠えて我に返った大蔵が撃つと、大風・稲妻・雷・豪雨になり、女性は青白い大蛇に変わる。逃げる途中で転げ込んだ温かい水たまりが後の甲子温泉の湯。家に子蛇が見え、大峠に石の祠を造り「お仙の宮」と祀ると見えなくなった
// ⚠裸身の描写は出さない（「沼の真ん中に立つ」まで）・祠は供養の場（巣にしない）。弱点＝「蛙の皮の笛」
import { BASIC_ITEMS } from './basic_items.js?v=335';

export const KAGAMINUMA = {
  art: {
    // 10/7 本人の Gemini の絵（①②・必殺技の 挿絵2枚・背景）
    dark: 'assets/kagaminuma_dark.png', light: 'assets/kagaminuma_light.png', bg: 'assets/bg_kagaminuma.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['kaerubue'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    kaerubue: {
      name: "蛙の皮の笛", cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: "大蔵が 霧を 晴らした 蛙の 皮の 笛を 吹いた！ 霧が 晴れ、大蛇の 姿が あらわに なった！",
      plainText: "笛の 音は 霧に 吸いこまれた……",
    },
  },
  enemy: {
    id: 'kagaminuma',
    name: "鏡ヶ沼の大蛇",
    episode: "お城のお題", // 10/7 本人「この5話は例外だから数えなくて良い」＝話数を 付けない
    tale: "鏡ヶ沼の大蛇",
    place: "福島県下郷町",
    autoWinTarget: 0.85, // お城クエスト（鶴ヶ城）（10/7）
    // 強さ＝仮（10/6）。tests/_autotune.mjs で 代表の5組の平均を 目安に 合わせる
    expectLv: 24, // ⭐10/9 本人「いわきの殿様クエストの鬼が強い。エリアレベル相当に」＝お題が 出る 時期（その 章の 最後の ボスの あと）の レベル（前＝25）
    hp: 900, atk: 343, def: 190, agi: 15,
    bgm: 'kagaminuma', // 自分の 戦いの曲（10/7 本人「BGMを変えて」）
    side: true, // お城クエストの 寄り道（castle.js の SIDE_BOSSES）
    weakness: 'kaerubue',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: "大風と 稲妻", chance: 0.26, power: 122, flash: [220, 220, 255], sfx: 'inazuma', cutin: 'assets/cutin/kagaminuma_inazuma.png' },
    special2: { name: "沼の 大雨", chance: 0.14, power: 132, flash: [90, 140, 230], sfx: 'ooame', cutin: 'assets/cutin/kagaminuma_ooame.png' },
    trick: { kind: 'poisonall', chance: 0.12, text: '鏡ヶ沼の大蛇は 青白い 毒の 霧を 吐いた！' }, // 蛇の ボスは 毒の 息で 全員を 毒に（10/7 本人「蛇のボスは全員に毒」）
    biteName: "青白い 尾で 打つ",
    introText: "霧の 鏡ヶ沼の まん中に、女性の 影が 立ち、ニッと 笑った。……影は みるみる 青白い 大蛇に 変わっていく！",
    tellLines: [
      "甲子の 山の 奥、三本槍ヶ岳の 北に、手鏡の 形を した 鏡ヶ沼が あるの。",
      "狩人の 大蔵は 霧で 道に 迷い、沼に 出た。蛙の 皮の 笛を 吹くと、霧が 晴れたのよ。",
      "……沼の 主は、青白い 大蛇だったと 伝わるわ。",
    ],
    // 紙芝居は 出さない（10/7 本人「お城クエストで紙芝居は要らない」）＝語りは tellLines・結末は hosoku の 文で
    revealText: "鏡ヶ沼の大蛇の 弱点が 明かされた！ 蛙の皮の笛が よく効くように なった。",
    restoreLines: [
      "沼の 霧が 晴れ、黒い もやが ほどけていく……",
      "青白い 大蛇は 手鏡の ような 水面に もぐり、山は 静かに なった。",
    ],
    hosoku: "ほんとうの お話では、大蔵が 鉄砲を 撃つと、大風と 雷と 大雨に なり、女性は 青白い 大蛇に 変わったの。逃げる とちゅうで ころげこんだ 温かい 水たまりが、のちの 甲子温泉の 湯だと いうわ。家に 帰ると 子蛇の 影が 見え、大峠に 石の 祠を 造って「お仙の宮」と まつると、子蛇は 見えなくなったと 伝わるの。",
    reward: "鏡ヶ沼の もやが 晴れた！ 会津の お殿様に 知らせよう。",
    loseLines: ['旅の者たちは 力つきた……', "鏡ヶ沼に、女性の 笑い声が ひびいている……"],
  },
};
