// 「自動」のとき、味方の行動を選ぶ。
// 語れる者：弱点が分からなければ語る。
// それ以外：弱った味方（HP4割未満）がいれば HP の道具 → 術の力が足りなければ術の道具 → もやが無ければ明かされた弱点の術 → たたかう（もやを払う）。
// 道具は1ターンに1つだけ使う。
// 10/5 職業の技（jobs.js の JOB_SPELLS）：起こす・回復・お祓い・守り・かばう・弱らせる・封じる・毒・かわす・もや払い・殴る技・術を 場面で選ぶ
import { MAGIC_K, BIG_UNREVEALED, MIST_BLOCK, VOICELESS } from './rules.js?v=349';

const WEAK = 0.4;
const VERY_WEAK = 0.25;

function foods(state, data, kind) {
  return Object.entries(data.items)
    .filter(([id, it]) => it.kind === kind && (state.items[id] ?? 0) > 0)
    .sort(([, x], [, y]) => x.amount - y.amount); // 効き目の小さい順
}

// 撃てる技か（術の力・1回だけの技）
const ready = (a, data, id, reserve = 0) => {
  const sp = data.spells[id];
  return sp && a.mp >= (sp.cost ?? 0) + reserve && !(sp.once && a.usedOnce?.includes(id));
};
// その種類の技を探す。撃てる物だけ
function spellOf(a, data, kind, reserve = 0) {
  return (a.spells ?? []).find((id) => data.spells[id]?.kind === kind && ready(a, data, id, reserve));
}
const isHeal = (sp) => sp?.kind === 'heal';

// 1回の行動で 敵に与える見込み（くらべるため・ぶれは入れない）
function estimate(a, sp, e, mist, buff) {
  const closed = !e.noWeak && !e.revealed;
  let d;
  if (!sp) {
    if (a.dual) return 2 * Math.max(1, a.atk * 0.7 * buff - (e.def * 0.7) / 2);
    return Math.max(1, a.atk * (a.atkMult ?? 1) * buff - (e.def * (a.pierce ?? 1)) / 2);
  }
  if (sp.kind === 'hpstrike') {
    d = a.maxHp * sp.mult * buff;
    if (sp.big && closed) d *= BIG_UNREVEALED;
  } else if (sp.kind === 'magic') {
    d = (a.int ?? a.atk) * sp.mult * MAGIC_K * buff;
    if (sp.big && closed) d *= BIG_UNREVEALED;
    else if (mist > 0) d *= MIST_BLOCK;
  } else {
    const atk = a.atk * sp.mult * buff;
    d = (sp.crit ? atk : Math.max(1, atk - (e.def * (sp.defMult ?? 1)) / 2)) * (sp.hits ?? 1);
    if (sp.big && closed) d *= BIG_UNREVEALED;
  }
  return d;
}

export function chooseCommands(state, data) {
  const cmds = {};
  const e = state.enemy;
  let foodUsed = false;
  let dazeCast = e.dazed > 1; // 化け術がまだ効いている（このターンの終わりで1減る）
  let bindCast = e.bound > 0;
  let shots = 0; // このターンに撃つ玉の数
  const cast = new Set(); // このターンに もう決めた 技の種類（同じ物を2人で重ねない）
  const boss = !e.noWeak; // 化け術・糸は昔話の主（ボス）にだけ使う＝道中の敵は殴って済ませる
  const silent = state.silence > 0;
  const buff = state.buff?.turns > 0 ? state.buff.mult : 1;
  const living0 = state.allies.filter((x) => x.alive);
  const dead0 = state.allies.filter((x) => !x.alive);
  const ratio = (x) => x.hp / x.maxHp;
  const lowest0 = Math.min(...living0.map(ratio));
  // 倒れた仲間を起こす（ボスのとき・起こせる者がいれば 先に決める）
  if (boss && dead0.length && !silent) { // 10/7 夜 声が 届かない 間は 起こせない（選んでも かき消された）
    const r = living0.find((x) => !x.stunned && spellOf(x, data, 'revive'));
    if (r) cmds[r.id] = { type: 'spell', spellId: spellOf(r, data, 'revive') };
  }
  // 回復：弱った者がいれば 全員の回復（読経・御神酒・天岩戸）。足の速い者が先に道具を使わないよう、ここで先に決める
  const needHeal = lowest0 < 0.5 || living0.filter((x) => ratio(x) < 0.7).length >= 2;
  // 弱点の術を持つ者（主人公・如意輪の経の しおり）は、明かされたあとは ひどく弱った者が いるときだけ 回復（ふだんは 弱点の術）
  const critical = lowest0 < 0.35;
  const healOf = (x) => {
    const hs = (x.spells ?? []).filter((id) => isHeal(data.spells[id]) && ready(x, data, id));
    // 天岩戸の舞（全快）は ひどく弱ったときだけ・ふだんは 安い物
    hs.sort((p, q) => (data.spells[p].cost ?? 0) - (data.spells[q].cost ?? 0));
    return critical ? hs[hs.length - 1] : hs[0];
  };
  const healer = needHeal && !silent && living0.find((x) => !cmds[x.id] && !x.stunned && healOf(x) && (critical || !(e.revealed && (x.spells ?? []).includes(e.weakness))));
  if (healer) {
    cmds[healer.id] = { type: 'spell', spellId: healOf(healer) };
    foodUsed = true; // 回復は1ターンに1つ（ほかの者は道具を使わない）
  }
  // 道具（HP）：弱った者がいれば、弱点の術を持たない者が使う（薬師＝調合で効き目1.5倍を先に・ほかは 殴る力の弱い者）
  const hpFoods0 = foods(state, data, 'hp');
  if (!foodUsed && lowest0 < WEAK && hpFoods0.length) {
    const holder = (x) => e.revealed && (x.spells ?? []).includes(e.weakness);
    const user = living0.filter((x) => !cmds[x.id] && !x.stunned && !holder(x))
      .sort((p, q) => (q.itemMult ?? 1) - (p.itemMult ?? 1) || estimate(p, null, e, 0, buff) - estimate(q, null, e, 0, buff))[0];
    if (user) {
      const [id] = lowest0 < VERY_WEAK ? hpFoods0[hpFoods0.length - 1] : hpFoods0[0];
      cmds[user.id] = { type: 'item', itemId: id };
      foodUsed = true;
    }
  }
  // 素早い順に考える：先に動く味方が たたかえば、あとの味方の術の前に もやが晴れる
  let mist = e.mistLeft ?? 0;
  for (const a of [...state.allies].sort((x, y) => y.agi - x.agi)) {
    if (!a.alive || cmds[a.id]) continue;
    // 10/7 夜 動けない者は 技の 枠を 取らない（取ると 動ける 仲間が 同じ技を 選べなかった）
    if (a.stunned > 0) { cmds[a.id] = { type: 'attack' }; continue; }
    // 道中の敵（noWeak）には語らない＝明かす弱点が無いので、語ると毎ターン語り続けていた（本人 10/2「雑魚キャラでしおりが昔話を未だ語っている」）
    if (a.canTell && !e.noWeak && !e.revealed && !silent) {
      cmds[a.id] = { type: 'tell' };
      continue;
    }
    const living = state.allies.filter((x) => x.alive);
    const lowest = Math.min(...living.map(ratio));
    const healCost = Math.min(...(a.spells ?? []).map((id) => (isHeal(data.spells[id]) ? data.spells[id].cost : Infinity)));
    const reserve = Number.isFinite(healCost) ? healCost : 0; // 回復役は 回復の分の術を残す
    const pick = (kind, ok = true) => {
      if (!ok || cast.has(kind) || (silent && !VOICELESS.has(kind))) return null; // 10/7 夜 声が 届かない 間は 声の 要る 技を 選ばない
      const id = spellOf(a, data, kind, reserve);
      if (id) {
        cmds[a.id] = { type: 'spell', spellId: id };
        cast.add(kind);
      }
      return id;
    };
    // お祓い・解毒：呪い・取り憑き・目くらまし・気絶が あれば
    const sick = state.blind > 0 || living.some((x) => x.curse || x.ghost || x.stunned > 0) || living.filter((x) => x.poison > 0).length >= 2; // 毒は 2人 以上で（10/7）
    if (!silent && pick('cleanse', sick)) continue;
    if (boss) {
      const hasWeak0 = e.revealed && (a.spells ?? []).includes(e.weakness);
      // かわす（煙玉）：ひどく弱った者が いるとき
      if (pick('evade', lowest < VERY_WEAK + 0.05)) continue;
      // かばう（力士）：弱った者がいて、自分は元気なとき
      if (pick('cover', lowest < 0.5 && ratio(a) > 0.6 && !(state.cover?.turns > 0))) continue;
      // 守り（不動の結界）：減ってきたら
      if (!silent && pick('guard', lowest < 0.75 && !(state.guard?.turns > 0))) continue;
      // もや払い（四股踏み）：もやが2つ以上
      if (pick('mistall', mist >= 2)) { mist = 0; continue; }
      // 3章の奥義（10/5 職業ごとに別の仕組み）
      if (pick('lifeguard', lowest < 0.6 && !living.some((x) => x.enmei))) continue; // 泰山府君：一度だけ踏みとどまる
      if (pick('decoy', lowest < 0.7 && !(state.decoy?.count > 0))) continue; // 分身
      if (pick('medAll', !state.medAll && foods(state, data, 'hp').length > 0 && lowest < 0.6)) continue; // 秘薬
      const mpLow = living.filter((x) => x.maxMp > 0 && x.mp / x.maxMp < 0.35).length >= 2;
      if (pick('mpall', mpLow)) continue; // 火渡り
      if (e.revealed && !(a.spells ?? []).includes(e.weakness)) {
        if (pick('counter', !(state.counter?.turns > 0))) continue; // 燕返しの構え
        if (pick('summon', !(state.summon?.turns > 0))) continue; // 大蝦蟇
        if (pick('charge', mist === 0 && !a.charged)) continue; // 満月の一矢
      }
      // 弱らせる・封じる・毒（弱点の術を持つ者は そちらが先）
      if (!hasWeak0 && !silent) {
        if (pick('seal', !!(e.special || e.special2) && !(e.sealed > 0))) continue;
        if (pick('debuff', !(e.weak?.turns > 0))) continue;
        if (pick('poison', e.revealed && !(e.poison?.turns > 0))) continue;
        // 力を上げる（神楽舞・法螺貝・火渡り）：明かしたあと
        const bf = (a.spells ?? []).filter((id) => data.spells[id]?.kind === 'buff' && ready(a, data, id, reserve))
          .sort((p, q) => data.spells[q].mult - data.spells[p].mult)[0];
        if (bf && e.revealed && !cast.has('buff') && !(state.buff?.turns > 0)) {
          cmds[a.id] = { type: 'spell', spellId: bf };
          cast.add('buff');
          continue;
        }
      }
    }
    const daze0 = boss && !dazeCast && !silent && !(e.revealed && (a.spells ?? []).includes(e.weakness)) && spellOf(a, data, 'daze', reserve);
    const daze = daze0 && !(data.spells[daze0].autoHurt && lowest >= data.spells[daze0].autoHurt) ? daze0 : null; // 幻の術は 弱った者がいるときだけ
    if (daze) {
      cmds[a.id] = { type: 'spell', spellId: daze };
      dazeCast = true;
      continue;
    }
    // 弱点の術を持つ者は、弱点が明かされたら 足止めより 弱点の術を先に
    const hasWeak = e.revealed && (a.spells ?? []).includes(e.weakness);
    const bind = boss && !bindCast && !hasWeak && !silent && spellOf(a, data, 'bind', reserve);
    if (bind) {
      cmds[a.id] = { type: 'spell', spellId: bind };
      bindCast = true;
      continue;
    }
    // 猟師（前の形）：ボスには玉があるかぎり鉄砲
    if (a.gun && boss && e.revealed && mist === 0 && (state.items.tama ?? 0) > shots) {
      cmds[a.id] = { type: 'shoot' };
      shots += 1;
      continue;
    }
    const hpFoods = foods(state, data, 'hp');
    if (!foodUsed && lowest < WEAK && hpFoods.length > 0) {
      // ひどく弱っていれば一番効く物、そうでなければ一番小さい物から
      const [id] = lowest < VERY_WEAK ? hpFoods[hpFoods.length - 1] : hpFoods[0];
      cmds[a.id] = { type: 'item', itemId: id };
      foodUsed = true;
      continue;
    }
    // 1人だけ ひどく弱った：秘薬
    if (boss && lowest < VERY_WEAK && pick('healOne')) continue;
    const weakSpell = (a.spells ?? []).find((id) => e.revealed && id === e.weakness);
    if (weakSpell && a.mp < data.spells[weakSpell].cost) {
      const mpFoods = foods(state, data, 'mp');
      if (!foodUsed && mpFoods.length > 0) {
        cmds[a.id] = { type: 'item', itemId: mpFoods[0][0] };
        foodUsed = true;
        continue;
      }
    }
    // 術が撃てても、もやが残るなら先に たたかって払う
    if (weakSpell && a.mp >= data.spells[weakSpell].cost && mist === 0 && !silent) {
      cmds[a.id] = { type: 'spell', spellId: weakSpell };
      continue;
    }
    // 殴る技・術：たたかうより 見込みが大きい物（ボスは 明かしてから大きな技・道中の敵には 術の力の安い物だけ）
    const base = estimate(a, null, e, mist, buff);
    let best = null;
    let bestD = base * (boss ? 1.15 : 1.4);
    // 弱点の術を持つ者（主人公）は、弱点の術3回ぶんの術の力を残す（職業の技で使いきると 明かしたあと撃てない）
    const wk = boss && (a.spells ?? []).includes(e.weakness) ? (data.spells[e.weakness]?.cost ?? 0) * 3 : 0;
    for (const id of a.spells ?? []) {
      const sp = data.spells[id];
      if (!sp || !['strike', 'magic', 'yojutsu', 'iai', 'hpstrike'].includes(sp.kind) || !ready(a, data, id, Math.max(reserve, wk))) continue;
      // ボスの もやが残る間は、もやを払う技か たたかう（払わないと 弱点の術が届かない）
      if (boss && mist > 0 && !sp.clearMist) continue;
      if (sp.kind === 'yojutsu' || sp.kind === 'iai') continue; // 前の形の技（試験の古い仲間）は使わない
      if (silent && sp.kind === 'magic') continue;
      if (sp.noMist && mist > 0) continue;
      if (!boss && (sp.cost ?? 0) > 0 && (sp.big || a.mp < a.maxMp * 0.4)) continue;
      if (sp.once && !boss) continue;
      let d = estimate(a, sp, e, mist, buff);
      if (sp.clearMist && mist > 0) d += base * Math.min(mist, sp.clearMist) * 0.6; // もやを払う分の値打ち
      if (sp.stun) d *= 1.2;
      if (d > bestD) {
        best = id;
        bestD = d;
      }
    }
    if (best) {
      cmds[a.id] = { type: 'spell', spellId: best };
      if (data.spells[best].clearMist) mist = Math.max(0, mist - data.spells[best].clearMist);
      continue;
    }
    cmds[a.id] = { type: 'attack' };
    mist = Math.max(0, mist - 1);
  }
  return cmds;
}
