// 第一話 鮫川の松川様（序章の中ボス・呑まれた良い存在）
// 話（出どころ uminominwa.jp/animation/19）：漁師に「松川様」と敬われていた、背中に藻の生えた大ザメ。
// 殿様が人に害があると聞いて弓で射たが死なず、矢が刺さったまま、川を渡る殿様に襲いかかり、殿様は愛馬を失った。
// 数値は試算（500戦）で決める。第一話なので序章でいちばん勝ちやすく（autoWinTarget 1.0）
import { BASIC_ITEMS } from './basic_items.js?v=216';

export const MATSUKAWA = {
  art: {
    dark: 'assets/shark_dark.png', light: 'assets/shark_light.png', bg: 'assets/bg_samegawa.png',
    glowDark: 0x7fa8d8, glowLight: 0x8fe6ff, // 夜の海の青白い光 → 戻ったら水色
  },
  allies: [
    { id: 'tabi', name: '旅の者', hp: 60, mp: 20, atk: 12, def: 6, agi: 8, spells: ['uyamai'] },
    { id: 'shiori', name: 'しおり', hp: 45, mp: 0, atk: 7, def: 4, agi: 10, canTell: true },
  ],
  items: BASIC_ITEMS, // 道具＝ふつうの物（10/2 本人。いわきの名物は完成後に入れなおす）
  spells: {
    uyamai: {
      name: '敬いの呼び声', cost: 5, power: 14, weakMult: 3, plainMult: 0.5,
      weakText: '「松川様」と 呼ぶ声が、サメの 胸に とどいた！',
      plainText: '呼び声は 波の音に かき消された……',
    },
  },
  enemy: {
    id: 'matsukawa',
    name: '松川様',
    episode: '第一話',
    tale: '松川様',
    place: '福島県いわき市', // 題の画面に出す場所（本人 10/1「福島県○○市、まで入れて」）
    autoWinTarget: 1.0,
    // 着くころのレベル expectLv と、そのレベルの仲間で試算した強さ（道中の敵の回・2026-10-01。殴るだけでは削れないよう守りを上げた・刀屋の回で装備 EXPECT_GEAR 込みに合わせ直し）
    expectLv: 2,
    hp: 135, atk: 17, def: 46, agi: 9, // ⭐10/5 職業の旅＝初めから4人（力士の つっぱり）＝たたかうだけで勝てないよう守り16→46
    weakness: 'uyamai',
    // 黒いもや：始めは min〜max を運で・毎ターン rise の見込みで ふいに濃くなる・必殺技でも1つ戻る（本人 10/1「もやはランダムに」）
    mist: { min: 1, max: 2, rise: 0.2 },
    special: { name: '荒波', chance: 0.25, power: 10, flash: [120, 180, 255], sfx: 'wave' }, // 必殺技：毎ターン2割5分で全員に（青白い光と波の音）
    biteName: 'かみつき',
    introText: '背に 古い矢が 刺さったまま、黒い もやを まとっている……',
    tellLines: [
      'むかし、鮫川の 海には 背に 藻の生えた 大きな サメが いたの。',
      '漁師たちは そのサメを 松川様と 呼んで、敬ってきた。',
      'ところが 殿様が、人に 害が あると聞いて、弓で 射てしまったのよ。',
    ],
    // 紙芝居（本人 10/2「挿絵とナレーションを付けて」）＝影絵の挿絵（正方形）と しおりの声（Gemini TTS）
    // 語る＝①敬われる松川様 ②殿様が射る ③黒いもやに呑まれる／勝った後＝④ほんとうの結末（hosoku の代わり）
    // 筋は出どころ（uminominwa.jp/animation/19）で確かめた：背に岩のような藻・漁師が「松川様」と敬う・「人をおそう」と聞いた殿様が射る・死なずに川を渡る殿様をおそい、殿様は愛馬を失う
    // ③の「忘れられた悲しみで もやに呑まれる」はゲームの筋（原典には無い）
    story: {
      tell: [
        { img: 'assets/story/matsukawa_1.png', voice: 'assets/story/matsukawa_1.mp3', text: 'むかし、いわきの 鮫川の 河口に、背中に 岩のような 藻を はやした、大きな サメが すんでいたの。漁師たちは その サメを「松川様」と 呼んで、敬ってきたのよ。' },
        { img: 'assets/story/matsukawa_2.png', voice: 'assets/story/matsukawa_2.mp3', text: 'ある日、見回りに 来た 殿様が、「人を おそう サメが いる」と 聞いて、弓を ひきしぼった。放たれた 矢は、松川様の 背中に 深く 刺さって しまったの。' },
        { img: 'assets/story/matsukawa_3.png', voice: 'assets/story/matsukawa_3.mp3', text: '射られた 痛みと、敬われた 日々を 忘れられた 悲しみで、松川様は 黒い もやに 呑まれて しまった……。思い出させて あげましょう。松川様が どれほど 大切に されてきたかを。' },
      ],
      after: [
        { img: 'assets/story/matsukawa_4.png', voice: 'assets/story/matsukawa_4.mp3', text: 'ほんとうの お話では、矢を 受けた 松川様は 死ななかったの。殿様が 荒れた 川を 渡ろうと したとき、水の 中から おそいかかり、殿様は 大切な 馬を 失ったと 伝わるのよ。' },
      ],
    },
    revealText: '松川様の 弱点が 明かされた！ 敬いの呼び声が よく効くように なった。',
    restoreLines: [
      '背に 刺さっていた 古い矢が、すっと 抜け落ちた……',
      '松川様は 元の すがたを 取りもどした！',
    ],
    hosoku: 'ほんとうの お話では、松川様は 射られても 死なず、川を 渡る 殿様に 襲いかかったと 伝わるの。殿様は 愛馬を 失ったそうよ。',
    reward: '松川様の 背に 乗れるように なった！ 海と 川を 渡れる。',
    loseLines: [
      '旅の者たちは 力つきた……',
      '鮫川の 波の音だけが 聞こえている……',
    ],
  },
};
