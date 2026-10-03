import { EPISODES } from '../data/episodes.js?v=102';
import { revealAt } from '../ui/reveal.js?v=102';
import { createBattle, resolveTurn, makeRng } from '../battle/rules.js?v=102';
import { chooseCommands } from '../battle/auto.js?v=102';
import { itemNote } from '../data/items.js?v=102';
import { unlock, isUnlocked, sfx, startBgm, stopBgm, toggleMute, isMuted, playVoice, stopVoice, voiceLevel } from '../audio/chip.js?v=102';
import { STORY_FILES } from '../data/story_assets.js?v=102';
import { CUTIN_FILES } from '../data/cutin_assets.js?v=102';
import { drawScroll } from '../ui/scroll.js?v=102';
import { preloadKit, makeWindow, makeButton, paginate } from '../ui/kit.js?v=102';
import { battleData, afterWin, afterLose, zakoData, afterZako, BOSS_MON } from '../field/game.js?v=102';

// 1つの戦いの画面を、話ごとのデータ（src/data/<話>.js・並びは episodes.js）で使い回す
// 絵は Gemini で描いて art_src/prep_art.py で整えた物（敵も背景も2倍で見せる）。データの art に置き場と光の色
const ENEMY_Y = 262; // 敵の中心（上の窓の下〜下の窓の上）
const FOG_ALPHA = 0.75; // もやが満ちているときの煙の濃さ（もやの残りに比例して薄くなる）。0.95 だと敵がほぼ消えた
const key = (ep, part) => `${ep.enemy.id}-${part}`; // 絵の名前：<敵のid>-dark／-light／-bg

const W = 360;
const H = 640;
const STEP_MS = 900; // 1行を見せる最短の時間
const MS_PER_CHAR = 90; // 長い文は字数に合わせて長く見せる（さわると先へ進む）
// 字の大きさ（本人 10/1「文字が小さい」で約1.3倍に）
const SIZE = { body: 21, speaker: 16, menu: 21, name: 20, stat: 18, badge: 17 };
const MSG_Y = 420; // 下の窓の上端（窓は y 420〜632）
const style = (size = SIZE.body, color = '#ffffff') => ({
  fontFamily: 'DotGothic16, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif', fontSize: `${size}px`, color, resolution: 3,
  wordWrap: { width: 318, useAdvancedWrap: true }, lineSpacing: 8,
});

export class BattleScene extends Phaser.Scene {
  constructor() {
    super('battle');
  }

  // data.index ＝ 何番目の話か（episodes.js の並び）
  // data.fromField ＝ 歩く地図のボスの場所から来た（今の HP と持ち物で戦い、終わったら地図へ帰る）
  init(data) {
    this.index = data?.index ?? 0;
    this.fromField = !!data?.fromField && !!this.registry.get('game');
    // data.zako ＝ 道中の敵（歩いていて出会った）。zone で背景が変わる
    this.zakoId = this.fromField ? data?.zako ?? null : null;
    if (this.zakoId) this.ep = zakoData(this.registry.get('game'), this.zakoId, data.zone);
    else this.ep = this.fromField ? battleData(this.registry.get('game'), EPISODES[this.index]) : EPISODES[this.index];
  }

  backToField(game) {
    this.registry.set('game', game);
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('field'));
  }

  preload() {
    for (const part of ['dark', 'light', 'bg']) {
      const k = key(this.ep, part);
      if (!this.textures.exists(k)) this.load.image(k, this.ep.art[part]);
    }
    // 元に戻ったあとに現れる人（賢沼の弁天さまなど）
    const bl = this.ep.enemy.blessing;
    if (bl && !this.textures.exists(key(this.ep, 'blessing'))) this.load.image(key(this.ep, 'blessing'), bl.image);
    // 紙芝居の挿絵（届いている物だけ読む＝ STORY_FILES は art_src/prep_story.py が書く）
    for (const part of ['tell', 'after']) {
      for (const c of this.ep.enemy.story?.[part] ?? []) {
        if (STORY_FILES.includes(c.img) && !this.textures.exists(c.img)) this.load.image(c.img, c.img);
      }
    }
    // 紙芝居で語る3Dしおり（本人 10/2「3Dしおりを登場させて、語って欲しい」）＝口3つ×目2つ。_しおり/_3D試し/render_game_stills.py で焼いた
    if (this.ep.enemy.story) {
      for (const m of [0, 1, 2]) for (const e of [0, 1]) {
        const k = `shiori3d_m${m}_e${e}`;
        const f = `assets/story/shiori3d_mouth${m}_eye${e}.png`;
        if (STORY_FILES.includes(f) && !this.textures.exists(k)) this.load.image(k, f);
      }
    }
    // 必殺技の挿絵（カットイン・10/3〜）。届いている物だけ読む
    for (const sp of [this.ep.enemy.special, this.ep.enemy.special2]) if (sp?.cutin && CUTIN_FILES.includes(sp.cutin) && !this.textures.exists(sp.cutin)) this.load.image(sp.cutin, sp.cutin);
    preloadKit(this);
    for (const f of ['normal', 'surprise', 'sad']) if (!this.textures.exists(`face_${f}`)) this.load.image(`face_${f}`, `assets/cards/face_${f}.png`);
  }

  create() {
    // ⚠場面は戦うたびに作り直す＝前の戦いで消えた部品が this に残っている。作る前に触ると止まる（10/2 道中の敵が出ると固まった＝所持金の字）
    this.monBadge = null;
    this.msgFace = null;
    this.rng = makeRng((Date.now() & 0x7fffffff) || 1);
    this.state = createBattle(this.ep, this.rng);
    // 自動は次の戦いにも引き継ぐ（本人 10/2「自動攻撃が、自動で無いことがある」＝戦うたびに切れていた）
    this.auto = !!this.registry.get('autoBattle');
    this.autoSince = 0;
    this.menu = [];
    this.pending = {};
    this.inputIndex = 0;

    this.add.image(0, 0, key(this.ep, 'bg')).setOrigin(0).setScale(2);

    // 敵の後ろの光の輪（本人 10/1「龍も背景も暗いので、龍の周りを照らしてほしい」）
    this.makeGlowTexture();
    this.glowDark = this.add.image(W / 2, ENEMY_Y, 'glow').setScale(1.7).setTint(this.ep.art.glowDark)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6);
    this.glowLight = this.add.image(W / 2, ENEMY_Y, 'glow').setScale(1.9).setTint(this.ep.art.glowLight)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    this.tweens.add({ targets: this.glowDark, alpha: 0.42, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.dragon = this.add.image(W / 2, ENEMY_Y, key(this.ep, 'dark')).setScale(2);
    this.dragonLight = this.add.image(W / 2, ENEMY_Y, key(this.ep, 'light')).setScale(2).setAlpha(0);
    this.tweens.add({
      targets: [this.dragon, this.dragonLight], y: ENEMY_Y - 8, duration: 1400,
      yoyo: true, repeat: -1, ease: 'Sine.inOut',
    });
    this.makeFog();
    this.weakBadge = this.add.text(14, 172, '', style(SIZE.badge, '#ffd34d')).setStroke('#1a1030', 5).setAlpha(0); // 「もや」の下（10/2 重なっていた）

    this.drawStatus();
    if (this.ep.enemy.tale) this.drawTalePlaque(); // 道中の敵には題の巻物が無い
    // 自動の札は下の窓のすぐ上の右（窓の中だと文の最後の行と重なった）。さわると手動に戻る＝止められるのはここだけ
    this.autoBadge = this.add.text(W - 14, MSG_Y - 6, '', style(SIZE.speaker, '#ffd34d')).setOrigin(1, 1).setStroke('#1a1030', 5).setDepth(5);
    this.autoBadge.setInteractive(new Phaser.Geom.Rectangle(-20, -14, 260, 52), Phaser.Geom.Rectangle.Contains);
    this.autoBadge.on('pointerdown', () => {
      if (!this.auto) return;
      this.uiTapAt = this.time.now; // 同じ指で文を送らない
      this.auto = false;
      this.registry.set('autoBattle', false);
      this.updateAutoBadge();
    });
    this.updateAutoBadge(); // 前の戦いから自動を引き継いだときも札を出す

    this.msgBox = this.windowBox(8, MSG_Y, W - 16, 212);
    this.msgSpeaker = this.add.text(38, MSG_Y + 18, '', style(SIZE.speaker, '#ffd98a'));
    this.msgText = this.add.text(26, MSG_Y + 42, '', style());  // 和風の枠の金の線の内側
    // しおりが話すときは窓の左に顔（Gemini の顔絵）
    this.msgFace = this.add.image(72, MSG_Y + 98, 'face_normal').setVisible(false);

    // 画面をさわったとき：自動の最中なら手動へ戻す／文を見せている最中なら次の文へ
    // （自動やコマンドを押した直後の同じ指は数えない）
    this.skip = null;
    this.msgShownAt = 0;
    this.menuReadyAt = 0;
    this.uiTapAt = -1000;
    this.input.on('pointerdown', () => {
      if (this.time.now - this.uiTapAt < 50) return; // 音の切り替えを押した指は数えない
      // 自動の最中も、さわると文を送るだけ（手動に戻すのは「自動中」の札）
      if (this.auto && this.time.now - this.autoSince < 300) return; // 「自動」を押した同じ指
      if (this.skip && this.time.now - this.msgShownAt > 250) this.skip();
    });

    this.makeSoundButton();
    // 黒いもやの残り（左上・音の入切の下）。●＝残っている／○＝晴れた
    this.mistBadge = this.add.text(14, 146, '', style(SIZE.badge, '#d8c8ff')).setStroke('#1a1030', 5);
    // 所持金（本人 10/2「残金を表示して欲しい」）。歩く地図から来た戦いだけ（因縁で取られると減って見える）
    this.monBadge = this.add.text(W - 14, 116, '', style(SIZE.badge, '#ffd98a')).setOrigin(1, 0).setStroke('#1a1030', 5); // 右上（本人 10/2）・明るい空の上でも読めるよう縁取り
    this.refreshMon();
    this.updateMistBadge(this.state.enemy.mistLeft);

    // 音はさわったあとでないと鳴らせない＝初回だけ「さわって はじめる」を出す
    const begin = () => {
      startBgm(this.ep.enemy.bgm ?? 'battle'); // 1章からは話ごとの曲（10/3）
      if (this.ep.enemy.event === 'vow') { this.playVow(); return; } // 戦わない出会い（ザルカブリ山・本人 10/3「C」）
      this.showMessages(
        [{ text: `${this.ep.enemy.name}が あらわれた！` }, { text: this.ep.enemy.introText }],
        () => this.beginInput(),
      );
    };
    // 題の画面でさわって来た時は、ここで もう一度は聞かない
    if (isUnlocked() || this.registry.get('started')) {
      begin();
    } else {
      this.msgText.setText('▶ さわって はじめる');
      this.input.once('pointerdown', () => {
        unlock();
        this.msgShownAt = this.time.now;
        begin();
      });
    }
  }

  // ---- 題の巻物「第○話 ﹁話の名﹂」（本人 10/1「画面右上に、縦書きで」「習字で背景巻物」）----
  drawTalePlaque() {
    const e = this.ep.enemy;
    drawScroll(this, W - 30, 146, { episode: e.episode, tale: e.tale, epSize: 15, taleSize: 24 }); // 右上の所持金の下
  }

  // ---- 光の輪：中心が白く、外へ透明になる丸（色は tint で付ける） ----
  makeGlowTexture() {
    if (this.textures.exists('glow')) return;
    const size = 256;
    const tex = this.textures.createCanvas('glow', size, size);
    const c = tex.getContext();
    const grad = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = grad;
    c.fillRect(0, 0, size, size);
    tex.refresh();
  }

  // ---- 音の入／切（左上の窓の下） ----
  makeSoundButton() {
    const label = () => (isMuted() ? '音：切' : '音：入');
    const t = this.add.text(14, 116, label(), style(SIZE.badge, '#cfd8ff')).setStroke('#1a1030', 5);
    t.setInteractive(new Phaser.Geom.Rectangle(-8, -8, 90, 40), Phaser.Geom.Rectangle.Contains);
    t.on('pointerdown', () => {
      this.uiTapAt = this.time.now;
      toggleMute();
      t.setText(label());
    });
  }

  // ---- 窓（黒地・白い縁） ----
  // 和風の窓（藍の地に金の二重線・四隅の雲＝Gemini の部品表 2026-10-02）
  windowBox(x, y, w, h) {
    return makeWindow(this, x, y, w, h);
  }

  // ---- 上の窓：名前・HP・術 ----
  drawStatus() {
    this.windowBox(8, 8, W - 16, 102);
    this.statusTexts = {};
    // 3〜4人（昔話の味方が加わったとき）は 名前を上に横一列（本人 10/2「名前を上部に4つ並べて」＝2×2だと字が重なった）。
    // 1人ぶんは幅78ドット：名前・HP・術を縦に3段。窓の高さは2人のときと同じ
    const four = this.state.allies.length > 2;
    this.state.allies.forEach((a, i) => {
      const x = four ? 24 + i * 79 : 28 + i * 164; // 和風の枠の金の線の内側
      if (!four) {
        this.add.text(x, 20, a.name, style(SIZE.name));
        this.statusTexts[a.id] = {
          hp: this.add.text(x, 48, '', style(SIZE.stat)),
          mp: this.add.text(x, 76, '', style(SIZE.stat)),
        };
        return;
      }
      this.add.text(x, 20, a.name, style(17));
      this.statusTexts[a.id] = {
        hp: this.add.text(x, 50, '', style(13)),
        mp: this.add.text(x, 76, '', style(13)),
      };
    });
    this.refreshStatus();
  }

  refreshStatus() {
    this.refreshMon();
    for (const a of this.state.allies) this.setAllyHp(a.id, a.hp);
    // 4人のときは術の無い者（しおり）の「術 0」を出さない
    for (const a of this.state.allies) this.statusTexts[a.id].mp.setText(this.state.allies.length > 2 && !a.maxMp ? '' : `術 ${a.mp}`);
  }

  setAllyHp(id, hp) {
    const a = this.state.allies.find((x) => x.id === id);
    const t = this.statusTexts[id].hp;
    t.setText(`HP ${hp}/${a.maxHp}`);
    t.setColor(hp === 0 ? '#ff5050' : hp / a.maxHp < 0.4 ? '#ffd34d' : '#ffffff');
  }

  refreshMon() {
    const g = this.registry.get('game');
    this.monBadge?.setText(this.fromField && g ? `所持金 ${Math.max(0, g.mon - (this.state?.monLost ?? 0))}文` : '');
  }

  updateMistBadge(n) {
    const max = this.ep.enemy.mist?.max ?? 0;
    this.mistBadge.setText(max > 0 ? `もや ${'●'.repeat(n)}${'○'.repeat(max - n)}` : '');
    this.setFog(n);
  }

  // ---- 敵にかかる黒い煙（本人 10/1「もやは、敵キャラにももやをかけて見えにくく」）----
  // 暗い煙の雲を4つ、敵の上に重ねてゆっくり漂わせる。濃さは もやの残りに合わせる
  makeFog() {
    if (!this.textures.exists('fog')) {
      const size = 256;
      const tex = this.textures.createCanvas('fog', size, size);
      const c = tex.getContext();
      const r = makeRng(11);
      for (let i = 0; i < 14; i++) {
        const x = 50 + r() * 156, y = 50 + r() * 156, rad = 40 + r() * 60;
        const g = c.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, 'rgba(18,10,30,0.55)');
        g.addColorStop(1, 'rgba(18,10,30,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, size, size);
      }
      tex.refresh();
    }
    this.fog = [[-60, -70], [55, -40], [-40, 60], [60, 70]].map(([dx, dy], i) => {
      const f = this.add.image(W / 2 + dx, ENEMY_Y + dy, 'fog').setScale(1.25).setAlpha(0);
      this.tweens.add({
        targets: f, x: f.x + (i % 2 ? -18 : 18), y: f.y + (i < 2 ? 10 : -10), angle: i % 2 ? -12 : 12,
        duration: 2600 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.inOut',
      });
      return f;
    });
  }

  setFog(n) {
    if (!this.fog) return;
    const max = this.ep.enemy.mist?.max ?? 0;
    const alpha = max > 0 ? FOG_ALPHA * (n / max) : 0;
    this.tweens.add({ targets: this.fog, alpha, duration: 600 });
  }

  updateAutoBadge() {
    this.autoBadge.setText(this.auto ? '自動中 ▶ ここを さわると手動' : '');
  }

  // ---- 文を1行ずつ見せる。effect があれば同時に動かす ----
  showMessages(list0, done) {
    const list = [...list0];
    this.clearMenu();
    let i = 0;
    const next = () => {
      this.skip = null;
      if (i >= list.length) {
        done?.();
        return;
      }
      const m = list[i++];
      if (m.effect?.kind === 'story') { this.playStory(m.effect.part, next); return; } // 紙芝居が終わってから次の文へ
      this.msgSpeaker.setText(m.speaker ?? '');
      this.setFace(m.face ?? (m.speaker?.startsWith('しおり') ? 'normal' : null));
      // 窓（y 約614）に収まらなければ、残りを次のページに回す（音と動きは最初のページだけ）
      const pages = paginate(this.msgText, m.text, 614);
      list.splice(i, 0, ...pages.slice(1).map((text) => ({ speaker: m.speaker, face: m.face, text })));
      if (m.sfx) sfx(m.sfx);
      if (m.effect) this.playEffect(m.effect);
      this.msgShownAt = this.time.now;
      let delay = Math.max(STEP_MS, [...pages[0]].length * MS_PER_CHAR); // 見せているページの字数で
      if (this.auto) delay = Math.max(600, delay / 2);
      if (m.hold) delay = Math.max(delay, m.hold); // 必殺技の挿絵を見せるあいだ（自動でも短くしない）
      const timer = this.time.delayedCall(delay, next);
      this.skip = () => {
        timer.remove(false);
        next();
      };
    };
    next();
  }

  // 必殺技の挿絵（本人 10/3「今回から、ボスの必殺技は別のアクション(挿絵)を入れて欲しい」）
  // 横長の挿絵が、黒い帯ごと右から すべりこみ（0.18秒）→ 光って揺れる（hit）→ 約1.3秒見せて 薄れて消える。文の窓とステータスの間（敵の立つ所）に出す
  showCutin(key, hit) {
    const y = 250;
    const box = this.add.container(W, 0).setDepth(900);
    const img = this.add.image(W / 2, y, key);
    img.setScale(W / img.width);
    const h = img.displayHeight + 12; // 帯＝絵より上下6ずつ広い（⚠作ってから height を変えると描く大きさが変わらない＝先に測る）
    const band = this.add.rectangle(0, y, W, h, 0x000000, 0.85).setOrigin(0, 0.5);
    const edge = (dy) => this.add.rectangle(0, y + dy, W, 2, 0xffd27a).setOrigin(0, 0.5);
    box.add([band, img, edge(-h / 2), edge(h / 2)]);
    this.tweens.add({
      targets: box, x: 0, duration: 180, ease: 'Cubic.Out',
      onComplete: () => {
        hit();
        this.tweens.add({ targets: box, alpha: 0, delay: 1300, duration: 250, onComplete: () => box.destroy() });
      },
    });
  }

  playEffect(fx) {
    const sprite = this.state.enemy.restored ? this.dragonLight : this.dragon;
    if (fx.kind === 'hitEnemy') {
      sfx('hit');
      this.tweens.add({ targets: sprite, alpha: 0.2, duration: 70, yoyo: true, repeat: 2 });
    } else if (fx.kind === 'gun') {
      // 鉄砲：白く一瞬光って、短く鋭く揺れる
      this.cameras.main.flash(120, 255, 250, 220);
      this.cameras.main.shake(160, 0.016);
    } else if (fx.kind === 'crit') {
      // かいしんの一撃：白く光って大きく揺れる
      this.cameras.main.flash(300, 255, 255, 255);
      this.cameras.main.shake(300, 0.02);
    } else if (fx.kind === 'shake') {
      this.cameras.main.shake(220, 0.012);
    } else if (fx.kind === 'special') {
      // 必殺技：画面が光り（色は敵ごと・既定は炎の赤）、大きく揺れる
      const [r, g, b] = fx.flash ?? [255, 90, 30];
      if (fx.cutin && this.textures.exists(fx.cutin)) {
        this.showCutin(fx.cutin, () => { this.cameras.main.flash(450, r, g, b); this.cameras.main.shake(500, 0.022); });
      } else {
        this.cameras.main.flash(450, r, g, b);
        this.cameras.main.shake(500, 0.022);
      }
    } else if (fx.kind === 'mist') {
      this.updateMistBadge(fx.mist);
      this.tweens.add({ targets: this.mistBadge, alpha: 0.2, duration: 120, yoyo: true, repeat: 1 });
    } else if (fx.kind === 'mp') {
      sfx('heal');
      this.statusTexts[fx.target].mp.setText(`術 ${fx.mp}`);
    } else if (fx.kind === 'hitAlly' || fx.kind === 'heal') {
      sfx(fx.kind === 'heal' ? 'heal' : 'damage');
      this.setAllyHp(fx.target, fx.hp);
    } else if (fx.kind === 'reveal') {
      sfx('reveal');
      this.weakBadge.setText(`弱点：${this.ep.spells[this.ep.enemy.weakness].name}`);
      this.tweens.add({ targets: this.weakBadge, alpha: 1, duration: 400 });
      this.dragon.setTint(0xffd34d);
      this.time.delayedCall(500, () => this.dragon.clearTint());
    }
  }

  // ---- 紙芝居（本人 10/2「挿絵とナレーションを付けて」「スキップを入れて。見たくない人もいる」）----
  // 挿絵（影絵・正方形）を上に、語りの文を下の窓に。声があれば声が終わるまで、無ければ字数の長さだけ見せる
  // さわると次の1枚へ・右上の「とばす」で紙芝居ごと抜ける
  playStory(part, done) {
    const cards = this.ep.enemy.story?.[part] ?? [];
    startBgm('story'); // 紙芝居の間は静かな曲（本人 10/2「昔話の間、BGMは変えて欲しい。静かめで」）
    const box = this.add.container(0, 0).setDepth(1000);
    const shade = this.add.rectangle(0, 0, W, H, 0x05030c, 1).setOrigin(0).setInteractive();
    box.add(shade);
    const frame = makeWindow(this, 8, 18, W - 16, W - 16);
    const pic = this.add.image(W / 2, 18 + (W - 16) / 2, '__DEFAULT').setVisible(false);
    const win = makeWindow(this, 8, MSG_Y, W - 16, 212);
    const who = this.add.text(62, MSG_Y + 20, part === 'tell' ? 'しおり' : '昔話', style(SIZE.speaker, '#ffd98a'));
    const text = this.add.text(30, MSG_Y + 46, '', style(18)); // 1枚ぶんの語り（約80字）が窓に収まる大きさ
    text.setWordWrapWidth(300, true);
    // とばす＝絵と窓のあいだの右（親指で押しやすい・絵にも文にも かぶらない）
    const skip = this.add.text(16, MSG_Y - 8, 'とばす ▶▶', style(17, '#ffffff')).setOrigin(0, 1).setStroke('#1a1030', 5).setPadding(12, 8, 6, 8); // 右下は3Dしおりが立つので左
    skip.setInteractive({ useHandCursor: true });
    box.add([frame, pic, win, who, text, skip]);
    // 影絵の右上に題の巻物（本人 10/2「左上に巻物」→「巻物は右が良い」）＝戦いの画面の巻物と同じ作り。右下は3Dしおり
    const before = this.children.list.length;
    drawScroll(this, W - 46, 32, { episode: this.ep.enemy.episode, tale: this.ep.enemy.tale, epSize: 14, taleSize: 25 });
    box.add(this.children.list.slice(before));
    // 3Dしおり：挿絵の右下に半身で立ち（影絵も右下を空けて描かせている）、声の大きさで口を動かし、ときどき まばたき
    const has3d = this.textures.exists('shiori3d_m0_e0');
    let talking = false;
    let mouth = 0;
    let blinkUntil = 0;
    let nextBlink = this.time.now + 2500;
    const sh = has3d ? this.add.image(W - 70, MSG_Y + 2, 'shiori3d_m0_e0').setOrigin(0.5, 1).setScale(0.5) : null;
    if (sh) {
      for (const m of [0, 1, 2]) for (const e of [0, 1]) this.textures.get(`shiori3d_m${m}_e${e}`).setFilter(Phaser.Textures.FilterMode.LINEAR);
      box.addAt(sh, box.list.indexOf(win)); // 窓の後ろ・挿絵の前
      this.tweens.add({ targets: sh, y: MSG_Y + 4, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' }); // ゆっくり息をする
    }
    const animate = () => {
      if (!sh?.scene) return; // 紙芝居の途中で場面が閉じたら（窓ごと消えた後）何もしない
      const now = this.time.now;
      // 声があれば その大きさで／声が無い間（文字だけ）は、語っている間だけ口をぱくぱく
      const lv = voiceLevel();
      let want = 0;
      if (lv > 0) want = lv > 0.14 ? 2 : lv > 0.05 ? 1 : 0; // 声の大きさ（Gemini の声で最大0.3くらい）
      else if (talking) want = Math.floor(now / 110) % 3 === 0 ? 0 : (Math.floor(now / 110) % 2) + 1;
      mouth = want;
      if (now > nextBlink) { blinkUntil = now + 120; nextBlink = now + 2500 + Math.random() * 3500; }
      sh.setTexture(`shiori3d_m${mouth}_e${now < blinkUntil ? 1 : 0}`);
    };
    // 字幕を声に合わせて少しずつ出す（本人 10/3「ナレーションと下の字幕の表示スピードを合わせて」）＝鳴りはじめから声の長さで頭から順に
    let pages = [];
    let revealFrom = null;
    let revealMs = 1;
    const reveal = () => {
      if (revealFrom === null || !text.scene) return;
      text.setText(revealAt(pages, (this.time.now - revealFrom) / revealMs).text);
    };
    const tick = () => { animate(); reveal(); };
    this.events.on('update', tick);
    this.events.once('shutdown', () => this.events.off('update', tick)); // 場面を出直すと events は残る＝口の動きを外す（10/3 試しで、紙芝居の途中に場面が替わると止まった）
    let i = -1;
    let ended = false;
    let timer = null;
    const finish = () => {
      if (ended) return;
      ended = true;
      timer?.remove(false);
      stopVoice();
      if (part === 'tell') startBgm(this.ep.enemy.bgm ?? 'battle'); else stopBgm(); // 語る＝戦いへ戻る／勝った後＝静かに
      this.events.off('update', tick);
      this.tweens.add({ targets: box, alpha: 0, duration: 250, onComplete: () => { box.destroy(); done(); } });
    };
    const show = () => {
      timer?.remove(false);
      stopVoice();
      i += 1;
      if (i >= cards.length) { finish(); return; }
      const c = cards[i];
      // 挿絵が まだ届いていない間は、その話の敵の絵を仮に出す
      const img = this.textures.exists(c.img) ? c.img : key(this.ep, 'dark');
      const has = this.textures.exists(img);
      pic.setVisible(has);
      if (has) {
        pic.setTexture(img);
        const k = (W - 40) / Math.max(pic.width, pic.height);
        pic.setScale(k).setAlpha(0);
        this.tweens.add({ targets: pic, alpha: 1, duration: 500 });
      }
      // 窓に入りきらなければ2ページ（1ページ目を出し切ってから2ページ目）。さわると次の絵へ
      pages = paginate(text, c.text, MSG_Y + 200);
      text.setText('');
      const shown = i;
      const fallback = Math.max(2600, [...c.text].length * 130);
      // 声が無い・まだ鳴らない間は、字数の時間で出す（1.5秒たっても鳴らなければ＝音の出ない端末）
      const startReveal = (ms) => { revealFrom = this.time.now; revealMs = Math.max(500, ms); };
      revealFrom = null;
      // 声が終わってからの間：最後の1枚は 約2秒そのまま止める（本人 10/2「昔話04の後の切り替えが早い。少しフリーズ」）
      const hold = i === cards.length - 1 ? 2200 : 500;
      talking = !STORY_FILES.includes(c.voice);
      if (talking) this.time.delayedCall(fallback - 400, () => { if (shown === i) talking = false; });
      if (STORY_FILES.includes(c.voice)) {
        // 安全弁：音が出ない端末（音の出口が開いていない iPhone など）でも、字数の時間の1.6倍で次へ
        timer = this.time.delayedCall(fallback * 1.6 + 3000, show);
        this.time.delayedCall(1500, () => { if (!ended && shown === i && revealFrom === null) startReveal(fallback * 0.9); });
        // 鳴りはじめたら、安全弁を声の長さ＋3秒に延ばす（10/3 本人「第3話のしおりのナレーションが途中で切れている」＝蛇岸淵①②③は声が字数の安全弁より長かった）
        const onStart = (sec) => {
          if (ended || shown !== i) return;
          timer?.remove(false);
          timer = this.time.delayedCall(sec * 1000 + 3000, show);
          startReveal(sec * 1000 * 0.97); // 声の終わりの少し前に出し切る
        };
        playVoice(c.voice, onStart).then((sec) => {
          if (ended || shown !== i) return;
          timer?.remove(false);
          timer = this.time.delayedCall(sec > 0 ? hold : fallback, show);
        });
      } else {
        startReveal(fallback * 0.9);
        timer = this.time.delayedCall(fallback + hold - 500, show);
      }
    };
    shade.on('pointerdown', () => show());
    skip.on('pointerdown', () => { this.uiTapAt = this.time.now; finish(); });
    box.setAlpha(0);
    this.tweens.add({ targets: box, alpha: 1, duration: 300 });
    show();
  }

  // ---- コマンド ----
  beginInput() {
    if (this.auto) {
      this.runTurn(chooseCommands(this.state, this.ep));
      return;
    }
    this.pending = {};
    this.inputIndex = 0;
    this.askNextAlly();
  }

  livingAllies() {
    return this.state.allies.filter((a) => a.alive);
  }

  askNextAlly() {
    const allies = this.livingAllies();
    if (this.inputIndex >= allies.length) {
      this.runTurn(this.pending);
      return;
    }
    const a = allies[this.inputIndex];
    // 色分けした丸いボタン（押すと凹む・本人 10/2）。たたかう＝橙／語る＝紫・術＝赤／道具＝緑／にげる＝藍／自動＝残りの色
    // 道中の敵（昔話の主でない）には しおりは語らない＝「語る」を出さない（本人 10/2）
    // 語り終えた（弱点が明かされた）あとは「語る」を出さない＝同じ筋を二度聞かせない（本人 10/2「ダブらないように」）
    const tell = a.canTell && !this.ep.enemy.noWeak && !this.state.enemy.revealed;
    // 猟師は「術」でなく「鉄砲」（本人 10/2）。玉が無いときは押しても選ばず、そう知らせる
    const gun = ['鉄砲', () => {
      if ((this.state.enemy.mistLeft ?? 0) > 0) this.showMessages([{ text: '黒い もやで 狙いが 定まらない。先に たたかって、もやを 払おう。' }], () => this.askNextAlly());
      else if ((this.state.items.tama ?? 0) > 0) this.choose(a, { type: 'shoot' });
      else this.showMessages([{ text: '鉄砲の 玉が ない！ 玉は 平の 刀屋で 売っている。' }], () => this.askNextAlly());
    }, 'red'];
    const second = a.canTell ? (tell ? ['語る', () => this.choose(a, { type: 'tell' }), 'purple'] : null) : a.gun ? gun : ['術', () => this.spellMenu(a), 'red'];
    this.showButtons(a.gun ? `${a.name}は どうする？（玉 ${this.state.items.tama ?? 0}）` : `${a.name}は どうする？`, [
      ['たたかう', () => this.choose(a, { type: 'attack' }), 'orange'],
      second,
      ['道具', () => this.itemMenu(a), 'green'],
      ['にげる', () => this.choose(a, { type: 'flee' }), 'blue'],
      ['自動', () => this.startAuto(), a.canTell ? 'red' : 'purple'],
    ].filter(Boolean), this.inputIndex > 0 ? () => this.backAlly() : null);
    // ↑ 2人目からは「戻る」＝前の人のコマンドを選び直す（本人 10/3「戦闘中のボタンで『戻る』を追加」「他と同じ大きさで、違う色で」）
  }

  // 前の人へ戻る：その人の決めたコマンドを消して、もう一度聞く
  backAlly() {
    const allies = this.livingAllies();
    this.inputIndex = Math.max(0, this.inputIndex - 1);
    delete this.pending[allies[this.inputIndex].id];
    this.askNextAlly();
  }

  setFace(face) {
    this.msgFace.setVisible(!!face);
    if (face) this.msgFace.setTexture(`face_${face}`);
    // 金の枠の内側（窓は x 8〜352・右の線は x 約334）に収める
    this.msgText.setX(face ? 130 : 30).setWordWrapWidth(face ? 200 : 300, true);
    // 名前：顔があるときは顔の下に ひとまわり大きく（本人 10/2）／無いときは左上
    if (face) this.msgSpeaker.setPosition(72, MSG_Y + 150).setOrigin(0.5, 0).setFontSize(20);
    else this.msgSpeaker.setPosition(38, MSG_Y + 18).setOrigin(0, 0).setFontSize(SIZE.speaker);
  }



  // 丸いボタンを横一列に（下の窓の中）。back があれば 右端に銀の「戻る」（本人 10/3「他と同じ大きさで、違う色で」「キレイに並ばなかったら大きさを調整」）
  // ＝6つ並んでも隣とぶつからない大きさ（50）に、どの人の列もそろえる（人によって大きさが変わらない）
  showButtons(title, options, back = null) {
    this.clearMenu();
    this.setFace(null);
    this.msgSpeaker.setText('');
    this.msgText.setText(title);
    this.menuReadyAt = this.time.now + 200;
    const all = back ? [...options, ['戻る', back, 'gray']] : options;
    const pitch = (W - 40) / all.length;
    all.forEach(([label, fn, color], i) => {
      const b = makeButton(this, 20 + pitch * (i + 0.5), MSG_Y + 112, color, label, () => {
        if (this.time.now < this.menuReadyAt) return;
        this.menuReadyAt = Infinity; // 凹んでいる間の二度押しで、次の人のコマンドまで決めない
        sfx('select');
        // 凹んだ絵を一瞬見せてから次へ
        this.time.delayedCall(90, fn);
      }, { size: 50, fontSize: 15 });
      this.menu.push(b);
    });
  }

  choose(a, cmd) {
    this.pending[a.id] = cmd;
    this.inputIndex += 1;
    this.askNextAlly();
  }

  spellMenu(a) {
    const opts = a.spells.map((id) => {
      const sp = this.ep.spells[id];
      return [`${sp.name}（術${sp.cost}）`, () => this.choose(a, { type: 'spell', spellId: id })];
    });
    this.showMenu('どの 術を つかう？', [...opts, ['戻る', () => this.askNextAlly()]]);
  }

  // 道具。無くなった物は灰色で残す
  itemMenu(a) {
    // 名前の右に効き目（本人 10/1「名物の隣に効き目も表示してほしい」）
    const opts = Object.entries(this.ep.items).filter(([, it]) => it.kind !== 'ammo').map(([id, it]) => { // 鉄砲の玉は「鉄砲」で使う
      const n = this.state.items[id];
      const note = itemNote(it);
      return [`${it.name}×${n}`, n > 0 ? () => this.choose(a, { type: 'item', itemId: id }) : null, note];
    });
    this.showMenu('どの 道具を 使う？', [...opts, ['戻る', () => this.askNextAlly()]]);
  }

  startAuto() {
    this.auto = true;
    this.autoSince = this.time.now;
    this.registry.set('autoBattle', true);
    this.updateAutoBadge();
    this.runTurn(chooseCommands(this.state, this.ep));
  }

  showMenu(title, options) {
    this.clearMenu();
    this.setFace(null);
    this.msgSpeaker.setText('');
    this.msgText.setText(title);
    this.menuReadyAt = this.time.now + 200;
    // 2列に並べる。6字を超える項目があるときは1列（字が大きいので2列だとはみ出す）
    const cols = options.some(([label, , note]) => [...label].length > 6 || note) ? 1 : 2; // 効き目の字があれば1列（10/2 重なっていた）
    const colW = cols === 1 ? 320 : 165;
    const rows = Math.ceil(options.length / cols);
    const top = MSG_Y + (rows >= 4 ? 66 : 72);
    const pitch = Math.min(44, (MSG_Y + 204 - top) / rows); // 段が多いほど詰めて、窓の下（y 約624）に収める
    options.forEach(([label, fn, note], i) => {
      const x = 26 + (i % cols) * colW;
      const y = top + Math.floor(i / cols) * pitch;
      const t = this.add.text(x, y, `▶ ${label}`, style(SIZE.menu, fn ? '#ffffff' : '#777777'));
      if (note) {
        // 効き目は右端にそろえて、小さめの黄色で（無くなった物は灰色）
        const n = this.add.text(W - 28, y + 3, note, style(SIZE.badge, fn ? '#ffd34d' : '#777777')).setOrigin(1, 0);
        this.menu.push(n);
      }
      if (fn) {
        t.setInteractive(new Phaser.Geom.Rectangle(-10, -8, colW - 4, pitch), Phaser.Geom.Rectangle.Contains);
        t.input.cursor = 'pointer';
        t.on('pointerdown', () => {
          if (this.time.now < this.menuReadyAt) return;
          sfx('select');
          fn();
        });
      }
      this.menu.push(t);
    });
  }

  clearMenu() {
    for (const t of this.menu) t.destroy();
    this.menu = [];
  }

  // ---- 1ターンを解決して見せる ----
  runTurn(commands) {
    const { state, log } = resolveTurn(this.state, commands, this.ep, this.rng);
    const prevEnemyRestored = this.state.enemy.restored;
    this.state = state;
    this.state.enemy.restored = prevEnemyRestored; // 色が戻るのは勝ったあとの場面で
    this.showMessages(log, () => {
      this.refreshStatus();
      if (state.over === 'win') this.playWin();
      else if (state.over === 'lose') this.playLose();
      else if (state.over === 'fled') this.endZako();
      else this.beginInput();
    });
  }

  // ---- 勝ち：敵が元の姿に戻る → 語り部の補足 → もらえる力 → つぎの話へ ----
  playWin(opts = {}) {
    if (this.zakoId) {
      this.playZakoWin();
      return;
    }
    this.auto = false;
    this.updateAutoBadge();
    this.weakBadge.setAlpha(0);
    this.mistBadge.setText('');
    this.setFog(0);
    const e = this.ep.enemy;
    stopBgm();
    this.showMessages([{ text: opts.vow ? e.vowDone : `${e.name}を しずめた！`, sfx: 'win' }], () => {
      this.cameras.main.flash(600, 255, 255, 255);
      this.dragon.setAlpha(1);
      this.tweens.add({ targets: this.dragon, alpha: 0, duration: 2000 });
      this.tweens.add({ targets: this.dragonLight, alpha: 1, duration: 2000 });
      this.tweens.killTweensOf(this.glowDark);
      this.tweens.add({ targets: this.glowDark, alpha: 0, duration: 2000 });
      this.tweens.add({ targets: this.glowLight, alpha: 0.75, duration: 2000 });
      sfx('reveal');
      this.state.enemy.restored = true;
      this.time.delayedCall(2100, () => {
        // もらえる力と、文（歩く地図から来た戦いだけ。本人 10/2「ボスを倒した際は、お金を多めに。ここでは50文」）
        const rewards = [{ text: e.reward }, ...(this.fromField && BOSS_MON[e.id] ? [{ text: `お礼に 文を ${BOSS_MON[e.id]} もらった！`, sfx: 'eat' }] : [])];
        // ほんとうの結末：紙芝居があれば挿絵と声で、無ければ「昔話」の文で
        const tail = e.story?.after
          ? () => this.playStory('after', () => this.showMessages(rewards, () => this.showAfterWin()))
          : () => this.showMessages([
            { text: e.hosoku, speaker: '昔話', face: 'normal' },
            ...rewards,
          ], () => this.showAfterWin());
        this.showMessages(e.restoreLines.map((text) => ({ text })), () => (e.blessing ? this.playBlessing(tail) : tail()));
      });
    });
  }

  // ---- 戦わない出会い（本人 10/3 ザルカブリ山「C」＝原典では化け物は倒されない。獲りすぎない誓いで しずまる）----
  // あらわれる → 必殺技の挿絵（乱れ髪）→ 紙芝居①②③ → 「誓う／山を下りる」→ 誓えば 元の すがたへ（勝ちと同じ流れ・お礼の文と経験は無し）
  playVow() {
    const e = this.ep.enemy;
    const ask = () => this.showMenu(e.vowAsk, [
      [e.vowLabel, () => { this.clearMenu(); this.showMessages(e.vowLines.map((text) => ({ text })), () => this.playWin({ vow: true })); }],
      ['山を 下りる', () => { this.clearMenu(); this.showMessages(e.leaveLines.map((text) => ({ text })), () => this.backToField(this.registry.get('game'))); }],
    ]);
    const tell = () => {
      if (e.story) this.playStory('tell', ask);
      else this.showMessages(e.tellLines.map((text) => ({ text, speaker: 'しおり', face: 'normal' })), ask);
    };
    this.showMessages([{ text: `${e.name}が あらわれた！` }, { text: e.introText }], () => {
      const cut = e.special?.cutin;
      if (cut && this.textures.exists(cut)) this.showCutin(cut, () => this.time.delayedCall(1650, tell));
      else tell();
    });
  }

  // 元に戻った敵に代わって、その話の神仏などが現れる（賢沼＝弁天さま・影絵版の終幕と同じ形）
  playBlessing(done) {
    const bl = this.ep.enemy.blessing;
    const img = this.add.image(W / 2, ENEMY_Y + 10, key(this.ep, 'blessing')).setScale(2).setAlpha(0);
    this.tweens.add({ targets: this.dragonLight, alpha: 0, duration: 1500 });
    this.tweens.add({ targets: img, alpha: 1, duration: 2000 });
    this.tweens.add({ targets: this.glowLight, alpha: 0.95, scale: 2.3, duration: 2000 });
    sfx('biwa'); // 琵琶の音とともに現れる（本人 10/1）
    this.time.delayedCall(2000, () => this.showMessages(bl.lines.map((text) => ({ text })), done));
  }

  // ---- 道中の敵：倒すと正気に戻って去る → 経験と文 → 歩く地図へ ----
  playZakoWin() {
    this.auto = false;
    this.updateAutoBadge();
    stopBgm();
    const e = this.ep.enemy;
    this.showMessages([{ text: `${e.name}の もやを はらった！`, sfx: 'win' }], () => {
      this.tweens.add({ targets: [this.dragon, this.glowDark], alpha: 0, duration: 1200 });
      this.showMessages(e.restoreLines.map((text) => ({ text })), () => this.endZako());
    });
  }

  // 勝ち・逃げた・盗まれた：持ち帰る物を旅の状態へ（勝ったときだけ 経験・文・レベル）
  endZako() {
    this.auto = false;
    this.updateAutoBadge();
    const { game, lines } = afterZako(this.registry.get('game'), this.zakoId, this.state);
    const list = lines.map((text) => ({ text, sfx: text.includes('レベル') ? 'win' : undefined }));
    this.showMessages(list, () => this.backToField(game));
  }

  playLose() {
    this.auto = false;
    this.updateAutoBadge();
    stopBgm();
    sfx('lose');
    this.showMessages(this.ep.enemy.loseLines.map((text) => ({ text })), () => this.showRetry('もう一度 いどむ'));
  }

  // 全滅したとき：やり直す／ゲームを終わる（本人 10/2「死んだら、ゲームを終わるのコマンドも入れて」＝題の画面へ。記録があれば「つづきから」）
  showRetry(label) {
    const quit = ['ゲームを 終わる', () => {
      stopBgm();
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('title'));
    }];
    if (this.fromField) {
      this.showMenu('', [['記録した 所から やり直す', () => this.backToField(afterLose(this.registry.get('game')))], quit]);
      return;
    }
    this.showMenu('', [[label, () => this.scene.restart({ index: this.index })], quit]);
  }

  // 勝ったあと：つぎの話があれば「つぎの話へ」、無ければ準備中と伝える
  showAfterWin() {
    if (this.fromField) {
      this.showMenu('', [['旅を つづける', () => this.backToField(afterWin(this.registry.get('game'), this.ep.enemy.id, this.state))]]);
      return;
    }
    const next = EPISODES[this.index + 1];
    const again = ['もう一度 たたかう', () => this.scene.restart({ index: this.index })];
    if (next) {
      this.showMenu('', [[`つぎの話へ（${next.enemy.episode}）`, () => this.scene.start('battle', { index: this.index + 1 })], again]);
    } else {
      this.showMenu('序章の つづきは 準備中です', [again]);
    }
  }
}
