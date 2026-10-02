// 昔のゲーム機ふうの音。Web Audio で波形から作る（音のファイルは使わない）。
// ブラウザの決まりで、画面を一度さわるまで音は出せない＝さわった時に unlock() を呼ぶ。

let ctx = null;
let master = null;
let muted = false;
let bgmTimer = null;

const VOLUME = 0.25;
const N = (midi) => 440 * 2 ** ((midi - 69) / 12); // 音の高さ（MIDI番号 → 周波数）

export function unlock() {
  if (ctx) {
    if (ctx.state !== 'running') ctx.resume?.().catch(() => {}); // iPhone は 'interrupted' のことも
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : VOLUME;
  master.connect(ctx.destination);
  // iPhone は、さわった瞬間に何か1つ鳴らさないと音の出口が開かないことがある＝無音を1つ鳴らす
  const silent = ctx.createBuffer(1, 1, ctx.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = silent;
  src.connect(ctx.destination);
  src.start(0);
  if (ctx.state === 'suspended') ctx.resume();
}

// 語りの声（紙芝居）。音のファイルを読み込んで流し、終わったら長さ（秒）を返す。止められる
let voiceSrc = null;
let voiceAnalyser = null;
const voiceBuf = new Float32Array(1024);
const voiceCache = new Map();
// いま流れている語りの声の大きさ（0〜1）。3Dしおりの口を動かすのに使う
export function voiceLevel() {
  if (!voiceSrc || !voiceAnalyser) return 0;
  voiceAnalyser.getFloatTimeDomainData(voiceBuf);
  let s = 0;
  for (const v of voiceBuf) s += v * v;
  return Math.sqrt(s / voiceBuf.length);
}
// onStart(秒)＝鳴りはじめた時に声の長さを知らせる（紙芝居の安全弁をその長さに合わせる）
export async function playVoice(url, onStart) {
  if (!ctx) return 0;
  try {
    if (!voiceCache.has(url)) voiceCache.set(url, fetch(url).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)));
    const audio = await voiceCache.get(url);
    stopVoice();
    const src = ctx.createBufferSource();
    src.buffer = audio;
    const g = ctx.createGain();
    g.gain.value = muted ? 0 : 1.0;
    voiceAnalyser = ctx.createAnalyser();
    voiceAnalyser.fftSize = 1024;
    src.connect(g);
    g.connect(voiceAnalyser);
    voiceAnalyser.connect(ctx.destination);
    if (master) master.gain.value = muted ? 0 : VOLUME * 0.6; // 語りの間は曲を少し小さく（10/2 35%では聞こえなかった）
    voiceSrc = src;
    src.start();
    onStart?.(audio.duration);
    return await new Promise((res) => { src.onended = () => { if (voiceSrc === src) restoreBgm(); res(audio.duration); }; });
  } catch (e) {
    return 0; // 読めない・まだ録っていない＝声なしで進む
  }
}

export function stopVoice() {
  if (voiceSrc) {
    const s = voiceSrc;
    voiceSrc = null;
    try { s.stop(); } catch (e) { /* もう止まっている */ }
  }
  restoreBgm();
}

function restoreBgm() {
  if (master) master.gain.value = muted ? 0 : VOLUME;
}

export function isUnlocked() {
  return ctx !== null;
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : VOLUME;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, start, dur, { type = 'square', vol = 0.3, slideTo = null } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(g).connect(master);
  o.start(start);
  o.stop(start + dur + 0.02);
}

function noise(start, dur, { vol = 0.3, from = 4000, to = 400 } = {}) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(from, start);
  f.frequency.exponentialRampToValueAtTime(to, start + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  src.connect(f).connect(g).connect(master);
  src.start(start);
}

// 弦をはじく音（琵琶）：のこぎり波を、明るい所から暗い所へ閉じていく窓に通す。
// はじいた瞬間だけ少し高く入って本来の高さへ落ちる＝撥（ばち）で弾いた「ビィン」。bend で押し手（あとから高さを上げる）
function pluck(freq, start, dur, { vol = 0.3, bend = null } = {}) {
  const o = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(freq * 1.03, start);
  o.frequency.exponentialRampToValueAtTime(freq, start + 0.05);
  if (bend) {
    o.frequency.setValueAtTime(freq, start + dur * 0.35);
    o.frequency.exponentialRampToValueAtTime(bend, start + dur * 0.6);
  }
  f.type = 'lowpass';
  f.Q.value = 6; // 少し鳴きを立てる＝さわりの響き
  f.frequency.setValueAtTime(4000, start);
  f.frequency.exponentialRampToValueAtTime(500, start + dur);
  g.gain.setValueAtTime(0.001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.004);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(f).connect(g).connect(master);
  o.start(start);
  o.stop(start + dur + 0.02);
}

// 撥で弦をかき鳴らす：低い弦から高い弦へ、ほぼ同時に
const strum = (notes, t, vol) => {
  noise(t, 0.04, { vol: vol * 0.8, from: 5000, to: 1500 }); // 撥が弦を打つ音
  notes.forEach((m, i) => pluck(N(m), t + i * 0.03, 1.6, { vol }));
};

const arp = (notes, t, step, dur, opts) => notes.forEach((m, i) => tone(N(m), t + i * step, dur, opts));

// 効果音。名前は rules.js の log の sfx と、画面の effect から呼ぶ
const SFX = {
  select: (t) => tone(N(84), t, 0.05, { vol: 0.18 }),
  attack: (t) => noise(t, 0.12, { vol: 0.35, from: 6000, to: 800 }),
  hit: (t) => tone(N(52), t, 0.16, { vol: 0.35, slideTo: N(40) }),
  // 鉄砲「パーン」（本人 10/2）：はじける破裂音（高い音から急に落ちる雑音）＋低いドン＋山にこだまする残り
  gun: (t) => {
    noise(t, 0.05, { vol: 0.7, from: 9000, to: 2500 });
    noise(t + 0.02, 0.4, { vol: 0.45, from: 2500, to: 150 });
    tone(N(33), t, 0.18, { type: 'square', vol: 0.35, slideTo: N(21) });
    noise(t + 0.28, 0.35, { vol: 0.08, from: 1200, to: 200 });
  },
  bite: (t) => { noise(t, 0.08, { vol: 0.3, from: 3000, to: 600 }); tone(N(40), t, 0.12, { vol: 0.2, slideTo: N(52) }); },
  damage: (t) => { noise(t, 0.2, { vol: 0.4, from: 2000, to: 200 }); tone(N(45), t, 0.2, { vol: 0.22, slideTo: N(33) }); },
  flame: (t) => noise(t, 0.7, { vol: 0.35, from: 600, to: 3500 }),
  // もやが晴れる：高い所へ ふわっと抜ける
  clear: (t) => { noise(t, 0.25, { vol: 0.2, from: 1500, to: 9000 }); tone(N(88), t + 0.05, 0.2, { type: 'sine', vol: 0.12 }); },
  // 荒波：低い所から高い所へ、ザザーッと寄せて引く
  wave: (t) => { noise(t, 0.5, { vol: 0.35, from: 300, to: 2500 }); noise(t + 0.45, 0.6, { vol: 0.25, from: 2500, to: 300 }); },
  // 電気ショック：高い音をジジジと細かく震わせる
  shock: (t) => { for (let i = 0; i < 8; i++) tone(N(i % 2 ? 96 : 91), t + i * 0.05, 0.05, { vol: 0.2 }); noise(t, 0.45, { vol: 0.25, from: 9000, to: 3000 }); },
  // 鉄砲水：低いゴーッという地鳴りが押し寄せ、ドッと砕ける
  flood: (t) => { noise(t, 0.9, { vol: 0.4, from: 200, to: 1200 }); tone(N(31), t, 0.9, { type: 'triangle', vol: 0.3, slideTo: N(36) }); noise(t + 0.8, 0.5, { vol: 0.35, from: 3000, to: 300 }); },
  spell: (t) => arp([72, 76, 79, 84], t, 0.06, 0.12, { type: 'triangle', vol: 0.3 }),
  tell: (t) => arp([79, 74], t, 0.18, 0.45, { type: 'sine', vol: 0.25 }),
  reveal: (t) => arp([84, 88, 91, 96], t, 0.09, 0.5, { type: 'sine', vol: 0.22 }),
  heal: (t) => arp([67, 71, 74, 79], t, 0.07, 0.15, { type: 'triangle', vol: 0.28 }),
  eat: (t) => arp([76, 72, 76, 72], t, 0.08, 0.07, { type: 'square', vol: 0.15 }), // もぐもぐ
  flee: (t) => arp([72, 67, 60], t, 0.07, 0.08, { vol: 0.2 }),
  down: (t) => tone(N(60), t, 0.5, { type: 'triangle', vol: 0.3, slideTo: N(36) }),
  win: (t) => {
    arp([74, 78, 81], t, 0.12, 0.12, { vol: 0.25 });
    tone(N(86), t + 0.36, 1.2, { vol: 0.25 });
    arp([50, 54, 57], t, 0.12, 0.12, { type: 'triangle', vol: 0.3 });
    tone(N(38), t + 0.36, 1.2, { type: 'triangle', vol: 0.3 });
  },
  // 琵琶：弁天さまが現れるとき（本人 10/1「登場時に、琵琶の音を入れて欲しい」）。都節（レ・ミ♭・ソ・ラ・シ♭）でかき鳴らし→ひと節
  biwa: (t) => {
    strum([50, 57, 62, 69], t, 0.16);
    pluck(N(74), t + 0.8, 1.0, { vol: 0.22 });
    pluck(N(75), t + 1.2, 1.1, { vol: 0.2, bend: N(77) }); // 押し手でミ♭からファへ
    pluck(N(70), t + 1.9, 0.8, { vol: 0.2 });
    pluck(N(69), t + 2.25, 1.4, { vol: 0.2 });
    strum([45, 50, 57, 62], t + 2.9, 0.14);
  },
  lose: (t) => arp([74, 70, 67, 62], t, 0.35, 0.6, { type: 'triangle', vol: 0.3 }),
};

export const SFX_NAMES = Object.keys(SFX);

export function sfx(name) {
  if (!ctx || !SFX[name]) return;
  SFX[name](ctx.currentTime + 0.01);
}

// ---- 曲 ----
// [音, 8分音符いくつ]。null は休み。8小節（8分音符64個）で1周して繰り返す
// 戦いの曲：都節の音階（レ・ミ♭・ソ・ラ・シ♭）で少し怪しく
const BATTLE_LEAD = [
  [86, 2], [82, 1], [81, 1], [79, 2], [81, 2],
  [82, 1], [81, 1], [79, 1], [75, 1], [74, 4],
  [74, 1], [75, 1], [79, 1], [81, 1], [82, 2], [86, 2],
  [81, 2], [79, 2], [75, 2], [74, 2],
  [79, 1], [81, 1], [82, 2], [86, 3], [82, 1],
  [81, 2], [79, 2], [81, 4],
  [74, 1], [75, 1], [74, 1], [70, 1], [74, 2], [79, 2],
  [75, 6], [null, 2],
];
// 始まりの曲：陽音階（レ・ミ・ソ・ラ・シ）で、ゆったり懐かしく（本人 10/1「さわってはじめる、から音楽が欲しい」）
const TITLE_LEAD = [
  [74, 4], [76, 2], [79, 2],
  [81, 6], [79, 2],
  [76, 4], [74, 2], [71, 2],
  [74, 8],
  [79, 4], [81, 2], [83, 2],
  [86, 6], [83, 2],
  [81, 2], [79, 2], [76, 2], [74, 2],
  [74, 8],
];

// 紙芝居の曲：ゆっくり・小さく・三角波だけ（本人 10/2「昔話の間、BGMは変えて欲しい。静かめで」）。語りの声の下で邪魔をしない
const STORY_LEAD = [
  [74, 6], [72, 2], [69, 8],
  [67, 4], [69, 4], [72, 8],
  [74, 6], [76, 2], [74, 8],
  [69, 4], [67, 4], [69, 8],
];

const TRACKS = {
  battle: {
    lead: BATTLE_LEAD, tempo: 132, leadType: 'square', leadVol: 0.1,
    // 低音は8分で刻み、表拍に小さく打つ音
    bass(t0, eighth) {
      [38, 38, 34, 38, 34, 31, 38, 33].forEach((r, bar) => {
        [r, r, r + 12, r, r, r, r + 12, r].forEach((m, i) => {
          const s = t0 + (bar * 8 + i) * eighth;
          tone(N(m), s, eighth * 0.8, { type: 'triangle', vol: 0.22 });
          if (i % 2 === 0) noise(s, 0.03, { vol: 0.05, from: 8000, to: 5000 });
        });
      });
    },
  },
  story: {
    // ⚠10/2 本人「昔話中のBGMが聞こえない」＝旋律0.07（戦いの曲の約4割）×声の間35%で約7分の1・低音は73Hz（スマホで鳴らない）だった
    // ⇒ 題の曲と同じ大きさ（0.16）・低音は1オクターブ上（146Hz〜）・声の間は60%（playVoice）
    lead: STORY_LEAD, tempo: 60, leadType: 'triangle', leadVol: 0.16,
    // 低音は2小節に1つ、長く のばすだけ
    bass(t0, eighth) {
      [50, 48, 45, 50].forEach((r, i) => {
        tone(N(r), t0 + i * 16 * eighth, eighth * 15, { type: 'triangle', vol: 0.12 });
      });
    },
  },
  title: {
    lead: TITLE_LEAD, tempo: 84, leadType: 'triangle', leadVol: 0.16,
    // 低音は1小節に2つだけ、長くのばす
    bass(t0, eighth) {
      [50, 50, 43, 45, 43, 50, 45, 50].forEach((r, bar) => {
        [r, r + 7].forEach((m, i) => {
          tone(N(m - 12), t0 + (bar * 8 + i * 4) * eighth, eighth * 3.6, { type: 'triangle', vol: 0.18 });
        });
      });
    },
  },
};
export const TRACK_NAMES = Object.keys(TRACKS);
const LOOP_EIGHTHS = 64;
// 試験用：曲の旋律の長さ（8分音符の数）。64 でないと繰り返しの継ぎ目がずれる
export const leadEighths = (name) => TRACKS[name].lead.reduce((sum, [, len]) => sum + len, 0);

function scheduleLoop(track, t0) {
  const eighth = 60 / track.tempo / 2;
  let t = t0;
  for (const [m, len] of track.lead) {
    if (m !== null) tone(N(m), t, len * eighth * 0.9, { type: track.leadType, vol: track.leadVol });
    t += len * eighth;
  }
  track.bass(t0, eighth);
}

// name ＝ 'battle'（戦い）／'title'（始まり）。鳴っている曲があれば止めてから鳴らす
export function startBgm(name = 'battle') {
  if (!ctx) return;
  if (bgmTimer) stopBgm();
  const track = TRACKS[name];
  const loopLen = LOOP_EIGHTHS * (60 / track.tempo / 2);
  let next = ctx.currentTime + 0.1;
  scheduleLoop(track, next);
  next += loopLen;
  // 次の1周を、今の周が終わる少し前に予約しておく
  bgmTimer = setInterval(() => {
    if (next - ctx.currentTime < 1.0) {
      scheduleLoop(track, next);
      next += loopLen;
    }
  }, 250);
}

// 1回だけ鳴らす短い曲。join＝仲間が加わったとき（本人 10/3「仲間が加わったとき、フリーズと短めの音楽を流してほしい」）
// 明るい長調のファンファーレ・3.2秒。鳴っている曲は止める（戻すのは呼んだ側）
const JINGLES = {
  join: {
    tempo: 150,
    lead: [[67, 1], [67, 1], [67, 1], [72, 3], [null, 1], [69, 1], [71, 1], [72, 1], [76, 6]],
    bass: [[48, 4], [53, 4], [55, 2], [48, 6]],
  },
};
export const JINGLE_NAMES = Object.keys(JINGLES);
export const jingleParts = (name) => JINGLES[name];
export const jingleSeconds = (name) => JINGLES[name].lead.reduce((n, [, l]) => n + l, 0) * (60 / JINGLES[name].tempo / 2);

export function playJingle(name) {
  const j = JINGLES[name];
  if (!ctx || !j) return 0;
  stopBgm();
  const eighth = 60 / j.tempo / 2;
  let t = ctx.currentTime + 0.05;
  for (const [m, len] of j.lead) {
    if (m !== null) tone(N(m), t, len * eighth * 0.9, { type: 'square', vol: 0.13 });
    t += len * eighth;
  }
  t = ctx.currentTime + 0.05;
  for (const [m, len] of j.bass) {
    tone(N(m - 12), t, len * eighth * 0.9, { type: 'triangle', vol: 0.2 });
    t += len * eighth;
  }
  return jingleSeconds(name);
}

export function stopBgm() {
  if (bgmTimer) clearInterval(bgmTimer);
  bgmTimer = null;
  // 予約済みの音を止めるため、音量の出口を作り直す
  if (ctx && master) {
    master.disconnect();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : VOLUME;
    master.connect(ctx.destination);
  }
}
