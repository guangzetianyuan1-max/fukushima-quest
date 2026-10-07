// 町の催し7つの 画面（10/7・計算は src/field/attractions.js）。FieldScene の startAttr が 呼ぶ
// play(scene, box, { rng, done }) → 確かめ用の 取っ手。終わったら done(結果) を 1回だけ 呼ぶ（点の 計算と 文は FieldScene）
// 背景は Gemini の絵（ATTR_ART・届いて いれば）／無ければ 図形。部品は どれも box に 入れる（box ごと 消える）
import { GAME_FONT } from '../ui/fonts.js?v=234';
import { sfx } from '../audio/chip.js?v=234';
import * as A from '../field/attractions.js?v=234';

const W = 360;
const FONT = GAME_FONT;
const txt = (s, x, y, t, size = 18, color = '#ffffff') => s.add.text(x, y, t, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 3, align: 'center' }).setOrigin(0.5).setStroke('#1a1030', Math.max(3, size / 4));

// 背景：絵が あれば 絵・無ければ 上下 2色の ぼかし
function backdrop(s, box, id, top, bottom) {
  if (s.textures.exists(`attrbg_${id}`)) { box.add(s.add.image(0, 0, `attrbg_${id}`).setOrigin(0)); return true; }
  const g = s.add.graphics();
  g.fillGradientStyle(top, top, bottom, bottom, 1).fillRect(0, 0, W, 640);
  box.add(g);
  return false;
}
// 催しの 中の 絵（Gemini・10/7・art_src/prep_attr_parts.py）。届いて いれば 鍵・無ければ null＝図形で 描く
const P = (s, id, name) => (s.textures.exists(`attrp_${id}_${name}`) ? `attrp_${id}_${name}` : null);
// 絵を 長い 辺 size に 合わせて 置く
const pic = (s, box, key, x, y, size) => { const im = s.add.image(x, y, key); im.setScale(size / Math.max(im.width, im.height)); box.add(im); return im; };
// 押す 札（角丸）。on(pointer) は 押した 瞬間。icon＝札の 上に 置く 絵の 鍵（あれば 字は 下へ）
function pad(s, box, x, y, w, h, label, color, on, icon = null) {
  const g = s.add.graphics();
  const draw = (lit) => { g.clear(); g.fillStyle(lit ? 0xffe08a : color, 0.92).fillRoundedRect(x - w / 2, y - h / 2, w, h, 14).lineStyle(3, 0xc9a24a, 1).strokeRoundedRect(x - w / 2, y - h / 2, w, h, 14); };
  draw(false);
  box.add(g);
  if (icon) pic(s, box, icon, x, y - 10, h * 0.62);
  const t = txt(s, x, icon ? y + h / 2 - 15 : y, label, icon ? 17 : 24);
  const z = s.add.zone(x - w / 2, y - h / 2, w, h).setOrigin(0).setInteractive();
  if (on) z.on('pointerdown', on);
  box.add([t, z]);
  return { g, t, z, lit: (v) => draw(v) };
}
// 毎コマ 回す 時計（16ms）。stop() で 止まる
function ticker(s, fn) {
  const ev = s.time.addEvent({ delay: 16, loop: true, callback: fn });
  return { stop: () => ev.remove(false) };
}
const once = (done) => { let used = false; return (r) => { if (used) return; used = true; done(r); }; };

// ---- 平：じゃんがら 打ち方まね ----
function jangara(s, box, { rng, done }) {
  backdrop(s, box, 'jangara', 0x101a2a, 0x2a1a10);
  const fin = once(done);
  box.add(txt(s, W / 2, 70, '鉦と 太鼓の 打ち方を 覚えて 真似る', 18)); // 説明（⛔10/7 入れ物に 入れ忘れて 地図に 残った）
  const info = txt(s, W / 2, 110, '', 18, '#ffe9a8');
  const res = txt(s, W / 2, 300, '', 28, '#ffb040');
  let len = A.JANGARA_START;
  let best = 0;
  let seq = A.jangaraSeq(rng, len);
  let input = [];
  let phase = 'show';
  const press = (k) => {
    if (phase !== 'input') return;
    sfx(k === 'K' ? 'select' : 'hit');
    (k === 'K' ? kane : taiko).lit(true);
    s.time.delayedCall(140, () => (k === 'K' ? kane : taiko).lit(false));
    input.push(k);
    const j = A.jangaraJudge(seq, input);
    if (j === 'miss') { phase = 'end'; res.setText('ちがう！'); sfx('damage'); s.time.delayedCall(900, () => fin({ best })); return; }
    if (j === 'ok') {
      best = len; phase = 'wait'; res.setText('そろった！');
      if (len >= A.JANGARA_MAX) { sfx('win'); s.time.delayedCall(900, () => fin({ best })); return; }
      len += 1; seq = A.jangaraSeq(rng, len);
      s.time.delayedCall(800, show);
    }
  };
  const kane = pad(s, box, 95, 520, 150, 130, '鉦', 0x6a5a20, () => press('K'), P(s, 'jangara', 'kane'));
  const taiko = pad(s, box, W - 95, 520, 150, 130, '太鼓', 0x6a2020, () => press('T'), P(s, 'jangara', 'taiko'));
  box.add([info, res]);
  function show() {
    phase = 'show'; input = []; res.setText('');
    info.setText(`よく 聞いて（${len}つ）`);
    seq.forEach((k, i) => s.time.delayedCall(500 + i * 520, () => {
      sfx(k === 'K' ? 'select' : 'hit');
      const p = k === 'K' ? kane : taiko;
      p.lit(true); s.time.delayedCall(260, () => p.lit(false));
    }));
    s.time.delayedCall(500 + seq.length * 520, () => { phase = 'input'; info.setText(`さあ 打って（${len}つ）`); });
  }
  show();
  return { press, seq: () => seq, phase: () => phase };
}

// ---- 湯本：三函の御湯 湯加減 ----
function yukagen(s, box, { rng, done }) {
  backdrop(s, box, 'yukagen', 0x2a1e34, 0x4a3020);
  const fin = once(done);
  box.add(txt(s, W / 2, 70, '湯加減を ちょうど良く 保つ', 18)); // 説明（⛔10/7 入れ物に 入れ忘れて 地図に 残った）
  const info = txt(s, W / 2, 106, '', 18, '#ffe9a8');
  // 温度計（28〜55℃）・ちょうど良い 帯
  const X0 = W / 2 - 22, Y0 = 150, H0 = 330;
  const yOf = (c) => Y0 + H0 - ((c - 28) / 27) * H0;
  const g = s.add.graphics();
  g.fillStyle(0x1a1420, 0.85).fillRoundedRect(X0, Y0, 44, H0, 10);
  g.fillStyle(0x6ad08a, 0.55).fillRect(X0 + 4, yOf(A.YU_HI), 36, yOf(A.YU_LO) - yOf(A.YU_HI));
  const bar = s.add.graphics();
  const temp = txt(s, W / 2, Y0 + H0 + 28, '', 22, '#ffffff');
  box.add([g, bar, info, temp]);
  let st = A.yuNew(rng);
  let lock = 0;
  const press = (k) => { if (s.time.now < lock || A.yuDone(st)) return; lock = s.time.now + 110; st = A.yuPress(st, k); sfx(k === 'hot' ? 'flame' : 'select'); };
  pad(s, box, 95, 572, 150, 96, '源泉', 0x7a2a1a, () => press('hot'), P(s, 'yukagen', 'yuguchi'));
  pad(s, box, W - 95, 572, 150, 96, '水', 0x1a3a7a, () => press('cold'), P(s, 'yukagen', 'oke'));
  if (P(s, 'yukagen', 'yubune')) pic(s, box, P(s, 'yukagen', 'yubune'), 72, 320, 110); // 湯船（飾り）
  let last = s.time.now;
  const tk = ticker(s, () => {
    const now = s.time.now; const dt = Math.max(0, Math.min(50, now - last)); last = now; // 時計が 戻っても 逆に 進めない
    st = A.yuStep(st, dt, rng);
    const ok = st.temp >= A.YU_LO && st.temp <= A.YU_HI;
    bar.clear().fillStyle(ok ? 0x9af0b0 : st.temp > A.YU_HI ? 0xff7a5a : 0x7ab0ff, 1).fillRect(X0 + 12, yOf(st.temp), 20, Y0 + H0 - yOf(st.temp));
    temp.setText(`${st.temp.toFixed(1)}℃ ${ok ? 'ちょうど良い' : st.temp > A.YU_HI ? '熱い' : 'ぬるい'}`);
    info.setText(`ちょうど良い ${Math.floor(st.inBand / 1000)}秒　のこり ${Math.ceil((A.YU_TIME - st.t) / 1000)}秒`);
    if (A.yuDone(st)) { tk.stop(); s.time.delayedCall(600, () => fin({ st })); }
  });
  return { press, st: () => st };
}

// ---- 福島：大わらじ 担ぎ ----
function waraji(s, box, { rng, done }) {
  backdrop(s, box, 'waraji', 0x5aa0d8, 0xc8b88a);
  const fin = once(done);
  box.add(txt(s, W / 2, 64, '低い 側を 押さえて 水平に', 18)); // 説明（⛔10/7 入れ物に 入れ忘れて 地図に 残った）
  const info = txt(s, W / 2, 98, '', 18, '#ffe9a8');
  // 道のり（羽黒神社まで）
  const road = s.add.graphics();
  road.fillStyle(0x1a1420, 0.7).fillRoundedRect(30, 124, W - 60, 14, 7);
  const mark = txt(s, W - 30, 150, '羽黒神社', 13, '#ffd27a');
  if (P(s, 'waraji', 'torii')) { mark.setY(190); pic(s, box, P(s, 'waraji', 'torii'), W - 30, 162, 40); }
  const prog = s.add.graphics();
  // 大わらじ（長さ12mを 横向きに）
  const sandal = s.add.container(W / 2, 330);
  if (P(s, 'waraji', 'waraji')) { const im = s.add.image(0, 0, P(s, 'waraji', 'waraji')); im.setScale(290 / im.width); sandal.add(im); }
  else {
    const sg = s.add.graphics();
    sg.fillStyle(0xd8c070, 1).fillRoundedRect(-150, -26, 300, 52, 24).lineStyle(3, 0x8a6a2a, 1).strokeRoundedRect(-150, -26, 300, 52, 24);
    sg.lineStyle(2, 0xa8884a, 1);
    for (let x = -130; x < 140; x += 16) sg.lineBetween(x, -20, x + 8, 20);
    sg.fillStyle(0xb02020, 1).fillRect(-60, -4, 120, 8);
    sandal.add(sg);
  }
  const warn = txt(s, W / 2, 230, '', 24, '#ffb040');
  box.add([road, mark, prog, sandal, info, warn]);
  let st = A.warajiNew(rng);
  let hold = null;
  const zl = s.add.zone(0, 160, W / 2, 480).setOrigin(0).setInteractive();
  const zr = s.add.zone(W / 2, 160, W / 2, 480).setOrigin(0).setInteractive();
  const setHold = (h) => { hold = h; };
  zl.on('pointerdown', () => setHold('L')); zr.on('pointerdown', () => setHold('R'));
  for (const z of [zl, zr]) { z.on('pointerup', () => setHold(null)); z.on('pointerout', () => setHold(null)); }
  const lb = txt(s, 70, 580, '左を 押さえる', 16), rb = txt(s, W - 70, 580, '右を 押さえる', 16);
  box.add([zl, zr, lb, rb]);
  let last = s.time.now;
  let stops = 0;
  const tk = ticker(s, () => {
    const now = s.time.now; const dt = Math.max(0, Math.min(50, now - last)); last = now; // 時計が 戻っても 逆に 進めない
    st = A.warajiStep(st, dt, hold, rng);
    sandal.setAngle(-st.ang * 0.9);
    prog.clear().fillStyle(0xffd27a, 1).fillRoundedRect(32, 126, ((W - 64) * st.dist) / A.WARAJI_GOAL, 10, 5);
    if (st.stops > stops) { stops = st.stops; sfx('damage'); s.cameras.main.shake?.(160, 0.004); }
    warn.setText(st.stun > 0 ? '担ぎ直し！' : Math.abs(st.ang) > 22 ? '傾いた！' : '');
    lb.setColor(hold === 'L' ? '#ffe08a' : '#ffffff'); rb.setColor(hold === 'R' ? '#ffe08a' : '#ffffff');
    info.setText(`のこり ${Math.ceil((A.WARAJI_TIME - st.t) / 1000)}秒`);
    if (A.warajiDone(st)) { tk.stop(); zl.removeAllListeners(); zr.removeAllListeners(); if (st.dist >= A.WARAJI_GOAL) sfx('win'); s.time.delayedCall(700, () => fin({ st })); }
  });
  return { setHold, st: () => st };
}

// ---- 郡山：花かつみ 摘み ----
function hanakatsumi(s, box, { rng, done }) {
  backdrop(s, box, 'hanakatsumi', 0x8ac0e8, 0x5a8a3a);
  const fin = once(done);
  box.add(txt(s, W / 2, 64, '薄紫の 花かつみだけを 摘む', 18)); // 説明（⛔10/7 入れ物に 入れ忘れて 地図に 残った）
  const info = txt(s, W / 2, 98, '', 18, '#ffe9a8');
  const res = txt(s, W / 2, 132, '', 22, '#ffb040');
  box.add([info, res]);
  const plan = A.hanaPlan(rng);
  const picked = [];
  let good = 0; let bad = 0;
  const cx = (c) => 70 + (c % 3) * 110, cy = (c) => 210 + Math.floor(c / 3) * 105;
  const OTHER = [0xf0e060, 0xffffff, 0xe86a6a];
  const ART = P(s, 'hanakatsumi', 'katsumi') ? { katsumi: P(s, 'hanakatsumi', 'katsumi'), other: ['yellow', 'white', 'red'].map((n) => P(s, 'hanakatsumi', n)) } : null;
  const flowers = [...Array(A.HANA_CELLS).keys()].map((c) => {
    const g = s.add.graphics().setPosition(cx(c), cy(c));
    const im = ART ? s.add.image(cx(c), cy(c) - 2, ART.katsumi).setVisible(false) : null;
    const z = s.add.zone(cx(c) - 50, cy(c) - 48, 100, 96).setOrigin(0).setInteractive();
    z.on('pointerdown', () => pick(c));
    box.add([g, ...(im ? [im] : []), z]);
    if (im) g.im = im;
    return g;
  });
  const t0 = s.time.now;
  const now = () => s.time.now - t0;
  function pick(c) {
    const f = A.hanaPick(plan, picked, now(), c);
    if (!f) return;
    picked.push(f);
    if (f.katsumi) { good++; sfx('heal'); res.setText('花かつみ！'); } else { bad++; sfx('damage'); res.setText('ちがう 花'); }
    s.tweens.add({ targets: res, alpha: { from: 1, to: 0 }, duration: 500 });
  }
  const draw = () => {
    const open = A.hanaOpen(plan, now()).filter((f) => !picked.includes(f));
    flowers.forEach((g, c) => {
      g.clear();
      g.fillStyle(0x3a6a2a, 1).fillEllipse(0, 34, 70, 16);
      const f = open.find((x) => x.cell === c);
      if (g.im) g.im.setVisible(!!f);
      if (!f) return;
      if (g.im) { g.im.setTexture(f.katsumi ? ART.katsumi : ART.other[(f.t / 7) % 3 | 0]); g.im.setScale(78 / g.im.height); return; }
      const col = f.katsumi ? 0xc8a8f0 : OTHER[(f.t / 7) % 3 | 0];
      g.lineStyle(3, 0x3a7a2a, 1).lineBetween(0, 30, 0, 4);
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.fillStyle(col, 1).fillCircle(Math.cos(a) * 11, -6 + Math.sin(a) * 11, 9); }
      g.fillStyle(0xffe070, 1).fillCircle(0, -6, 6);
    });
  };
  const tk = ticker(s, () => {
    draw();
    info.setText(`摘んだ ${good}　まちがい ${bad}　のこり ${Math.ceil((A.HANA_TIME - now()) / 1000)}秒`);
    if (now() >= A.HANA_TIME) { tk.stop(); s.time.delayedCall(500, () => fin({ good, bad })); }
  });
  return { pick, plan: () => plan, now };
}

// ---- 白河：だるま 合わせ ----
function daruma(s, box, { rng, done }) {
  backdrop(s, box, 'daruma', 0x1a2a4a, 0x4a2a2a);
  const fin = once(done);
  box.add(txt(s, W / 2, 64, '伏せた だるまを 2つずつ めくって 合わせる', 16)); // 説明（⛔10/7 入れ物に 入れ忘れて 地図に 残った）
  const info = txt(s, W / 2, 98, '', 18, '#ffe9a8');
  box.add(info);
  let st = A.darumaDeck(rng);
  let lock = false;
  const TIME = 60000;
  const t0 = s.time.now;
  const cx = (i) => 48 + (i % 4) * 88, cy = (i) => 200 + Math.floor(i / 4) * 120;
  const FACE = { 鶴: 'tsuru', 亀: 'kame', 松: 'matsu', 竹: 'take', 梅: 'ume' };
  const art = !!P(s, 'daruma', 'back');
  const cards = st.cards.map((m, i) => {
    const g = s.add.graphics().setPosition(cx(i), cy(i));
    const im = art ? s.add.image(cx(i), cy(i), P(s, 'daruma', 'back')) : null;
    if (im) im.setScale(100 / im.height);
    const t = txt(s, cx(i), cy(i) + 4, '', 28, '#1a1030').setStroke('#ffffff', 0);
    const z = s.add.zone(cx(i) - 40, cy(i) - 52, 80, 104).setOrigin(0).setInteractive();
    z.on('pointerdown', () => flip(i));
    box.add([g, ...(im ? [im] : []), t, z]);
    return { g, t, im };
  });
  const paint = () => cards.forEach((c, i) => {
    const up = st.done.includes(i) || st.open.includes(i);
    c.g.clear();
    if (c.im) {
      c.im.setTexture(up ? P(s, 'daruma', FACE[st.cards[i]]) ?? P(s, 'daruma', 'back') : P(s, 'daruma', 'back')).setScale(100 / c.im.height);
      if (st.done.includes(i)) c.g.lineStyle(4, 0xffd27a, 1).strokeRoundedRect(-36, -52, 72, 104, 6); // そろった 札は 金の ふち
      c.t.setText('');
      return;
    }
    // だるまの 形：赤い 胴・白い 顔
    c.g.fillStyle(0xc02a20, 1).fillEllipse(0, 6, 76, 96).fillCircle(0, -30, 30);
    c.g.fillStyle(up ? 0xfff4e0 : 0x8a1a14, 1).fillEllipse(0, -14, 52, 42);
    if (st.done.includes(i)) c.g.lineStyle(3, 0xffd27a, 1).strokeEllipse(0, 6, 78, 98);
    c.t.setText(up ? st.cards[i] : '');
  });
  function flip(i) {
    if (lock) return;
    const r = A.darumaFlip(st, i);
    if (!r.result) return;
    st = r.s; sfx('select'); paint();
    if (r.result === 'match') { sfx('heal'); if (A.darumaAll(st)) { sfx('win'); s.time.delayedCall(800, () => fin({ st })); } }
    if (r.result === 'miss') { lock = true; s.time.delayedCall(700, () => { st = A.darumaHide(st); lock = false; paint(); }); }
  }
  // 札の 下に 何が 描かれて いるか（確かめた事：まゆ＝鶴・ひげ＝亀・耳ひげ＝松と梅・あごひげ＝竹）
  box.add(txt(s, W / 2, 470, '白河だるまの 顔には 鶴・亀・松・竹・梅', 15, '#cfd8ff'));
  paint();
  const tk = ticker(s, () => {
    const left = TIME - (s.time.now - t0);
    info.setText(`めくった 組 ${st.moves}　のこり ${Math.max(0, Math.ceil(left / 1000))}秒`);
    if (A.darumaAll(st)) tk.stop();
    else if (left <= 0) { tk.stop(); lock = true; s.time.delayedCall(400, () => fin({ st })); }
  });
  return { flip, st: () => st };
}

// ---- 猪苗代：白鳥 かぞえ ----
function hakucho(s, box, { rng, done }) {
  backdrop(s, box, 'hakucho', 0x9ac0e0, 0x3a6aa0);
  const FLAP = [P(s, 'hakucho', 'up'), P(s, 'hakucho', 'down')];
  // 羽ばたき（2コマを 交互に）・終わったら 止める
  const flap = s.time.addEvent({ delay: 170, loop: true, callback: () => swans.forEach((g) => { if (g.flap) g.setTexture(FLAP[(g.fi = (g.fi + 1) % 2)]); }) });
  const fin0 = once(done);
  const fin = (r) => { flap.remove(false); fin0(r); };
  box.add(txt(s, W / 2, 64, '湖に 降りた 白鳥を 数える', 18)); // 説明（⛔10/7 入れ物に 入れ忘れて 地図に 残った）
  const info = txt(s, W / 2, 98, '', 18, '#ffe9a8');
  const res = txt(s, W / 2, 470, '', 26, '#ffb040');
  // 湖と 奥の 霧（降りた 白鳥は 霧に 入って 見えなく なる）
  const lake = s.add.graphics();
  const MIST = 340;
  if (!s.textures.exists('attrbg_hakucho')) lake.fillStyle(0x2a5a90, 1).fillRect(0, MIST, W, 640 - MIST);
  lake.fillStyle(0xe8f0ff, 0.85).fillRect(0, MIST - 18, W, 40);
  box.add([lake, info, res]);
  let round = 0;
  let correct = 0;
  let opts = [];
  let cur = null;
  const swans = [];
  const swan = () => {
    if (FLAP[0] && FLAP[1]) {
      const im = s.add.image(0, 0, FLAP[0]);
      im.setScale(52 / Math.max(im.width, im.height));
      im.flap = true; im.fi = 0;
      box.add(im);
      swans.push(im);
      return im;
    }
    const g = s.add.graphics();
    g.fillStyle(0xffffff, 1).fillEllipse(0, 0, 30, 14).fillEllipse(-8, -6, 22, 8).fillEllipse(8, -6, 22, 8);
    g.fillStyle(0xffa020, 1).fillTriangle(15, 0, 21, -2, 15, 3);
    box.add(g);
    swans.push(g);
    return g;
  };
  function play() {
    const R = A.swanRound(rng, round);
    cur = R;
    info.setText(`${round + 1}回め / ${A.SWAN_ROUNDS}`);
    res.setText('');
    let last = 0;
    for (const f of R.flights) {
      const g = swan().setVisible(false);
      const fromX = f.from === 'L' ? -30 : W + 30;
      if (g.flap) g.setFlipX(f.from !== 'L'); // 絵は 右向き
      else g.setScale(f.from === 'L' ? 1 : -1, 1);
      const dur = 1800 / f.speed;
      last = Math.max(last, f.delay + dur);
      s.time.delayedCall(f.delay, () => {
        g.setVisible(true).setPosition(fromX, 150 + f.y * 120);
        if (f.pass) s.tweens.add({ targets: g, x: W - fromX, duration: dur });
        else s.tweens.add({ targets: g, x: W / 2 + (rng() - 0.5) * 200, y: MIST, alpha: { from: 1, to: 0.15 }, duration: dur, ease: 'Quad.easeIn' });
      });
    }
    s.time.delayedCall(last + 400, () => ask(R));
  }
  function ask(R) {
    swans.splice(0).forEach((g) => g.destroy());
    info.setText('何羽 降りた？');
    opts = R.options.map((n, i) => pad(s, box, 60 + i * 80, 560, 70, 64, String(n), 0x2a2050, () => answer(R, n)));
  }
  function answer(R, n) {
    if (!opts.length) return;
    opts.forEach((o) => [o.g, o.t, o.z].forEach((x) => x.destroy()));
    opts = [];
    const ok = n === R.count;
    if (ok) { correct++; sfx('heal'); } else sfx('damage');
    res.setText(ok ? 'あたり！' : `ちがう（${R.count}羽）`);
    round++;
    if (round >= A.SWAN_ROUNDS) s.time.delayedCall(900, () => fin({ correct }));
    else s.time.delayedCall(1100, play);
  }
  play();
  return { answer: (n) => answer(cur, n), opts: () => opts, cur: () => cur };
}

// ---- 会津若松：起き上がり小法師 投げ ----
function kobosi(s, box, { done }) {
  backdrop(s, box, 'kobosi', 0x2a1e3a, 0x6a3a2a);
  const fin = once(done);
  box.add(txt(s, W / 2, 64, '目盛りを 止めて 台へ 投げる', 18)); // 説明（⛔10/7 入れ物に 入れ忘れて 地図に 残った）
  const info = txt(s, W / 2, 98, '', 18, '#ffe9a8');
  const res = txt(s, W / 2, 200, '', 26, '#ffb040');
  // 台（右）・投げる所（左）
  const TABLE_X0 = 220, TABLE_X1 = 320, TABLE_Y = 420;
  const g = s.add.graphics();
  if (P(s, 'kobosi', 'dai')) { const im = s.add.image((TABLE_X0 + TABLE_X1) / 2, TABLE_Y - 2, P(s, 'kobosi', 'dai')).setOrigin(0.5, 0); im.setScale((TABLE_X1 - TABLE_X0 + 16) / im.width); box.add(im); }
  else g.fillStyle(0x6a4020, 1).fillRect(TABLE_X0, TABLE_Y, TABLE_X1 - TABLE_X0, 14).fillRect(TABLE_X0 + 6, TABLE_Y + 14, 10, 80).fillRect(TABLE_X1 - 16, TABLE_Y + 14, 10, 80);
  g.fillStyle(0x3a2a1a, 1).fillRect(0, 508, W, 132);
  // 力の 目盛り
  const GX = 40, GW = W - 80, GY = 560;
  g.fillStyle(0x1a1420, 0.9).fillRoundedRect(GX, GY, GW, 22, 8);
  g.fillStyle(0x6ad08a, 0.8).fillRect(GX + GW * A.KOBO_LO, GY, GW * (A.KOBO_HI - A.KOBO_LO), 22);
  const needle = s.add.rectangle(GX, GY + 11, 5, 34, 0xffffff);
  box.add([g, needle, info, res]);
  const doll = () => {
    const d = s.add.container(50, 490);
    if (P(s, 'kobosi', 'doll')) { const im = s.add.image(0, -6, P(s, 'kobosi', 'doll')); im.setScale(40 / im.height); d.add(im); }
    else {
      const dg = s.add.graphics();
      dg.fillStyle(0xc02a20, 1).fillEllipse(0, 0, 22, 26).fillCircle(0, -14, 9);
      dg.fillStyle(0xfff4e0, 1).fillCircle(0, -14, 6);
      d.add(dg);
    }
    box.add(d);
    return d;
  };
  let n = 0;
  let stood = 0;
  let t0 = s.time.now;
  let busy = false;
  const throwNow = () => {
    if (busy || n >= A.KOBO_THROWS) return;
    busy = true;
    const p = A.koboGauge(s.time.now - t0, n);
    const j = A.koboJudge(p);
    const d = doll();
    const tx = j === 'stand' ? TABLE_X0 + 18 + stood * 18 : j === 'short' ? 60 + p * 220 : W + 40;
    const ty = j === 'stand' ? TABLE_Y - 13 : j === 'short' ? 497 : 300;
    sfx('attack');
    s.tweens.add({ targets: d, x: tx, duration: 650, ease: 'Linear' });
    s.tweens.add({ targets: d, y: { from: 490, to: 240 }, duration: 325, ease: 'Quad.easeOut', yoyo: false, onComplete: () => s.tweens.add({ targets: d, y: ty, duration: 325, ease: 'Quad.easeIn' }) });
    s.tweens.add({ targets: d, angle: 540, duration: 650 });
    s.time.delayedCall(700, () => {
      if (j === 'stand') {
        stood++; d.setAngle(-40);
        s.tweens.add({ targets: d, angle: { from: -40, to: 0 }, duration: 500, ease: 'Back.easeOut' }); // 起き上がる
        sfx('heal'); res.setText('起き上がった！');
      } else { d.setAngle(90); sfx('damage'); res.setText(j === 'short' ? '届かない' : '飛びすぎ'); }
      n++; busy = false; t0 = s.time.now;
      if (n >= A.KOBO_THROWS) s.time.delayedCall(900, () => fin({ stood }));
    });
  };
  const z = s.add.zone(0, 120, W, 520).setOrigin(0).setInteractive();
  z.on('pointerdown', throwNow);
  box.add(z);
  const tk = ticker(s, () => {
    if (n >= A.KOBO_THROWS) { tk.stop(); return; }
    if (!busy) needle.x = GX + GW * A.koboGauge(s.time.now - t0, n); // 投げて いる 間は 止めた 所の まま
    info.setText(`投げた ${n} / ${A.KOBO_THROWS}（家族4人＋1つ）　起きた ${stood}`);
  });
  return { throwNow };
}

export const ATTR_PLAY = { jangara, yukagen, waraji, hanakatsumi, daruma, hakucho, kobosi };

// 画面の 字（字体の 読み込みに 渡す）
export const ATTR_TEXT = '鉦と太鼓の打ち方を覚えて真似るよく聞いてさあ打ってそろったちがう湯加減をちょうど良く保つ源泉水℃ちょうど良い熱いぬるいのこり秒低い側を押さえて水平に羽黒神社担ぎ直し傾いた左右を押さえる薄紫の花かつみだけを摘む摘んだまちがい花伏せただるまを2つずつめくって合わせるめくった組白河だるまの顔には鶴亀松竹梅湖に降りた白鳥を数える何羽降りたあたり回め目盛りを止めて台へ投げる投げた家族4人＋1つ起きた起き上がった届かない飛びすぎ';
