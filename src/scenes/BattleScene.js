import { GAME_FONT, EYE_FONT } from '../ui/fonts.js?v=360';
import { AILMENTS, badgesOf, hpColor, partyStateLines } from '../field/ailments.js?v=360';
import { EPISODES } from '../data/episodes.js?v=360';
import { revealAt } from '../ui/reveal.js?v=360';
import { createBattle, resolveTurn, makeRng, sweetBlocked } from '../battle/rules.js?v=360';
import { chooseCommands } from '../battle/auto.js?v=360';
import { SKILLNAME_IDS, SKILLNAME_PAD, SKILLNAME_V } from '../data/skillname_assets.js?v=360';
import { itemNote } from '../data/items.js?v=360';
import { unlock, isUnlocked, sfx, startBgm, stopBgm, toggleMute, isMuted, playVoice, stopVoice, voiceLevel } from '../audio/chip.js?v=360';
import { STORY_FILES } from '../data/story_assets.js?v=360';
import { TITLE_HOLD, TITLE_NO_VOICE } from './_title_consts.js?v=360';
import { CUTIN_FILES, CUTIN_V } from '../data/cutin_assets.js?v=360';
import { drawScroll, fitScroll, smooth, BRUSH_FONT } from '../ui/scroll.js?v=360';
import { preloadKit, makeWindow, makeButton, paginate, fitSpeaker } from '../ui/kit.js?v=360';
import { FRAME_W, FRAME_H, frameOf } from '../field/sprites.js?v=360';
import { battleData, afterWin, afterRematch, afterLose, afterForcedLose, zakoData, afterZako, BOSS_MON, duelData, afterDuel, bossPay } from '../field/game.js?v=360';
import { DUEL_BIG } from '../data/duel_assets.js?v=360';
import { jobFxPlan, JOBFX_COLORS, JOBFX_LABEL, SKILLNAME_H } from '../battle/jobfx.js?v=360';

// 1つの戦いの画面を、話ごとのデータ（src/data/<話>.js・並びは episodes.js）で使い回す
// 絵は Gemini で描いて art_src/prep_art.py で整えた物（敵も背景も2倍で見せる）。データの art に置き場と光の色
// 紙芝居の声・絵を同じ名前のまま作り直したとき、スマホが前の物を覚えていないよう ?r=番号 を付けて読む（10/4 夜〜）
// onibaba_4＝最後の「祐慶さま、観音さまの弓を！」を切った（本人「祐慶に替わるは無しで、僧のまま」）
const STORY_REV = { 'assets/story/onibaba_4.mp3': 2 };
const revUrl = (url) => (STORY_REV[url] ? `${url}?r=${STORY_REV[url]}` : url);
const ENEMY_Y = 262; // 敵の中心（上の窓の下〜下の窓の上）
const FOG_ALPHA = 0.75; // もやが満ちているときの煙の濃さ（もやの残りに比例して薄くなる）。0.95 だと敵がほぼ消えた
const key = (ep, part) => `${ep.enemy.id}-${part}`; // 絵の名前：<敵のid>-dark／-light／-bg

const W = 360;
const H = 640;
const STEP_MS = 900; // 1行を見せる最短の時間
const MS_PER_CHAR = 90; // 長い文は字数に合わせて長く見せる（さわると先へ進む）
// 字の大きさ（本人 10/1「文字が小さい」で約1.3倍に）
const SIZE = { body: 21, speaker: 16, menu: 21, name: 20, stat: 18, badge: 17 };
// 選びの1行の高さ（本人 10/4「文字が小さく、他のコマンドを押してしまう」）・窓を伸ばすのは上の札の下まで
const MENU_ROW = 46;
const MENU_TOP_B = 112;
const MSG_Y = 420;
const TALE_BAND_Y = MSG_Y - 16; // 話の題の帯（敵の足もと・下の窓のすぐ上） // 下の窓の上端（窓は y 420〜632）
// 紙芝居の3Dしおりを下げる量（本人 10/4「しおりを下に下げるもありですね。手が隠れるくらい」）＝下の部分は文の窓の後ろに隠れる
export const SHIORI_DROP = 44;
// 3Dしおり（下の端が MSG_Y+2+SHIORI_DROP・高さ 400×0.5）の頭の上の端。巻物はここより上で止める（10/4）
// 本人 10/4「しおりを前に、題名を後ろに、多少字が隠れてもOK」＝巻物はしおりの後ろ。頭の後ろへ 36 までは もぐってよい（それより長ければ小さく・2列に）
export const STORY_SCROLL_MAX = MSG_Y + 2 + SHIORI_DROP - 200 + 36;
const style = (size = SIZE.body, color = '#ffffff') => ({
  fontFamily: GAME_FONT, fontSize: `${size}px`, color, resolution: 3,
  wordWrap: { width: 318, useAdvancedWrap: true }, lineSpacing: 8,
});

// 終わりの選び（旅を つづける・やり直す）は1回だけ効く＝暗くなる0.4秒の間の二度押しで、お礼の文と経験が二重に入った（10/4 試運転）
const once = (fn) => { let done = false; return () => { if (done) return; done = true; fn(); }; };

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
    // data.duel ＝ 相馬の道場の試し合い（何本目か・10/4 武士になるクエスト）
    this.duel = this.fromField ? data?.duel ?? null : null;
    this.rematch = this.fromField && !!data?.rematch; // 図鑑からの もう一度（10/9）＝進みを 変えない
    if (this.duel) this.ep = duelData(this.registry.get('game'), this.duel);
    else if (this.zakoId) this.ep = zakoData(this.registry.get('game'), this.zakoId, data.zone);
    else this.ep = this.fromField ? battleData(this.registry.get('game'), EPISODES[this.index]) : EPISODES[this.index];
  }

  backToField(game) {
    this.registry.set('game', game);
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('field'));
  }

  preload() {
    for (const id of SKILLNAME_IDS) if (!this.textures.exists(`skn_${id}`)) this.load.image(`skn_${id}`, `assets/skillname/${id}.png?v=${SKILLNAME_V}`); // 10/10 技の 名の 毛筆
    // 一騎打ちの 相手の絵は 師匠ごとに 変わる＝前の 一騎打ちの 絵（同じ名前）を 捨てて 読み直す（10/5 夜）
    if (this.duel) for (const part of ['dark', 'light']) if (this.textures.exists(key(this.ep, part))) this.textures.remove(key(this.ep, part));
    const look = this.ep.art.look;
    if (look && !this.textures.exists(`p-${look}`)) this.load.spritesheet(`p-${look}`, `assets/people/${look}.png`, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    if (look && DUEL_BIG.includes(look) && !this.textures.exists(`big-${look}`)) this.load.image(`big-${look}`, `assets/people/big_${look}.png`); // 10/8 一騎打ちの 師匠の 大きい 絵
    for (const part of ['dark', 'light', 'bg']) {
      const k = key(this.ep, part);
      if (String(this.ep.art[part]).startsWith('people:')) continue;
      if (!this.textures.exists(k)) this.load.image(k, this.ep.art[part]);
    }
    // 元に戻ったあとに現れる人（賢沼の弁天さまなど）
    const bl = this.ep.enemy.blessing;
    if (bl?.image && !this.textures.exists(key(this.ep, 'blessing'))) this.load.image(key(this.ep, 'blessing'), bl.image); // image の 無い お礼＝戻った 2Dの 姿の まま（10/9 大将）
    const hp = this.ep.enemy.helper; // 助っ人の絵（10/6 おこん母子から・無ければ文だけ）
    if (hp?.image && !this.textures.exists(key(this.ep, 'helper'))) this.load.image(key(this.ep, 'helper'), hp.image);
    // 紙芝居の挿絵（届いている物だけ読む＝ STORY_FILES は art_src/prep_story.py が書く）
    for (const part of ['tell', 'after']) {
      for (const c of this.ep.enemy.story?.[part] ?? []) {
        if (STORY_FILES.includes(c.img) && !this.textures.exists(c.img)) this.load.image(c.img, c.img);
      }
    }
    // 紙芝居の始めの絵（アイキャッチ・10/5 夕 本人「巻物は消去して、YouTubeで使用したアイキャッチ画像を採用」）＝art_src/prep_eyecatch.py
    const eye = `assets/story/eye_${this.ep.enemy.id}.png`;
    if (STORY_FILES.includes(eye) && !this.textures.exists(eye)) this.load.image(eye, eye);
    // 紙芝居で語る3Dしおり（本人 10/2「3Dしおりを登場させて、語って欲しい」）＝口3つ×目2つ。_しおり/_3D試し/render_game_stills.py で焼いた
    if (this.ep.enemy.story) {
      for (const m of [0, 1, 2]) for (const e of [0, 1]) {
        const k = `shiori3d_m${m}_e${e}`;
        const f = `assets/story/shiori3d_mouth${m}_eye${e}.png`;
        if (STORY_FILES.includes(f) && !this.textures.exists(k)) this.load.image(k, f);
      }
    }
    // 必殺技の挿絵（カットイン・10/3〜）。届いている物だけ読む
    for (const sp of [this.ep.enemy.special, this.ep.enemy.special2]) if (sp?.cutin && CUTIN_FILES.includes(sp.cutin) && !this.textures.exists(sp.cutin)) this.load.image(sp.cutin, `${sp.cutin}?v=${CUTIN_V}`);
    // 術の挿絵（観音さま・10/5 夜）
    for (const sp of Object.values(this.ep.spells ?? {})) if (sp?.cutin && CUTIN_FILES.includes(sp.cutin) && !this.textures.exists(sp.cutin)) this.load.image(sp.cutin, `${sp.cutin}?v=${CUTIN_V}`);
    preloadKit(this);
    for (const f of ['normal', 'surprise', 'sad']) if (!this.textures.exists(`face_${f}`)) this.load.image(`face_${f}`, `assets/cards/face_${f}.png`);
  }

  // 一騎打ちの 師匠の絵＝歩く絵の 正面の1コマを 3倍に（ドットの まま）。画面では さらに2倍＝高さ 約250
  makeLookArt() {
    const look = this.ep.art.look;
    if (!look || !this.textures.exists(`p-${look}`)) return;
    // ⭐10/8 本人「師匠の絵が、ぼかしにされているところがある」＝細かい 絵を 縮めた 歩く絵（温泉地の 人）は 6倍で にじむ
    //   ⇒ 元の 絵から 3倍で 切り出した 大きい 絵（big-）が あれば それを そのまま（画面で 2倍）
    if (this.textures.exists(`big-${look}`)) {
      const src = this.textures.get(`big-${look}`).getSourceImage();
      for (const part of ['dark', 'light']) {
        const k = key(this.ep, part);
        if (this.textures.exists(k)) this.textures.remove(k);
        const t = this.textures.createCanvas(k, src.width, src.height);
        t.getContext().drawImage(src, 0, 0);
        t.refresh();
      }
      return;
    }
    const f = this.textures.getFrame(`p-${look}`, frameOf('down', 0, look));
    for (const part of ['dark', 'light']) {
      const k = key(this.ep, part);
      if (this.textures.exists(k)) this.textures.remove(k);
      const t = this.textures.createCanvas(k, f.cutWidth * 3, f.cutHeight * 3);
      const ctx = t.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(f.source.image, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, f.cutWidth * 3, f.cutHeight * 3);
      t.refresh();
    }
  }

  create() {
    this.makeLookArt();
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
    this.autoBadge = this.add.text(W - 14, MSG_Y - 32, '', style(SIZE.speaker, '#ffd34d')).setOrigin(1, 1).setStroke('#1a1030', 5).setDepth(5);
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
        [{ text: `${this.ep.enemy.name}が あらわれた！` }, { text: this.ep.enemy.introText },
          ...(this.ep.enemy.hintText ? [{ speaker: 'しおり', text: this.ep.enemy.hintText, face: 'normal' }] : [])], // 託善和尚の助言（3章）
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
  // 話の題（本人 10/4「ムカデとオロチの顔が巻物で隠れる。第○○話の表示方法を、根本的に変えて欲しい」）
  // ＝敵の横に縦の巻物を置き続けるのをやめた。①始めに大きな巻物を真ん中に出して 約2秒で消す ②戦いの間は 敵の足もと（下の窓のすぐ上）に横書きの細い帯
  drawTalePlaque() {
    const e = this.ep.enemy;
    // お城クエストの 5話（side）は 話数を 出さない＝題の 名前だけ（10/7 本人「巻物に『おしろのおだい』は入れないで」）
    const epLabel = e.side ? '' : e.episode;
    const label = epLabel ? `${epLabel}「${e.tale}」` : e.tale;
    const band = this.add.rectangle(W / 2, TALE_BAND_Y, W, 26, 0x0a0614, 0.62).setDepth(3);
    const txt = smooth(this.add.text(W / 2, TALE_BAND_Y, label, {
      fontFamily: BRUSH_FONT, fontSize: '18px', color: '#ffe9b0', resolution: 3, stroke: '#1a1008', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3));
    for (let fs = 18; txt.width > W - 24 && fs > 12; fs--) txt.setFontSize(fs - 1); // 長い題は帯に収まるまで小さく
    this.taleBand = [band, txt];
    // 始めの大きな巻物（真ん中・敵の前）。2.2秒で消える
    // ⛔紙芝居のある話では出さない（本人 10/4 夜「昔話の初めのナレーション『第○○話…』の前に、巻物が1度余計に表示される。省いてほしい」）
    //   ＝紙芝居の始めに 同じ題の巻物が声つきで出る（startTitle）。紙芝居の無い話だけ ここで出す
    if (e.story?.tell?.length) return;
    const before = this.children.list.length;
    const shade = this.add.rectangle(0, 0, W, MSG_Y, 0x05030c, 0.55).setOrigin(0);
    drawScroll(this, W / 2, 128, fitScroll(128, MSG_Y - 16, { episode: epLabel, tale: e.tale, epSize: 20, taleSize: 38 }));
    const card = this.add.container(0, 0, this.children.list.slice(before)).setDepth(900);
    this.taleCard = card;
    this.tweens.add({ targets: card, alpha: { from: 0, to: 1 }, duration: 300 });
    const hide = () => this.tweens.add({ targets: card, alpha: 0, duration: 500, onComplete: () => card.destroy() });
    // 題の声（10/7 お城クエストの 紙芝居の 無い 話にも）＝届いて いれば 巻物を 出して 0.5秒後に 読み、読み終えて 0.5秒で 消す
    const url = `assets/story/title_${e.id}.mp3`;
    if (!STORY_FILES.includes(url)) { this.time.delayedCall(2200, hide); return; }
    const safety = this.time.delayedCall(8000, hide); // 音の出口が開いていない端末でも 巻物が 残らない
    this.time.delayedCall(300 + TITLE_HOLD, () => playVoice(url).then((sec) => {
      if (!safety.hasDispatched) { safety.remove(false); this.time.delayedCall(sec > 0 ? TITLE_HOLD : TITLE_NO_VOICE, hide); }
    }));
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
    this.nameTexts = {};
    this.badgeTexts = [];
    // 3〜4人（昔話の味方が加わったとき）は 名前を上に横一列（本人 10/2「名前を上部に4つ並べて」＝2×2だと字が重なった）。
    // 1人ぶんは幅78ドット：名前・HP・術を縦に3段。窓の高さは2人のときと同じ
    const four = this.state.allies.length > 2;
    this.state.allies.forEach((a, i) => {
      const x = four ? 28 + i * 78 : 30 + i * 164; // 和風の枠の金の線の内側（10/4 夜 本人「旅の者・術が枠に被って見えにくい」＝24→28）
      if (!four) {
        this.nameTexts[a.id] = this.add.text(x, 20, a.name, style(SIZE.name));
        this.statusTexts[a.id] = {
          hp: this.add.text(x, 48, '', style(SIZE.stat)),
          mp: this.add.text(x, 76, '', style(SIZE.stat)),
        };
        return;
      }
      this.nameTexts[a.id] = this.add.text(x, 20, a.name, style(17));
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
    this.refreshAilments();
    // 4人のときは術の無い者（しおり）の「術 0」を出さない
    for (const a of this.state.allies) this.statusTexts[a.id].mp.setText(this.state.allies.length > 2 && !a.maxMp ? '' : `術 ${a.mp}`);
  }

  setAllyHp(id, hp) {
    const a = this.state.allies.find((x) => x.id === id);
    const t = this.statusTexts[id].hp;
    t.setText(`HP ${hp}/${a.maxHp}`);
    t.setColor(hp === 0 ? '#ff5050' : hpColor({ ...a, hp }, a.maxHp)); // 憑依は赤（10/4）
  }

  // 癖の印（本人 10/4「癖がついたらわかるように」）＝名前の右に色つきの印（憑＝赤／呪＝紫／止＝橙／霊＝水色）
  // 全員にかかる状態は右上の所持金の下に「術封じ あと3」「目くらまし あと2」
  refreshAilments() {
    for (const t of this.badgeTexts ?? []) t.destroy();
    this.badgeTexts = [];
    const four = this.state.allies.length > 2;
    for (const a of this.state.allies) {
      const n = this.nameTexts?.[a.id];
      if (!n?.scene) continue;
      let x = n.x + n.width + 2;
      for (const k of badgesOf(a)) {
        const b = this.add.text(x, n.y + (four ? 1 : 2), AILMENTS[k].badge, style(four ? 15 : 17, AILMENTS[k].color)).setStroke('#2a0a0a', 4).setDepth(3);
        this.badgeTexts.push(b);
        x += b.width + 1;
      }
    }
    partyStateLines(this.state).forEach((l, i) => {
      this.badgeTexts.push(this.add.text(W - 14, 142 + i * 24, l.text, style(SIZE.badge, l.color)).setOrigin(1, 0).setStroke('#1a1030', 5).setDepth(3));
    });
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
      // 10/8 夜 声の ある 文は 次へ 進む 時に 必ず 声を 止める（読み込みが 遅れて 次の 文に 声が 重なった＝読み手の 指摘）
      const go = () => { if (m.voice) stopVoice(); next(); };
      let timer = this.time.delayedCall(delay, go);
      const skip = () => {
        timer.remove(false);
        go();
      };
      this.skip = skip;
      // 声の ある 文（10/8 大将の お礼）＝届いている 声だけ 流し、声が 終わるまで 次へ 進まない（自動でも）
      if (m.voice && STORY_FILES.includes(m.voice)) {
        // playVoice は 鳴り終わってから 返る＝長さは 鳴りはじめの 知らせ（onStart）で 受けとる
        playVoice(m.voice, (sec) => {
          if (this.skip !== skip || !sec) return;
          timer.remove(false);
          timer = this.time.delayedCall(Math.max(delay, sec * 1000 + 500), go);
        });
      }
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
    } else if (fx.kind === 'iai') {
      // 居合い斬り（武士・10/4）：白い一閃が敵を斜めに横切り、遅れて光る
      const line = this.add.rectangle(W / 2, ENEMY_Y, 420, 6, 0xffffff).setAngle(-28).setDepth(800).setScale(0, 1);
      this.tweens.add({ targets: line, scaleX: 1, duration: 110, ease: 'Cubic.Out', onComplete: () => {
        this.cameras.main.flash(260, 255, 255, 255);
        this.cameras.main.shake(220, 0.014);
        this.tweens.add({ targets: line, alpha: 0, scaleY: 0.2, duration: 420, onComplete: () => line.destroy() });
      } });
    } else if (fx.kind === 'dual') {
      // くノ一の 短剣の二連撃（10/4 夜）：細い 白い筋が ×の字に 2本 走る
      [-35, 35].forEach((ang, i) => {
        const line = this.add.rectangle(W / 2, ENEMY_Y, 300, 4, 0xe8f4ff).setAngle(ang).setDepth(800).setScale(0, 1);
        this.time.delayedCall(i * 120, () => this.tweens.add({ targets: line, scaleX: 1, duration: 80, ease: 'Cubic.Out', onComplete: () => {
          this.cameras.main.shake(90, 0.006);
          this.tweens.add({ targets: line, alpha: 0, duration: 260, onComplete: () => line.destroy() });
        } }));
      });
    } else if (fx.kind === 'kitsunebi') {
      // 狐火の術：青白い 火の玉が 敵のまわりに 灯って 寄っていく
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const f = this.add.circle(W / 2 + Math.cos(a) * 120, ENEMY_Y + Math.sin(a) * 90, 10, 0x9fd8ff, 0.9).setDepth(800).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: f, x: W / 2, y: ENEMY_Y, scale: 1.8, alpha: 0, duration: 520, delay: i * 40, ease: 'Sine.In', onComplete: () => f.destroy() });
      }
      this.time.delayedCall(520, () => this.cameras.main.flash(240, 140, 200, 255));
    } else if (fx.kind === 'crit') {
      // かいしんの一撃：白く光って大きく揺れる
      this.cameras.main.flash(300, 255, 255, 255);
      this.cameras.main.shake(300, 0.02);
    } else if (fx.kind === 'shake') {
      this.cameras.main.shake(220, 0.012);
    } else if (fx.kind === 'special') {
      // 必殺技：画面が光り（色は敵ごと・既定は炎の赤）、大きく揺れる
      const [r, g, b] = fx.flash ?? [255, 90, 30];
      if (!fx.solo) sfx('special'); // 激しい効果音（本人 10/4）＝挿絵が すべりこんで 当たる 0.18秒に合わせてある（solo＝技の音だけ＝すごいおなら）
      if (fx.cutin && this.textures.exists(fx.cutin)) {
        this.showCutin(fx.cutin, () => { this.cameras.main.flash(450, r, g, b); this.cameras.main.shake(500, 0.022); });
      } else {
        this.cameras.main.flash(450, r, g, b);
        this.cameras.main.shake(500, 0.022);
      }
    } else if (fx.kind === 'jobfx') {
      this.playJobFx(fx);
    } else if (fx.kind === 'mist') {
      this.updateMistBadge(fx.mist);
      this.tweens.add({ targets: this.mistBadge, alpha: 0.2, duration: 120, yoyo: true, repeat: 1 });
    } else if (fx.kind === 'mp') {
      sfx('heal');
      this.statusTexts[fx.target].mp.setText(`術 ${fx.mp}`);
    } else if (fx.kind === 'hitAlly' || fx.kind === 'heal') {
      sfx(fx.kind === 'heal' ? 'heal' : 'damage');
      this.setAllyHp(fx.target, fx.hp);
    } else if (fx.kind === 'helper') {
      this.showHelper();
    } else if (fx.kind === 'reveal') {
      sfx('reveal');
      this.weakBadge.setText(`弱点：${this.ep.spells[this.ep.enemy.weakness].name}`);
      this.tweens.add({ targets: this.weakBadge, alpha: 1, duration: 400 });
      this.dragon.setTint(0xffd34d);
      this.time.delayedCall(500, () => this.dragon.clearTint());
    }
  }

  // ⭐4人の 技の 演出（10/8 本人「4人の必殺技を出すとき、効果音やエフェクトを多用してほしい、強い必殺技ほど派手に」）
  // 段（jobs.js の tier）ごとの 重ね方は src/battle/jobfx.js の jobFxPlan＝光・揺れ・飛び散る 星・広がる 輪・技の 名の 帯・暗転・回る 光の 筋・二度目の 光・重ねる 音
  // 色は 技の 種類（JOBFX_LOOK：斬る＝白金・術＝青白・回復＝若草・舞＝橙・守り＝金・封じ＝紫）
  playJobFx(fx) {
    const p = jobFxPlan(fx.tier);
    const [r, g, b] = JOBFX_COLORS[fx.look] ?? JOBFX_COLORS.attack;
    const col = (r << 16) | (g << 8) | b;
    const cam = this.cameras.main;
    const ADD = Phaser.BlendModes.ADD;
    p.sfx.forEach((n, i) => this.time.delayedCall(i * 60, () => sfx(n)));
    const burst = () => {
      cam.flash(p.flash, r, g, b);
      if (p.shake) cam.shake(p.flash + 80, p.shake);
      for (let i = 0; i < p.sparks; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = 60 + Math.random() * (70 + 25 * p.tier);
        const s = this.add.star(W / 2, ENEMY_Y, 4, 2, 5 + p.tier, col, 1).setDepth(820).setBlendMode(ADD);
        this.tweens.add({ targets: s, x: W / 2 + Math.cos(a) * d, y: ENEMY_Y + Math.sin(a) * d, angle: 180, scale: 0.3, alpha: 0, duration: 450 + p.tier * 120, delay: i * 12, ease: 'Cubic.Out', onComplete: () => s.destroy() });
      }
      for (let k = 0; k < p.rings; k++) {
        const ring = this.add.circle(W / 2, ENEMY_Y, 20, col, 0).setStrokeStyle(3 + p.tier, col, 0.9).setDepth(815).setBlendMode(ADD);
        this.tweens.add({ targets: ring, scale: 6 + k * 1.5, alpha: 0, duration: 520, delay: k * 130, ease: 'Cubic.Out', onComplete: () => ring.destroy() });
      }
      if (p.rays) {
        const rays = this.add.container(W / 2, ENEMY_Y).setDepth(810).setScale(0.2);
        for (let i = 0; i < p.rays; i++) rays.add(this.add.rectangle(0, 0, 460, 10, col, 0.35).setAngle((i * 180) / p.rays).setBlendMode(ADD));
        this.tweens.add({ targets: rays, scale: 1, angle: 40, duration: 500, ease: 'Cubic.Out' });
        this.tweens.add({ targets: rays, alpha: 0, delay: 700, duration: 600, onComplete: () => rays.destroy() });
      }
      if (p.banner) this.skillBanner(fx.name, col, p.tier, fx.id);
      else if (fx.id && this.textures.exists(`skn_${fx.id}`)) this.skillName(fx.id, p.tier); // 10/10 段1・2も 毛筆の 名（小さめ）
      if (p.afterFlash) this.time.delayedCall(450, () => { cam.flash(300, 255, 255, 255); cam.shake(350, 0.016); });
    };
    if (p.darken) {
      // 奥の手（4章の 技）＝いったん 暗く なって、力を ためてから はじける（音 waza4 の ドンが 0.45秒）
      const veil = this.add.rectangle(0, 0, W, H, 0x000000, 1).setOrigin(0).setDepth(805).setAlpha(0); // 塗りは 1・全体の 透明度で 暗くする（塗り 0 だと 見えない）
      this.tweens.add({ targets: veil, alpha: 0.7, duration: 420, onComplete: burst });
      this.tweens.add({ targets: veil, alpha: 0, delay: 1300, duration: 400, onComplete: () => veil.destroy() });
    } else burst();
  }

  // 10/10 技の 名の 毛筆（段1・2＝帯なしで 敵の 前に ふわっと）。高さは 段で 変える＝SKILLNAME_H
  skillName(id, tier) {
    // 10/10 本人「背景が暗いことがあるので、字の周りを白のエフェクト」＝白い 光は 絵に 焼いた（prep_skillnames.add_glow）＝和紙の 札は 外した
    const im = this.add.image(0, 0, `skn_${id}`);
    im.setScale(Math.min(SKILLNAME_H[tier] / (im.height - 2 * SKILLNAME_PAD), (W - 20) / im.width)); // 高さは 墨の 字で 測る（光の 幅を 除く）
    const box = this.add.container(W / 2, 250, [im]).setDepth(900).setAlpha(0).setScale(1.3);
    this.tweens.add({ targets: box, scale: 1, alpha: 1, duration: 180, ease: 'Back.Out',
      onComplete: () => this.tweens.add({ targets: box, alpha: 0, delay: 650, duration: 250, onComplete: () => box.destroy() }) });
  }

  // 技の 名の 帯（3章の 奥義・4章の 技）：左から すべりこむ 黒い 帯に 毛筆の 名前・上に「奥義」「秘奥義」
  skillBanner(name, col, tier, id = null) {
    const y = 250;
    const h = tier >= 4 ? 74 : 58;
    const box = this.add.container(-W, 0).setDepth(900);
    const css = `#${col.toString(16).padStart(6, '0')}`;
    const band = this.add.rectangle(0, y, W, h, 0x000000, 0.78).setOrigin(0, 0.5);
    const edge = (dy) => this.add.rectangle(0, y + dy, W, tier >= 4 ? 3 : 2, col).setOrigin(0, 0.5);
    const label = this.add.text(W / 2, y - h / 2 + 4, JOBFX_LABEL[tier] ?? '', { fontFamily: BRUSH_FONT, fontSize: '14px', color: css, resolution: 3 }).setOrigin(0.5, 0);
    const title = this.add.text(W / 2, y + 8, name, { fontFamily: BRUSH_FONT, fontSize: tier >= 4 ? '30px' : '24px', color: '#ffffff', resolution: 3, stroke: '#1a1008', strokeThickness: 5 }).setOrigin(0.5);
    if (title.width > W - 24) title.setScale((W - 24) / title.width);
    box.add([band, edge(-h / 2), edge(h / 2), label, title]);
    // 10/10 本人「習字のかっこいい文字、必殺技の強さにより字の大きさが変わる」＝毛筆の 絵が あれば 字の かわりに それを 段の 大きさで
    if (id && this.textures.exists(`skn_${id}`)) {
      title.setVisible(false);
      // 10/10 白い 光を 焼いた ので 黒い 帯の まま（前は 墨が 沈むので 和紙の 色に して いた）
      const im = this.add.image(W / 2, y + 6, `skn_${id}`);
      im.setScale(Math.min(SKILLNAME_H[tier] / (im.height - 2 * SKILLNAME_PAD), (W - 4) / im.width));
      box.add(im);
    }
    this.tweens.add({
      targets: box, x: 0, duration: 200, ease: 'Cubic.Out',
      onComplete: () => this.tweens.add({ targets: box, alpha: 0, delay: tier >= 4 ? 1300 : 900, duration: 250, onComplete: () => box.destroy() }),
    });
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
    // ⛔影絵の右上の小さな巻物はやめた（本人 10/4「昔話中の右側表示は要りません」＝始めに大きな巻物で題を読む）
    // 3Dしおり：挿絵の右下に半身で立ち（影絵も右下を空けて描かせている）、声の大きさで口を動かし、ときどき まばたき
    const has3d = this.textures.exists('shiori3d_m0_e0');
    let talking = false;
    let mouth = 0;
    let blinkUntil = 0;
    let nextBlink = this.time.now + 2500;
    const sh = has3d ? this.add.image(W - 70, MSG_Y + 2 + SHIORI_DROP, 'shiori3d_m0_e0').setOrigin(0.5, 1).setScale(0.5) : null;
    if (sh) {
      for (const m of [0, 1, 2]) for (const e of [0, 1]) this.textures.get(`shiori3d_m${m}_e${e}`).setFilter(Phaser.Textures.FilterMode.LINEAR);
      box.addAt(sh, box.list.indexOf(win)); // 窓の後ろ・挿絵の前
      this.tweens.add({ targets: sh, y: MSG_Y + 4 + SHIORI_DROP, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' }); // ゆっくり息をする
    }
    let titling = false; // 始めの題の巻物を出している間
    let titleEnd = null;
    const animate = () => {
      if (!sh?.scene) return; // 紙芝居の途中で場面が閉じたら（窓ごと消えた後）何もしない
      const now = this.time.now;
      // 声があれば その大きさで／声が無い間（文字だけ）は、語っている間だけ口をぱくぱく
      const lv = voiceLevel();
      let want = 0;
      if (titling) want = 0; // 題の読み上げは しおりでなく大人の語り手＝口は閉じたまま
      else if (lv > 0) want = lv > 0.14 ? 2 : lv > 0.05 ? 1 : 0; // 声の大きさ（Gemini の声で最大0.3くらい）
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
        playVoice(revUrl(c.voice), onStart).then((sec) => {
          if (ended || shown !== i) return;
          timer?.remove(false);
          timer = this.time.delayedCall(sec > 0 ? hold : fallback, show);
        });
      } else {
        startReveal(fallback * 0.9);
        timer = this.time.delayedCall(fallback + hold - 500, show);
      }
    };
    // ⭐始めの題（本人 10/4「昔話の初め、真ん中に巻物出現時『だいじゅうよんわ、じゃこつじぞう』とナレーションを。前後0.5秒のフリーズ。他の話も統一で」）
    // 挿絵の枠の真ん中に大きな巻物 → 0.5秒止める → 題の声（assets/story/title_<id>.mp3・しおりより大人の語り手）→ 0.5秒止める → 消えて①の絵へ
    // 声が届いていない・鳴らない端末では 1.6秒見せる。さわると すぐ①へ／とばすで紙芝居ごと抜ける
    const startTitle = () => {
      const e = this.ep.enemy;
      if (part !== 'tell' || !e.episode || !e.tale) { show(); return; }
      titling = true;
      pic.setVisible(false);
      who.setText('');
      text.setText('');
      // ⛔巻物はやめた（10/5 夕 本人）＝挿絵の枠いっぱいにアイキャッチ、上の空に話数と題の字（右下は3Dしおりが立つ）。絵が まだの話は 字だけ
      const eyeKey = `assets/story/eye_${e.id}.png`;
      const parts = [];
      const fy = 18 + (W - 16) / 2;
      if (this.textures.exists(eyeKey)) {
        const eye = this.add.image(W / 2, fy, eyeKey);
        eye.setScale((W - 40) / Math.max(eye.width, eye.height));
        parts.push(eye);
      }
      // 太い習字（10/5 夜 本人）＝後ろに濃い縁の字、前に白い縁で太らせた字を重ねる
      // ⭐縦書きで 左の端（10/6 本人「イラストの顔にかかるケースが多い。全て縦書きで左に」）＝右の列に 話数、その左の列に 題（縦書きは 右から 左へ 読む）
      const titleSize = (t, max, h) => Math.max(18, Math.min(max, Math.floor(h / ([...t].length * 1.04))));
      // 1字ずつ 置く＝縁の太さで 行の高さが ずれない（⛔1つの字に 改行で 並べると、後ろの 太い縁の 字と 前の 字の 行の高さが 違い、二重に 見えた）
      const ink = (t, size, x, y) => {
        const st = { fontFamily: EYE_FONT, fontSize: `${size}px`, color: '#ffffff', resolution: 3 };
        const out = [];
        [...t].forEach((ch, i) => {
          const cy = y + i * Math.round(size * 1.04) + size / 2;
          out.push(this.add.text(x, cy, ch, st).setOrigin(0.5).setStroke('#120a20', 14).setShadow(0, 2, '#000000', 6, true, true));
        });
        [...t].forEach((ch, i) => {
          const cy = y + i * Math.round(size * 1.04) + size / 2;
          out.push(this.add.text(x, cy, ch, st).setOrigin(0.5).setStroke('#ffffff', 3));
        });
        return out;
      };
      const TOP = 38;
      const H = 300; // 挿絵の枠の 上から 下まで
      const taleSize = titleSize(e.tale, 42, H);
      const epSize = titleSize(e.episode, 24, H * 0.6);
      parts.push(...ink(e.tale, taleSize, 30 + taleSize / 2, TOP), ...ink(e.episode, epSize, 30 + taleSize + 8 + epSize / 2, TOP));
      const card = this.add.container(0, 0, parts).setAlpha(0);
      box.addAt(card, box.list.indexOf(sh?.scene ? sh : win)); // しおりと窓の後ろ・挿絵の枠の前（10/5 夜 本人「アイキャッチ画像の前にしおり」＝前は しおりの頭が絵に隠れた）
      let done = false;
      titleEnd = () => {
        if (done) return;
        done = true;
        titling = false;
        stopVoice();
        this.tweens.add({ targets: card, alpha: 0, duration: 250, onComplete: () => { card.destroy(); if (!ended) show(); } });
      };
      this.tweens.add({ targets: card, alpha: 1, duration: 300 });
      const url = `assets/story/title_${e.id}.mp3`;
      this.time.delayedCall(300 + TITLE_HOLD, () => {
        if (done || ended) return;
        if (!STORY_FILES.includes(url)) { this.time.delayedCall(TITLE_NO_VOICE, titleEnd); return; }
        const safety = this.time.delayedCall(8000, titleEnd); // 音の出口が開いていない端末でも止まらない
        playVoice(url).then((sec) => {
          safety.remove(false);
          if (!done && !ended) this.time.delayedCall(sec > 0 ? TITLE_HOLD : TITLE_NO_VOICE, titleEnd);
        });
      });
    };
    shade.on('pointerdown', () => (titling ? titleEnd() : show()));
    skip.on('pointerdown', () => { this.uiTapAt = this.time.now; finish(); });
    box.setAlpha(0);
    this.tweens.add({ targets: box, alpha: 1, duration: 300 });
    startTitle();
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
    // 気絶している人には聞かない（その番は休む・本人 10/4 すごいおなら）
    if (a.stunned > 0) {
      this.pending[a.id] = { type: 'attack' };
      this.inputIndex += 1;
      this.askNextAlly();
      return;
    }
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
    // 10/5 職業の旅：しおりも職業の技を持つ＝「語る」と「術」の両方を出す（語り終えたら「術」だけ）
    const tellBtn = tell ? ['語る', () => this.choose(a, { type: 'tell' }), 'purple'] : null;
    const jutsu = a.gun ? gun : (a.spells?.length ? ['術', () => this.spellMenu(a), 'red'] : null);
    const autoColor = tellBtn && jutsu ? 'orange' : tellBtn ? 'red' : 'purple';
    this.showButtons(a.gun ? `${a.name}は どうする？（玉 ${this.state.items.tama ?? 0}）` : `${a.name}は どうする？`, [
      ['たたかう', () => this.choose(a, { type: 'attack' }), 'orange'],
      tellBtn,
      jutsu,
      ['道具', () => this.itemMenu(a), 'green'],
      ['にげる', () => this.choose(a, { type: 'flee' }), 'blue'],
      ['自動', () => this.startAuto(), autoColor],
    ].filter(Boolean), this.inputIndex > 0 ? () => this.backAlly() : null);
    // ↑ 2人目からは「戻る」＝前の人のコマンドを選び直す（本人 10/3「戦闘中のボタンで『戻る』を追加」「他と同じ大きさで、違う色で」）
  }

  // 前の人へ戻る：その人の決めたコマンドを消して、もう一度聞く
  backAlly() {
    const allies = this.livingAllies();
    this.inputIndex = Math.max(0, this.inputIndex - 1);
    while (this.inputIndex > 0 && allies[this.inputIndex].stunned > 0) this.inputIndex -= 1; // 気絶している人は とばして戻る
    delete this.pending[allies[this.inputIndex].id];
    this.askNextAlly();
  }

  setFace(face) {
    this.msgFace.setVisible(!!face);
    if (face) this.msgFace.setTexture(`face_${face}`);
    // 金の枠の内側（窓は x 8〜352・右の線は x 約334）に収める
    this.msgText.setX(face ? 130 : 30).setWordWrapWidth(face ? 200 : 300, true);
    // 名前：顔があるときは顔の下に ひとまわり大きく（本人 10/2）／無いときは左上
    if (face) {
      this.msgSpeaker.setPosition(72, MSG_Y + 150).setOrigin(0.5, 0).setFontSize(20);
      fitSpeaker(this.msgSpeaker); // 顔の 幅に 収める（10/6）
    } else this.msgSpeaker.setPosition(38, MSG_Y + 18).setOrigin(0, 0).setFontSize(SIZE.speaker);
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
    // 本人 10/4「文字が小さく、他のコマンドを押してしまう」＝横一列（間 約14ドット・大きさ50）をやめ、2段に（上の段が多め）・大きさ66・字はボタンの上
    const top = Math.ceil(all.length / 2);
    all.forEach(([label, fn, color], i) => {
      const row = i < top ? 0 : 1;
      const n = row === 0 ? top : all.length - top;
      const k = row === 0 ? i : i - top;
      const pitch = n >= 4 ? 84 : n >= 3 ? 108 : 120; // 4つの段（しおりの 語る・術 の両方）は詰める
      const x = W / 2 + (k - (n - 1) / 2) * pitch;
      const y = MSG_Y + (row === 0 ? 102 : 174);
      const b = makeButton(this, x, y, color, label, () => {
        if (this.time.now < this.menuReadyAt) return;
        this.menuReadyAt = Infinity; // 凹んでいる間の二度押しで、次の人のコマンドまで決めない
        sfx('select');
        // 凹んだ絵を一瞬見せてから次へ
        this.time.delayedCall(90, fn);
      }, { size: 66, fontSize: [...label].length >= 4 ? 14 : 17, below: false });
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
      const used = sp.once && a.usedOnce?.includes(id);
      const cost = sp.once ? (used ? '使った' : '1戦1回') : `術${sp.cost}`;
      // 効き目（jobs.js の desc）。昔話の弱点の術は「語って明かすと よく効く」
      const sub = sp.desc ?? (sp.weakMult ? (id === this.ep.enemy.weakness ? '語って明かした 弱点に よく効く' : '昔話の主の 弱点を突く術') : sp.kind === 'heal' ? '全員のHPを 回復' : null);
      // 10/10 洗い出し：効く 相手の いない 技は 灰色（倒れた 人の いない 蘇生・もやの 無い 四股踏み）
      const idle = (sp.kind === 'revive' && !this.state.allies.some((x) => !x.alive)) ? '倒れた 仲間は いない'
        : (sp.kind === 'mistall' && !(this.state.enemy.mistLeft > 0)) ? 'もやは もう 晴れている' : null;
      const pick = () => {
        // 10/10 本人「だれに魔法をかけるかを選択できるように」＝1人に かかる 技（倒れた 仲間 1人を 起こす・1人を 回復）は 相手を 選ぶ
        const dead = this.state.allies.filter((x) => !x.alive);
        if (sp.kind === 'revive' && !sp.all && dead.length > 1) return this.targetMenu(a, `${sp.name}で だれを 起こす？`, dead, (t) => ({ type: 'spell', spellId: id, target: t }), () => this.spellMenu(a));
        if (sp.kind === 'healOne') return this.targetMenu(a, `${sp.name}を だれに？`, this.livingAllies(), (t) => ({ type: 'spell', spellId: id, target: t }), () => this.spellMenu(a));
        return this.choose(a, { type: 'spell', spellId: id });
      };
      return [`${sp.name}（${cost}）`, idle ? null : pick, null, idle ?? sub];
    });
    this.showMenu('どの 術を つかう？', [...opts, ['戻る', () => this.askNextAlly()]]);
  }

  // 10/10 1人に かかる 技・道具の 相手を 選ぶ（HP か 術の力を 横に）。戻る＝前の 選び
  targetMenu(a, title, list, cmdOf, back, mp = false) {
    const opts = list.map((t) => [t.name, () => this.choose(a, cmdOf(t.id)), t.alive ? (mp ? `術 ${t.mp}/${t.maxMp}` : `HP ${t.hp}/${t.maxHp}`) : '倒れて いる']);
    this.showMenu(title, [...opts, ['戻る', back]]);
  }

  // 道具。無くなった物は灰色で残す
  itemMenu(a) {
    // 名前の右に効き目（本人 10/1「名物の隣に効き目も表示してほしい」）
    const opts = Object.entries(this.ep.items).filter(([, it]) => it.kind !== 'ammo').map(([id, it]) => { // 鉄砲の玉は「鉄砲」で使う
      // 10/10 洗い出し：この ターンに もう 決めた 分を 引く（最後の 1個を 2人が 選べ、2人目の 手番が むだに なった）
      const n = this.state.items[id] - Object.values(this.pending ?? {}).filter((c) => c?.type === 'item' && c.itemId === id).length;
      const ally = this.state.allies.find((x) => x.id === (a?.id ?? a));
      const no = it.kind === 'sweet' && ally ? sweetBlocked(ally, id, it) : null; // 10/10 洗い出し：食べた お菓子・術の 無い 人の 水飴は 灰色（選ぶと 手番が むだに なった）
      const note = no ?? itemNote(it);
      // 10/10 1人に 使う 薬（HP・術）は 相手を 選ぶ（秘薬の 間は 全員に 効くので 選ばない）
      const one = (it.kind === 'hp' || it.kind === 'mp') && !this.state.medAll;
      const whom = one ? this.livingAllies().filter((t) => it.kind !== 'mp' || t.maxMp > 0) : null;
      const go = () => (one
        ? this.targetMenu(a, `${it.name}を だれに 使う？`, whom, (t) => ({ type: 'item', itemId: id, target: t }), () => this.itemMenu(a), it.kind === 'mp')
        : this.choose(a, { type: 'item', itemId: id }));
      const none = one && !whom.length; // 10/10 洗い出し：術の 力の ある 人が いないと 窓が「戻る」だけに なった
      return [`${it.name}×${Math.max(0, n)}`, n > 0 && !no && !none ? go : null, none ? '使える 人が いない' : note];
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

  // 選び（本人 10/4「UIが使いずらい。文字が小さく、他のコマンドを押してしまう」）＝地図の選びと同じ作り
  // 1行 MENU_ROW（46）・字21。入りきらなければ窓を上へ伸ばし（敵の上に重ねる）、それでも入らなければページ。決まるのは指を離したとき
  showMenu(title, options, page = 0) {
    this.clearMenu();
    this.setFace(null);
    this.msgSpeaker.setText('');
    this.msgText.setText(title);
    this.menuReadyAt = this.time.now + 200;
    const ROW = MENU_ROW;
    const BOTTOM = MSG_Y + 204;
    // 2列に並べる。6字を超える項目があるときは1列（字が大きいので2列だとはみ出す）
    const cols = options.some(([label, , note, sub]) => [...label].length > 6 || note || sub) ? 1 : 2; // 効き目の字があれば1列（10/2 重なっていた）
    const colW = cols === 1 ? 320 : 160;
    const titleH = title ? this.msgText.height + 10 : 0;
    const maxRows = Math.max(3, Math.floor((BOTTOM - MENU_TOP_B - 16 - titleH) / ROW));
    let list = options;
    if (Math.ceil(options.length / cols) > maxRows) {
      const per = maxRows * cols - 1;
      const pages = Math.ceil(options.length / per);
      const p = page % pages;
      list = [...options.slice(p * per, p * per + per), [p + 1 < pages ? `つぎへ ▶` : `はじめへ ▶`, () => this.showMenu(title, options, p + 1)]];
    }
    const rows = Math.ceil(list.length / cols);
    const top = Math.min(MSG_Y, BOTTOM - rows * ROW - titleH - 16);
    if (top < MSG_Y) {
      const sheet = this.windowBox(8, top - 6, W - 16, MSG_Y + 212 - top + 6).setDepth(4);
      this.menu.push(sheet);
      this.msgText.setDepth(5);
    }
    this.msgText.setY(top + 16);
    const y0 = top + 16 + titleH;
    const glow = this.add.rectangle(0, 0, colW - 8, ROW - 6, 0xffd98a, 0.22).setOrigin(0).setVisible(false).setDepth(5);
    this.menu.push(glow);
    let pressed = null;
    const release = () => { pressed = null; glow.setVisible(false); };
    list.forEach(([label, fn, note, sub], i) => {
      const x = 26 + (i % cols) * colW;
      const y = y0 + Math.floor(i / cols) * ROW; // 行の上の端
      // sub＝名前の下の小さな字（技の効き目・10/5 本人「必殺技の効果を入れて」）＝行の上半分に名前・下半分に効き目
      const t = this.add.text(x, y + (sub ? 12 : (ROW - 6) / 2), `▶ ${label}`, { ...style(sub ? 18 : SIZE.menu, fn ? '#ffffff' : '#777777'), wordWrap: null }).setOrigin(0, 0.5).setDepth(5);
      if (sub) this.menu.push(this.add.text(x + 22, y + 31, sub, { ...style(13, fn ? '#b8d8ff' : '#777777'), wordWrap: null }).setOrigin(0, 0.5).setDepth(5));
      if (note) {
        // 効き目は右端にそろえて、小さめの黄色で（無くなった物は灰色）
        const n = this.add.text(W - 28, y + (ROW - 6) / 2, note, style(SIZE.badge, fn ? '#ffd34d' : '#777777')).setOrigin(1, 0.5).setDepth(5);
        this.menu.push(n);
        // 長い項目が右の効き目とぶつかるときは、その行の字だけ縮める（10/4）
        for (let fs = SIZE.menu; t.x + t.width > n.x - n.width - 8 && fs > 12; fs--) t.setFontSize(fs - 1);
        for (let fs = SIZE.badge; t.x + t.width > n.x - n.width - 8 && fs > 13; fs--) n.setFontSize(fs - 1); // 10/6 注記も 縮める
        while (t.x + t.width > n.x - n.width - 8 && t.text.length > 4) t.setText(`${t.text.replace(/…$/, '').slice(0, -1)}…`);
      }
      if (fn) {
        // 当たり＝列の幅・高さ ROW−6（行と行のあいだ6ドットは どちらも効かない）
        t.setInteractive(new Phaser.Geom.Rectangle(-10, sub ? t.height / 2 - 12 : (t.height - (ROW - 6)) / 2, colW - 8, ROW - 6), Phaser.Geom.Rectangle.Contains);
        t.input.cursor = 'pointer';
        t.on('pointerdown', () => { if (this.time.now < this.menuReadyAt) return; pressed = t; glow.setPosition(x - 10, y).setVisible(true); });
        t.on('pointerout', () => { if (pressed === t) release(); });
        t.on('pointerup', () => {
          if (pressed !== t) return;
          release();
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
    this.msgText?.setY(MSG_Y + 42).setDepth(0); // 選びで上へ動かした文を、いつもの所へ戻す
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
    if (this.duel) {
      this.endDuel(true);
      return;
    }
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
        // 10/9 もう一度 戦う＝もらえる物の 文（台本を 差し出した・大将の 影 など）は 出さない＝進みは 変わらない
        const rewards = this.rematch ? [{ text: 'もう一度の 手合わせを 終えた。' }] : [{ text: e.reward }, ...(this.fromField && bossPay(e.id) ? [{ text: `お礼に 文を ${bossPay(e.id)} もらった！`, sfx: 'eat' }] : [])];
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
  // 助っ人が 現れた・とびかかった：左から 絵が すべりこみ、少し とどまって 消える（10/6 おこん母子）
  showHelper() {
    if (!this.textures.exists(key(this.ep, 'helper'))) return;
    const img = this.add.image(-80, ENEMY_Y + 70, key(this.ep, 'helper')).setScale(1.4).setDepth(40).setAlpha(0);
    this.tweens.add({ targets: img, x: 90, alpha: 1, duration: 350, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: img, alpha: 0, x: 120, delay: 1350, duration: 300, onComplete: () => img.destroy() });
  }

  playBlessing(done) {
    const bl = this.ep.enemy.blessing;
    // 10/9 本人「最後のボスの3Dは消してください。2Dの戦い後の姿で」＝image の 無い お礼は 戻った 2Dの 姿を 残し、光と 文だけ 重ねる
    if (bl.image) {
      const img = this.add.image(W / 2, ENEMY_Y + 10 + (bl.dy ?? 0), key(this.ep, 'blessing')).setScale(bl.scale ?? 2).setAlpha(0); // dy＝上下 // scale＝絵の 倍率
      this.tweens.add({ targets: this.dragonLight, alpha: 0, duration: 1500 });
      this.tweens.add({ targets: img, alpha: 1, duration: 2000 });
    }
    this.tweens.add({ targets: this.glowLight, alpha: 0.95, scale: 2.3, duration: 2000 });
    sfx('biwa'); // 琵琶の音とともに現れる（本人 10/1）
    this.time.delayedCall(2000, () => this.showMessages(bl.lines.map((l) => (typeof l === 'string' ? { text: l } : l)), done)); // 行は 字だけ か { text, voice }（10/8 大将の お礼の 声）
  }

  // ---- 一騎打ちの試し（10/4 相馬の道場→10/5 職業の師匠）：1本ごとに勝ち負けを数え、決まるまで次の本目へ。2本取れば その章の技 ----
  endDuel(won) {
    this.auto = false;
    this.updateAutoBadge();
    stopBgm();
    const { game, lines, next, learned } = afterDuel(this.registry.get('game'), this.duel, won);
    this.registry.set('game', game);
    const list = lines.map((text) => ({ text, sfx: text.includes('おぼえた') ? 'win' : undefined }));
    list[0].sfx = won ? 'hit' : 'damage';
    if (won && !learned) this.tweens.add({ targets: this.dragon, alpha: 0.4, duration: 300, yoyo: true });
    this.showMessages(list, () => {
      if (next) this.scene.restart({ duel: next, fromField: true });
      else this.backToField(game);
    });
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
    if (this.duel) {
      this.endDuel(false);
      return;
    }
    sfx('lose');
    this.showMessages(this.ep.enemy.loseLines.map((text) => ({ text })), () => this.showRetry('もう一度 いどむ'));
  }

  // 全滅したとき：やり直す／ゲームを終わる（本人 10/2「死んだら、ゲームを終わるのコマンドも入れて」＝題の画面へ。記録があれば「つづきから」）
  showRetry(label) {
    const quit = ['ゲームを 終わる', once(() => {
      stopBgm();
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('title'));
    })];
    // 必ず負ける1回目（2章 鬼婆）：記録へ戻らず、町の宿で目をさます（文も減らない）
    if (this.rematch) {
      this.showMenu('', [['地図へ もどる', once(() => this.backToField(afterRematch(this.registry.get('game'), this.state)))], quit]);
      return;
    }
    if (this.fromField && this.state?.enemy?.forcedLose) {
      this.showMenu('', [['……', once(() => this.backToField(afterForcedLose(this.registry.get('game'), this.ep.enemy.id)))]]);
      return;
    }
    if (this.fromField) {
      this.showMenu('', [['記録した 所から やり直す', once(() => this.backToField(afterLose(this.registry.get('game'))))], quit]);
      return;
    }
    this.showMenu('', [[label, () => this.scene.restart({ index: this.index })], quit]);
  }

  // 勝ったあと：つぎの話があれば「つぎの話へ」、無ければ準備中と伝える
  showAfterWin() {
    if (this.rematch) {
      this.showMenu('', [['地図へ もどる', once(() => this.backToField(afterRematch(this.registry.get('game'), this.state)))]]);
      return;
    }
    if (this.fromField) {
      this.showMenu('', [['旅を つづける', once(() => this.backToField(afterWin(this.registry.get('game'), this.ep.enemy.id, this.state)))]]);
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
