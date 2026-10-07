// 第十六話 大多鬼丸（3章 県中・県南・ボス・呑まれた豪族）（本人 10/4「3章の製作に」）
// 話（田村市「坂上田村麻呂伝説」観光交流課／「坂上田村麻呂③」生涯学習課＝vault 調査ノートの4）：
// 大滝根山の鬼穴を根城にした大多鬼丸を、坂上田村麻呂が討つ。白鳥の導きで洞穴に追い込まれ、大多鬼丸は果てた。田村麻呂は その武勇を惜しみ、首を仙台平に丁重に葬った
// ⭐市は二つの見方を並べる（賊・鬼の首領／七里ヶ沢を平和に治め、朝廷の求めを断った豪族）＝悪鬼として一方的に描かない。⭐「田村麻呂がこの地へ来た文献は無い」（市）＝伝説として語る
// ゲームでは、忘れられて黒いもやに呑まれた大滝根山の主。弱点＝三春で授かる「三春駒」（第十五話・田村麻呂を助けた木の馬百頭）
import { BASIC_ITEMS } from './basic_items.js?v=233';

export const OTAKIMARU = {
  art: {
    dark: 'assets/otakimaru_dark.png', light: 'assets/otakimaru_light.png', bg: 'assets/bg_otakimaru.png',
    glowDark: 0xff9a7a, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['miharugoma'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    miharugoma: {
      name: '三春駒', cost: 9, power: 36, weakMult: 3, plainMult: 0.5,
      weakText: 'どこからか 百頭の 馬が 駆けこみ、大多鬼丸の 陣を 打ち破った！',
      plainText: '木の 馬は、ことりと 倒れた……',
    },
  },
  enemy: {
    id: 'otakimaru',
    name: '大多鬼丸',
    episode: '第十六話',
    tale: '大多鬼丸',
    place: '福島県田村市',
    autoWinTarget: 0.87,
    // 強さ＝試算（node tests/_autotune.mjs <id>・着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/4）
    expectLv: 16,
    hp: 973, atk: 165, def: 126, agi: 12, // 10/4 夜 くノ一・僧の如意輪の経・鉄砲2倍で合わせ直した（_autotune・前 hp760 atk107） // 10/4 夜 通しの調整＝猟師の玉3発を持つ前提で合わせ直した（前 hp608 atk148） ⭐10/5 職業の旅＝代表の5組の平均で仮に合わせ直した（1章の技まで・2章3章の技は段階②③で合わせ直す） // 10/5 夜 段階②（2章の技が入った）で 5組の平均に合わせ直した（_autotune・前 atk141 必殺技79）
    bgm: 'otakimaru',
    weakness: 'miharugoma',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: '鬼穴の 岩落とし', chance: 0.24, power: 92, flash: [255, 150, 90], sfx: 'iwaotoshi', cutin: 'assets/cutin/otakimaru_iwa.png' },
    biteName: '大太刀で 斬りかかる',
    introText: '大滝根山の 岩屋の 前に、鎧の 大男が 立ちふさがった。……その 目は、黒い もやに くもっている！',
    tellLines: [
      'むかし、大滝根山の 鬼穴には、大多鬼丸という 強い 主が いたの。賊の 首領とも、里と 民を 守った 豪族とも 伝わっているわ。',
      '坂上田村麻呂の 軍が 押されたとき、どこからか 百頭の 馬が 駆けこんで、田村麻呂を 助けたそうよ。',
      '三春で 授かった 三春駒の 話……あの 馬たちが、大多鬼丸の 弱みよ。',
    ],
    story: {
      tell: [
        { img: 'assets/story/otakimaru_1.png', voice: 'assets/story/otakimaru_1.mp3', text: 'むかし、大滝根山の 鬼穴には、大多鬼丸という 強い 主が いたの。賊の 首領とも、里と 民を 守った 豪族とも 伝わっているわ。' },
        { img: 'assets/story/otakimaru_2.png', voice: 'assets/story/otakimaru_2.mp3', text: '坂上田村麻呂の 軍が 攻めてきて、白い 鳥に みちびかれ、大多鬼丸を 岩屋へ 追いつめたと いうの。' },
        { img: 'assets/story/otakimaru_3.png', voice: 'assets/story/otakimaru_3.mp3', text: 'その 話も 忘れられて、大多鬼丸は 黒い もやに 呑まれて しまった……。三春駒を 呼びましょう。' },
      ],
      after: [
        { img: 'assets/story/otakimaru_4.png', voice: 'assets/story/otakimaru_4.mp3', text: 'ほんとうの お話では、大多鬼丸は 岩屋で 果てたの。田村麻呂は その 強さを 惜しんで、阿武隈を 見わたす 地に ていねいに 葬ったそうよ。いまも 田村には、田村麻呂の 伝説に まつわる 地名が たくさん 残っているわ。' },
      ],
    },
    revealText: '大多鬼丸の 弱点が 明かされた！ 三春駒が よく効くように なった。',
    restoreLines: [
      '黒い もやが、山の 風に 吹きはらわれた……',
      '大多鬼丸は 太刀を おさめ、静かに 山を 見わたした。',
    ],
    hosoku: 'ほんとうの お話では、大多鬼丸は 岩屋で 果て、田村麻呂は その 武勇を 惜しんで ていねいに 葬ったの。田村の 人たちは いまも、里を 守った 主としても 語り継いでいるのよ。',
    reward: '大多鬼丸が 道を ゆずり、南の 石川への もやが 晴れた！',
    loseLines: ['旅の者たちは 力つきた……', '大滝根山に、鬨の 声が こだましている……'],
  },
};
