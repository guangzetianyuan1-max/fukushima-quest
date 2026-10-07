// お城クエスト（10/7 本人「お城クエストがしょぼい。お城の中に入って、お殿様よりクエストを受ける。新しい場所でモンスターを倒す」）
// 決め（10/7 本人）：怪物＝言い伝えのある怪物だけ・5城まとめて・今のボスと同じ作り（紙芝居4枚・声・必殺技の挿絵・図鑑）・城の中＝歩ける大広間
// 流れ：城下町の門番に話す → 城の大広間（歩ける）→ お殿様の お題を受ける → 章の地図に入口が ひらく → 新しい場所の奥で 怪物と戦う → 大広間で 報告すると 判子
// 出どころ＝vault 日本昔話/2026-10-07-調査-お城クエスト5城の怪物.md・設計＝vault docs/superpowers/specs/2026-10-07-castle-quests-design.md
// 画面と切り離した計算だけ（地図の形もここ）。地図は towns.js の TOWNS に足す（inside: 'castle' ＝大広間／'quest' ＝新しい場所）

// 城下町 → 大広間・怪物・新しい場所・章の地図の入口
//   gate＝章の地図の入口の字と場所（地図の書き出し道具は触らず、ここで重ねる＝withGates）
//   side＝その寄り道が どの章の終わりの あとか・after＝その章の 終わりの ボス（試験の物差し・強さの見込み＝その ボスの あとに 着く）
//   ⭐10/7 本人「その章を終えてから」＝お殿様は after を 戻すまで 依頼を 出さない（busy＝断るときの ひと言）
export const CASTLE_QUESTS = {
  taira: {
    hall: 'jo_taira', boss: 'onigajo', after: 'ryuto', busy: '海の 龍燈', ground: 'q_onigajo', side: 0,
    gate: { map: 'field', ch: 'ア', x: 5, y: 8 }, place: '鬼ヶ城山',
    ask: ['川前の 鬼ヶ城山の 頂に、大岩に すむ 鬼が おる。', '黒い もやに 呑まれ、また 里に 岩を 投げて おるそうじゃ。鎮めて まいれ。'],
    hint: 'いわきの 北西、山の ふもとに 登り口が ある。賢沼より 先じゃ。',
  },
  nakamura: {
    hall: 'jo_nakamura', boss: 'usunuma', after: 'sumitora', busy: '虎捕山の 墨虎', ground: 'q_usunuma', side: 1,
    gate: { map: 'soma', ch: 'イ', x: 6, y: 20 }, place: '臼沼',
    ask: ['鹿島の 臼沼に すむ 大蛇が、もやに 呑まれて 暴れて おる。', '弓の 名手が 射止めたと いう 大蛇じゃ。鎮めて まいれ。'],
    hint: '相馬の 南、鹿島の 西の 山すそに 沼への 道が ある。',
  },
  nihonmatsu: {
    hall: 'jo_nihonmatsu', boss: 'oniishi', after: 'onibaba', busy: '安達ヶ原の 鬼婆', ground: 'q_oniishi', side: 2,
    gate: { map: 'kenpoku', ch: 'ウ', x: 3, y: 32 }, place: '安達太良山の 鬼石',
    ask: ['安達太良山の 鬼が、また 街道に 出ると いう。', 'むかし 若者の 大三が 説いて 山へ 帰した 鬼じゃ。もやを はらって まいれ。'],
    hint: '二本松の 北、原瀬の 山すそに 登り口が ある。',
  },
  shirakawa: {
    hall: 'jo_shirakawa', boss: 'kenkatsura', after: 'kiyohime', busy: '安珍と 清姫', ground: 'q_kenkatsura', side: 3,
    gate: { map: 'kenchu', ch: 'エ', x: 3, y: 49 }, place: '剣桂',
    ask: ['甲子の 森の 桂の 大木に 封じられた 鬼神が、もやに 呑まれて ぬけ出したと いう。', '人びとが また 苦しまぬ うちに、鎮めて まいれ。'],
    hint: '白河の 西、甲子の 山すそに 森への 道が ある。',
  },
  aizuwakamatsu: {
    hall: 'jo_aizuwakamatsu', boss: 'kagaminuma', after: 'numagozen', busy: '沼沢湖の 沼御前', ground: 'q_kagaminuma', side: 4,
    gate: { map: 'aizu', ch: 'オ', x: 37, y: 34 }, place: '鏡ヶ沼',
    ask: ['下郷の 山奥の 鏡ヶ沼に、沼の 主の 大蛇が おる。', 'もやに 呑まれ、霧で 人を 迷わせて おるそうじゃ。鎮めて まいれ。'],
    hint: '会津の 南東、甲子峠の 手前の 山すそに 沼への 道が ある。',
  },
};
export const QUEST_TOWNS = Object.keys(CASTLE_QUESTS);
export const SIDE_BOSSES = Object.fromEntries(QUEST_TOWNS.map((t) => [CASTLE_QUESTS[t].boss, CASTLE_QUESTS[t].side]));
export const SIDE_AFTER = Object.fromEntries(QUEST_TOWNS.map((t) => [CASTLE_QUESTS[t].boss, CASTLE_QUESTS[t].after]));
// 新しい場所の奥の字 → 怪物（大広間や新しい場所の中＝町の地図の字）
export const QUEST_BOSS_AT = { 鬼: 'onigajo', 臼: 'usunuma', 石: 'oniishi', 剣: 'kenkatsura', 鏡: 'kagaminuma' };
// 章の地図の入口の字 → 城下町
export const GATE_OF = Object.fromEntries(QUEST_TOWNS.map((t) => [CASTLE_QUESTS[t].gate.ch, t]));

// お題を 受けた か（受けると 入口が ひらく）
export const questAccepted = (game, town) => !!game?.castleQuest?.[town];
export const acceptQuest = (game, town) => ({ ...game, castleQuest: { ...(game.castleQuest ?? {}), [town]: true } });
// 入口の字を 踏んだ：お殿様の 依頼が 出て いれば 新しい場所の id・まだなら null（10/7 本人「殿から依頼が出るまでは、入れないように」）
export const gateGround = (game, ch) => (GATE_OF[ch] && questAccepted(game, GATE_OF[ch]) ? CASTLE_QUESTS[GATE_OF[ch]].ground : null);

// 章の地図に 入口の字を 重ねる（地図の書き出し道具 make_*_map.py には 触らない）
export function withGates(map, rows) {
  const out = [...rows];
  for (const q of Object.values(CASTLE_QUESTS)) {
    if (q.gate.map !== map) continue;
    const r = out[q.gate.y];
    out[q.gate.y] = [...r].map((c, x) => (x === q.gate.x ? q.gate.ch : c)).join('');
  }
  return out;
}

// 城の中へ：入った町の場所を覚える（出口で 町の その場所へ 戻る）
export function enterCastle(game, town, entry) {
  const q = CASTLE_QUESTS[town];
  return { ...game, castleFrom: { map: game.pos.map, x: game.pos.x, y: game.pos.y }, pos: { map: q.hall, ...entry, dir: 'up' }, justEntered: q.hall };
}
export function leaveCastle(game) {
  const f = game.castleFrom;
  return { ...game, castleFrom: null, pos: { map: f.map, x: f.x, y: f.y, dir: 'down' } };
}

// ---- 地図の形 ----
// 大広間（15×13）：N＝襖の壁・上＝上段の間（畳の縁つき）・J＝畳・B＝板の間（縁側）・x＝出口
//   お殿様は 上段の間の まん中・家老と 侍が 両脇
const HALL_ROWS = [
  'NNNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNNN',
  'N上上上上上上上上上上上上上N',
  'N上上上上上上上上上上上上上N',
  'NJJJJJJJJJJJJJN',
  'NJJJJJJJJJJJJJN',
  'NJJJJJJJJJJJJJN',
  'NJJJJJJJJJJJJJN',
  'NJJJJJJJJJJJJJN',
  'NJJJJJJJJJJJJJN',
  'NBBBBBBBBBBBBBN',
  'NBBBBBBBBBBBBBN',
  'NNNNNNNxNNNNNNN',
];
const HALL_ENTRY = { x: 7, y: 11 };

// 城ごとの 大広間の 人（お殿様・家老・侍）。家老は 行き先を、侍は 城の ひと言を
const HALL_PEOPLE = {
  taira: { castle: '磐城平城', karo: '殿の お題を 果たせば、お城の 判子を くださるぞ。', samurai: 'ここは 磐城平城。平藩の お城だ。' },
  nakamura: { castle: '相馬中村城', karo: '殿の お題を 果たせば、お城の 判子を くださるぞ。', samurai: 'ここは 相馬中村城。相馬の 殿さまの お城だ。' },
  nihonmatsu: { castle: '二本松城', karo: '殿の お題を 果たせば、お城の 判子を くださるぞ。', samurai: 'ここは 二本松城。霞ヶ城とも よばれて おる。' },
  shirakawa: { castle: '白河小峰城', karo: '殿の お題を 果たせば、お城の 判子を くださるぞ。', samurai: 'ここは 白河小峰城。みちのくの 入口を 守る 城だ。' },
  aizuwakamatsu: { castle: '鶴ヶ城', karo: '殿の お題を 果たせば、お城の 判子を くださるぞ。', samurai: 'ここは 鶴ヶ城。会津の 殿さまの お城だ。' },
};

// 新しい場所（15×18）：下の x から入り、奥の 怪物の 字へ。地面は 町の字を使い回す（. 草・= 石の道・T 木・R 岩・p 水・Y 雪杉）
const GROUNDS = {
  // 鬼ヶ城山＝山頂の大岩へ登る山道（麓から 稜線まで 約2キロ）
  q_onigajo: {
    name: '鬼ヶ城山', rows: [
      'RRRRRRRRRRRRRRR',
      'RRRRRRR鬼RRRRRRR',
      'RRRRRR...RRRRRR',
      'RRRRR..=..RRRRR',
      'RRRTT..=..TTRRR',
      'RRTTT..=====TRR',
      'RTTTT......=TTR',
      'RTT...TTT..=.TR',
      'RT..=====..=..R',
      'RT..=..TT..=.TR',
      'RTT.=..TT=====R',
      'RTT.=..TT=..TTR',
      'RT..=====...TTR',
      'RT......=....TR',
      'RTTT....=...TTR',
      'RTTTT...=..TTTR',
      'RTTTTT..=.TTTTR',
      'TTTTTTTTxTTTTTT',
    ],
    guide: { x: 6, y: 15, look: 'toshiyori', lines: ['川前の 年寄り「鬼ヶ城山は 標高 887メートル。いわきでは 矢大臣山に つぐ 高い 山じゃ。」', '川前の 年寄り「頂の 大岩に 鬼が すんで おったと、むかしから 伝わって おる。」'] },
  },
  // 臼沼＝鹿島の沼のほとり
  q_usunuma: {
    name: '臼沼', rows: [
      'TTTTTTTTTTTTTTT',
      'TTTppppppppppTT',
      'TTpppppppppppTT',
      'Tpppppp臼ppppppT',
      'Tpppppp.ppppppT',
      'TTppppp.pppppTT',
      'TT.....=.....TT',
      'T......=......T',
      'T..TT..=..TT..T',
      'T..TT..=..TT..T',
      'T......=......T',
      'TT.....=.....TT',
      'T..ww..=..ww..T',
      'T......=......T',
      'TTT....=....TTT',
      'TTTT...=...TTTT',
      'TTTTT..=..TTTTT',
      'TTTTTTTxTTTTTTT',
    ],
    guide: { x: 5, y: 13, look: 'machibito', lines: ['鹿島の 村人「この 沼が 臼沼だ。むかしは 大蛇が すんで おったと いう。」', '鹿島の 村人「大蛇が 回りながら 登った 山を、巡り平と よぶんだそうだ。」'] },
  },
  // 鬼石＝安達太良山の ふもとの 川辺と 街道
  q_oniishi: {
    name: '安達太良山の ふもと', rows: [
      'RRRRRRRRRRRRRRR',
      'RRRYYYY石YYYYRRR',
      'RRYY...=...YYRR',
      'RY.....=.....YR',
      'Rpppppp=ppppppR',
      'Rpppppp=ppppppR',
      'RY.....=.....YR',
      'RYY....=....YYR',
      'R..====.====..R',
      'R..=.......=..R',
      'R..=..YYY..=..R',
      'R..=..YYY..=..R',
      'R..=.......=..R',
      'R..====.====..R',
      'RYY....=....YYR',
      'RYYY...=...YYYR',
      'RYYYY..=..YYYYR',
      'YYYYYYYxYYYYYYY',
    ],
    guide: { x: 5, y: 15, look: 'toshiyori', lines: ['原瀬の 年寄り「才木から 深堀へ ゆく 街道の 端に、鬼石と よばれる 石が あるんじゃ。」', '原瀬の 年寄り「若者の 大三が、鬼を 説いて 山へ 帰したと 伝わって おる。」'] },
  },
  // 剣桂＝新甲子の 遊歩道（奇岩と 滝）
  q_kenkatsura: {
    name: '新甲子の 森', rows: [
      'TTTTTTTTTTTTTTT',
      'TTTTTTT剣TTTTTTT',
      'TTTTTT...TTTTTT',
      'TTTT...=...TTTT',
      'TTR....=....RTT',
      'TT..R..=..R..TT',
      'TT.....=.....TT',
      'TTTppp.=.pppTTT',
      'TTTppp.b.pppTTT',
      'TT.....=.....TT',
      'TTR..=====..RTT',
      'TT...=...=...TT',
      'TTT..=.R.=..TTT',
      'TT...=====...TT',
      'TTR....=....RTT',
      'TTTT...=...TTTT',
      'TTTTT..=..TTTTT',
      'TTTTTTTxTTTTTTT',
    ],
    guide: { x: 5, y: 14, look: 'machibito', lines: ['森の 番人「奥に 立つのが 剣桂。高さ 45メートル、幹の 太さは 9.7メートルも あるんだ。」', '森の 番人「森の 巨人たち 百選にも えらばれて いるよ。」'] },
  },
  // 鏡ヶ沼＝岩に かこまれた 手鏡の 形の 沼（三本槍ヶ岳の 北）
  q_kagaminuma: {
    name: '鏡ヶ沼', rows: [
      'RRRRRRRRRRRRRRR',
      'RRRRpppppppRRRR',
      'RRRpppp鏡ppppRRR',
      'RRppppp.pppppRR',
      'RRppppp.pppppRR',
      'RRRpppp.ppppRRR',
      'RRRRppp.pppRRRR',
      'RRRRR...RRRRRRR',
      'RRRRR.=.RRRRRRR',
      'RRRTT.=.TTRRRRR',
      'RRTT..=..TTRRRR',
      'RRT...=====.TRR',
      'RRT..T....=.TRR',
      'RRT.TT....=..RR',
      'RRT..=====...RR',
      'RRTT.=.....TTRR',
      'RRRT.=....TTRRR',
      'RRRRR=RRRRRRRRR',
    ],
    guide: { x: 8, y: 15, look: 'toshiyori', lines: ['下郷の 狩人「この 先が 鏡ヶ沼。まわり 約500メートル、深さは 17.8メートルも ある。」', '下郷の 狩人「霧が 出たら 気を つけな。むかし 大蔵と いう 狩人が 迷った 沼だ。」'] },
  },
};
// 鏡ヶ沼の 出口は 道の 下の 端（x を 置く）
GROUNDS.q_kagaminuma.rows[17] = 'RRRRRxRRRRRRRRR';

// towns.js の TOWNS に足す形（npcs は 町と同じ書き方・spot は 使わない）
export function castleMaps() {
  const maps = {};
  for (const [town, q] of Object.entries(CASTLE_QUESTS)) {
    const p = HALL_PEOPLE[town];
    maps[q.hall] = {
      name: p.castle, inside: 'castle', castleOf: town, cardPending: true, rows: HALL_ROWS, props: [], entry: HALL_ENTRY,
      npcs: [
        { x: 7, y: 3, look: 'tono', role: 'lord', castleOf: town, lines: [] }, // お殿様の 歩く絵（10/7 本人の Gemini）
        { x: 4, y: 5, look: 'yakunin', role: 'karo', castleOf: town, lines: [`家老「${p.karo}」`] },
        { x: 10, y: 5, look: 'bushi', lines: [`侍「${p.samurai}」`] },
      ],
    };
    const gr = GROUNDS[q.ground];
    const ex = gr.rows.at(-1).indexOf('x');
    maps[q.ground] = {
      name: gr.name, inside: 'quest', castleOf: town, cardPending: true, rows: gr.rows, props: [], entry: { x: ex, y: gr.rows.length - 2 },
      npcs: [{ ...gr.guide, lines: gr.guide.lines }],
    };
  }
  return maps;
}
