// 第三十二話（10/9 繰り下げ・前＝第三十一話） モーカケの滝の姫の霊（終章 南会津・10/8 本人「揚羽蝶の旗は落人の姫の霊と戦う」）
// 確かめた事（10/8）：モーカケの滝は 七入〜御池の 道ぞい。名は 平安の 装束の 裳（十二単の 裳）を 掛けた 様子に 似ているから と 伝わり、
//   檜枝岐の 平家落人伝説を 象徴する 滝とされる（⚠サルオガセが「毛を 掛けた」ように 見えるから と いう 説も ある＝定かでない）（るるぶ ほか）
//   村に 多い 平野姓は 平家の 落人の 子孫とされ、家紋は 揚羽蝶（たびこふれ）
// ⚠姫の霊の 話は ゲームの 作り（滝の 名の 言い伝えから）＝紙芝居④で「このゲームの語り」と 言う
// 弱点＝裳を 掛ける 祈り・勝つと「揚羽蝶の旗」（rally.js の RELICS.castle）
import { BASIC_ITEMS } from './basic_items.js?v=296';

export const MOKAKE = {
  art: {
    // 10/8 夜 本人が Gemini で 描いた（mu9936・unzppq・rwh4es＝art_src/sets_api.json の mokake・背景は 滝が 姫の 真後ろに 隠れる＝右から 52%を 切って 滝を 左へ）
    dark: 'assets/mokake_dark.png', light: 'assets/mokake_light.png', bg: 'assets/bg_mokake.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['mokakeinori'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    mokakeinori: {
      name: '裳掛けの 祈り', cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: '滝に 白い 裳を そっと 掛けて 祈った！ 姫の 霊の 目から、涙が ひとすじ こぼれた！',
      plainText: '裳は、滝の しぶきに かすんだ……',
    },
  },
  enemy: {
    id: 'mokake',
    name: '落人の 姫の 霊',
    episode: '第三十二話', // 10/9 繰り下げ
    tale: 'モーカケの滝の姫の霊',
    place: '福島県檜枝岐村',
    autoWinTarget: 0.8, // 終章の 中ボス（10/8）
    expectLv: 27,
    hp: 990, atk: 538, def: 140, agi: 18,
    bgm: 'mokake',
    weakness: 'mokakeinori',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: 'すすり泣き', kind: 'silence', chance: 0.18, power: 168, flash: [190, 200, 255], sfx: 'susurinaki', cutin: 'assets/cutin/mokake_susurinaki.png' },
    special2: { name: '滝つぼの 渦', kind: 'all', chance: 0.18, power: 203, flash: [120, 200, 255], sfx: 'takitsubo', cutin: 'assets/cutin/mokake_takitsubo.png' },
    biteName: '冷たい 手で ふれる',
    introText: '滝の しぶきの 向こうに、十二単の 姫の 影が うかんだ。……姫の 目には、黒い もやが 渦を 巻いている！',
    tellLines: [
      'この 滝は、モーカケの滝と よばれているの。',
      '平家の 姫の 十二単の 裳を 掛けた 姿に 似ているから、と 伝わるわ。',
      '……姫は、ずっと 帰る 日を 待っていたのね。裳を 掛けて、祈って あげましょう。',
    ],
    story: {
      tell: [
        { img: 'assets/story/mokake_1.png', voice: 'assets/story/mokake_1.mp3', text: '七入から 御池へ 向かう 道ぞいに、モーカケの滝が あるの。名は、平家の 姫の 十二単の 裳を 掛けた 姿に 似ているから、と 伝わるわ。' },
        { img: 'assets/story/mokake_2.png', voice: 'assets/story/mokake_2.mp3', text: '落人の 姫が 滝の そばで、揚羽蝶の 旗を 抱いて 都を しのんでいたの。旗は、平家の 紋の しるし。' },
        { img: 'assets/story/mokake_3.png', voice: 'assets/story/mokake_3.mp3', text: 'けれど 山を こえて 流れてきた 黒い もやが、姫の 霊を 呑みこんで しまった……。思い出させて あげましょう。裳を 掛けて 祈る 心を。' },
      ],
      after: [
        { img: 'assets/story/mokake_4.png', voice: 'assets/story/mokake_4.mp3', text: '姫の 霊の 話は、このゲームの 語りなの。モーカケの滝の 名には、木に 垂れる サルオガセが 毛を 掛けたように 見えるから、と いう 説も あって、ほんとうの ところは 定かでないわ。' },
      ],
    },
    revealText: '落人の 姫の 霊の 弱点が 明かされた！ 裳掛けの 祈りが よく効くように なった。',
    restoreLines: [
      '滝の しぶきに、黒い もやが ほどけて 消えていく……',
      '姫の 霊は、揚羽蝶の 旗を 胸から はなした。',
    ],
    hosoku: '姫の 霊の 話は、このゲームの 語りなの。モーカケの滝の 名には、木に 垂れる サルオガセが 毛を 掛けたように 見えるから、と いう 説も あって、ほんとうの ところは 定かでないわ。',
    reward: '滝の もやが 晴れた！ 姫の 霊が「揚羽蝶の旗」を そっと 差し出した。',
    loseLines: ['旅の者たちは 力つきた……', 'モーカケの滝に、すすり泣きが ひびいている……'],
  },
};
