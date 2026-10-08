// 終わりの 場面（10/8 段6・本人「語り返し＋エンドロール」）。計算は src/field/ending.js
// 字を 1つずつ 出して 待つ → さわると 早送り（とばしは 無し）。最後に 記録へ「終えた 印」を 残して 題の 画面へ
import { GAME_FONT } from '../ui/fonts.js?v=276';
import { startBgm, stopBgm, playVoice, stopVoice } from '../audio/chip.js?v=276';
import { STORY_FILES } from '../data/story_assets.js?v=276';
import { ENDING_OPEN, endingRoll, shioriLines, shioriVoices, CREDITS, markEnded } from '../field/ending.js?v=276';
import { save, slotKey } from '../field/game.js?v=276';

const W = 360;
const H = 640;

export class EndingScene extends Phaser.Scene {
  constructor() {
    super('ending');
  }

  preload() {
    const g = this.registry.get('game');
    for (const it of endingRoll(g)) if (!this.textures.exists(`col-${it.id}`)) this.load.image(`col-${it.id}`, it.img);
    if (!this.textures.exists('face_normal')) this.load.image('face_normal', 'assets/cards/face_normal.png');
  }

  create() {
    this.cameras.main.setBackgroundColor('#05040e');
    this.fast = false;
    this.input.on('pointerdown', () => { this.fast = true; this.tapped = true; }); // tapped＝1回でも さわった（声を 待つ 間の 早送り・10/8 夜）
    this.input.on('pointerup', () => { this.fast = false; });
    try { startBgm('story'); } catch { /* 音の 出ない 端末 */ }
    // 終えた 印を 先に 残す（途中で 閉じても 終えた ことに なる）
    const g = markEnded(this.registry.get('game'));
    this.registry.set('game', g);
    try { localStorage.setItem(slotKey(this.registry.get('slot') ?? 1), save(g).text); } catch { /* 残せない 端末 */ }
    this.run(g).catch((err) => console.error('ending', err));
  }

  // 早送りなら 4分の1
  wait(ms) {
    return new Promise((r) => {
      let left = ms;
      const ev = this.time.addEvent({ delay: 50, loop: true, callback: () => { left -= this.fast ? 200 : 50; if (left <= 0) { ev.remove(); r(); } } });
    });
  }

  text(x, y, t, size, color = '#ffffff') {
    return this.add.text(x, y, t, { fontFamily: GAME_FONT, fontSize: `${size}px`, color, resolution: 3, align: 'center', wordWrap: { width: 320, useAdvancedWrap: true }, lineSpacing: 8 })
      .setOrigin(0.5).setStroke('#05040e', 4);
  }

  // voice＝声の ある 行（しおりの 締め・10/8）。声が 終わるまで 次へ 進まない（早送りなら 声も 止める）
  async fadeLine(t, y = H / 2, size = 20, hold = 2200, color = '#ffffff', voice = null) {
    const o = this.text(W / 2, y, t, size, color).setAlpha(0);
    this.tweens.add({ targets: o, alpha: 1, duration: 600 });
    if (voice && STORY_FILES.includes(voice)) {
      // playVoice は 鳴り終わってから 返る＝終わるまで 待つ（早送りなら 声を 止める）・読めなければ 0 が すぐ 返る＝字の 長さで 待つ
      let ended = false;
      let sec = 0;
      playVoice(voice).then((s) => { sec = s; ended = true; });
      // 声が 鳴らない 端末（音が 止められた iPhone など）でも 先へ＝さわるか、字の 長さ＋8秒で 打ち切る（10/8 夜 読み手の 指摘）
      this.tapped = false;
      const until = Date.now() + hold + 8000;
      while (!ended) { await this.wait(100); if (this.fast || this.tapped || Date.now() > until) { stopVoice(); break; } }
      await this.wait(sec ? 500 : hold);
    } else await this.wait(hold);
    this.tweens.add({ targets: o, alpha: 0, duration: 500 });
    await this.wait(550);
    o.destroy();
  }

  // ⚠create の 中では まだ isActive() が false（作っている 途中）＝頭で 確かめると 何も 出さずに 抜けた（10/8 ブラウザで 真っ暗）
  async run(g) {
    for (const t of ENDING_OPEN) await this.fadeLine(t, H / 2, 19, 2400);
    // 光が 昇る
    for (let i = 0; i < 26; i++) {
      const p = this.add.circle(30 + Math.random() * 300, H + 10, 2 + Math.random() * 3, 0xffe8b0, 0.9);
      this.tweens.add({ targets: p, y: -20, alpha: 0.2, duration: 3500 + Math.random() * 2500, delay: Math.random() * 1500, onComplete: () => p.destroy() });
    }
    await this.wait(2600);
    // 元に 戻した 主たち
    for (const it of endingRoll(g)) {
      const im = this.textures.exists(`col-${it.id}`) ? this.add.image(W / 2, 250, `col-${it.id}`) : null;
      if (im) im.setScale(Math.min(220 / im.width, 220 / im.height)).setAlpha(0);
      const a = this.text(W / 2, 420, `${it.episode}`, 15, '#cfd8ff').setAlpha(0);
      const b = this.text(W / 2, 450, `「${it.tale}」`, 20, '#ffd27a').setAlpha(0);
      const c = this.text(W / 2, 482, it.place, 14, '#ffffff').setAlpha(0);
      const all = [im, a, b, c].filter(Boolean);
      this.tweens.add({ targets: all, alpha: 1, duration: 400 });
      await this.wait(1600);
      this.tweens.add({ targets: all, alpha: 0, duration: 300 });
      await this.wait(320);
      all.forEach((o) => o.destroy());
    }
    // しおりの 語り
    const face = this.textures.exists('face_normal') ? this.add.image(W / 2, 200, 'face_normal').setAlpha(0) : null;
    if (face) { face.setScale(Math.min(120 / face.width, 120 / face.height)); this.tweens.add({ targets: face, alpha: 1, duration: 600 }); }
    const voices = shioriVoices(g);
    for (const [i, t] of shioriLines(g).entries()) await this.fadeLine(t, 360, 18, 2600, '#ffffff', voices[i]);
    if (face) this.tweens.add({ targets: face, alpha: 0, duration: 600 });
    await this.wait(700);
    // 作り手
    for (const [k, v] of CREDITS) {
      const a = this.text(W / 2, v ? 290 : 320, k, v ? 15 : 24, v ? '#cfd8ff' : '#ffd27a').setAlpha(0);
      const b = v ? this.text(W / 2, 330, v, 18).setAlpha(0) : null;
      const all = [a, b].filter(Boolean);
      this.tweens.add({ targets: all, alpha: 1, duration: 500 });
      await this.wait(2200);
      this.tweens.add({ targets: all, alpha: 0, duration: 400 });
      await this.wait(450);
      all.forEach((o) => o.destroy());
    }
    const end = this.text(W / 2, H / 2, 'おわり', 34, '#ffd27a').setAlpha(0);
    this.tweens.add({ targets: end, alpha: 1, duration: 900 });
    await this.wait(2000);
    const tap = this.text(W / 2, 560, 'さわると 題の 画面へ', 15, '#cfd8ff');
    this.done = true;
    this.input.once('pointerup', () => {
      tap.destroy();
      try { stopBgm(); } catch { /* 音の 出ない 端末 */ }
      this.scene.start('title');
    });
  }
}
