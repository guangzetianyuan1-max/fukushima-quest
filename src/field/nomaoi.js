// 相馬野馬追の神旗争奪戦（本人 10/3「相馬野馬追いのアトラクションを付けて欲しい。小名浜の釣りのような」→ 神旗争奪戦・雲雀ヶ原の祭場地を地図に置く）
// 確かめた事（南相馬市・観光の頁）：本祭りの会場は雲雀ヶ原祭場地（原町区）。甲冑競馬と、花火で打ち上げた神旗を騎馬武者が奪い合う神旗争奪戦
// ⛔祭りの日取りは書かない（近年 変わった）
// 遊び方（画面は FieldScene の nomaoi*）：花火で上がった旗が ゆらゆら落ちてくる → 旅の者の馬を左右に走らせ、ほかの騎馬武者より先に受け取る
// 旗の色：赤・青＝1点／金＝3点（金はゲームの作り。めったに上がらず、速く落ちる）。取った旗の点＝「旗点」→ 世話役が景品と換える
// 画面と切り離す＝Node で試験する。ここの関数は game も race も書き換えずに新しい物を返す
import { exchangePrize } from './fishing.js?v=212';

export const ENTRY_PRICE = 10;
export const ROUND_MS = 30000;
// 位置は 0（左の端）〜1（右の端）。速さは 1秒に走る幅
export const HORSE_SPEED = 0.62;
export const RIVAL_SPEED = [0.22, 0.26, 0.3];
// ほかの騎馬が旗に気づくのは、旗が この進みまで落ちてから（旅の者は花火の時から見える＝先に動ける）
export const NOTICE_P = 0.45;
// 騎馬は旗を取ると、それぞれの持ち場（左の端・右の端・まん中）へ戻る
export const RIVAL_HOME = [0.06, 0.94, 0.5];
// 旗が騎馬の高さまで落ちてきた所（落ちる進み 0〜1 のうち CATCH_P から先）で、CATCH_W より近い騎馬が取る
export const CATCH_P = 0.82;
export const CATCH_W = 0.075;
export const RIVAL_CATCH_W = 0.05; // ほかの騎馬は 手が届く幅が せまい
// ほかの騎馬は 旗の真下から少しずれて待つ（真下に入った旅の者が勝てる）
export const RIVAL_AIM = [0.03, -0.03, 0.025];
export const SWAY = 0.035;
// 花火の間（ミリ秒）と、最後の花火は終わりの何ミリ秒前まで
export const SHOT_GAP = [1500, 2300];
export const LAST_SHOT_BEFORE_END = 4500;

export const FLAGS = {
  aka: { name: '赤の 神旗', w: 45, pt: 1, color: 0xd83030, fall: [3600, 4800] },
  ao: { name: '青の 神旗', w: 45, pt: 1, color: 0x3060d8, fall: [3600, 4800] },
  kin: { name: '金の 神旗', w: 10, pt: 3, color: 0xffcc33, fall: [2600, 3200] },
};

function rollFlag(rng) {
  const total = Object.values(FLAGS).reduce((n, f) => n + f.w, 0);
  let r = rng() * total;
  for (const [id, f] of Object.entries(FLAGS)) {
    r -= f.w;
    if (r < 0) return id;
  }
  return 'aka';
}

// 1回ぶんの旗の予定：花火ごとに旗が1本（ときどき2本）
export function planFlags(rng) {
  const flags = [];
  let t = 1200;
  while (t <= ROUND_MS - LAST_SHOT_BEFORE_END) {
    const n = rng() < 0.25 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const kind = rollFlag(rng);
      const [a, b] = FLAGS[kind].fall;
      flags.push({ id: flags.length, kind, x0: 0.1 + rng() * 0.8, t0: t, fall: a + rng() * (b - a), phase: rng() * Math.PI * 2, state: 'wait', by: null });
    }
    t += SHOT_GAP[0] + rng() * (SHOT_GAP[1] - SHOT_GAP[0]);
  }
  return flags;
}

export function newRace(rng) {
  return { t: 0, horse: 0.5, rivals: RIVAL_HOME.map((x) => x), flags: planFlags(rng), mine: [], done: false };
}

const clamp = (v) => Math.max(0, Math.min(1, v));
// 落ちる進み（0＝花火の所・1＝地面）
export const fallP = (f, t) => (t - f.t0) / f.fall;
// 旗の左右の位置（風で ゆらゆら）
export const flagX = (f, t) => clamp(f.x0 + SWAY * Math.sin(((t - f.t0) / 1800) * Math.PI * 2 + f.phase));

// ほかの騎馬武者：間に合う旗のうち いちばん早く降りてくる旗へ向かう
function rivalTarget(race, x, speed, home, aim) {
  let best = null;
  for (const f of race.flags) {
    if (f.state !== 'fall' || fallP(f, race.t) < NOTICE_P) continue;
    const left = (1 - fallP(f, race.t)) * f.fall;
    const need = (Math.abs(flagX(f, race.t) - x) / speed) * 1000;
    if (need <= left && (!best || left < best.left)) best = { f, left };
  }
  return best ? flagX(best.f, race.t) + aim : home;
}

const toward = (x, target, step) => (Math.abs(target - x) <= step ? target : x + Math.sign(target - x) * step);

// dt ミリ秒すすめる。move＝-1（左）・0・1（右）。出来事 events＝launch（花火）／catch（who＝'me' か 騎馬の番号）／land（地面に落ちた）
export function stepRace(race, dt, move) {
  if (race.done) return { race, events: [] };
  const t = Math.min(ROUND_MS, race.t + dt);
  const sec = dt / 1000;
  const horse = clamp(race.horse + Math.sign(move) * HORSE_SPEED * sec);
  const r0 = { ...race, t };
  const rivals = race.rivals.map((x, i) => clamp(toward(x, rivalTarget(r0, x, RIVAL_SPEED[i], RIVAL_HOME[i], RIVAL_AIM[i]), RIVAL_SPEED[i] * sec)));
  const events = [];
  const mine = [...race.mine];
  const flags = race.flags.map((f) => {
    if (f.state === 'wait' && t >= f.t0) {
      events.push({ type: 'launch', flag: f.id });
      f = { ...f, state: 'fall' };
    }
    if (f.state !== 'fall') return f;
    const p = fallP(f, t);
    if (p >= CATCH_P) {
      const fx = flagX(f, t);
      // 近い騎馬が取る。同じ近さなら旅の者
      const riders = [['me', horse], ...rivals.map((x, i) => [i, x])].map(([who, x]) => ({ who, d: Math.abs(x - fx) })).filter((r) => r.d < (r.who === 'me' ? CATCH_W : RIVAL_CATCH_W));
      if (riders.length) {
        riders.sort((a, b) => a.d - b.d || (a.who === 'me' ? -1 : 1));
        const who = riders[0].who;
        events.push({ type: 'catch', flag: f.id, who });
        if (who === 'me') mine.push(f.kind);
        return { ...f, state: 'taken', by: who };
      }
    }
    if (p >= 1) {
      events.push({ type: 'land', flag: f.id });
      return { ...f, state: 'land' };
    }
    return f;
  });
  return { race: { t, horse, rivals, flags, mine, done: t >= ROUND_MS }, events };
}

export const racePts = (race) => race.mine.reduce((n, k) => n + FLAGS[k].pt, 0);

// 祭場地に入る（世話役に入場料を払う）
export function enterRace(game) {
  if (game.mon < ENTRY_PRICE) return { ok: false, game };
  return { ok: true, game: { ...game, mon: game.mon - ENTRY_PRICE } };
}

// 取った旗を 旗点と 旗の帳面に足す
export function addFlags(game, kinds) {
  const book = { ...(game.flagBook ?? {}) };
  for (const k of kinds) book[k] = (book[k] ?? 0) + 1;
  return { ...game, flagPts: (game.flagPts ?? 0) + kinds.reduce((n, k) => n + FLAGS[k].pt, 0), flagBook: book };
}

// 景品＝どれも戦いで効く物。陣羽織は ここでしか手に入らない
export const FLAG_PRIZES = {
  g_hokki: { kind: 'item', id: 'g_hokki', n: 1, pts: 3 }, // 10/7 相馬の名物＝グルメの判子
  reisui: { kind: 'item', id: 'reisui', n: 1, pts: 3 },
  tama: { kind: 'item', id: 'tama', n: 3, pts: 4 },
  jouyakusou: { kind: 'item', id: 'jouyakusou', n: 1, pts: 4 },
  sake: { kind: 'item', id: 'sake', n: 1, pts: 7 },
  kachimori: { kind: 'equip', id: 'kachimori', pts: 8 },
  jinbaori: { kind: 'equip', id: 'jinbaori', pts: 25 },
};

export const exchangeFlag = (game, prizeId, who = null) => exchangePrize(game, FLAG_PRIZES[prizeId], 'flagPts', who);
