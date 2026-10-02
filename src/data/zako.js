// 道中の敵（序章いわき）。本人 10/1「道中の敵は癖のあるキャラクター（①スリ 道具を盗む ②呪い ③幽霊が取り付く・それぞれ町で回復）」
// ＋「追加①暴走族 ②ヤクザ ③ホステス ④漁師」（今の姿のまま＝忘れのもやが今の世の者まで引き寄せた）
// ⏸10/2 本人「奇抜なてきも消してほしい」＝今の時代の12人は retired（道中に出ない・データと絵は取っておく）。いまは昔話らしい4体（狐火・狸・藁人形・さまよい霊）だけ
// どれも もやに当てられた者。倒すと正気に戻り、ひと言しゃべって去る（漁師や夜の町で働く人を悪者にしない）
// trick＝癖（rules.js の enemyAct が見る）。chance の見込みで、ふつうの攻撃の代わりに出す
//   steal＝道具を1つ盗んで逃げる（小名浜の番屋に届く）／curse＝1人を呪う（ときどき動けない・平の八幡さまでお祓い）
//   possess＝1人に取り憑く（歩くたびに HP が1減る・湯本のお寺で供養）／noise＝爆音（3ターン 術と語るが使えない）
//   extort＝因縁で文を巻き上げる／charm＝旅の者がうっとり（1ターン動けない）／net＝網で1人を止める（1ターン）
//   lecture＝長い講釈で1人が眠くなる（1ターン）／runaway＝その子が逃げてしまう（戦いが終わる・経験なし）
//   drink＝栄養ドリンクで自分の HP を戻す／boil＝熱々のスープで全員にダメージ／wasabi＝わさびで1人が涙で動けない（1ターン）
//   blind＝自撮りのフラッシュで目がくらむ（2ターン「たたかう」が半分外れる）
// zone＝出る所（game.js の encounterTable）。drop＝倒すとくれる道具
export const ZAKO = {
  kitsunebi: {
    name: '狐火', hp: 18, atk: 9, def: 2, agi: 7, exp: 5, mon: 4,
    biteName: 'ゆらめく炎', zones: ['south', 'midSouth', 'midNorth', 'north'],
    introText: '青い 火が、ふわりと 寄ってきた……',
    restoreLines: ['狐火は ぽっと 小さくなって、野の 向こうへ 消えていった。'],
  },
  tanuki: {
    name: '巾着切りの狸', hp: 20, atk: 8, def: 2, agi: 12, exp: 6, mon: 7,
    biteName: 'ひっかき', zones: ['south', 'midSouth', 'midNorth'],
    trick: { kind: 'steal', chance: 0.25 },
    introText: '頬かむりの 狸が、こちらの 懐を じっと 見ている……',
    restoreLines: ['狸は 「化けるのは もう こりごり」と、しっぽを 巻いて 逃げていった。'],
  },
  wara: {
    name: '藁人形', hp: 24, atk: 9, def: 4, agi: 6, exp: 8, mon: 6,
    biteName: '藁の 腕', zones: ['midNorth', 'north', 'midSouth'],
    trick: { kind: 'curse', chance: 0.25 },
    introText: '藁人形が、ひとりでに 立ち上がった……',
    restoreLines: ['藁人形は ぱさりと 崩れ、ただの 藁の 束に もどった。'],
  },
  rei: {
    name: 'さまよい霊', hp: 22, atk: 9, def: 3, agi: 8, exp: 8, mon: 5,
    biteName: 'つめたい 手', zones: ['midSouth', 'north', 'south'],
    trick: { kind: 'possess', chance: 0.25 },
    introText: 'さびしそうな 霊が、すうっと 近づいてくる……',
    restoreLines: ['霊は 「だれかに 思い出して ほしかった」と つぶやいて、うすれていった。'],
  },
  bosozoku: {
    name: '暴走族', retired: true, hp: 28, atk: 11, def: 4, agi: 13, exp: 8, mon: 8,
    biteName: '体当たり', zones: ['road'],
    trick: { kind: 'noise', chance: 0.3 },
    introText: 'けたたましい 音を 立てて、バイクが 突っ込んできた！',
    restoreLines: ['暴走族は 我に かえり、「……ヘルメット かぶって 帰るわ」と 押して 帰っていった。'],
  },
  yakuza: {
    name: 'ヤクザ', retired: true, hp: 32, atk: 12, def: 5, agi: 9, exp: 9, mon: 12,
    biteName: '頭突き', zones: ['midNorth'],
    trick: { kind: 'extort', chance: 0.3, amount: 8 },
    introText: '「おう、そこの 旅の もん。いま 目ぇ 合ったよな？」',
    restoreLines: ['ヤクザは 目を ぱちくりさせ、「……すまねえ、どうかしてた」と 頭を 下げて 去っていった。'],
  },
  hostess: {
    name: 'ホステス', retired: true, hp: 26, atk: 8, def: 3, agi: 11, exp: 8, mon: 10,
    biteName: '扇子で ぴしゃり', zones: ['midSouth', 'midNorth'],
    trick: { kind: 'charm', chance: 0.3 },
    introText: '「あら、いい男。ちょっと 寄って いかない？」',
    restoreLines: ['ホステスは 「やだ、わたし 何してたのかしら」と 笑って、夜の 町へ 帰っていった。'],
  },
  ryoshi: {
    name: '漁師', retired: true, hp: 34, atk: 12, def: 5, agi: 7, exp: 9, mon: 6,
    biteName: '櫂で ひと振り', zones: ['coast'],
    trick: { kind: 'net', chance: 0.3 },
    drop: 'yakusou',
    introText: '「おう、どいた どいた！」と、漁師が 網を 振りかぶった！',
    restoreLines: ['漁師は 「わりいな、頭が かーっと なっちまって」と 頭を かいた。'],
  },
  // ---- 追加3人（本人 10/1「追加①ガリ勉君 ②いじめられっ子 ③不良のパシリ 全部弱い」）。pending＝絵がまだ（出会いの表に入れない）----
  gariben: {
    name: 'ガリ勉君', retired: true, hp: 12, atk: 5, def: 1, agi: 5, exp: 3, mon: 2,
    biteName: '参考書の 角', zones: ['midNorth', 'midSouth'],
    trick: { kind: 'lecture', chance: 0.3 },
    introText: '「きみたち、この 問題 わかる？」と メガネが 光った！',
    restoreLines: ['ガリ勉君は 「……たまには 外を 歩くのも いいな」と メガネを ふいた。'],
  },
  ijime: {
    // 殴って笑う相手にしない：もやに当てられて うずくまる子。目をさまさせると 自分で顔を上げる
    name: 'いじめられっ子', retired: true, hp: 10, atk: 3, def: 1, agi: 9, exp: 3, mon: 1,
    biteName: 'やけくその パンチ', zones: ['midSouth', 'south'],
    trick: { kind: 'runaway', chance: 0.35 },
    introText: 'うつむいた 子が、黒い もやの 中で ふるえている……',
    restoreLines: ['もやが 晴れると、その子は 顔を 上げた。', '「……ぼく、もう 逃げない」 そう言って、町の ほうへ 歩いていった。'],
  },
  pashiri: {
    name: '不良のパシリ', retired: true, hp: 14, atk: 6, def: 2, agi: 12, exp: 3, mon: 3,
    biteName: 'へなちょこ キック', zones: ['road', 'midNorth'],
    trick: { kind: 'extort', chance: 0.3, amount: 3 },
    introText: '「せ、先輩に パン代 持ってかないと いけないんス！」',
    restoreLines: ['パシリは 「……自分の パンは 自分で 買えって 言ってやるっス」と 胸を 張った。'],
  },
  // ---- 追加3人（本人 10/1「追加①サラリーマン ②ラーメン屋 ③寿司屋」）。pending＝絵がまだ ----
  salaryman: {
    name: 'サラリーマン', retired: true, hp: 26, atk: 9, def: 4, agi: 8, exp: 7, mon: 9,
    biteName: '名刺 手裏剣', zones: ['road', 'midNorth'],
    trick: { kind: 'drink', chance: 0.25, amount: 12 },
    introText: '「ま、まだ 帰れないんです……」と、目の下に くまを つくった 男が 立ちふさがった！',
    restoreLines: ['サラリーマンは ネクタイを ゆるめ、「……今日は 定時で 帰ります」と 笑った。'],
  },
  ramen: {
    name: 'ラーメン屋', retired: true, hp: 30, atk: 10, def: 4, agi: 7, exp: 8, mon: 8,
    biteName: '湯切り', zones: ['midNorth', 'midSouth'],
    trick: { kind: 'boil', chance: 0.25, power: 7 },
    introText: '「へい らっしゃい！ ……って、食い逃げは 許さねえぞ！」',
    restoreLines: ['ラーメン屋は 「すまねえ、スープの 仕込みで 気が 立ってた」と 頭を 下げた。'],
  },
  sushi: {
    name: '寿司屋', retired: true, hp: 28, atk: 10, def: 4, agi: 9, exp: 8, mon: 10,
    biteName: '包丁の 峰打ち', zones: ['coast', 'midSouth'],
    trick: { kind: 'wasabi', chance: 0.3 },
    introText: '「へい、お待ち！」と、寿司屋が わさびを 握りしめた！',
    restoreLines: ['寿司屋は 「……握るのは 寿司だけに しとくぜ」と 鉢巻きを しめ直した。'],
  },
  // 本人 10/1「追加①AV女優 ②ギャル」→ ギャルだけ入れた（AV女優は性的な役になる・ストアの年齢区分・芯から外れる＝見送り）
  gal: {
    name: 'ギャル', retired: true, hp: 22, atk: 8, def: 3, agi: 12, exp: 6, mon: 7,
    biteName: 'デコった スマホで ぺしっ', zones: ['midNorth', 'midSouth'],
    trick: { kind: 'blind', chance: 0.3 },
    introText: '「え、ちょ、旅人とか まじ ウケるんですけど！」',
    restoreLines: ['ギャルは 「え、ウチ なにしてたん？ まじ ウケる」と 笑って、手を 振って 帰っていった。'],
  },
  // 本人 10/1「お色気姉さん」。品よく＝肌は見せない・着物をきちんと着た艶っぽい姉さん・笑いに振る（ドラクエの色仕掛けくらい）
  oiroke: {
    name: 'お色気姉さん', retired: true, hp: 24, atk: 8, def: 3, agi: 11, exp: 7, mon: 9,
    biteName: '帯で ぴしゃり', zones: ['midNorth', 'midSouth'],
    trick: {
      kind: 'charm', chance: 0.3,
      text: 'お色気姉さんの 投げキッス！ 旅の者は 見とれてしまった！ しおりは あきれている……',
      stunText: 'ぽーっとして 動けない！',
    },
    introText: '「あら、旅の おにいさん。ちょっと 休んで いきなさいな」',
    restoreLines: ['お色気姉さんは 「ふふ、からかって ごめんなさいね」と 笑って、ゆうゆうと 去っていった。'],
  },
  // ---- オーソドックスな6体（本人 10/2「昔話らしい4体＋オーソドックスな敵を6体増やして欲しい」）。北へ行くほど強い。pending＝絵がまだ ----
  gama: {
    name: '大ガエル', hp: 26, atk: 9, def: 5, agi: 5, exp: 6, mon: 5,
    biteName: 'のしかかり', zones: ['south', 'midSouth'],
    introText: '草むらから、大きな ガマガエルが のそりと 出てきた。',
    restoreLines: ['大ガエルは ゲコリと 鳴いて、沼の ほうへ はねていった。'],
  },
  yamainu: {
    name: '山犬', hp: 22, atk: 10, def: 3, agi: 14, exp: 7, mon: 4,
    biteName: 'かみつき', zones: ['south', 'north'],
    introText: 'うなり声を 上げて、山犬が 飛び出してきた！',
    restoreLines: ['山犬は しっぽを 下げて、山へ 帰っていった。'],
  },
  karasu: {
    name: '化けガラス', hp: 20, atk: 8, def: 3, agi: 13, exp: 7, mon: 8,
    biteName: 'くちばし', zones: ['midSouth', 'midNorth'],
    trick: { kind: 'steal', chance: 0.25, verb: 'くわえて 飛び去った' },
    introText: '大きな カラスが、光る物を ねらって 舞い降りた。',
    restoreLines: ['化けガラスは カアと 鳴いて、空の 向こうへ 消えていった。'],
  },
  inoshishi: {
    name: '大猪', hp: 34, atk: 12, def: 6, agi: 7, exp: 9, mon: 6,
    biteName: 'きばで 突く', zones: ['midNorth'],
    trick: { kind: 'boil', chance: 0.25, power: 9, text: '大猪の 突進！' },
    introText: '地ひびきを 立てて、大猪が 突っ込んできた！',
    restoreLines: ['大猪は 鼻を 鳴らして、林の 奥へ 走り去った。'],
  },
  mukade: {
    name: '大ムカデ', hp: 36, atk: 14, def: 7, agi: 9, exp: 11, mon: 7,
    biteName: '毒の あご', zones: ['north'],
    introText: '岩の すき間から、大ムカデが ぞろりと 這い出てきた。',
    restoreLines: ['大ムカデは 岩の 下へ もぐって、見えなくなった。'],
  },
  kumo: {
    name: '大蜘蛛', hp: 32, atk: 12, def: 6, agi: 10, exp: 11, mon: 8,
    biteName: '長い あし', zones: ['north'],
    trick: { kind: 'net', chance: 0.3, text: '大蜘蛛は 糸を 吐いた！', stunText: '糸に からまって 動けない！' },
    introText: '木の上から、大蜘蛛が 糸を つたって 下りてきた。',
    restoreLines: ['大蜘蛛は 糸を たぐって、木の 上へ 消えていった。'],
  },
};

// 道中の戦いで しおりが「語る」とき（雑魚には昔話が無い＝弱点は無いが、ひと言）
export const ZAKO_TELL = 'この者は 昔話の 主では ないみたい。もやに 当てられて いるだけ。たたかって 目を さまさせましょう。';
