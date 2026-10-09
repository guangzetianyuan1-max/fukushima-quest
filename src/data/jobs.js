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
export const WEAPON_NAMES = { katana: '刀', tsue: '杖', ougi: '扇', blade: '短剣', bou: '素手・手甲', bow: '弓', naginata: '幣・薙刀', shaku: '笏・剣', hari: '針・杖', shakujo: '錫杖' }; // 10/5 武器と防具は職業ごと
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
    skills: ['iai', 'kabutowari', 'tsubame', 'ittou'],
  },
  sou: {
    name: '僧', sex: 'm', role: '回復', weapon: 'tsue',
    points: { chikara: 3, tairyoku: 6, chiryoku: 8, seishin: 11, hayasa: 2 },
    basic: 'dokkyo', skills: ['shingon', 'fudo', 'sosei', 'tendoku'],
  },
  yojutsu: {
    name: '妖術使い', sex: 'f', role: '術で大きく削る', weapon: 'ougi',
    points: { chikara: 2, tairyoku: 4, chiryoku: 13, seishin: 9, hayasa: 2 },
    basic: 'kitsunebi', skills: ['maboroshi', 'ikazuchi', 'oogama', 'yomeiri'],
  },
  ninja: {
    name: '忍者', sex: 'f', role: '速く 二度打つ', weapon: 'blade',
    points: { chikara: 9, tairyoku: 5, chiryoku: 2, seishin: 4, hayasa: 10 },
    passive: { dual: true, pierce: 0.5 }, basicText: 'たたかう＝短剣の 二連撃（守りの すきまを 突く）',
    skills: ['kemuridama', 'kagenui', 'bunshin', 'kakuremino'],
  },
  rikishi: {
    name: '力士', sex: 'm', role: '体力で受ける', weapon: 'bou',
    points: { chikara: 15, tairyoku: 15, chiryoku: 0, seishin: 0, hayasa: 0 },
    passive: { atkMult: 1.2 }, basicText: 'たたかう＝つっぱり（強い 一撃）',
    skills: ['shiko', 'kabau', 'uwatenage', 'dohyoiri'],
  },
  yumi: {
    name: '弓矢使い', sex: 'm', role: '遠くから射る', weapon: 'bow',
    points: { chikara: 10, tairyoku: 6, chiryoku: 2, seishin: 4, hayasa: 8 },
    passive: { pierce: 0.5 }, basicText: 'たたかう＝射る（守りの 半分を つらぬく）',
    skills: ['kaburaya', 'hiya', 'mangetsu', 'yabusame'],
  },
  miko: {
    name: '巫女', sex: 'f', role: '守り・お祓い', weapon: 'naginata',
    points: { chikara: 2, tairyoku: 6, chiryoku: 8, seishin: 11, hayasa: 3 },
    basic: 'oharai', skills: ['kagura', 'omiki', 'iwato', 'higanjishi'],
  },
  onmyo: {
    name: '陰陽師', sex: 'm', role: '敵を弱らせる', weapon: 'shaku',
    points: { chikara: 2, tairyoku: 5, chiryoku: 11, seishin: 10, hayasa: 2 },
    basic: 'shikigami', skills: ['jufu', 'kekkai', 'taizan', 'henbai'],
  },
  kusushi: {
    name: '薬師', sex: 'f', role: '道具と回復', weapon: 'hari',
    points: { chikara: 4, tairyoku: 7, chiryoku: 7, seishin: 8, hayasa: 4 },
    passive: { itemMult: 1.5 }, basicText: '調合＝道具の 効き目が 1.5倍',
    skills: ['gedoku', 'fukiya', 'hiyaku', 'ninjin'],
  },
  yamabushi: {
    name: '山伏', sex: 'm', role: '力と術の両方', weapon: 'shakujo',
    points: { chikara: 8, tairyoku: 8, chiryoku: 5, seishin: 6, hayasa: 3 },
    passive: { atkMult: 1.15 }, basicText: 'たたかう＝験力の 錫杖（強い 一撃）', // 10/8 夜 職業の 強さの 見張りで いちばん 弱かった（持ち味が 無かった）
    basic: 'shakujo_uchi', skills: ['horagai', 'kuji', 'hiwatari', 'yudono'],
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
  dokkyo: { name: '読経', desc: '全員のHPを回復（知力で増える）', kind: 'heal', cost: 6, frac: 0.22, sfx: 'kyo', verb: '経を 読みはじめた', text: '静かな 読経が ひびき、みなの 傷が ふさがっていく。' },
  kitsunebi: { name: '狐火の術', desc: '守りを無視する 術の攻撃', kind: 'magic', cost: 6, mult: 1.2, sfx: 'kitsunebi', verb: '印を 結んだ', text: '青白い 狐火が 燃えあがり、敵を つつみこむ！' },
  oharai: { name: 'お祓い', desc: '呪い・憑依・目くらましを解き 少し回復', kind: 'cleanse', cost: 4, frac: 0.08, sfx: 'kane', verb: '大麻（おおぬさ）を 振った', text: 'さらさらと 清めの 音が ひびき、悪い 気が 晴れていく。' },
  shikigami: { name: '式神', desc: '守りを無視する 小さな術の攻撃', kind: 'magic', cost: 4, mult: 0.9, sfx: 'shikigami', verb: '紙の 式神を 放った', text: '白い 紙の 鳥が 舞い、敵を 打った！' },
  shakujo_uchi: { name: '錫杖打ち', desc: '術の力を使わず 守り半分を突く', kind: 'strike', cost: 0, mult: 1.0, defMult: 0.5, sfx: 'shakujo', verb: '錫杖を 振りおろした', text: 'しゃん！ 錫杖の 輪が 鳴った！' },
  // ---- 武士 ----
  iai: { name: '居合い斬り', desc: '守りを無視する一太刀（もやの間は不可）', kind: 'strike', cost: 10, mult: 1.6, defMult: 0, noMist: true, big: true, sfx: 'iai', verb: '刀の 柄に 手を かけた', text: '一閃！ 抜いた 刀が 光の 筋を えがく！' },
  kabutowari: { name: '兜割り', desc: '守り半分で斬り もやを2つ払う', kind: 'strike', cost: 12, mult: 1.5, defMult: 0.5, clearMist: 2, big: true, sfx: 'kabutowari', verb: '刀を 大きく ふりかぶった', text: '兜ごと 割る 一撃が、もやを 切りさく！' },
  tsubame: { name: '燕返し', desc: '2ターン構え 仲間を打った敵に反撃', kind: 'counter', cost: 14, mult: 1.5, turns: 2, big: true, sfx: 'tsubame', verb: '刀を 低く 構えた', text: '燕返しの 構え！ 仲間を 打った 敵に、返す 刀で 斬りかえす。' },
  // ---- 僧 ----
  shingon: { name: '真言', desc: '2ターン 敵の攻撃が半分それる', kind: 'daze', cost: 4, turns: 2, sfx: 'shingon', verb: '真言を となえた', text: '薬師さまの 真言に、まばゆい 光が 立ちのぼった！', hitText: 'は 光に 目が くらんだ！ しばらく 攻撃が 当たりにくい。', missText: 'は まばゆい 光に 目が くらみ、攻撃が それた！' },
  fudo: { name: '不動の結界', desc: '3ターン 受ける傷が半分', kind: 'guard', cost: 10, mult: 0.5, turns: 3, sfx: 'fudo', verb: '不動明王の 印を 結んだ', text: '炎の 光輪が みなを つつむ！ しばらく 受ける 傷が 半分に なる。' },
  sosei: { name: '蘇生の経', desc: '倒れた仲間1人を HP半分で起こす', kind: 'revive', cost: 18, frac: 0.5, sfx: 'sosei', verb: '一心に 経を となえた', text: '倒れた 仲間の 胸に、ふたたび 灯が ともった！' },
  // ---- 妖術使い ----
  maboroshi: { name: '幻の術', desc: '2ターン 敵の攻撃が半分それる', kind: 'daze', cost: 6, turns: 2, autoHurt: 0.5, sfx: 'maboroshi', verb: '印を 結び、すうっと 姿を ゆらがせた', text: '姿が いくつにも 分かれて 見える！', hitText: 'は 幻を 追いはじめた！', missText: 'は 幻を 斬りつけた！ 攻撃が それた！' },
  ikazuchi: { name: '雷の術', desc: '知力で放つ 大きな術の一撃', kind: 'magic', cost: 12, mult: 1.9, big: true, sfx: 'ikazuchi', verb: '天を 指さした', text: '雲が 裂け、稲妻が 落ちた！' },
  // ⭐10/10 本人「2」＝技の 名を 大蝦蟇→大がま（Gemini が「蟇」を 2回 まちがえた・毛筆の 絵の ため）
  oogama: { name: '大がまの術', desc: '大がまを呼ぶ・3ターン 毎ターン攻撃', kind: 'summon', cost: 18, mult: 1.0, turns: 3, big: true, beast: '大がま', sfx: 'oogama', verb: '巻物を くわえて 印を 結んだ', text: '煙の 中から 大がまが あらわれた！ しばらく 共に 戦う。' },
  // ---- 忍者 ----
  kemuridama: { name: '煙玉', desc: 'そのターン 敵の攻撃を全員かわす', kind: 'evade', cost: 5, sfx: 'kemuri', verb: '煙玉を 投げた', text: 'もうもうと 煙が たちこめ、みなの 姿が 消えた！' },
  kagenui: { name: '影縫い', desc: '敵を1回 動けなくする（4回に3回）', kind: 'bind', cost: 6, chance: 0.75, sfx: 'kagenui', verb: '苦無を 敵の 影に 投げた', text: '苦無が 影を 地面に 縫いとめる！', hitText: 'は 影を 縫われて 動けない！', missText: 'は 影を ひきはがした！', stuckText: 'は 影を 縫われて 動けない！' },
  bunshin: { name: '分身の術', desc: '分身2人が 1人への攻撃を受ける', kind: 'decoy', cost: 12, count: 2, sfx: 'bunshin', verb: '印を 結んで 三つに 分かれた', text: '分身が 二人 あらわれた！ 敵の 攻撃を 分身が 受ける。' },
  // ---- 力士 ----
  shiko: { name: '四股踏み', desc: 'もやを全部払う（1戦1回）', kind: 'mistall', cost: 0, once: true, sfx: 'shiko', verb: '大きく 四股を 踏んだ', text: 'どすん！ 大地が ゆれて、黒い もやが 吹きとんだ！' },
  kabau: { name: 'かばう', desc: '3ターン 仲間への攻撃を受ける（1戦1回）', kind: 'cover', cost: 0, once: true, turns: 3, sfx: 'kabau', verb: 'みなの 前に 立ちはだかった', text: 'しばらく、仲間への 攻撃を 体で 受けとめる！' },
  uwatenage: { name: '上手投げ', desc: '最大HPで投げ 目をまわす（1戦1回）', kind: 'hpstrike', cost: 0, once: true, mult: 0.55, stun: 1, noMist: true, big: true, sfx: 'nage', verb: 'がっぷり 四つに 組んだ', text: '上手投げ！ 鍛えた 体ごと、敵を 地面に たたきつけた！' },
  // ---- 弓矢使い ----
  kaburaya: { name: '鏑矢', desc: 'もやを2つ払い 敵が1ターン ひるむ 音の矢', kind: 'strike', cost: 5, mult: 0.6, defMult: 0.5, clearMist: 2, addDaze: 1, missText: 'は 鏑矢の 音に ひるんだ！ 攻撃が それた！', sfx: 'kaburaya', verb: '鏑矢を 放った', text: 'ひょおお……！ 鳴りひびく 矢が、もやを 散らした！' },
  hiya: { name: '火矢', desc: '守りを ほぼ貫く 大きな一撃', kind: 'strike', cost: 12, mult: 1.8, defMult: 0.3, noMist: true, big: true, sfx: 'kaen', verb: '矢に 火を つけた', text: '燃える 矢が 敵を つらぬいた！' },
  mangetsu: { name: '満月の一矢', desc: '引きしぼり 次の番に 大きな一矢', kind: 'charge', cost: 14, mult: 3.6, big: true, sfx: 'hachiya', verb: '弓を 満月のように 引きしぼった', text: 'じっと 狙いを さだめる……（次の 番に 放つ）', shotText: '満月の 一矢が、敵の 急所を つらぬいた！' },
  // ---- 巫女 ----
  kagura: { name: '神楽舞', desc: '3ターン 全員の攻めが1.3倍', kind: 'buff', cost: 8, mult: 1.3, turns: 3, sfx: 'kagura', verb: '鈴を 鳴らして 舞いはじめた', text: '神楽の 鈴が 鳴り、みなの 体に 力が みなぎる！' },
  omiki: { name: '御神酒', desc: '全員のHPを 大きく回復', kind: 'heal', cost: 12, frac: 0.45, sfx: 'omiki', verb: '御神酒を ささげた', text: '清らかな 御神酒の 香りに、みなの 傷が いえていく。' },
  iwato: { name: '天岩戸の舞', desc: '全員 全快＋もやを全部晴らす', kind: 'heal', cost: 22, frac: 1, clearMist: 99, sfx: 'iwato', verb: '天岩戸の 前で 舞うように 舞った', text: '光が さしこみ、もやが 晴れ、みなの 傷が すっかり いえた！' },
  // ---- 陰陽師 ----
  jufu: { name: '呪符', desc: '3ターン 敵の攻めが0.7倍', kind: 'debuff', cost: 6, mult: 0.7, turns: 3, sfx: 'jufu', verb: '呪符を 投げつけた', text: '呪符が 敵に はりつき、力を 吸いとる！' },
  kekkai: { name: '結界の符', desc: '敵の次の必殺技を 1回封じる', kind: 'seal', cost: 10, sfx: 'kekkai', verb: '四方に 符を 投げた', text: '光の 結界が はられた！ 次の 必殺技を 一度 封じる。' },
  taizan: { name: '泰山府君の祭', desc: 'この戦い 全員が1度だけ 踏みとどまる', kind: 'lifeguard', cost: 18, sfx: 'taizan', verb: '泰山府君を まつった', text: '命を つかさどる 神が こたえた！ この戦いの間、みな 一度だけ 倒れずに 踏みとどまる。' },
  // ---- 薬師 ----
  gedoku: { name: '解毒の丸薬', desc: '悪い印を全部治し 少し回復', kind: 'cleanse', cost: 6, frac: 0.15, sfx: 'gedoku', verb: '丸薬を くばった', text: 'にがい 丸薬が、体の 悪い ものを 追いだす。' },
  fukiya: { name: '毒の吹き矢', desc: '5ターン 敵に毎ターン毒の傷', kind: 'poison', cost: 8, frac: 0.035, turns: 5, sfx: 'fukiya', verb: '吹き矢を 構えた', text: 'ふっ！ 毒の 矢が 刺さった！ しばらく 毒が 敵を むしばむ。' },
  hiyaku: { name: '秘薬', desc: 'この戦い 薬が全員に効く', kind: 'medAll', cost: 10, sfx: 'hiyaku', verb: '秘伝の 調合を はじめた', text: '秘伝の 調合！ この戦いの間、薬が 全員に 効く。' },
  // ---- 山伏 ----
  horagai: { name: '法螺貝', desc: '3ターン 攻め1.35倍・素早さも上がる', kind: 'buff', cost: 8, mult: 1.35, agi: 4, turns: 3, sfx: 'horagai', verb: '法螺貝を 吹いた', text: 'ぶおおお……！ 山に ひびく 音に、みなの 足が 軽くなる！' }, // 10/8 夜 1.25→1.35（回復の おまけは 術の 組を 弱めた＝付けない）
  kuji: { name: '九字を切る', desc: '術の一撃・もや払い・2ターン傷3割減', kind: 'magic', cost: 12, mult: 1.9, clearMist: 1, addGuard: { mult: 0.7, turns: 2 }, big: true, sfx: 'kuji', verb: '「臨・兵・闘・者……」と 九字を 切った', text: '格子の 光が 敵を 打ち、もやを 切りさく！' },
  hiwatari: { name: '火渡り', desc: '全員の術の力を半分戻す（1戦1回）', kind: 'mpall', cost: 0, once: true, frac: 0.5, sfx: 'hiwatari', verb: '燃える 炭の 上を 渡った', text: '炎を 渡った 験力が、みなの 術の力を よみがえらせる！' },
  // ---- 4章の技（10/6 本人「会津にも温泉クエスト」→案を「この案で進める」）＝会津の温泉地の師匠に習う。仕組みは今の型＋付け足しの効き目（add*）----
  ittou: { name: '一刀両断', desc: '守りを無視して2回斬る（1戦1回）', kind: 'strike', cost: 14, mult: 1.3, defMult: 0, hits: 2, once: true, big: true, sfx: 'kabutowari', verb: '刀を 上段に かまえた', text: '一刀両断！ 二の太刀まで 一息に 振りおろす！' },
  tendoku: { name: '大般若の転読', desc: '全員を回復し 悪い印も全部治す', kind: 'heal', cost: 14, frac: 0.4, addCleanse: true, sfx: 'sosei', verb: '経典を 扇のように ひろげた', text: '大般若経の 転読！ 経の 風が みなの 傷と 悪い 印を はらう。' },
  yomeiri: { name: '狐の嫁入り', desc: '術の大きな一撃＋2ターン 敵の攻撃がそれる', kind: 'magic', cost: 16, mult: 2.0, big: true, addDaze: 2, missText: 'は 狐の 行列に まどわされ、攻撃が それた！', sfx: 'ikazuchi', verb: '日の照る 空に 雨を 呼んだ', text: '天気雨の 中を、狐火の 行列が 敵を つつむ！' },
  kakuremino: { name: '隠れ蓑', desc: '2ターン 敵の攻撃を全員かわす（1戦1回）', kind: 'evade', cost: 0, once: true, evadeTurns: 2, sfx: 'kemuri', verb: '隠れ蓑を ひろげた', text: 'みなの 姿が すっと 消えた！ しばらく 攻撃が 当たらない。' },
  dohyoiri: { name: '横綱の土俵入り', desc: '3ターン 全員の攻めと守りが上がる（1戦1回）', kind: 'buff', cost: 0, once: true, mult: 1.3, turns: 3, addGuard: { mult: 0.7, turns: 3 }, sfx: 'shiko', verb: '堂々と 土俵入りを はじめた', text: 'よいしょー！ 横綱の 四股に、みなの 体に 力と 守りが みなぎる！' },
  yabusame: { name: '流鏑馬', desc: '3本の矢で 続けて射る', kind: 'strike', cost: 12, mult: 0.8, defMult: 0.5, hits: 3, big: true, sfx: 'kaburaya', verb: '馬を 走らせながら 弓を 引いた', text: '一の 的、二の 的、三の 的！ 矢が 続けて 突きささる！' },
  higanjishi: { name: '彼岸獅子の舞', desc: '3ターン 全員の攻めが1.5倍', kind: 'buff', cost: 14, mult: 1.5, turns: 3, sfx: 'kagura', verb: '獅子頭を かぶって 舞いはじめた', text: '笛と 太鼓に 獅子が 舞う！ みなの 体に 春の 力が みなぎる！' },
  henbai: { name: '反閇', desc: '敵の必殺技を封じ 3ターン攻めを弱める', kind: 'seal', cost: 12, addWeak: { mult: 0.7, turns: 3 }, sfx: 'kekkai', verb: '北斗の 形に 足を 踏んだ', text: '反閇の 歩みが 地を 鎮め、敵の 力を おさえこむ！' },
  ninjin: { name: '会津の薬用人参', desc: '倒れた仲間を全員起こす（1戦1回）', kind: 'revive', cost: 10, once: true, all: true, frac: 0.5, sfx: 'sosei', verb: '会津の 薬用人参を 煎じた', text: '人参の 力が、倒れた 仲間の 体に しみわたる！' },
  yudono: { name: '湯殿の行', desc: '全員のHPと術を戻す（1戦1回）', kind: 'heal', cost: 0, once: true, frac: 0.35, addMp: 0.25, sfx: 'hiwatari', verb: '湯の 滝に 打たれた', text: '湯殿の 行で 清めた 験力が、みなを 満たす！' }, // 10/8 夜 HPの 戻りを 25→35%（1戦1回と 術の力の 戻りは 前の まま＝外すと 術の 組が 弱った）
};

// 技の 強さの 段（10/8 本人「強い必殺技ほど派手に」）＝はじめの技・1章の技＝1／2章＝2／3章の 奥義＝3／4章（会津）の 技＝4
// 戦いの 演出（src/battle/jobfx.js・BattleScene.playJobFx）と 重ねる 音（chip.js の waza1〜4）が 段で 増える。効き目は 変えない
for (const j of Object.values(JOBS)) {
  if (j.basic) JOB_SPELLS[j.basic].tier = Math.max(JOB_SPELLS[j.basic].tier ?? 0, 1);
  j.skills.forEach((id, i) => { JOB_SPELLS[id].tier = Math.max(JOB_SPELLS[id].tier ?? 0, i + 1); });
}

// 章ごとのクエスト（本人「章ごとに1つ」）。town＝師匠の立つ町・form＝試しの形（duel 一騎打ち／mondo 問答／kagura 神楽／mato 的当て／kagewatari 影渡り）
// 段階①（10/5）＝1章・段階②（10/5 夜）＝2章・段階③（10/5 夜）＝3章。2章・3章の師匠は 温泉地（本人 10/5 夜「各温泉地に、必殺技クエストを散らして」）
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
  // 段階②（10/5 夜 本人「おｋ」）＝2章 県北：福島に5人・二本松に5人。忍者は 黒脛巾組の 影渡り
  2: {
    ninja: { town: 'dake', master: '仲居', form: 'kagewatari' },
    yamabushi: { town: 'takayu', master: '湯治の 山伏', form: 'duel' },
    yojutsu: { town: 'tsuchiyu', master: '旅の 奇術師', form: 'duel' },
    kusushi: { town: 'tsuchiyu', master: '湯守', form: 'mondo' },
    onmyo: { town: 'iizaka', master: '番頭', form: 'mondo' },
    bushi: { town: 'iizaka', master: '湯治の 剣客', form: 'duel' },
    rikishi: { town: 'dake', master: '湯治の 力士', form: 'duel' },
    yumi: { town: 'tsuchiyu', master: '板前', form: 'mato' },
    miko: { town: 'iizaka', master: 'おかみ', form: 'kagura' },
    sou: { town: 'takayu', master: '湯治の 老僧', form: 'mondo' },
  },
  // 段階③（10/5 夜 本人「おＫ」）＝3章 県中・県南：郡山に4人・須賀川に3人・白河に3人（3章の8話の土地にちなむ）
  3: {
    yojutsu: { town: 'bandaiatami', master: '芸者', form: 'duel' },
    rikishi: { town: 'bandaiatami', master: '湯治の 大関', form: 'duel' },
    onmyo: { town: 'bandaiatami', master: '番頭', form: 'mondo' },
    kusushi: { town: 'bohata', master: '湯治の 医者', form: 'mondo' },
    yamabushi: { town: 'futamata', master: '湯治の 山伏', form: 'duel' },
    sou: { town: 'bohata', master: '湯宿の 隠居', form: 'mondo' },
    yumi: { town: 'futamata', master: '湯守', form: 'mato' },
    bushi: { town: 'kashi', master: '若旦那', form: 'duel' },
    ninja: { town: 'kashi', master: '仲居', form: 'duel' },
    miko: { town: 'nekonakiyu', master: 'おかみ', form: 'kagura' },
  },
  // 4章（10/6 本人「会津にも温泉クエスト」）＝会津の温泉地5か所に2人ずつ・4つ目の技
  4: {
    rikishi: { town: 'nakanosawa', master: '湯治の 横綱', form: 'duel' },
    ninja: { town: 'nakanosawa', master: '仲居', form: 'duel' },
    bushi: { town: 'higashiyama', master: '湯治の 剣客', form: 'duel' },
    miko: { town: 'higashiyama', master: '芸妓', form: 'kagura' },
    onmyo: { town: 'ashinomaki', master: '番頭', form: 'mondo' },
    kusushi: { town: 'ashinomaki', master: '湯守', form: 'mondo' },
    sou: { town: 'nishiyama', master: '湯治の 老僧', form: 'mondo' },
    yojutsu: { town: 'nishiyama', master: '旅の 奇術師', form: 'duel' },
    yumi: { town: 'hayato', master: '渡し守', form: 'mato' },
    yamabushi: { town: 'hayato', master: '湯治の 山伏', form: 'duel' },
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


// ---- パーティの アドバイス（本人 10/5「4人を選んだところで『アドバイス』のボタンも設置し、PTのバランス解説を行う」）----
// 4人の 能力の点の合計と 役目から、しおりが 短く 助言する（画面と切り離す＝試験 tests/jobs.test.js）
const HEAL_POWER = { sou: 2, miko: 1.5, kusushi: 1 }; // 全員の回復（読経・御神酒・調合）
const MIST_CLEAR = ['bushi', 'rikishi', 'yumi', 'yamabushi', 'miko']; // もやを払う技を持つ
const GUARD_JOBS = ['onmyo', 'rikishi', 'ninja', 'sou']; // 守りの技（呪符・結界／かばう／煙玉／不動の結界）
export function adviceOf(pick) {
  const jobs = [pick.tabi, pick.shiori, ...pick.mates];
  const sum = Object.fromEntries(Object.keys(POINT_NAMES).map((k) => [k, jobs.reduce((n, j) => n + (JOBS[j].points[k] ?? 0), 0)]));
  const heal = jobs.reduce((n, j) => n + (HEAL_POWER[j] ?? 0), 0);
  const mist = jobs.filter((j) => MIST_CLEAR.includes(j)).length;
  const guard = jobs.filter((j) => GUARD_JOBS.includes(j)).length;
  const mark = (v, a, b) => (v >= a ? '◎' : v >= b ? '○' : '△');
  const rows = [
    ['回復', mark(heal, 2, 1)],
    ['体力', mark(sum.tairyoku, 30, 22)],
    ['攻め', mark(sum.chikara, 32, 22)],
    ['術', mark(sum.chiryoku, 28, 16)],
    ['もや払い', mark(mist, 2, 1)],
    ['守りの技', mark(guard, 2, 1)],
  ];
  const lines = [];
  const good = rows.filter(([, m]) => m === '◎').map(([n]) => n);
  lines.push(good.length ? `この4人は ${good.join('と ')}が 強みね。` : 'この4人は どれも ほどほど。片寄りの 少ない 組ね。');
  if (heal === 0) lines.push('回復できる人が いないわ。薬草を 多めに持って、宿で こまめに 休みましょう。僧か 巫女が いると 心強いの。');
  else if (heal < 2) lines.push('回復は 少しだけ。強い ボスの前は 薬草も そろえておきましょう。');
  if (sum.tairyoku < 22) lines.push('体力が 少なめ。ボスの 全体攻撃が こわいから、防具を 先に 買いましょう。');
  if (sum.chikara < 22) lines.push('力が 弱めだから、黒い もやを 払うのに 手間取るわ。もやは たたかうで 払って、術は 晴れてから。');
  if (mist === 0) lines.push('もやを 払う技を 持つ人が いないの。もやが 濃い ボスは 長引くかも。');
  if (sum.chiryoku < 16) lines.push('術の 得意な人が 少ないわ。守りの 固い 敵には、語って 明かした 弱点の術が 頼りよ。');
  if (guard === 0) lines.push('守りの技が 無いから、弱った人が 出たら 早めに 回復してね。');
  if (sum.hayasa >= 24) lines.push('素早い人が 多いから、先に 動けることが 多いはず。');
  if ((JOBS[pick.tabi].points.seishin ?? 0) <= 3) lines.push('あなたは 術の力が 少なめ。弱点の術を 唱えるために、霊水を 持っておいてね。');
  if (lines.length === 1) lines.push('回復も 守りも そろっているわ。安心して 旅に 出られるわね。');
  // 総合力のグラフ（本人 10/5「アドバイスに総合力のグラフ。ひし形のやつ」）＝6つの見立てを 0〜1 に（いちばん強い組で1）
  const cap = (v, m) => Math.max(0, Math.min(1, v / m));
  const scores = [cap(heal, 3), cap(sum.tairyoku, 39), cap(sum.chikara, 46), cap(sum.chiryoku, 40), cap(mist, 3), cap(guard, 3)];
  return { rows, lines, sum, heal, scores };
}

// 「戻る」＝ひとつ前の選びを取り消す（本人 10/5「戻るは前の画面ではなく、ひとつ前、職業を選びなおせるように」）
// history＝職業を入れた枠の番号の並び。いちばん新しく入れて まだ埋まっている枠を空け、そこを光らせる。取り消す物が無ければ null
export function undoPick(slots, history) {
  const h = [...history];
  while (h.length) {
    const i = h.pop();
    if (slots[i]) {
      const next = [...slots];
      next[i] = null;
      return { slots: next, active: i, history: h };
    }
  }
  return null;
}
