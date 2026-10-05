import { gearAt } from '../data/equip.js?v=177'; // 10/5 武器と防具は職業ごと＝店は段で並べる
// ⭐10/2 本人「湯本、平、両方神社が見えない」＝上の2段は画面の上の札（HP・文）に隠れる＝どの町も上に杉の並木を2段足して、中身を2段下げた（TOP）
// 町の中の地図と、町の人（本人 10/1「平(城下町、武器がある)、湯本(温泉回復、温泉饅頭)、小名浜(めひかり、かつお、貝焼き)」）
// 字の意味は tiles.js の TOWN_TERRAIN。x＝町の出口（踏むと歩く地図へ戻る）。どの町も 13×14・入ると (6,12) に立つ
// 人の role：shrine＝お参りで記録・お祓い・勝守／inn＝温泉宿／shop＝道具屋／temple＝供養・厄除け守／bansho＝番屋／equip＝刀屋・荒物屋（goods＝src/data/equip.js）
// 店の人はカウンター（c）の奥に立つ＝カウンター越しに話せる
// props＝建物の絵（look.js の OBJECTS）を x,y から w×h マスに置く（絵は幅を w マスに合わせ、下の辺をそろえる＝上にはみ出してよい）
// 2026-10-02 本人「いわきを作り直し」で Gemini の建物に。店の人は建物の戸口（下の段）に立ち、手前にカウンター
export const TOWN_ENTRY = { x: 6, y: 12 };
// 10/5 夜：屋根のマスに立っていた町の人10人（小名浜・小高・相馬・福島・須賀川）を となりの屋根のかからないマスへ移した。屋根で切れて行けなくなる角（町の人の横）は杉の木にした（本人「ふさぐことで人が通れないことが無いように」・tests/roof.test.js）

// ⭐屋根のマス（10/5 夜 本人「町や城で、屋根の上に乗るのは辞めて」）
// 建物の絵は下の辺をそろえて上へはみ出す＝はみ出した屋根が ROOF_MIN ドット以上かかる 歩けるマスは通れない（game.js の canWalk）
// 絵の大きさ（ドット）＝assets/tiles/o_<名>.png。tests/roof.test.js が 絵と合っているかを見る（絵を描き直したら ここも直す）
export const ROOF_PX = { jinja: [96, 111], mise: [128, 95], tera: [96, 77], yadoya: [128, 113], minka: [96, 73], counter: [64, 27], toro: [22, 38], fune: [64, 38], shiro: [44, 51] };
export const ROOF_MIN = 10;
export function roofCells(props, cell = 32) {
  const out = new Set();
  for (const p of props ?? []) {
    const px = ROOF_PX[p.img];
    if (!px) continue;
    const k = p.w > 1 ? (p.w * cell) / px[0] : 1;
    const top = (p.y + p.h) * cell - px[1] * k; // 絵の上の端
    for (let y = p.y - 1; y >= 0 && (y + 1) * cell - top >= ROOF_MIN; y--) for (let x = p.x; x < p.x + p.w; x++) out.add(`${x},${y}`);
  }
  return out;
}

export const TOWNS = {
  taira: {
    name: '平',
    props: [
      { img: 'jinja', x: 5, y: 2, w: 3, h: 2 },
      { img: 'mise', x: 0, y: 7, w: 4, h: 2 }, { img: 'counter', x: 1, y: 9, w: 2, h: 1 },
      { img: 'mise', x: 9, y: 7, w: 4, h: 2 }, { img: 'counter', x: 10, y: 9, w: 2, h: 1 },
      { img: 'toro', x: 4, y: 5, w: 1, h: 1 }, { img: 'toro', x: 8, y: 5, w: 1, h: 1 },
    ],
    rows: [
      'TTTTTTTTTTTTT',
      'TTTTTTTTTTTTT',
      'TTTTTzzzTTTTT',
      'TTTTTzzz.TTTT',
      'TTT...=...TTT',
      'TT....t....TT',
      'T.....=.....T',
      '####..=..####',
      '#__#..=..#__#',
      '#cc#..=..#cc#',
      '.===========.',
      'T.....=.....T',
      'T.....=.....T',
      'TTTTTTxTTTTTT',
    ],
    npcs: [
      { x: 4, y: 4, look: 'kannushi', role: 'shrine', lines: ['ようこそ 八幡さまへ。'] },
      { x: 1, y: 8, look: 'kaji', role: 'equip', goods: gearAt([1, 2]), items: ['tama'], lines: ['刀屋だ。腕に 合った 得物を 選びな。'] },
      { x: 11, y: 8, look: 'shonin', role: 'equip', goods: gearAt([], [1, 2]), lines: ['荒物屋だよ。旅の 支度なら まかせて おくれ。'] },
      { x: 3, y: 11, look: 'machibito', lines: ['ここは 平の 城下町。お城の まわりに 町が ひらけたんだ。'] },
      { x: 9, y: 12, look: 'musume', lines: ['黒い もやが 出てから、昔話を 語る 人が へってしまって……'] },
      // 初めての人への助言（本人 10/2「各町の町人を増やして、初心者向けのアドバイスを。武器や防具の必要性。術の効果など」）
      // 平＝武器と防具・記録
      { x: 10, y: 5, look: 'yakunin', lines: [
        '昔話の ぬしは 体が 固い。木の棒の ままでは、たたいても ほとんど 効かんぞ。',
        '刀屋で 得物を 買えば「たたかう」が 強くなる。買えば すぐ 着けられて、前の 品は 半値で 引き取って くれる。',
      ] },
      { x: 2, y: 5, look: 'toshiyori', lines: [
        '荒物屋の 笠や 脚絆、蓑は 守りを 上げる。道中の 敵に かまれても 痛くなくなるぞい。',
        '「どうぐ」の「そうびを 見る」で、いまの 強さと 着けている 物が わかるんじゃ。',
      ] },
      { x: 10, y: 11, look: 'kodomo', lines: [
        '八幡さまで お参りすると、旅を 記録できるよ。',
        '負けても、記録した 所から やり直せるんだ。ただし 文は 半分に なっちゃうけどね。',
      ] },
    ],
  },
  yumoto: {
    name: '湯本',
    props: [
      { img: 'tera', x: 5, y: 2, w: 3, h: 2 },
      { img: 'yadoya', x: 0, y: 6, w: 4, h: 2 }, { img: 'counter', x: 1, y: 8, w: 2, h: 1 },
      { img: 'mise', x: 9, y: 6, w: 4, h: 2 }, { img: 'counter', x: 10, y: 8, w: 2, h: 1 },
    ],
    rows: [
      'TTTTTTTTTTTTT',
      'TTTTTTTTTTTTT',
      'TTTTTzzzTTTTT',
      'TTTTTzzz.TTTT',
      'TTT...=...TTT',
      'T.....=.....T',
      '####..=..####',
      '#__#..=..#__#',
      '#cc#..=..#cc#',
      '.===========.',
      'T.uuu.=.....T',
      'T.uuu.=.....T',
      'T.....=.....T',
      'TTTTTTxTTTTTT',
    ],
    npcs: [
      { x: 4, y: 4, look: 'osho', role: 'temple', lines: ['湯本の 寺じゃ。迷うた 霊が 憑いたら、供養して 進ぜよう。'] },
      { x: 1, y: 7, look: 'okami', role: 'inn', price: 10, lines: ['いらっしゃいませ。湯本の いで湯の 宿で ございます。'] },
      { x: 11, y: 7, look: 'musume', role: 'shop', goods: ['yakusou', 'reisui'], lines: ['道具屋で ございます。薬草は いかが？'] },
      { x: 8, y: 11, look: 'machibito', lines: ['湯に つかると、旅の 疲れが すっかり とれるよ。'] },
      { x: 3, y: 12, look: 'chaya', lines: ['湯けむりを 見ながら、ひと休み していって くださいな。'] },
      // 湯本＝語りと術・もや・回復・呪い
      { x: 7, y: 5, look: 'toshiyori', lines: [
        '昔話の ぬしと 戦うときは、まず しおりさんに「語って」もらうんじゃ。',
        '語ると ぬしの 弱点が 明かされて、弱点の 術が 何倍も 効くように なる。語らずに 術を 撃っても、ほとんど 効かんぞ。',
      ] },
      { x: 5, y: 5, look: 'machibito', lines: [
        'ぬしの まわりの 黒い もやに 気を つけな。もやが 残っていると、術は 半分しか 届かない。',
        '「たたかう」と もやが ひとつ 晴れる。たたかって もやを 払ってから 術、が 近道だよ。',
      ] },
      { x: 10, y: 12, look: 'kodomo', lines: [
        '術を 使うと「術の力」が へるんだよ。霊水を 飲むか、湯本の 宿に 泊まれば 満タンに なるよ。',
        '呪われたら 平の 八幡さまで お祓い、霊が 憑いたら この お寺で 供養だって。',
      ] },
    ],
  },
  onahama: {
    name: '小名浜',
    props: [
      { img: 'fune', x: 2, y: 2, w: 2, h: 1 }, { img: 'fune', x: 9, y: 3, w: 2, h: 1 },
      { img: 'mise', x: 0, y: 6, w: 4, h: 2 }, { img: 'counter', x: 1, y: 8, w: 2, h: 1 },
      { img: 'minka', x: 9, y: 6, w: 4, h: 2 }, { img: 'counter', x: 10, y: 8, w: 2, h: 1 },
    ],
    rows: [
      '~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~',
      ',,,,,,=,,,,,,',
      '......=......',
      '####..=..####',
      '#__#..=..#__#',
      '#cc#..=..#cc#',
      '.===========.',
      'T.....=.....T',
      'T.....=.....T',
      'T.....=.....T',
      'TTTTTTxTTTTTT',
    ],
    npcs: [
      { x: 1, y: 7, look: 'shonin', role: 'shop', goods: ['yakusou', 'jouyakusou', 'reisui'], lines: ['へい らっしゃい！ 小名浜の 道具屋だ。'] },
      { x: 11, y: 7, look: 'yakunin', role: 'bansho', lines: ['番屋だ。盗まれた 物は ここに 届く。いまは 何も 預かって おらん。'] },
      // 釣り番（本人 10/2「小名浜のまちがあまり機能しない」→「漁港で釣り＋景品」）
      { x: 4, y: 5, look: 'ryoshi', role: 'fishing', lines: ['小名浜は 港町。めひかりも カツオも ここで 揚がるんだ。', '竿を 貸すぜ。釣れた 魚で 釣り点が たまる。点は 景品と 換えて やろう。'] },
      { x: 9, y: 11, look: 'kodomo', lines: ['鮫川の 河口に、黒い もやが うずまいてたんだって！'] },
      // 閼伽井嶽の龍燈＝海から山の お堂へ 灯が のぼる言い伝え（第四話の手がかり）
      { x: 4, y: 12, look: 'toshiyori', lines: ['海から 山の お堂へ、灯が のぼっていく……。', 'わしが 若いころは、閼伽井嶽の 龍の 灯を 見た 者も おったもんじゃ。'] },
      // 小名浜＝自動・仲間・鉄砲
      { x: 2, y: 11, look: 'musume', lines: [
        '戦いに 迷ったら「自動」に 任せても いいのよ。しおりさんが 語って、みんなが 動いて くれるわ。',
        '自動を やめたいときは、下の 窓の 上の「自動中」の 札を さわってね。',
      ] },
      { x: 8, y: 5, look: 'machibito', lines: [
        '沼の ほうには 腕の いい 猟師が いるって 話だ。仲間に なって くれたら 心強いぜ。',
        '猟師の 鉄砲は、黒い もやが 晴れてから 撃つもんだ。玉は 平の 刀屋で 売ってるよ。',
      ] },
      { x: 8, y: 12, look: 'chaya', lines: [
        '仲間が 力つきて 幽霊に なったら、宿では 戻らないの。',
        '平の 八幡さまか 湯本の お寺で、文を 納めれば 生き返らせて もらえるわ。',
      ] },
    ],
  },
  // ---- 1章 相馬（10/3・本人「4話分進めて」）。町の形は平と同じ（神社・左右の店）。shrineName／shrineLine＝お参りの名と、しおりの一言 ----
  odaka: {
    name: '小高',
    shrineName: '小高の 神社',
    shrineLine: '小高の 神社で 旅の 無事を お願いしましょう。大悲山は この 町の 西よ。',
    props: [
      { img: 'jinja', x: 5, y: 2, w: 3, h: 2 },
      { img: 'yadoya', x: 0, y: 7, w: 4, h: 2 }, { img: 'counter', x: 1, y: 9, w: 2, h: 1 },
      { img: 'mise', x: 9, y: 7, w: 4, h: 2 }, { img: 'counter', x: 10, y: 9, w: 2, h: 1 },
      { img: 'toro', x: 4, y: 5, w: 1, h: 1 }, { img: 'toro', x: 8, y: 5, w: 1, h: 1 },
    ],
    rows: [
      'TTTTTTTTTTTTT',
      'TTTTTTTTTTTTT',
      'TTTTTzzzTTTTT',
      'TTTTTzzzTTTTT',
      'TTTT..=...TTT',
      'T.....t....TT',
      'T.....=.....T',
      '####..=..####',
      '#__#..=..#__#',
      '#cc#..=..#cc#',
      '.===========.',
      'T.....=.....T',
      'T.....=.....T',
      'TTTTTTxTTTTTT',
    ],
    npcs: [
      { x: 4, y: 4, look: 'kannushi', role: 'shrine', lines: ['ようこそ 小高の 神社へ。'] },
      { x: 1, y: 8, look: 'okami', role: 'inn', price: 15, lines: ['いらっしゃいませ。小高の 宿で ございます。'] },
      { x: 11, y: 8, look: 'shonin', role: 'equip', goods: gearAt([3], [2, 3]), items: ['yakusou', 'jouyakusou', 'tokujou', 'reisui', 'goshinsui', 'tama'], lines: ['小高の よろず屋だ。それぞれの 腕に 合った 得物と 防具、薬も あるぜ。'] }, // 10/3 本人「よろず屋でも採用」＝道具も置く
      { x: 10, y: 11, look: 'musume', role: 'shop', goods: ['yakusou', 'jouyakusou', 'tokujou', 'reisui', 'goshinsui'], lines: ['旅の 薬売りで ございます。相馬の 道は 敵が 強いので、よく 効く 薬を そろえて おります。'] }, // 10/3 本人「道具も強く」
      // 話の手がかり（出どころで確かめた筋だけ）
      { x: 9, y: 12, look: 'ryoshi', lines: [
        '金谷の 山には 行くなよ。鹿を 追って 山に 入った 猟師が、ざるの ような 頭の 女の 化け物に 会ったそうだ。',
        '化け物は 乱れ髪を 地面に 引きずって、にたりと 笑ったと。……それから その 猟師は、殺生を やめたんだと。',
      ] },
      { x: 3, y: 11, look: 'toshiyori', lines: [
        '西の 大悲山には 薬師堂が あってな、むかし 玉都という 琵琶法師が こもって 琵琶を 弾いておった。',
        '堂の 前の 池の 大蛇が、武士に 化けて 玉都の もとへ 来たという 話じゃ。',
      ] },
      { x: 10, y: 5, look: 'yakunin', lines: [
        '小高の お城の 殿様は、大悲山の 山や 谷に、大蛇の 苦手な 鉄の 釘を 打たせたと 伝わる。',
        '大悲山の 入口の 黒い もやは、金谷の 山の 化け物の 前で 獲りすぎないと 誓えば 晴れるはずだ。',
      ] },
      { x: 4, y: 5, look: 'kodomo', lines: [
        '相馬の 道は いわきより 敵が 強いよ。レベルを 上げて、よろず屋で 得物を そろえてから 行こう。',
        '小高と 相馬の 町には、職業ごとの 師匠が いるよ。試しに 受かると 技を 教えて もらえるんだ。',
      ] },
      // ⭐1章の師匠（本人 10/5「それぞれの職業は必殺技が3つあり、1章から3章までのどこかで、クエストを受けて習得する」）＝jobs.js の QUESTS[1]。歩く絵は町の人の絵を借りる
      { x: 8, y: 4, look: 'osho', role: 'master', job: 'sou', ch: 1, lines: ['小高の 寺の 和尚じゃ。', '真言は、この 土地の 昔を 知る 者が となえて こそ 届く。わしの 問いに 答えて みよ。'] },
      { x: 4, y: 6, look: 'machibito', role: 'master', job: 'yamabushi', ch: 1, lines: ['羽黒の 山で 修行した 山伏だ。', '法螺貝は 腹の 底から 吹く もの。わしと 一騎打ちを して、腕を 見せよ。'] },
      { x: 7, y: 5, look: 'chaya', role: 'master', job: 'yojutsu', ch: 1, lines: ['山に こもって 術を みがく 者です。', '幻の 術は、己の 姿を 見失わぬ 者にしか 使えません。一騎打ちで 確かめましょう。'] },
      { x: 4, y: 8, look: 'kashira', role: 'master', job: 'ninja', ch: 1, lines: ['……忍びの 師匠だ。', '煙玉は 投げる 間合いが 命。一騎打ちで 間合いを 見せて みよ。'] },
      { x: 1, y: 11, look: 'shonin', role: 'master', job: 'kusushi', ch: 1, lines: ['小高の 薬屋の 主で ございます。', '丸薬は 土地の 草と 水で 作る もの。この 土地の 話を どれほど 知って おられるか、問うて みましょう。'] },
    ],
  },
  nakamura: {
    name: '相馬',
    shrineName: '相馬の 神社',
    shrineLine: '相馬の 神社で 旅の 無事を お願いしましょう。北の 鹿狼山と、西の 虎捕山へ 行けるわ。',
    props: [
      { img: 'jinja', x: 5, y: 2, w: 3, h: 2 },
      { img: 'mise', x: 0, y: 7, w: 4, h: 2 }, { img: 'counter', x: 1, y: 9, w: 2, h: 1 },
      { img: 'yadoya', x: 9, y: 7, w: 4, h: 2 }, { img: 'counter', x: 10, y: 9, w: 2, h: 1 },
      { img: 'toro', x: 4, y: 5, w: 1, h: 1 }, { img: 'toro', x: 8, y: 5, w: 1, h: 1 },
    ],
    rows: [
      'TTTTTTTTTTTTT',
      'TTTTTTTTTTTTT',
      'TTTTTzzzTTTTT',
      'TTTTTzzzTTTTT',
      'TTT...=..TTTT',
      'TT....t.....T',
      'T.....=.....T',
      '####..=..####',
      '#__#..=..#__#',
      '#cc#..=..#cc#',
      '.===========.',
      'T.....=.....T',
      'T.....=...T.T',
      'TTTTTTxTTTTTT',
    ],
    npcs: [
      { x: 4, y: 4, look: 'kannushi', role: 'shrine', lines: ['ようこそ 相馬の 神社へ。'] },
      { x: 1, y: 8, look: 'kaji', role: 'equip', goods: gearAt([4], [3, 4]), items: ['tama'], lines: ['相馬の 刀屋だ。職人ごとの 得物と 防具を そろえて あるぜ。'] },
      { x: 10, y: 11, look: 'shonin', role: 'shop', goods: ['jouyakusou', 'tokujou', 'goshinsui', 'kusuribako'], lines: ['相馬の 道具屋だ。薬箱は 皆の 傷を いっぺんに 手当て できるぜ。'] }, // 10/3 本人「道具も強く」
      { x: 11, y: 8, look: 'okami', role: 'inn', price: 18, lines: ['いらっしゃいませ。相馬の 宿で ございます。'] },
      { x: 9, y: 12, look: 'ryoshi', lines: [
        '海から 帰る 舟は、北の 鹿狼山を 目印に するんだ。',
        '鹿狼山の 手長明神さまは、白い 鹿と 白い 狼を 従えた 手の 長い 神さま。海と 人の 暮らしを 見守って くださる。',
      ] },
      { x: 3, y: 11, look: 'toshiyori', lines: [
        '新地の 貝塚はな、食べた 貝を 捨てた 跡じゃと 伝わる。海の めぐみに 感謝を 忘れては いかん。',
      ] },
      { x: 8, y: 5, look: 'yakunin', lines: [
        '西の 虎捕山には、平安の むかし、橘墨虎という 凶賊が 隠れて おったそうだ。',
        '源頼義さまが 白い 狼の 足跡を たどって、墨虎を 捕らえた。それで「虎捕山」と よぶのだ。',
      ] },
      { x: 2, y: 5, look: 'musume', lines: [
        '虎捕山の 入口の もやは、鹿狼山の 手長明神さまを 元に もどせば 晴れると 思うの。',
      ] },
      // ⭐1章の師匠（10/5・jobs.js の QUESTS[1]）。道場の師範（10/4 武士の試し合い）は 武士の師匠へ
      { x: 11, y: 12, look: 'yakunin', role: 'master', job: 'bushi', ch: 1, lines: ['相馬の 剣術道場の 師範だ。', 'わしと 木刀で 試し合いを して、2本 取れば、わが 流の 奥義を さずけよう。'] },
      { x: 8, y: 4, look: 'musume', role: 'master', job: 'miko', ch: 1, lines: ['相馬の 神社の 巫女頭です。', '神楽は 神さまに ささげる 舞。太鼓に 合わせて 鈴を 振れたら、舞を お伝えしましょう。'] },
      { x: 4, y: 6, look: 'toshiyori', role: 'master', job: 'onmyo', ch: 1, lines: ['星と 暦を 読む 陰陽師じゃ。', '呪符は 名と いわれを 知って こそ 効く。相馬の 昔話を 問うて みよう。'] },
      { x: 8, y: 6, look: 'ryoshi', role: 'master', job: 'rikishi', ch: 1, lines: ['相撲の 親方だ。', '四股は 大地を しずめる 足踏み。わしと 一番 取って、力を 見せて みろ。'] },
      { x: 1, y: 11, look: 'kaji', role: 'master', job: 'yumi', ch: 1, lines: ['弓の 師匠だ。', '鏑矢は 鳴る 矢。動く 的を 射ぬけたら、引き方を 教えよう。'] },
    ],
  },
  // ---- 2章 県北（10/4・本人「順番に制作を」）。町の形は小高・相馬と同じ。話の手がかりは出どころで確かめた筋だけ（vault 日本昔話/2026-10-04-調査-福島昔話クエスト2章県北5話.md）----
  fukushima: {
    name: '福島',
    shrineName: '福島の 神社',
    shrineLine: '福島の 神社で 旅の 無事を お願いしましょう。北の 信夫山は すぐそこよ。',
    props: [
      { img: 'jinja', x: 5, y: 2, w: 3, h: 2 },
      { img: 'yadoya', x: 0, y: 7, w: 4, h: 2 }, { img: 'counter', x: 1, y: 9, w: 2, h: 1 },
      { img: 'mise', x: 9, y: 7, w: 4, h: 2 }, { img: 'counter', x: 10, y: 9, w: 2, h: 1 },
      { img: 'toro', x: 4, y: 5, w: 1, h: 1 }, { img: 'toro', x: 8, y: 5, w: 1, h: 1 },
    ],
    rows: [
      'TTTTTTTTTTTTT',
      'TTTTTTTTTTTTT',
      'TTTTTzzzTTTTT',
      'TTTTTzzz.TTTT',
      'TTTT..=...TTT',
      'T.....t....TT',
      'T.....=.....T',
      '####..=..####',
      '#__#..=..#__#',
      '#cc#..=..#cc#',
      '.===========.',
      'T.....=.....T',
      'T.....=.....T',
      'TTTTTTxTTTTTT',
    ],
    npcs: [
      { x: 4, y: 4, look: 'kannushi', role: 'shrine', lines: ['ようこそ 福島の 神社へ。'] },
      { x: 1, y: 8, look: 'okami', role: 'inn', price: 22, lines: ['いらっしゃいませ。福島の 宿で ございます。'] },
      { x: 11, y: 8, look: 'kaji', role: 'equip', goods: gearAt([5], [4, 5]), items: ['tokujou', 'goshinsui', 'kusuribako', 'tama'], lines: ['福島の 刀屋だ。信夫山の 化け物に 負けない 得物を そろえて いけ。'] },
      { x: 9, y: 12, look: 'shonin', lines: [
        '信夫山には むかし、ご坊狐という 狐が いてな。お山の 和尚さんに 化けて、木の葉の 小判で 魚を 買って いったそうだ。',
      ] },
      { x: 3, y: 11, look: 'toshiyori', lines: [
        '信夫山の 北の 坂には 大きな ムカデ、南の 黒沼には 大きな オロチが すんで、どちらも「信夫山の 主」を 名乗って おった。',
        '二匹は 山の 西の はしで 出くわして、たがいに 傷つけあって ほろんだと いう 話じゃ。',
      ] },
      { x: 10, y: 5, look: 'musume', lines: [
        '信夫山の 中ほどには ねこ稲荷が あるの。改心した 狐が、蚕の 守り神として まつられて いるのよ。',
      ] },
      { x: 4, y: 5, look: 'kodomo', lines: [
        '東の 霊山の ほうでは、夜に 飴を 買いに くる 女の 人の 話が あるんだって。',
      ] },
      // 黒脛巾組の頭（本人 10/4 夜「しおりが弱すぎる。女くノ一として、途中クエストを受け変身」→ 2章・黒脛巾組・忍びの試し）
      // 黒脛巾組＝伊達政宗の忍びの組。信夫郡 鳥谷野城の城主 安部対馬が 腕の立つ者50人を選んだと伝わる（実在には異説＝「伝わる」で語る）
      { x: 11, y: 11, look: 'kashira', role: 'shinobi', lines: [
        '黒い 脛巾（はばき）の 男「……わしらは 黒脛巾組と 呼ばれて おる。伊達の 殿さまの 忍びよ。」',
        '男「信夫郡の 鳥谷野の 城主さまが、腕の 立つ 者を 五十人 選んだのが 始まりと 伝わる。」',
      ] },
    ],
  },
  nihonmatsu: {
    name: '二本松',
    shrineName: '二本松の 神社',
    shrineLine: '二本松の 神社で 旅の 無事を お願いしましょう。安達ヶ原の 観世寺は 町の 西よ。',
    props: [
      { img: 'jinja', x: 5, y: 2, w: 3, h: 2 },
      { img: 'mise', x: 0, y: 7, w: 4, h: 2 }, { img: 'counter', x: 1, y: 9, w: 2, h: 1 },
      { img: 'yadoya', x: 9, y: 7, w: 4, h: 2 }, { img: 'counter', x: 10, y: 9, w: 2, h: 1 },
      { img: 'toro', x: 4, y: 5, w: 1, h: 1 }, { img: 'toro', x: 8, y: 5, w: 1, h: 1 },
    ],
    rows: [
      'TTTTTTTTTTTTT',
      'TTTTTTTTTTTTT',
      'TTTTTzzzTTTTT',
      'TTTTTzzz.TTTT',
      'TTT...=...TTT',
      'T.....t.....T',
      'T.....=.....T',
      '####..=..####',
      '#__#..=..#__#',
      '#cc#..=..#cc#',
      '.===========.',
      'T.....=.....T',
      'T.....=.....T',
      'TTTTTTxTTTTTT',
    ],
    npcs: [
      { x: 4, y: 4, look: 'kannushi', role: 'shrine', lines: ['ようこそ 二本松の 神社へ。'] },
      { x: 1, y: 8, look: 'kaji', role: 'equip', goods: gearAt([5], [4, 5]), items: ['tokujou', 'goshinsui', 'kusuribako', 'tama'], lines: ['二本松の 刀屋だ。'] },
      { x: 11, y: 8, look: 'okami', role: 'inn', price: 24, lines: ['いらっしゃいませ。二本松の 宿で ございます。'] },
      { x: 3, y: 11, look: 'toshiyori', lines: [
        '安達ヶ原の 岩屋には、むかし 鬼婆が すんで おった。熊野の お坊さま 祐慶さまが、観音さまの 弓の 力で しずめたと 伝わる。',
      ] },
      { x: 9, y: 12, look: 'ryoshi', lines: [
        '鬼婆は おそろしく 強いと いう。観世寺へ 行く まえに、宿で しっかり 休んで いきな。',
      ] },
    ],
  },
  // ---- 3章 県中・県南（10/4）。町の人の話＝vault 日本昔話/2026-10-04-調査-福島昔話クエスト3章県中県南.md の「町で話せる事実」（確かめた物だけ）----
  koriyama: {
    name: '郡山',
    shrineName: '郡山の 神社',
    shrineLine: '郡山の 神社で 旅の 無事を お願いしましょう。東の 三春に、木の 馬の 話が 伝わっているの。',
    props: [
      { img: 'jinja', x: 5, y: 2, w: 3, h: 2 },
      { img: 'yadoya', x: 0, y: 7, w: 4, h: 2 }, { img: 'counter', x: 1, y: 9, w: 2, h: 1 },
      { img: 'mise', x: 9, y: 7, w: 4, h: 2 }, { img: 'counter', x: 10, y: 9, w: 2, h: 1 },
      { img: 'toro', x: 4, y: 5, w: 1, h: 1 }, { img: 'toro', x: 8, y: 5, w: 1, h: 1 },
    ],
    rows: [
      'TTTTTTTTTTTTT',
      'TTTTTTTTTTTTT',
      'TTTTTzzzTTTTT',
      'TTTTTzzz.TTTT',
      'TTTT..=...TTT',
      'T.....t....TT',
      'T.....=.....T',
      '####..=..####',
      '#__#..=..#__#',
      '#cc#..=..#cc#',
      '.===========.',
      'T.....=.....T',
      'T.....=.....T',
      'TTTTTTxTTTTTT',
    ],
    npcs: [
      { x: 4, y: 4, look: 'kannushi', role: 'shrine', lines: ['ようこそ 郡山の 神社へ。'] },
      { x: 1, y: 8, look: 'okami', role: 'inn', price: 26, lines: ['いらっしゃいませ。郡山の 宿で ございます。'] },
      { x: 11, y: 8, look: 'kaji', role: 'equip', goods: gearAt([6], [5, 6]), items: ['tokujou', 'goshinsui', 'kusuribako', 'tama'], lines: ['郡山の 刀屋だ。大滝根山の 主に 負けない 得物を そろえて いけ。'] },
      { x: 9, y: 12, look: 'shonin', lines: [
        '郡山は 鯉の 町さ。鯉を 育てる 量は、全国の 市町村で いちばんと 言われて いる。',
        '使われなく なった ため池と、糸を とる 蚕の さなぎを 餌に して、鯉を 育てて きたんだ。',
      ] },
      { x: 3, y: 11, look: 'toshiyori', lines: [
        '猪苗代湖の 水を 引いた 安積疏水は、国が はじめて 手がけた 疏水じゃ。いまは 日本遺産に なって おる。',
      ] },
      { x: 10, y: 5, look: 'musume', lines: [
        '北の 日和田の 西方寺には、大蛇の 骨で 作った お地蔵さまが あるそうよ。蛇骨地蔵と いうの。',
      ] },
    ],
  },
  sukagawa: {
    name: '須賀川',
    shrineName: '須賀川の 神社',
    shrineLine: '須賀川の 神社で 旅の 無事を お願いしましょう。町の 東の 狸森に、ふしぎな お坊さまの 話が あるの。',
    props: [
      { img: 'jinja', x: 5, y: 2, w: 3, h: 2 },
      { img: 'mise', x: 0, y: 7, w: 4, h: 2 }, { img: 'counter', x: 1, y: 9, w: 2, h: 1 },
      { img: 'yadoya', x: 9, y: 7, w: 4, h: 2 }, { img: 'counter', x: 10, y: 9, w: 2, h: 1 },
      { img: 'toro', x: 4, y: 5, w: 1, h: 1 }, { img: 'toro', x: 8, y: 5, w: 1, h: 1 },
    ],
    rows: [
      'TTTTTTTTTTTTT',
      'TTTTTTTTTTTTT',
      'TTTTTzzzTTTTT',
      'TTTTTzzz.TTTT',
      'TTT...=...TTT',
      'T.....t.....T',
      'T.....=.....T',
      '####..=..####',
      '#__#..=..#__#',
      '#cc#..=..#cc#',
      '.===========.',
      'T.....=.....T',
      'T.....=.....T',
      'TTTTTTxTTTTTT',
    ],
    npcs: [
      { x: 4, y: 4, look: 'kannushi', role: 'shrine', lines: ['ようこそ 須賀川の 神社へ。'] },
      { x: 1, y: 8, look: 'kaji', role: 'equip', goods: gearAt([6], [5, 6]), items: ['tokujou', 'goshinsui', 'kusuribako', 'tama'], lines: ['須賀川の 刀屋だ。天栄の 川へ 行くなら、具足を そろえて いけ。'] },
      { x: 11, y: 8, look: 'okami', role: 'inn', price: 28, lines: ['いらっしゃいませ。須賀川の 宿で ございます。'] },
      { x: 3, y: 11, look: 'toshiyori', lines: [
        '須賀川の 松明あかしは、四百年 あまり 続く 火祭りじゃ。',
        'むかし 須賀川城が 攻め落とされた ときに 亡くなった 人たちを、松明の 火で とむらうのじゃよ。',
      ] },
      { x: 9, y: 12, look: 'shonin', lines: [
        '須賀川の 牡丹園は 国の 名勝さ。二百五十年 あまり 前、薬に するため 牡丹を 植えたのが はじまりなんだ。',
      ] },
      { x: 9, y: 4, look: 'musume', lines: [
        '狸森の 託善和尚さまは、とても かしこい お坊さまだったそうよ。……でも、その 正体は。',
      ] },
    ],
  },
  shirakawa: {
    name: '白河',
    shrineName: '白河の 神社',
    shrineLine: '白河の 神社で 旅の 無事を お願いしましょう。安珍堂は 町の 南東よ。',
    props: [
      { img: 'jinja', x: 5, y: 2, w: 3, h: 2 },
      { img: 'yadoya', x: 0, y: 7, w: 4, h: 2 }, { img: 'counter', x: 1, y: 9, w: 2, h: 1 },
      { img: 'mise', x: 9, y: 7, w: 4, h: 2 }, { img: 'counter', x: 10, y: 9, w: 2, h: 1 },
      { img: 'toro', x: 4, y: 5, w: 1, h: 1 }, { img: 'toro', x: 8, y: 5, w: 1, h: 1 },
    ],
    rows: [
      'TTTTTTTTTTTTT',
      'TTTTTTTTTTTTT',
      'TTTTTzzzTTTTT',
      'TTTTTzzz.TTTT',
      'TTTT..=...TTT',
      'T.....t....TT',
      'T.....=.....T',
      '####..=..####',
      '#__#..=..#__#',
      '#cc#..=..#cc#',
      '.===========.',
      'T.....=.....T',
      'T.....=.....T',
      'TTTTTTxTTTTTT',
    ],
    npcs: [
      { x: 4, y: 4, look: 'kannushi', role: 'shrine', lines: ['ようこそ 白河の 神社へ。'] },
      { x: 1, y: 8, look: 'okami', role: 'inn', price: 30, lines: ['いらっしゃいませ。白河の 宿で ございます。'] },
      { x: 11, y: 8, look: 'kaji', role: 'equip', goods: gearAt([6], [5, 6]), items: ['tokujou', 'goshinsui', 'kusuribako', 'tama'], lines: ['白河の 刀屋だ。安珍堂の 炎に 負けるなよ。'] },
      { x: 3, y: 11, look: 'toshiyori', lines: [
        '小峰城は、南北朝の ころに 結城親朝が 築き、江戸の はじめに 白河藩の 城として 仕上がった 城じゃ。',
        '南の 南湖は、白河藩主 松平定信が 造った 公園。日本で いちばん 古い 公園とも 言われて おる。',
      ] },
      { x: 9, y: 12, look: 'shonin', lines: [
        '白河の 関は、むかしの 奥州の 三つの 関の ひとつ。芭蕉ほか、たくさんの 旅人が 訪れた 所さ。',
      ] },
      { x: 10, y: 5, look: 'musume', lines: [
        '安珍さまは この 白河の 生まれと 言われて いるの。命日には、安珍堂の 前で 念仏踊りを 奉納して とむらうのよ。',
      ] },
    ],
  },
};

// 歩く地図の字 → 町（Q＝小高・M＝相馬は 1章の地図「相馬」・U＝福島・W＝二本松は 2章の地図「県北」）
export const TOWN_OF = { H: 'taira', Y: 'yumoto', O: 'onahama', Q: 'odaka', M: 'nakamura', U: 'fukushima', W: 'nihonmatsu', g: 'koriyama', s: 'sukagawa', v: 'shirakawa' }; // g／s／v＝3章 県中・県南（10/4）

// 町に入った瞬間の毛筆の名前（10/4 本人「二本松に入るとイラストに『二本松』の文字が無い」＝表が1章の5つで止まっていた）
// 表に無い町も「○○の町」で必ず出す（試験 tests/look.test.js）
export const TOWN_CARD_NAME = { taira: '平の城下町', yumoto: '湯本の湯の町', onahama: '小名浜の港', odaka: '小高の町', nakamura: '相馬の城下町', fukushima: '福島の城下町', nihonmatsu: '二本松の城下町', koriyama: '郡山の町', sukagawa: '須賀川の町', shirakawa: '白河の城下町' };
export const townCardName = (id) => TOWN_CARD_NAME[id] ?? `${TOWNS[id]?.name ?? ''}の町`;

