import { EPISODES } from '../data/episodes.js?v=89';
import { unlock, startBgm, stopBgm, sfx } from '../audio/chip.js?v=89';
import { drawScroll, BRUSH_FONT, smooth } from '../ui/scroll.js?v=89';
import { newGame, load, SAVE_KEY } from '../field/game.js?v=89';
import { preloadKit, makeWindow } from '../ui/kit.js?v=89';

// 題の画面（本人 10/1「さわってはじめる、から音楽が欲しい」）
// ⭐10/3 本人「アイコンクリック後、『はじめから』『つづきから』を加えてほしい」＝下に2つの札。押した札で始まる（1回で）
//   つづきから＝記録（お参り・ボスの後の自動セーブ・セーブして終わる）があるときだけ押せる。無ければ薄く出す
// 以下は 10/3 までの作り（①②の「どこをさわっても始まる」は札を押したときだけに変えた）
// ① 開いた時：題と巻物と「▶ さわって はじめる」（音はブラウザの決まりで、まだ出せない）
// ② 1回さわる：始まりの曲が鳴り、「旅に 出る……」のまま2.4秒かけて暗くなり、歩く地図へ（記録があれば その場所から）
//    （本人 10/1「もういちどさわって、を押すと同じ画面、また押すと進む。1回余計」＝2回目のさわりを無くした）
//    暗くなる途中でさわれば、すぐ戦いへ
const W = 360;
const TITLE_FONT = '"Potta One", ' + BRUSH_FONT;
const DOT = 'DotGothic16, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  preload() {
    // 題の画面の背景は、最初の話の背景（薄く暗くして使う）
    const first = EPISODES[0];
    this.bgKey = `${first.enemy.id}-bg`;
    if (!this.textures.exists(this.bgKey)) this.load.image(this.bgKey, first.art.bg);
    // 題の一枚絵（Gemini 4組目・序章の昔話たちと語り部）
    if (!this.textures.exists('card_title')) this.load.image('card_title', 'assets/cards/title.png');
    preloadKit(this); // 札の枠（窓と同じ絵）
  }

  create() {
    this.add.image(0, 0, 'card_title').setOrigin(0);
    this.add.rectangle(0, 0, W, 640, 0x000000, 0.2).setOrigin(0);

    // 題字は太い毛筆の Potta One（本人 10/1「文字がダサい。習字の太字に」＝Yuji Boku は細くかすれ、RPG の英字も崩れた）
    // 題字は2行で大きく（本人 10/1「もっと大きく2行に」）
    const title = (text, y, size) => smooth(this.add.text(W / 2, y, text, {
      fontFamily: TITLE_FONT, fontSize: `${size}px`, color: '#ffffff', resolution: 3,
      stroke: '#1a1008', strokeThickness: 10,
    }).setOrigin(0.5));
    title('福島昔話', 72, 58);
    title('クエストRPG', 136, 46);

    const e = EPISODES[0].enemy;
    // 巻物は右の端に小さく（真ん中だと一枚絵の龍と語り部を隠した・10/2）
    drawScroll(this, W - 40, 186, { episode: e.episode, tale: e.tale, epSize: 16, taleSize: 28 });
    const bottom = 536;

    // 巻物の下に場所（本人 10/1「福島県○○市、まで入れてください」）
    smooth(this.add.text(W / 2, bottom + 2, e.place, { // 10/3 下に札を置くので少し上へ
      fontFamily: TITLE_FONT, fontSize: '24px', color: '#f1e4c0', resolution: 3,
      stroke: '#1a1008', strokeThickness: 6,
    }).setOrigin(0.5));

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
      if (this.btns.fresh.hit(x, y)) begin(true);
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

  go() {
    if (this.stage === 2) return;
    this.stage = 2;
    sfx('select');
    stopBgm();
    this.registry.set('game', this.saved && !this.fresh ? this.saved : newGame());
    this.scene.start('field');
  }
}
