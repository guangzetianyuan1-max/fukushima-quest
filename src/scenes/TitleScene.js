import { unlock, startBgm, stopBgm, sfx } from '../audio/chip.js?v=143';
import { BRUSH_FONT, smooth } from '../ui/scroll.js?v=143';
import { newGame, load, SAVE_KEY } from '../field/game.js?v=143';
import { preloadKit, makeWindow } from '../ui/kit.js?v=143';

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
const TITLE_FONT = '"Potta One", ' + BRUSH_FONT;
const DOT = 'DotGothic16, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';

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
      fontFamily: TITLE_FONT, fontSize: `${size}px`, color: '#ffffff', resolution: 3,
      stroke: '#1a1008', strokeThickness: 10,
    }).setOrigin(0.5));
    title('福島昔話', 72, 58);
    title('クエストRPG', 136, 46);

    // 記録があれば「つづきから」を押せる
    try {
      this.saved = load(localStorage.getItem(SAVE_KEY) ?? '');
    } catch {
      this.saved = null;
    }
    this.fresh = false;
    // 2つの札（左＝はじめから・右＝つづきから）。親指で押しやすい大きさ
    const BTN = { w: 156, h: 50, y: 592 };
    const makeBtn = (cx, label, enabled) => {
      const win = makeWindow(this, cx - BTN.w / 2, BTN.y - BTN.h / 2, BTN.w, BTN.h).setAlpha(enabled ? 1 : 0.45);
      const t = this.add.text(cx, BTN.y, label, { fontFamily: DOT, fontSize: '21px', color: enabled ? '#ffffff' : '#8a8fa8', resolution: 3 }).setOrigin(0.5);
      return { cx, win, t, enabled, hit: (x, y) => Math.abs(x - cx) <= BTN.w / 2 + 6 && Math.abs(y - BTN.y) <= BTN.h / 2 + 10 };
    };
    this.btns = { fresh: makeBtn(W / 2 - 84, 'はじめから', true), cont: makeBtn(W / 2 + 84, 'つづきから', !!this.saved) };
    // 記録がある時は「つづきから」をそっと光らせる（押す先の目印）
    const glow = this.saved ? this.btns.cont.t : this.btns.fresh.t;
    this.tweens.add({ targets: glow, alpha: 0.4, duration: 900, yoyo: true, repeat: -1 });
    this.prompt = this.add.text(W / 2, 628, '', { fontFamily: DOT, fontSize: '16px', color: '#ffffff', resolution: 3 }).setOrigin(0.5);

    this.stage = 0;
    const begin = (fresh) => {
      if (this.stage !== 0) return;
      this.stage = 1;
      this.fresh = fresh;
      unlock();
      this.registry.set('started', true);
      startBgm('title');
      sfx('select');
      this.tweens.killTweensOf(glow);
      glow.setAlpha(1);
      const chosen = fresh ? this.btns.fresh : this.btns.cont;
      chosen.t.setColor('#ffd98a');
      this.prompt.setText(fresh ? '旅に 出る……' : '旅の つづきへ……');
      this.cameras.main.fadeOut(1200, 0, 0, 0); // 10/2 2.4秒→1.2秒（待たされて もう一度さわる人がいた）
      this.cameras.main.once('camerafadeoutcomplete', () => this.go());
      this.skipAt = this.time.now + 400; // 同じ指の二度押しで飛ばさない
    };
    // 押した所が どちらの札か（どちらでもなければ何もしない＝絵をさわっただけでは始まらない）
    const press = (x, y) => {
      if (this.stage === 1 && this.time.now >= this.skipAt) { this.go(); return; }
      if (this.stage !== 0) return;
      // 2つの札の当たりは真ん中の1列で重なる＝近い方の札（同じ近さなら つづきから＝記録を捨てない向き・10/4 試運転）
      const nearCont = Math.abs(x - this.btns.cont.cx) <= Math.abs(x - this.btns.fresh.cx);
      if (this.btns.fresh.hit(x, y) && !(this.btns.cont.enabled && nearCont && this.btns.cont.hit(x, y))) begin(true);
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
    this.registry.set('game', this.saved && !this.fresh ? this.saved : newGame());
    this.scene.start('field');
  }
}
