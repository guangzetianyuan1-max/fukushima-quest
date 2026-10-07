// 第二十九話 沼御前（4章 会津・章ボス）
// 話（Wikipedia・林野庁＝vault 調査ノートの8）：沼沢湖の大蛇 沼御前は髪2丈の若い女性に化けて人をまどわした。800年以上前、佐原十郎義連が家来を連れて退治に向かい、
// 兜に縫いつけた金の観音が大蛇の毒から守った。大蛇は討たれ、祟りを恐れた人々が社を建てて祀った＝沼御前神社。
// ⭐八蛇沼の大蛇（広報にしあいづ「その46」）は紙芝居②に1行＝「沼沢沼から水路を流れた織物」。⚠⚠八蛇沼の版では沼沢沼の大蛇は「雄」＝性別は言わない。
// ⚠斬る場面は見せない（観音の光と社まで）。⚠佐原義連は実在の人物＝「伝わる」で語る。弱点＝「金の観音」
import { BASIC_ITEMS } from './basic_items.js?v=223';

export const NUMAGOZEN = {
  art: {
    // ⏳絵が 届くまで kiyohime の 絵を 借りる（10/6・本人が AI Studio で 描く＝福島昔話クエストRPG\Geminiプロンプト_4章会津.md）
    dark: 'assets/numagozen_dark.png', light: 'assets/numagozen_light.png', bg: 'assets/bg_numagozen.png',
    glowDark: 0x9fb4ff, glowLight: 0xffd27a,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['kinkannon'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {
    kinkannon: {
      name: "金の観音", cost: 11, power: 44, weakMult: 3, plainMult: 0.5,
      weakText: "佐原十郎義連の 兜に 縫いつけた 金の 観音を かかげた！ 大蛇の 毒が とどかない！",
      plainText: "観音の 光は、湖の 霧に かすんだ……",
    },
  },
  enemy: {
    id: 'numagozen',
    name: "沼御前",
    episode: "第二十九話",
    tale: "沼御前",
    place: "福島県金山町",
    autoWinTarget: 0.88, // 10/6 0.80→0.88＝4つ目の技を必須にした章の最後・傷を減らす技の無い組（薬師・山伏・武士・巫女）が 0.35 だった // 4章 会津の章ボス（10/6）
    // 強さ＝仮（10/6）。tests/_autotune.mjs で 代表の5組の平均を 目安に 合わせる
    expectLv: 24,
    hp: 810, atk: 328, def: 180, agi: 15,
    bgm: 'numagozen',
    weakness: 'kinkannon',
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: "大蛇の 毒", chance: 0.3, power: 122, flash: [140, 220, 90], sfx: 'jadoku', cutin: 'assets/cutin/numagozen_doku.png' },
    special2: { name: "二丈の 黒髪", chance: 0.15, power: 130, flash: [60, 60, 90], sfx: 'kurokami', cutin: 'assets/cutin/numagozen_kurokami.png' },
    biteName: "大蛇の 尾で 打つ",
    introText: "雪の 沼沢湖の 水面が 割れ、二丈の 黒髪の 女性が あらわれた。……髪の 先から、大蛇の 影が のびていく！",
    tellLines: [
      "金山の 沼沢湖には、沼御前と よばれる 大蛇が すんでいたの。",
      "大蛇は 髪の 長さ 二丈もの 若い 女性に 化けて、人を まどわしたと いうわ。",
      "……佐原十郎義連は、兜に 金の 観音を 縫いつけて、大蛇の 毒から 身を 守ったの。",
    ],
    story: {
      tell: [
        { img: 'assets/story/numagozen_1.png', voice: 'assets/story/numagozen_1.mp3', text: "金山の 沼沢湖は、山に かこまれた 深い 湖。月夜には、水辺の 岩に すわって 機を 織る 女性の 影が 見えたと いうの。それが、湖の 主 沼御前よ。" },
        { img: 'assets/story/numagozen_2.png', voice: 'assets/story/numagozen_2.mp3', text: "あるとき 地鳴りが ひびき、遠い 西の 沼が 干上がって しまった。沼沢沼から 水路を 流れていった 美しい 織物は、もう どこへも とどかなくなったの。" },
        { img: 'assets/story/numagozen_3.png', voice: 'assets/story/numagozen_3.mp3', text: "その 話も 忘れられて、沼御前は 黒い もやに 呑まれ、大蛇の 姿に もどって しまった……。思い出させて あげましょう。金の 観音を。" },
      ],
      after: [
        { img: 'assets/story/numagozen_4.png', voice: 'assets/story/numagozen_4.mp3', text: "ほんとうの お話では、佐原十郎義連が 家来を つれて 湖へ 向かい、兜の 金の 観音に 守られて 大蛇を 討ったの。そのあと 人びとは 祟りを おそれ、社を 建てて まつった。それが いまの 沼御前神社と 伝わるわ。" },
      ],
    },
    revealText: "沼御前の 弱点が 明かされた！ 金の観音が よく効くように なった。",
    restoreLines: [
      "雪の 湖に、黒い もやが ほどけて 消えていく……",
      "水面の 女性の 影は、機の 音を 残して 湖の 底へ 帰っていった。",
    ],
    hosoku: "ほんとうの お話では、佐原十郎義連が 家来を つれて 湖へ 向かい、兜の 金の 観音に 守られて 大蛇を 討ったの。そのあと 人びとは 祟りを おそれ、社を 建てて まつった。それが いまの 沼御前神社と 伝わるわ。",
    reward: "沼沢湖の もやが 晴れた！ 会津の 昔話が、また 語られはじめた。",
    loseLines: ['旅の者たちは 力つきた……', "雪の 沼沢湖に、機を 織る 音が ひびいている……"],
  },
};
