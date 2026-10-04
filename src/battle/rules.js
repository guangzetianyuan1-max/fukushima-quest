// 戦いの計算。画面とは切り離す。log の sfx は鳴らす効果音の名前（src/audio/chip.js）。state は毎回複製して返す（元を書き換えない）。

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
// 急所（本人 10/3「1/10の確率で敵の急所にあたり、一発でしとめる」→ 10/4 夜「10回に1回ランダムに急所に一発で当たり、敵が倒れる」）
// ＝撃った10発に1発は 急所に当たって一発で倒れる。昔話の主（ボス）にも効く（前は道中の敵だけ）。ただし語って弱点を明かしたあと（明かす前は 黒いもやが玉を呑む）
export const GUN_KYUSHO = 0.1;
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
    stolen: [], // 道中の敵に盗まれた名物（小名浜の番屋に届く）
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

function hurt(a, d, log) {
  a.hp = Math.max(0, a.hp - d);
  log.push({ text: `${a.name}は ${d}の ダメージを うけた！`, effect: { kind: 'hitAlly', target: a.id, hp: a.hp } });
  if (a.hp === 0) {
    a.alive = false;
    log.push({ text: `${a.name}は 力つきた……`, sfx: 'down' });
  }
}

function allyAct(state, a, cmd, data, rng, log) {
  const e = state.enemy;
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
  if (state.silence > 0 && ((cmd.type === 'spell' && data.spells[cmd.spellId]?.kind !== 'iai') || cmd.type === 'tell')) {
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
        const d = physicalDamage(a.atk * DUAL_ATK, e.def * DUAL_DEF, rng);
        e.hp = Math.max(0, e.hp - d);
        log.push({ text: `${e.name}に ${d}の ダメージ！`, effect: { kind: 'hitEnemy' } });
      }
    } else {
      const crit = a.id === 'tabi' && rng() < CRIT_CHANCE;
      const d = crit ? Math.max(1, Math.round(a.atk * spread(rng))) : physicalDamage(a.atk, e.def, rng);
      e.hp = Math.max(0, e.hp - d);
      log.push({ text: `${a.name}の こうげき！`, sfx: 'attack' });
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
      const d = e.hp;
      e.hp = 0;
      log.push({ text: '急所に 命中した！ 一発で しとめた！', effect: { kind: 'crit' }, sfx: 'hit' });
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
    log.push({ text: revealed ? sp.weakText : sp.plainText });
    log.push({ text: `${e.name}に ${d}の ダメージ！`, effect: { kind: 'hitEnemy' } });
  } else if (cmd.type === 'item') {
    // 道具。kind 'hp' は一番弱った味方の HP を、'mp' は術を使う味方の術の力を戻す
    const it = data.items[cmd.itemId];
    if (state.items[cmd.itemId] <= 0) {
      log.push({ text: `${it.name}は もう ない！` });
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
        x.hp = Math.min(x.maxHp, x.hp + it.amount);
        log.push({ text: `${x.name}の HPが ${x.hp - before} かいふくした！`, effect: { kind: 'heal', target: x.id, hp: x.hp } });
      }
      return;
    }
    const t = it.kind === 'mp' ? lowestMpAlly(state) : lowestAlly(state);
    if (!t) {
      log.push({ text: `${a.name}は ${it.name}を とりだした。しかし 使う相手が いない。` });
      return;
    }
    state.items[cmd.itemId] -= 1;
    log.push({ text: t === a ? `${a.name}は ${it.name}を 使った！` : `${a.name}は ${t.name}に ${it.name}を 使った！`, sfx: 'eat' });
    if (it.kind === 'mp') {
      const before = t.mp;
      t.mp = Math.min(t.maxMp, t.mp + it.amount);
      log.push({ text: `${t.name}の 術の力が ${t.mp - before} もどった！`, effect: { kind: 'mp', target: t.id, mp: t.mp } });
    } else {
      const before = t.hp;
      t.hp = Math.min(t.maxHp, t.hp + it.amount);
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
      if (state.allies.some((a) => a.alive)) enemyStrike(state, rng, log, nm, e.twin.bites?.[i] ?? e.biteName);
    });
  } else {
    enemyStrike(state, rng, log, e.name, e.biteName);
  }
  // 必殺技とは別に、毎ターン mist.rise の見込みで もやが ふいに 濃くなる（本人 10/1「もやはランダムに」）
  if (e.mist?.rise && e.mistLeft < e.mist.max && state.allies.some((a) => a.alive) && rng() < e.mist.rise) {
    e.mistLeft += 1;
    log.push({ text: `${e.name}の まわりで、黒い もやが ふいに 濃くなった……`, effect: { kind: 'mist', mist: e.mistLeft } });
  }
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
  if (e.trick && rng() < e.trick.chance && doTrick(state, e, living, rng, log)) return;
  // 必殺技は2つまで（本人 10/3「4話の龍に必殺技を増やして。全員に大ダメージ」）＝special2 を先に見て、出なければ special
  // ⚠special2 の無い敵は rng を引く回数が前と同じ（運の並びを変えない）
  // stun の技（へっぴり嫁の すごいおなら）は、気絶している人がいる間は出さない＝続けて気絶させて何もできないまま負けるのを防ぐ
  const sp = [e.special2, e.special].find((x) => x && !(x.stun && living.some((a) => a.stunned > 0)) && rng() < x.chance);
  if (sp) {
    // cutin＝技の挿絵（本人 10/3「今回から、ボスの必殺技は別のアクション(挿絵)を」）。挿絵のある技は文を長めに止める（hold）
    log.push({ text: `${name}の 必殺技！ ${sp.name}！`, effect: { kind: 'special', flash: sp.flash, cutin: sp.cutin, solo: !!sp.sfxSolo }, sfx: sp.sfx ?? 'flame', ...(sp.cutin ? { hold: 1700 } : {}) });
    for (const a of living) hurt(a, Math.max(1, Math.round(sp.power * spread(rng))), log);
    // 気絶（本人 10/4「おならをくらったら全員しばらくの間、気絶」）＝生き残った全員が stun 回 自分の番を休む
    if (sp.stun) {
      const hit = living.filter((a) => a.alive);
      for (const a of hit) {
        a.stunned = Math.max(a.stunned ?? 0, sp.stun);
        a.stunText = `${a.name}は 気絶して 動けない……`;
      }
      if (hit.length) log.push({ text: 'みんな 目を まわして 気絶して しまった！', sfx: 'down' });
    }
    // 必殺技をくらうと、もやが1つ立ちこめる（最大 max まで・本人 10/1「敵の必殺技をくらうとモヤがかかる」）
    if (e.mist && e.mistLeft < e.mist.max && state.allies.some((a) => a.alive)) {
      e.mistLeft += 1;
      log.push({ text: `${e.name}の まわりに、また 黒い もやが 立ちこめた……`, effect: { kind: 'mist', mist: e.mistLeft } });
    }
  } else {
    const t = living[Math.floor(rng() * living.length)];
    log.push({ text: `${name}の ${bite}！`, effect: { kind: 'shake' }, sfx: 'bite' });
    hurt(t, physicalDamage(e.atk, t.def, rng), log);
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
    state.over = 'fled';
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
    ...state.allies.filter((a) => a.alive).map((a) => ({ side: 'ally', id: a.id, agi: a.agi })),
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
  if (state.over === 'win') state.enemy.restored = true;
  if (state.silence > 0) state.silence -= 1;
  if (state.blind > 0) state.blind -= 1;
  if (state.enemy.dazed > 0) state.enemy.dazed -= 1;
  state.turn += 1;
  return { state, log };
}
