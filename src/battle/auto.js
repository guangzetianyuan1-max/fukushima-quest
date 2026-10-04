// 「自動」のとき、味方の行動を選ぶ。
// 語れる者：弱点が分からなければ語る。
// それ以外：弱った味方（HP4割未満）がいれば HP の道具 → 術の力が足りなければ術の道具 → もやが無ければ明かされた弱点の術 → たたかう（もやを払う）。
// 道具は1ターンに1つだけ使う。
const WEAK = 0.4;
const VERY_WEAK = 0.25;

function foods(state, data, kind) {
  return Object.entries(data.items)
    .filter(([id, it]) => it.kind === kind && (state.items[id] ?? 0) > 0)
    .sort(([, x], [, y]) => x.amount - y.amount); // 効き目の小さい順
}

// 仲間の術（src/data/companions.js）を その種類で探す。撃てる物だけ
function spellOf(a, data, kind, reserve = 0) {
  return (a.spells ?? []).find((id) => data.spells[id]?.kind === kind && a.mp >= data.spells[id].cost + reserve);
}

export function chooseCommands(state, data) {
  const cmds = {};
  const e = state.enemy;
  let foodUsed = false;
  let dazeCast = e.dazed > 1; // 化け術がまだ効いている（このターンの終わりで1減る）
  let bindCast = e.bound > 0;
  let shots = 0; // このターンに撃つ玉の数
  const boss = !e.noWeak; // 化け術・糸は昔話の主（ボス）にだけ使う＝道中の敵は殴って済ませる
  // 和尚：弱った者がいれば読経（全員）。足の速い者が先に道具を使わないよう、ここで先に決める
  const living0 = state.allies.filter((x) => x.alive);
  const needHeal = Math.min(...living0.map((x) => x.hp / x.maxHp)) < 0.5 || living0.filter((x) => x.hp / x.maxHp < 0.7).length >= 2;
  // 弱点の術を持つ者（2章 鬼婆＝如意輪の経を おぼえた僧）は、明かされたあとは ひどく弱った者が いるときだけ 読経（ふだんは 弱点の術を 射る）
  const critical = Math.min(...living0.map((x) => x.hp / x.maxHp)) < 0.35;
  const healer = needHeal && !(state.silence > 0) && living0.find((x) => !x.stunned && spellOf(x, data, 'heal') && (critical || !(e.revealed && (x.spells ?? []).includes(e.weakness))));
  if (healer) {
    cmds[healer.id] = { type: 'spell', spellId: spellOf(healer, data, 'heal') };
    foodUsed = true; // 回復は1ターンに1つ（ほかの者は道具を使わない）
  }
  // 素早い順に考える：先に動く味方が たたかえば、あとの味方の術の前に もやが晴れる
  let mist = e.mistLeft ?? 0;
  for (const a of [...state.allies].sort((x, y) => y.agi - x.agi)) {
    if (!a.alive || cmds[a.id]) continue;
    // 道中の敵（noWeak）には語らない＝明かす弱点が無いので、語ると毎ターン語り続けていた（本人 10/2「雑魚キャラでしおりが昔話を未だ語っている」）
    if (a.canTell && !e.noWeak && !e.revealed && !(state.silence > 0)) {
      cmds[a.id] = { type: 'tell' };
      continue;
    }
    const living = state.allies.filter((x) => x.alive);
    const lowest = Math.min(...living.map((x) => x.hp / x.maxHp));
    // ボスには、化け術（読経の分の術を残す）・糸車の糸を 切らさないように
    const healCost = Math.min(...(a.spells ?? []).map((id) => (data.spells[id]?.kind === 'heal' ? data.spells[id].cost : Infinity)));
    const daze0 = boss && !dazeCast && !(state.silence > 0) && spellOf(a, data, 'daze', Number.isFinite(healCost) ? healCost : 0);
    const daze = daze0 && !(data.spells[daze0].autoHurt && lowest >= data.spells[daze0].autoHurt) ? daze0 : null; // 幻の術（くノ一）は 弱った者がいるときだけ
    if (daze) {
      cmds[a.id] = { type: 'spell', spellId: daze };
      dazeCast = true;
      continue;
    }
    // 弱点の術を持つ者（2章 鬼婆＝如意輪の経を おぼえた僧）は、弱点が明かされたら 足止めより 弱点の術を先に
    const hasWeak = e.revealed && (a.spells ?? []).includes(e.weakness);
    const bind = boss && !bindCast && !hasWeak && !(state.silence > 0) && spellOf(a, data, 'bind');
    if (bind) {
      cmds[a.id] = { type: 'spell', spellId: bind };
      bindCast = true;
      continue;
    }
    // 猟師：ボスには玉があるかぎり鉄砲（道中の敵には玉を使わず たたかう）
    // 弱点が明かされる前は玉の勢いが落ち、もやが残っていれば撃てない（先に動く者が払う分は mist で数えている）
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
    const weakSpell = (a.spells ?? []).find((id) => e.revealed && id === e.weakness);
    if (weakSpell && a.mp < data.spells[weakSpell].cost) {
      const mpFoods = foods(state, data, 'mp');
      if (!foodUsed && mpFoods.length > 0) {
        cmds[a.id] = { type: 'item', itemId: mpFoods[0][0] };
        foodUsed = true;
        continue;
      }
    }
    // 武士（10/4）：弱点が明かされ もやが無ければ、弱点の術を持たないときは 居合い斬り（道中の敵には使わず 術の力を残す）
    const iai = boss && e.revealed && mist === 0 && !weakSpell && spellOf(a, data, 'iai');
    if (iai) {
      cmds[a.id] = { type: 'spell', spellId: iai };
      continue;
    }
    // くノ一（10/4 夜）：狐火の術も同じ（もやが晴れて 明かされてから・ボスだけ）
    const yoj = boss && e.revealed && mist === 0 && !weakSpell && !(state.silence > 0) && spellOf(a, data, 'yojutsu');
    if (yoj) {
      cmds[a.id] = { type: 'spell', spellId: yoj };
      continue;
    }
    // 術が撃てても、もやが残るなら先に たたかって払う
    if (weakSpell && a.mp >= data.spells[weakSpell].cost && mist === 0 && !(state.silence > 0)) {
      cmds[a.id] = { type: 'spell', spellId: weakSpell };
    } else {
      cmds[a.id] = { type: 'attack' };
      mist = Math.max(0, mist - 1);
    }
  }
  return cmds;
}
