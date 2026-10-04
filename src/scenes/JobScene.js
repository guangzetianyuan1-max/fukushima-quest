// 職業を選ぶ画面（本人 10/5「①ゲームは初めから4人で進める ②職業が多数あり、選択をしてからスタートする」）
// 4つの枠（主人公・しおり・仲間・仲間）に、10の職業から1つずつ。同じ職業は2人に付けない
// 職業を押す＝下に くわしく（役目・能力の点5つ・はじめからの技・章ごとに習う技）＋いま光っている枠に入る → 次の空いた枠へ
// 枠を押す＝その枠を選び直す。4つ埋まったら「この4人で 旅に出る」
import { GAME_FONT } from '../ui/fonts.js?v=162';
import { preloadKit, makeWindow } from '../ui/kit.js?v=162';
import { sfx } from '../audio/chip.js?v=162';
import { JOBS, JOB_IDS, JOB_SPELLS, POINT_NAMES, POINT_TOTAL, WEAPON_NAMES } from '../data/jobs.js?v=162';
import { newGame, validPick } from '../field/game.js?v=162';
import { choose, pickOf } from '../data/jobs.js?v=162';

const W = 360;
const FONT = GAME_FONT;
export const SLOT_LABELS = ['主人公', 'しおり', '仲間', '仲間'];
const SLOT = { y: 48, w: 84, h: 66, gap: 4 };
const GRID = { y: 122, w: 170, h: 44, gap: 6 };
const INFO = { y: 362, h: 220 };
const GO = { y: 590, h: 44 };
const BACK = { x: 8, w: 84 };

export class JobScene extends Phaser.Scene {
  constructor() {
    super('jobs');
  }

  preload() {
    preloadKit(this);
  }

  create() {
    this.cameras.main.setBackgroundColor('#14122a');
    this.leaving = false;
    this.slots = [null, null, null, null];
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
    this.onTap(backHit, () => this.back());
    const gx = BACK.x + BACK.w + 12;
    const gw = W - 8 - gx;
    this.goWin = makeWindow(this, gx, GO.y, gw, GO.h);
    this.goText = this.add.text(gx + gw / 2, GO.y + GO.h / 2, 'この4人で 旅に出る', { fontFamily: FONT, fontSize: '19px', color: '#ffffff', resolution: 3 }).setOrigin(0.5);
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
      const y = top + 30 + r * 19;
      const v = j.points[k] ?? 0;
      txt(14, y, name, 14, '#e6e6f0');
      add(this.add.rectangle(84, y + 4, 180, 10, 0x2a2850).setOrigin(0));
      if (v > 0) add(this.add.rectangle(84, y + 4, (180 * v) / 15, 10, 0xe0a83a).setOrigin(0));
      txt(272, y, String(v), 14, '#ffffff');
    });
    txt(W - 14, top + 30 + 4 * 19, `計${POINT_TOTAL}`, 12, '#8a8fa8', 1);
    const basic = j.basic ? `${JOB_SPELLS[j.basic].name}` : j.basicText;
    // 長い持ち味の文（弓矢使い・忍者など）は 窓の幅で折り返し、章の技を その下へ（10/5 はみ出していた）
    const bt = txt(14, top + 126, `はじめから：${basic}`, 14, '#ffffff').setWordWrapWidth(W - 36, true);
    const y0 = bt.y + bt.height + 2;
    j.skills.forEach((s, c) => txt(14, y0 + c * 17, `${c + 1}章で習う：${JOB_SPELLS[s].name}`, 14, '#e6e6f0'));
  }

  back() {
    if (this.leaving) return;
    this.leaving = true;
    sfx('select');
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('title'));
  }

  start() {
    const pick = pickOf(this.slots);
    if (!validPick(pick)) {
      sfx('cancel');
      return;
    }
    if (this.leaving) return;
    this.leaving = true;
    sfx('select');
    this.registry.set('game', newGame(pick));
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('field'));
  }
}
