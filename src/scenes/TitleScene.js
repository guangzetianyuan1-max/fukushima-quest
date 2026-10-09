import { GAME_FONT, TITLE_WEIGHT } from '../ui/fonts.js?v=294';
import { unlock, startBgm, stopBgm, sfx } from '../audio/chip.js?v=294';
import { BRUSH_FONT, smooth } from '../ui/scroll.js?v=294';
import { load, SLOT_COUNT, slotKey, slotSummary } from '../field/game.js?v=294';
import { preloadKit, makeWindow } from '../ui/kit.js?v=294';
import { CURRENT } from '../ui/update.js?v=294';

// 題の画面（本人 10/1「さわってはじめる、から音楽が欲しい」）
// ⭐10/3 本人「アイコンクリック後、『はじめから』『つづきから』を加えてほしい」＝下に2つの札。押した札で始まる（1回で）
//   つづきから＝記録（お参り・ボスの後の自動セーブ・セーブして終わる）があるときだけ押せる。無ければ薄く出す
// 以下は 10/3 までの作り（①②の「どこをさわっても始まる」は札を押したときだけに変えた）
// ① 開いた時：題と巻物と「▶ さわって はじめる」（音はブラウザの決まりで、まだ出せない）
// ② 1回さわる：始まりの曲が鳴り、「旅に 出る……」のまま2.4秒かけて暗くなり、歩く地図へ（記録があれば その場所から）
//    （本人 10/1「もういちどさわって、を押すと同じ画面、また押すと進む。1回余計」＝2回目のさわりを無くした）
//    暗くなる途中でさわれば、すぐ戦いへ
const W = 360;
const TITLE_VIDEO = 'assets/title_dance.mp4?v=2'; // 動画を作り直したら番号を上げる（スマホが前の動画を覚えている）
const TITLE_FONT = GAME_FONT; // 10/4 夜 ドットのゴシックへ（前＝毛筆の Potta One）
const DOT = GAME_FONT;

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  preload() {
    // ⭐10/4 表紙＝夜桜の下で しおりが舞う動画（本人「3Dしおりが桜の下で、桜吹雪の中、舞っている動画」）
    // 動画が出るまで（読み込み中・自動再生できない端末）は1コマ目の止め絵。作り＝art_src/make_title_video.py
    if (!this.textures.exists('title_still')) this.load.image('title_still', 'assets/title_still.png');
    preloadKit(this); // 札の枠（窓と同じ絵）
  }

  create() {
    this.add.image(0, 0, 'title_still').setOrigin(0);
    // いま 動いている 版（10/7 本人「未だUP出来てない」＝スマホが 古い 版の ままか 見分けられなかった）＝右下に 小さく
    if (CURRENT) this.add.text(354, 634, `版 ${CURRENT}`, { fontFamily: GAME_FONT, fontSize: '12px', color: '#ffffff', resolution: 3, stroke: '#000000', strokeThickness: 3 }).setOrigin(1, 1).setDepth(1000).setAlpha(0.75);
    // 舞の動画（8秒でつながる・音なし）。⚠読み込みを preload に入れない＝iPhone で動画の読み込みが終わらず題の画面が出ないことがある
    try {
      const v = this.add.video(0, 0).setOrigin(0).setVisible(false);
      v.loadURL(TITLE_VIDEO, true);
      v.setLoop(true);
      // ⚠Phaser の play() は、読み込み前・画面が裏にある時に呼ぶと そのまま止まっていた（10/4 内蔵ブラウザ）＝動画の要素を直接 鳴らす（音なし）
      //   読み込めた時・画面が表に出た時・最初にさわった時に、止まっていれば始める
      const el = v.video;
      const start = () => {
        if (!el || !el.paused) return;
        el.muted = true; el.playsInline = true; el.loop = true;
        const pr = el.play();
        if (pr) pr.catch(() => {});
      };
      if (el) {
        el.addEventListener('playing', () => v.setVisible(true), { once: true });
        el.addEventListener('canplay', start, { once: true });
      }
      const onVis = () => { if (!document.hidden) start(); };
      document.addEventListener('visibilitychange', onVis);
      this.input.once('pointerdown', start);
      this.events.once('shutdown', () => { document.removeEventListener('visibilitychange', onVis); if (el) el.pause(); });
      start();
      this.video = v;
    } catch {
      this.video = null; // 動画を使えない端末は止め絵のまま
    }
    this.petals(); // 桜吹雪はゲームの中で降らせる（動画に入れない＝つなぎ目が無い）

    // 題字は太い毛筆の Potta One（本人 10/1「文字がダサい。習字の太字に」＝Yuji Boku は細くかすれ、RPG の英字も崩れた）
    // 題字は2行で大きく（本人 10/1「もっと大きく2行に」）。10/4 表紙は題字と下の2つの札だけ（本人「下に、『はじめから』『つづきから』のボタンのみ」）
    const title = (text, y, size) => smooth(this.add.text(W / 2, y, text, {
      fontFamily: TITLE_FONT, fontStyle: TITLE_WEIGHT, fontSize: `${size}px`, color: '#ffffff', resolution: 3,
      stroke: '#1a1008', strokeThickness: 10,
    }).setOrigin(0.5));
    title('福島昔話', 72, 58);
    title('クエストRPG', 136, 46);

    // 記憶①〜③（10/7 本人「いろいろな組み合わせで楽しむため」）＝3つの札。選んだ記憶で はじめる・つづける
    const read = (n) => {
      try {
        return load(localStorage.getItem(slotKey(n)) ?? '');
      } catch {
        return null;
      }
    };
    // ⛔10/7 本人「セーブして終了を押したら、フリーズ」＝2回目に開いた題の画面で、前の回の（消えた）知らせの字に setText して create が止まった
    //   ＝前の回の部品は ここで 手放す（題の画面は 同じ遊びの中で 何度も 作り直される）
    this.prompt = null;
    this.slots = Array.from({ length: SLOT_COUNT }, (_, i) => read(i + 1));
    let last = 1;
    try { last = Number(localStorage.getItem('fq-slot')) || 1; } catch { /* 残せない端末 */ }
    this.slot = Math.min(Math.max(last, 1), SLOT_COUNT);
    this.saved = this.slots[this.slot - 1];
    this.fresh = false;
    this.confirmAt = null; // 記録のある記憶で「はじめから」＝もう一度 押して決める
    const SL = { w: 304, h: 40, y0: 446, gap: 46 };
    const MARK = ['①', '②', '③'];
    this.slotUi = this.slots.map((g, i) => {
      const cy = SL.y0 + i * SL.gap;
      const win = makeWindow(this, W / 2 - SL.w / 2, cy - SL.h / 2, SL.w, SL.h);
      const frame = this.add.graphics();
      const label = this.add.text(W / 2 - SL.w / 2 + 14, cy, `記憶${MARK[i]}`, { fontFamily: DOT, fontSize: '17px', color: '#ffffff', resolution: 3 }).setOrigin(0, 0.5);
      const sum = this.add.text(W / 2 - SL.w / 2 + 92, cy, slotSummary(g) ?? '― 空き ―', { fontFamily: DOT, fontSize: '14px', color: g ? '#ffffff' : '#8a8fa8', resolution: 3 }).setOrigin(0, 0.5);
      if (sum.width > SL.w - 102) sum.setScale((SL.w - 102) / sum.width);
      return { cy, win, frame, label, sum, hit: (x, y) => Math.abs(x - W / 2) <= SL.w / 2 && Math.abs(y - cy) <= SL.gap / 2 };
    });
    // 2つの札（左＝はじめから・右＝つづきから）。親指で押しやすい大きさ
    const BTN = { w: 156, h: 50, y: 592 };
    const makeBtn = (cx, label, enabled) => {
      const win = makeWindow(this, cx - BTN.w / 2, BTN.y - BTN.h / 2, BTN.w, BTN.h).setAlpha(enabled ? 1 : 0.45);
      const t = this.add.text(cx, BTN.y, label, { fontFamily: DOT, fontSize: '21px', color: enabled ? '#ffffff' : '#8a8fa8', resolution: 3 }).setOrigin(0.5);
      return { cx, win, t, enabled, hit: (x, y) => Math.abs(x - cx) <= BTN.w / 2 + 6 && Math.abs(y - BTN.y) <= BTN.h / 2 + 10 };
    };
    this.btns = { fresh: makeBtn(W / 2 - 84, 'はじめから', true), cont: makeBtn(W / 2 + 84, 'つづきから', !!this.saved) };
    // 記録がある時は「つづきから」をそっと光らせる（押す先の目印）
    let glow = null;
    const pickSlot = (n) => {
      this.slot = n;
      this.saved = this.slots[n - 1];
      this.confirmAt = null;
      try { localStorage.setItem('fq-slot', String(n)); } catch { /* 残せない端末 */ }
      this.slotUi.forEach((s, i) => {
        const on = i === n - 1;
        s.win.setAlpha(on ? 1 : 0.55);
        s.label.setColor(on ? '#ffd98a' : '#cfd3e6');
        s.frame.clear();
        if (on) s.frame.lineStyle(2, 0xffd98a, 1).strokeRoundedRect(W / 2 - SL.w / 2 + 2, s.cy - SL.h / 2 + 2, SL.w - 4, SL.h - 4, 6);
      });
      const c = this.btns.cont;
      c.enabled = !!this.saved;
      c.win.setAlpha(c.enabled ? 1 : 0.45);
      c.t.setColor(c.enabled ? '#ffffff' : '#8a8fa8');
      if (glow) { this.tweens.killTweensOf(glow); glow.setAlpha(1); }
      glow = this.saved ? c.t : this.btns.fresh.t;
      this.tweens.add({ targets: glow, alpha: 0.4, duration: 900, yoyo: true, repeat: -1 });
      this.prompt?.setText('');
    };
    pickSlot(this.slot);
    this.prompt = this.add.text(W / 2, 628, '', { fontFamily: DOT, fontSize: '16px', color: '#ffffff', resolution: 3 }).setOrigin(0.5);

    // 記憶を消す（10/7 本人「記憶①～③は削除できるように。『本当に削除していいですか？』の念押しを」）
    // 「記憶を消す」を押す → 消す記憶を選ぶ → 念押しの窓「はい／いいえ」。同じ指の二度押し（0.35秒）は数えない
    const DEL = { w: 104, h: 30, x: W / 2 + SL.w / 2 - 52, y: SL.y0 - SL.h / 2 - 22 };
    const delWin = makeWindow(this, DEL.x - DEL.w / 2, DEL.y - DEL.h / 2, DEL.w, DEL.h);
    const delTxt = this.add.text(DEL.x, DEL.y, '記憶を 消す', { fontFamily: DOT, fontSize: '14px', color: '#ffffff', resolution: 3 }).setOrigin(0.5);
    const delHit = (x, y) => Math.abs(x - DEL.x) <= DEL.w / 2 + 4 && Math.abs(y - DEL.y) <= DEL.h / 2 + 6;
    this.delMode = false;
    this.modal = null;
    this.actAt = -1000;
    const ready = () => { if (this.time.now - this.actAt < 350) return false; this.actAt = this.time.now; return true; };
    const setDelMode = (on) => {
      this.delMode = on;
      delTxt.setText(on ? 'やめる' : '記憶を 消す').setColor(on ? '#ffb0a0' : '#ffffff');
      this.slotUi.forEach((s) => s.frame.lineStyle(2, 0xff8070, on ? 1 : 0));
      if (on) this.slotUi.forEach((s) => s.frame.strokeRoundedRect(W / 2 - SL.w / 2 + 2, s.cy - SL.h / 2 + 2, SL.w - 4, SL.h - 4, 6));
      else pickSlot(this.slot);
      this.prompt.setText(on ? '消す 記憶を 選んで ください' : '');
    };
    const openModal = (n) => {
      const box = this.add.container(0, 0).setDepth(50);
      box.add(this.add.rectangle(0, 0, W, 640, 0x000000, 0.55).setOrigin(0));
      box.add(makeWindow(this, 30, 250, W - 60, 150));
      box.add(this.add.text(W / 2, 296, `記憶${MARK[n - 1]}を
本当に 削除して いいですか？`, { fontFamily: DOT, fontSize: '18px', color: '#ffffff', align: 'center', resolution: 3, lineSpacing: 6 }).setOrigin(0.5));
      const yes = { x: W / 2 - 64, y: 362 }, no = { x: W / 2 + 64, y: 362 };
      for (const [b, label, col] of [[yes, 'はい', '#ffb0a0'], [no, 'いいえ', '#ffffff']]) {
        box.add(makeWindow(this, b.x - 50, b.y - 20, 100, 40));
        box.add(this.add.text(b.x, b.y, label, { fontFamily: DOT, fontSize: '19px', color: col, resolution: 3 }).setOrigin(0.5));
      }
      const hit = (b, x, y) => Math.abs(x - b.x) <= 54 && Math.abs(y - b.y) <= 24;
      this.modal = { box, n, yes: (x, y) => hit(yes, x, y), no: (x, y) => hit(no, x, y) };
    };
    const closeModal = () => { this.modal?.box.destroy(); this.modal = null; };
    const eraseSlot = (n) => {
      try { localStorage.removeItem(slotKey(n)); } catch { /* 残せない端末 */ }
      this.slots[n - 1] = null;
      const u = this.slotUi[n - 1];
      u.sum.setText('― 空き ―').setColor('#8a8fa8').setScale(1);
      closeModal();
      setDelMode(false);
      this.prompt.setText(`記憶${MARK[n - 1]}を 削除しました`);
    };
    this.erase = { setDelMode, openModal, eraseSlot }; // 確かめ用の 取っ手

    this.stage = 0;
    const begin = (fresh) => {
      if (this.stage !== 0) return;
      this.stage = 1;
      this.fresh = fresh;
      unlock();
      this.registry.set('started', true);
      this.registry.set('slot', this.slot); // 地図の記録は この記憶へ
      startBgm('title');
      sfx('select');
      this.tweens.killTweensOf(glow);
      glow.setAlpha(1);
      const chosen = fresh ? this.btns.fresh : this.btns.cont;
      chosen.t.setColor('#ffd98a');
      this.prompt.setText(`記憶${MARK[this.slot - 1]}：${fresh ? '旅に 出る……' : '旅の つづきへ……'}`);
      this.cameras.main.fadeOut(1200, 0, 0, 0); // 10/2 2.4秒→1.2秒（待たされて もう一度さわる人がいた）
      this.cameras.main.once('camerafadeoutcomplete', () => this.go());
      this.skipAt = this.time.now + 400; // 同じ指の二度押しで飛ばさない
    };
    // 押した所が どちらの札か（どちらでもなければ何もしない＝絵をさわっただけでは始まらない）
    const press = (x, y) => {
      if (this.stage === 1 && this.time.now >= this.skipAt) { this.go(); return; }
      if (this.stage !== 0) return;
      // 念押しの窓が 出て いる 間は「はい／いいえ」だけ
      if (this.modal) {
        if (this.modal.yes(x, y) && ready()) { sfx('damage'); eraseSlot(this.modal.n); }
        else if (this.modal.no(x, y) && ready()) { sfx('select'); closeModal(); setDelMode(false); }
        return;
      }
      if (delHit(x, y)) {
        if (!ready()) return;
        sfx('select');
        if (!this.delMode && !this.slots.some(Boolean)) { this.prompt.setText('消せる 記憶が ありません'); return; }
        setDelMode(!this.delMode);
        return;
      }
      // 記憶の札：さわると その記憶を選ぶ（消す 記憶を 選ぶ 時は 念押しの 窓）
      const s = this.slotUi.findIndex((u) => u.hit(x, y));
      if (s >= 0 && this.delMode) {
        if (!ready()) return;
        if (!this.slots[s]) { this.prompt.setText('空きの 記憶です'); return; }
        sfx('select');
        openModal(s + 1);
        return;
      }
      if (s >= 0) { if (this.slot !== s + 1) { sfx('select'); pickSlot(s + 1); } return; }
      if (this.delMode) return; // 消す 記憶を 選ぶ 間は はじめから・つづきからを 押さない
      // 記録のある記憶で「はじめから」＝1回目は知らせるだけ（同じ指の二度押し＝0.35秒以内は数えない）
      const freshFor = (go) => {
        if (!this.saved) return go();
        if (this.confirmAt !== null && this.time.now - this.confirmAt > 350) return go();
        if (this.confirmAt === null) { this.confirmAt = this.time.now; sfx('select'); this.prompt.setText(`もう一度 押すと 記憶${MARK[this.slot - 1]}を 上書き`); }
      };
      // 2つの札の当たりは真ん中の1列で重なる＝近い方の札（同じ近さなら つづきから＝記録を捨てない向き・10/4 試運転）
      const nearCont = Math.abs(x - this.btns.cont.cx) <= Math.abs(x - this.btns.fresh.cx);
      if (this.btns.fresh.hit(x, y) && !(this.btns.cont.enabled && nearCont && this.btns.cont.hit(x, y))) freshFor(() => begin(true));
      else if (this.btns.cont.enabled && this.btns.cont.hit(x, y)) begin(false);
      else if (this.btns.cont.hit(x, y)) this.prompt.setText('まだ 旅の 記録が ありません');
    };
    this.input.on('pointerdown', (p) => press(p.x, p.y));
    // 本人 10/2「冒頭『さわってはじめる』を2回押さないと、ゲームに入れない」＝iPhone では1回目のタッチが絵（canvas）の pointerdown まで届かないことがある
    // ⇒ 指を離した瞬間・クリックでも、そのときの指の位置で札を見る（この画面の間だけ）
    const domPress = () => { const p = this.input.activePointer; if (this.stage === 0 && p) press(p.x, p.y); };
    for (const ev of ['touchend', 'pointerup', 'click']) document.addEventListener(ev, domPress, { passive: true });
    this.events.once('shutdown', () => {
      for (const ev of ['touchend', 'pointerup', 'click']) document.removeEventListener(ev, domPress);
    });
  }

  // 桜吹雪：淡い桃色の花びらが、上から ゆらゆら回りながら降る
  petals() {
    if (!this.textures.exists('petal')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffd3e2, 1).fillEllipse(4, 3, 8, 5);
      g.fillStyle(0xffffff, 0.8).fillEllipse(3, 2, 3, 2);
      g.generateTexture('petal', 8, 6);
      g.destroy();
    }
    const em = this.add.particles(0, 0, 'petal', {
      x: { min: -40, max: W + 20 }, y: -10,
      lifespan: 11000, frequency: 140, quantity: 1,
      speedY: { min: 28, max: 60 }, speedX: { min: -8, max: 30 },
      accelerationX: { min: -6, max: 6 },
      rotate: { start: 0, end: 360 }, scale: { min: 0.7, max: 1.5 },
      alpha: { start: 0.95, end: 0.5 },
      tint: [0xffffff, 0xffe4ee, 0xffc9dc],
    });
    em.fastForward(9000); // 開いた時から画面いっぱいに舞っている
    return em;
  }

  go() {
    if (this.stage === 2) return;
    this.stage = 2;
    sfx('select');
    stopBgm();
    // はじめから＝職業を選ぶ画面へ（10/5）。つづきから＝記録の場所から
    if (this.saved && !this.fresh) {
      this.registry.set('game', this.saved);
      this.scene.start('field');
    } else {
      this.scene.start('jobs');
    }
  }
}
