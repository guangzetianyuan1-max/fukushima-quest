// 黒脛巾組の試し「影渡り」（2章・本人 10/4 夜「しおりが弱すぎる。女くノ一として、途中クエストを受け変身」→ 忍びの試し・遊び）
// 城の庭に 灯りの帯が LANES 本。帯と帯のあいだは 塀の影（見つからない）。見張りの灯りが 帯の上を 左右に ゆれている
// さわると しおりが 次の影へ 走る（DASH_MS）。走っている間に 足もとの帯を 灯りが 照らしたら「見つかった」＝1つ前の影へ戻される
// 見つかるのは STRIKES 回まで。TIME_MS のうちに 奥の巻物まで渡りきれば 合格
// 計算は画面と切り離す（画面は FieldScene の startKagewatari）
export const LANES = 7;
export const DASH_MS = 260; // 影から影へ 走る時間
export const STRIKES = 3; // 3回 見つかったら 出直し
export const TIME_MS = 45000;
export const STUN_MS = 700; // 見つかって 戻された あと 動けない時間
export const COL_X = 0.5; // しおりの走る 筋（画面の幅の割合）

// 帯ごとの見張りの灯り：x(t)＝中心 + 振れ幅×sin(2πt/周期 + ずれ)・照らす幅は half（どれも画面の幅の割合）
export function planLanes(rng) {
  return Array.from({ length: LANES }, (_, i) => ({
    period: 2200 + rng() * 1400 - i * 60, // 奥ほど 少し速い
    phase: rng() * Math.PI * 2,
    amp: 0.32 + rng() * 0.08,
    half: 0.09 + i * 0.006 + rng() * 0.02, // 奥ほど 少し広い
  }));
}

export const beamX = (lane, t) => 0.5 + lane.amp * Math.sin((2 * Math.PI * t) / lane.period + lane.phase);
export const lit = (lane, t, x = COL_X) => Math.abs(beamX(lane, t) - x) <= lane.half;
// t から DASH_MS のあいだ ずっと 照らされないか（走り抜けられるか）
export function clearFor(lane, t, ms = DASH_MS, step = 20) {
  for (let u = 0; u <= ms; u += step) if (lit(lane, t + u)) return false;
  return true;
}

// at＝いまいる影（0＝始めの影・LANES＝奥の巻物）。dashFrom＝走りはじめた時刻（走っていなければ null）
export function newRun(rng) {
  return { lanes: planLanes(rng), at: 0, found: 0, dashFrom: null, stunTill: 0, done: false, failed: false };
}

// さわった：走れるなら走りはじめる
export function tapRun(run, t) {
  if (run.done || run.failed || run.dashFrom != null || t < run.stunTill) return { run, result: 'busy' };
  return { run: { ...run, dashFrom: t }, result: 'dash' };
}

// 時刻 t まで進める：走っている間に 足もとの帯が照らされたら 見つかる／走りきれば 次の影へ
export function stepRun(run, t) {
  if (run.done || run.failed) return { run, result: null };
  if (t >= TIME_MS) return { run: { ...run, failed: true, dashFrom: null }, result: 'timeup' };
  if (run.dashFrom == null) return { run, result: null };
  const lane = run.lanes[run.at];
  const until = Math.min(t, run.dashFrom + DASH_MS);
  for (let u = run.dashFrom; u <= until; u += 20) {
    if (lit(lane, u)) {
      const found = run.found + 1;
      return { run: { ...run, found, dashFrom: null, at: Math.max(0, run.at - 1), stunTill: u + STUN_MS, failed: found >= STRIKES }, result: 'found' };
    }
  }
  if (t < run.dashFrom + DASH_MS) return { run, result: null };
  const at = run.at + 1;
  return { run: { ...run, at, dashFrom: null, done: at >= LANES }, result: at >= LANES ? 'done' : 'safe' };
}

// 走っている しおりの位置（0〜LANES・画面の側で使う）
export function runPos(run, t) {
  if (run.dashFrom == null) return run.at;
  return run.at + Math.min(1, (t - run.dashFrom) / DASH_MS);
}

// 合格したとき：くノ一になる。武器は 苦無（頭から もらう）＝薙刀の系統は 半値で引き取り
export function becomeKunoichi(game, equipTable) {
  const equip = { ...(game.equip ?? {}) };
  const me = { weapon: null, armor: null, charm: null, ...(equip.shiori ?? {}) };
  const old = me.weapon;
  const refund = old && equipTable[old]?.retire === 'kunoichi' ? Math.floor(equipTable[old].price / 2) : 0;
  equip.shiori = { ...me, weapon: 'kunai' };
  return { game: { ...game, equip, mon: game.mon + refund, flags: { ...game.flags, kunoichi: true } }, old, refund };
}
