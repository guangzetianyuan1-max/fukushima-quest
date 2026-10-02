import { EPISODES } from '../data/episodes.js?v=78';
import { unlock, startBgm, stopBgm, sfx } from '../audio/chip.js?v=78';
import { drawScroll, BRUSH_FONT, smooth } from '../ui/scroll.js?v=78';
import { newGame, load, SAVE_KEY } from '../field/game.js?v=78';

// 題の画面（本人 10/1「さわってはじめる、から音楽が欲しい」）
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
    smooth(this.add.text(W / 2, bottom + 24, e.place, {
      fontFamily: TITLE_FONT, fontSize: '24px', color: '#f1e4c0', resolution: 3,
      stroke: '#1a1008', strokeThickness: 6,
    }).setOrigin(0.5));

    // 記録（寺社でお参りした旅）があれば つづきから。小さな「はじめから」で最初からも選べる
    try {
      this.saved = load(localStorage.getItem(SAVE_KEY) ?? '');
    } catch {
      this.saved = null;
    }
    this.fresh = false;
    if (this.saved) {
      const b = this.add.text(W / 2, 624, '［ はじめから ］', {
        fontFamily: DOT, fontSize: '16px', color: '#cfd8ff', resolution: 3,
      }).setOrigin(0.5);
      b.setInteractive(new Phaser.Geom.Rectangle(-20, -12, b.width + 40, b.height + 24), Phaser.Geom.Rectangle.Contains);
      b.on('pointerdown', () => { this.fresh = true; });
    }
    this.prompt = this.add.text(W / 2, this.saved ? 590 : 600, this.saved ? '▶ さわって つづきから' : '▶ さわって はじめる', {
      fontFamily: DOT, fontSize: '22px', color: '#ffffff', resolution: 3,
    }).setOrigin(0.5);
    this.tweens.add({ targets: this.prompt, alpha: 0.35, duration: 900, yoyo: true, repeat: -1 });

    this.stage = 0;
    const begin = () => {
      if (this.stage !== 0) return;
      this.stage = 1;
      unlock();
      this.registry.set('started', true);
      startBgm('title');
      this.tweens.killTweensOf(this.prompt);
      this.prompt.setAlpha(1).setText('旅に 出る……');
      this.cameras.main.fadeOut(1200, 0, 0, 0); // 10/2 2.4秒→1.2秒（待たされて もう一度さわる人がいた）
      this.cameras.main.once('camerafadeoutcomplete', () => this.go());
      this.skipAt = this.time.now + 400; // 同じ指の二度押しで飛ばさない
    };
    this.input.on('pointerdown', () => {
      if (this.stage === 0) begin();
      else if (this.stage === 1 && this.time.now >= this.skipAt) this.go();
    });
    // 本人 10/2「冒頭『さわってはじめる』を2回押さないと、ゲームに入れない」＝iPhone では1回目のタッチが絵（canvas）の pointerdown まで届かないことがある
    // ⇒ ページのどこを さわっても、指を離した瞬間・クリックでも始める（この画面の間だけ）
    const domBegin = () => { if (this.stage === 0) begin(); };
    for (const ev of ['touchend', 'pointerup', 'click']) document.addEventListener(ev, domBegin, { passive: true });
    this.events.once('shutdown', () => {
      for (const ev of ['touchend', 'pointerup', 'click']) document.removeEventListener(ev, domBegin);
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
