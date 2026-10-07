// 第十三話 安達ヶ原の鬼婆（2章 県北・章ボス・よみがえった悪役）（本人 10/4「順番に制作を」）
// 話（二本松市「安達ヶ原物語」二本松の民話・文化課／観光案内＝vault 日本昔話/2026-10-04-調査-福島昔話クエスト2章県北5話.md）：
// 京の老女いわてが 口のきけない姫のため「生ぎも」を求めて奥州へ下り、阿武隈川のほとりの岩屋に住む。旅人を泊めては……（⚠語りは直接見せない）
// 神亀3年、熊野那智の東光坊の阿闍梨 祐慶が宿を乞う。「ここを あけてはいけない」の部屋に屍の山。逃げる祐慶は熊野那智のお札で山・谷・川を作るが、
// 鬼婆は越えてくる。如意輪観音に祈ると、尊像が空に現れ「破魔の真弓」に金剛の矢をつがえて射た。いまは観世寺の岩屋・黒塚（二本松市安達ヶ原）
// ⭐本人 10/4「鬼婆は最強なので、一度全滅→町で祐慶と合流し、再トライ」→ 10/4 夜「祐慶に替わるは無しで、赤井岳の僧のまま、祐慶にお経を教わる形で。そのお経を学ばないと鬼婆を倒せない」
//   1回目＝firstLose（必ず負ける・全滅しても文は減らない）→ 二本松の宿で目をさます → 祐慶が 僧に 如意輪の経を教えて 熊野へ帰る（companions.js の LEARN_AFTER_LOSS）
//   2回目＝弱点は僧の「如意輪の経」（観音さまが 破魔の真弓で射る）。⚠語るのは しおり・経を となえるのは僧。学ぶまでは 何度でも 必ず負ける（firstLose.until）
// 絵＝まだ（仮に道中の霊の絵）。プロンプト＝art_src/Geminiプロンプト_2章県北.md
import { BASIC_ITEMS } from './basic_items.js?v=229';

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
    autoWinTarget: 0.90, // 2章の章ボス（2回目＝僧が如意輪の経を おぼえた戦い）
    // 強さ＝試算（node tests/_autotune.mjs <id>・その話に着くころの4人・Lv・EXPECT_GEAR）で目安に合わせた（10/4）
    expectLv: 14,
    hp: 775, atk: 136, def: 110, agi: 12, // 10/4 武士の居合い斬りが加わり HP500→620・攻82→96・必殺技も1.18倍（_autotune） // 10/4 夜 くノ一・僧の如意輪の経・鉄砲2倍で合わせ直した（_autotune・前 hp620 atk96） // 10/4 夜 通しの調整＝猟師の玉3発を持つ前提で合わせ直した（前 hp620 atk106） ⭐10/5 職業の旅＝代表の5組の平均で仮に合わせ直した（1章の技まで・2章3章の技は段階②③で合わせ直す） // 10/5 夜 段階②（2章の技が入った）で 5組の平均に合わせ直した（_autotune・前 atk108 必殺技60/68）
    bgm: 'onibaba',
    weakness: 'hama', // 如意輪の経＝僧が 祐慶に 教わる術（companions.js の COMPANION_SPELLS・LEARN_AFTER_LOSS）
    // ⭐1回目は必ず負ける（本人 10/4）。強さを上書きし、語っても弱点は明かされない
    firstLose: {
      until: 'nyoirin', // 僧が 如意輪の経を 学ぶまでは 必ず負ける
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
    special: { name: '出刃包丁', chance: 0.24, power: 76, flash: [255, 80, 60], sfx: 'slash', cutin: 'assets/cutin/onibaba_deba.png' },
    special2: { name: '岩屋の 闇', chance: 0.14, power: 86, flash: [120, 40, 60], sfx: 'yami', cutin: 'assets/cutin/onibaba_iwaya.png' },
    biteName: 'つかみかかる',
    introText: '観世寺の 岩屋の 奥から、鬼婆が ふたたび あらわれた。僧が 数珠を にぎり、祐慶に 教わった 経を 胸に 刻む……！',
    tellLines: [
      'むかし、安達ヶ原の 岩屋に、旅人を 泊める 老婆が いたの。けれど 老婆は、おそろしい 鬼婆だったのよ。',
      '熊野の お坊さま 祐慶さまは、鬼婆に 追われながら 熊野那智の お札で 山や 川を 作ったけれど、鬼婆は 越えてきたの。',
      '最後に 祐慶さまが 観音さまに 祈ると、観音さまが 空に あらわれて、破魔の 真弓で 鬼婆を 射たのよ。お坊さま、祐慶さまに 教わった お経を！',
    ],
    story: {
      tell: [
        // 10/4 本人「鬼婆は実の娘を殺して半狂乱になる話です」＝鬼婆になった わけ（調査ノートの筋：お守り袋で実の娘と知り、狂って鬼婆に）を1枚目に足して4枚に。手にかける所は絵にしない
        { img: 'assets/story/onibaba_1.png', voice: 'assets/story/onibaba_1.mp3', text: 'むかし、京の 乳母 いわては、姫の 病を 治す 薬を さがして、安達ヶ原の 岩屋に 住んだの。ある 晩、泊めた 身ごもった 女の人を 手に かけると、お守り袋から、生き別れた 実の 娘だと わかったのよ。いわては 気が ふれ、鬼婆に なってしまったの。' },
        { img: 'assets/story/onibaba_2.png', voice: 'assets/story/onibaba_2.mp3', text: '長い 年月が たった 秋、熊野の お坊さま 祐慶さまが、岩屋の 老婆に 一夜の 宿を たのんだの。' },
        { img: 'assets/story/onibaba_3.png', voice: 'assets/story/onibaba_3.mp3', text: '老婆は「この 部屋を あけては いけない」と 言って 出かけたの。祐慶さまが のぞくと……そこは、おそろしい 鬼婆の すみかだったのよ。' },
        { img: 'assets/story/onibaba_4.png', voice: 'assets/story/onibaba_4.mp3', text: '逃げる 祐慶さまは、熊野那智の お札で 山や 川を 作ったけれど、鬼婆は 越えてきた。……忘れの 力で、その 鬼婆が よみがえったの。' },
      ],
      after: [
        { img: 'assets/story/onibaba_5.png', voice: 'assets/story/onibaba_5.mp3', text: 'ほんとうの お話では、祐慶さまが 祈ると、如意輪観音さまが 空に あらわれ、破魔の 真弓で 鬼婆を 射たの。いまも 観世寺には 岩屋が 残り、近くに 黒塚が あるのよ。' },
      ],
    },
    revealText: '鬼婆の 弱点が 明かされた！ 僧の 如意輪の経が よく効くように なった。',
    restoreLines: [
      '破魔の 矢が、黒い もやを 射ぬいた……',
      '鬼婆は 岩屋の 闇へ くずれおち、静かに なった。',
    ],
    hosoku: 'ほんとうの お話では、如意輪観音さまの 破魔の 真弓が、鬼婆を 射たの。いまも 観世寺には 岩屋が 残り、近くの 老杉の 根もとに 黒塚が あるのよ。',
    reward: '安達ヶ原の 闇が 晴れた！',
    loseLines: ['旅の者たちは 力つきた……', '安達ヶ原に、鬼婆の 笑い声が ひびいている……'],
  },
};
