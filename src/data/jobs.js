// 職業（本人 10/5「①ゲームは初めから4人で進める ②職業が多数あり、選択をしてからスタートする ③それぞれの職業は必殺技が3つあり、1章から3章までのどこかで、クエストを受けて習得する」）
// 設計書＝vault docs/superpowers/specs/2026-10-05-jobs-design.md（本人「この案で作る」）
// 4人＝主人公（tabi）・しおり（shiori）・仲間2人。4人とも職業を選ぶ（同じ職業は2人に付けない）。仲間2人は その職業の人物＝仲間の id は職業の id
// 技＝はじめからの技（basic）＋章ごとに1つ（skills[0]＝1章・[1]＝2章・[2]＝3章）。章の技は その章の町の師匠の試しに受かると習う
// 強さ＝能力の点 points（本人 10/5「どの職業も総合能力を30に設定し、各能力に振り分ける。力士は力15、体力15、知力0、精神力(魔法力)0など」）
//   力 chikara（攻め）・体力 tairyoku（HP と守り）・知力 chiryoku（術の威力と回復の効き目）・精神力 seishin（術の力＝MP）・素早さ hayasa。どの職業も合計30
//   点から Lv1 の強さと 1つ上がるごとの伸びを POINT_RULE の1つの式で出す（statsOfPoints）。武器の系統＝weapon（equip.js の line）
export const JOB_IDS = ['bushi', 'sou', 'yojutsu', 'ninja', 'rikishi', 'yumi', 'miko', 'onmyo', 'kusushi', 'yamabushi'];

export const POINT_TOTAL = 30;
// 武器の系統の名前（equip.js の line）
export const WEAPON_NAMES = { katana: '刀', ougi: '扇・薙刀', blade: '短剣', yari: '棒・槍', tsue: '杖', bow: '弓' };
export const POINT_NAMES = { chikara: '力', tairyoku: '体力', chiryoku: '知力', seishin: '精神力', hayasa: '素早さ' };
// 点 → 強さ（base＝Lv1・grow＝1つごとの伸び）。値を変えたら ボスの強さ合わせをやり直す
export const POINT_RULE = {
  hp: { base: [40, 2.5, 'tairyoku'], grow: [5, 0.4, 'tairyoku'] },
  def: { base: [3, 0.4, 'tairyoku'], grow: [0.7, 0.06, 'tairyoku'] },
  atk: { base: [5, 0.65, 'chikara'], grow: [1.0, 0.1, 'chikara'] },
  int: { base: [4, 0.65, 'chiryoku'], grow: [0.6, 0.1, 'chiryoku'] },
  mp: { base: [0, 2.2, 'seishin'], grow: [0, 0.38, 'seishin'] },
  agi: { base: [5, 0.6, 'hayasa'], grow: [0.6, 0.07, 'hayasa'] },
};
export function statsOfPoints(points) {
  const base = {};
  const grow = {};
  for (const [k, r] of Object.entries(POINT_RULE)) {
    base[k] = r.base[0] + r.base[1] * (points[r.base[2]] ?? 0);
    grow[k] = r.grow[0] + r.grow[1] * (points[r.grow[2]] ?? 0);
  }
  return { base, grow };
}

export const JOBS = {
  bushi: {
    name: '武士', sex: 'm', role: '斬って削る', weapon: 'katana',
    points: { chikara: 12, tairyoku: 9, chiryoku: 0, seishin: 3, hayasa: 6 },
    passive: { crit: 1 / 8 }, basicText: 'かいしんの いちげきが 出やすい',
    skills: ['iai', 'kabutowari', 'tsubame'],
  },
  sou: {
    name: '僧', sex: 'm', role: '回復', weapon: 'tsue',
    points: { chikara: 3, tairyoku: 6, chiryoku: 8, seishin: 11, hayasa: 2 },
    basic: 'dokkyo', skills: ['shingon', 'fudo', 'sosei'],
  },
  yojutsu: {
    name: '妖術使い', sex: 'f', role: '術で大きく削る', weapon: 'ougi',
    points: { chikara: 2, tairyoku: 4, chiryoku: 13, seishin: 9, hayasa: 2 },
    basic: 'kitsunebi', skills: ['maboroshi', 'ikazuchi', 'oogama'],
  },
  ninja: {
    name: '忍者', sex: 'f', role: '速く 二度打つ', weapon: 'blade',
    points: { chikara: 9, tairyoku: 5, chiryoku: 2, seishin: 4, hayasa: 10 },
    passive: { dual: true, pierce: 0.5 }, basicText: 'たたかう＝短剣の 二連撃（守りの すきまを 突く）',
    skills: ['kemuridama', 'kagenui', 'bunshin'],
  },
  rikishi: {
    name: '力士', sex: 'm', role: '体力で受ける', weapon: 'yari',
    points: { chikara: 15, tairyoku: 15, chiryoku: 0, seishin: 0, hayasa: 0 },
    passive: { atkMult: 1.2 }, basicText: 'たたかう＝つっぱり（強い 一撃）',
    skills: ['shiko', 'kabau', 'uwatenage'],
  },
  yumi: {
    name: '弓矢使い', sex: 'm', role: '遠くから射る', weapon: 'bow',
    points: { chikara: 10, tairyoku: 6, chiryoku: 2, seishin: 4, hayasa: 8 },
    passive: { pierce: 0.5 }, basicText: 'たたかう＝射る（守りの 半分を つらぬく）',
    skills: ['kaburaya', 'hiya', 'mangetsu'],
  },
  miko: {
    name: '巫女', sex: 'f', role: '守り・お祓い', weapon: 'ougi',
    points: { chikara: 2, tairyoku: 6, chiryoku: 8, seishin: 11, hayasa: 3 },
    basic: 'oharai', skills: ['kagura', 'omiki', 'iwato'],
  },
  onmyo: {
    name: '陰陽師', sex: 'm', role: '敵を弱らせる', weapon: 'tsue',
    points: { chikara: 2, tairyoku: 5, chiryoku: 11, seishin: 10, hayasa: 2 },
    basic: 'shikigami', skills: ['jufu', 'kekkai', 'taizan'],
  },
  kusushi: {
    name: '薬師', sex: 'f', role: '道具と回復', weapon: 'tsue',
    points: { chikara: 4, tairyoku: 7, chiryoku: 7, seishin: 8, hayasa: 4 },
    passive: { itemMult: 1.5 }, basicText: '調合＝道具の 効き目が 1.5倍',
    skills: ['gedoku', 'fukiya', 'hiyaku'],
  },
  yamabushi: {
    name: '山伏', sex: 'm', role: '力と術の両方', weapon: 'tsue',
    points: { chikara: 8, tairyoku: 8, chiryoku: 5, seishin: 6, hayasa: 3 },
    basic: 'shakujo_uchi', skills: ['horagai', 'kuji', 'hiwatari'],
  },
};

// 職業の技（rules.js の kind で効き目が決まる）。cost＝術の力。sfx＝音（chip.js）
// strike＝殴る技（mult 攻撃力の倍率・defMult 守りの効き方・hits 回数・clearMist 払うもや・crit 必ずかいしん・stun 気絶・noMist もやの間は出せない）
// magic＝術の一撃（守り無視・もやで半分）／heal（全員・frac＝最大HPの割合）／healOne（1人）／revive（倒れた仲間を起こす）／cleanse（悪い印を治す）
// buff（全員の攻めを mult 倍・turns）／guard（受ける傷を mult 倍）／cover（仲間への攻撃を受ける）／debuff（敵の攻め mult 倍）／seal（敵の必殺技を1回 封じる）
// poison（毎ターン 敵の最大HPの frac）／evade（そのターンの敵の攻撃を全員かわす）／mistall（もやを全部払う）／daze・bind（前からの仕組み）
// once＝1回の戦いに1度だけ（術の力を使わない力士の技・精神力0のため）
// big＝大きな技（語って弱点を明かす前の昔話の主には2割しか効かない＝語ってから術の決まりを残す）
// ⭐3章の奥義は 職業ごとに別の仕組み（本人 10/5「得意技の3つめは、各職業別のものに」）：counter 斬りかえし（武士）・summon 呼んだ獣が毎ターン攻める（妖術使い）・decoy 分身が攻撃を受ける（忍者）
//   hpstrike 体力で投げる（力士）・charge 引きしぼって次の番に放つ（弓矢使い）・lifeguard 一度だけ踏みとどまる（陰陽師）・medAll 薬が全員に効く（薬師）・mpall 術の力を分ける（山伏）／僧＝起こす（revive）・巫女＝全快＋もや晴らし
export const JOB_SPELLS = {
  // ---- はじめからの技 ----
  dokkyo: { name: '読経', kind: 'heal', cost: 6, frac: 0.22, sfx: 'kyo', verb: '経を 読みはじめた', text: '静かな 読経が ひびき、みなの 傷が ふさがっていく。' },
  kitsunebi: { name: '狐火の術', kind: 'magic', cost: 6, mult: 1.2, sfx: 'kitsunebi', verb: '印を 結んだ', text: '青白い 狐火が 燃えあがり、敵を つつみこむ！' },
  oharai: { name: 'お祓い', kind: 'cleanse', cost: 4, frac: 0.08, sfx: 'kane', verb: '大麻（おおぬさ）を 振った', text: 'さらさらと 清めの 音が ひびき、悪い 気が 晴れていく。' },
  shikigami: { name: '式神', kind: 'magic', cost: 4, mult: 0.9, sfx: 'shikigami', verb: '紙の 式神を 放った', text: '白い 紙の 鳥が 舞い、敵を 打った！' },
  shakujo_uchi: { name: '錫杖打ち', kind: 'strike', cost: 0, mult: 1.0, defMult: 0.5, sfx: 'shakujo', verb: '錫杖を 振りおろした', text: 'しゃん！ 錫杖の 輪が 鳴った！' },
  // ---- 武士 ----
  iai: { name: '居合い斬り', kind: 'strike', cost: 10, mult: 1.6, defMult: 0, noMist: true, big: true, sfx: 'iai', verb: '刀の 柄に 手を かけた', text: '一閃！ 抜いた 刀が 光の 筋を えがく！' },
  kabutowari: { name: '兜割り', kind: 'strike', cost: 12, mult: 1.5, defMult: 0.5, clearMist: 2, big: true, sfx: 'kabutowari', verb: '刀を 大きく ふりかぶった', text: '兜ごと 割る 一撃が、もやを 切りさく！' },
  tsubame: { name: '燕返し', kind: 'counter', cost: 14, mult: 1.5, turns: 2, big: true, sfx: 'tsubame', verb: '刀を 低く 構えた', text: '燕返しの 構え！ 仲間を 打った 敵に、返す 刀で 斬りかえす。' },
  // ---- 僧 ----
  shingon: { name: '真言', kind: 'daze', cost: 4, turns: 3, sfx: 'shingon', verb: '真言を となえた', text: '薬師さまの 真言に、まばゆい 光が 立ちのぼった！', hitText: 'は 光に 目が くらんだ！ しばらく 攻撃が 当たりにくい。', missText: 'は まばゆい 光に 目が くらみ、攻撃が それた！' },
  fudo: { name: '不動の結界', kind: 'guard', cost: 10, mult: 0.5, turns: 3, sfx: 'fudo', verb: '不動明王の 印を 結んだ', text: '炎の 光輪が みなを つつむ！ しばらく 受ける 傷が 半分に なる。' },
  sosei: { name: '蘇生の経', kind: 'revive', cost: 18, frac: 0.5, sfx: 'sosei', verb: '一心に 経を となえた', text: '倒れた 仲間の 胸に、ふたたび 灯が ともった！' },
  // ---- 妖術使い ----
  maboroshi: { name: '幻の術', kind: 'daze', cost: 6, turns: 2, autoHurt: 0.5, sfx: 'maboroshi', verb: '印を 結び、すうっと 姿を ゆらがせた', text: '姿が いくつにも 分かれて 見える！', hitText: 'は 幻を 追いはじめた！', missText: 'は 幻を 斬りつけた！ 攻撃が それた！' },
  ikazuchi: { name: '雷の術', kind: 'magic', cost: 12, mult: 1.9, big: true, sfx: 'ikazuchi', verb: '天を 指さした', text: '雲が 裂け、稲妻が 落ちた！' },
  oogama: { name: '大蝦蟇の術', kind: 'summon', cost: 18, mult: 1.0, turns: 3, big: true, beast: '大蝦蟇', sfx: 'oogama', verb: '巻物を くわえて 印を 結んだ', text: '煙の 中から 大蝦蟇が あらわれた！ しばらく 共に 戦う。' },
  // ---- 忍者 ----
  kemuridama: { name: '煙玉', kind: 'evade', cost: 5, sfx: 'kemuri', verb: '煙玉を 投げた', text: 'もうもうと 煙が たちこめ、みなの 姿が 消えた！' },
  kagenui: { name: '影縫い', kind: 'bind', cost: 6, chance: 0.75, sfx: 'kagenui', verb: '苦無を 敵の 影に 投げた', text: '苦無が 影を 地面に 縫いとめる！', hitText: 'は 影を 縫われて 動けない！', missText: 'は 影を ひきはがした！', stuckText: 'は 影を 縫われて 動けない！' },
  bunshin: { name: '分身の術', kind: 'decoy', cost: 12, count: 2, sfx: 'bunshin', verb: '印を 結んで 三つに 分かれた', text: '分身が 二人 あらわれた！ 敵の 攻撃を 分身が 受ける。' },
  // ---- 力士 ----
  shiko: { name: '四股踏み', kind: 'mistall', cost: 0, once: true, sfx: 'shiko', verb: '大きく 四股を 踏んだ', text: 'どすん！ 大地が ゆれて、黒い もやが 吹きとんだ！' },
  kabau: { name: 'かばう', kind: 'cover', cost: 0, once: true, turns: 3, sfx: 'kabau', verb: 'みなの 前に 立ちはだかった', text: 'しばらく、仲間への 攻撃を 体で 受けとめる！' },
  uwatenage: { name: '上手投げ', kind: 'hpstrike', cost: 0, once: true, mult: 0.55, stun: 1, noMist: true, big: true, sfx: 'nage', verb: 'がっぷり 四つに 組んだ', text: '上手投げ！ 鍛えた 体ごと、敵を 地面に たたきつけた！' },
  // ---- 弓矢使い ----
  kaburaya: { name: '鏑矢', kind: 'strike', cost: 5, mult: 0.6, defMult: 0.5, clearMist: 2, sfx: 'kaburaya', verb: '鏑矢を 放った', text: 'ひょおお……！ 鳴りひびく 矢が、もやを 散らした！' },
  hiya: { name: '火矢', kind: 'strike', cost: 12, mult: 1.8, defMult: 0.3, noMist: true, big: true, sfx: 'kaen', verb: '矢に 火を つけた', text: '燃える 矢が 敵を つらぬいた！' },
  mangetsu: { name: '満月の一矢', kind: 'charge', cost: 14, mult: 3.6, big: true, sfx: 'hachiya', verb: '弓を 満月のように 引きしぼった', text: 'じっと 狙いを さだめる……（次の 番に 放つ）', shotText: '満月の 一矢が、敵の 急所を つらぬいた！' },
  // ---- 巫女 ----
  kagura: { name: '神楽舞', kind: 'buff', cost: 8, mult: 1.3, turns: 3, sfx: 'kagura', verb: '鈴を 鳴らして 舞いはじめた', text: '神楽の 鈴が 鳴り、みなの 体に 力が みなぎる！' },
  omiki: { name: '御神酒', kind: 'heal', cost: 12, frac: 0.45, sfx: 'omiki', verb: '御神酒を ささげた', text: '清らかな 御神酒の 香りに、みなの 傷が いえていく。' },
  iwato: { name: '天岩戸の舞', kind: 'heal', cost: 22, frac: 1, clearMist: 99, sfx: 'iwato', verb: '天岩戸の 前で 舞うように 舞った', text: '光が さしこみ、もやが 晴れ、みなの 傷が すっかり いえた！' },
  // ---- 陰陽師 ----
  jufu: { name: '呪符', kind: 'debuff', cost: 6, mult: 0.7, turns: 3, sfx: 'jufu', verb: '呪符を 投げつけた', text: '呪符が 敵に はりつき、力を 吸いとる！' },
  kekkai: { name: '結界の符', kind: 'seal', cost: 10, sfx: 'kekkai', verb: '四方に 符を 投げた', text: '光の 結界が はられた！ 次の 必殺技を 一度 封じる。' },
  taizan: { name: '泰山府君の祭', kind: 'lifeguard', cost: 18, sfx: 'taizan', verb: '泰山府君を まつった', text: '命を つかさどる 神が こたえた！ この戦いの間、みな 一度だけ 倒れずに 踏みとどまる。' },
  // ---- 薬師 ----
  gedoku: { name: '解毒の丸薬', kind: 'cleanse', cost: 6, frac: 0.15, sfx: 'gedoku', verb: '丸薬を くばった', text: 'にがい 丸薬が、体の 悪い ものを 追いだす。' },
  fukiya: { name: '毒の吹き矢', kind: 'poison', cost: 8, frac: 0.035, turns: 5, sfx: 'fukiya', verb: '吹き矢を 構えた', text: 'ふっ！ 毒の 矢が 刺さった！ しばらく 毒が 敵を むしばむ。' },
  hiyaku: { name: '秘薬', kind: 'medAll', cost: 10, sfx: 'hiyaku', verb: '秘伝の 調合を はじめた', text: '秘伝の 調合！ この戦いの間、薬が 全員に 効く。' },
  // ---- 山伏 ----
  horagai: { name: '法螺貝', kind: 'buff', cost: 8, mult: 1.25, agi: 4, turns: 3, sfx: 'horagai', verb: '法螺貝を 吹いた', text: 'ぶおおお……！ 山に ひびく 音に、みなの 足が 軽くなる！' },
  kuji: { name: '九字を切る', kind: 'magic', cost: 12, mult: 1.6, clearMist: 1, big: true, sfx: 'kuji', verb: '「臨・兵・闘・者……」と 九字を 切った', text: '格子の 光が 敵を 打ち、もやを 切りさく！' },
  hiwatari: { name: '火渡り', kind: 'mpall', cost: 0, once: true, frac: 0.5, sfx: 'hiwatari', verb: '燃える 炭の 上を 渡った', text: '炎を 渡った 験力が、みなの 術の力を よみがえらせる！' },
};

// 章ごとのクエスト（本人「章ごとに1つ」）。town＝師匠の立つ町・form＝試しの形（duel 一騎打ち／mondo 問答／kagura 神楽／mato 的当て／kagewatari 影渡り）
// 段階①（10/5）＝1章だけ。2章・3章は段階②③で足す
export const QUESTS = {
  1: {
    bushi: { town: 'nakamura', master: '道場の師範', form: 'duel' },
    rikishi: { town: 'nakamura', master: '相撲の親方', form: 'duel' },
    yumi: { town: 'nakamura', master: '弓の師匠', form: 'mato' },
    miko: { town: 'nakamura', master: '神社の 巫女頭', form: 'kagura' },
    onmyo: { town: 'nakamura', master: '老いた 陰陽師', form: 'mondo' },
    sou: { town: 'odaka', master: '寺の 和尚', form: 'mondo' },
    yojutsu: { town: 'odaka', master: '山の 妖術使い', form: 'duel' },
    ninja: { town: 'odaka', master: '忍びの 師匠', form: 'duel' },
    kusushi: { town: 'odaka', master: '薬屋の 主', form: 'mondo' },
    yamabushi: { town: 'odaka', master: '羽黒の 山伏', form: 'duel' },
  },
};

// その人の職業（主人公・しおりは game.jobs に・仲間は id が職業）
export const jobOf = (game, id) => (id === 'tabi' || id === 'shiori' ? game?.jobs?.[id] : JOBS[id] ? id : null);
// その人が 使える技（はじめからの技＋習った技）
export function jobSpellsOf(game, id) {
  const j = JOBS[jobOf(game, id)];
  if (!j) return [];
  return [...(j.basic ? [j.basic] : []), ...(game?.skills?.[id] ?? []).filter((s) => j.skills.includes(s))];
}
// その章の技を 4人とも習ったか（章の出口・本人「4人とも習うまで通さない」）
export function chapterSkillsDone(game, ch) {
  return (game?.members ?? []).every((id) => {
    const j = JOBS[jobOf(game, id)];
    return j && (game.skills?.[id] ?? []).includes(j.skills[ch - 1]);
  });
}

// ---- 職業を選ぶ画面（src/scenes/JobScene.js）の計算（10/5・Artifact の部品の数を増やさないよう ここに置く）----
// 選んだ4つ（null は まだ）→ newGame に渡す形
export function pickOf(slots) {
  return { tabi: slots[0], shiori: slots[1], mates: [slots[2], slots[3]] };
}
// 職業を押したとき：いまの枠に入れる（ほかの枠に同じ職業があれば そちらは空ける）→ 次の空いた枠
export function choose(slots, active, job) {
  const next = slots.map((j, i) => (i !== active && j === job ? null : j));
  next[active] = job;
  const empty = next.findIndex((j) => !j);
  return { slots: next, active: empty >= 0 ? empty : active };
}

