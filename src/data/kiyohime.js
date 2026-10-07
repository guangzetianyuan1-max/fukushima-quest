// 第二十一話 安珍と清姫（3章 県中・県南・章ボス・呑まれた清姫の大蛇）（本人 10/4「3章の製作に」）
// 話（うつくしま電子事典「咲かずのフジ（安珍と清姫）」・福島県県南地方振興局＝vault 調査ノートの10）：白河の大清水の村に生まれた若い僧 安珍が、紀州の熊野へ修行に行く。
// 泊まった家の娘 清姫に「修行を終えたら迎えに来る」と約束するが、修行の道を選ぶ。清姫は大蛇になって日高川を渡り、道成寺の鐘に隠れた安珍を炎で焼いた（⚠直接見せない）。
// 白河の大清水には花の咲かない「咲かずのフジ」が生えた。⭐白河では安珍を故郷の若い僧として、命日（3月27日）に根田の安珍堂の前で念仏踊りを奉納して弔う（県の重要無形民俗文化財）
// ⭐清姫を罰する敵にしない＝「蛇の姿から戻す」。原典では戻らない＝紙芝居⑤で しおりが補う。⚠道成寺の能・歌舞伎の筋や台詞は借りない
// 弱点＝白河の「安珍念仏踊り」（安珍を弔う念仏の声）
import { BASIC_ITEMS } from './basic_items.js?v=231';

export const KIYOHIME = {
  art: {
    dark: 'assets/kiyohime_dark.png', light: 'assets/kiyohime_light.png', bg: 'assets/bg_kiyohime.png',
    glowDark: 0xff8060, glowLight: 0xffe6a0,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['nenbutsu'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    nenbutsu: {
      name: '安珍念仏踊り', cost: 10, power: 40, weakMult: 3, plainMult: 0.5,
      weakText: '白河の 人びとが 安珍を とむらう 念仏の 声が ひびいた……清姫の 炎が ゆらいだ！',
      plainText: '念仏の 声は、炎の 音に のまれた……',
    },
  },
  enemy: {
    id: 'kiyohime',
    name: '清姫',
    episode: '第二十一話',
    tale: '安珍と清姫',
    place: '福島県白河市',
    autoWinTarget: 0.85, // 3章の章ボス
    // 強さ＝試算（node tests/_autotune.mjs <id>・着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/4）
    expectLv: 19,
    hp: 923, atk: 214, def: 146, agi: 14, // 10/4 夜 くノ一・僧の如意輪の経・鉄砲2倍で合わせ直した（_autotune・前 hp820 atk112） // 10/4 夜 通しの調整＝猟師の玉3発を持つ前提で合わせ直した（前 hp577 atk157） ⭐10/5 職業の旅＝代表の5組の平均で仮に合わせ直した（1章の技まで・2章3章の技は段階②③で合わせ直す） // 10/5 夜 段階②（2章の技が入った）で 5組の平均に合わせ直した（_autotune・前 atk158 必殺技85/94） // 10/5 夜 段階③（3章の技が入った）で合わせ直した（前 atk186 必殺技100/111）
    bgm: 'kiyohime',
    weakness: 'nenbutsu',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: '恋の 炎', chance: 0.24, power: 115, flash: [255, 110, 50], sfx: 'honoo', cutin: 'assets/cutin/kiyohime_honoo.png' },
    special2: { name: '鐘に 巻きつく', chance: 0.14, power: 127, flash: [255, 200, 120], sfx: 'tsurigane', cutin: 'assets/cutin/kiyohime_kane.png' },
    biteName: '炎の 牙で かみつく',
    introText: '安珍堂の 前に、炎を まとった 大蛇が とぐろを 巻いていた。……その 目は、だれかを さがしている。',
    tellLines: [
      'むかし、白河の 大清水の 村に、安珍という 若い お坊さんが 生まれたの。安珍は 遠い 紀州の 熊野へ 修行の 旅に 出たのよ。',
      '旅の 宿の 娘 清姫は 安珍を 慕い、安珍は「修行を 終えたら 迎えに 来る」と 約束して しまった。けれど 安珍は、修行の 道を えらんだの。',
      '清姫は 大蛇に なって 安珍を 追いかけた……。白河の 人たちが 安珍を とむらう 念仏の 声が、清姫の 炎を しずめるはずよ。',
    ],
    story: {
      tell: [
        { img: 'assets/story/kiyohime_1.png', voice: 'assets/story/kiyohime_1.mp3', text: 'むかし、白河の 大清水の 村に、安珍という 若い お坊さんが 生まれたの。安珍は りっぱな 僧に なるため、遠い 紀州の 熊野へ 修行の 旅に 出たのよ。' },
        { img: 'assets/story/kiyohime_2.png', voice: 'assets/story/kiyohime_2.mp3', text: '旅の 宿の 娘 清姫は 安珍を 慕い、安珍は「修行を 終えたら 迎えに 来る」と 約束して しまったの。けれど 安珍は 修行の 道を えらび、日高川の 船頭に「清姫を 乗せないで」と たのんだわ。' },
        { img: 'assets/story/kiyohime_3.png', voice: 'assets/story/kiyohime_3.mp3', text: '清姫は 大蛇に なって 川を 渡り、道成寺の 鐘に かくれた 安珍を 炎で つつんで しまったの。' },
        { img: 'assets/story/kiyohime_4.png', voice: 'assets/story/kiyohime_4.mp3', text: '……忘れの 力で、その 炎の 大蛇が 白河に よみがえったの。安珍を とむらう 念仏の 声を 届けましょう。' },
      ],
      after: [
        { img: 'assets/story/kiyohime_5.png', voice: 'assets/story/kiyohime_5.mp3', text: 'ほんとうの お話では、清姫は 大蛇の まま 戻らなかったの。安珍の 故郷の 大清水には、花の 咲かない フジが 生えて、咲かずのフジと 呼ばれたわ。いまも 白河では 安珍の 命日に、安珍堂の 前で 念仏踊りを 奉納して とむらっているのよ。' },
      ],
    },
    revealText: '清姫の 弱点が 明かされた！ 安珍念仏踊りが よく効くように なった。',
    restoreLines: [
      '念仏の 声に、炎が すこしずつ 小さく なっていく……',
      '大蛇の すがたが ほどけ、ひとりの 娘が 静かに 手を 合わせた。',
    ],
    hosoku: 'ほんとうの お話では、清姫は 大蛇の まま 戻らなかったの。白河では いまも 安珍の 命日に、念仏踊りで とむらっているのよ。',
    reward: '清姫の 炎が 消え、白河の 夜が 静かに なった……',
    loseLines: ['旅の者たちは 力つきた……', '安珍堂の 前に、炎の 音だけが 残っている……'],
  },
};
