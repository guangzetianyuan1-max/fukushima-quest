import { gearAt } from '../data/equip.js?v=264'; // 10/5 武器と防具は職業ごと＝店は段で並べる
import { castleMaps } from './castle.js?v=264'; // 10/7 お城の 大広間と お題の 場所
// ⭐10/2 本人「湯本、平、両方神社が見えない」＝上の2段は画面の上の札（HP・文）に隠れる＝どの町も上に杉の並木を2段足して、中身を2段下げた（TOP）
// 町の中の地図と、町の人（本人 10/1「平(城下町、武器がある)、湯本(温泉回復、温泉饅頭)、小名浜(めひかり、かつお、貝焼き)」）
// 字の意味は tiles.js の TOWN_TERRAIN。x＝町の出口（踏むと歩く地図へ戻る）。大きさと入口は 町ごと（TOWN_LAYOUTS・10/5 夜〜）
// 人の role：shrine＝お参りで記録・お祓い・勝守／inn＝温泉宿／shop＝道具屋／temple＝供養・厄除け守／bansho＝番屋／equip＝刀屋・荒物屋（goods＝src/data/equip.js）
// 店の人はカウンター（c）の奥に立つ＝カウンター越しに話せる
// props＝建物の絵（look.js の OBJECTS）を x,y から w×h マスに置く（絵は幅を w マスに合わせ、下の辺をそろえる＝上にはみ出してよい）
// 2026-10-02 本人「いわきを作り直し」で Gemini の建物に。店の人は建物の戸口（下の段）に立ち、手前にカウンター
export const TOWN_ENTRY = { x: 6, y: 12 };
// 10/5 夜：屋根のマスに立っていた町の人10人（小名浜・小高・相馬・福島・須賀川）を となりの屋根のかからないマスへ移した。屋根で切れて行けなくなる角（町の人の横）は杉の木にした（本人「ふさぐことで人が通れないことが無いように」・tests/roof.test.js）

// ⭐屋根のマス（10/5 夜 本人「町や城で、屋根の上に乗るのは辞めて」）
// 建物の絵は下の辺をそろえて上へはみ出す＝はみ出した屋根が ROOF_MIN ドット以上かかる 歩けるマスは通れない（game.js の canWalk）
// 絵の大きさ（ドット）＝assets/tiles/o_<名>.png。tests/roof.test.js が 絵と合っているかを見る（絵を描き直したら ここも直す）
export const ROOF_PX = { jinja: [96, 111], mise: [128, 95], tera: [96, 77], yadoya: [128, 113], minka: [96, 73], counter: [64, 27], toro: [22, 38], fune: [64, 38], shiro: [44, 51], hei: [96, 31],
  // 10/6 町の建物（art_src/prep_buildings.py・Gemini 3枚）
  tenshu: [160, 179], mon: [96, 107], ishigaki: [96, 69], bukeyashiki: [128, 80], hinomi: [64, 117], dobei: [96, 69], kura: [96, 117], machiya: [96, 108], katanaya: [128, 129], gusokuya: [128, 129], kusuriya: [128, 130], chaya: [128, 140], hatago: [128, 114], kashiya: [128, 106], sakaya: [128, 156], ido: [64, 70], yuya: [128, 112], tojiyado: [128, 124], yugoya: [96, 108], banya: [128, 119], ichiba: [128, 110], ashiyu: [96, 93], hokora: [96, 89] };
export const ROOF_MIN = 6; // 10/5 夜 10→6：民家の屋根（9ドット はみ出す）の真上に 立つと 屋根に 乗って 見えた
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
    npcs: [
      { spot: 'attr', look: 'machibito', role: 'attr', attr: 'jangara', lines: ['じゃんがらの 世話役だ。鉦と 太鼓を 打ち鳴らし、新盆の 家を 供養して 回る 踊り念仏だ。', '世話役「いわきでは、鉦と 太鼓の 音から「じゃんがら」と 呼ばれて 親しまれて いるんだ。」'] }, // 10/7 町の催し（attractions.js）
      // 湯めぐりの 案内人（10/5 夜 本人「各城やまちで、温泉に行くように促すキャラクターも」）
      { spot: 'guide', look: 'onsen_annai', guide: true, lines: ['湯めぐりの 案内人「いわきの 湯本温泉は、古くから 知られた 湯の町よ。旅の つかれは 湯で 落としてね。」', '湯めぐりの 案内人「北の 県北や 県中には、職業の 技を 教えて くれる 温泉が あるんだって。」'] },
      { spot: 'shrine', look: 'kannushi', role: 'shrine', lines: ['ようこそ 八幡さまへ。'] },
      { spot: 'katana', look: 'kaji', role: 'equip', goods: gearAt([1, 2]), items: ['tama'], lines: ['刀屋だ。腕に 合った 得物を 選びな。'] },
      { spot: 'gusoku', look: 'shonin', role: 'equip', goods: gearAt([], [1, 2]), lines: ['荒物屋だよ。旅の 支度なら まかせて おくれ。'] },
      { spot: 'm1', look: 'machibito', lines: ['ここは 平の 城下町。お城の まわりに 町が ひらけたんだ。'] },
      { spot: 'm2', look: 'musume', lines: ['黒い もやが 出てから、昔話を 語る 人が へってしまって……'] },
      // 初めての人への助言（本人 10/2「各町の町人を増やして、初心者向けのアドバイスを。武器や防具の必要性。術の効果など」）
      // 平＝武器と防具・記録
      { spot: 'm3', look: 'yakunin', lines: [
        '昔話の ぬしは 体が 固い。木の棒の ままでは、たたいても ほとんど 効かんぞ。',
        '刀屋で 得物を 買えば「たたかう」が 強くなる。買えば すぐ 着けられて、前の 品は 半値で 引き取って くれる。',
      ] },
      { spot: 'm4', look: 'toshiyori', lines: [
        '荒物屋の 笠や 脚絆、蓑は 守りを 上げる。道中の 敵に かまれても 痛くなくなるぞい。',
        '「どうぐ」の「そうびを 見る」で、いまの 強さと 着けている 物が わかるんじゃ。',
      ] },
      { spot: 'm5', look: 'kodomo', lines: [
        '八幡さまで お参りすると、旅を 記録できるよ。',
        '負けても、記録した 所から やり直せるんだ。ただし 文は 半分に なっちゃうけどね。',
      ] },
      // ⭐10/5 夜 本人「お城、城下町は大きいので、店を増やしてほしい」＝道具屋・宿・お城の番兵
      { spot: 'dougu', look: 'musume', role: 'shop', goods: ['yakusou', 'reisui'], lines: ['平の 道具屋で ございます。薬草と 霊水は 旅の おともに。'] },
      { spot: 'yado', look: 'okami', role: 'inn', price: 10, lines: ['いらっしゃいませ。平の 宿で ございます。'] },
      { spot: 'banpei', look: 'yakunin', lines: ['番兵「この 奥は 平の お城だ。城の 中の 桜は 見て いって かまわんぞ。」'] },
      { spot: 'lord', look: 'yakunin', role: 'castle_gate', lines: [] }, // お城の 門番＝話すと 城の 大広間へ（10/7 お城クエスト・src/field/castle.js）
    ],
  },
  yumoto: {
    name: '湯本',
    npcs: [
      { spot: 'attr', look: 'toshiyori', role: 'attr', attr: 'yukagen', lines: ['湯本の 湯守じゃ。ここの 湯は「三函の御湯」と 呼ばれ、延喜式にも 名が 載る 古い 湯じゃ。', '湯守「湧く 湯の 量も 多い。湯加減を 見て いかんか。」'] }, // 10/7 町の催し（attractions.js）
      // 湯めぐりの 案内人（10/5 夜 本人「各城やまちで、温泉に行くように促すキャラクターも」）
      { spot: 'guide', look: 'onsen_annai', guide: true, lines: ['湯めぐりの 案内人「ここ 湯本の 湯宿で 休んでいってね。」', '湯めぐりの 案内人「県北には 飯坂・高湯・土湯・岳、県中には 磐梯熱海や 二岐の 温泉が あるのよ。」'] },
      { spot: 'temple', look: 'osho', role: 'temple', lines: ['湯本の 寺じゃ。迷うた 霊が 憑いたら、供養して 進ぜよう。'] },
      { spot: 'yado', look: 'okami', role: 'inn', price: 10, lines: ['いらっしゃいませ。湯本の いで湯の 宿で ございます。'] },
      { spot: 'dougu', look: 'musume', role: 'shop', goods: ['yakusou', 'reisui'], lines: ['道具屋で ございます。薬草は いかが？'] },
      { spot: 'm1', look: 'machibito', lines: ['湯に つかると、旅の 疲れが すっかり とれるよ。'] },
      { spot: 'm2', look: 'chaya', lines: ['湯けむりを 見ながら、ひと休み していって くださいな。'] },
      // 湯本＝語りと術・もや・回復・呪い
      { spot: 'm3', look: 'toshiyori', lines: [
        '昔話の ぬしと 戦うときは、まず しおりさんに「語って」もらうんじゃ。',
        '語ると ぬしの 弱点が 明かされて、弱点の 術が 何倍も 効くように なる。語らずに 術を 撃っても、ほとんど 効かんぞ。',
      ] },
      { spot: 'm4', look: 'machibito', lines: [
        'ぬしの まわりの 黒い もやに 気を つけな。もやが 残っていると、術は 半分しか 届かない。',
        '「たたかう」と もやが ひとつ 晴れる。たたかって もやを 払ってから 術、が 近道だよ。',
      ] },
      { spot: 'm5', look: 'kodomo', lines: [
        '術を 使うと「術の力」が へるんだよ。霊水を 飲むか、湯本の 宿に 泊まれば 満タンに なるよ。',
        '呪われたら 平の 八幡さまで お祓い、霊が 憑いたら この お寺で 供養だって。',
      ] },
      { spot: 'bandai', look: 'kaji', role: 'onsen', lines: ['湯本の 湯屋の 番台だ。湯に つかれば、つかれも 呪いも 落ちるぞ。'] }, // 10/6 本人「いわき湯本温泉は温泉です」＝温泉めぐりの 1か所
    ],
  },
  onahama: {
    name: '小名浜',
    npcs: [
      // 湯めぐりの 案内人（10/5 夜 本人「各城やまちで、温泉に行くように促すキャラクターも」）
      { spot: 'guide', look: 'onsen_annai', guide: true, lines: ['湯めぐりの 案内人「港の 仕事の あとは、湯本温泉で ひと風呂よ。」', '湯めぐりの 案内人「県北の 温泉地には、番頭さんや 湯治の お客さんの 師匠が いるらしいわ。」'] },
      { spot: 'shop', look: 'shonin', role: 'shop', goods: ['yakusou', 'jouyakusou', 'reisui'], lines: ['へい らっしゃい！ 小名浜の 道具屋だ。'] },
      { spot: 'bansho', look: 'yakunin', role: 'bansho', lines: ['番屋だ。盗まれた 物は ここに 届く。いまは 何も 預かって おらん。'] },
      // 釣り番（本人 10/2「小名浜のまちがあまり機能しない」→「漁港で釣り＋景品」）
      { spot: 'fishing', look: 'ryoshi', role: 'fishing', lines: ['小名浜は 港町。港では アジや カレイが 釣れるぜ。', '沖の めひかりは 釣り点の 景品で 渡して いるよ。', '竿を 貸すぜ。釣れた 魚で 釣り点が たまる。点は 景品と 換えて やろう。'] },
      { spot: 'm1', look: 'kodomo', lines: ['鮫川の 河口に、黒い もやが うずまいてたんだって！'] },
      // 閼伽井嶽の龍燈＝海から山の お堂へ 灯が のぼる言い伝え（第四話の手がかり）
      { spot: 'm2', look: 'toshiyori', lines: ['海から 山の お堂へ、灯が のぼっていく……。', 'わしが 若いころは、閼伽井嶽の 龍の 灯を 見た 者も おったもんじゃ。'] },
      // 小名浜＝自動・仲間・鉄砲
      { spot: 'm3', look: 'musume', lines: [
        '戦いに 迷ったら「自動」に 任せても いいのよ。しおりさんが 語って、みんなが 動いて くれるわ。',
        '自動を やめたいときは、下の 窓の 上の「自動中」の 札を さわってね。',
      ] },
      { spot: 'm4', look: 'machibito', lines: [
        '沼の ほうには 腕の いい 猟師が いるって 話だ。仲間に なって くれたら 心強いぜ。',
        '猟師の 鉄砲は、黒い もやが 晴れてから 撃つもんだ。玉は 平の 刀屋で 売ってるよ。',
      ] },
      { spot: 'm5', look: 'chaya', lines: [
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
    npcs: [
      // 湯めぐりの 案内人（10/5 夜 本人「各城やまちで、温泉に行くように促すキャラクターも」）
      { spot: 'guide', look: 'onsen_annai', guide: true, lines: ['湯めぐりの 案内人「相馬を 抜けて 県北へ 行ったら、温泉地を めぐってみて。」', '湯めぐりの 案内人「飯坂・高湯・土湯・岳。どこかに、あなたたちの 技を 見て くれる 師匠が いるはずよ。」'] },
      { spot: 'shrine', look: 'kannushi', role: 'shrine', lines: ['ようこそ 小高の 神社へ。'] },
      { spot: 'yado', look: 'okami', role: 'inn', price: 15, lines: ['いらっしゃいませ。小高の 宿で ございます。'] },
      { spot: 'katana', look: 'shonin', role: 'equip', goods: gearAt([3], [2, 3]), items: ['yakusou', 'jouyakusou', 'tokujou', 'reisui', 'goshinsui', 'tama'], lines: ['小高の よろず屋だ。それぞれの 腕に 合った 得物と 防具、薬も あるぜ。'] }, // 10/3 本人「よろず屋でも採用」＝道具も置く
      { spot: 'dougu', look: 'musume', role: 'shop', goods: ['yakusou', 'jouyakusou', 'tokujou', 'reisui', 'goshinsui'], lines: ['旅の 薬売りで ございます。相馬の 道は 敵が 強いので、よく 効く 薬を そろえて おります。'] }, // 10/3 本人「道具も強く」
      // 話の手がかり（出どころで確かめた筋だけ）
      { spot: 'm1', look: 'ryoshi', lines: [
        '金谷の 山には 行くなよ。鹿を 追って 山に 入った 猟師が、ざるの ような 頭の 女の 化け物に 会ったそうだ。',
        '化け物は 乱れ髪を 地面に 引きずって、にたりと 笑ったと。……それから その 猟師は、殺生を やめたんだと。',
      ] },
      { spot: 'm2', look: 'toshiyori', lines: [
        '西の 大悲山には 薬師堂が あってな、むかし 玉都という 琵琶法師が こもって 琵琶を 弾いておった。',
        '堂の 前の 池の 大蛇が、武士に 化けて 玉都の もとへ 来たという 話じゃ。',
      ] },
      { spot: 'm3', look: 'yakunin', lines: [
        '小高の お城の 殿様は、大悲山の 山や 谷に、大蛇の 苦手な 鉄の 釘を 打たせたと 伝わる。',
        '大悲山の 入口の 黒い もやは、金谷の 山の 化け物の 前で 獲りすぎないと 誓えば 晴れるはずだ。',
      ] },
      { spot: 'm4', look: 'kodomo', lines: [
        '相馬の 道は いわきより 敵が 強いよ。レベルを 上げて、よろず屋で 得物を そろえてから 行こう。',
        '小高と 相馬の 町には、職業ごとの 師匠が いるよ。試しに 受かると 技を 教えて もらえるんだ。',
      ] },
      // ⭐1章の師匠（本人 10/5「それぞれの職業は必殺技が3つあり、1章から3章までのどこかで、クエストを受けて習得する」）＝jobs.js の QUESTS[1]。歩く絵は町の人の絵を借りる
      { spot: 'sou', look: 'osho', role: 'master', job: 'sou', ch: 1, lines: ['小高の 寺の 和尚じゃ。', '真言は、この 土地の 昔を 知る 者が となえて こそ 届く。わしの 問いに 答えて みよ。'] },
      { spot: 'yamabushi', look: 'machibito', role: 'master', job: 'yamabushi', ch: 1, lines: ['羽黒の 山で 修行した 山伏だ。', '法螺貝は 腹の 底から 吹く もの。わしと 一騎打ちを して、腕を 見せよ。'] },
      { spot: 'yojutsu', look: 'chaya', role: 'master', job: 'yojutsu', ch: 1, lines: ['山に こもって 術を みがく 者です。', '幻の 術は、己の 姿を 見失わぬ 者にしか 使えません。一騎打ちで 確かめましょう。'] },
      { spot: 'ninja', look: 'kashira', role: 'master', job: 'ninja', ch: 1, lines: ['……忍びの 師匠だ。', '煙玉は 投げる 間合いが 命。一騎打ちで 間合いを 見せて みよ。'] },
      { spot: 'kusushi', look: 'shonin', role: 'master', job: 'kusushi', ch: 1, lines: ['小高の 薬屋の 主で ございます。', '丸薬は 土地の 草と 水で 作る もの。この 土地の 話を どれほど 知って おられるか、問うて みましょう。'] },
    ],
  },
  nakamura: {
    name: '相馬',
    shrineName: '相馬の 神社',
    shrineLine: '相馬の 神社で 旅の 無事を お願いしましょう。北の 鹿狼山と、西の 虎捕山へ 行けるわ。',
    npcs: [
      // 湯めぐりの 案内人（10/5 夜 本人「各城やまちで、温泉に行くように促すキャラクターも」）
      { spot: 'guide', look: 'onsen_annai', guide: true, lines: ['湯めぐりの 案内人「県北の 温泉地には、職業の 技を 教える 師匠が いるらしいわ。」', '湯めぐりの 案内人「湯に つかれば 傷も 呪いも 落ちるから、旅の 合間に 寄ってね。」'] },
      { spot: 'shrine', look: 'kannushi', role: 'shrine', lines: ['ようこそ 相馬の 神社へ。'] },
      { spot: 'katana', look: 'kaji', role: 'equip', goods: gearAt([4]), items: ['tama'], lines: ['相馬の 刀屋だ。職人ごとの 得物と 防具を そろえて あるぜ。'] },
      { spot: 'dougu', look: 'shonin', role: 'shop', goods: ['jouyakusou', 'tokujou', 'goshinsui', 'kusuribako'], lines: ['相馬の 道具屋だ。薬箱は 皆の 傷を いっぺんに 手当て できるぜ。'] }, // 10/3 本人「道具も強く」
      { spot: 'yado', look: 'okami', role: 'inn', price: 18, lines: ['いらっしゃいませ。相馬の 宿で ございます。'] },
      { spot: 'm1', look: 'ryoshi', lines: [
        '海から 帰る 舟は、北の 鹿狼山を 目印に するんだ。',
        '鹿狼山の 手長明神さまは、白い 鹿と 白い 狼を 従えた 手の 長い 神さま。海と 人の 暮らしを 見守って くださる。',
      ] },
      { spot: 'm2', look: 'toshiyori', lines: [
        '新地の 貝塚はな、食べた 貝を 捨てた 跡じゃと 伝わる。海の めぐみに 感謝を 忘れては いかん。',
      ] },
      { spot: 'm3', look: 'yakunin', lines: [
        '西の 虎捕山には、平安の むかし、橘墨虎という 凶賊が 隠れて おったそうだ。',
        '源頼義さまが 白い 狼の 足跡を たどって、墨虎を 捕らえた。それで「虎捕山」と よぶのだ。',
      ] },
      { spot: 'm4', look: 'musume', lines: [
        '虎捕山の 入口の もやは、鹿狼山の 手長明神さまを 元に もどせば 晴れると 思うの。',
      ] },
      // ⭐1章の師匠（10/5・jobs.js の QUESTS[1]）。道場の師範（10/4 武士の試し合い）は 武士の師匠へ
      { spot: 'bushi', look: 'yakunin', role: 'master', job: 'bushi', ch: 1, lines: ['相馬の 剣術道場の 師範だ。', 'わしと 木刀で 試し合いを して、2本 取れば、わが 流の 奥義を さずけよう。'] },
      { spot: 'miko', look: 'musume', role: 'master', job: 'miko', ch: 1, lines: ['相馬の 神社の 巫女頭です。', '神楽は 神さまに ささげる 舞。太鼓に 合わせて 鈴を 振れたら、舞を お伝えしましょう。'] },
      { spot: 'onmyo', look: 'toshiyori', role: 'master', job: 'onmyo', ch: 1, lines: ['星と 暦を 読む 陰陽師じゃ。', '呪符は 名と いわれを 知って こそ 効く。相馬の 昔話を 問うて みよう。'] },
      { spot: 'rikishi', look: 'ryoshi', role: 'master', job: 'rikishi', ch: 1, lines: ['相撲の 親方だ。', '四股は 大地を しずめる 足踏み。わしと 一番 取って、力を 見せて みろ。'] },
      { spot: 'yumi', look: 'kaji', role: 'master', job: 'yumi', ch: 1, lines: ['弓の 師匠だ。', '鏑矢は 鳴る 矢。動く 的を 射ぬけたら、引き方を 教えよう。'] },
      // ⭐10/5 夜 本人「店を増やしてほしい」＝刀屋と 具足屋を 分けた・お寺・お城の番兵
      { spot: 'gusoku', look: 'shonin', role: 'equip', goods: gearAt([], [3, 4]), lines: ['相馬の 具足屋だ。職ごとの 防具を そろえて あるぜ。'] },
      { spot: 'temple', look: 'osho', role: 'temple', lines: ['相馬の 寺じゃ。迷うた 霊が 憑いたら、供養して 進ぜよう。'] },
      { spot: 'banpei', look: 'yakunin', lines: ['番兵「堀に かかる 橋を わたれば 相馬の お城だ。」'] },
      { spot: 'lord', look: 'yakunin', role: 'castle_gate', lines: [] }, // お城の 門番＝話すと 城の 大広間へ（10/7 お城クエスト・src/field/castle.js）
    ],
  },
  // ---- 2章 県北（10/4・本人「順番に制作を」）。町の形は小高・相馬と同じ。話の手がかりは出どころで確かめた筋だけ（vault 日本昔話/2026-10-04-調査-福島昔話クエスト2章県北5話.md）----
  fukushima: {
    name: '福島',
    shrineName: '福島の 神社',
    shrineLine: '福島の 神社で 旅の 無事を お願いしましょう。北の 信夫山は すぐそこよ。',
    npcs: [
      { spot: 'attr', look: 'machibito', role: 'attr', attr: 'waraji', lines: ['わらじまつりの 世話役だ。長さ 十二メートルの 大わらじを、信夫山の 羽黒神社に 納めるんだ。', '世話役「足の 丈夫さと 旅の 安全を 願って、わらじを 納めたのが はじまりと 伝わる。」'] }, // 10/7 町の催し（attractions.js）
      // 湯めぐりの 案内人（10/5 夜 本人「各城やまちで、温泉に行くように促すキャラクターも」）
      { spot: 'guide', look: 'onsen_annai', guide: true, lines: ['湯めぐりの 案内人「福島の まわりには、北に 飯坂温泉、西に 高湯温泉と 土湯温泉が あるわ。」', '湯めぐりの 案内人「番頭さんや おかみさん、湯治の お客さんが、技を 教えて くれるって。」'] },
      { spot: 'shrine', look: 'kannushi', role: 'shrine', lines: ['ようこそ 福島の 神社へ。'] },
      { spot: 'yado', look: 'okami', role: 'inn', price: 22, lines: ['いらっしゃいませ。福島の 宿で ございます。'] },
      { spot: 'katana', look: 'kaji', role: 'equip', goods: gearAt([5]), items: ['tama'], lines: ['福島の 刀屋だ。信夫山の 化け物に 負けない 得物を そろえて いけ。'] },
      { spot: 'm1', look: 'shonin', lines: [
        '信夫山には むかし、ご坊狐という 狐が いてな。お山の 和尚さんに 化けて、木の葉の 小判で 魚を 買って いったそうだ。',
      ] },
      { spot: 'm2', look: 'toshiyori', lines: [
        '信夫山の 北の 坂には 大きな ムカデ、南の 黒沼には 大きな オロチが すんで、どちらも「信夫山の 主」を 名乗って おった。',
        '二匹は 山の 西の はしで 出くわして、たがいに 傷つけあって ほろんだと いう 話じゃ。',
      ] },
      { spot: 'm3', look: 'musume', lines: [
        '信夫山の 中ほどには ねこ稲荷が あるの。改心した 狐が、蚕の 守り神として まつられて いるのよ。',
      ] },
      { spot: 'm4', look: 'kodomo', lines: [
        '東の 霊山の ほうでは、夜に 飴を 買いに くる 女の 人の 話が あるんだって。',
      ] },
      // 黒脛巾組の頭（本人 10/4 夜「しおりが弱すぎる。女くノ一として、途中クエストを受け変身」→ 2章・黒脛巾組・忍びの試し）
      // 黒脛巾組＝伊達政宗の忍びの組。信夫郡 鳥谷野城の城主 安部対馬が 腕の立つ者50人を選んだと伝わる（実在には異説＝「伝わる」で語る）
      // 黒脛巾組の頭（10/5 夜：忍者の師匠は 岳温泉の 仲居＝元 黒脛巾組）
      { spot: 'm5', look: 'kashira', lines: [
        '黒い 脛巾（はばき）の 男「……わしらは 黒脛巾組と 呼ばれて おる。伊達の 殿さまの 忍びよ。」',
        '男「信夫郡の 鳥谷野の 城主さまが、腕の 立つ 者を 五十人 選んだのが 始まりと 伝わる。」',
        '男「忍びの 技を 習いたいなら、岳温泉の 仲居を たずねよ。わしらの 組に おった 者だ。」',
      ] },
      // ⭐10/5 夜 本人「店を増やしてほしい」＝刀屋・具足屋・道具屋を 分けた・お城の番兵
      { spot: 'gusoku', look: 'shonin', role: 'equip', goods: gearAt([], [4, 5]), lines: ['福島の 具足屋だ。体を 守る 物を そろえて いきな。'] },
      { spot: 'dougu', look: 'musume', role: 'shop', goods: ['jouyakusou', 'tokujou', 'goshinsui', 'kusuribako'], lines: ['福島の 道具屋で ございます。薬箱は 皆の 傷を いっぺんに 手当て できますよ。'] },
      { spot: 'banpei', look: 'yakunin', lines: ['番兵「川の 向こうが 福島の お城だ。橋を わたって 来たな。」'] },
    ],
  },
  nihonmatsu: {
    name: '二本松',
    shrineName: '二本松の 神社',
    shrineLine: '二本松の 神社で 旅の 無事を お願いしましょう。安達ヶ原の 観世寺は 町の 西よ。',
    npcs: [
      // 湯めぐりの 案内人（10/5 夜 本人「各城やまちで、温泉に行くように促すキャラクターも」）
      { spot: 'guide', look: 'onsen_annai', guide: true, lines: ['湯めぐりの 案内人「二本松の 西の 岳温泉には、湯治の 力士と、もと 忍びの 仲居さんが いるわ。」', '湯めぐりの 案内人「温泉の 湯屋で つかれば、HPも 術も 満タンよ。」'] },
      { spot: 'shrine', look: 'kannushi', role: 'shrine', lines: ['ようこそ 二本松の 神社へ。'] },
      { spot: 'katana', look: 'kaji', role: 'equip', goods: gearAt([5]), items: ['tama'], lines: ['二本松の 刀屋だ。'] },
      { spot: 'yado', look: 'okami', role: 'inn', price: 24, lines: ['いらっしゃいませ。二本松の 宿で ございます。'] },
      { spot: 'm1', look: 'toshiyori', lines: [
        '安達ヶ原の 岩屋には、むかし 鬼婆が すんで おった。熊野の お坊さま 祐慶さまが、観音さまの 弓の 力で しずめたと 伝わる。',
      ] },
      { spot: 'm2', look: 'ryoshi', lines: [
        '鬼婆は おそろしく 強いと いう。観世寺へ 行く まえに、宿で しっかり 休んで いきな。',
      ] },
      // ⭐10/5 夜 本人「店を増やしてほしい」＝具足屋・道具屋・菓子屋（二本松の 名物 玉羊羹）・お城の番兵
      { spot: 'gusoku', look: 'shonin', role: 'equip', goods: gearAt([], [4, 5]), lines: ['二本松の 具足屋だ。'] },
      { spot: 'dougu', look: 'musume', role: 'shop', goods: ['jouyakusou', 'tokujou', 'goshinsui', 'kusuribako'], lines: ['二本松の 道具屋で ございます。'] },
      { spot: 'kashi', look: 'chaya', role: 'shop', goods: ['jouyakusou', 'tokujou'], lines: ['二本松の 菓子屋です。名物の 玉羊羹は、提灯祭りの 景品に 出して いますよ。'] }, // 10/7 本人「店ではスタンプラリーの食事は出さない」
      { spot: 'banpei', look: 'yakunin', lines: ['番兵「霞ヶ城の 石垣は 見事だろう。春は 桜で いっぱいに なるぞ。」'] },
      { spot: 'lord', look: 'yakunin', role: 'castle_gate', lines: [] }, // お城の 門番＝話すと 城の 大広間へ（10/7 お城クエスト・src/field/castle.js）
    ],
  },
  // ---- 3章 県中・県南（10/4）。町の人の話＝vault 日本昔話/2026-10-04-調査-福島昔話クエスト3章県中県南.md の「町で話せる事実」（確かめた物だけ）----
  koriyama: {
    name: '郡山',
    shrineName: '郡山の 神社',
    shrineLine: '郡山の 神社で 旅の 無事を お願いしましょう。東の 三春に、木の 馬の 話が 伝わっているの。',
    npcs: [
      { spot: 'attr', look: 'musume', role: 'attr', attr: 'hanakatsumi', lines: ['うねめまつりの 世話役です。都に 仕えた 采女・春姫の 伝説を しのぶ 祭りです。', '世話役「春姫と 次郎の 泉の まわりに、薄紫の 花かつみが 咲いたと 伝わって いるんです。」'] }, // 10/7 町の催し（attractions.js）
      // 湯めぐりの 案内人（10/5 夜 本人「各城やまちで、温泉に行くように促すキャラクターも」）
      { spot: 'guide', look: 'onsen_annai', guide: true, lines: ['湯めぐりの 案内人「郡山の 西の 磐梯熱海温泉には、芸者さん・湯治の 大関・番頭さんが いるわ。」', '湯めぐりの 案内人「3章の 技は、県中と 県南の 温泉地で 習えるのよ。」'] },
      { spot: 'shrine', look: 'kannushi', role: 'shrine', lines: ['ようこそ 郡山の 神社へ。'] },
      { spot: 'yado', look: 'okami', role: 'inn', price: 26, lines: ['いらっしゃいませ。郡山の 宿で ございます。'] },
      { spot: 'katana', look: 'kaji', role: 'equip', goods: gearAt([6]), items: ['tama'], lines: ['郡山の 刀屋だ。大滝根山の 主に 負けない 得物を そろえて いけ。'] },
      { spot: 'm1', look: 'shonin', lines: [
        '郡山は 鯉の 町さ。鯉を 育てる 量は、全国の 市町村で いちばんと 言われて いる。',
        '使われなく なった ため池と、糸を とる 蚕の さなぎを 餌に して、鯉を 育てて きたんだ。',
      ] },
      { spot: 'm2', look: 'toshiyori', lines: [
        '猪苗代湖の 水を 引いた 安積疏水は、国が はじめて 手がけた 疏水じゃ。いまは 日本遺産に なって おる。',
      ] },
      { spot: 'm3', look: 'musume', lines: [
        '北の 日和田の 西方寺には、大蛇の 骨で 作った お地蔵さまが あるそうよ。蛇骨地蔵と いうの。',
      ] },
      // ⭐10/5 夜 本人「店を増やしてほしい」＝街道に 具足屋・道具屋・茶屋・お寺
      { spot: 'gusoku', look: 'shonin', role: 'equip', goods: gearAt([], [5, 6]), lines: ['郡山の 具足屋だ。'] },
      { spot: 'dougu', look: 'musume', role: 'shop', goods: ['tokujou', 'goshinsui', 'kusuribako'], lines: ['郡山の 道具屋で ございます。'] },
      { spot: 'chaya', look: 'chaya', role: 'shop', goods: ['jouyakusou', 'tokujou'], lines: ['街道の 茶屋です。ひと休み して いって くださいな。'] },
      { spot: 'temple', look: 'osho', role: 'temple', lines: ['郡山の 寺じゃ。迷うた 霊が 憑いたら、供養して 進ぜよう。'] },
    ],
  },
  sukagawa: {
    name: '須賀川',
    shrineName: '須賀川の 神社',
    shrineLine: '須賀川の 神社で 旅の 無事を お願いしましょう。町の 東の 狸森に、ふしぎな お坊さまの 話が あるの。',
    npcs: [
      // 湯めぐりの 案内人（10/5 夜 本人「各城やまちで、温泉に行くように促すキャラクターも」）
      { spot: 'guide', look: 'onsen_annai', guide: true, lines: ['湯めぐりの 案内人「石川の 母畑温泉と 猫啼温泉、天栄の 谷の 二岐温泉にも 師匠が いるって。」', '湯めぐりの 案内人「松明あかしの 御神火も、旅の 力に なるわよ。」'] },
      { spot: 'shrine', look: 'kannushi', role: 'shrine', lines: ['ようこそ 須賀川の 神社へ。'] },
      { spot: 'katana', look: 'kaji', role: 'equip', goods: gearAt([6]), items: ['tama'], lines: ['須賀川の 刀屋だ。天栄の 川へ 行くなら、具足を そろえて いけ。'] },
      { spot: 'yado', look: 'okami', role: 'inn', price: 28, lines: ['いらっしゃいませ。須賀川の 宿で ございます。'] },
      { spot: 'm1', look: 'toshiyori', lines: [
        '須賀川の 松明あかしは、四百年 あまり 続く 火祭りじゃ。',
        'むかし 須賀川城が 攻め落とされた ときに 亡くなった 人たちを、松明の 火で とむらうのじゃよ。',
      ] },
      { spot: 'm2', look: 'shonin', lines: [
        '須賀川の 牡丹園は 国の 名勝さ。二百五十年 あまり 前、薬に するため 牡丹を 植えたのが はじまりなんだ。',
      ] },
      { spot: 'm3', look: 'musume', lines: [
        '狸森の 託善和尚さまは、とても かしこい お坊さまだったそうよ。……でも、その 正体は。',
      ] },
      // ⭐10/5 夜 本人「店を増やしてほしい」＝具足屋・道具屋
      { spot: 'gusoku', look: 'shonin', role: 'equip', goods: gearAt([], [5, 6]), lines: ['須賀川の 具足屋だ。'] },
      { spot: 'dougu', look: 'musume', role: 'shop', goods: ['tokujou', 'goshinsui', 'kusuribako'], lines: ['須賀川の 道具屋で ございます。'] },
    ],
  },
  shirakawa: {
    name: '白河',
    shrineName: '白河の 神社',
    shrineLine: '白河の 神社で 旅の 無事を お願いしましょう。安珍堂は 町の 南東よ。',
    npcs: [
      { spot: 'attr', look: 'shonin', role: 'attr', attr: 'daruma', lines: ['だるま市の 世話役だ。白河だるまの 顔は、まゆが 鶴、ひげが 亀、耳ひげが 松と 梅、あごひげが 竹。', '世話役「松平定信公が 絵師の 谷文晁に 絵付けを させたのが はじまりと 伝わるぞ。」'] }, // 10/7 町の催し（attractions.js）
      // 湯めぐりの 案内人（10/5 夜 本人「各城やまちで、温泉に行くように促すキャラクターも」）
      { spot: 'guide', look: 'onsen_annai', guide: true, lines: ['湯めぐりの 案内人「白河の 西の 甲子温泉には、若旦那と 仲居さんが いるわ。」', '湯めぐりの 案内人「安珍堂へ 行く 前に、湯で 体を 整えてね。」'] },
      { spot: 'shrine', look: 'kannushi', role: 'shrine', lines: ['ようこそ 白河の 神社へ。'] },
      { spot: 'yado', look: 'okami', role: 'inn', price: 30, lines: ['いらっしゃいませ。白河の 宿で ございます。'] },
      { spot: 'katana', look: 'kaji', role: 'equip', goods: gearAt([6]), items: ['tama'], lines: ['白河の 刀屋だ。安珍堂の 炎に 負けるなよ。'] },
      { spot: 'm1', look: 'toshiyori', lines: [
        '小峰城は、南北朝の ころに 結城親朝が 築き、江戸の はじめに 白河藩の 城として 仕上がった 城じゃ。',
        '南の 南湖は、白河藩主 松平定信が 造った 公園。日本で いちばん 古い 公園とも 言われて おる。',
      ] },
      { spot: 'm2', look: 'shonin', lines: [
        '白河の 関は、むかしの 奥州の 三つの 関の ひとつ。芭蕉ほか、たくさんの 旅人が 訪れた 所さ。',
      ] },
      { spot: 'm3', look: 'musume', lines: [
        '安珍さまは この 白河の 生まれと 言われて いるの。命日には、安珍堂の 前で 念仏踊りを 奉納して とむらうのよ。',
      ] },
      // ⭐10/5 夜 本人「店を増やしてほしい」＝具足屋・道具屋・お城の番兵
      { spot: 'gusoku', look: 'shonin', role: 'equip', goods: gearAt([], [5, 6]), lines: ['白河の 具足屋だ。'] },
      { spot: 'dougu', look: 'musume', role: 'shop', goods: ['tokujou', 'goshinsui', 'kusuribako'], lines: ['白河の 道具屋で ございます。'] },
      { spot: 'banpei', look: 'yakunin', lines: ['番兵「小峰城の 三重櫓だ。白河藩の お城よ。」'] },
      { spot: 'lord', look: 'yakunin', role: 'castle_gate', lines: [] }, // お城の 門番＝話すと 城の 大広間へ（10/7 お城クエスト・src/field/castle.js）
    ],
  },
  iizaka: {
    name: '飯坂温泉', onsen: true, // 10/5 夜 温泉地（本人「番頭・おかみ・客など様々なキャラクターが師範」「温泉では回復もできるように」）
    npcs: [
      { spot: 'yado', look: 'okami', role: 'inn', price: 10, lines: ['いらっしゃいませ。飯坂の 湯宿で ございます。'] },
      { spot: 'bandai', look: 'kaji', role: 'onsen', lines: ['飯坂の 湯屋の 番台だ。湯に つかれば、つかれも 呪いも 落ちるぞ。'] },
      { spot: 'm1', look: 'onsen_kenkaku', role: 'master', job: 'bushi', ch: 2, lines: ['湯治に 来ておる 浪人よ。', '兜をも 割る 一太刀、湯上がりの 腕ならしに 受けて みるか。'] },
      { spot: 'm2', look: 'onsen_banto', role: 'master', job: 'onmyo', ch: 2, lines: ['飯坂の 湯宿の 番頭で ございます。', '結界の 符の 書き方、県北の 昔話の 問いに 答えられたら お教えしましょう。'] },
      { spot: 'm3', look: 'onsen_okami', role: 'master', job: 'miko', ch: 2, lines: ['飯坂の 湯宿の おかみで ございます。', '太鼓に 合わせて 舞えたら、御神酒の 舞を 教えましょう。'] },
      { spot: 'chaya', look: 'chaya', lines: ['湯けむりを 見ながら、ひと休み していって くださいな。'] },
    ],
  },
  takayu: {
    name: '高湯温泉', onsen: true, // 10/5 夜 温泉地（本人「番頭・おかみ・客など様々なキャラクターが師範」「温泉では回復もできるように」）
    npcs: [
      { spot: 'yado', look: 'okami', role: 'inn', price: 10, lines: ['いらっしゃいませ。高湯の 湯宿で ございます。'] },
      { spot: 'bandai', look: 'kaji', role: 'onsen', lines: ['高湯の 湯屋の 番台だ。湯に つかれば、つかれも 呪いも 落ちるぞ。'] },
      { spot: 'm1', look: 'onsen_yamabushi', role: 'master', job: 'yamabushi', ch: 2, lines: ['吾妻山で 修行を 終えて、湯治に 来た 山伏じゃ。', '九字の 印は、山で 鍛えた 心から 生まれる。'] },
      { spot: 'm2', look: 'onsen_rousou', role: 'master', job: 'sou', ch: 2, lines: ['高湯の 湯で 体を 休めておる 老いた 僧です。', '鬼婆の 話を 知る 者に、不動の 結界を 授けましょう。'] },
      { spot: 'chaya', look: 'chaya', lines: ['湯けむりを 見ながら、ひと休み していって くださいな。'] },
    ],
  },
  tsuchiyu: {
    name: '土湯温泉', onsen: true, // 10/5 夜 温泉地（本人「番頭・おかみ・客など様々なキャラクターが師範」「温泉では回復もできるように」）
    npcs: [
      { spot: 'yado', look: 'okami', role: 'inn', price: 10, lines: ['いらっしゃいませ。土湯の 湯宿で ございます。'] },
      { spot: 'bandai', look: 'kaji', role: 'onsen', lines: ['土湯の 湯屋の 番台だ。湯に つかれば、つかれも 呪いも 落ちるぞ。'] },
      { spot: 'm1', look: 'onsen_kijutsu', role: 'master', job: 'yojutsu', ch: 2, lines: ['旅の 奇術師さ。こけしの 里で ひと休み。', '雷を 呼ぶ 術、腕で 示して ごらん。'] },
      { spot: 'm2', look: 'onsen_yumori', role: 'master', job: 'kusushi', ch: 2, lines: ['土湯の 湯守じゃ。湯の 効き目は 薬にも 通じる。', '毒の 吹き矢の 作り方、昔話の 問いに 答えられたら 教えよう。'] },
      { spot: 'm3', look: 'onsen_itamae', role: 'master', job: 'yumi', ch: 2, lines: ['湯宿の 板前だ。もとは 安達太良の 猟師でな。', '火矢は、狙いが 定まらねば 使えぬぞ。'] },
      { spot: 'chaya', look: 'chaya', lines: ['湯けむりを 見ながら、ひと休み していって くださいな。'] },
    ],
  },
  dake: {
    name: '岳温泉', onsen: true, // 10/5 夜 温泉地（本人「番頭・おかみ・客など様々なキャラクターが師範」「温泉では回復もできるように」）
    npcs: [
      { spot: 'yado', look: 'okami', role: 'inn', price: 10, lines: ['いらっしゃいませ。岳の 湯宿で ございます。'] },
      { spot: 'bandai', look: 'kaji', role: 'onsen', lines: ['岳の 湯屋の 番台だ。湯に つかれば、つかれも 呪いも 落ちるぞ。'] },
      { spot: 'm1', look: 'onsen_rikishi', role: 'master', job: 'rikishi', ch: 2, lines: ['湯治に 来ておる 力士だ。', '仲間を かばう 体は、四股で つくる。わしと 一番 取れ。'] },
      { spot: 'm2', look: 'onsen_nakai', role: 'master', job: 'ninja', ch: 2, lines: ['岳の 湯宿の 仲居です。……昔は 黒脛巾組に おりました。', '影縫いの 技、影渡りの 試しに 受かったら お教えします。'] },
      { spot: 'chaya', look: 'chaya', lines: ['湯けむりを 見ながら、ひと休み していって くださいな。'] },
    ],
  },
  bandaiatami: {
    name: '磐梯熱海温泉', onsen: true, // 10/5 夜 温泉地（本人「番頭・おかみ・客など様々なキャラクターが師範」「温泉では回復もできるように」）
    npcs: [
      { spot: 'yado', look: 'okami', role: 'inn', price: 10, lines: ['いらっしゃいませ。磐梯熱海の 湯宿で ございます。'] },
      { spot: 'bandai', look: 'kaji', role: 'onsen', lines: ['磐梯熱海の 湯屋の 番台だ。湯に つかれば、つかれも 呪いも 落ちるぞ。'] },
      { spot: 'm1', look: 'onsen_geisha', role: 'master', job: 'yojutsu', ch: 3, lines: ['磐梯熱海の 芸者で ございます。', '大蝦蟇を 呼ぶ 術、お座敷の 余興で なく 腕で 見せて くださいな。'] },
      { spot: 'm2', look: 'onsen_rikishi', role: 'master', job: 'rikishi', ch: 3, lines: ['湯治に 来ておる 大関だ。', '上手投げは 腰で 投げる。わしと 一番 取れ。'] },
      { spot: 'm3', look: 'onsen_banto', role: 'master', job: 'onmyo', ch: 3, lines: ['磐梯熱海の 湯宿の 番頭で ございます。', '泰山府君の 祭、県中の 昔話を 知る 方に お教えしましょう。'] },
      { spot: 'chaya', look: 'chaya', lines: ['湯けむりを 見ながら、ひと休み していって くださいな。'] },
    ],
  },
  bohata: {
    name: '母畑温泉', onsen: true, // 10/5 夜 温泉地（本人「番頭・おかみ・客など様々なキャラクターが師範」「温泉では回復もできるように」）
    npcs: [
      { spot: 'yado', look: 'okami', role: 'inn', price: 10, lines: ['いらっしゃいませ。母畑の 湯宿で ございます。'] },
      { spot: 'bandai', look: 'kaji', role: 'onsen', lines: ['母畑の 湯屋の 番台だ。湯に つかれば、つかれも 呪いも 落ちるぞ。'] },
      { spot: 'm1', look: 'onsen_isha', role: 'master', job: 'kusushi', ch: 3, lines: ['湯治に 来ておる 町医者じゃ。', '秘薬の 調合、昔話の 問いに 答えられたら 教えよう。'] },
      { spot: 'm2', look: 'onsen_inkyo', role: 'master', job: 'sou', ch: 3, lines: ['母畑の 湯宿の 隠居じゃ。若いころは 寺に おった。', '託善の 話を 知る 者に、蘇生の 経を 授けよう。'] },
      { spot: 'chaya', look: 'chaya', lines: ['湯けむりを 見ながら、ひと休み していって くださいな。'] },
    ],
  },
  nekonakiyu: {
    name: '猫啼温泉', onsen: true, // 10/5 夜 温泉地（本人「番頭・おかみ・客など様々なキャラクターが師範」「温泉では回復もできるように」）
    npcs: [
      { spot: 'yado', look: 'okami', role: 'inn', price: 10, lines: ['いらっしゃいませ。猫啼の 湯宿で ございます。'] },
      { spot: 'bandai', look: 'kaji', role: 'onsen', lines: ['猫啼の 湯屋の 番台だ。湯に つかれば、つかれも 呪いも 落ちるぞ。'] },
      { spot: 'm1', look: 'onsen_okami', role: 'master', job: 'miko', ch: 3, lines: ['猫啼の 湯宿の おかみで ございます。', '太鼓に 合わせて 舞えたら、天岩戸の 舞を 教えましょう。'] },
      { spot: 'chaya', look: 'chaya', lines: ['湯けむりを 見ながら、ひと休み していって くださいな。'] },
    ],
  },
  futamata: {
    name: '二岐温泉', onsen: true, // 10/5 夜 温泉地（本人「番頭・おかみ・客など様々なキャラクターが師範」「温泉では回復もできるように」）
    npcs: [
      { spot: 'yado', look: 'okami', role: 'inn', price: 10, lines: ['いらっしゃいませ。二岐の 湯宿で ございます。'] },
      { spot: 'bandai', look: 'kaji', role: 'onsen', lines: ['二岐の 湯屋の 番台だ。湯に つかれば、つかれも 呪いも 落ちるぞ。'] },
      { spot: 'm1', look: 'onsen_yamabushi', role: 'master', job: 'yamabushi', ch: 3, lines: ['二岐山で 修行を する 山伏じゃ。', '火渡りの 行、受けて みるか。'] },
      { spot: 'm2', look: 'onsen_yumori', role: 'master', job: 'yumi', ch: 3, lines: ['二岐の 湯守じゃ。山で 鍛えた 弓の 腕は 落ちておらん。', '満月の 一矢は、ためが いのちだ。'] },
      { spot: 'chaya', look: 'chaya', lines: ['湯けむりを 見ながら、ひと休み していって くださいな。'] },
    ],
  },
  kashi: {
    name: '甲子温泉', onsen: true, // 10/5 夜 温泉地（本人「番頭・おかみ・客など様々なキャラクターが師範」「温泉では回復もできるように」）
    npcs: [
      { spot: 'yado', look: 'okami', role: 'inn', price: 10, lines: ['いらっしゃいませ。甲子の 湯宿で ございます。'] },
      { spot: 'bandai', look: 'kaji', role: 'onsen', lines: ['甲子の 湯屋の 番台だ。湯に つかれば、つかれも 呪いも 落ちるぞ。'] },
      { spot: 'm1', look: 'onsen_wakadanna', role: 'master', job: 'bushi', ch: 3, lines: ['甲子の 湯宿の 若旦那です。剣術は 白河で 習いました。', '燕返しの 太刀筋、見切って ごらんなさい。'] },
      { spot: 'm2', look: 'onsen_nakai', role: 'master', job: 'ninja', ch: 3, lines: ['甲子の 湯宿の 仲居です。', '分身の 術は 速さで 見せる もの。一騎打ちで 確かめます。'] },
      { spot: 'chaya', look: 'chaya', lines: ['湯けむりを 見ながら、ひと休み していって くださいな。'] },
    ],
  },
  // ---- 4章 会津（10/6）。台詞は 確かめた 事だけ（vault 日本昔話/2026-10-06-調査-福島昔話クエスト4章会津.md の「町で話せる事実」）
  inawashiro: {
    name: '猪苗代',
    shrineName: '猪苗代の 社',
    shrineLine: '猪苗代の 社で 旅の 無事を お願いしましょう。亀ヶ城跡は 町の 北東よ。',
    npcs: [
      { spot: 'attr', look: 'toshiyori', role: 'attr', attr: 'hakucho', lines: ['湖の 番人じゃ。冬の 猪苗代湖には、三千羽ほどの 白鳥が 飛んで 来る。', '番人「湖に 降りた 白鳥の 数を、数えて みんか。」'] }, // 10/7 町の催し（attractions.js）
      { spot: 'guide', look: 'kannushi', role: 'shrine', lines: ['ようこそ 猪苗代の 社へ。'] },
      { spot: 'yado', look: 'okami', role: 'inn', price: 30, lines: ['いらっしゃいませ。湖の ほとりの 宿で ございます。'] },
      { spot: 'katana', look: 'kaji', role: 'equip', goods: gearAt([7]), items: ['tama'], lines: ['猪苗代の 刀屋だ。会津の 化け物に 負けない 得物を そろえて いけ。'] },
      { spot: 'gusoku', look: 'shonin', role: 'equip', goods: gearAt([], [6, 7]), lines: ['猪苗代の 具足屋だ。会津は 敵が 強い。体を 守る 物を そろえな。'] },
      { spot: 'dougu', look: 'musume', role: 'shop', goods: ['tokujou', 'goshinsui', 'kusuribako'], lines: ['猪苗代の 道具屋で ございます。'] },
      { spot: 'm1', look: 'ryoshi', lines: ['猪苗代湖は 日本で 4番目に 広い 湖。水が 澄んでいて「天鏡湖」とも よばれるんだ。'] },
      { spot: 'm2', look: 'toshiyori', lines: ['亀ヶ城の あとは、桜と 紅葉の 名所じゃ。戦国の ころ、鶴ヶ城の 支城として 築かれたと いう。'] },
      { spot: 'm3', look: 'kodomo', lines: ['冬でも 湖は 凍りきらないから、白鳥や 鴨が 来るんだよ。'] },
      { spot: 'm4', look: 'machibito', lines: ['北の 猫魔ヶ岳には、むかし 猫又が すんでいたと いう 話が あるぞ。'] },
    ],
  },
  aizuwakamatsu: {
    name: '会津若松',
    shrineName: '若松の 神社',
    shrineLine: '若松の 神社で 旅の 無事を お願いしましょう。柳津へは 町の 南の 道からよ。',
    npcs: [
      { spot: 'attr', look: 'musume', role: 'attr', attr: 'kobosi', lines: ['十日市の 世話役です。起き上がり小法師は、家族の 人数より 一つ 多く 買って 神棚に 飾るのが 習わしです。', '世話役「子孫繁栄と 無病息災を 願うんです。台の 上で 起き上がるように 投げて みてください。」'] }, // 10/7 町の催し（attractions.js）
      { spot: 'shrine', look: 'kannushi', role: 'shrine', lines: ['ようこそ 若松の 神社へ。'] },
      { spot: 'banpei', look: 'yakunin', lines: ['番兵「鶴ヶ城だ。蒲生氏郷さまが、黒川を 若松と あらため、城を 鶴ヶ城と 名づけたと 伝わる。」'] },
      { spot: 'katana', look: 'kaji', role: 'equip', goods: gearAt([7]), items: ['tama'], lines: ['会津の 刀屋だ。'] },
      { spot: 'gusoku', look: 'shonin', role: 'equip', goods: gearAt([], [6, 7]), lines: ['会津の 具足屋だ。'] },
      { spot: 'dougu', look: 'musume', role: 'shop', goods: ['tokujou', 'goshinsui', 'kusuribako'], lines: ['若松の 道具屋で ございます。'] },
      { spot: 'yado', look: 'okami', role: 'inn', price: 32, lines: ['いらっしゃいませ。若松の 旅籠で ございます。'] },
      { spot: 'kashi', look: 'chaya', role: 'shop', goods: ['jouyakusou', 'tokujou'], lines: ['城下の 茶屋です。ひと休み して いって くださいな。'] },
      { spot: 'ezuke', look: 'okami', lines: ['張り子の 工房「赤べこは、木の 型に 和紙を 何枚も 張って 作るのよ。」', '工房「赤は 魔除け。黒い 斑点は 疱瘡を 表すと いわれるの。病が 軽く 済むようにって。」'] },
      { spot: 'm1', look: 'toshiyori', lines: ['鶴ヶ城は、葦名の ころに 築かれた 館が はじまりと 伝わるんじゃ。'] },
      { spot: 'm2', look: 'musume', lines: ['張り子の 赤べこは、400年 以上も 作られてきた 会津の おもちゃなの。'] },
      { spot: 'm3', look: 'machibito', lines: ['町はずれの 夜道には、朱の盤と いう 化け物が 出ると いう うわさだ。気を つけな。'] },
      { spot: 'm4', look: 'kodomo', lines: ['猪苗代湖の 水は、むかし 郡山の ほうへ 引かれたんだって。'] },
      { spot: 'lord', look: 'yakunin', role: 'castle_gate', lines: [] }, // お城の 門番＝話すと 城の 大広間へ（10/7 お城クエスト・src/field/castle.js）
    ],
  },
  yanaizu: {
    name: '柳津',
    shrineName: '柳津の 祠',
    shrineLine: '柳津の 祠で 旅の 無事を お願いしましょう。只見川の 向こうは 西会津よ。',
    npcs: [
      { spot: 'guide', look: 'kannushi', role: 'shrine', lines: ['ようこそ 柳津の 祠へ。'] },
      { spot: 'temple', look: 'osho', role: 'temple', lines: ['柳津の 寺じゃ。迷うた 霊が 憑いたら、供養して 進ぜよう。'] },
      { spot: 'chaya', look: 'chaya', role: 'shop', goods: ['jouyakusou', 'tokujou'], lines: ['只見川を 見ながら、ひと休み して いって くださいな。'] },
      { spot: 'yado', look: 'okami', role: 'inn', price: 32, lines: ['いらっしゃいませ。門前の 旅籠で ございます。'] },
      { spot: 'dougu', look: 'musume', role: 'shop', goods: ['tokujou', 'goshinsui', 'kusuribako'], lines: ['柳津の 道具屋で ございます。'] },
      { spot: 'akabeko', look: 'machibito', lines: ['柳津は「赤べこ 発祥の 地」と いわれるんだ。'] },
      { spot: 'm1', look: 'toshiyori', lines: ['圓藏寺は、むかし 徳一と いう お坊さんが ひらいたと 伝わる 寺じゃ。'] },
      { spot: 'hadaka', look: 'yakunin', role: 'hadaka', lines: ['七日堂の 世話役だ。毎年 一月七日の 夜、合図の 鐘で 男衆が 百十三段の 石段を 駆け上がる。', '世話役「本堂の 鰐口から 下がる 麻縄を よじ登って、一年の 無病息災を 願うんだ。」'] }, // 10/7 七日堂裸まいり（縄のぼり）
      { spot: 'm2', look: 'musume', lines: ['境内の 撫牛を なでると、福が くると いわれているの。'] },
      { spot: 'm3', look: 'kodomo', lines: ['大きな 地震の あと、赤い 毛の 牛の 群れが 材木を 運んだんだって。'] },
    ],
  },
  nakanosawa: {
    name: '中ノ沢温泉', onsen: true, // 10/6 4章 会津の温泉地（本人「会津にも温泉クエスト」）＝4つ目の技
    npcs: [
      { spot: 'yado', look: 'okami', role: 'inn', price: 10, lines: ['いらっしゃいませ。中ノ沢の 湯宿で ございます。'] },
      { spot: 'bandai', look: 'kaji', role: 'onsen', lines: ['中ノ沢の 湯屋の 番台だ。湯に つかれば、つかれも 呪いも 落ちるぞ。'] },
      { spot: 'm1', look: 'onsen_rikishi', role: 'master', job: 'rikishi', ch: 4, lines: ['湯治に 来ておる 横綱だ。', '土俵入りは 綱の 重みを 背負う 技。わしと 一番 取れ。'] },
      { spot: 'm2', look: 'onsen_nakai', role: 'master', job: 'ninja', ch: 4, lines: ['中ノ沢の 湯宿の 仲居です。', '隠れ蓑の 術、一騎打ちで 見せて いただきます。'] },
      { spot: 'chaya', look: 'chaya', lines: ['湯けむりの 向こうに、安達太良の 山が 見えますよ。'] },
    ],
  },
  higashiyama: {
    name: '東山温泉', onsen: true, // 10/6 4章 会津の温泉地（本人「会津にも温泉クエスト」）＝4つ目の技
    npcs: [
      { spot: 'yado', look: 'okami', role: 'inn', price: 10, lines: ['いらっしゃいませ。東山の 湯宿で ございます。'] },
      { spot: 'bandai', look: 'kaji', role: 'onsen', lines: ['東山の 湯屋の 番台だ。湯に つかれば、つかれも 呪いも 落ちるぞ。'] },
      { spot: 'm1', look: 'onsen_kenkaku', role: 'master', job: 'bushi', ch: 4, lines: ['湯治に 来ておる 剣客よ。', '一刀両断、二の太刀まで 受けきれるか。'] },
      { spot: 'm2', look: 'onsen_geisha', role: 'master', job: 'miko', ch: 4, lines: ['東山の 芸妓で ございます。', '彼岸獅子の 舞、太鼓に 合わせて 舞えたら お教えしましょう。'] },
      { spot: 'chaya', look: 'chaya', lines: ['若松の 城下から、ひと山 こえた 湯の町ですよ。'] },
    ],
  },
  ashinomaki: {
    name: '芦ノ牧温泉', onsen: true, // 10/6 4章 会津の温泉地（本人「会津にも温泉クエスト」）＝4つ目の技
    npcs: [
      { spot: 'yado', look: 'okami', role: 'inn', price: 10, lines: ['いらっしゃいませ。芦ノ牧の 湯宿で ございます。'] },
      { spot: 'bandai', look: 'kaji', role: 'onsen', lines: ['芦ノ牧の 湯屋の 番台だ。湯に つかれば、つかれも 呪いも 落ちるぞ。'] },
      { spot: 'm1', look: 'onsen_banto', role: 'master', job: 'onmyo', ch: 4, lines: ['芦ノ牧の 湯宿の 番頭で ございます。', '反閇の 歩み、会津の 昔話を 知る 方に お教えしましょう。'] },
      { spot: 'm2', look: 'onsen_yumori', role: 'master', job: 'kusushi', ch: 4, lines: ['芦ノ牧の 湯守じゃ。', '会津の 薬用人参の 煎じ方、昔話の 問いに 答えられたら 教えよう。'] },
      { spot: 'chaya', look: 'chaya', lines: ['大川の 渓谷を ながめて、ひと休み していって くださいな。'] },
    ],
  },
  nishiyama: {
    name: '西山温泉', onsen: true, // 10/6 4章 会津の温泉地（本人「会津にも温泉クエスト」）＝4つ目の技
    npcs: [
      { spot: 'yado', look: 'okami', role: 'inn', price: 10, lines: ['いらっしゃいませ。西山の 湯宿で ございます。'] },
      { spot: 'bandai', look: 'kaji', role: 'onsen', lines: ['西山の 湯屋の 番台だ。湯に つかれば、つかれも 呪いも 落ちるぞ。'] },
      { spot: 'm1', look: 'onsen_rousou', role: 'master', job: 'sou', ch: 4, lines: ['西山の 湯で 体を 休めておる 老いた 僧です。', '会津の 昔話を 知る 者に、大般若の 転読を 授けましょう。'] },
      { spot: 'm2', look: 'onsen_kijutsu', role: 'master', job: 'yojutsu', ch: 4, lines: ['旅の 奇術師さ。山奥の 湯で ひと休み。', '狐の 嫁入りを 呼ぶ 術、腕で 示して ごらん。'] },
      { spot: 'chaya', look: 'chaya', lines: ['ここの 湯は「たん切りの湯」とも いうそうですよ。'] },
    ],
  },
  hayato: {
    name: '早戸温泉', onsen: true, // 10/6 4章 会津の温泉地（本人「会津にも温泉クエスト」）＝4つ目の技
    npcs: [
      { spot: 'yado', look: 'okami', role: 'inn', price: 10, lines: ['いらっしゃいませ。早戸の 湯宿で ございます。'] },
      { spot: 'bandai', look: 'kaji', role: 'onsen', lines: ['早戸の 湯屋の 番台だ。湯に つかれば、つかれも 呪いも 落ちるぞ。'] },
      { spot: 'm1', look: 'ryoshi', role: 'master', job: 'yumi', ch: 4, lines: ['只見川の 渡し守だ。もとは 流鏑馬の 射手でな。', '的を 三つ 続けて 射ぬけるか、見せて みろ。'] },
      { spot: 'm2', look: 'onsen_yamabushi', role: 'master', job: 'yamabushi', ch: 4, lines: ['只見川の 谷で 修行を する 山伏じゃ。', '湯殿の 行、受けて みるか。'] },
      { spot: 'chaya', look: 'chaya', lines: ['けがを した 鶴が つかって 治ったと 伝わる 湯ですよ。'] },
    ],
  },

};

// 歩く地図の字 → 町（Q＝小高・M＝相馬は 1章の地図「相馬」・U＝福島・W＝二本松は 2章の地図「県北」）
// ⭐町の形（10/5 夜 本人「お城や町、温泉の街並みがパターン化してつまらない。もっといろいろな街並みに」「お城、城下町は大きいので、店を増やしてほしい」）
// 建物・道・川・堀・木・入口は 下の TOWN_LAYOUTS（art_src/make_towns.py が書く）。町の人は spot の名前で 置き場を引く
// <<町の形 ここから（art_src/make_towns.py が書く・手で直さない）>>
export const TOWN_LAYOUTS = {
  taira: {
    entry: {"x": 10, "y": 22},
    rows: [
      'TTTTTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTTTTT',
      'TzzzzzzzzzzzzzzzzzzzT',
      'TzzkzzzzzzzzzzzzzkzzT',
      'TzzzzzkzzzzzzzkzzzzzT',
      'TzkzzzzzzzzzzzzzzzkzT',
      'TTT###############TTT',
      'T.........=.........T',
      'T.........=.........T',
      'T.####....=....####.T',
      'T.####....=....####.T',
      'T.#_##.l..=..l.#_##.T',
      'T.........=.........T',
      'T===================T',
      'T.........=.........T',
      'T.....zzz.=zzz......T',
      'T.####zzz.=zzz.####.T',
      'T.####zzz.=zzz.####.T',
      'T.#_##....=....#_##.T',
      'T.........=.........T',
      'T.....zzz.=...ppppk.T',
      'T.....zzz.=..kpppp..T',
      'T......t..=.........T',
      'TTTTTTTTTTxTTTTTTTTTT',
    ],
    props: [
      {"img": "tenshu", "x": 8, "y": 2, "w": 5, "h": 4},
      {"img": "hei", "x": 3, "y": 6, "w": 3, "h": 1},
      {"img": "hei", "x": 6, "y": 6, "w": 3, "h": 1},
      {"img": "hei", "x": 12, "y": 6, "w": 3, "h": 1},
      {"img": "hei", "x": 15, "y": 6, "w": 3, "h": 1},
      {"img": "mon", "x": 9, "y": 6, "w": 3, "h": 1},
      {"img": "katanaya", "x": 2, "y": 9, "w": 4, "h": 3},
      {"img": "gusokuya", "x": 15, "y": 9, "w": 4, "h": 3},
      {"img": "kusuriya", "x": 2, "y": 16, "w": 4, "h": 3},
      {"img": "hatago", "x": 15, "y": 16, "w": 4, "h": 3},
      {"img": "kura", "x": 6, "y": 15, "w": 3, "h": 3},
      {"img": "machiya", "x": 11, "y": 15, "w": 3, "h": 3},
      {"img": "jinja", "x": 6, "y": 20, "w": 3, "h": 2},
    ],
    spots: {"attr": {"x": 10, "y": 12}, "katana": {"x": 3, "y": 11}, "gusoku": {"x": 16, "y": 11}, "dougu": {"x": 3, "y": 18}, "yado": {"x": 16, "y": 18}, "banpei": {"x": 9, "y": 7}, "guide": {"x": 11, "y": 21}, "shrine": {"x": 5, "y": 21}, "m1": {"x": 7, "y": 12}, "m2": {"x": 12, "y": 19}, "m3": {"x": 13, "y": 8}, "m4": {"x": 6, "y": 9}, "m5": {"x": 17, "y": 13}, "lord": {"x": 11, "y": 7}},
  },
  nakamura: {
    entry: {"x": 10, "y": 22},
    rows: [
      'TTTTTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTTTTT',
      'T.ppppppp...........T',
      'T.pzzzzzp...k.zzz.k.T',
      'T.pzzzzzp.=...zzz...T',
      'T.pzzzzzp.=....t....T',
      'T.pzzzzzp.=.k.....k.T',
      'T.p.....p.=.........T',
      'T.pppbppp.=.........T',
      'T....=....=.........T',
      'T....======.........T',
      'T.........=.........T',
      'T########.=...####..T',
      'T########.=...####..T',
      'T#_###_##.=...#_##..T',
      'T.........=zzz......T',
      'T.........=zzz......T',
      'T.........=zzz####..T',
      'T.zzz.....=...####..T',
      'T.zzz.....=...#_##..T',
      'T.........=.........T',
      'T.........=.....zzz.T',
      'T.........=.....zzz.T',
      'TTTTTTTTTTxTTTTTTTTTT',
    ],
    props: [
      {"img": "tenshu", "x": 3, "y": 3, "w": 5, "h": 4},
      {"img": "jinja", "x": 14, "y": 3, "w": 3, "h": 2},
      {"img": "katanaya", "x": 1, "y": 12, "w": 4, "h": 3},
      {"img": "gusokuya", "x": 5, "y": 12, "w": 4, "h": 3},
      {"img": "hatago", "x": 14, "y": 12, "w": 4, "h": 3},
      {"img": "kusuriya", "x": 14, "y": 17, "w": 4, "h": 3},
      {"img": "tera", "x": 2, "y": 18, "w": 3, "h": 2},
      {"img": "minka", "x": 16, "y": 21, "w": 3, "h": 2},
      {"img": "machiya", "x": 11, "y": 15, "w": 3, "h": 3},
    ],
    spots: {"katana": {"x": 2, "y": 14}, "gusoku": {"x": 6, "y": 14}, "yado": {"x": 15, "y": 14}, "dougu": {"x": 15, "y": 19}, "shrine": {"x": 13, "y": 4}, "banpei": {"x": 4, "y": 9}, "temple": {"x": 5, "y": 19}, "guide": {"x": 11, "y": 22}, "m1": {"x": 7, "y": 16}, "m2": {"x": 3, "y": 16}, "m3": {"x": 12, "y": 8}, "m4": {"x": 8, "y": 20}, "bushi": {"x": 13, "y": 22}, "miko": {"x": 17, "y": 5}, "onmyo": {"x": 7, "y": 9}, "rikishi": {"x": 19, "y": 22}, "yumi": {"x": 2, "y": 10}, "lord": {"x": 6, "y": 9}},
  },
  fukushima: {
    entry: {"x": 8, "y": 22},
    rows: [
      'TTTTTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTTTTT',
      'T.R...R..R..Rrr.....T',
      'T..........R.rrzzzzzT',
      'T..zzz..=....rrzzzzzT',
      'T..zzz..=....rrzzzzzT',
      'T...t...=....rrzzzzzT',
      'T.......=....rr.....T',
      'T####zzz=####rr..###T',
      'T####zzz=####rr..###T',
      'T#_##zzz=#_##rr.....T',
      'T.......=....rr.....T',
      'T============bb=====T',
      'T.......=....rr.....T',
      'T.......=....rr.....T',
      'T####zzz=####rr.k...T',
      'T####zzz=####rr.....T',
      'T#_##zzz=#_##rr.....T',
      'T.......=....rr....kT',
      'T.......=....rr.....T',
      'T.m.K...=...Krr.....T',
      'T....m..=..m.rr.....T',
      'T.......=....rr.....T',
      'TTTTTTTTxTTTTTTTTTTTT',
    ],
    props: [
      {"img": "tenshu", "x": 15, "y": 3, "w": 5, "h": 4},
      {"img": "ishigaki", "x": 17, "y": 8, "w": 3, "h": 2},
      {"img": "jinja", "x": 3, "y": 4, "w": 3, "h": 2},
      {"img": "katanaya", "x": 1, "y": 8, "w": 4, "h": 3},
      {"img": "gusokuya", "x": 9, "y": 8, "w": 4, "h": 3},
      {"img": "kusuriya", "x": 1, "y": 15, "w": 4, "h": 3},
      {"img": "hatago", "x": 9, "y": 15, "w": 4, "h": 3},
      {"img": "kura", "x": 5, "y": 8, "w": 3, "h": 3},
      {"img": "machiya", "x": 5, "y": 15, "w": 3, "h": 3},
    ],
    spots: {"attr": {"x": 10, "y": 12}, "katana": {"x": 2, "y": 10}, "gusoku": {"x": 10, "y": 10}, "dougu": {"x": 2, "y": 17}, "yado": {"x": 10, "y": 17}, "shrine": {"x": 6, "y": 5}, "banpei": {"x": 16, "y": 8}, "guide": {"x": 9, "y": 22}, "m1": {"x": 6, "y": 13}, "m2": {"x": 3, "y": 11}, "m3": {"x": 11, "y": 4}, "m4": {"x": 5, "y": 18}, "m5": {"x": 17, "y": 13}},
  },
  nihonmatsu: {
    entry: {"x": 10, "y": 22},
    rows: [
      'TTTTTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTTTTT',
      'T.......zzzzz.......T',
      'T.k...k.zzzzz.k...k.T',
      'T.......zzzzz.......T',
      'T...k.S.zzzzz...k...T',
      'T..k......=......k..T',
      'TRRRRRRRR.=.RRRRRRRRT',
      'T.........=.........T',
      'T####zzz..=.zzz####.T',
      'T####zzz.l=lzzz####.T',
      'T#_##zzz..=.zzz#_##.T',
      'T.........=.........T',
      'T........l=l........T',
      'T.........=.........T',
      'T####zzz..=.zzz####.T',
      'T####zzz.l=lzzz####.T',
      'T#_##zzz..=.zzz#_##.T',
      'T.........=.........T',
      'T...####..=.zzz.....T',
      'T...####..=.zzz.....T',
      'T...#_##..=..t......T',
      'T.........=.........T',
      'TTTTTTTTTTxTTTTTTTTTT',
    ],
    props: [
      {"img": "tenshu", "x": 8, "y": 2, "w": 5, "h": 4},
      {"img": "katanaya", "x": 1, "y": 9, "w": 4, "h": 3},
      {"img": "gusokuya", "x": 15, "y": 9, "w": 4, "h": 3},
      {"img": "kashiya", "x": 1, "y": 15, "w": 4, "h": 3},
      {"img": "kusuriya", "x": 15, "y": 15, "w": 4, "h": 3},
      {"img": "kura", "x": 5, "y": 9, "w": 3, "h": 3},
      {"img": "machiya", "x": 12, "y": 9, "w": 3, "h": 3},
      {"img": "machiya", "x": 5, "y": 15, "w": 3, "h": 3},
      {"img": "kura", "x": 12, "y": 15, "w": 3, "h": 3},
      {"img": "hatago", "x": 4, "y": 19, "w": 4, "h": 3},
      {"img": "jinja", "x": 12, "y": 19, "w": 3, "h": 2},
    ],
    spots: {"katana": {"x": 2, "y": 11}, "gusoku": {"x": 16, "y": 11}, "kashi": {"x": 2, "y": 17}, "dougu": {"x": 16, "y": 17}, "yado": {"x": 5, "y": 21}, "banpei": {"x": 9, "y": 8}, "shrine": {"x": 15, "y": 20}, "guide": {"x": 11, "y": 22}, "m1": {"x": 7, "y": 13}, "m2": {"x": 13, "y": 13}, "lord": {"x": 11, "y": 8}},
  },
  shirakawa: {
    entry: {"x": 10, "y": 22},
    rows: [
      'TTTTTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTTTTT',
      'Tzzzzz........zzz...T',
      'Tzzzzz.k......zzz...T',
      'Tzzzzz....=....t....T',
      'Tzzzzz....=.........T',
      'T.....kk..=.........T',
      'T.........=########.T',
      'T######...=########.T',
      'T...=.....=#_###_##.T',
      'T...=.....=.........T',
      'Trrrbrrrrr=rrrrrrrrrT',
      'T.........=.........T',
      'T==========.........T',
      'T.####....=.........T',
      'T.####zzz.=...####..T',
      'T.#_##zzz.=...####..T',
      'T.....zzz.=...#_##..T',
      'T.........=.........T',
      'T.........=......zz.T',
      'T..k.....l=l.....zz.T',
      'T......k..=....k.zz.T',
      'T.........=.........T',
      'TTTTTTTTTTxTTTTTTTTTT',
    ],
    props: [
      {"img": "tenshu", "x": 1, "y": 2, "w": 5, "h": 4},
      {"img": "hei", "x": 1, "y": 8, "w": 3, "h": 1},
      {"img": "hei", "x": 4, "y": 8, "w": 3, "h": 1},
      {"img": "jinja", "x": 14, "y": 2, "w": 3, "h": 2},
      {"img": "katanaya", "x": 11, "y": 7, "w": 4, "h": 3},
      {"img": "gusokuya", "x": 15, "y": 7, "w": 4, "h": 3},
      {"img": "kusuriya", "x": 2, "y": 14, "w": 4, "h": 3},
      {"img": "hatago", "x": 14, "y": 15, "w": 4, "h": 3},
      {"img": "machiya", "x": 6, "y": 15, "w": 3, "h": 3},
      {"img": "hinomi", "x": 17, "y": 19, "w": 2, "h": 3},
    ],
    spots: {"attr": {"x": 10, "y": 12}, "katana": {"x": 12, "y": 9}, "gusoku": {"x": 16, "y": 9}, "dougu": {"x": 3, "y": 16}, "yado": {"x": 15, "y": 17}, "shrine": {"x": 13, "y": 3}, "banpei": {"x": 5, "y": 9}, "guide": {"x": 11, "y": 22}, "m1": {"x": 8, "y": 19}, "m2": {"x": 12, "y": 13}, "m3": {"x": 8, "y": 5}, "lord": {"x": 6, "y": 5}},
  },
  yumoto: {
    entry: {"x": 8, "y": 16},
    rows: [
      'TTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTT',
      'T......zzz...zzzT',
      'T..k...zzz...zzzT',
      'T.......=....zzzT',
      'T.......=.......T',
      'T####...=...####T',
      'T####...=...####T',
      'T#_##...=...#_##T',
      'T.......=.......T',
      'T===============T',
      'T.......=.......T',
      'TRuuuu..=..uuuuRT',
      'T.uuuuR.=.Ruuuu.T',
      'T.......=....zzzT',
      'T.......=....zzzT',
      'T.k.k...=....zzzT',
      'TTTTTTTTxTTTTTTTT',
    ],
    props: [
      {"img": "tera", "x": 7, "y": 2, "w": 3, "h": 2},
      {"img": "hatago", "x": 1, "y": 6, "w": 4, "h": 3},
      {"img": "kusuriya", "x": 12, "y": 6, "w": 4, "h": 3},
      {"img": "hokora", "x": 13, "y": 2, "w": 3, "h": 3},
      {"img": "yugoya", "x": 13, "y": 14, "w": 3, "h": 3},
    ],
    spots: {"attr": {"x": 8, "y": 9}, "yado": {"x": 2, "y": 8}, "dougu": {"x": 13, "y": 8}, "temple": {"x": 6, "y": 3}, "guide": {"x": 9, "y": 16}, "m1": {"x": 10, "y": 11}, "m2": {"x": 6, "y": 15}, "m3": {"x": 9, "y": 5}, "m4": {"x": 7, "y": 5}, "m5": {"x": 12, "y": 15}, "bandai": {"x": 6, "y": 12}},
  },
  onahama: {
    entry: {"x": 8, "y": 16},
    rows: [
      'TTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTT',
      'T~~~~~~~~~~~~~~~T',
      'T~~~P~~~~~~~P~~~T',
      'T~~~P~~~~~~~P~~~T',
      'T~~~P~~~~~~~P~~~T',
      'T,,,,,,,,,a,,,,,T',
      'T,H,,,,a,,,,,,H,T',
      'T.......=.......T',
      'T####...=...####T',
      'T####...=...####T',
      'T#_##...=...#_##T',
      'T===============T',
      'T.......=.......T',
      'T.......=.......T',
      'T.K.....=.....K.T',
      'T.......=.......T',
      'TTTTTTTTxTTTTTTTT',
    ],
    props: [
      {"img": "fune", "x": 1, "y": 3, "w": 2, "h": 1},
      {"img": "fune", "x": 6, "y": 2, "w": 2, "h": 1},
      {"img": "fune", "x": 13, "y": 4, "w": 2, "h": 1},
      {"img": "fune", "x": 9, "y": 4, "w": 2, "h": 1},
      {"img": "ichiba", "x": 1, "y": 9, "w": 4, "h": 3},
      {"img": "banya", "x": 12, "y": 9, "w": 4, "h": 3},
    ],
    spots: {"shop": {"x": 2, "y": 11}, "bansho": {"x": 13, "y": 11}, "fishing": {"x": 5, "y": 6}, "guide": {"x": 9, "y": 16}, "m1": {"x": 11, "y": 13}, "m2": {"x": 5, "y": 14}, "m3": {"x": 3, "y": 13}, "m4": {"x": 14, "y": 13}, "m5": {"x": 6, "y": 15}},
  },
  odaka: {
    entry: {"x": 9, "y": 18},
    rows: [
      'TTTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTTT',
      'T.zzz..k.....zzz..T',
      'T.zzzk...=...zzz..T',
      'T.zzz....=....t...T',
      'T.....k..=........T',
      'T........=........T',
      'T........=........T',
      'T####....=....####T',
      'T#__#....=....#__#T',
      'T#cc#....=....#cc#T',
      'T........=........T',
      'T=================T',
      'T........=........T',
      'T........=....####T',
      'T..wwww..=....####T',
      'T..wwww..=....#_##T',
      'T.m....m.=........T',
      'T........=........T',
      'TTTTTTTTTxTTTTTTTTT',
    ],
    props: [
      {"img": "shiro", "x": 2, "y": 2, "w": 3, "h": 3},
      {"img": "jinja", "x": 13, "y": 2, "w": 3, "h": 2},
      {"img": "yadoya", "x": 1, "y": 8, "w": 4, "h": 2},
      {"img": "counter", "x": 2, "y": 10, "w": 2, "h": 1},
      {"img": "mise", "x": 14, "y": 8, "w": 4, "h": 2},
      {"img": "counter", "x": 15, "y": 10, "w": 2, "h": 1},
      {"img": "kusuriya", "x": 14, "y": 14, "w": 4, "h": 3},
    ],
    spots: {"yado": {"x": 2, "y": 9}, "katana": {"x": 15, "y": 9}, "dougu": {"x": 15, "y": 16}, "shrine": {"x": 12, "y": 3}, "guide": {"x": 10, "y": 18}, "m1": {"x": 11, "y": 16}, "m2": {"x": 5, "y": 13}, "m3": {"x": 12, "y": 5}, "m4": {"x": 6, "y": 6}, "sou": {"x": 16, "y": 4}, "yamabushi": {"x": 7, "y": 10}, "yojutsu": {"x": 11, "y": 10}, "ninja": {"x": 2, "y": 14}, "kusushi": {"x": 12, "y": 14}},
  },
  koriyama: {
    entry: {"x": 7, "y": 24},
    rows: [
      'TTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTT',
      'T.....zzz.....T',
      'T.....zzz.....T',
      'T......t......T',
      'T......=......T',
      'T####..=......T',
      'T####..=..####T',
      'T#_##..=..####T',
      'T......=..#_##T',
      'T.....l=l.....T',
      'T......=......T',
      'T####..=......T',
      'T####..=..####T',
      'T#_##..=..####T',
      'T......=..#_##T',
      'T.....l=l.....T',
      'T......=......T',
      'T.zzz..=......T',
      'T.zzz..=..####T',
      'T......=..####T',
      'T......=..#_##T',
      'Tzzzz.l=l.....T',
      'Tzzzz..=....k.T',
      'Tzzzz..=......T',
      'TTTTTTTxTTTTTTT',
    ],
    props: [
      {"img": "jinja", "x": 6, "y": 2, "w": 3, "h": 2},
      {"img": "katanaya", "x": 1, "y": 6, "w": 4, "h": 3},
      {"img": "hatago", "x": 10, "y": 7, "w": 4, "h": 3},
      {"img": "kusuriya", "x": 1, "y": 12, "w": 4, "h": 3},
      {"img": "chaya", "x": 10, "y": 13, "w": 4, "h": 3},
      {"img": "tera", "x": 2, "y": 18, "w": 3, "h": 2},
      {"img": "gusokuya", "x": 10, "y": 19, "w": 4, "h": 3},
      {"img": "sakaya", "x": 1, "y": 22, "w": 4, "h": 3},
    ],
    spots: {"attr": {"x": 7, "y": 13}, "katana": {"x": 2, "y": 8}, "yado": {"x": 11, "y": 9}, "dougu": {"x": 2, "y": 14}, "chaya": {"x": 11, "y": 15}, "gusoku": {"x": 11, "y": 21}, "shrine": {"x": 5, "y": 3}, "temple": {"x": 5, "y": 19}, "guide": {"x": 8, "y": 24}, "m1": {"x": 5, "y": 9}, "m2": {"x": 9, "y": 17}, "m3": {"x": 5, "y": 22}},
  },
  sukagawa: {
    entry: {"x": 8, "y": 18},
    rows: [
      'TTTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTTT',
      'T.R....zzz...zz.rrT',
      'T...R..zzz...zz.rrT',
      'T.......t...R...rrT',
      'T.......=.......rrT',
      'T####..l=l.####.rrT',
      'T####...=..####.rrT',
      'T#_##..l=l.#_##.rrT',
      'T.......=.......rrT',
      'T.......=.......rrT',
      'T===============bbT',
      'T.......=.......rrT',
      'T......l=l......rrT',
      'T####...=..####.rrT',
      'T####..l=l.####.rrT',
      'T#_##...=..#_##.rrT',
      'T.......=.....k.rrT',
      'T.k.....=.......rrT',
      'TTTTTTTTxTTTTTTTTTT',
    ],
    props: [
      {"img": "jinja", "x": 7, "y": 2, "w": 3, "h": 2},
      {"img": "hinomi", "x": 13, "y": 2, "w": 2, "h": 2},
      {"img": "katanaya", "x": 1, "y": 6, "w": 4, "h": 3},
      {"img": "hatago", "x": 11, "y": 6, "w": 4, "h": 3},
      {"img": "kusuriya", "x": 1, "y": 14, "w": 4, "h": 3},
      {"img": "gusokuya", "x": 11, "y": 14, "w": 4, "h": 3},
    ],
    spots: {"katana": {"x": 2, "y": 8}, "yado": {"x": 12, "y": 8}, "dougu": {"x": 2, "y": 16}, "gusoku": {"x": 12, "y": 16}, "shrine": {"x": 6, "y": 3}, "guide": {"x": 9, "y": 18}, "m1": {"x": 5, "y": 10}, "m2": {"x": 12, "y": 12}, "m3": {"x": 12, "y": 3}},
  },
  aizuwakamatsu: {
    entry: {"x": 10, "y": 24},
    rows: [
      'TTTTTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTTTTT',
      'TKKKKppppppppppp....T',
      'T...KpKzzzzzzzKp..K.T',
      'T...Kpzzzzzzzzzp....T',
      'TzzzKpzzzzzzzzzp....T',
      'Tzzz.pzzzzzzzzzp....T',
      'T.t..pzzzzzzzzzp..K.T',
      'T....pKzzzzzzzKp....T',
      'T....pppppbppppp....T',
      'T.........=.........T',
      'T.........=.........T',
      'T####.zzz.=.zzz.####T',
      'T####.zzzl=lzzz.####T',
      'T#_##.zzz.=.zzz.#_##T',
      'T.........=.........T',
      'T===================T',
      'T.........=.........T',
      'T.........=.........T',
      'T########.=####.####T',
      'T#####__#.=####.####T',
      'T#_###cc#.=#_##.#_##T',
      'T.........=.........T',
      'T.........=.........T',
      'TK........=...K....KT',
      'TTTTTTTTTTxTTTTTTTTTT',
    ],
    props: [
      {"img": "tenshu", "x": 8, "y": 3, "w": 5, "h": 4},
      {"img": "jinja", "x": 1, "y": 5, "w": 3, "h": 2},
      {"img": "katanaya", "x": 1, "y": 12, "w": 4, "h": 3},
      {"img": "gusokuya", "x": 16, "y": 12, "w": 4, "h": 3},
      {"img": "kura", "x": 6, "y": 12, "w": 3, "h": 3},
      {"img": "machiya", "x": 12, "y": 12, "w": 3, "h": 3},
      {"img": "kusuriya", "x": 1, "y": 19, "w": 4, "h": 3},
      {"img": "hatago", "x": 16, "y": 19, "w": 4, "h": 3},
      {"img": "mise", "x": 5, "y": 19, "w": 4, "h": 2},
      {"img": "counter", "x": 6, "y": 21, "w": 2, "h": 1},
      {"img": "kashiya", "x": 11, "y": 19, "w": 4, "h": 3},
    ],
    spots: {"attr": {"x": 11, "y": 14}, "katana": {"x": 2, "y": 14}, "gusoku": {"x": 17, "y": 14}, "dougu": {"x": 2, "y": 21}, "yado": {"x": 17, "y": 21}, "ezuke": {"x": 6, "y": 20}, "kashi": {"x": 12, "y": 21}, "banpei": {"x": 9, "y": 10}, "shrine": {"x": 4, "y": 6}, "guide": {"x": 11, "y": 23}, "m1": {"x": 8, "y": 17}, "m2": {"x": 13, "y": 17}, "m3": {"x": 17, "y": 23}, "m4": {"x": 18, "y": 9}, "lord": {"x": 11, "y": 10}},
  },
  inawashiro: {
    entry: {"x": 15, "y": 8},
    rows: [
      'TTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTT',
      'TKzzzzzzKKKKKKKKT',
      'TKzzzzzzKKKKKKKKT',
      'T####...=...####T',
      'T####...=...####T',
      'T#_##...=...#_##T',
      'T.......=.......T',
      'T===============x',
      'T.......=.......T',
      'T####...=...####T',
      'T####...=...####T',
      'T#_##...=...#_##T',
      'T,,,,,,a,,,,,,,,T',
      'T~~P~~~~~~~~~~~~T',
      'T~~P~~~~~~~~~~~~T',
      'T~~P~~~~~~~~~~~~T',
      'TTTTTTTTTTTTTTTTT',
    ],
    props: [
      {"img": "fune", "x": 5, "y": 15, "w": 2, "h": 1},
      {"img": "fune", "x": 11, "y": 15, "w": 2, "h": 1},
      {"img": "ishigaki", "x": 2, "y": 2, "w": 3, "h": 2},
      {"img": "ishigaki", "x": 5, "y": 2, "w": 3, "h": 2},
      {"img": "hatago", "x": 1, "y": 4, "w": 4, "h": 3},
      {"img": "katanaya", "x": 12, "y": 4, "w": 4, "h": 3},
      {"img": "kusuriya", "x": 1, "y": 10, "w": 4, "h": 3},
      {"img": "gusokuya", "x": 12, "y": 10, "w": 4, "h": 3},
    ],
    spots: {"attr": {"x": 9, "y": 9}, "yado": {"x": 2, "y": 6}, "katana": {"x": 13, "y": 6}, "dougu": {"x": 2, "y": 12}, "gusoku": {"x": 13, "y": 12}, "guide": {"x": 11, "y": 7}, "m1": {"x": 6, "y": 7}, "m2": {"x": 10, "y": 10}, "m3": {"x": 10, "y": 13}, "m4": {"x": 6, "y": 11}},
  },
  yanaizu: {
    entry: {"x": 6, "y": 16},
    rows: [
      'TTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTT',
      'TKKKKzzz..K..rrKT',
      'T....zzz.....rr.T',
      'T.....=......rr.T',
      'T####.=.####.rr.T',
      'T####.=.####.rr.T',
      'T#_##l=l#_##.rr.T',
      'T.....=......rr.T',
      'T.....=......rr.T',
      'T============bb=T',
      'T.....=......rr.T',
      'T####.=.zzz..rr.T',
      'T####.=.zzz..rr.T',
      'T#_##.=.zzz..rr.T',
      'T.....=....K.rr.T',
      'T.....=......rrKT',
      'TTTTTTxTTTTTTTTTT',
    ],
    props: [
      {"img": "tera", "x": 5, "y": 2, "w": 3, "h": 2},
      {"img": "chaya", "x": 1, "y": 5, "w": 4, "h": 3},
      {"img": "hatago", "x": 8, "y": 5, "w": 4, "h": 3},
      {"img": "kusuriya", "x": 1, "y": 12, "w": 4, "h": 3},
      {"img": "hokora", "x": 8, "y": 12, "w": 3, "h": 3},
    ],
    spots: {"chaya": {"x": 2, "y": 7}, "yado": {"x": 9, "y": 7}, "dougu": {"x": 2, "y": 14}, "temple": {"x": 8, "y": 3}, "hadaka": {"x": 5, "y": 4}, "guide": {"x": 7, "y": 16}, "m1": {"x": 4, "y": 9}, "m2": {"x": 10, "y": 9}, "m3": {"x": 2, "y": 16}, "akabeko": {"x": 11, "y": 8}},
  },
  iizaka: {
    entry: {"x": 4, "y": 14},
    rows: [
      'TTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTT',
      'T......rr.....T',
      'T####..rr.####T',
      'T####..rr.####T',
      'T#_##..rr.#_##T',
      'T......rr.....T',
      'T......rr.....T',
      'T======bb=====T',
      'T...=..rr.....T',
      'T...=..rr.....T',
      'T...=..rrRuuu.T',
      'T.k.=..rr.uuu.T',
      'T...=.krr.....T',
      'T...=..rr..k.RT',
      'TTTTxTTTTTTTTTT',
    ],
    props: [
      {"img": "hatago", "x": 1, "y": 3, "w": 4, "h": 3},
      {"img": "yuya", "x": 10, "y": 3, "w": 4, "h": 3},
    ],
    spots: {"yado": {"x": 2, "y": 5}, "bandai": {"x": 11, "y": 5}, "m1": {"x": 2, "y": 10}, "m2": {"x": 11, "y": 9}, "m3": {"x": 12, "y": 7}, "chaya": {"x": 5, "y": 13}},
  },
  tsuchiyu: {
    entry: {"x": 4, "y": 14},
    rows: [
      'TTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTT',
      'T......rr.....T',
      'T####..rr.####T',
      'T####..rr.####T',
      'T#_##..rr.#_##T',
      'T======bb=====T',
      'T...=..rr.....T',
      'T...=..rr.....T',
      'T...=..rr.....T',
      'T...=..bb.....T',
      'T...=..rrRuuu.T',
      'T.T.=..rr.uuu.T',
      'T...=.Trr.....T',
      'T...=..rr..T.RT',
      'TTTTxTTTTTTTTTT',
    ],
    props: [
      {"img": "yuya", "x": 1, "y": 3, "w": 4, "h": 3},
      {"img": "hatago", "x": 10, "y": 3, "w": 4, "h": 3},
    ],
    spots: {"bandai": {"x": 2, "y": 5}, "yado": {"x": 11, "y": 5}, "m1": {"x": 2, "y": 10}, "m2": {"x": 11, "y": 9}, "m3": {"x": 12, "y": 7}, "chaya": {"x": 5, "y": 13}},
  },
  bandaiatami: {
    entry: {"x": 4, "y": 14},
    rows: [
      'TTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTT',
      'T......rr.....T',
      'T####..rr.####T',
      'T####..rr.####T',
      'T#_##..rr.#_##T',
      'T......rr.....T',
      'T......rr.....T',
      'T......rr.....T',
      'T======bb=====T',
      'T...=..rr.....T',
      'T...=..rrRuuu.T',
      'T.m.=..rr.uuu.T',
      'T...=.mrr.....T',
      'T...=..rr..m.RT',
      'TTTTxTTTTTTTTTT',
    ],
    props: [
      {"img": "hatago", "x": 1, "y": 3, "w": 4, "h": 3},
      {"img": "yuya", "x": 10, "y": 3, "w": 4, "h": 3},
    ],
    spots: {"yado": {"x": 2, "y": 5}, "bandai": {"x": 11, "y": 5}, "m1": {"x": 2, "y": 10}, "m2": {"x": 11, "y": 9}, "m3": {"x": 12, "y": 7}, "chaya": {"x": 5, "y": 13}},
  },
  takayu: {
    entry: {"x": 7, "y": 14},
    rows: [
      'TTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTT',
      'TY...........YT',
      'T.Y..####...Y.T',
      'T....####.....T',
      'T....#_##.....T',
      'T......=......T',
      'T..=====..R..YT',
      'TY.=..........T',
      'T..=..........T',
      'T..=====.####.T',
      'T......=.####.T',
      'Tuu..R.=.#_##RT',
      'Tuu....=......T',
      'T......=....Y.T',
      'TTTTTTTxTTTTTTT',
    ],
    props: [
      {"img": "tojiyado", "x": 5, "y": 3, "w": 4, "h": 3},
      {"img": "yuya", "x": 9, "y": 10, "w": 4, "h": 3},
    ],
    spots: {"yado": {"x": 6, "y": 5}, "bandai": {"x": 10, "y": 12}, "m1": {"x": 5, "y": 8}, "m2": {"x": 11, "y": 6}, "m3": {"x": 4, "y": 13}, "chaya": {"x": 9, "y": 14}},
  },
  futamata: {
    entry: {"x": 7, "y": 14},
    rows: [
      'TTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTT',
      'TT...........TT',
      'T.T..####...T.T',
      'T....####.....T',
      'T....#_##.....T',
      'T......=......T',
      'T..=====..R..TT',
      'TT.=..........T',
      'T..=..........T',
      'T..=====.####.T',
      'T......=.####.T',
      'Tuu..R.=.#_##RT',
      'Tuu....=......T',
      'T......=....T.T',
      'TTTTTTTxTTTTTTT',
    ],
    props: [
      {"img": "tojiyado", "x": 5, "y": 3, "w": 4, "h": 3},
      {"img": "yuya", "x": 9, "y": 10, "w": 4, "h": 3},
    ],
    spots: {"yado": {"x": 6, "y": 5}, "bandai": {"x": 10, "y": 12}, "m1": {"x": 5, "y": 8}, "m2": {"x": 11, "y": 6}, "m3": {"x": 4, "y": 13}, "chaya": {"x": 9, "y": 14}},
  },
  kashi: {
    entry: {"x": 7, "y": 14},
    rows: [
      'TTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTT',
      'TY...........YT',
      'Trr..####...Y.T',
      'Trr..####..R..T',
      'TrrR.#_##.....T',
      'Trr....=......T',
      'T..=====..R..YT',
      'TY.=..........T',
      'T..=..........T',
      'T..=====.####.T',
      'T......=.####.T',
      'Tuu..R.=.#_##RT',
      'Tuu....=......T',
      'T......=....Y.T',
      'TTTTTTTxTTTTTTT',
    ],
    props: [
      {"img": "tojiyado", "x": 5, "y": 3, "w": 4, "h": 3},
      {"img": "yuya", "x": 9, "y": 10, "w": 4, "h": 3},
    ],
    spots: {"yado": {"x": 6, "y": 5}, "bandai": {"x": 10, "y": 12}, "m1": {"x": 5, "y": 8}, "m2": {"x": 11, "y": 6}, "m3": {"x": 4, "y": 13}, "chaya": {"x": 9, "y": 14}},
  },
  dake: {
    entry: {"x": 7, "y": 14},
    rows: [
      'TTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTT',
      'T.............T',
      'T....k...k....T',
      'T####..=..####T',
      'T#__#..=..#__#T',
      'T#cc#..=..#cc#T',
      'T......=......T',
      'T......=......T',
      'T.===========.T',
      'T......=......T',
      'T......=.kuuu.T',
      'T......=..uuu.T',
      'Tk.....=.....kT',
      'T....k.=......T',
      'TTTTTTTxTTTTTTT',
    ],
    props: [
      {"img": "yadoya", "x": 1, "y": 4, "w": 4, "h": 2},
      {"img": "counter", "x": 2, "y": 6, "w": 2, "h": 1},
      {"img": "minka", "x": 10, "y": 4, "w": 4, "h": 2},
      {"img": "counter", "x": 11, "y": 6, "w": 2, "h": 1},
    ],
    spots: {"yado": {"x": 2, "y": 5}, "bandai": {"x": 11, "y": 5}, "m1": {"x": 6, "y": 8}, "m2": {"x": 8, "y": 6}, "m3": {"x": 12, "y": 10}, "chaya": {"x": 6, "y": 13}},
  },
  nakanosawa: {
    entry: {"x": 7, "y": 14},
    rows: [
      'TTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTT',
      'T.............T',
      'T....T...T....T',
      'T####..=..####T',
      'T#__#..=..#__#T',
      'T#cc#..=..#cc#T',
      'T......=..R...T',
      'T......=......T',
      'T.===========.T',
      'T......=......T',
      'T...R..=.Tuuu.T',
      'T......=..uuu.T',
      'TT.....=.....TT',
      'T....T.=......T',
      'TTTTTTTxTTTTTTT',
    ],
    props: [
      {"img": "yadoya", "x": 1, "y": 4, "w": 4, "h": 2},
      {"img": "counter", "x": 2, "y": 6, "w": 2, "h": 1},
      {"img": "minka", "x": 10, "y": 4, "w": 4, "h": 2},
      {"img": "counter", "x": 11, "y": 6, "w": 2, "h": 1},
    ],
    spots: {"yado": {"x": 2, "y": 5}, "bandai": {"x": 11, "y": 5}, "m1": {"x": 6, "y": 8}, "m2": {"x": 8, "y": 6}, "m3": {"x": 12, "y": 10}, "chaya": {"x": 6, "y": 13}},
  },
  higashiyama: {
    entry: {"x": 4, "y": 14},
    rows: [
      'TTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTT',
      'T......rr.....T',
      'T####..rr.####T',
      'T####..rr.####T',
      'T#_##..rr.#_##T',
      'T======bb=====T',
      'T...=..rr.....T',
      'T...=..rr.....T',
      'T...=..rr.....T',
      'T...=..bb.....T',
      'T...=..rrRuuu.T',
      'T.m.=..rr.uuu.T',
      'T...=.mrr.....T',
      'T...=..rr..m.RT',
      'TTTTxTTTTTTTTTT',
    ],
    props: [
      {"img": "yuya", "x": 1, "y": 3, "w": 4, "h": 3},
      {"img": "hatago", "x": 10, "y": 3, "w": 4, "h": 3},
    ],
    spots: {"bandai": {"x": 2, "y": 5}, "yado": {"x": 11, "y": 5}, "m1": {"x": 2, "y": 10}, "m2": {"x": 11, "y": 9}, "m3": {"x": 12, "y": 7}, "chaya": {"x": 5, "y": 13}},
  },
  ashinomaki: {
    entry: {"x": 4, "y": 14},
    rows: [
      'TTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTT',
      'T......rr.....T',
      'T####..rr.####T',
      'T####R.rr.####T',
      'T#_##..rr.#_##T',
      'T......rr....RT',
      'T......rr.....T',
      'T......rr.....T',
      'T======bb=====T',
      'T...=..rr.....T',
      'T...=..rrRuuu.T',
      'T.k.=..rr.uuu.T',
      'T...=.krr.....T',
      'T...=..rr..k.RT',
      'TTTTxTTTTTTTTTT',
    ],
    props: [
      {"img": "hatago", "x": 1, "y": 3, "w": 4, "h": 3},
      {"img": "yuya", "x": 10, "y": 3, "w": 4, "h": 3},
    ],
    spots: {"yado": {"x": 2, "y": 5}, "bandai": {"x": 11, "y": 5}, "m1": {"x": 2, "y": 10}, "m2": {"x": 11, "y": 9}, "m3": {"x": 12, "y": 7}, "chaya": {"x": 5, "y": 13}},
  },
  nishiyama: {
    entry: {"x": 7, "y": 14},
    rows: [
      'TTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTT',
      'TT...........TT',
      'T.T..####...T.T',
      'T....####.....T',
      'T....#_##.....T',
      'T......=......T',
      'T..=====..R..TT',
      'TT.=.........rT',
      'T..=.........rT',
      'T..=====.####rT',
      'T......=.####rT',
      'Tuu..R.=.#_##rT',
      'Tuu....=.....rT',
      'T......=....TrT',
      'TTTTTTTxTTTTTTT',
    ],
    props: [
      {"img": "tojiyado", "x": 5, "y": 3, "w": 4, "h": 3},
      {"img": "yuya", "x": 9, "y": 10, "w": 4, "h": 3},
    ],
    spots: {"yado": {"x": 6, "y": 5}, "bandai": {"x": 10, "y": 12}, "m1": {"x": 5, "y": 8}, "m2": {"x": 11, "y": 6}, "m3": {"x": 4, "y": 13}, "chaya": {"x": 9, "y": 14}},
  },
  hayato: {
    entry: {"x": 7, "y": 14},
    rows: [
      'TTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTT',
      'T...........RrT',
      'T....m...m...rT',
      'T####..=..###rT',
      'T#__#..=..#__rT',
      'T#cc#..=..#ccrT',
      'T......=.....rT',
      'T......=.....rT',
      'T.===========.T',
      'T......=......T',
      'T.ppp..=.muuu.T',
      'T.ppp..=..uuu.T',
      'Tm.....=.....mT',
      'T....m.=......T',
      'TTTTTTTxTTTTTTT',
    ],
    props: [
      {"img": "yadoya", "x": 1, "y": 4, "w": 4, "h": 2},
      {"img": "counter", "x": 2, "y": 6, "w": 2, "h": 1},
      {"img": "minka", "x": 10, "y": 4, "w": 4, "h": 2},
      {"img": "counter", "x": 11, "y": 6, "w": 2, "h": 1},
    ],
    spots: {"yado": {"x": 2, "y": 5}, "bandai": {"x": 11, "y": 5}, "m1": {"x": 6, "y": 8}, "m2": {"x": 8, "y": 6}, "m3": {"x": 12, "y": 10}, "chaya": {"x": 6, "y": 13}},
  },
  bohata: {
    entry: {"x": 7, "y": 14},
    rows: [
      'TTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTT',
      'T.............T',
      'T....m...m....T',
      'T####..=..####T',
      'T#__#..=..#__#T',
      'T#cc#..=..#cc#T',
      'T......=......T',
      'T......=......T',
      'T.===========.T',
      'T......=......T',
      'T.ppp..=.muuu.T',
      'T.ppp..=..uuu.T',
      'Tm.....=.....mT',
      'T....m.=......T',
      'TTTTTTTxTTTTTTT',
    ],
    props: [
      {"img": "yadoya", "x": 1, "y": 4, "w": 4, "h": 2},
      {"img": "counter", "x": 2, "y": 6, "w": 2, "h": 1},
      {"img": "minka", "x": 10, "y": 4, "w": 4, "h": 2},
      {"img": "counter", "x": 11, "y": 6, "w": 2, "h": 1},
    ],
    spots: {"yado": {"x": 2, "y": 5}, "bandai": {"x": 11, "y": 5}, "m1": {"x": 6, "y": 8}, "m2": {"x": 8, "y": 6}, "m3": {"x": 12, "y": 10}, "chaya": {"x": 6, "y": 13}},
  },
  nekonakiyu: {
    entry: {"x": 7, "y": 14},
    rows: [
      'TTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTT',
      'T.............T',
      'T....K...K....T',
      'T####..=..####T',
      'T#__#..=..#__#T',
      'T#cc#..=..#cc#T',
      'T......=......T',
      'T......=......T',
      'T.===========.T',
      'T......=......T',
      'T.ppp..=.Kuuu.T',
      'T.ppp..=..uuu.T',
      'TK.....=.....KT',
      'T....K.=......T',
      'TTTTTTTxTTTTTTT',
    ],
    props: [
      {"img": "yadoya", "x": 1, "y": 4, "w": 4, "h": 2},
      {"img": "counter", "x": 2, "y": 6, "w": 2, "h": 1},
      {"img": "minka", "x": 10, "y": 4, "w": 4, "h": 2},
      {"img": "counter", "x": 11, "y": 6, "w": 2, "h": 1},
    ],
    spots: {"yado": {"x": 2, "y": 5}, "bandai": {"x": 11, "y": 5}, "m1": {"x": 6, "y": 8}, "m2": {"x": 8, "y": 6}, "m3": {"x": 12, "y": 10}, "chaya": {"x": 6, "y": 13}},
  },
};
// <<町の形 ここまで>>
for (const [id, t] of Object.entries(TOWNS)) {
  const L = TOWN_LAYOUTS[id];
  Object.assign(t, { rows: L.rows, props: L.props, entry: L.entry });
  t.npcs = t.npcs.map((n) => (n.spot ? { ...n, ...L.spots[n.spot] } : n));
}
// お城の 大広間と、お題の 新しい場所（10/7 お城クエスト・src/field/castle.js）。町の 表には 入れるが、町の 一覧（TOWN_IDS）には 数えない
Object.assign(TOWNS, castleMaps());
export const TOWN_IDS = Object.keys(TOWNS).filter((id) => !TOWNS[id].inside);
// 町の入口（入ると ここに立つ）。町ごとに違う（城下町は 21×24 など）
export const townEntry = (id) => TOWNS[id]?.entry ?? TOWN_ENTRY;

export const TOWN_OF = { H: 'taira', Y: 'yumoto', O: 'onahama', Q: 'odaka', M: 'nakamura', U: 'fukushima', W: 'nihonmatsu', g: 'koriyama', s: 'sukagawa', v: 'shirakawa', e: 'iizaka', f: 'takayu', j: 'tsuchiyu', l: 'dake', c: 'bandaiatami', x: 'bohata', u: 'nekonakiyu', y: 'futamata', i: 'kashi', 苗: 'inawashiro', 若: 'aizuwakamatsu', 津: 'yanaizu', 沢: 'nakanosawa', 東: 'higashiyama', 芦: 'ashinomaki', 西: 'nishiyama', 早: 'hayato' }; // 沢東芦西早＝4章の温泉地（10/6） // 苗／若／津＝4章 会津（10/6） // e〜i＝温泉地（10/5 夜） // g／s／v＝3章 県中・県南（10/4）

// 町に入った瞬間の毛筆の名前（10/4 本人「二本松に入るとイラストに『二本松』の文字が無い」＝表が1章の5つで止まっていた）
// 表に無い町も「○○の町」で必ず出す（試験 tests/look.test.js）
export const TOWN_CARD_NAME = { taira: '平の城下町', yumoto: '湯本の湯の町', onahama: '小名浜の港', odaka: '小高の町', nakamura: '相馬の城下町', fukushima: '福島の城下町', nihonmatsu: '二本松の城下町', koriyama: '郡山の町', sukagawa: '須賀川の町', shirakawa: '白河の城下町', iizaka: '飯坂温泉', takayu: '高湯温泉', tsuchiyu: '土湯温泉', dake: '岳温泉', bandaiatami: '磐梯熱海温泉', bohata: '母畑温泉', nekonakiyu: '猫啼温泉', futamata: '二岐温泉', kashi: '甲子温泉', inawashiro: '猪苗代の町', aizuwakamatsu: '会津若松の城下町', yanaizu: '柳津の門前町', nakanosawa: '中ノ沢温泉', higashiyama: '東山温泉', ashinomaki: '芦ノ牧温泉', nishiyama: '西山温泉', hayato: '早戸温泉' };
// 城の 大広間と お題の 場所（10/7）
for (const [id, t] of Object.entries(TOWNS)) if (t.inside) TOWN_CARD_NAME[id] = t.inside === 'castle' ? `${t.name} 大広間` : t.name;
export const townCardName = (id) => TOWN_CARD_NAME[id] ?? `${TOWNS[id]?.name ?? ''}の町`;

