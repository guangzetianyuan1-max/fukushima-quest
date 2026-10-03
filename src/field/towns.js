// ⭐10/2 本人「湯本、平、両方神社が見えない」＝上の2段は画面の上の札（HP・文）に隠れる＝どの町も上に杉の並木を2段足して、中身を2段下げた（TOP）
// 町の中の地図と、町の人（本人 10/1「平(城下町、武器がある)、湯本(温泉回復、温泉饅頭)、小名浜(めひかり、かつお、貝焼き)」）
// 字の意味は tiles.js の TOWN_TERRAIN。x＝町の出口（踏むと歩く地図へ戻る）。どの町も 13×14・入ると (6,12) に立つ
// 人の role：shrine＝お参りで記録・お祓い・勝守／inn＝温泉宿／shop＝道具屋／temple＝供養・厄除け守／bansho＝番屋／equip＝刀屋・荒物屋（goods＝src/data/equip.js）
// 店の人はカウンター（c）の奥に立つ＝カウンター越しに話せる
// props＝建物の絵（look.js の OBJECTS）を x,y から w×h マスに置く（絵は幅を w マスに合わせ、下の辺をそろえる＝上にはみ出してよい）
// 2026-10-02 本人「いわきを作り直し」で Gemini の建物に。店の人は建物の戸口（下の段）に立ち、手前にカウンター
export const TOWN_ENTRY = { x: 6, y: 12 };

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
      'TTTT.zzz.TTTT',
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
      { x: 4, y: 4, look: 'kannushi', role: 'shrine', lines: ['ようこそ 八幡さまへ。'] },
      { x: 1, y: 8, look: 'kaji', role: 'equip', goods: ['bokuto', 'katana', 'sensu', 'tessen', 'nata', 'yamagatana', 'kashizue', 'kongozue'], items: ['tama'], lines: ['刀屋だ。腕に 合った 得物を 選びな。鉄砲の 玉も 置いてあるぜ。'] },
      { x: 11, y: 8, look: 'shonin', role: 'equip', goods: ['kasa', 'kyahan', 'mino'], lines: ['荒物屋だよ。旅の 支度なら まかせて おくれ。'] },
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
      'TTTT.zzz.TTTT',
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
      { x: 3, y: 5, look: 'ryoshi', role: 'fishing', lines: ['小名浜は 港町。めひかりも カツオも ここで 揚がるんだ。', '竿を 貸すぜ。釣れた 魚で 釣り点が たまる。点は 景品と 換えて やろう。'] },
      { x: 9, y: 11, look: 'kodomo', lines: ['鮫川の 河口に、黒い もやが うずまいてたんだって！'] },
      // 閼伽井嶽の龍燈＝海から山の お堂へ 灯が のぼる言い伝え（第四話の手がかり）
      { x: 4, y: 12, look: 'toshiyori', lines: ['海から 山の お堂へ、灯が のぼっていく……。', 'わしが 若いころは、閼伽井嶽の 龍の 灯を 見た 者も おったもんじゃ。'] },
      // 小名浜＝自動・仲間・鉄砲
      { x: 2, y: 11, look: 'musume', lines: [
        '戦いに 迷ったら「自動」に 任せても いいのよ。しおりさんが 語って、みんなが 動いて くれるわ。',
        '自動を やめたいときは、下の 窓の 上の「自動中」の 札を さわってね。',
      ] },
      { x: 9, y: 5, look: 'machibito', lines: [
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
      'TTTT.zzz.TTTT',
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
      { x: 4, y: 4, look: 'kannushi', role: 'shrine', lines: ['ようこそ 小高の 神社へ。'] },
      { x: 1, y: 8, look: 'okami', role: 'inn', price: 15, lines: ['いらっしゃいませ。小高の 宿で ございます。'] },
      { x: 11, y: 8, look: 'shonin', role: 'equip', goods: ['tachi', 'naginata', 'kumayari', 'shakujo', 'domaru', 'mino'], items: ['yakusou', 'jouyakusou', 'tokujou', 'reisui', 'goshinsui', 'tama'], lines: ['小高の よろず屋だ。太刀も 薙刀も、胴丸も、薬も 鉄砲の 玉も あるぜ。'] }, // 10/3 本人「よろず屋でも採用」＝道具も置く
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
      { x: 2, y: 5, look: 'kodomo', lines: [
        '相馬の 道は いわきより 敵が 強いよ。レベルを 上げて、よろず屋で 得物を そろえてから 行こう。',
        '加わった 仲間は レベルが 低めだから、宿で 休んで 守ってあげてね。',
      ] },
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
      'TTTT.zzz.TTTT',
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
      { x: 4, y: 4, look: 'kannushi', role: 'shrine', lines: ['ようこそ 相馬の 神社へ。'] },
      { x: 1, y: 8, look: 'kaji', role: 'equip', goods: ['nodachi', 'oonaginata', 'jumonji', 'tetsushakujo', 'kusari', 'domaru'], items: ['tama'], lines: ['相馬の 刀屋だ。野太刀に 十文字槍、鎖帷子も あるぜ。'] },
      { x: 10, y: 11, look: 'shonin', role: 'shop', goods: ['jouyakusou', 'tokujou', 'goshinsui', 'kusuribako'], lines: ['相馬の 道具屋だ。薬箱は 皆の 傷を いっぺんに 手当て できるぜ。'] }, // 10/3 本人「道具も強く」
      { x: 11, y: 8, look: 'okami', role: 'inn', price: 18, lines: ['いらっしゃいませ。相馬の 宿で ございます。'] },
      { x: 9, y: 12, look: 'ryoshi', lines: [
        '海から 帰る 舟は、北の 鹿狼山を 目印に するんだ。',
        '鹿狼山の 手長明神さまは、白い 鹿と 白い 狼を 従えた 手の 長い 神さま。海と 人の 暮らしを 見守って くださる。',
      ] },
      { x: 3, y: 11, look: 'toshiyori', lines: [
        '新地の 貝塚はな、食べた 貝を 捨てた 跡じゃと 伝わる。海の めぐみに 感謝を 忘れては いかん。',
      ] },
      { x: 10, y: 5, look: 'yakunin', lines: [
        '西の 虎捕山には、平安の むかし、橘墨虎という 凶賊が 隠れて おったそうだ。',
        '源頼義さまが 白い 狼の 足跡を たどって、墨虎を 捕らえた。それで「虎捕山」と よぶのだ。',
      ] },
      { x: 2, y: 5, look: 'musume', lines: [
        '虎捕山の 入口の もやは、鹿狼山の 手長明神さまを 元に もどせば 晴れると 思うの。',
      ] },
    ],
  },
  // ---- 2章 県北（10/4・本人「順番に制作を」）。町の形は小高・相馬と同じ。話の手がかりは出どころで確かめた筋だけ（vault 日本昔話/2026-10-04-調査-福島昔話クエスト2章県北5話.md）----
  fukushima: {
    name: '福島',
    cardPending: true, // 町の入口の一枚絵が届くまで 名前だけ
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
      'TTTT.zzz.TTTT',
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
      { x: 4, y: 4, look: 'kannushi', role: 'shrine', lines: ['ようこそ 福島の 神社へ。'] },
      { x: 1, y: 8, look: 'okami', role: 'inn', price: 22, lines: ['いらっしゃいませ。福島の 宿で ございます。'] },
      { x: 11, y: 8, look: 'kaji', role: 'equip', goods: ['nodachi', 'oonaginata', 'jumonji', 'tetsushakujo', 'kusari', 'domaru'], items: ['tokujou', 'goshinsui', 'kusuribako', 'tama'], lines: ['福島の 刀屋だ。信夫山の 化け物に 負けない 得物を そろえて いけ。'] },
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
      { x: 2, y: 5, look: 'kodomo', lines: [
        '東の 霊山の ほうでは、夜に 飴を 買いに くる 女の 人の 話が あるんだって。',
      ] },
    ],
  },
  nihonmatsu: {
    name: '二本松',
    cardPending: true,
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
      'TTTT.zzz.TTTT',
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
      { x: 1, y: 8, look: 'kaji', role: 'equip', goods: ['nodachi', 'oonaginata', 'jumonji', 'tetsushakujo', 'kusari', 'domaru'], items: ['tokujou', 'goshinsui', 'kusuribako', 'tama'], lines: ['二本松の 刀屋だ。'] },
      { x: 11, y: 8, look: 'okami', role: 'inn', price: 24, lines: ['いらっしゃいませ。二本松の 宿で ございます。'] },
      { x: 3, y: 11, look: 'toshiyori', lines: [
        '安達ヶ原の 岩屋には、むかし 鬼婆が すんで おった。熊野の お坊さま 祐慶さまが、観音さまの 弓の 力で しずめたと 伝わる。',
      ] },
      { x: 9, y: 12, look: 'ryoshi', lines: [
        '鬼婆は おそろしく 強いと いう。観世寺へ 行く まえに、宿で しっかり 休んで いきな。',
      ] },
    ],
  },
};

// 歩く地図の字 → 町（Q＝小高・M＝相馬は 1章の地図「相馬」・U＝福島・W＝二本松は 2章の地図「県北」）
export const TOWN_OF = { H: 'taira', Y: 'yumoto', O: 'onahama', Q: 'odaka', M: 'nakamura', U: 'fukushima', W: 'nihonmatsu' };
