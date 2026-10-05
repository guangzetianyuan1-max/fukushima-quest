// 職業を選ぶ画面（本人 10/5「①ゲームは初めから4人で進める ②職業が多数あり、選択をしてからスタートする」）
// 4つの枠（主人公・しおり・仲間・仲間）に、10の職業から1つずつ。同じ職業は2人に付けない
// 職業を押す＝下に くわしく（役目・能力の点5つ・はじめからの技・章ごとに習う技）＋いま光っている枠に入る → 次の空いた枠へ
// 枠を押す＝その枠を選び直す。4つ埋まったら「この4人で 旅に出る」
import { GAME_FONT } from '../ui/fonts.js?v=189';
import { preloadKit, makeWindow } from '../ui/kit.js?v=189';
import { sfx } from '../audio/chip.js?v=189';
import { JOBS, JOB_IDS, JOB_SPELLS, POINT_NAMES, POINT_TOTAL, WEAPON_NAMES, adviceOf } from '../data/jobs.js?v=189';
import { newGame, validPick, validHeroName, HERO_NAME_MAX } from '../field/game.js?v=189';
import { choose, pickOf, undoPick } from '../data/jobs.js?v=189';

const W = 360;
const FONT = GAME_FONT;
export const SLOT_LABELS = ['あなた', 'しおり', '仲間①', '仲間②']; // 10/5 本人「主人公→あなた・仲間→仲間①②」
const SLOT = { y: 48, w: 84, h: 66, gap: 4 };
const GRID = { y: 122, w: 170, h: 40, gap: 5 }; // 10/5 技の効き目を出すため 少し詰めた
const INFO = { y: 348, h: 238 };
const GO = { y: 590, h: 44 };
const BACK = { x: 8, w: 84 };
// 名前に使える ひらがな（10列で並べる）
export const KANA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽぁぃぅぇぉゃゅょっー';

export class JobScene extends Phaser.Scene {
  constructor() {
    super('jobs');
  }

  preload() {
    preloadKit(this);
    if (!this.textures.exists('face_normal')) this.load.image('face_normal', 'assets/cards/face_normal.png'); // アドバイスの しおりの顔
  }

  create() {
    this.cameras.main.setBackgroundColor('#14122a');
    this.leaving = false;
    this.naming = false;
    this.advising = false;
    this.slots = [null, null, null, null];
    this.history = []; // 戻るで 取り消す順
    this.active = 0;
    this.shown = null;
    this.add.text(W / 2, 24, '4人の 職業を えらぶ', { fontFamily: FONT, fontSize: '22px', color: '#ffd98a', resolution: 3 }).setOrigin(0.5);
    // 4つの枠
    this.slotUi = SLOT_LABELS.map((label, i) => {
      const x = 6 + i * (SLOT.w + SLOT.gap);
      const win = makeWindow(this, x, SLOT.y, SLOT.w, SLOT.h);
      const lab = this.add.text(x + SLOT.w / 2, SLOT.y + 21, label, { fontFamily: FONT, fontSize: '14px', color: '#b8bcd8', resolution: 3 }).setOrigin(0.5);
      const name = this.add.text(x + SLOT.w / 2, SLOT.y + 45, '？', { fontFamily: FONT, fontSize: '18px', color: '#ffffff', resolution: 3 }).setOrigin(0.5);
      const hit = this.add.zone(x + SLOT.w / 2, SLOT.y + SLOT.h / 2, SLOT.w, SLOT.h).setInteractive();
      this.onTap(hit, () => {
        this.active = i;
        sfx('select');
        if (this.slots[i]) this.showInfo(this.slots[i]);
        this.refresh();
      });
      return { win, lab, name };
    });
    // 10の職業（2列×5段）
    this.jobUi = JOB_IDS.map((id, k) => {
      const x = 8 + (k % 2) * (GRID.w + GRID.gap);
      const y = GRID.y + Math.floor(k / 2) * (GRID.h + GRID.gap);
      const win = makeWindow(this, x, y, GRID.w, GRID.h);
      const t = this.add.text(x + GRID.w / 2, y + GRID.h / 2, JOBS[id].name, { fontFamily: FONT, fontSize: '19px', color: '#ffffff', resolution: 3 }).setOrigin(0.5);
      const who = this.add.text(x + 13, y + GRID.h / 2, '', { fontFamily: FONT, fontSize: '11px', color: '#ffd98a', resolution: 3 }).setOrigin(0, 0.5); // 枠の左に 入った枠の名前（名前の長い 弓矢使いとも重ならない）
      const hit = this.add.zone(x + GRID.w / 2, y + GRID.h / 2, GRID.w, GRID.h).setInteractive();
      this.onTap(hit, () => {
        this.history.push(this.active);
        const r = choose(this.slots, this.active, id);
        this.slots = r.slots;
        this.active = r.active;
        sfx('select');
        this.showInfo(id);
        this.refresh();
      });
      return { id, win, t, who };
    });
    // くわしく
    makeWindow(this, 4, INFO.y, W - 8, INFO.h);
    this.info = this.add.container(0, 0);
    // 旅に出る
    // 戻る（本人 10/5「職業選択の画面で『戻る』のボタン」）＝題の画面へ。左に小さく・旅に出るは右に大きく（押しまちがえないよう間を空ける）
    makeWindow(this, BACK.x, GO.y, BACK.w, GO.h);
    this.add.text(BACK.x + BACK.w / 2, GO.y + GO.h / 2, '戻る', { fontFamily: FONT, fontSize: '20px', color: '#ffffff', resolution: 3 }).setOrigin(0.5);
    const backHit = this.add.zone(BACK.x + BACK.w / 2, GO.y + GO.h / 2, BACK.w, GO.h).setInteractive();
    this.onTap(backHit, () => this.undo());
    // アドバイス（本人 10/5「4人を選んだところで『アドバイス』のボタン・PTのバランス解説」）＝4人そろったら押せる
    const ax = BACK.x + BACK.w + 8;
    const aw = 116;
    this.advWin = makeWindow(this, ax, GO.y, aw, GO.h);
    this.advText = this.add.text(ax + aw / 2, GO.y + GO.h / 2, 'アドバイス', { fontFamily: FONT, fontSize: '18px', color: '#ffffff', resolution: 3 }).setOrigin(0.5);
    const advHit = this.add.zone(ax + aw / 2, GO.y + GO.h / 2, aw, GO.h).setInteractive();
    this.onTap(advHit, () => this.showAdvice());
    const gx = ax + aw + 8;
    const gw = W - 8 - gx;
    this.goWin = makeWindow(this, gx, GO.y, gw, GO.h);
    this.goText = this.add.text(gx + gw / 2, GO.y + GO.h / 2, '旅に出る', { fontFamily: FONT, fontSize: '19px', color: '#ffffff', resolution: 3 }).setOrigin(0.5);
    const goHit = this.add.zone(gx + gw / 2, GO.y + GO.h / 2, gw, GO.h).setInteractive();
    this.onTap(goHit, () => this.start());
    this.showInfo(null);
    this.refresh();
  }

  // 押して、その上で離したときだけ決まる（ほかの画面と同じ）
  onTap(zone, fn) {
    let down = false;
    zone.on('pointerdown', () => { down = true; });
    zone.on('pointerout', () => { down = false; });
    zone.on('pointerup', () => {
      if (!down) return;
      down = false;
      fn();
    });
  }

  refresh() {
    this.slotUi.forEach((u, i) => {
      u.name.setText(this.slots[i] ? JOBS[this.slots[i]].name : '？');
      u.win.setAlpha(i === this.active ? 1 : 0.6);
      u.lab.setColor(i === this.active ? '#ffd98a' : '#b8bcd8');
    });
    for (const u of this.jobUi) {
      const at = this.slots.indexOf(u.id);
      u.who.setText(at >= 0 ? SLOT_LABELS[at] : '');
      u.t.setColor(at >= 0 ? '#ffd98a' : u.id === this.shown ? '#ffffff' : '#e6e6f0');
      u.win.setAlpha(u.id === this.shown ? 1 : 0.75);
    }
    const ok = validPick(pickOf(this.slots));
    this.goWin.setAlpha(ok ? 1 : 0.4);
    this.goText.setColor(ok ? '#ffd98a' : '#8a8fa8');
    this.advWin.setAlpha(ok ? 1 : 0.4);
    this.advText.setColor(ok ? '#b8d8ff' : '#8a8fa8');
  }

  // 職業の くわしく：名前と役目・武器・能力の点（棒）・はじめからの技・章ごとに習う技
  showInfo(id) {
    this.shown = id;
    this.info.removeAll(true);
    const add = (o) => { this.info.add(o); return o; };
    const txt = (x, y, s, size = 15, color = '#ffffff', o = 0) => add(this.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 3 }).setOrigin(o, 0));
    const top = INFO.y + 12;
    if (!id) {
      txt(W / 2, top + 50, '光っている 枠に 入れる 職業を\n下から えらんでください。', 17, '#ffffff', 0.5).setAlign('center');
      txt(W / 2, top + 120, 'どの職業も 能力の点は 合計30。\n技は 1章から3章の町で 師匠の\n試しを受けて 1つずつ 習います。', 15, '#b8bcd8', 0.5).setAlign('center');
      return;
    }
    const j = JOBS[id];
    txt(14, top, `${j.name}　${j.role}`, 19, '#ffd98a');
    txt(W - 14, top + 3, `武器：${WEAPON_NAMES[j.weapon]}`, 14, '#b8bcd8', 1);
    // 能力の点（合計30）：棒の長さ＝点（15で いっぱい）
    Object.entries(POINT_NAMES).forEach(([k, name], r) => {
      const y = top + 26 + r * 15;
      const v = j.points[k] ?? 0;
      txt(14, y, name, 14, '#e6e6f0');
      add(this.add.rectangle(84, y + 3, 180, 9, 0x2a2850).setOrigin(0));
      if (v > 0) add(this.add.rectangle(84, y + 3, (180 * v) / 15, 9, 0xe0a83a).setOrigin(0));
      txt(272, y, String(v), 14, '#ffffff');
    });
    txt(W - 14, top + 26 + 4 * 15, `計${POINT_TOTAL}`, 12, '#8a8fa8', 1);
    // 技ごとに 名前（14）と その下に 効き目（12・水色）＝10/5 本人「必殺技の効果を入れて」
    let y = top + 100;
    const line = (head, sp, fallback) => {
      const t = txt(14, y, `${head}：${sp ? sp.name : fallback}`, 14, '#ffffff').setWordWrapWidth(W - 36, true); // 長い持ち味の文は折り返す
      y += t.height + 1;
      const d = sp?.desc;
      if (d) {
        txt(26, y, d, 12, '#b8d8ff');
        y += 14;
      }
    };
    line('はじめから', j.basic ? JOB_SPELLS[j.basic] : null, j.basicText);
    j.skills.forEach((s, c) => line(`${c + 1}章で習う`, JOB_SPELLS[s]));
  }

  // しおりの アドバイス：4人の 釣り合い（◎○△）と 短い 助言
  showAdvice() {
    const pick = pickOf(this.slots);
    if (!validPick(pick) || this.naming || this.advising) { sfx('cancel'); return; }
    sfx('select');
    this.advising = true;
    const a = adviceOf(pick);
    const box = this.add.container(0, 0).setDepth(100);
    box.add(this.add.rectangle(0, 0, W, 640, 0x05030c, 0.75).setOrigin(0).setInteractive());
    box.add(makeWindow(this, 8, 60, W - 16, 520));
    if (this.textures.exists('face_normal')) box.add(this.add.image(58, 112, 'face_normal').setDisplaySize(72, 72));
    box.add(this.add.text(102, 92, 'しおりの アドバイス', { fontFamily: FONT, fontSize: '20px', color: '#ffd98a', resolution: 3 }));
    box.add(this.add.text(102, 120, [pick.tabi, pick.shiori, ...pick.mates].map((j) => JOBS[j].name).join('・'), { fontFamily: FONT, fontSize: '13px', color: '#b8bcd8', resolution: 3, wordWrap: { width: W - 130, useAdvancedWrap: true } }));
    // 総合力のグラフ（本人 10/5「ひし形のやつ」）＝6つの見立ての レーダー。軸の先に 名前と ◎○△
    const C = { x: W / 2, y: 228, r: 62 };
    const ang = (i) => -Math.PI / 2 + (i * Math.PI * 2) / a.rows.length;
    const pt = (i, k) => [C.x + Math.cos(ang(i)) * C.r * k, C.y + Math.sin(ang(i)) * C.r * k];
    const g = this.add.graphics();
    for (const k of [1 / 3, 2 / 3, 1]) {
      g.lineStyle(1, 0x5a5890, 1).beginPath();
      a.rows.forEach((_, i) => { const [x, y] = pt(i, k); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
      g.closePath().strokePath();
    }
    a.rows.forEach((_, i) => { const [x, y] = pt(i, 1); g.lineStyle(1, 0x5a5890, 1).lineBetween(C.x, C.y, x, y); });
    const poly = a.scores.map((v, i) => pt(i, Math.max(0.06, v)));
    g.fillStyle(0xe0a83a, 0.45).beginPath();
    poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath().fillPath();
    g.lineStyle(2, 0xffd98a, 1).beginPath();
    poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath().strokePath();
    for (const [x, y] of poly) g.fillStyle(0xffd98a, 1).fillCircle(x, y, 3);
    box.add(g);
    a.rows.forEach(([name, m], i) => {
      const [x, y] = pt(i, 1.32);
      const col = m === '◎' ? '#ffd98a' : m === '○' ? '#ffffff' : '#ff9a8a';
      box.add(this.add.text(x, y, `${name}${m}`, { fontFamily: FONT, fontSize: '15px', color: col, resolution: 3 }).setOrigin(0.5));
    });
    let y = 324;
    for (const t of a.lines) {
      const tx = this.add.text(30, y, t, { fontFamily: FONT, fontSize: '14px', color: '#ffffff', resolution: 3, lineSpacing: 3, wordWrap: { width: W - 60, useAdvancedWrap: true } });
      box.add(tx);
      y += tx.height + 8;
    }
    box.add(makeWindow(this, W / 2 - 70, 590, 140, 44));
    box.add(this.add.text(W / 2, 612, 'とじる', { fontFamily: FONT, fontSize: '19px', color: '#ffffff', resolution: 3 }).setOrigin(0.5));
    const z = this.add.zone(W / 2, 612, 140, 44).setInteractive();
    this.onTap(z, () => { sfx('select'); box.destroy(); this.advising = false; });
    box.add(z);
    this.adviceBox = box; // 確かめ用
  }

  // 戻る＝ひとつ前の選びを取り消す。1つも選んでいなければ 題の画面へ
  undo() {
    if (this.leaving || this.naming || this.advising) return;
    const r = undoPick(this.slots, this.history);
    if (!r) { this.back(); return; }
    sfx('cancel');
    this.slots = r.slots;
    this.active = r.active;
    this.history = r.history;
    this.showInfo(null);
    this.refresh();
  }

  back() {
    if (this.leaving) return;
    this.leaving = true;
    sfx('select');
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('title'));
  }

  // 「この4人で 旅に出る」→ あなたの名前を入れる（ひらがな4文字まで）→ 旅へ
  start() {
    const pick = pickOf(this.slots);
    if (!validPick(pick)) {
      sfx('cancel');
      return;
    }
    if (this.leaving || this.naming || this.advising) return;
    sfx('select');
    this.askName(pick);
  }

  askName(pick) {
    this.naming = true;
    const box = this.add.container(0, 0).setDepth(100);
    this.nameBox = box;
    const shade = this.add.rectangle(0, 0, W, 640, 0x14122a, 1).setOrigin(0).setInteractive();
    box.add(shade);
    box.add(this.add.text(W / 2, 30, 'あなたの 名前を つけてください', { fontFamily: FONT, fontSize: '20px', color: '#ffd98a', resolution: 3 }).setOrigin(0.5));
    box.add(this.add.text(W / 2, 56, `（ひらがな ${HERO_NAME_MAX}文字まで）`, { fontFamily: FONT, fontSize: '14px', color: '#b8bcd8', resolution: 3 }).setOrigin(0.5));
    box.add(makeWindow(this, 70, 74, W - 140, 56));
    const shown = this.add.text(W / 2, 102, '', { fontFamily: FONT, fontSize: '28px', color: '#ffffff', resolution: 3 }).setOrigin(0.5);
    box.add(shown);
    let name = '';
    const show = () => shown.setText([...name].concat(Array(HERO_NAME_MAX - [...name].length).fill('＿')).join(' '));
    show();
    const tapZone = (x, y, w, h, fn) => {
      const z = this.add.zone(x, y, w, h).setOrigin(0).setInteractive();
      this.onTap(z, fn);
      box.add(z);
      return z;
    };
    // かなの表（10列）
    const COLS = 10;
    const CELL = 33;
    const gx = (W - COLS * CELL) / 2;
    const gy = 146;
    [...KANA].forEach((ch, k) => {
      const x = gx + (k % COLS) * CELL;
      const y = gy + Math.floor(k / COLS) * CELL;
      box.add(this.add.rectangle(x + 1, y + 1, CELL - 2, CELL - 2, 0x24224a).setOrigin(0).setStrokeStyle(1, 0x4a4880));
      box.add(this.add.text(x + CELL / 2, y + CELL / 2, ch, { fontFamily: FONT, fontSize: '19px', color: '#ffffff', resolution: 3 }).setOrigin(0.5));
      tapZone(x, y, CELL, CELL, () => {
        if ([...name].length >= HERO_NAME_MAX) { sfx('cancel'); return; }
        name += ch;
        sfx('select');
        show();
      });
    });
    const by = gy + Math.ceil(KANA.length / COLS) * CELL + 14;
    const btn = (x, w, label, fn) => {
      box.add(makeWindow(this, x, by, w, 46));
      box.add(this.add.text(x + w / 2, by + 23, label, { fontFamily: FONT, fontSize: '19px', color: '#ffffff', resolution: 3 }).setOrigin(0.5));
      tapZone(x, by, w, 46, fn);
    };
    btn(8, 100, 'もどる', () => { sfx('select'); box.destroy(); this.nameBox = null; this.naming = false; });
    btn(116, 100, 'けす', () => { name = [...name].slice(0, -1).join(''); sfx('select'); show(); });
    btn(224, 128, 'きめる', () => {
      if (!validHeroName(name)) { sfx('cancel'); shown.setText('名前を いれてね'); this.time.delayedCall(900, show); return; }
      this.go({ ...pick, name });
    });
    // 確かめ用の取っ手（遊ぶ人には見えない）
    this.nameInput = { type: (t) => { for (const ch of t) if ([...name].length < HERO_NAME_MAX && KANA.includes(ch)) name += ch; show(); }, get: () => name };
  }

  go(pick) {
    if (this.leaving) return;
    this.leaving = true;
    sfx('select');
    this.registry.set('game', newGame(pick));
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('field'));
  }
}
