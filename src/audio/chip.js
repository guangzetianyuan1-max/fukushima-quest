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
// 声の番号札（10/6 本人「昔話スキップでナレーションが止まりませんでした」）
// 読み込み中に「とばす」で止めても、読み込みが終わった声が あとから鳴り出していた（stopVoice の時は まだ鳴っていない）
// ⇒ 鳴らす前に番号を取り、止めるたびに番号を進める。読み込みが終わった時に 番号が古ければ 鳴らさない
export function makeVoiceGate() {
  let n = 0;
  return { take: () => ++n, cancel: () => { n += 1; }, current: (t) => t === n };
}
const voiceGate = makeVoiceGate();
// onStart(秒)＝鳴りはじめた時に声の長さを知らせる（紙芝居の安全弁をその長さに合わせる）
export async function playVoice(url, onStart) {
  if (!ctx) return 0;
  const ticket = voiceGate.take();
  try {
    if (!voiceCache.has(url)) voiceCache.set(url, fetch(url).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)));
    const audio = await voiceCache.get(url);
    if (!voiceGate.current(ticket)) return 0; // 読み込みの間に 止められた・次の声に替わった＝鳴らさない
    stopSrc();
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
  voiceGate.cancel(); // 読み込み中の声も 鳴らさない
  stopSrc();
}
function stopSrc() {
  if (voiceSrc) {
    const s = voiceSrc;
    voiceSrc = null;
    try { s.stop(); } catch (e) { /* もう止まっている */ }
  }
  restoreBgm();
}
// 確かめ用：いま鳴っている声があるか
export const voicePlaying = () => !!voiceSrc;

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

// おならの音（本人 10/4「おならの効果音を入れてください」）：低い のこぎり波を 速く ふるわせる（ブルルッ）。高さは だんだん 下がる
function rasp(start, dur, { from = 130, to = 65, rate = 28, vol = 0.4 } = {}) {
  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(from, start);
  o.frequency.exponentialRampToValueAtTime(to, start + dur);
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 1100;
  const am = ctx.createGain(); // ふるえ＝音の大きさを rate 回/秒で 開け閉め
  am.gain.value = 0.5;
  const lfo = ctx.createOscillator();
  lfo.type = 'square';
  lfo.frequency.setValueAtTime(rate, start);
  lfo.frequency.linearRampToValueAtTime(rate * 0.6, start + dur);
  const depth = ctx.createGain();
  depth.gain.value = 0.5;
  lfo.connect(depth).connect(am.gain);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.03);
  g.gain.setValueAtTime(vol, start + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(f).connect(am).connect(g).connect(master);
  o.start(start);
  lfo.start(start);
  o.stop(start + dur + 0.02);
  lfo.stop(start + dur + 0.02);
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
  // 花火：ヒューッと上がって、パン
  hanabi: (t) => { tone(N(84), t, 0.35, { type: 'sine', vol: 0.08, slideTo: N(96) }); noise(t + 0.36, 0.3, { vol: 0.4, from: 7000, to: 600 }); },
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
  // ⭐ボスの必殺技（本人 10/4「必殺技のとき、効果音を入れて欲しい。激しめの」）＝挿絵が すべりこむ「シュバッ」→ 0.18秒で「ドガァン」と重く当たり、地鳴りが残る
  //   技ごとの音（wave・flame・shock など）に かさねて鳴らす
  // ⭐必殺技には必ず効果音（本人 10/4「必殺技には必ず効果音を入れて欲しい」）＝技ごとに合う音。2章の技の音（10/4）
  // 刃物（出刃包丁・闇討ち）＝振りかぶる風切り →「シャッ」→ 刃の鳴る「キィン」
  slash: (t) => {
    noise(t, 0.12, { vol: 0.25, from: 1500, to: 6000 });
    noise(t + 0.12, 0.16, { vol: 0.5, from: 12000, to: 2500 });
    tone(N(100), t + 0.14, 0.45, { type: 'triangle', vol: 0.12, slideTo: N(98) });
    tone(N(107), t + 0.14, 0.35, { type: 'sine', vol: 0.08 });
  },
  // 闇（岩屋の闇）＝低いうなりが ふくらんで迫る（上がっていく濁った2音）
  yami: (t) => {
    tone(N(30), t, 1.1, { type: 'sawtooth', vol: 0.3, slideTo: N(37) });
    tone(N(31), t, 1.1, { type: 'sawtooth', vol: 0.22, slideTo: N(38) });
    noise(t + 0.1, 1.0, { vol: 0.3, from: 150, to: 900 });
  },
  // 木の葉の小判＝チャリチャリと小判が鳴って舞う（高い鈴の音を ばらばらに）
  koban: (t) => {
    [96, 100, 103, 98, 105, 101, 108, 99].forEach((n, i) => tone(N(n), t + i * 0.055 + (i % 3) * 0.012, 0.18, { type: 'square', vol: 0.26 }));
    noise(t, 0.6, { vol: 0.3, from: 2500, to: 8000 });
  },
  // 毒霧（七曲りの毒）＝シューッと噴く音と、ぷくぷく泡立つ低い音
  doku: (t) => {
    noise(t, 0.9, { vol: 0.35, from: 9000, to: 4000 });
    [40, 43, 38, 45, 41].forEach((n, i) => tone(N(n), t + 0.15 + i * 0.13, 0.1, { type: 'sine', vol: 0.25, slideTo: N(n + 7) }));
  },
  // 弓（破魔の真弓）＝弦を引く「ギリ」→ 放つ「ビィン」→ 矢が飛ぶ「ヒュッ」
  yumi: (t) => {
    noise(t, 0.25, { vol: 0.12, from: 600, to: 1200 });
    tone(N(62), t + 0.28, 0.35, { type: 'sawtooth', vol: 0.32, slideTo: N(59) });
    noise(t + 0.3, 0.3, { vol: 0.55, from: 3000, to: 11000 });
  },
  // ⭐今までのキャラクターにも 技ごとの音（本人 10/4「今までのキャラクターにも効果音を入れて欲しい」）＝どの必殺技も ほかと同じ音を使い回さない
  // 黒い大波（龍燈）＝低いうねりが ふくらんで 砕ける
  oonami: (t) => {
    tone(N(28), t, 0.8, { type: 'triangle', vol: 0.35, slideTo: N(35) });
    noise(t, 0.7, { vol: 0.3, from: 200, to: 1800 });
    noise(t + 0.65, 0.7, { vol: 0.45, from: 6000, to: 250 });
  },
  // 乱れ髪（ザルカブリ）＝髪が うなって 何度も しなる「ヒュン ヒュン」
  kami: (t) => {
    [0, 0.14, 0.26, 0.36].forEach((d, i) => noise(t + d, 0.16, { vol: 0.5, from: 1200 + i * 900, to: 7000 }));
    tone(N(79), t, 0.5, { type: 'sine', vol: 0.15, slideTo: N(70) });
  },
  // 大雨（大悲山）＝ざあっと降る雨と、遠い雷
  ame: (t) => {
    noise(t, 1.2, { vol: 0.32, from: 7000, to: 5000 });
    noise(t + 0.35, 0.9, { vol: 0.4, from: 900, to: 90 });
    tone(N(26), t + 0.35, 0.8, { type: 'sawtooth', vol: 0.15, slideTo: N(22) });
  },
  // 長い腕（手長明神）＝腕が のびる「ぐいーん」→ ずしんと つかむ
  ude: (t) => {
    tone(N(45), t, 0.45, { type: 'square', vol: 0.18, slideTo: N(69) });
    tone(N(33), t + 0.45, 0.35, { type: 'square', vol: 0.4, slideTo: N(24) });
    noise(t + 0.45, 0.3, { vol: 0.35, from: 1500, to: 120 });
  },
  // 闇討ち（墨虎）＝すっと忍び寄る足音 → どすっ
  yamiuchi: (t) => {
    [0, 0.1, 0.2].forEach((d) => noise(t + d, 0.04, { vol: 0.12, from: 2500, to: 1500 }));
    noise(t + 0.32, 0.1, { vol: 0.5, from: 9000, to: 2000 });
    tone(N(38), t + 0.34, 0.3, { type: 'square', vol: 0.35, slideTo: N(26) });
  },
  // 火矢の雨（墨虎）＝何本もの矢が ヒュッ ヒュッと降り、火が ぼうっと燃えあがる
  hiya: (t) => {
    [0, 0.08, 0.15, 0.23, 0.3].forEach((d, i) => tone(N(96 - i * 2), t + d, 0.14, { type: 'sine', vol: 0.32, slideTo: N(84 - i * 2) }));
    noise(t + 0.4, 0.8, { vol: 0.55, from: 500, to: 3500 });
  },
  // 墓地の夜風（飴買い幽霊）＝ひゅうう と細く鳴る夜風
  yokaze: (t) => {
    tone(N(76), t, 1.0, { type: 'sine', vol: 0.3, slideTo: N(83) });
    tone(N(77), t + 0.1, 0.9, { type: 'sine', vol: 0.2, slideTo: N(71) });
    noise(t, 1.1, { vol: 0.5, from: 400, to: 2200 });
  },
  // 黒沼の大水（オロチ）＝ごぼごぼ湧き出て、どっと押し寄せる
  kuronuma: (t) => {
    [34, 31, 36, 29].forEach((n, i) => tone(N(n), t + i * 0.1, 0.12, { type: 'sine', vol: 0.3, slideTo: N(n + 9) }));
    noise(t + 0.4, 0.9, { vol: 0.45, from: 300, to: 2500 });
  },
  // 仲間の術（10/4）：読経＝鈴の「チーン」と低い読経／真言＝きらめく光／お札＝紙が舞い 光が立つ／くくり罠＝縄が ぴしっと締まる
  kyo: (t) => {
    tone(N(88), t, 1.2, { type: 'sine', vol: 0.2 });
    tone(N(100), t, 0.8, { type: 'sine', vol: 0.06 });
    [43, 43, 45, 43].forEach((n, i) => tone(N(n), t + 0.3 + i * 0.22, 0.2, { type: 'triangle', vol: 0.16 }));
  },
  shingon: (t) => arp([84, 91, 96, 103, 108], t, 0.05, 0.4, { type: 'sine', vol: 0.18 }),
  ofuda: (t) => {
    [0, 0.06, 0.12].forEach((d) => noise(t + d, 0.08, { vol: 0.15, from: 3000, to: 6000 }));
    arp([67, 74, 79], t + 0.2, 0.08, 0.3, { type: 'triangle', vol: 0.2 });
  },
  wana: (t) => {
    noise(t, 0.15, { vol: 0.2, from: 800, to: 4000 });
    tone(N(55), t + 0.15, 0.08, { type: 'square', vol: 0.3, slideTo: N(43) });
    noise(t + 0.15, 0.06, { vol: 0.4, from: 8000, to: 3000 });
  },
  // 二本松の提灯祭りの太鼓（10/4）＝拍の合図「ドン」・大太鼓「ドドン」・灯った「チャン」（鉦）
  taiko: (t) => { tone(N(36), t, 0.22, { type: 'sine', vol: 0.5, slideTo: N(30) }); noise(t, 0.06, { vol: 0.2, from: 900, to: 200 }); },
  ootaiko: (t) => { tone(N(31), t, 0.4, { type: 'sine', vol: 0.6, slideTo: N(26) }); tone(N(31), t + 0.12, 0.35, { type: 'sine', vol: 0.45, slideTo: N(26) }); noise(t, 0.1, { vol: 0.3, from: 700, to: 150 }); },
  kane: (t) => { tone(N(91), t, 0.18, { type: 'square', vol: 0.1 }); tone(N(98), t, 0.12, { type: 'triangle', vol: 0.08 }); },
  // ---- 3章 県中・県南の必殺技（10/4・技ごとに別の音）----
  // 安積沼の大波（蛇骨地蔵）＝低く うねって 水が 割れる
  hebinami: (t) => {
    tone(N(26), t, 1.0, { type: 'triangle', vol: 0.35, slideTo: N(31) });
    noise(t + 0.2, 0.9, { vol: 0.32, from: 400, to: 2600 });
    noise(t + 0.9, 0.5, { vol: 0.4, from: 5000, to: 300 });
  },
  // 百頭の駆けぬけ（三春駒）＝ひづめの 連打が 近づいて 去る
  hizume: (t) => {
    for (let i = 0; i < 12; i++) noise(t + i * 0.075, 0.05, { vol: 0.25 + 0.25 * Math.sin((i / 11) * Math.PI), from: 1400, to: 500 });
    tone(N(40), t, 0.9, { type: 'triangle', vol: 0.15 });
  },
  // 鬼穴の岩落とし（大多鬼丸）＝ゴロゴロと 転がって ドン
  iwaotoshi: (t) => {
    noise(t, 0.6, { vol: 0.3, from: 300, to: 150 });
    tone(N(24), t + 0.55, 0.5, { type: 'triangle', vol: 0.5, slideTo: N(17) });
    noise(t + 0.55, 0.3, { vol: 0.45, from: 1200, to: 100 });
  },
  // 慕い鳴き（和泉式部と猫）＝高く 長く 尾を 引く 鳴き声
  shitainaki: (t) => {
    tone(N(76), t, 0.35, { type: 'triangle', vol: 0.18, slideTo: N(83) });
    tone(N(83), t + 0.33, 0.6, { type: 'triangle', vol: 0.16, slideTo: N(71) });
  },
  // 天狗の羽うちわ（天狗）＝大きく あおぐ 風が 2度
  hauchiwa: (t) => {
    noise(t, 0.45, { vol: 0.45, from: 400, to: 4000 });
    noise(t + 0.4, 0.6, { vol: 0.5, from: 600, to: 6000 });
  },
  // 涅槃のまぼろし（託善和尚）＝澄んだ りんの音が 重なる
  nehan: (t) => {
    [0, 0.25, 0.5].forEach((d, i) => tone(N(84 + i * 3), t + d, 1.0, { type: 'sine', vol: 0.12 }));
  },
  // 釈迦堂川の大水（カッパ）＝水かさが 増して どっと 押し寄せる
  oomizu: (t) => {
    noise(t, 1.1, { vol: 0.25, from: 300, to: 900 });
    noise(t + 0.7, 0.6, { vol: 0.5, from: 3000, to: 200 });
    tone(N(31), t + 0.7, 0.5, { type: 'triangle', vol: 0.25 });
  },
  // 恋の炎（清姫）＝ごうっと 燃え上がる
  honoo: (t) => {
    noise(t, 0.9, { vol: 0.38, from: 300, to: 4500 });
    tone(N(36), t, 0.9, { type: 'triangle', vol: 0.2, slideTo: N(48) });
  },
  // 鐘に巻きつく（清姫）＝大きな 釣鐘が 低く 鳴る
  tsurigane: (t) => {
    tone(N(43), t, 1.6, { type: 'sine', vol: 0.3 });
    tone(N(55), t, 1.2, { type: 'triangle', vol: 0.12 });
    noise(t, 0.08, { vol: 0.3, from: 2000, to: 800 });
  },
  // 居合い斬り（武士・本人 10/4）＝鍔の「チャキッ」→ 鋭い風切り「シュッ」→ 斬った「ザン」
  iai: (t) => {
    tone(N(96), t, 0.04, { type: 'square', vol: 0.18 });
    tone(N(103), t + 0.04, 0.03, { type: 'square', vol: 0.12 });
    noise(t + 0.08, 0.14, { vol: 0.45, from: 12000, to: 3000 });
    noise(t + 0.2, 0.3, { vol: 0.4, from: 4000, to: 300 });
    tone(N(48), t + 0.2, 0.25, { type: 'square', vol: 0.3, slideTo: N(30) });
  },
  // くノ一（10/4 夜 本人「短剣と妖術使い」）：短剣の二連撃＝鋭い「シュッ・シュッ」と 小さく 刃の当たる音
  tanken: (t) => {
    [0, 0.13].forEach((d, i) => {
      noise(t + d, 0.07, { vol: 0.4, from: 14000, to: 5000 });
      tone(N(100 - i * 5), t + d + 0.05, 0.05, { type: 'square', vol: 0.12, slideTo: N(84) });
    });
  },
  // 狐火の術＝ボッと 灯って 青白い火が ゆらゆら 立ちのぼる
  kitsunebi: (t) => {
    noise(t, 0.25, { vol: 0.35, from: 600, to: 3500 });
    [79, 83, 86, 91].forEach((m, i) => tone(N(m), t + 0.1 + i * 0.09, 0.35, { type: 'sine', vol: 0.12, slideTo: N(m + 2) }));
    noise(t + 0.3, 0.6, { vol: 0.15, from: 2000, to: 500 });
  },
  // 幻の術＝少しずつ ずれた 二つの音が ゆらぐ（分身）
  maboroshi: (t) => {
    [76, 79, 83, 88].forEach((m, i) => {
      tone(N(m), t + i * 0.08, 0.4, { type: 'triangle', vol: 0.1 });
      tone(N(m) * 1.02, t + i * 0.08 + 0.03, 0.4, { type: 'triangle', vol: 0.08 });
    });
  },
  // 影渡り：見つかった＝拍子木「カンカン」と 鋭い 笛
  mitsukaru: (t) => {
    [0, 0.12].forEach((d) => { tone(N(96), t + d, 0.05, { type: 'square', vol: 0.2 }); noise(t + d, 0.03, { vol: 0.3, from: 6000, to: 3000 }); });
    tone(N(98), t + 0.26, 0.35, { type: 'square', vol: 0.12, slideTo: N(103) });
  },
  // 影渡り：影に ひそんだ＝小さく すり足
  kage: (t) => { noise(t, 0.06, { vol: 0.12, from: 1500, to: 600 }); },
  // すごいおなら（へっぴり嫁・本人 10/4）＝挿絵が すべりこむ 0.15秒に「ブッ」→ 長い「ブゥゥ〜〜」→ 最後に 小さく「プッ」。後ろで 突風
  onara: (t) => {
    rasp(t + 0.15, 0.14, { from: 160, to: 140, rate: 34, vol: 0.4 });
    rasp(t + 0.33, 1.15, { from: 140, to: 58, rate: 30, vol: 0.5 });
    tone(N(70), t + 1.52, 0.1, { type: 'square', vol: 0.12, slideTo: N(82) });
    noise(t + 0.35, 1.2, { vol: 0.22, from: 300, to: 2600 });
  },
  // ---- 職業の技（10/5 jobs.js の JOB_SPELLS）。どれも別の音 ----
  cancel: (t) => tone(N(60), t, 0.08, { vol: 0.15, slideTo: N(55) }),
  shakujo: (t) => { for (let i = 0; i < 4; i++) tone(N(98 + (i % 2) * 3), t + i * 0.035, 0.06, { type: 'triangle', vol: 0.12 }); noise(t, 0.08, { vol: 0.25, from: 2500, to: 600 }); },
  kabutowari: (t) => { noise(t, 0.05, { vol: 0.3, from: 9000, to: 4000 }); tone(N(36), t + 0.04, 0.3, { type: 'square', vol: 0.3, slideTo: N(24) }); noise(t + 0.05, 0.25, { vol: 0.35, from: 1500, to: 200 }); },
  tsubame: (t) => { noise(t, 0.1, { vol: 0.3, from: 3000, to: 9000 }); noise(t + 0.16, 0.1, { vol: 0.3, from: 9000, to: 3000 }); tone(N(100), t + 0.3, 0.12, { type: 'sine', vol: 0.12 }); },
  fudo: (t) => { noise(t, 0.8, { vol: 0.3, from: 400, to: 2500 }); arp([55, 62, 67], t, 0.12, 0.6, { type: 'triangle', vol: 0.22 }); },
  sosei: (t) => arp([67, 72, 76, 79, 84, 88], t, 0.1, 0.5, { type: 'sine', vol: 0.2 }),
  ikazuchi: (t) => { noise(t, 0.08, { vol: 0.5, from: 9000, to: 6000 }); noise(t + 0.08, 0.9, { vol: 0.45, from: 1200, to: 100 }); tone(N(28), t + 0.08, 0.6, { type: 'square', vol: 0.25, slideTo: N(22) }); },
  oogama: (t) => { tone(N(36), t, 0.25, { type: 'square', vol: 0.3, slideTo: N(43) }); tone(N(31), t + 0.3, 0.4, { type: 'triangle', vol: 0.4, slideTo: N(24) }); noise(t + 0.3, 0.5, { vol: 0.35, from: 800, to: 150 }); },
  kemuri: (t) => noise(t, 0.9, { vol: 0.28, from: 5000, to: 400 }),
  kagenui: (t) => { noise(t, 0.06, { vol: 0.25, from: 8000, to: 3000 }); tone(N(91), t + 0.06, 0.25, { type: 'sine', vol: 0.12, slideTo: N(79) }); },
  bunshin: (t) => { for (let i = 0; i < 3; i++) noise(t + i * 0.09, 0.07, { vol: 0.28, from: 7000, to: 1200 }); arp([79, 83, 86], t + 0.3, 0.06, 0.15, { type: 'square', vol: 0.12 }); },
  shiko: (t) => { tone(N(26), t, 0.35, { type: 'sine', vol: 0.6, slideTo: N(21) }); noise(t, 0.3, { vol: 0.45, from: 600, to: 100 }); noise(t + 0.25, 0.5, { vol: 0.25, from: 2000, to: 8000 }); },
  kabau: (t) => { tone(N(43), t, 0.2, { type: 'square', vol: 0.2 }); tone(N(48), t + 0.15, 0.3, { type: 'square', vol: 0.2 }); },
  nage: (t) => { noise(t, 0.2, { vol: 0.25, from: 400, to: 3000 }); tone(N(29), t + 0.25, 0.4, { type: 'sine', vol: 0.6, slideTo: N(20) }); noise(t + 0.25, 0.3, { vol: 0.4, from: 900, to: 100 }); },
  kaburaya: (t) => { tone(N(84), t, 0.7, { type: 'sine', vol: 0.18, slideTo: N(96) }); noise(t, 0.7, { vol: 0.1, from: 3000, to: 5000 }); },
  kaen: (t) => { noise(t, 0.12, { vol: 0.25, from: 2000, to: 7000 }); noise(t + 0.1, 0.6, { vol: 0.35, from: 500, to: 3000 }); },
  hachiya: (t) => { for (let i = 0; i < 4; i++) { noise(t + i * 0.08, 0.05, { vol: 0.25, from: 6000, to: 2000 }); tone(N(88 - i * 2), t + i * 0.08, 0.04, { vol: 0.1 }); } },
  kagura: (t) => { for (let i = 0; i < 6; i++) tone(N(96 + (i % 3) * 2), t + i * 0.07, 0.08, { type: 'triangle', vol: 0.1 }); arp([74, 79, 81], t + 0.2, 0.15, 0.3, { type: 'sine', vol: 0.15 }); },
  omiki: (t) => arp([72, 79, 84, 79, 88], t, 0.09, 0.35, { type: 'sine', vol: 0.2 }),
  iwato: (t) => { tone(N(36), t, 0.6, { type: 'sine', vol: 0.4, slideTo: N(43) }); arp([79, 84, 88, 91, 96], t + 0.3, 0.08, 0.6, { type: 'sine', vol: 0.18 }); },
  jufu: (t) => { tone(N(62), t, 0.4, { type: 'square', vol: 0.12, slideTo: N(55) }); noise(t, 0.1, { vol: 0.2, from: 4000, to: 1000 }); },
  kekkai: (t) => { for (let i = 0; i < 4; i++) tone(N(84 + i * 5), t + i * 0.06, 0.08, { type: 'triangle', vol: 0.14 }); tone(N(103), t + 0.25, 0.5, { type: 'sine', vol: 0.12 }); },
  taizan: (t) => { tone(N(38), t, 0.8, { type: 'triangle', vol: 0.3 }); arp([62, 69, 74, 81, 86], t + 0.2, 0.12, 0.6, { type: 'sine', vol: 0.16 }); },
  gedoku: (t) => arp([76, 74, 79, 84], t, 0.07, 0.15, { type: 'square', vol: 0.12 }),
  fukiya: (t) => { noise(t, 0.12, { vol: 0.2, from: 1500, to: 6000 }); tone(N(70), t + 0.12, 0.3, { type: 'square', vol: 0.08, slideTo: N(58) }); },
  hiyaku: (t) => arp([72, 76, 79, 84, 91], t, 0.06, 0.4, { type: 'triangle', vol: 0.24 }),
  horagai: (t) => { tone(N(46), t, 0.9, { type: 'sawtooth', vol: 0.18, slideTo: N(48) }); tone(N(58), t + 0.1, 0.8, { type: 'triangle', vol: 0.1 }); },
  kuji: (t) => { for (let i = 0; i < 9; i++) noise(t + i * 0.05, 0.04, { vol: 0.18, from: 5000, to: 1500 }); tone(N(91), t + 0.45, 0.3, { type: 'sine', vol: 0.14 }); },
  hiwatari: (t) => { noise(t, 1.0, { vol: 0.3, from: 300, to: 2000 }); arp([60, 64, 67, 72], t + 0.2, 0.1, 0.4, { type: 'square', vol: 0.15 }); },
  shikigami: (t) => { noise(t, 0.15, { vol: 0.15, from: 2000, to: 5000 }); arp([88, 91, 95], t + 0.1, 0.05, 0.12, { type: 'sine', vol: 0.15 }); },
  special: (t) => {
    noise(t, 0.18, { vol: 0.35, from: 800, to: 9000 }); // すべりこむ風切り
    tone(N(72), t, 0.18, { type: 'sawtooth', vol: 0.12, slideTo: N(96) });
    const h = t + 0.18;
    noise(h, 0.08, { vol: 0.8, from: 10000, to: 3000 }); // 当たる瞬間の破裂
    tone(N(36), h, 0.5, { type: 'square', vol: 0.45, slideTo: N(18) }); // 重い ドン
    tone(N(43), h, 0.35, { type: 'sawtooth', vol: 0.25, slideTo: N(24) });
    noise(h + 0.03, 0.9, { vol: 0.5, from: 2500, to: 80 }); // 砕ける音から地鳴りへ
    noise(h + 0.45, 0.6, { vol: 0.15, from: 600, to: 100 }); // 残る ゴゴゴ
  },
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

// ---- 1章「相馬」の曲（本人 10/3「1章の4話はBGMも全て変えて欲しい」「章ごとにBGMは新しく」）。どれも8小節＝8分音符64個 ----
// 相馬の地図：民謡の音階（レ・ファ・ソ・ラ・ド）で、いわきの陽音階より少し寂しく
const SOMA_FIELD_LEAD = [
  [74, 2], [77, 2], [79, 4],
  [81, 2], [79, 2], [77, 2], [74, 2],
  [72, 4], [74, 4],
  [69, 8],
  [74, 2], [77, 2], [81, 2], [84, 2],
  [81, 4], [79, 2], [77, 2],
  [74, 2], [72, 2], [69, 2], [72, 2],
  [74, 8],
];
// 影渡り（黒脛巾組の試し・10/4 夜）：陰音階（ミ・ファ・ラ・シ・ド）で 忍び足のように 跳ねる
const KAGEWATARI_LEAD = [
  [76, 1], [77, 1], [81, 2], [76, 2], [83, 2],
  [84, 1], [83, 1], [81, 2], [77, 4],
  [76, 1], [77, 1], [81, 2], [83, 2], [88, 2],
  [86, 2], [84, 2], [83, 4],
  [81, 1], [83, 1], [84, 2], [81, 2], [77, 2],
  [76, 2], [77, 2], [81, 4],
  [83, 1], [84, 1], [83, 2], [81, 2], [77, 2],
  [76, 8],
];
// 相馬の道中の戦い：民謡の音階（ミ・ソ・ラ・シ・レ）で速く
const SOMA_BATTLE_LEAD = [
  [76, 1], [79, 1], [81, 2], [83, 2], [81, 2],
  [79, 1], [76, 1], [74, 2], [76, 4],
  [81, 1], [83, 1], [86, 2], [83, 2], [81, 2],
  [79, 4], [76, 2], [null, 2],
  [76, 2], [79, 2], [83, 2], [86, 2],
  [88, 2], [86, 1], [83, 1], [81, 4],
  [79, 1], [81, 1], [79, 1], [76, 1], [74, 2], [71, 2],
  [76, 6], [null, 2],
];
// 第五話 ザルカブリ山：陰音階（ミ・ファ・ラ・シ・ド）・山の奥の 不気味さ
const ZARUKABURI_LEAD = [
  [76, 2], [77, 2], [81, 3], [null, 1],
  [83, 1], [84, 1], [83, 2], [81, 4],
  [77, 2], [76, 2], [71, 2], [69, 2],
  [76, 6], [null, 2],
  [81, 2], [83, 2], [84, 3], [83, 1],
  [81, 2], [77, 2], [76, 4],
  [77, 1], [76, 1], [71, 2], [69, 2], [71, 2],
  [64, 6], [null, 2],
];
// 第六話 大悲山の大蛇：都節（レ・ミ♭・ソ・ラ・シ♭）・重く遅く、低音は琵琶をはじく音
const DAIHISAN_LEAD = [
  [74, 1], [75, 1], [74, 2], [70, 2], [69, 2],
  [67, 4], [69, 2], [70, 2],
  [74, 3], [75, 1], [79, 2], [75, 2],
  [74, 8],
  [79, 2], [81, 2], [82, 2], [81, 2],
  [79, 2], [75, 2], [74, 4],
  [70, 1], [69, 1], [67, 2], [63, 2], [67, 2],
  [62, 6], [null, 2],
];
// 第七話 手長明神：陽音階（ソ・ラ・ド・レ・ミ）・海と山の大きな神さまを ゆったり堂々と
const TENAGA_LEAD = [
  [79, 4], [81, 2], [84, 2],
  [86, 6], [84, 2],
  [81, 2], [79, 2], [76, 2], [79, 2],
  [81, 8],
  [84, 4], [86, 2], [88, 2],
  [86, 4], [84, 2], [81, 2],
  [79, 2], [76, 2], [74, 2], [76, 2],
  [79, 8],
];
// 第八話 虎捕山の白狼（章ボス 橘墨虎）：都節（ラ・シ♭・レ・ミ・ファ）・速く激しく
const SUMITORA_LEAD = [
  [81, 1], [82, 1], [81, 1], [77, 1], [76, 2], [74, 2],
  [76, 1], [77, 1], [81, 2], [82, 2], [86, 2],
  [88, 2], [86, 1], [82, 1], [81, 2], [77, 2],
  [76, 4], [74, 2], [null, 2],
  [69, 1], [70, 1], [74, 1], [76, 1], [77, 2], [81, 2],
  [82, 1], [81, 1], [77, 1], [76, 1], [74, 2], [70, 2],
  [69, 2], [70, 2], [74, 2], [76, 2],
  [81, 6], [null, 2],
];

// 相馬野馬追の神旗争奪戦（10/3）：民謡の音階（レ・ミ・ソ・ラ・シ）・勇ましく速く・低音は太鼓
// ⭐10/4 本人「野馬追のBGM 運動会のような賑やかな音楽にしてほしい」＝速い2拍子のギャロップ（運動会の徒競走の曲の作り）・ハ長調・16分の駆け上がり
// 旋律は自作（既成の曲は写さない）。16分＝0.5。8小節で64（8分音符）
const NOMAOI_LEAD = [
  [72, 0.5], [76, 0.5], [79, 0.5], [84, 0.5], [84, 1], [79, 1], [76, 1], [79, 1], [76, 1], [72, 1],
  [74, 0.5], [76, 0.5], [77, 0.5], [79, 0.5], [81, 1], [79, 1], [77, 1], [76, 1], [74, 2],
  [71, 0.5], [74, 0.5], [77, 0.5], [79, 0.5], [83, 1], [81, 1], [79, 1], [77, 1], [76, 1], [74, 1],
  [72, 1], [76, 1], [79, 1], [84, 1], [79, 1], [72, 1], [null, 2],
  [72, 0.5], [76, 0.5], [79, 0.5], [84, 0.5], [84, 1], [79, 1], [76, 1], [79, 1], [76, 1], [72, 1],
  [74, 0.5], [76, 0.5], [77, 0.5], [79, 0.5], [81, 1], [79, 1], [77, 1], [76, 1], [74, 2],
  [77, 0.5], [79, 0.5], [81, 0.5], [83, 0.5], [84, 1], [83, 1], [81, 1], [79, 1], [77, 1], [74, 1],
  [72, 1], [79, 1], [76, 1], [72, 1], [67, 1], [72, 1], [null, 2],
];
// 小節ごとの和音（根音）＝C G G C C G F C。ズン・チャッ（根音と5度・裏で和音）＋大太鼓と小太鼓
const NOMAOI_CHORDS = [48, 43, 43, 48, 48, 43, 41, 48];

// ---- 2章「県北」の曲（10/4・本人「章ごとにBGMは新しく」）。どれも8小節＝8分音符64個 ----
// 県北の地図：陽音階（ド・レ・ファ・ソ・ラ）・盆地の 実りの 道を のどかに
const KENPOKU_FIELD_LEAD = [
  [72, 2], [74, 2], [77, 2], [79, 2],
  [81, 4], [79, 2], [77, 2],
  [74, 2], [72, 2], [74, 2], [77, 2],
  [79, 8],
  [81, 2], [84, 2], [86, 2], [84, 2],
  [81, 4], [79, 2], [77, 2],
  [74, 2], [77, 2], [79, 2], [74, 2],
  [72, 8],
];
// 県北の道中の戦い：陽音階で速く跳ねる
const KENPOKU_BATTLE_LEAD = [
  [79, 1], [81, 1], [84, 2], [81, 1], [79, 1], [77, 2],
  [79, 1], [77, 1], [74, 2], [72, 4],
  [74, 1], [77, 1], [79, 2], [81, 2], [84, 2],
  [86, 4], [84, 2], [null, 2],
  [84, 1], [86, 1], [88, 2], [86, 1], [84, 1], [81, 2],
  [84, 1], [81, 1], [79, 2], [77, 4],
  [74, 1], [77, 1], [79, 1], [81, 1], [79, 2], [77, 2],
  [79, 6], [null, 2],
];
// ---- 3章「県中・県南」（10/4）----
// 県中の道中：ト長調の陽音階（ソ・ラ・シ・レ・ミ）でゆったり。奥州街道を南へ歩く
const KENCHU_FIELD_LEAD = [
  [67, 2], [69, 2], [71, 2], [74, 2],
  [76, 4], [74, 2], [71, 2],
  [69, 2], [71, 2], [69, 2], [67, 2],
  [69, 8],
  [74, 2], [76, 2], [79, 2], [76, 2],
  [74, 4], [71, 2], [69, 2],
  [71, 2], [69, 2], [67, 2], [64, 2],
  [67, 8],
];
// 県中の道中の戦い：同じ音階で速く、高い所まで駆け上がる
const KENCHU_BATTLE_LEAD = [
  [74, 1], [76, 1], [79, 2], [76, 1], [74, 1], [71, 2],
  [69, 2], [71, 1], [74, 1], [76, 4],
  [79, 1], [81, 1], [83, 2], [81, 1], [79, 1], [76, 2],
  [74, 2], [76, 2], [79, 4],
  [81, 1], [79, 1], [76, 2], [74, 1], [76, 1], [79, 2],
  [81, 2], [83, 2], [86, 4],
  [83, 1], [81, 1], [79, 2], [76, 1], [74, 1], [71, 2],
  [74, 8],
];
// 3章のボス8曲（10/4・art_src では作らず ここに直接）
// 蛇骨地蔵：都節（ミ・ファ・ラ・シ・ド）で沼の底から うねる
const JAKOTSU_LEAD = [[64, 2], [65, 2], [69, 4], [71, 2], [72, 2], [71, 2], [69, 2], [65, 4], [64, 4], [64, 8], [76, 2], [77, 2], [76, 2], [72, 2], [71, 4], [69, 2], [71, 2], [72, 2], [71, 2], [69, 2], [65, 2], [64, 8]];
// 三春駒：陽音階で 駆ける 馬（ひづめの 3連の 刻み）
const MIHARUGOMA_LEAD = [[74, 1], [76, 1], [79, 2], [81, 2], [79, 2], [76, 2], [74, 2], [71, 4], [74, 1], [76, 1], [79, 2], [83, 2], [81, 2], [79, 8], [81, 1], [83, 1], [86, 2], [83, 2], [81, 2], [79, 2], [76, 2], [74, 4], [76, 2], [79, 2], [76, 2], [71, 2], [74, 8]];
// 大多鬼丸：律音階で 太く 重く（山の 主）
const OTAKIMARU_LEAD = [[62, 4], [64, 2], [67, 2], [69, 4], [67, 2], [64, 2], [62, 2], [64, 2], [67, 2], [69, 2], [67, 8], [74, 4], [72, 2], [69, 2], [67, 4], [69, 2], [72, 2], [74, 2], [72, 2], [69, 2], [67, 2], [62, 8]];
// 和泉式部と猫：都節で さびしく 呼ぶ
const NEKONAKI_LEAD = [[76, 4], [77, 2], [76, 2], [72, 8], [71, 2], [72, 2], [71, 2], [69, 2], [64, 8], [69, 2], [71, 2], [72, 2], [76, 2], [77, 4], [76, 4], [72, 2], [71, 2], [69, 2], [71, 2], [64, 8]];
// 天狗のいけにえ：陰音階で 速く 舞う 風
const TENGU_LEAD = [[81, 1], [82, 1], [81, 1], [77, 1], [76, 2], [74, 2], [76, 1], [77, 1], [81, 2], [82, 4], [86, 1], [84, 1], [82, 1], [81, 1], [77, 2], [76, 2], [74, 8], [69, 1], [70, 1], [74, 2], [76, 2], [77, 2], [81, 2], [82, 2], [81, 4], [77, 1], [76, 1], [74, 2], [70, 2], [69, 2], [74, 8]];
// 託善和尚：木魚の 刻みに 読経の ような 長い 音
const TAKUZEN_LEAD = [[67, 4], [69, 4], [72, 4], [69, 4], [67, 2], [69, 2], [72, 2], [74, 2], [72, 8], [76, 4], [74, 4], [72, 4], [74, 4], [72, 2], [69, 2], [67, 2], [64, 2], [67, 8]];
// カッパのわび証文：陽音階で とぼけて 跳ねる
const KAPPA_LEAD = [[72, 1], [72, 1], [74, 2], [76, 1], [79, 1], [76, 2], [74, 2], [72, 2], [69, 4], [72, 1], [74, 1], [76, 2], [79, 2], [81, 2], [79, 8], [81, 1], [79, 1], [76, 2], [74, 1], [76, 1], [79, 2], [76, 2], [74, 2], [72, 4], [69, 2], [72, 2], [74, 2], [69, 2], [72, 8]];
// 安珍と清姫：都節で 激しく 燃え上がる（章ボス）
const KIYOHIME_LEAD = [[76, 1], [77, 1], [81, 2], [83, 1], [84, 1], [83, 2], [81, 2], [77, 2], [76, 4], [88, 1], [89, 1], [88, 2], [84, 1], [83, 1], [81, 2], [83, 8], [84, 2], [83, 2], [81, 2], [77, 2], [76, 2], [77, 2], [81, 4], [83, 1], [81, 1], [77, 2], [76, 2], [71, 2], [76, 8]];
// 第九話 飴買い幽霊：都節（ミ・ファ・ラ・シ・ド）・夜の 墓地を 静かに・もの悲しく
const AMEKAI_LEAD = [
  [76, 3], [77, 1], [81, 4],
  [83, 2], [81, 2], [77, 4],
  [76, 2], [77, 2], [76, 2], [71, 2],
  [69, 8],
  [72, 2], [71, 2], [69, 2], [71, 2],
  [76, 4], [77, 4],
  [76, 2], [71, 2], [69, 2], [65, 2],
  [64, 6], [null, 2],
];
// 第十話 ご坊狐：民謡の音階・化かしの いたずらっぽさ（跳ねる付点）
const GOBOU_LEAD = [
  [81, 1.5], [79, 0.5], [76, 2], [79, 1.5], [81, 0.5], [84, 2],
  [83, 1.5], [81, 0.5], [79, 2], [76, 4],
  [74, 1.5], [76, 0.5], [79, 2], [81, 1.5], [79, 0.5], [76, 2],
  [74, 6], [null, 2],
  [81, 1.5], [83, 0.5], [84, 2], [86, 1.5], [84, 0.5], [81, 2],
  [79, 1.5], [81, 0.5], [79, 2], [76, 4],
  [74, 1], [76, 1], [79, 1], [76, 1], [74, 2], [71, 2],
  [69, 6], [null, 2],
];
// 第十一話 ムカデとオロチ：陰音階・二匹が にらみあう 重い 掛け合い（高い音と低い音が 交互に）
const MUKADE_LEAD = [
  [76, 2], [64, 2], [77, 2], [65, 2],
  [81, 2], [69, 2], [77, 4],
  [76, 2], [64, 2], [71, 2], [59, 2],
  [64, 8],
  [81, 2], [69, 2], [83, 2], [71, 2],
  [84, 2], [72, 2], [83, 4],
  [81, 1], [77, 1], [76, 2], [71, 2], [69, 2],
  [64, 6], [null, 2],
];
// 第十二話 へっぴり嫁：明るい長調・のどかで すこし おかしみ（下品には しない）
const HEPPIRI_LEAD = [
  [72, 2], [76, 2], [79, 2], [76, 2],
  [77, 2], [81, 2], [79, 4],
  [76, 1], [77, 1], [79, 2], [84, 2], [79, 2],
  [76, 6], [null, 2],
  [74, 2], [77, 2], [81, 2], [77, 2],
  [76, 2], [79, 2], [84, 4],
  [83, 1], [81, 1], [79, 2], [77, 2], [74, 2],
  [72, 6], [null, 2],
];
// 第十三話 安達ヶ原の鬼婆（章ボス）：都節・速く激しく（2章でいちばん強い敵）
const ONIBABA_LEAD = [
  [76, 1], [77, 1], [76, 1], [72, 1], [71, 2], [69, 2],
  [71, 1], [72, 1], [76, 2], [77, 2], [81, 2],
  [83, 2], [81, 1], [77, 1], [76, 2], [72, 2],
  [71, 4], [69, 2], [null, 2],
  [64, 1], [65, 1], [69, 1], [71, 1], [72, 2], [76, 2],
  [77, 1], [76, 1], [72, 1], [71, 1], [69, 2], [65, 2],
  [64, 2], [65, 2], [69, 2], [71, 2],
  [76, 6], [null, 2],
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
  // 影渡り（10/4 夜）：低音は 8分で 小さく 刻む（忍び足）・2拍ごとに 拍子木のような 打つ音
  kagewatari: {
    lead: KAGEWATARI_LEAD, tempo: 112, leadType: 'triangle', leadVol: 0.15,
    bass(t0, eighth) {
      [40, 40, 41, 40, 45, 41, 40, 40].forEach((r, bar) => {
        [r, 0, r, r + 7, r, 0, r + 12, 0].forEach((m, i) => {
          const s = t0 + (bar * 8 + i) * eighth;
          if (m) tone(N(m - 12), s, eighth * 0.5, { type: 'square', vol: 0.06 });
          if (i % 4 === 0) noise(s, 0.025, { vol: 0.05, from: 5000, to: 3000 });
        });
      });
    },
  },
  // ---- 1章「相馬」（10/3）----
  somaField: {
    lead: SOMA_FIELD_LEAD, tempo: 80, leadType: 'triangle', leadVol: 0.16,
    // 低音は1小節に1つ、長く のばすだけ（レ・ド・ラ・レ…）
    bass(t0, eighth) {
      [50, 48, 45, 45, 50, 53, 48, 50].forEach((r, bar) => tone(N(r - 12), t0 + bar * 8 * eighth, eighth * 7.5, { type: 'triangle', vol: 0.18 }));
    },
  },
  somaBattle: {
    lead: SOMA_BATTLE_LEAD, tempo: 140, leadType: 'square', leadVol: 0.1,
    bass(t0, eighth) {
      [40, 40, 45, 43, 40, 45, 43, 40].forEach((r, bar) => {
        [r, r + 12, r, r + 7, r, r + 12, r + 7, r].forEach((m, i) => {
          const s = t0 + (bar * 8 + i) * eighth;
          tone(N(m), s, eighth * 0.7, { type: 'triangle', vol: 0.2 });
          if (i % 4 === 0) noise(s, 0.03, { vol: 0.05, from: 8000, to: 5000 });
        });
      });
    },
  },
  zarukaburi: {
    lead: ZARUKABURI_LEAD, tempo: 116, leadType: 'triangle', leadVol: 0.17,
    // 低音はミとファを ゆっくり行き来（半音のぶつかりで不気味に）・2拍ごとに小さな打つ音
    bass(t0, eighth) {
      [40, 41, 40, 41, 45, 41, 40, 40].forEach((r, bar) => {
        [0, 4].forEach((k) => tone(N(r), t0 + (bar * 8 + k) * eighth, eighth * 3.6, { type: 'square', vol: 0.07 }));
        noise(t0 + bar * 8 * eighth, 0.05, { vol: 0.06, from: 3000, to: 600 });
      });
    },
  },
  daihisan: {
    lead: DAIHISAN_LEAD, tempo: 104, leadType: 'sawtooth', leadVol: 0.06,
    // 低音は琵琶をはじく音（pluck）を1小節に2つ
    bass(t0, eighth) {
      [38, 38, 43, 38, 43, 39, 43, 38].forEach((r, bar) => {
        pluck(N(r), t0 + bar * 8 * eighth, eighth * 4, { vol: 0.32 });
        pluck(N(r + 7), t0 + (bar * 8 + 4) * eighth, eighth * 3, { vol: 0.22 });
      });
    },
  },
  tenaga: {
    lead: TENAGA_LEAD, tempo: 96, leadType: 'triangle', leadVol: 0.17,
    // 低音は ソ・ド・レを大きく。1小節に2つ、波のように
    bass(t0, eighth) {
      [43, 48, 45, 50, 48, 50, 45, 43].forEach((r, bar) => {
        tone(N(r - 12), t0 + bar * 8 * eighth, eighth * 3.8, { type: 'triangle', vol: 0.2 });
        tone(N(r - 5), t0 + (bar * 8 + 4) * eighth, eighth * 3.8, { type: 'triangle', vol: 0.14 });
      });
    },
  },
  sumitora: {
    lead: SUMITORA_LEAD, tempo: 152, leadType: 'square', leadVol: 0.1,
    // 低音は8分で刻む（ラ・ファ・レ）・表拍に打つ音＝章ボスらしく速く
    bass(t0, eighth) {
      [33, 33, 29, 33, 26, 29, 33, 33].forEach((r, bar) => {
        [r, r + 12, r, r + 12, r, r + 12, r + 7, r + 12].forEach((m, i) => {
          const s = t0 + (bar * 8 + i) * eighth;
          tone(N(m), s, eighth * 0.75, { type: 'triangle', vol: 0.24 });
          if (i % 2 === 0) noise(s, 0.03, { vol: 0.07, from: 9000, to: 5000 });
        });
      });
    },
  },
  // ---- 2章「県北」（10/4）----
  kenpokuField: {
    lead: KENPOKU_FIELD_LEAD, tempo: 84, leadType: 'triangle', leadVol: 0.16,
    bass(t0, eighth) {
      [48, 50, 53, 55, 53, 50, 48, 48].forEach((r, bar) => {
        tone(N(r - 12), t0 + bar * 8 * eighth, eighth * 3.8, { type: 'triangle', vol: 0.18 });
        tone(N(r - 5), t0 + (bar * 8 + 4) * eighth, eighth * 3.8, { type: 'triangle', vol: 0.12 });
      });
    },
  },
  kenpokuBattle: {
    lead: KENPOKU_BATTLE_LEAD, tempo: 146, leadType: 'square', leadVol: 0.1,
    bass(t0, eighth) {
      [43, 41, 43, 48, 45, 41, 43, 43].forEach((r, bar) => {
        [r, r + 12, r + 7, r + 12, r, r + 12, r + 7, r + 12].forEach((m, i) => {
          const s = t0 + (bar * 8 + i) * eighth;
          tone(N(m), s, eighth * 0.7, { type: 'triangle', vol: 0.2 });
          if (i % 4 === 0) noise(s, 0.03, { vol: 0.05, from: 8000, to: 5000 });
        });
      });
    },
  },
  // ---- 3章「県中・県南」（10/4）ボス8曲 ----
  jakotsu: {
    lead: JAKOTSU_LEAD, tempo: 112, leadType: 'triangle', leadVol: 0.17,
    bass(t0, eighth) {
      const ROOTS = [40, 41, 45, 40, 45, 41, 40, 40];
      ROOTS.forEach((r, bar) => {
        tone(N(r - 12), t0 + bar * 8 * eighth, eighth * 3.8, { type: 'triangle', vol: 0.2 });
        tone(N(r - 5), t0 + (bar * 8 + 4) * eighth, eighth * 3.8, { type: 'triangle', vol: 0.13 });
      });
    },
  },
  miharugoma: {
    lead: MIHARUGOMA_LEAD, tempo: 156, leadType: 'square', leadVol: 0.1,
    bass(t0, eighth) {
      const ROOTS = [43, 43, 40, 43, 45, 43, 40, 43];
      ROOTS.forEach((r, bar) => {
        [0, 1, 2, 4, 5, 6].forEach((k, i) => tone(N(i % 3 === 0 ? r - 12 : r), t0 + (bar * 8 + k) * eighth, eighth * 0.6, { type: 'triangle', vol: 0.2 }));
      });
    },
  },
  otakimaru: {
    lead: OTAKIMARU_LEAD, tempo: 128, leadType: 'square', leadVol: 0.1,
    bass(t0, eighth) {
      const ROOTS = [38, 38, 43, 38, 45, 43, 38, 38];
      ROOTS.forEach((r, bar) => {
        [r, r + 12, r + 7, r + 12, r, r + 12, r + 7, r + 12].forEach((m, i) => {
          const s = t0 + (bar * 8 + i) * eighth;
          tone(N(m), s, eighth * 0.7, { type: 'triangle', vol: 0.21 });
          if (i % 2 === 0) noise(s, 0.03, { vol: 0.06, from: 8000, to: 5000 });
        });
      });
    },
  },
  nekonaki: {
    lead: NEKONAKI_LEAD, tempo: 96, leadType: 'triangle', leadVol: 0.17,
    bass(t0, eighth) {
      const ROOTS = [45, 41, 45, 40, 45, 41, 40, 40];
      ROOTS.forEach((r, bar) => tone(N(r - 12), t0 + bar * 8 * eighth, eighth * 7.5, { type: 'triangle', vol: 0.16 }));
    },
  },
  tengu: {
    lead: TENGU_LEAD, tempo: 148, leadType: 'square', leadVol: 0.09,
    bass(t0, eighth) {
      const ROOTS = [38, 34, 38, 41, 38, 34, 33, 38];
      ROOTS.forEach((r, bar) => {
        [r, r + 12, r + 7, r + 12, r, r + 12, r + 7, r + 12].forEach((m, i) => {
          const s = t0 + (bar * 8 + i) * eighth;
          tone(N(m), s, eighth * 0.7, { type: 'triangle', vol: 0.21 });
          if (i % 2 === 0) noise(s, 0.03, { vol: 0.06, from: 8000, to: 5000 });
        });
      });
    },
  },
  takuzen: {
    lead: TAKUZEN_LEAD, tempo: 100, leadType: 'triangle', leadVol: 0.16,
    bass(t0, eighth) {
      const ROOTS = [43, 43, 48, 43, 45, 43, 40, 43];
      ROOTS.forEach((r, bar) => {
        tone(N(r - 12), t0 + bar * 8 * eighth, eighth * 7.5, { type: 'triangle', vol: 0.15 });
        [0, 2, 4, 6].forEach((k) => noise(t0 + (bar * 8 + k) * eighth, 0.04, { vol: 0.12, from: 900, to: 600 }));
      });
    },
  },
  kappa: {
    lead: KAPPA_LEAD, tempo: 136, leadType: 'square', leadVol: 0.09,
    bass(t0, eighth) {
      const ROOTS = [48, 45, 48, 43, 48, 45, 43, 48];
      ROOTS.forEach((r, bar) => {
        [0, 1, 2, 4, 5, 6].forEach((k, i) => tone(N(i % 3 === 0 ? r - 12 : r), t0 + (bar * 8 + k) * eighth, eighth * 0.6, { type: 'triangle', vol: 0.2 }));
      });
    },
  },
  kiyohime: {
    lead: KIYOHIME_LEAD, tempo: 158, leadType: 'square', leadVol: 0.1,
    bass(t0, eighth) {
      const ROOTS = [40, 41, 40, 45, 40, 41, 47, 40];
      ROOTS.forEach((r, bar) => {
        [r, r + 12, r + 7, r + 12, r, r + 12, r + 7, r + 12].forEach((m, i) => {
          const s = t0 + (bar * 8 + i) * eighth;
          tone(N(m), s, eighth * 0.7, { type: 'triangle', vol: 0.21 });
          if (i % 2 === 0) noise(s, 0.03, { vol: 0.06, from: 8000, to: 5000 });
        });
      });
    },
  },
  // ---- 3章「県中・県南」（10/4）----
  kenchuField: {
    lead: KENCHU_FIELD_LEAD, tempo: 92, leadType: 'triangle', leadVol: 0.16,
    bass(t0, eighth) {
      [43, 45, 47, 45, 50, 47, 45, 43].forEach((r, bar) => {
        tone(N(r - 12), t0 + bar * 8 * eighth, eighth * 3.8, { type: 'triangle', vol: 0.18 });
        tone(N(r - 5), t0 + (bar * 8 + 4) * eighth, eighth * 3.8, { type: 'triangle', vol: 0.12 });
      });
    },
  },
  kenchuBattle: {
    lead: KENCHU_BATTLE_LEAD, tempo: 150, leadType: 'square', leadVol: 0.1,
    bass(t0, eighth) {
      [43, 45, 47, 43, 45, 50, 47, 43].forEach((r, bar) => {
        [r, r + 12, r + 7, r + 12, r, r + 12, r + 7, r + 12].forEach((m, i) => {
          const s = t0 + (bar * 8 + i) * eighth;
          tone(N(m), s, eighth * 0.7, { type: 'triangle', vol: 0.2 });
          if (i % 2 === 0) noise(s, 0.03, { vol: 0.05, from: 8000, to: 5000 });
        });
      });
    },
  },
  amekai: {
    lead: AMEKAI_LEAD, tempo: 88, leadType: 'triangle', leadVol: 0.17,
    // 低音は 長く のばすだけ（夜の 墓地の しずけさ）
    bass(t0, eighth) {
      [40, 41, 45, 40, 45, 41, 40, 40].forEach((r, bar) => tone(N(r - 12), t0 + bar * 8 * eighth, eighth * 7.5, { type: 'triangle', vol: 0.16 }));
    },
  },
  gobou: {
    lead: GOBOU_LEAD, tempo: 124, leadType: 'square', leadVol: 0.09,
    bass(t0, eighth) {
      [45, 45, 43, 40, 45, 45, 43, 45].forEach((r, bar) => {
        [0, 3, 4, 7].forEach((k, i) => tone(N(i % 2 ? r : r - 12), t0 + (bar * 8 + k) * eighth, eighth * 0.8, { type: 'triangle', vol: 0.2 }));
      });
    },
  },
  mukade: {
    lead: MUKADE_LEAD, tempo: 120, leadType: 'sawtooth', leadVol: 0.06,
    // 低音は半音で ぶつかる2音を 交互に（ミとファ）・1小節の頭に 重い 打つ音
    bass(t0, eighth) {
      [40, 41, 40, 41, 45, 46, 40, 40].forEach((r, bar) => {
        [r, r, r + 1, r].forEach((m, i) => tone(N(m - 12), t0 + (bar * 8 + i * 2) * eighth, eighth * 1.8, { type: 'square', vol: 0.08 }));
        noise(t0 + bar * 8 * eighth, 0.08, { vol: 0.09, from: 900, to: 150 });
      });
    },
  },
  heppiri: {
    lead: HEPPIRI_LEAD, tempo: 112, leadType: 'triangle', leadVol: 0.17,
    // ズン・チャッ（表に根音・裏に和音）＝のどかに
    bass(t0, eighth) {
      [48, 53, 48, 43, 50, 48, 43, 48].forEach((r, bar) => {
        for (let k = 0; k < 8; k += 2) {
          tone(N(r - 12), t0 + (bar * 8 + k) * eighth, eighth * 0.8, { type: 'triangle', vol: 0.2 });
          tone(N(r + 4), t0 + (bar * 8 + k + 1) * eighth, eighth * 0.5, { type: 'square', vol: 0.03 });
        }
      });
    },
  },
  onibaba: {
    lead: ONIBABA_LEAD, tempo: 160, leadType: 'square', leadVol: 0.1,
    bass(t0, eighth) {
      [40, 40, 36, 40, 33, 36, 40, 40].forEach((r, bar) => {
        [r, r + 12, r, r + 12, r + 1, r + 12, r, r + 12].forEach((m, i) => {
          const s = t0 + (bar * 8 + i) * eighth;
          tone(N(m), s, eighth * 0.75, { type: 'triangle', vol: 0.24 });
          if (i % 2 === 0) noise(s, 0.03, { vol: 0.07, from: 9000, to: 5000 });
        });
        noise(t0 + bar * 8 * eighth, 0.09, { vol: 0.08, from: 700, to: 120 });
      });
    },
  },
  nomaoi: {
    lead: NOMAOI_LEAD, tempo: 184, leadType: 'square', leadVol: 0.1,
    // 運動会のズン・チャッ：表拍に根音と5度（低い三角波）・裏拍に和音の刻み・1拍目と3拍目に大太鼓・2拍目と4拍目に小太鼓
    bass(t0, eighth) {
      NOMAOI_CHORDS.forEach((root, bar) => {
        const third = 4; // 長三和音（C・G・F）
        for (let k = 0; k < 8; k++) {
          const s = t0 + (bar * 8 + k) * eighth;
          if (k % 2 === 0) {
            tone(N(k % 4 === 0 ? root : root + 7), s, eighth * 0.8, { type: 'triangle', vol: 0.32 });
            if (k % 4 === 0) noise(s, 0.07, { vol: 0.11, from: 700, to: 120 }); // 大太鼓
            else noise(s, 0.09, { vol: 0.09, from: 6000, to: 1800 });            // 小太鼓
          } else {
            tone(N(root + 12 + third), s, eighth * 0.45, { type: 'square', vol: 0.035 });
            tone(N(root + 19), s, eighth * 0.45, { type: 'square', vol: 0.03 });
          }
        }
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
