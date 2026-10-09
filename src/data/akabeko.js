// 第二十六話 赤べこ（4章 会津・中ボス）
// 話（会津柳津観光物産協会・福島県＝vault 調査ノートの5）：1611年の大地震で柳津の虚空藏堂が倒れ、崖の上に本堂を建て直すことになる。只見川で運んだ大きな材木を
// 崖の上へ運び上げられず困っていると、どこからか力強い赤毛の牛の群れが現れ、黒毛の牛を助けて見事に本堂が建った。その牛を「赤べこ」と呼ぶ。寺に開運「撫牛」
// ⭐敵のいない話＝材木を引く牛たちが黒いもやに呑まれる形。⚠出どころは「群れ」（最後まで手伝った1頭は確かめられず）。⚠圓藏寺を怪異の場にしない＝只見川のほとり
// 弱点＝「撫牛の祈り」（なでると福が来ると いわれる 撫牛）
import { BASIC_ITEMS } from './basic_items.js?v=333';

export const AKABEKO = {
  art: {
    // ⏳絵が 届くまで miharugoma の 絵を 借りる（10/6・本人が AI Studio で 描く＝福島昔話クエストRPG\Geminiプロンプト_4章会津.md）
    dark: 'assets/akabeko_dark.png', light: 'assets/akabeko_light.png', bg: 'assets/bg_akabeko.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['nadeushi'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    nadeushi: {
      name: "撫牛の祈り", cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: "境内の 撫牛を なでるように、牛の 背を そっと なでた！ 赤べこの 目が やわらいだ！",
      plainText: "牛は 鼻を 鳴らし、ふり向きもしない……",
    },
  },
  enemy: {
    id: 'akabeko',
    name: "赤毛の牛",
    episode: "第二十六話",
    tale: "赤べこ",
    place: "福島県柳津町",
    autoWinTarget: 0.85, // 4章 会津の中ボス（10/6）
    // 強さ＝仮（10/6）。tests/_autotune.mjs で 代表の5組の平均を 目安に 合わせる
    expectLv: 22,
    hp: 1105, atk: 268, def: 170, agi: 11,
    bgm: 'akabeko',
    weakness: 'nadeushi',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: "大材の 引き落とし", kind: 'one', chance: 0.45, power: 145, flash: [200, 140, 80], sfx: 'zaimoku', cutin: 'assets/cutin/akabeko_zaimoku.png' },
    biteName: "角で 突く",
    introText: "只見川の ほとりで、材木を 引く 牛の 群れが 黒い もやに 呑まれ、あばれだした！",
    tellLines: [
      "柳津の 圓藏寺は、只見川を 見下ろす 崖の 上に 建っているの。",
      "大きな 地震の あと、本堂を 崖の 上へ 建てなおすとき、大きな 材木が どうしても 運び上げられなかったのよ。",
      "……境内の 撫牛は、なでると 福が くると いわれているわ。",
    ],
    story: {
      tell: [
        { img: 'assets/story/akabeko_1.png', voice: 'assets/story/akabeko_1.mp3', text: "柳津の 圓藏寺は、只見川を 見下ろす 崖の 上に 建っているの。境内の 撫牛は、なでると 福が くると いわれて、いまも 大切に されているわ。" },
        { img: 'assets/story/akabeko_2.png', voice: 'assets/story/akabeko_2.mp3', text: "むかし 大きな 地震で お堂が たおれ、崖の 上に 建てなおすことに なった。でも、大きな 材木が どうしても 崖を 上がらなかったの。" },
        { img: 'assets/story/akabeko_3.png', voice: 'assets/story/akabeko_3.mp3', text: "材木を 引く 牛たちが、黒い もやに 呑まれて 動けなくなって しまった……。牛たちの 力を 思い出させて あげましょう。" },
      ],
      after: [
        { img: 'assets/story/akabeko_4.png', voice: 'assets/story/akabeko_4.mp3', text: "ほんとうの お話では、どこからか 力強い 赤毛の 牛の 群れが あらわれて、黒毛の 牛を 助け、材木を 崖の 上へ 運んだの。お堂は みごとに 建ち、その 牛を「赤べこ」と よぶように なったと 伝わるわ。" },
      ],
    },
    revealText: "赤毛の牛の 弱点が 明かされた！ 撫牛の祈りが よく効くように なった。",
    restoreLines: [
      "牛たちの 黒い もやが、川風に 流されていく……",
      "赤毛の 牛たちは 首を ゆらし、材木の 綱を 引きはじめた。",
    ],
    hosoku: "ほんとうの お話では、どこからか 力強い 赤毛の 牛の 群れが あらわれて、黒毛の 牛を 助け、材木を 崖の 上へ 運んだの。お堂は みごとに 建ち、その 牛を「赤べこ」と よぶように なったと 伝わるわ。",
    reward: "只見川の 橋の もやが 晴れ、西会津への 道が ひらけた！",
    loseLines: ['旅の者たちは 力つきた……', "只見川の ほとりに、牛の 声が ひびいている……"],
  },
};
