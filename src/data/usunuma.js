// お城クエスト 相馬中村城のお題 臼沼の大蛇（10/7）
// 話（妖怪DB『伝承文芸』2号 國學院大學民俗文学研究会 1964・話者 山田武高）：麦つきの手伝いに、どこから来たかわからない若者が来ると必ず臼がなくなる。若者は臼沼に住む大蛇だった。
// 弓の名手が大蛇を射止め、大蛇は痛みで大道巡りをしながら山を登った＝巡り平。射止めた矢を持っていくと子どもの夜泣きがやむとも。
// ⚠臼沼の今の場所は確かめられなかった＝鹿島の西の山すそに置く（ゲームの見立て）。弱点＝「名手の矢」
import { BASIC_ITEMS } from './basic_items.js?v=331';

export const USUNUMA = {
  art: {
    // 10/7 本人の Gemini の絵（①②・必殺技の 挿絵2枚・背景）
    dark: 'assets/usunuma_dark.png', light: 'assets/usunuma_light.png', bg: 'assets/bg_usunuma.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['meishu'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    meishu: {
      name: "名手の矢", cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: "弓の 名手が 大蛇を 射止めた 矢の 話を 思い出し、まっすぐ 放った！ 大蛇が 身を よじった！",
      plainText: "矢は 沼の 霧に 吸いこまれた……",
    },
  },
  enemy: {
    id: 'usunuma',
    name: "臼沼の大蛇",
    episode: "お城のお題", // 10/7 本人「この5話は例外だから数えなくて良い」＝話数を 付けない
    tale: "臼沼の大蛇",
    place: "福島県南相馬市",
    autoWinTarget: 0.85, // お城クエスト（相馬中村城）（10/7）
    // 強さ＝仮（10/6）。tests/_autotune.mjs で 代表の5組の平均を 目安に 合わせる
    expectLv: 9, // ⭐10/9 本人「いわきの殿様クエストの鬼が強い。エリアレベル相当に」＝お題が 出る 時期（その 章の 最後の ボスの あと）の レベル（前＝11）
    // 10/9 お題が 出る レベルで 合わせ直した（いちばん 弱い 組でも 勝率 0.72 以上・前＝hp 585・atk 106）
    hp: 585, atk: 77, def: 115, agi: 12,
    bgm: 'usunuma', // 自分の 戦いの曲（10/7 本人「BGMを変えて」）
    side: true, // お城クエストの 寄り道（castle.js の SIDE_BOSSES）
    weakness: 'meishu',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: "大蛇の 巻きつき", kind: 'one', chance: 0.22, power: 57, flash: [120, 200, 160], sfx: 'makitsuki', cutin: 'assets/cutin/usunuma_maki.png' },
    special2: { name: "沼の 大渦", chance: 0.14, power: 68, flash: [80, 140, 220], sfx: 'ouzu', cutin: 'assets/cutin/usunuma_uzu.png' },
    trick: { kind: 'poisonall', chance: 0.12, text: '臼沼の大蛇は 毒の 息を 吐いた！' }, // 蛇の ボスは 毒の 息で 全員を 毒に（10/7 本人「蛇のボスは全員に毒」）
    biteName: "大きな 口で かみつく",
    introText: "臼沼の 水面が ふくらみ、大きな 蛇が 鎌首を もたげた。……黒い もやを まとっている！",
    tellLines: [
      "鹿島の 臼沼には、むかし 大蛇が すんでいたと 伝わるの。",
      "麦つきの 手伝いに、どこから 来たか わからない 若者が 来ると、きまって 臼が なくなったのよ。",
      "……その 若者こそ 臼沼の 大蛇。弓の 名手が 射止めたと 伝わるわ。",
    ],
    // 紙芝居は 出さない（10/7 本人「お城クエストで紙芝居は要らない」）＝語りは tellLines・結末は hosoku の 文で
    revealText: "臼沼の大蛇の 弱点が 明かされた！ 名手の矢が よく効くように なった。",
    restoreLines: [
      "沼の 風に、黒い もやが ほどけていく……",
      "大蛇は 静かに 沼の 底へ 帰り、水面に 丸い 波だけが 残った。",
    ],
    hosoku: "ほんとうの お話では、弓の 名手が 大蛇を 射止めたの。大蛇は 痛みで 大きく 回りながら 山を 登り、そこは「巡り平」と よばれた。射止めた 矢を 持っていくと、子どもの 夜泣きが やむとも いわれたわ。",
    reward: "臼沼の もやが 晴れた！ 相馬の お殿様に 知らせよう。",
    loseLines: ['旅の者たちは 力つきた……', "臼沼に、臼を つく 音が ひびいている……"],
  },
};
