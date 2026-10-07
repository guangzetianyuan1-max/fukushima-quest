// お城クエスト 白河小峰城のお題 剣桂の鬼神（10/7）
// 話（福島県「しらかわ 史跡」）：高さ45m・幹の太さ9.7mの桂の木（推定樹齢370年）。この地に住み人々を苦しめた鬼神が、白河藩主・松平定信公の剣によってこの桂の木に封じ込められたとされる。
// 後に旅人などから「剣桂」と呼ばれ、厚い信仰を集めた。森の巨人たち100選。奇岩や滝が点在する新甲子遊歩道から見られる
// ⚠話は短い・そばに祠（祠は出さない）。弱点＝「定信公の剣」
import { BASIC_ITEMS } from './basic_items.js?v=235';

export const KENKATSURA = {
  art: {
    // 10/7 本人の Gemini の絵（黄金の 葉を 残す degreen_keep_yellow・背景の 横の 継ぎ目は fix_seam.py で なじませた）
    dark: 'assets/kenkatsura_dark.png', light: 'assets/kenkatsura_light.png', bg: 'assets/bg_kenkatsura.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['sadanobu'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    sadanobu: {
      name: "定信公の剣", cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: "松平定信公が 鬼神を 封じた 剣の 話を 思い出し、高く かかげた！ 鬼神が 桂の 木へ 引きよせられる！",
      plainText: "剣の 光は 森の 影に まぎれた……",
    },
  },
  enemy: {
    id: 'kenkatsura',
    name: "剣桂の鬼神",
    episode: "第三十三話",
    tale: "剣桂の鬼神",
    place: "福島県西郷村",
    autoWinTarget: 0.85, // お城クエスト（白河小峰城）（10/7）
    // 強さ＝仮（10/6）。tests/_autotune.mjs で 代表の5組の平均を 目安に 合わせる
    expectLv: 21,
    hp: 1000, atk: 240, def: 150, agi: 14,
    bgm: 'tengu', // ⏳曲は tengu を 借りる
    side: true, // お城クエストの 寄り道（castle.js の SIDE_BOSSES）
    weakness: 'sadanobu',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: "森の 嵐", chance: 0.24, power: 125, flash: [120, 200, 120], sfx: 'moriarashi', cutin: 'assets/cutin/kenkatsura_arashi.png' },
    special2: { name: "鬼神の 雷", chance: 0.14, power: 146, flash: [255, 255, 160], sfx: 'kishinrai', cutin: 'assets/cutin/kenkatsura_kaminari.png' },
    biteName: "大きな 腕で なぎはらう",
    introText: "新甲子の 森の 奥、天を つく 桂の 大木が ゆれ、幹から 鬼神の 影が ぬけ出した。……黒い もやを まとっている！",
    tellLines: [
      "西郷村の 森の 奥には、高さ 45メートルもの 桂の 大木が あるの。",
      "むかし この 地に すみ、人びとを 苦しめた 鬼神が いたと 伝わるわ。",
      "……白河藩主・松平定信公の 剣が、鬼神を 桂の 木に 封じこめたと いうの。",
    ],
    story: {
      tell: [
        { img: 'assets/story/kenkatsura_1.png', voice: 'assets/story/kenkatsura_1.mp3', text: "白河の 西、西郷村の 森の 奥に、高さ 45メートル、幹の 太さ 9.7メートルもの 桂の 大木が 立っているの。奇岩や 滝の ある 新甲子の 遊歩道から 見られるわ。" },
        { img: 'assets/story/kenkatsura_2.png', voice: 'assets/story/kenkatsura_2.mp3', text: "むかし、この 地に すむ 鬼神が、人びとを 苦しめていたと 伝わるの。" },
        { img: 'assets/story/kenkatsura_3.png', voice: 'assets/story/kenkatsura_3.mp3', text: "いまは 話も 忘れられて、鬼神は 黒い もやに 呑まれ、桂の 木から ぬけ出して しまった……。思い出させて あげましょう。定信公の 剣を。" },
      ],
      after: [
        { img: 'assets/story/kenkatsura_4.png', voice: 'assets/story/kenkatsura_4.mp3', text: "ほんとうの お話では、白河藩主・松平定信公の 剣によって、鬼神は この 桂の 木に 封じこめられたと されるの。のちに 旅人たちは この 木を「剣桂」と よび、あつく 信仰したわ。いまは 森の 巨人たち 百選にも えらばれているの。" },
      ],
    },
    revealText: "剣桂の鬼神の 弱点が 明かされた！ 定信公の剣が よく効くように なった。",
    restoreLines: [
      "森の 風に、黒い もやが ほどけていく……",
      "鬼神の 影は 桂の 大木へ 吸いこまれ、枝が 静かに ゆれた。",
    ],
    hosoku: "ほんとうの お話では、白河藩主・松平定信公の 剣によって、鬼神は この 桂の 木に 封じこめられたと されるの。のちに 旅人たちは この 木を「剣桂」と よび、あつく 信仰したわ。いまは 森の 巨人たち 百選にも えらばれているの。",
    reward: "剣桂の 森の もやが 晴れた！ 白河の お殿様に 知らせよう。",
    loseLines: ['旅の者たちは 力つきた……', "森の 奥で、桂の 葉が ざわめいている……"],
  },
};
