// 第十三話 安達ヶ原の鬼婆（2章 県北・章ボス・よみがえった悪役）（本人 10/4「順番に制作を」）
// 話（二本松市「安達ヶ原物語」二本松の民話・文化課／観光案内＝vault 日本昔話/2026-10-04-調査-福島昔話クエスト2章県北5話.md）：
// 京の老女いわてが 口のきけない姫のため「生ぎも」を求めて奥州へ下り、阿武隈川のほとりの岩屋に住む。旅人を泊めては……（⚠語りは直接見せない）
// 神亀3年、熊野那智の東光坊の阿闍梨 祐慶が宿を乞う。「ここを あけてはいけない」の部屋に屍の山。逃げる祐慶は熊野那智のお札で山・谷・川を作るが、
// 鬼婆は越えてくる。如意輪観音に祈ると、尊像が空に現れ「破魔の真弓」に金剛の矢をつがえて射た。いまは観世寺の岩屋・黒塚（二本松市安達ヶ原）
// ⭐本人 10/4「鬼婆は最強なので、一度全滅→町で祐慶と合流し、再トライ」「誰かと入れ替えて仲間に」→ 閼伽井嶽の僧と入れ替え
//   1回目＝firstLose（必ず負ける・全滅しても文は減らない）→ 二本松の宿で目をさます → 祐慶が加わり 僧は閼伽井嶽へ（companions.js の SWAP_AFTER_LOSS）
//   2回目＝弱点は祐慶の「破魔の真弓」。⚠語るのは しおり・術を射るのは祐慶
// 絵＝まだ（仮に道中の霊の絵）。プロンプト＝art_src/Geminiプロンプト_2章県北.md
import { BASIC_ITEMS } from './basic_items.js?v=127';

export const ONIBABA = {
  art: {
    dark: 'assets/onibaba_dark.png', light: 'assets/onibaba_light.png', bg: 'assets/bg_onibaba.png', // 10/4 ①と背景（fjnh8a＝安達ヶ原の岩屋）が届いた
    glowDark: 0xff8080, glowLight: 0xffe6a0,
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: [] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS,
  spells: {},
  enemy: {
    id: 'onibaba',
    name: '鬼婆',
    episode: '第十三話',
    tale: '安達ヶ原の鬼婆',
    place: '福島県二本松市',
    autoWinTarget: 0.90, // 2章の章ボス（2回目＝祐慶がいる戦い）
    // 強さ＝試算（node tests/_autotune.mjs <id>・その話に着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/4）
    expectLv: 14,
    hp: 620, atk: 96, def: 110, agi: 12, // 10/4 武士の居合い斬りが加わり HP500→620・攻82→96・必殺技も1.18倍（_autotune）
    bgm: 'onibaba',
    weakness: 'hama', // 祐慶の術（companions.js の COMPANION_SPELLS）
    // ⭐1回目は必ず負ける（本人 10/4）。強さを上書きし、語っても弱点は明かされない
    firstLose: {
      hp: 99999, atk: 400, def: 999, mistMin: 3,
      introText: '観世寺の 岩屋の 奥から、出刃包丁を 持った 老婆が あらわれた。……その 目は、闇より 暗い。',
      tellBlock: '……語ろうとしたが、鬼婆の 気迫に 声が 出ない！',
      loseLines: [
        '旅の者たちは 力つきた……',
        '鬼婆の 笑い声が、安達ヶ原に ひびいている……',
        '……とおくで、だれかの 読経の 声が きこえた。',
      ],
    },
    mist: { min: 1, max: 3, rise: 0.2 },
    special: { name: '出刃包丁', chance: 0.24, power: 53, flash: [255, 80, 60], sfx: 'slash', cutin: 'assets/cutin/onibaba_deba.png' },
    special2: { name: '岩屋の 闇', chance: 0.14, power: 60, flash: [120, 40, 60], sfx: 'yami', cutin: 'assets/cutin/onibaba_iwaya.png' },
    biteName: 'つかみかかる',
    introText: '観世寺の 岩屋の 奥から、鬼婆が ふたたび あらわれた。祐慶が 弓を かまえる……！',
    tellLines: [
      'むかし、安達ヶ原の 岩屋に、旅人を 泊める 老婆が いたの。けれど 老婆は、おそろしい 鬼婆だったのよ。',
      '熊野の お坊さま 祐慶さまは、鬼婆に 追われながら 熊野那智の お札で 山や 川を 作ったけれど、鬼婆は 越えてきたの。',
      '最後に 祐慶さまが 観音さまに 祈ると、観音さまが 空に あらわれて、破魔の 真弓で 鬼婆を 射たのよ。祐慶さま、弓を！',
    ],
    story: {
      tell: [
        // 10/4 本人「鬼婆は実の娘を殺して半狂乱になる話です」＝鬼婆になった わけ（調査ノートの筋：お守り袋で実の娘と知り、狂って鬼婆に）を1枚目に足して4枚に。手にかける所は絵にしない
        { img: 'assets/story/onibaba_1.png', voice: 'assets/story/onibaba_1.mp3', text: 'むかし、京の 乳母 いわては、姫の 病を 治す 薬を さがして、安達ヶ原の 岩屋に 住んだの。ある 晩、泊めた 身ごもった 女の人を 手に かけると、お守り袋から、生き別れた 実の 娘だと わかったのよ。いわては 気が ふれ、鬼婆に なってしまったの。' },
        { img: 'assets/story/onibaba_2.png', voice: 'assets/story/onibaba_2.mp3', text: '長い 年月が たった 秋、熊野の お坊さま 祐慶さまが、岩屋の 老婆に 一夜の 宿を たのんだの。' },
        { img: 'assets/story/onibaba_3.png', voice: 'assets/story/onibaba_3.mp3', text: '老婆は「この 部屋を あけては いけない」と 言って 出かけたの。祐慶さまが のぞくと……そこは、おそろしい 鬼婆の すみかだったのよ。' },
        { img: 'assets/story/onibaba_4.png', voice: 'assets/story/onibaba_4.mp3', text: '逃げる 祐慶さまは、熊野那智の お札で 山や 川を 作ったけれど、鬼婆は 越えてきた。……忘れの 力で、その 鬼婆が よみがえったの。祐慶さま、観音さまの 弓を！' },
      ],
      after: [
        { img: 'assets/story/onibaba_5.png', voice: 'assets/story/onibaba_5.mp3', text: 'ほんとうの お話では、祐慶さまが 祈ると、如意輪観音さまが 空に あらわれ、破魔の 真弓で 鬼婆を 射たの。いまも 観世寺には 岩屋が 残り、近くに 黒塚が あるのよ。' },
      ],
    },
    revealText: '鬼婆の 弱点が 明かされた！ 祐慶の 破魔の真弓が よく効くように なった。',
    restoreLines: [
      '破魔の 矢が、黒い もやを 射ぬいた……',
      '鬼婆は 岩屋の 闇へ くずれおち、静かに なった。',
    ],
    hosoku: 'ほんとうの お話では、如意輪観音さまの 破魔の 真弓が、鬼婆を 射たの。いまも 観世寺には 岩屋が 残り、近くの 老杉の 根もとに 黒塚が あるのよ。',
    reward: '安達ヶ原の 闇が 晴れた！',
    loseLines: ['旅の者たちは 力つきた……', '安達ヶ原に、鬼婆の 笑い声が ひびいている……'],
  },
};
