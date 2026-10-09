// 戦いの計算。画面とは切り離す。log の sfx は鳴らす効果音の名前（src/audio/chip.js）。state は毎回複製して返す（元を書き換えない）。
import { jobFxPlan, JOBFX_LOOK } from './jobfx.js?v=353'; // 4人の 技の 演出の 段（10/8）

export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ダメージのぶれ：0.875〜1.125倍
// もやが残っているときに術が届く割合
export const MIST_BLOCK = 0.5;
// かいしんの一撃（本人 10/2「旅のものに『かいしんの一撃』をランダムに」）＝旅の者の たたかう の 1/16。守りを無視した攻撃力そのまま
export const CRIT_CHANCE = 1 / 16;
// 鉄砲（本人 10/2「当たらないことも。レベルが低いときは中々当たらないが、当たると大ダメージ、かいしんのいちげきくらい」）
// 当たる見込み＝レベルで上がる（猟師が加わる Lv3 で35%・Lv5 で55%・上は85%）。当たれば守りを無視して 攻撃力×GUN_MULT
export const GUN_MULT = 2.2; // 10/4 夜 本人「猟師の鉄砲が弱い、当たったら今の2倍のダメージ」＝1.1→2.2
export const gunHit = (lv = 1) => Math.min(0.85, 0.05 + 0.1 * lv);
// 昔話の主に、弱点が明かされる前に撃ったときの割合
export const GUN_UNREVEALED = 0.075; // 2倍にしたぶん半分に＝明かす前の玉の勢いは前と同じ（語らずに撃って勝てない決まりを残す）
// 居合い斬り（武士・10/4）：昔話の主は、語って弱点が明かされるまで 黒いもやが刃を はばむ（語らずに斬り続けて勝てないように）・もやの間は抜けない
export const IAI_UNREVEALED = 0.2;
// くノ一（10/4 夜 本人「短剣と妖術使い」）：たたかう＝短剣の二連撃（1太刀は 攻撃力×DUAL_ATK で、守りの すきまを突く＝守りは DUAL_DEF 倍だけ効く）
export const DUAL_ATK = 0.7;
export const DUAL_DEF = 0.7;
// 狐火の術：居合い斬りと同じく 明かす前の昔話の主には2割。もやの間は 術と同じく半分（MIST_BLOCK）
export const YOJUTSU_UNREVEALED = 0.2;
// 職業の大きな技（jobs.js の big）＝明かす前の昔話の主には2割（語ってから術の決まりを残す・10/5）
export const BIG_UNREVEALED = 0.2;
// 術（magic）の威力＝ 知力 × mult × MAGIC_K（守り無視）。回復＝最大HPの frac ×（HEAL_BASE＋知力÷HEAL_DIV）
export const MAGIC_K = 1.25;
export const HEAL_BASE = 0.6;
export const HEAL_DIV = 50;
// 神楽舞・法螺貝・火渡り（buff）の残りがあれば 攻めの倍率
const buffMult = (state) => (state.buff?.turns > 0 ? state.buff.mult : 1);
const healScale = (a) => HEAL_BASE + (a.int ?? 0) / HEAL_DIV;
// 道中の敵か、語って弱点が明かされた昔話の主
const opened = (e) => !!(e.noWeak || e.revealed);
// 声を使わない技（爆音の間も出せる）
export const VOICELESS = new Set(['iai', 'strike', 'evade', 'cover', 'mistall', 'poison', 'healOne', 'counter', 'decoy', 'hpstrike', 'charge', 'medAll']);
// 急所（本人 10/3「1/10の確率で敵の急所にあたり、一発でしとめる」→ 10/4 夜「10回に1回ランダムに急所に一発で当たり、敵が倒れる」）
// ＝撃った10発に1発は 急所。道中の敵は一発で倒れる。昔話の主（ボス）は 体力の GUN_KYUSHO_BOSS（2割）の大きな傷（10/4 夜 本人「道中の敵だけ一発」
//   ＝ボスにも一発を効かせたら 玉3発で ボス戦の勝率が約98%になった）。ボスは語って弱点を明かしたあとだけ（明かす前は 黒いもやが玉を呑む）
export const GUN_KYUSHO = 0.1;
export const GUN_KYUSHO_BOSS = 0.2;
// 投網（釣りの景品）が ぬし（ボス）に かかる見込み。道中の敵には必ず かかる
export const NET_BOSS = 0.6;

export function spread(rng) {
  return 0.875 + rng() * 0.25;
}

export function physicalDamage(atk, def, rng) {
  return Math.max(1, Math.round((atk - def / 2) * spread(rng)));
}

export function spellDamage(spell, revealed, rng) {
  const mult = revealed ? spell.weakMult : spell.plainMult;
  return Math.max(1, Math.round(spell.power * mult * spread(rng)));
}

// rng を渡すと、もやの始めの数を mist.min〜max から運で決める（本人 10/1「もやはランダムに」）。渡さなければ max
function startMist(mist, rng) {
  if (!mist) return 0;
  if (!rng || mist.min == null) return mist.max;
  return mist.min + Math.floor(rng() * (mist.max - mist.min + 1));
}

export function createBattle(data, rng = null) {
  return {
    allies: data.allies.map((a) => ({ ...a, maxHp: a.maxHp ?? a.hp, maxMp: a.maxMp ?? a.mp, alive: a.alive ?? true })), // 力つきて幽霊のままの仲間は alive:false で来る // 歩く地図から来ると hp は今の値・maxHp は別に来る
    // mistLeft＝敵がまとう黒いもやの残り（本人 10/1「たたかうの役目が半減しませんか？」）。mist の無い敵は0
    enemy: { ...data.enemy, maxHp: data.enemy.hp, revealed: false, restored: false, mistLeft: startMist(data.enemy.mist, rng) },
    items: Object.fromEntries(Object.entries(data.items).map(([k, v]) => [k, v.count])),
    stolen: [], // 道中の敵に盗まれた名物（どの 番屋でも 戻る・10/9）
    monLost: 0, // 因縁で取られた文
    silence: 0, // 爆音の残りターン（術と語るが使えない）
    blind: 0, // 自撮りのフラッシュの残りターン（たたかうが半分外れる）
    turn: 1,
    over: null,
  };
}

export function isOver(state) {
  if (state.enemy.hp <= 0) return 'win';
  if (state.allies.every((a) => !a.alive)) return 'lose';
  return null;
}

function lowestAlly(state) {
  return state.allies
    .filter((a) => a.alive)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
}

// 術の力が一番減っている、術を使う味方（術の力の最大が0の者は数えない）
function lowestMpAlly(state) {
  return state.allies
    .filter((a) => a.alive && a.maxMp > 0)
    .sort((a, b) => a.mp / a.maxMp - b.mp / b.maxMp)[0];
}

// ---- ボスの 必殺技の 形（10/7 本人「必殺技マンネリ化してませんか？4人全員に攻撃だけでなく、一人に大ダメージなど工夫して。蛇のボスは全員に毒など」）----
//   kind 'all'（既定）＝全員に power／'one'＝1人に power×ONE_MULT（かばう・分身は 効く）／'poison'＝全員に power×POISON_HIT と 毒
//   'silence'＝全員に power×SILENCE_HIT と 術封じ。stun は 'one' なら その1人だけ
export const ONE_MULT = 2.5;
// 一人に大技は 最大HPの ONE_CAP まで（満タンの 人を 一撃では 倒さない＝守りの 技の 無い 組でも 立て直せる・10/7 試算で 4章の 3体が 0.39〜0.43 だった）
export const ONE_CAP = 0.7;
export const POISON_HIT = 0.5;
export const SILENCE_HIT = 0.6;
export const SILENCE_TURNS = 2;
// 毒（戦いの 中だけ）＝ターンの 終わりに 最大HPの POISON_FRAC を 失う・POISON_TURNS で 消える・毒では 倒れない（1で 止まる）・お祓いで 治る
export const POISON_FRAC = 0.06;
export const POISON_TURNS = 3;
// 文は 実際に かかった 人から 作る（10/10 洗い出し：凍み餅の 人を 外した あとも「みんな」と 出ていた）
function poisonAll(targets, log, living) {
  const hit = targets.filter((a) => a.alive && !a.shimiWard); // 10/9 夜 凍み餅を 食べた 人は 毒に かからない
  for (const a of hit) a.poison = POISON_TURNS;
  const all = hit.length === living.filter((a) => a.alive).length;
  if (hit.length) log.push({ text: all ? 'みんな 毒に おかされた！' : `${hit.map((a) => a.name).join('と ')}は 毒に おかされた！`, sfx: 'dokuiki' });
}
// お菓子を 食べられないわけ（もう 食べた／術の 力の 無い 人の 水飴）＝戦いの 道具の 選びで 灰色にする。食べられるなら null
export function sweetBlocked(a, itemId, it) {
  if (a.sweets?.[itemId]) return '食べた';
  if (it.fx?.mpRegen && !(a.maxMp > 0)) return '術なし';
  return null;
}

function hurt(a, d, log) {
  a.hp = Math.max(0, a.hp - d);
  // 泰山府君の祭（陰陽師・10/5）：この戦いで 一度だけ 倒れずに 踏みとどまる
  if (a.hp === 0 && a.enmei) {
    a.enmei = false;
    a.hp = 1;
    log.push({ text: `${a.name}は ${d}の ダメージを うけた！`, effect: { kind: 'hitAlly', target: a.id, hp: a.hp } });
    log.push({ text: `しかし ${a.name}は 泰山府君の 加護で 踏みとどまった！`, sfx: 'heal' });
    return;
  }
  // 10/9 夜 あんぽ柿：この 戦いで 一度だけ
  if (a.hp === 0 && a.endure) {
    const by = a.endure;
    a.endure = null;
    a.hp = 1;
    log.push({ text: `${a.name}は ${d}の ダメージを うけた！`, effect: { kind: 'hitAlly', target: a.id, hp: a.hp } });
    log.push({ text: `しかし ${a.name}は ${by}の 力で 踏みとどまった！`, sfx: 'heal' });
    return;
  }
  log.push({ text: `${a.name}は ${d}の ダメージを うけた！`, effect: { kind: 'hitAlly', target: a.id, hp: a.hp } });
  if (a.hp === 0) {
    a.alive = false;
    log.push({ text: `${a.name}は 力つきた……`, sfx: 'down' });
  }
}

function allyAct(state, a, cmd, data, rng, log) {
  const e = state.enemy;
  // 満月の一矢（弓矢使い・10/5）：引きしぼった次の番は、気絶や呪いより先に ひとりでに放つ
  if (a.charged) {
    const sp = data.spells[a.charged];
    a.charged = null;
    let d = Math.max(1, Math.round(a.atk * sp.mult * buffMult(state) * spread(rng)));
    const closed = !e.noWeak && !e.revealed;
    if (closed) d = Math.max(1, Math.round(d * BIG_UNREVEALED));
    e.hp = Math.max(0, e.hp - d);
    log.push({ text: `${a.name}は 引きしぼった 矢を 放った！`, sfx: sp.sfx });
    log.push({ text: closed ? '黒い もやが 矢の 勢いを 呑みこんだ……' : sp.shotText, effect: { kind: closed ? 'iai' : 'crit' } });
    log.push({ text: `${e.name}に ${d}の ダメージ！`, effect: { kind: 'hitEnemy' } });
    return;
  }
  // 道中の敵の癖：網・うっとりで1回動けない／呪いで ときどき動けない／爆音で 術と語るが届かない
  if (a.stunned > 0) {
    a.stunned -= 1;
    log.push({ text: a.stunText ?? `${a.name}は 動けない！` });
    return;
  }
  if (a.curse && rng() < 1 / 3) {
    log.push({ text: `${a.name}は 呪いで 体が 動かない！` });
    return;
  }
  // 爆音で声が届かない（居合い斬りは声を使わないので出せる）
  if (state.silence > 0 && !a.shimiWard && ((cmd.type === 'spell' && !VOICELESS.has(data.spells[cmd.spellId]?.kind)) || cmd.type === 'tell')) {
    log.push({ text: `${a.name}は 声を 出したが、かき消されて 届かない！` }); // 10/4 鳴き声・こだまでも合う文に（前は どの雑魚でも「爆音」）
    return;
  }
  // 隠れる敵（1章 橘墨虎・本人 10/3）：弱点が明かされるまで、たたかう・鉄砲の半分は岩穴の闇に とどかない
  if ((cmd.type === 'attack' || cmd.type === 'shoot') && e.hide && !e.revealed && !(cmd.type === 'shoot' && (e.mistLeft > 0 || !(state.items.tama > 0))) && rng() < e.hide.chance) {
    log.push({ text: cmd.type === 'shoot' ? `${a.name}は 鉄砲を かまえた。` : `${a.name}の こうげき！`, sfx: cmd.type === 'shoot' ? undefined : 'attack' });
    log.push({ text: e.hide.text });
    return;
  }
  if (cmd.type === 'attack') {
    if (state.blind > 0 && rng() < 0.5) {
      log.push({ text: `${a.name}の こうげき！`, sfx: 'attack' });
      log.push({ text: '目が くらんで、外れてしまった！' });
      return;
    }
    if (a.dual) {
      // くノ一の 短剣の二連撃（10/4 夜）
      log.push({ text: `${a.name}の 短剣！ 二連撃！`, effect: { kind: 'dual' }, sfx: 'tanken' });
      for (let k = 0; k < 2 && e.hp > 0; k++) {
        const d = physicalDamage(a.atk * DUAL_ATK * buffMult(state), e.def * (a.job && !opened(e) ? 1 : a.pierce ?? DUAL_DEF), rng);
        e.hp = Math.max(0, e.hp - d);
        log.push({ text: `${e.name}に ${d}の ダメージ！`, effect: { kind: 'hitEnemy' } });
      }
    } else {
      // 職業の持ち味（10/5）：武士＝かいしんが出やすい（crit）・力士＝つっぱり（atkMult）・弓矢使い＝守りを半分つらぬく（pierce）
      // 職業の無い者（前の作りの仲間・試験）は 旅の者だけ 1/16
      // ⭐守りを くぐる持ち味（かいしん・射る・二連撃の すきま）は、語って弱点を明かす前の昔話の主には効かない（黒いもやが 守る）
      //   ＝たたかうだけで勝てない決まりを残す（10/5 試算：武士・弓矢使いの組が たたかうだけで 龍燈に 200戦132勝した）
      const cc = a.crit != null ? (opened(e) ? a.crit : 0) : (a.id === 'tabi' ? CRIT_CHANCE : 0);
      const crit = cc > 0 && rng() < cc;
      const atk = a.atk * (a.atkMult ?? 1) * buffMult(state);
      const d = crit ? Math.max(1, Math.round(atk * spread(rng))) : physicalDamage(atk, e.def * (opened(e) ? a.pierce ?? 1 : 1), rng);
      e.hp = Math.max(0, e.hp - d);
      log.push({ text: a.attackText ? `${a.name}の ${a.attackText}！` : `${a.name}の こうげき！`, sfx: 'attack' });
      if (crit) log.push({ text: 'かいしんの いちげき！', effect: { kind: 'crit' }, sfx: 'hit' });
      log.push({ text: `${e.name}に ${d}の ダメージ！`, effect: { kind: 'hitEnemy' } });
    }
    // たたかうと、黒いもやが1つ晴れる
    if (e.mistLeft > 0 && e.hp > 0) {
      e.mistLeft -= 1;
      log.push({
        text: e.mistLeft > 0 ? `黒い もやが ひとつ 晴れた！（のこり ${e.mistLeft}）` : '黒い もやが すっかり 晴れた！ 術が まっすぐ とどく。',
        effect: { kind: 'mist', mist: e.mistLeft }, sfx: 'clear',
      });
    }
  } else if (cmd.type === 'shoot') {
    // 鉄砲（猟師・本人 10/2）：玉を1発使う。当たればレベルしだいの見込みで、守りを無視した大きな一撃
    // もやが残っている間は撃てない（本人 10/2「もやが出ているときは、鉄砲が使えないは？」）＝玉は減らない。先に たたかって払う
    if (e.mistLeft > 0) {
      log.push({ text: `${a.name}は 鉄砲を かまえた。しかし 黒い もやで 狙いが 定まらない！` });
      return;
    }
    if (!(state.items.tama > 0)) {
      log.push({ text: `${a.name}は 鉄砲を かまえた。しかし 玉が ない！` });
      return;
    }
    state.items.tama -= 1;
    log.push({ text: `${a.name}は 鉄砲を 撃った！ パーン！`, effect: { kind: 'gun' }, sfx: 'gun' });
    if (state.blind > 0 && rng() < 0.5) {
      log.push({ text: '目が くらんで、外れてしまった！' });
      return;
    }
    const opened = e.noWeak || e.revealed; // 昔話の主は 語って明かしたあと
    // 急所：撃った10発に1発（当たるかどうかの前に決める＝レベルが低くても 1割は急所）
    if (opened && rng() < GUN_KYUSHO) {
      const d = e.noWeak ? e.hp : Math.min(e.hp, Math.max(1, Math.round(e.maxHp * GUN_KYUSHO_BOSS)));
      e.hp -= d;
      log.push({ text: e.noWeak ? '急所に 命中した！ 一発で しとめた！' : '急所に 命中した！ 大きな 手ごたえ！', effect: { kind: 'crit' }, sfx: 'hit' });
      log.push({ text: `${e.name}に ${d}の ダメージ！`, effect: { kind: 'hitEnemy' } });
      return;
    }
    if (rng() >= gunHit(a.lv)) {
      log.push({ text: '……玉は それて しまった！' });
      return;
    }
    let d = Math.max(1, Math.round(a.atk * GUN_MULT * spread(rng)));
    // 昔話の主（ボス）は、語って弱点が明かされるまで 黒いもやが玉を呑みこむ＝語らずに撃ち続けても勝てない（10/2 試算：玉10発で200戦200勝した）
    if (!opened) {
      d = Math.max(1, Math.round(d * GUN_UNREVEALED));
      log.push({ text: '黒い もやが 玉の 勢いを 呑みこんだ……' });
    } else {
      log.push({ text: '玉が 命中した！', effect: { kind: 'crit' } });
    }
    e.hp = Math.max(0, e.hp - d);
    log.push({ text: `${e.name}に ${d}の ダメージ！`, effect: { kind: 'hitEnemy' } });
  } else if (cmd.type === 'spell' && isJobSkill(data.spells[cmd.spellId])) {
    jobSkill(state, a, data.spells[cmd.spellId], cmd.spellId, rng, log, cmd.target);
  } else if (cmd.type === 'spell' && data.spells[cmd.spellId]?.kind === 'yojutsu') {
    // くノ一の 狐火の術（10/4 夜）：守りを無視した 攻撃力×mult。もやの間は半分・明かす前の昔話の主には2割
    const sp = data.spells[cmd.spellId];
    log.push({ text: `${a.name}は ${sp.verb}！`, sfx: sp.sfx });
    if (a.mp < sp.cost) {
      log.push({ text: 'しかし 術の力が たりない！' });
      return;
    }
    a.mp -= sp.cost;
    log.push({ text: sp.text, effect: { kind: 'kitsunebi' } });
    let d = Math.max(1, Math.round(a.atk * sp.mult * spread(rng)));
    if (!e.noWeak && !e.revealed) {
      d = Math.max(1, Math.round(d * YOJUTSU_UNREVEALED));
      log.push({ text: '黒い もやが 狐火を 吸いこんだ……' });
    } else if (e.mistLeft > 0) {
      d = Math.max(1, Math.round(d * MIST_BLOCK));
      log.push({ text: '黒い もやに さえぎられて、術が 弱まった……' });
    }
    e.hp = Math.max(0, e.hp - d);
    log.push({ text: `${e.name}に ${d}の ダメージ！`, effect: { kind: 'hitEnemy' } });
  } else if (cmd.type === 'spell' && data.spells[cmd.spellId]?.kind === 'iai') {
    // 居合い斬り（武士・本人 10/4）：守りを無視した 攻撃力×mult の一太刀
    const sp = data.spells[cmd.spellId];
    log.push({ text: `${a.name}は ${sp.verb}……` });
    // もやが残っている間は 間合いが見えず 抜けない（鉄砲と同じ・術の力は減らない）＝先に たたかって払う（たたかうの役目を残す）
    if (e.mistLeft > 0) {
      log.push({ text: 'しかし 黒い もやで 間合いが 見えない！' });
      return;
    }
    if (a.mp < sp.cost) {
      log.push({ text: 'しかし 術の力が たりない！' });
      return;
    }
    a.mp -= sp.cost;
    log.push({ text: `居合い斬り！ ${sp.text}`, effect: { kind: 'iai' }, sfx: sp.sfx });
    if (state.blind > 0 && rng() < 0.5) {
      log.push({ text: '目が くらんで、外れてしまった！' });
      return;
    }
    let d = Math.max(1, Math.round(a.atk * sp.mult * spread(rng)));
    if (!e.noWeak && !e.revealed) {
      d = Math.max(1, Math.round(d * IAI_UNREVEALED));
      log.push({ text: '黒い もやが 刃を はばんだ……' });
    }
    e.hp = Math.max(0, e.hp - d);
    log.push({ text: `${e.name}に ${d}の ダメージ！`, effect: { kind: 'hitEnemy' } });
  } else if (cmd.type === 'spell') {
    const sp = data.spells[cmd.spellId];
    log.push({ text: sp.verb ? `${a.name}は ${sp.verb}！` : `${a.name}は ${sp.name}を となえた！`, sfx: sp.sfx ?? 'spell' });
    if (a.mp < sp.cost) {
      log.push({ text: 'しかし 術の力が たりない！' });
      return;
    }
    a.mp -= sp.cost;
    // 仲間の術（src/data/companions.js）：傷を ふさぐ／目を くらます／糸で 止める＝敵に ダメージは無い
    if (sp.kind === 'heal') {
      log.push({ text: sp.text });
      for (const t of state.allies.filter((x) => x.alive)) {
        const before = t.hp;
        t.hp = Math.min(t.maxHp, t.hp + Math.max(1, Math.round(sp.power * spread(rng))));
        log.push({ text: `${t.name}の HPが ${t.hp - before} かいふくした！`, effect: { kind: 'heal', target: t.id, hp: t.hp } });
      }
      return;
    }
    if (sp.kind === 'daze') {
      e.dazed = sp.turns;
      e.dazeText = sp.missText;
      log.push({ text: sp.text });
      log.push({ text: `${e.name}${sp.hitText}` });
      return;
    }
    if (sp.kind === 'bind') {
      log.push({ text: sp.text });
      if (rng() < sp.chance) {
        e.bound = 1;
        e.boundText = sp.stuckText;
        log.push({ text: `${e.name}${sp.hitText}` });
      } else {
        log.push({ text: `${e.name}${sp.missText}` });
      }
      return;
    }
    const revealed = e.revealed && e.weakness === cmd.spellId;
    let d = spellDamage(sp, revealed, rng);
    // もやが残っていると、術は半分しか届かない
    if (e.mistLeft > 0) {
      d = Math.max(1, Math.round(d * MIST_BLOCK));
      log.push({ text: '黒い もやに さえぎられて、術が 弱まった……' });
    }
    e.hp = Math.max(0, e.hp - d);
    // 術の挿絵（10/5 夜 本人「鬼婆を懲らしめる観音様のカットインが欲しい」）＝弱点が明かされて効いたときだけ。音は術の音だけ（solo）
    log.push({ text: revealed ? sp.weakText : sp.plainText, ...(revealed && sp.cutin ? { effect: { kind: 'special', flash: sp.flash ?? [255, 230, 150], cutin: sp.cutin, solo: true }, hold: 1700 } : {}) });
    log.push({ text: `${e.name}に ${d}の ダメージ！`, effect: { kind: 'hitEnemy' } });
  } else if (cmd.type === 'item') {
    // 道具。kind 'hp' は一番弱った味方の HP を、'mp' は術を使う味方の術の力を戻す
    const it = data.items[cmd.itemId];
    if (state.items[cmd.itemId] <= 0) {
      log.push({ text: `${it.name}は もう ない！` });
      return;
    }
    // 10/9 夜 お菓子（本人「この戦闘中のみ防御力が1.5倍など」）＝食べた 本人に その戦いの 間だけ。同じ 菓子は 重ならない（食べずに 残す）
    if (it.kind === 'sweet') {
      a.sweets = a.sweets ?? {};
      if (a.sweets[cmd.itemId]) {
        log.push({ text: `${a.name}は もう ${it.name}を 食べている。（同じ お菓子は 重ならない）` });
        return;
      }
      if (sweetBlocked(a, cmd.itemId, it) === '術なし') { // 10/10 洗い出し：術の 力の 無い 人が 水飴を 食べても 効かなかった＝食べずに 残す
        log.push({ text: `${a.name}には 術の 力が ない。${it.name}は 食べずに 残した。` });
        return;
      }
      state.items[cmd.itemId] -= 1;
      a.sweets[cmd.itemId] = true;
      const fx = it.fx ?? {};
      log.push({ text: `${a.name}は ${it.name}を 食べた！`, sfx: 'eat' });
      if (fx.stat) {
        a[fx.stat] = Math.round(a[fx.stat] * fx.mult);
        log.push({ text: `${a.name}の ${{ def: '守り', atk: '攻め', agi: '素早さ' }[fx.stat]}が 上がった！（この 戦いの 間）`, sfx: 'heal' });
      }
      if (fx.mpRegen) { a.mpRegen = (a.mpRegen ?? 0) + fx.mpRegen; log.push({ text: `${a.name}の 体に 力が めぐり はじめた！（術の 力が 毎ターン もどる）`, sfx: 'heal' }); }
      if (fx.ward) { a.shimiWard = true; a.poison = 0; log.push({ text: `${a.name}は 毒にも 術封じにも かからなく なった！（この 戦いの 間）`, sfx: 'heal' }); }
      if (fx.endure) { a.endure = it.name; log.push({ text: `${a.name}は 一度だけ 倒れずに 踏みとどまれる！（この 戦いの 間）`, sfx: 'heal' }); }
      return;
    }
    // 釣りの景品（本人 10/2「戦闘時に役立つもの」）：投網＝敵を1回止める（ぬしは かわすことも）／大漁の酒＝生きている全員の HP を戻す
    if (it.kind === 'bind') {
      state.items[cmd.itemId] -= 1;
      log.push({ text: `${a.name}は ${it.name}を 投げた！`, sfx: 'attack' });
      if (rng() < (e.noWeak ? 1 : NET_BOSS)) {
        e.bound = 1;
        e.boundText = 'は 網に からまって 動けない！';
        log.push({ text: `${e.name}は 網に からめとられた！` });
      } else {
        log.push({ text: `${e.name}は 網を ひきちぎった！` });
      }
      return;
    }
    if (it.kind === 'hpall') {
      state.items[cmd.itemId] -= 1;
      log.push({ text: `${a.name}は ${it.name}を みんなに ふるまった！`, sfx: 'eat' });
      for (const x of state.allies.filter((y) => y.alive)) {
        const before = x.hp;
        x.hp = Math.min(x.maxHp, x.hp + Math.round(it.amount * (a.itemMult ?? 1)));
        log.push({ text: `${x.name}の HPが ${x.hp - before} かいふくした！`, effect: { kind: 'heal', target: x.id, hp: x.hp } });
      }
      return;
    }
    // 秘薬（薬師・10/5）：この戦いの間、薬（HP・術の力）が 生きている全員に効く
    if (state.medAll && (it.kind === 'hp' || it.kind === 'mp')) {
      state.items[cmd.itemId] -= 1;
      const amtAll = Math.round(it.amount * (a.itemMult ?? 1));
      log.push({ text: `${a.name}は ${it.name}を 調合して みなに くばった！`, sfx: 'eat' });
      for (const x of state.allies.filter((y) => y.alive)) {
        if (it.kind === 'mp') {
          if (!(x.maxMp > 0)) continue;
          const before = x.mp;
          x.mp = Math.min(x.maxMp, x.mp + amtAll);
          log.push({ text: `${x.name}の 術の力が ${x.mp - before} もどった！`, effect: { kind: 'mp', target: x.id, mp: x.mp } });
        } else {
          const before = x.hp;
          x.hp = Math.min(x.maxHp, x.hp + amtAll);
          log.push({ text: `${x.name}の HPが ${x.hp - before} かいふくした！`, effect: { kind: 'heal', target: x.id, hp: x.hp } });
        }
      }
      return;
    }
    // 10/10 本人「手動の際の守り系の魔法は、だれに魔法をかけるかを選択できるように」＝選んだ 人（cmd.target）。その番までに 倒れて いたら いつもの 決め方
    const chosen = state.allies.find((x) => x.id === cmd.target && x.alive && (it.kind !== 'mp' || x.maxMp > 0));
    const t = chosen ?? (it.kind === 'mp' ? lowestMpAlly(state) : lowestAlly(state));
    if (!t) {
      log.push({ text: `${a.name}は ${it.name}を とりだした。しかし 使う相手が いない。` });
      return;
    }
    state.items[cmd.itemId] -= 1;
    log.push({ text: t === a ? `${a.name}は ${it.name}を 使った！` : `${a.name}は ${t.name}に ${it.name}を 使った！`, sfx: 'eat' });
    const amt = Math.round(it.amount * (a.itemMult ?? 1)); // 薬師の調合（10/5）＝効き目1.5倍
    if (a.itemMult > 1) log.push({ text: `${a.name}の 調合で、効き目が 増した！` });
    if (it.kind === 'mp') {
      const before = t.mp;
      t.mp = Math.min(t.maxMp, t.mp + amt);
      log.push({ text: `${t.name}の 術の力が ${t.mp - before} もどった！`, effect: { kind: 'mp', target: t.id, mp: t.mp } });
    } else {
      const before = t.hp;
      t.hp = Math.min(t.maxHp, t.hp + amt);
      log.push({ text: `${t.name}の HPが ${t.hp - before} かいふくした！`, effect: { kind: 'heal', target: t.id, hp: t.hp } });
    }
    if (it.desc) log.push({ text: it.desc, speaker: 'しおり' });
  } else if (cmd.type === 'tell') {
    // 必ず負ける1回目（2章 鬼婆・本人 10/4「一度全滅→町で祐慶と合流し、再トライ」）＝語っても声が出ない
    if (e.forcedLose) {
      log.push({ text: e.tellBlock ?? `${a.name}は 語ろうとしたが、声が 出ない！` });
      return;
    }
    log.push({ text: `${a.name}は ${e.name}の 昔話を 語りはじめた……`, sfx: 'tell' });
    // 挿絵と語りの声の紙芝居（本人 10/2「挿絵とナレーションを付けて」）。初めて語るときだけ＝画面が紙芝居を見せる
    // 紙芝居で語り終えた話は、2度目に同じ筋を繰り返さない（本人 10/2「この語りと、戦闘中の語りが重なるので、ダブらないように」）
    if (e.story?.tell && !e.revealed) log.push({ text: '', effect: { kind: 'story', part: 'tell' } });
    else if (!(e.story?.tell && e.revealed)) for (const line of e.tellLines) log.push({ text: line, speaker: a.name });
    if (e.noWeak) {
      // 道中の敵には弱点が無い
    } else if (!e.revealed) {
      e.revealed = true;
      log.push({ text: e.revealText, effect: { kind: 'reveal' } });
      // 助っ人（1章 玉都の琵琶・白狼）が 弱点の明かされた時に現れる
      const h = e.helper;
      if (h) {
        log.push({ text: h.revealText, effect: { kind: 'helper' } });
        if (h.revealBind) {
          e.bound = Math.max(e.bound ?? 0, h.revealBind);
          e.boundText = h.boundText;
        }
      }
    } else {
      log.push({ text: 'もう 弱点は 明かされている。' });
    }
  } else if (cmd.type === 'flee') {
    log.push({ text: `${a.name}は にげだした！`, sfx: 'flee' });
    if (e.canFlee && rng() < 0.6) {
      log.push({ text: 'うまく 逃げきった！' });
      state.over = 'fled';
      return;
    }
    log.push({ text: 'しかし まわりこまれてしまった！' });
  }
}

// ---- 職業の技（jobs.js の JOB_SPELLS・本人 10/5「職業が多数あり」）----
const JOB_KINDS = new Set(['strike', 'magic', 'healOne', 'revive', 'cleanse', 'buff', 'guard', 'cover', 'debuff', 'seal', 'poison', 'evade', 'mistall', 'counter', 'summon', 'decoy', 'hpstrike', 'charge', 'lifeguard', 'medAll', 'mpall']);
// 前からの heal（power で決まる仲間の術）は前の決まりのまま。frac のある heal（読経・御神酒・天岩戸）は職業の技
const isJobSkill = (sp) => !!sp && (JOB_KINDS.has(sp.kind) || (sp.kind === 'heal' && sp.frac != null));

function clearMist(e, n, log) {
  if (!(e.mistLeft > 0) || !n || e.hp <= 0) return;
  e.mistLeft = Math.max(0, e.mistLeft - n);
  log.push({
    text: e.mistLeft > 0 ? `黒い もやが 晴れた！（のこり ${e.mistLeft}）` : '黒い もやが すっかり 晴れた！ 術が まっすぐ とどく。',
    effect: { kind: 'mist', mist: e.mistLeft }, sfx: 'clear',
  });
}

function jobSkill(state, a, sp, id, rng, log, target = null) {
  const e = state.enemy;
  const head = { text: `${a.name}は ${sp.verb ?? sp.name + 'を 使った'}！`, sfx: sp.sfx };
  log.push(head);
  if (sp.once && a.usedOnce?.includes(id)) {
    log.push({ text: 'しかし この戦いでは もう 使えない！' });
    return;
  }
  if (sp.noMist && e.mistLeft > 0) {
    log.push({ text: 'しかし 黒い もやで 間合いが 見えない！' });
    return;
  }
  if (a.mp < (sp.cost ?? 0)) {
    log.push({ text: 'しかし 術の力が たりない！' });
    return;
  }
  a.mp -= sp.cost ?? 0;
  if (sp.once) a.usedOnce = [...(a.usedOnce ?? []), id];
  // 10/8 本人「4人の必殺技を出すとき、効果音やエフェクトを多用してほしい、強い必殺技ほど派手に」＝出せた 時だけ 段（jobs.js の tier）の 演出を 載せる
  const plan = jobFxPlan(sp.tier ?? 1);
  head.effect = { kind: 'jobfx', tier: plan.tier, look: JOBFX_LOOK[sp.kind] ?? 'attack', name: sp.name, id }; // id＝毛筆の 名の 絵（10/10）
  if (plan.hold) head.hold = plan.hold;
  const living = state.allies.filter((x) => x.alive);
  const heal = (t, n) => {
    const before = t.hp;
    t.hp = Math.min(t.maxHp, t.hp + Math.max(1, n));
    log.push({ text: `${t.name}の HPが ${t.hp - before} かいふくした！`, effect: { kind: 'heal', target: t.id, hp: t.hp } });
  };
  const k = sp.kind;
  const closed = !e.noWeak && !e.revealed; // 昔話の主で、まだ語っていない
  if (k === 'strike' || k === 'magic') {
    log.push({ text: sp.text, effect: { kind: k === 'magic' ? 'kitsunebi' : 'iai' } });
    const hits = sp.hits ?? 1;
    for (let h = 0; h < hits && e.hp > 0; h++) {
      if (state.blind > 0 && k === 'strike' && rng() < 0.5) {
        log.push({ text: '目が くらんで、外れてしまった！' });
        continue;
      }
      let d;
      if (k === 'magic') d = Math.max(1, Math.round((a.int ?? a.atk) * sp.mult * MAGIC_K * buffMult(state) * spread(rng)));
      else {
        const atk = a.atk * sp.mult * buffMult(state);
        d = sp.crit ? Math.max(1, Math.round(atk * spread(rng))) : physicalDamage(atk, e.def * (sp.defMult ?? 1), rng);
      }
      if (sp.big && closed) d = Math.max(1, Math.round(d * BIG_UNREVEALED));
      else if (k === 'magic' && e.mistLeft > 0) d = Math.max(1, Math.round(d * MIST_BLOCK));
      e.hp = Math.max(0, e.hp - d);
      if (sp.crit && h === 0) log.push({ text: 'かいしんの いちげき！', effect: { kind: 'crit' } });
      log.push({ text: `${e.name}に ${d}の ダメージ！`, effect: { kind: 'hitEnemy' } });
    }
    if (sp.big && closed) log.push({ text: '黒い もやが 技の 勢いを 呑みこんだ……' });
    else if (k === 'magic' && e.mistLeft > 0) log.push({ text: '黒い もやに さえぎられて、術が 弱まった……' });
    if (sp.stun && e.hp > 0) {
      e.bound = Math.max(e.bound ?? 0, sp.stun);
      e.boundText = 'は 目を まわして 動けない！';
      log.push({ text: `${e.name}は 目を まわした！` });
    }
    clearMist(e, sp.clearMist, log);
    addOns(state, a, sp, log);
    return;
  }
  log.push({ text: sp.text });
  if (k === 'heal') {
    for (const t of living) heal(t, Math.round(t.maxHp * sp.frac * (sp.frac >= 1 ? 1 : healScale(a)) * (sp.frac >= 1 ? 1 : spread(rng))));
    clearMist(e, sp.clearMist, log);
  } else if (k === 'healOne') {
    const t = living.find((x) => x.id === target) ?? lowestAlly(state); // 10/10 選んだ 人
    heal(t, Math.round(t.maxHp * sp.frac));
  } else if (k === 'revive') {
    const dead = state.allies.filter((x) => !x.alive).sort((x, y) => (y.id === target) - (x.id === target)); // 10/10 選んだ 人を 先に（もう 起きて いれば ほかの 人）
    if (!dead.length) log.push({ text: 'しかし 倒れた 仲間は いない。' });
    for (const t of sp.all ? dead : dead.slice(0, 1)) {
      t.alive = true;
      t.hp = Math.max(1, Math.round(t.maxHp * sp.frac));
      t.stunned = 0;
      t.poison = 0; // 10/7 夜 起きあがると 毒と 構えた矢は 消える（倒れる前の 毒が 残り、起きた ターンに むしばんだ）
      t.charged = null;
      log.push({ text: `${t.name}が 起きあがった！`, effect: { kind: 'heal', target: t.id, hp: t.hp }, sfx: 'heal' });
    }
  } else if (k === 'cleanse') {
    let n = state.blind > 0 ? 1 : 0;
    for (const t of living) {
      if (t.curse || t.ghost || t.stunned > 0 || t.poison > 0) n += 1;
      t.curse = false;
      t.ghost = false;
      t.stunned = 0;
      t.poison = 0;
    }
    state.blind = 0;
    log.push({ text: n ? 'みなの 悪い 印が 消えた！' : 'みなの 体が 軽く なった。' });
    if (sp.frac) for (const t of living) heal(t, Math.round(t.maxHp * sp.frac * healScale(a)));
  } else if (k === 'buff') {
    state.buff = { mult: sp.mult, agi: sp.agi ?? 0, turns: sp.turns };
  } else if (k === 'guard') {
    state.guard = { mult: sp.mult, turns: sp.turns };
  } else if (k === 'cover') {
    state.cover = { id: a.id, turns: sp.turns };
  } else if (k === 'debuff') {
    e.weak = { mult: sp.mult, turns: sp.turns };
  } else if (k === 'seal') {
    e.sealed = 1;
  } else if (k === 'poison') {
    e.poison = { dmg: Math.max(1, Math.round(e.maxHp * sp.frac * (closed ? BIG_UNREVEALED : 1))), turns: sp.turns };
  } else if (k === 'evade') {
    state.evade = sp.evadeTurns ?? 1; // 隠れ蓑（4章）は 2ターン
  } else if (k === 'mistall') {
    if (!(e.mistLeft > 0)) log.push({ text: 'もやは もう 晴れている。' });
    clearMist(e, 99, log);
  } else if (k === 'counter') {
    state.counter = { id: a.id, mult: sp.mult, turns: sp.turns, big: !!sp.big };
  } else if (k === 'summon') {
    state.summon = { name: sp.beast, power: (a.int ?? a.atk) * sp.mult * MAGIC_K, turns: sp.turns, big: !!sp.big };
  } else if (k === 'decoy') {
    state.decoy = { id: a.id, count: sp.count };
  } else if (k === 'hpstrike') {
    let d = Math.max(1, Math.round(a.maxHp * sp.mult * buffMult(state) * spread(rng)));
    if (sp.big && closed) {
      d = Math.max(1, Math.round(d * BIG_UNREVEALED));
      log.push({ text: '黒い もやが 技の 勢いを 呑みこんだ……' });
    }
    e.hp = Math.max(0, e.hp - d);
    log.push({ text: `${e.name}に ${d}の ダメージ！`, effect: { kind: 'hitEnemy' } });
    if (sp.stun && e.hp > 0) {
      e.bound = Math.max(e.bound ?? 0, sp.stun);
      e.boundText = 'は 目を まわして 動けない！';
      log.push({ text: `${e.name}は 目を まわした！` });
    }
  } else if (k === 'charge') {
    a.charged = id;
  } else if (k === 'lifeguard') {
    for (const t of living) t.enmei = true;
  } else if (k === 'medAll') {
    state.medAll = true;
  } else if (k === 'mpall') {
    for (const t of living) {
      if (!(t.maxMp > 0)) continue;
      const before = t.mp;
      t.mp = Math.min(t.maxMp, t.mp + Math.round(t.maxMp * sp.frac));
      if (t.mp > before) log.push({ text: `${t.name}の 術の力が ${t.mp - before} もどった！`, effect: { kind: 'mp', target: t.id, mp: t.mp } });
    }
  }
  addOns(state, a, sp, log);
}

// 4章の技（10/6）の 付け足しの効き目＝今の型に重ねる。addCleanse 悪い印を治す／addDaze 敵の攻撃が それる（ターン）／
// addGuard 受ける傷を減らす／addWeak 敵の攻めを弱める／addMp 全員の術の力を戻す（最大の割合）
function addOns(state, a, sp, log) {
  const e = state.enemy;
  const living = state.allies.filter((x) => x.alive);
  if (sp.addCleanse) {
    let n = state.blind > 0 ? 1 : 0;
    for (const t of living) {
      if (t.curse || t.ghost || t.stunned > 0 || t.poison > 0) n += 1;
      t.curse = false;
      t.ghost = false;
      t.stunned = 0;
      t.poison = 0;
    }
    state.blind = 0;
    if (n) log.push({ text: 'みなの 悪い 印が 消えた！' });
  }
  if (sp.addDaze && e.hp > 0) {
    e.dazed = Math.max(e.dazed ?? 0, sp.addDaze);
    e.dazeText = sp.missText;
    log.push({ text: `${e.name}は まどわされた！ しばらく 攻撃が 当たりにくい。` });
  }
  if (sp.addGuard) state.guard = { ...sp.addGuard };
  if (sp.addWeak) {
    e.weak = { ...sp.addWeak };
    log.push({ text: `${e.name}の 力が 弱まった！` });
  }
  if (sp.addMp) {
    for (const t of living) {
      if (!(t.maxMp > 0)) continue;
      const before = t.mp;
      t.mp = Math.min(t.maxMp, t.mp + Math.round(t.maxMp * sp.addMp));
      if (t.mp > before) log.push({ text: `${t.name}の 術の力が ${t.mp - before} もどった！`, effect: { kind: 'mp', target: t.id, mp: t.mp } });
    }
  }
}

// 敵は毎ターン special.chance の見込みで必殺技（全員に当たる）。それ以外はかみつき（1人）
// 2体同時（twin・2章 ムカデとオロチ・本人 10/4）＝二匹とも それぞれの名前で動く（体力は ひとつ）
function enemyAct(state, rng, log) {
  const e = state.enemy;
  // くくり罠（bind）：1回 動けない
  if (e.bound > 0) {
    e.bound -= 1;
    log.push({ text: `${e.name}${e.boundText}` });
    return;
  }
  if (e.twin) {
    e.twin.names.forEach((nm, i) => {
      // 10/10 洗い出し：燕返しで 倒した あとも 残りが 攻め続け、全員 倒れて「勝ち」に なった（手下 → 大将の 連戦で 全員 倒れたまま 大将へ 進み 止まる）＝敵が 倒れたら やめる
      if (e.hp > 0 && state.allies.some((a) => a.alive)) enemyStrike(state, rng, log, nm, e.twin.bites?.[i] ?? e.biteName);
    });
  } else {
    enemyStrike(state, rng, log, e.name, e.biteName);
  }
  // 必殺技とは別に、毎ターン mist.rise の見込みで もやが ふいに 濃くなる（本人 10/1「もやはランダムに」）
  if (e.mist?.rise && e.hp > 0 && e.mistLeft < e.mist.max && state.allies.some((a) => a.alive) && rng() < e.mist.rise) {
    e.mistLeft += 1;
    log.push({ text: `${e.name}の まわりで、黒い もやが ふいに 濃くなった……`, effect: { kind: 'mist', mist: e.mistLeft } });
  }
}

// 燕返し（武士・10/5）：構えている間、仲間を打った敵に 斬りかえす（守り無視）
function counterStrike(state, rng, log) {
  const c = state.counter;
  const e = state.enemy;
  if (!(c?.turns > 0) || e.hp <= 0) return;
  const me = state.allies.find((x) => x.id === c.id && x.alive);
  if (!me) return;
  let d = Math.max(1, Math.round(me.atk * c.mult * buffMult(state) * spread(rng)));
  if (c.big && !e.noWeak && !e.revealed) d = Math.max(1, Math.round(d * BIG_UNREVEALED));
  e.hp = Math.max(0, e.hp - d);
  log.push({ text: `${me.name}の 燕返し！ 返す 刀で ${e.name}に ${d}の ダメージ！`, effect: { kind: 'hitEnemy' }, sfx: 'tsubame' });
}

// 1体ぶんの動き（name＝文に出す名前・bite＝かみつきの言い方）
function enemyStrike(state, rng, log, name, bite) {
  const e = state.enemy;
  const living = state.allies.filter((a) => a.alive);
  // 真言（daze）：かみつきも必殺技も 半分は それる
  if (e.dazed > 0 && rng() < 0.5) {
    log.push({ text: `${name}${e.dazeText}` });
    return;
  }
  // 煙玉（忍者・10/5）＝このターンの敵の動きは 全員 かわす
  if (state.evade > 0) {
    log.push({ text: `${name}の 攻撃は、煙の 中の 影を すりぬけた！` });
    return;
  }
  if (e.trick && rng() < e.trick.chance && doTrick(state, e, living, rng, log)) return;
  // 必殺技は2つまで（本人 10/3「4話の龍に必殺技を増やして。全員に大ダメージ」）＝special2 を先に見て、出なければ special
  // ⚠special2 の無い敵は rng を引く回数が前と同じ（運の並びを変えない）
  // stun の技（へっぴり嫁の すごいおなら）は、気絶している人がいる間は出さない＝続けて気絶させて何もできないまま負けるのを防ぐ
  const sp = [e.special2, e.special].find((x) => x && !(x.stun && living.some((a) => a.stunned > 0)) && rng() < x.chance);
  // 結界の符（陰陽師・10/5）＝次の必殺技を1回 封じる
  if (sp && e.sealed > 0) {
    e.sealed = 0;
    log.push({ text: `${name}は ${sp.name}を 放とうとした！ しかし 結界が 封じた！`, effect: { kind: 'shake' }, sfx: 'clear' });
    return;
  }
  // 呪符（敵の攻め）・不動の結界（受ける傷）の倍率
  const weakMult = e.weak?.turns > 0 ? e.weak.mult : 1;
  const guardMult = state.guard?.turns > 0 ? state.guard.mult : 1;
  if (sp) {
    // cutin＝技の挿絵（本人 10/3「今回から、ボスの必殺技は別のアクション(挿絵)を」）。挿絵のある技は文を長めに止める（hold）
    log.push({ text: `${name}の 必殺技！ ${sp.name}！`, effect: { kind: 'special', flash: sp.flash, cutin: sp.cutin, solo: !!sp.sfxSolo }, sfx: sp.sfx ?? 'flame', ...(sp.cutin ? { hold: 1700 } : {}) });
    const kind = sp.kind ?? 'all';
    let stunned = living;
    if (kind === 'one' && living.length) {
      // 1人に 大技（かばう・分身は かみつきと 同じく 効く）
      let t = living[Math.floor(rng() * living.length)];
      const cov = state.cover?.turns > 0 ? living.find((x) => x.id === state.cover.id) : null;
      if (cov && cov !== t) {
        log.push({ text: `${cov.name}が ${t.name}を かばった！` });
        t = cov;
      }
      if (state.decoy?.count > 0) {
        state.decoy.count -= 1;
        log.push({ text: `分身が 技を 受けて、煙と なって 消えた！（のこり ${state.decoy.count}）`, sfx: 'kemuri' });
        stunned = [];
      } else {
        hurt(t, Math.max(1, Math.min(Math.round(t.maxHp * ONE_CAP), Math.round(sp.power * ONE_MULT * weakMult * guardMult * spread(rng)))), log);
        stunned = [t];
      }
    } else {
      const k = sp.hit ?? (kind === 'poison' ? POISON_HIT : kind === 'silence' ? SILENCE_HIT : 1); // hit＝その技だけの 傷の 割合（沼御前の 大蛇の毒＝満額＋毒・10/7）
      for (const a of living) hurt(a, Math.max(1, Math.round(sp.power * k * weakMult * guardMult * spread(rng))), log);
      if (state.decoy?.count > 0) {
        state.decoy.count = 0;
        log.push({ text: '分身は 技に 巻きこまれて 消えた……' });
      }
      if (kind === 'poison') poisonAll(living, log, living);
      if (kind === 'silence' && living.some((a) => a.alive)) {
        state.silence = Math.max(state.silence ?? 0, SILENCE_TURNS + 1); // ターンの 終わりに 1つ 減る＝つぎの 2ターン
        log.push({ text: '声が かき消されて、術も 語りも とどかない！', sfx: 'down' });
      }
    }
    counterStrike(state, rng, log);
    // 気絶（本人 10/4「おならをくらったら全員しばらくの間、気絶」）＝生き残った全員が stun 回 自分の番を休む（'one' は その1人だけ）
    if (sp.stun) {
      const hit = stunned.filter((a) => a.alive);
      for (const a of hit) {
        a.stunned = Math.max(a.stunned ?? 0, sp.stun);
        a.stunText = `${a.name}は 気絶して 動けない……`;
      }
      if (hit.length) log.push({ text: hit.length > 1 ? 'みんな 目を まわして 気絶して しまった！' : `${hit[0].name}は 動けなく なった！`, sfx: 'down' });
    }
    // 必殺技をくらうと、もやが1つ立ちこめる（最大 max まで・本人 10/1「敵の必殺技をくらうとモヤがかかる」）
    if (e.mist && e.mistLeft < e.mist.max && state.allies.some((a) => a.alive)) {
      e.mistLeft += 1;
      log.push({ text: `${e.name}の まわりに、また 黒い もやが 立ちこめた……`, effect: { kind: 'mist', mist: e.mistLeft } });
    }
  } else {
    let t = living[Math.floor(rng() * living.length)];
    log.push({ text: `${name}の ${bite}！`, effect: { kind: 'shake' }, sfx: 'bite' });
    // かばう（力士・10/5）＝ほかの人への一撃を 受けとめる
    const cov = state.cover?.turns > 0 ? living.find((x) => x.id === state.cover.id) : null;
    if (cov && cov !== t) {
      log.push({ text: `${cov.name}が ${t.name}を かばった！` });
      t = cov;
    }
    // 分身の術（忍者・10/5）：分身が 残っていれば 分身が 受けて 消える
    if (state.decoy?.count > 0) {
      state.decoy.count -= 1;
      log.push({ text: `分身が 攻撃を 受けて、煙と なって 消えた！（のこり ${state.decoy.count}）`, sfx: 'kemuri' });
    } else {
      const d = physicalDamage(e.atk * weakMult, t.def, rng);
      hurt(t, weakMult === 1 && guardMult === 1 ? d : Math.max(1, Math.round(d * guardMult)), log);
    }
    counterStrike(state, rng, log);
  }
}

// 道中の敵の癖。出せたら true（盗む物が無いなど、出せないときは ふつうの攻撃へ）
function doTrick(state, e, living, rng, log) {
  const pick = (list) => list[Math.floor(rng() * list.length)];
  const k = e.trick.kind;
  if (k === 'steal') {
    const have = Object.keys(state.items).filter((id) => state.items[id] > 0);
    if (!have.length) return false;
    const id = pick(have);
    state.items[id] -= 1;
    state.stolen.push(id);
    log.push({ text: `${e.name}は ${e.itemNames?.[id] ?? id}を ${e.trick.verb ?? '盗んで 逃げていった'}！`, sfx: 'flee' });
    log.push({ text: '盗まれた 品は、町の 番屋に 届くかも しれない。' }); // 10/9 本人「各エリアの番屋で引き取り」
    state.over = 'fled';
    return true;
  }
  // 毒の息（10/7 蛇の ボス）＝全員を 毒に（もう 全員 毒なら 出さない）
  if (k === 'poisonall') {
    const t = living.filter((a) => !(a.poison > 0) && !a.shimiWard); // 10/10 洗い出し：凍み餅の 人しか 残って いないと 空振りの 息で 手番を 使っていた
    if (!t.length) return false;
    log.push({ text: e.trick.text ?? `${e.name}は 毒の 息を 吐いた！`, effect: { kind: 'shake' } });
    poisonAll(t, log, living); // 10/7 夜 毒に なったのが 一部なら その人の 名前
    return true;
  }
  if (k === 'curse' || k === 'possess') {
    const flag = k === 'curse' ? 'curse' : 'ghost';
    const t = living.filter((a) => !a[flag]);
    if (!t.length) return false;
    const a = pick(t);
    // 厄除け守：半分は はね返す
    if (a.ward && rng() < 0.5) {
      log.push({ text: `${e.name}の ${k === 'curse' ? '呪い' : '霊'}が ${a.name}に せまる！ ……お守りが 光って、はね返した！`, sfx: 'clear' });
      return true;
    }
    a[flag] = true;
    log.push({ text: k === 'curse' ? `${e.name}の 呪い！ ${a.name}は 呪われて しまった！` : `${e.name}が ${a.name}に 取り憑いた！ 体が ずしりと 重い……`, sfx: 'down' });
    return true;
  }
  if (k === 'noise') {
    if (state.silence > 0) return false;
    state.silence = 3;
    log.push({ text: e.trick.text ?? `${e.name}の 爆音！ 耳が キーンと 鳴って、声が とどかない！`, effect: { kind: 'shake' }, sfx: 'flame' }); // text＝昔話の敵の言い回し（10/4）
    return true;
  }
  if (k === 'extort') {
    state.monLost += e.trick.amount;
    log.push({ text: `${e.name}に 因縁を つけられた！ 文を ${e.trick.amount} 取られた……`, sfx: 'bite' });
    return true;
  }
  if (k === 'drink') {
    if (e.hp >= e.maxHp) return false;
    const before = e.hp;
    e.hp = Math.min(e.maxHp, e.hp + e.trick.amount);
    log.push({ text: `${e.trick.text ?? `${e.name}は 栄養ドリンクを 飲みほした！`} HPが ${e.hp - before} もどった！`, sfx: 'heal' });
    return true;
  }
  if (k === 'boil') {
    log.push({ text: e.trick.text ?? `${e.name}の 熱々スープ！`, effect: { kind: 'shake' }, sfx: 'flame' });
    for (const a of living) hurt(a, Math.max(1, Math.round(e.trick.power * spread(rng))), log);
    return true;
  }
  if (k === 'wasabi') {
    const a = pick(living);
    a.stunned = 1;
    a.stunText = `${a.name}は 涙が 止まらず 動けない！`;
    log.push({ text: `${e.name}は わさびを 投げつけた！ ${a.name}の 鼻に ツーンと きた！`, sfx: 'bite' });
    return true;
  }
  if (k === 'blind') {
    if (state.blind > 0) return false;
    state.blind = 2;
    log.push({ text: e.trick.text ?? `${e.name}の 自撮り！ まぶしい フラッシュで 目が くらんだ！`, effect: { kind: 'special', flash: [255, 255, 255] } });
    return true;
  }
  if (k === 'runaway') {
    log.push({ text: `${e.name}は もやを まとったまま、逃げていってしまった……` });
    state.over = 'fled';
    return true;
  }
  if (k === 'lecture') {
    const a = pick(living);
    a.stunned = 1;
    a.stunText = `${a.name}は 眠くて 動けない……`;
    log.push({ text: `${e.name}の 長い 講釈！ ${a.name}は うとうと してきた……` });
    return true;
  }
  if (k === 'charm' || k === 'net') {
    const t = k === 'charm' ? living.filter((a) => a.id === 'tabi') : living;
    if (!t.length) return false;
    const a = pick(t);
    a.stunned = 1;
    a.stunText = e.trick.stunText ? `${a.name}は ${e.trick.stunText}` : (k === 'charm' ? `${a.name}は うっとりして 動けない！` : `${a.name}は 網に からまって 動けない！`);
    log.push({ text: e.trick.text ?? (k === 'charm' ? `${e.name}の 甘い ささやき！ ${a.name}は うっとりしてしまった！` : `${e.name}は 網を 投げた！ ${a.name}が からめとられた！`), sfx: 'bite' });
    return true;
  }
  return false;
}

// commands = { [味方のid]: { type: 'attack'|'spell'|'item'|'tell'|'flee', spellId?, itemId? } }
// 素早い順に動く。勝ち負けが決まったらそこで止まる。
export function resolveTurn(state0, commands, data, rng) {
  const state = structuredClone(state0);
  const log = [];
  const actors = [
    ...state.allies.filter((a) => a.alive).map((a) => ({ side: 'ally', id: a.id, agi: a.agi + (state.buff?.turns > 0 ? state.buff.agi ?? 0 : 0) })),
    { side: 'enemy', id: state.enemy.id, agi: state.enemy.agi },
  ].sort((x, y) => y.agi - x.agi);
  for (const actor of actors) {
    if (state.over) break;
    if (actor.side === 'ally') {
      const a = state.allies.find((x) => x.id === actor.id);
      if (!a.alive) continue;
      allyAct(state, a, commands[a.id] ?? { type: 'attack' }, data, rng, log);
    } else {
      enemyAct(state, rng, log);
    }
    state.over = state.over || isOver(state); // 逃げた・盗んで逃げた（'fled'）は消さない
  }
  // 助っ人は、弱点が明かされた後のターンの終わりに 見込み chance で もう一度（止める／打つ）
  const h = state.enemy.helper;
  if (!state.over && h?.chance && state.enemy.revealed && !log.some((m) => m.effect?.kind === 'helper') && rng() < h.chance) {
    log.push({ text: h.text, effect: { kind: 'helper' } });
    if (h.bind) {
      state.enemy.bound = Math.max(state.enemy.bound ?? 0, 1);
      state.enemy.boundText = h.boundText;
    }
    if (h.dmg) {
      const d = Math.max(1, Math.round(h.dmg * spread(rng)));
      state.enemy.hp = Math.max(0, state.enemy.hp - d);
      log.push({ text: `${state.enemy.name}に ${d}の ダメージ！`, effect: { kind: 'hitEnemy' } });
      state.over = isOver(state);
    }
  }
  // 毒の吹き矢（薬師・10/5）＝ターンの終わりに 毒が むしばむ
  const pz = state.enemy.poison;
  if (!state.over && pz?.turns > 0) {
    state.enemy.hp = Math.max(0, state.enemy.hp - pz.dmg);
    pz.turns -= 1;
    log.push({ text: `毒が ${state.enemy.name}を むしばむ！ ${pz.dmg}の ダメージ！`, effect: { kind: 'hitEnemy' } });
    state.over = isOver(state);
  }
  // 大蝦蟇の術（妖術使い・10/5）：呼んだ獣が ターンの終わりに 攻める
  const sm = state.summon;
  if (!state.over && sm?.turns > 0) {
    const closedS = !state.enemy.noWeak && !state.enemy.revealed;
    let d = Math.max(1, Math.round(sm.power * spread(rng)));
    if (sm.big && closedS) d = Math.max(1, Math.round(d * BIG_UNREVEALED));
    else if (state.enemy.mistLeft > 0) d = Math.max(1, Math.round(d * MIST_BLOCK));
    state.enemy.hp = Math.max(0, state.enemy.hp - d);
    sm.turns -= 1;
    log.push({ text: `${sm.name}の 体当たり！ ${state.enemy.name}に ${d}の ダメージ！${sm.turns > 0 ? '' : `（${sm.name}は 煙と なって 帰っていった）`}`, effect: { kind: 'hitEnemy' }, sfx: 'oogama' });
    state.over = isOver(state);
  }
  // 味方の 毒（10/7）＝ターンの 終わりに むしばむ・毒では 倒れない
  if (!state.over) {
    for (const a of state.allies.filter((x) => x.alive && x.poison > 0)) {
      const before = a.hp;
      a.hp = Math.max(1, a.hp - Math.max(1, Math.round(a.maxHp * POISON_FRAC)));
      const d = before - a.hp; // 10/7 夜 HP1 では 減らない＝減った分だけ 書く
      a.poison -= 1;
      log.push({ text: `${a.name}は ${d > 0 ? `毒で ${d}の ダメージ！` : '毒に むしばまれて いる……'}${a.poison > 0 ? '' : `（${a.name}の 毒が ぬけた）`}`, effect: { kind: 'hitAlly', target: a.id, hp: a.hp } });
    }
  }
  // 10/9 夜 米の 水飴：ターンの 終わりに 術の 力が もどる
  if (!state.over) for (const a of state.allies.filter((x) => x.alive && x.mpRegen > 0 && x.maxMp > 0 && x.mp < x.maxMp)) {
    const before = a.mp;
    a.mp = Math.min(a.maxMp, a.mp + a.mpRegen);
    log.push({ text: `${a.name}の 術の 力が ${a.mp - before} もどった。`, effect: { kind: 'mp', target: a.id, mp: a.mp } });
  }
  for (const key of ['buff', 'guard', 'cover', 'counter']) if (state[key]?.turns > 0) state[key].turns -= 1;
  if (state.enemy.weak?.turns > 0) state.enemy.weak.turns -= 1;
  if (state.evade > 0) state.evade -= 1;
  if (state.over === 'win') state.enemy.restored = true;
  if (state.silence > 0) state.silence -= 1;
  if (state.blind > 0) state.blind -= 1;
  if (state.enemy.dazed > 0) state.enemy.dazed -= 1;
  state.turn += 1;
  return { state, log };
}
