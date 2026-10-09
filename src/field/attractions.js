// 町の催し（アトラクション）7つ＝福島グルメの判子を 景品で もらう場（10/7 本人「グルメスタンプはアトラクションの景品で」「アトラクションはもっと増やして」
//   →「新しい遊び方を少しずつ」→「柳津以外のアトラクションも全部進めて」）。柳津の縄のぼりは hadaka.js
// 題材は 10/7 ネットで 確かめた事だけ（世話役の 台詞は towns.js）。遊び方は 7つとも 違う形にした
// 計算は画面と切り離す（画面は src/scenes/attractionsUI.js）。どれも 点（pts）を 返し、点は 景品と 換える
import { exchangePrize } from './fishing.js?v=332';

// ---- 平：じゃんがら念仏踊り「打ち方まね」＝鉦（K）と太鼓（T）の 打ち方を 覚えて 真似る。合うたびに 1つ 長くなる ----
export const JANGARA_START = 3;
export const JANGARA_MAX = 12;
export function jangaraSeq(rng, n) {
  return Array.from({ length: n }, () => (rng() < 0.5 ? 'K' : 'T'));
}
// 打った所まで：'more'（続けて）／'ok'（そろった）／'miss'（ちがう）
export function jangaraJudge(seq, inputs) {
  for (let i = 0; i < inputs.length; i++) if (inputs[i] !== seq[i]) return 'miss';
  return inputs.length >= seq.length ? 'ok' : 'more';
}
// 点＝そろえられた いちばん長い打ち方（3つ＝1点・…・12＝10点＋おまけ）
export const jangaraPts = (best) => (best < JANGARA_START ? 0 : best - JANGARA_START + 1 + (best >= JANGARA_MAX ? 3 : 0));

// ---- 湯本：三函の御湯「湯加減」＝源泉（熱く）と 水（ぬるく）で、湯の 温かさを ちょうど良い 帯に 保つ ----
export const YU_TIME = 20000;
export const YU_LO = 40;
export const YU_HI = 43; // ちょうど良い（℃）
export const YU_STEP = 1.6; // 1回 さわると 変わる 温かさ
export const yuNew = (rng) => ({ temp: 41.5, drift: 0, phase: rng() * 6.28, inBand: 0, t: 0 });
// dt ミリ秒 進める：湯は 冷えたり（雪）熱く なったり（源泉の 勢い）ゆらぐ
export function yuStep(s, dt, rng) {
  const t = s.t + dt;
  const drift = 1.8 * Math.sin(t / 1300 + s.phase) + 1.2 * Math.sin(t / 470 + s.phase * 2) + (rng() - 0.5) * 0.6; // 1秒あたりの 変わり方（℃）
  const temp = Math.min(55, Math.max(28, s.temp + (drift * dt) / 1000));
  const inBand = s.inBand + (temp >= YU_LO && temp <= YU_HI ? dt : 0);
  return { ...s, t, temp, drift, inBand };
}
export const yuPress = (s, which) => ({ ...s, temp: Math.min(55, Math.max(28, s.temp + (which === 'hot' ? YU_STEP : -YU_STEP))) });
export const yuDone = (s) => s.t >= YU_TIME;
// 点＝ちょうど良かった 秒の 半分（20秒 ずっと＝10点）
export const yuPts = (s) => Math.floor(s.inBand / 2000);

// ---- 福島：わらじまつり「大わらじ担ぎ」＝担いだ 大わらじが 左右に 傾く。低い側を 押さえて（長押し）水平に 保つと 前へ 進む ----
export const WARAJI_TIME = 25000;
export const WARAJI_GOAL = 100; // 羽黒神社まで
export const WARAJI_FALL = 40; // これより 傾くと 落としかけて 止まる（度）
export const WARAJI_STUN = 1500; // 落としかけたら 担ぎ直す 間
export const WARAJI_BACK = 8; // 落としかけたら 下がる 道のり
export const warajiNew = (rng) => ({ ang: 0, vel: 0, dist: 0, t: 0, stops: 0, stun: 0, gust: rng() * 6.28 });
// hold＝'L'（左を 押さえる＝右へ 戻す力）／'R'／null
export function warajiStep(s, dt, hold, rng) {
  const t = s.t + dt;
  const k = dt / 1000;
  if (s.stun > 0) return { ...s, t, stun: Math.max(0, s.stun - dt) }; // 担ぎ直す 間は 進まない
  const push = (0.9 + 0.6 * Math.sin(t / 900 + s.gust)) * 38 + (rng() - 0.5) * 30; // 担ぎ手の 足並みの 乱れ
  let vel = s.vel + (push + s.ang * 1.6 - (hold === 'L' ? 140 : hold === 'R' ? -140 : 0)) * k * (s.ang >= 0 ? 1 : 1);
  // 傾いた側へ 倒れ込む（ang>0＝左が 下がる）
  vel *= 0.92;
  let ang = s.ang + vel * k;
  let stops = s.stops;
  if (Math.abs(ang) > WARAJI_FALL) return { ...s, t, ang: 0, vel: 0, stops: stops + 1, stun: WARAJI_STUN, dist: Math.max(0, s.dist - WARAJI_BACK) }; // 落としかけた＝担ぎ直して 少し 下がる
  const level = Math.abs(ang) < 12;
  const dist = Math.min(WARAJI_GOAL, s.dist + (level ? 9 : Math.abs(ang) < 22 ? 3 : 0) * k);
  return { ...s, t, ang, vel, dist, stops };
}
export const warajiDone = (s) => s.dist >= WARAJI_GOAL || s.t >= WARAJI_TIME;
export const warajiPts = (s) => Math.floor(s.dist / 10) + (s.dist >= WARAJI_GOAL ? 4 : 0);

// ---- 郡山：采女の伝説「花かつみ摘み」＝原に 花が 咲いては 消える。薄紫の 花かつみだけを 摘む（ほかの 花は −1） ----
export const HANA_TIME = 25000;
export const HANA_CELLS = 12; // 3列×4段
export const HANA_SHOW = 1300; // 咲いて いる 長さ
// 咲く 順番（時刻・場所・花かつみか）を 先に 決める
export function hanaPlan(rng) {
  const out = [];
  const freeAt = Array(HANA_CELLS).fill(0); // 同じ場所に 花を 重ねない（重なると 摘んだ 花が 見えて いる 花と 食い違う＝10/7 試し）
  for (let t = 600; t < HANA_TIME - 600; t += 520 + rng() * 380) {
    const free = [...Array(HANA_CELLS).keys()].filter((c) => freeAt[c] <= t);
    const cell = free[Math.floor(rng() * free.length)];
    freeAt[cell] = Math.round(t) + HANA_SHOW;
    out.push({ t: Math.round(t), cell, katsumi: rng() < 0.6 });
  }
  return out;
}
export const hanaOpen = (plan, t) => plan.filter((f) => t >= f.t && t < f.t + HANA_SHOW);
// さわった：その場所に いま 咲いて いる 花（無ければ null）
export function hanaPick(plan, picked, t, cell) {
  const f = hanaOpen(plan, t).find((x) => x.cell === cell && !picked.includes(x));
  return f ?? null;
}
export const hanaPts = (good, bad) => Math.max(0, Math.floor((good - bad) / 2));

// ---- 白河：だるま市「だるま合わせ」＝伏せた 10枚（鶴・亀・松・竹・梅 が 2枚ずつ）を 2枚ずつ めくって そろえる ----
export const DARUMA_MARKS = ['鶴', '亀', '松', '竹', '梅'];
export function darumaDeck(rng) {
  const d = [...DARUMA_MARKS, ...DARUMA_MARKS];
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return { cards: d, done: [], open: [], moves: 0 };
}
// めくる：2枚目で 合えば done へ・合わなければ 伏せ直し待ち（open に 2枚）
export function darumaFlip(s, i) {
  if (s.done.includes(i) || s.open.includes(i) || s.open.length >= 2) return { s, result: null };
  const open = [...s.open, i];
  if (open.length < 2) return { s: { ...s, open }, result: 'first' };
  const [a, b] = open;
  const moves = s.moves + 1;
  if (s.cards[a] === s.cards[b]) return { s: { ...s, open: [], done: [...s.done, a, b], moves }, result: 'match' };
  return { s: { ...s, open, moves }, result: 'miss' };
}
export const darumaHide = (s) => ({ ...s, open: [] });
export const darumaAll = (s) => s.done.length >= s.cards.length;
// 点＝少ない 手で そろえるほど 多い（5手＝10点・15手以上＝1点）
export const darumaPts = (s) => (darumaAll(s) ? Math.max(1, 10 - Math.max(0, s.moves - 5)) : 0);

// ---- 猪苗代：白鳥「白鳥かぞえ」＝湖に 白鳥が 飛んで 来る。降りた 数を 4つから 選ぶ。5回 ----
export const SWAN_ROUNDS = 5;
export function swanRound(rng, round) {
  const count = 3 + Math.floor(rng() * (4 + round * 2)); // 回が 進むほど 多く
  const flights = Array.from({ length: count }, (_, i) => ({ delay: Math.round(i * (700 - round * 80) + rng() * 300), y: 0.25 + rng() * 0.45, speed: 0.55 + rng() * 0.35, from: rng() < 0.5 ? 'L' : 'R' }));
  // 降りずに 通り過ぎる 白鳥（数えない）も 混ぜる
  const pass = Array.from({ length: Math.floor(round / 2) + 1 }, () => ({ delay: Math.round(rng() * count * 600), y: 0.1 + rng() * 0.15, speed: 1.1, from: rng() < 0.5 ? 'L' : 'R', pass: true }));
  const opts = new Set([count]);
  while (opts.size < 4) opts.add(Math.max(1, count + Math.floor(rng() * 7) - 3));
  return { count, flights: [...flights, ...pass], options: [...opts].sort((a, b) => a - b) };
}
export const swanPts = (correct) => correct * 2 + (correct >= SWAN_ROUNDS ? 2 : 0);

// ---- 会津若松：十日市「起き上がり小法師 投げ」＝力の 目盛りが 行き来する。止めた 力で 投げ、台の 上で 起き上がれば 成功。家族4人＋1つ＝5個 ----
export const KOBO_THROWS = 5;
export const KOBO_LO = 0.62;
export const KOBO_HI = 0.8; // 台の 上に 乗る 力
// 目盛り（0〜1）＝三角の 波。投げる たびに 速くなる
export function koboGauge(t, n) {
  const period = 1400 - n * 140;
  const x = (t % period) / period;
  return x < 0.5 ? x * 2 : 2 - x * 2;
}
export const koboJudge = (p) => (p < KOBO_LO ? 'short' : p > KOBO_HI ? 'over' : 'stand');
export const koboPts = (stood) => stood * 2 + (stood >= KOBO_THROWS ? 2 : 0);

// ---- 催しの 表（名前・入る 文・点の 鍵・景品）。景品の 1つめ＝その町の 名物（福島グルメの判子） ----
const common = (a, b, c) => ({
  tokujou: { kind: 'item', id: 'tokujou', n: 1, pts: a },
  goshinsui: { kind: 'item', id: 'goshinsui', n: 1, pts: b },
  kusuribako: { kind: 'item', id: 'kusuribako', n: 1, pts: c },
});
export const ATTRACTIONS = {
  jangara: { town: 'taira', name: 'じゃんがら 打ち方まね', label: 'じゃんがら点', key: 'jangaraPts', price: 15, verb: '打ち方まねに 加わる',
    prizes: { g_unikai: { kind: 'item', id: 'g_unikai', n: 1, pts: 4 }, yakusou: { kind: 'item', id: 'yakusou', n: 3, pts: 2 }, reisui: { kind: 'item', id: 'reisui', n: 1, pts: 3 } } },
  yukagen: { town: 'yumoto', name: '三函の御湯 湯加減', label: '湯加減点', key: 'yukagenPts', price: 10, verb: '湯加減を 見る',
    prizes: { g_manju: { kind: 'item', id: 'g_manju', n: 1, pts: 3 }, yakusou: { kind: 'item', id: 'yakusou', n: 3, pts: 2 }, reisui: { kind: 'item', id: 'reisui', n: 1, pts: 3 } } },
  waraji: { town: 'fukushima', name: '大わらじ 担ぎ', label: 'わらじ点', key: 'warajiPts', price: 20, verb: '大わらじを 担ぐ',
    prizes: { g_momo: { kind: 'item', id: 'g_momo', n: 1, pts: 4 }, ...common(5, 7, 10) } },
  hanakatsumi: { town: 'koriyama', name: '花かつみ 摘み', label: '花かつみ点', key: 'hanaPts', price: 20, verb: '花かつみを 摘む',
    prizes: { g_usukawa: { kind: 'item', id: 'g_usukawa', n: 1, pts: 4 }, ...common(5, 7, 10) } },
  daruma: { town: 'shirakawa', name: 'だるま 合わせ', label: 'だるま点', key: 'darumaPts', price: 20, verb: 'だるまを 合わせる',
    prizes: { g_ramen: { kind: 'item', id: 'g_ramen', n: 1, pts: 5 }, ...common(5, 7, 10) } },
  hakucho: { town: 'inawashiro', name: '白鳥 かぞえ', label: '白鳥点', key: 'hakuchoPts', price: 20, verb: '白鳥を 数える',
    prizes: { g_soba: { kind: 'item', id: 'g_soba', n: 1, pts: 5 }, ...common(5, 7, 10) } },
  kobosi: { town: 'aizuwakamatsu', name: '起き上がり小法師 投げ', label: '小法師点', key: 'koboPts', price: 20, verb: '小法師を 投げる',
    prizes: { g_kozuyu: { kind: 'item', id: 'g_kozuyu', n: 1, pts: 5 }, ...common(5, 7, 10) } },
};
export const ATTR_IDS = Object.keys(ATTRACTIONS);

export function enterAttr(game, id) {
  const A = ATTRACTIONS[id];
  if (game.mon < A.price) return { ok: false, game };
  return { ok: true, game: { ...game, mon: game.mon - A.price } };
}
export const addAttrPts = (game, id, pts) => ({ ...game, [ATTRACTIONS[id].key]: (game[ATTRACTIONS[id].key] ?? 0) + pts });
export const exchangeAttr = (id) => (game, prizeId, who = null) => exchangePrize(game, ATTRACTIONS[id].prizes[prizeId], ATTRACTIONS[id].key, who);
