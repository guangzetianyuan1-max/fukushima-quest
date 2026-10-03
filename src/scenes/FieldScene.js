// 歩く地図（いわき）と町の中。本人 10/1「本来のドラクエらしく、山川を歩く、町で買い物や宿泊は？」
// 上 y0〜420 に地図（1マス32ドット・旅の者が真ん中、しおりと加わった仲間が1歩ずつうしろに続く）／下の窓に十字キーと「はなす」「どうぐ」
// 話す・店・宿の文と選びも下の窓（そのあいだ十字キーは隠す）
// 旅の状態は registry の 'game'（計算は src/field/game.js）。地図が変わる（町に入る・出る）たびに この場面を始め直す
import { EPISODES } from '../data/episodes.js?v=87';
import { ITEMS, PRICE, itemNote } from '../data/items.js?v=87';
import { FISH, PRIZES, ROD_PRICE, BITE_WINDOW_MS, WAIT_MS, rollFish, zoneStart, inZone, rentRod, addCatch, exchange } from '../field/fishing.js?v=87';
import { TILE } from '../field/tiles.js?v=87';
import { GROUNDS, OBJECTS, fieldLook, townLook } from '../field/look.js?v=87';
import { preloadKit, makeWindow, makeButton, makePad, paginate } from '../ui/kit.js?v=87';
import { preloadPeople, frameOf, ORIGIN_Y } from '../field/sprites.js?v=87';
import { TOWNS, TOWN_OF } from '../field/towns.js?v=87';
import {
  mapRows, terrainAt, canWalk, tileNameAt, DELTA, BOSS_AT, WALL_OPENED_BY, SAVE_KEY, maxOf,
  enterTown, leaveTown, buy, stayInn, save, autoSaveAfterBoss, useItem, walkStep, encounterAt,
  purify, kuyo, returnStolen, HARAI_PRICE, KUYO_PRICE, revive, revivePrice, NAME, isField, crossAt,
} from '../field/game.js?v=87';
import { membersOf } from '../battle/levels.js?v=87';
import { COMPANIONS } from '../data/companions.js?v=87';
import { ICON_IDS } from '../data/icons.js?v=87';
import { FACE_IDS } from '../data/faces.js?v=87';
import { mapPointOf } from '../field/mapcard.js?v=87';
import { FISHING_ICON_IDS } from '../data/icons_fishing.js?v=87';
import { makeRng } from '../battle/rules.js?v=87';
import { EQUIP, SLOTS, SLOT_NAME, equipNote, START_EQUIP } from '../data/equip.js?v=87';
import { buyEquip, partyView } from '../field/game.js?v=87';
import { sfx, startBgm, playJingle, jingleSeconds } from '../audio/chip.js?v=87';

const W = 360;
const MAP_H = 420; // 地図の見える高さ
const CELL = TILE * 2;
const PANEL_Y = 426;
const STEP_MS = 170; // 1歩の速さ
const FONT = 'DotGothic16, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';
const style = (size = 20, color = '#ffffff') => ({
  fontFamily: FONT, fontSize: `${size}px`, color, resolution: 3, wordWrap: { width: 318, useAdvancedWrap: true }, lineSpacing: 8,
});

const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
const NAMES = NAME;
// 歩く絵の名前（昔話の味方は自分の絵が届くまで町の人の絵を借りる）。幽霊の絵があるのは旅の者・しおり
const lookOf = (id) => COMPANIONS[id]?.look ?? id;
const HAS_GHOST = ['tabi', 'shiori', 'kariudo', 'sou'];

// もやの壁にぶつかったとき、しおりが言う手がかり
const WALL_HINT = {
  1: '鮫川の 河口の うずを しずめれば、この もやも 晴れるはず。',
  2: '賢沼の ぬしを しずめたら、この もやも 晴れると 思う。',
  3: '好間川の 淵の ぬしを しずめましょう。峠の もやは それからね。',
  4: '閼伽井嶽の 龍の 灯を 取りもどせば、北の 相馬への 道も 開くはず。',
  5: '金谷の 山の 化け物を しずめれば、大悲山への もやも 晴れると 思う。',
  6: '大悲山の 大蛇を 何とか しないと、北へは 行けないわ。',
  7: '鹿狼山の 手長明神さまを 元に もどせば、虎捕山への もやも 晴れるはず。',
};
// ボスを元に戻して歩く地図へ帰ったときの、しおりの一言
const CLEARED_LINES = {
  matsukawa: ['鮫川の 橋の もやが 晴れたわ！', '北へ 行けば、小名浜・湯本・平の 町が あるの。賢沼にも 行けるわ。'],
  kashinuma: ['平の 北、好間川の 橋の もやが 晴れたわ！', '好間川の 淵に、また 黒い うずが あるみたい。'],
  jagan: ['閼伽井嶽へ 登る 峠の もやが 晴れたわ！', '山の上の お寺で、龍の 灯が 消えかけているの。'],
  ryuto: ['これで いわきの 昔話は みんな 元に もどったわ。', '北の 口の もやが 晴れた！ 1章「相馬」へ 行けるわ。いわきの 地図の いちばん 北よ。'],
  // 1章 相馬（10/3）
  zarukaburi: ['大悲山への 入口の もやが 晴れたわ！', '大悲山の 薬師堂の 池に、大蛇が いるそうよ。小高の 町で 支度を しましょう。'],
  daihisan: ['北の 浜街道の もやが 晴れたわ！', '北に 相馬の 町が あるの。その 先の 鹿狼山に、手長明神さまが いらっしゃるわ。'],
  tenaga: ['虎捕山への 山道の もやが 晴れたわ！', '虎捕山には、凶賊 橘墨虎が 隠れているの。相馬の 町で しっかり 支度してね。'],
  sumitora: ['これで 相馬の 昔話は みんな 元に もどったわ。', '1章「相馬」の 旅は ここまで。つづきは 準備中です。'],
};
// いわきの北の口から 相馬へ入ったとき（1章の始まり）
const CROSS_SOMA = [
  { text: '浜街道を 北へ。ここから 1章「相馬」。' },
  { speaker: 'しおり', text: '南相馬の 小高よ。金谷の 山に、ざるの ような 頭の 化け物が 出るそうなの。' },
  { speaker: 'しおり', text: '相馬の 道の 敵は いわきより 強いわ。小高の 町で 支度を ととのえましょう。' },
];
const INTRO = [
  { text: 'ここは 勿来の関。むかしから 歌に よまれた、みちのくの 入口。' },
  { speaker: 'しおり', text: 'ようこそ、旅の人。わたしは しおり。昔話の 語り部よ。' },
  { speaker: 'しおり', text: 'このごろ 昔話が 忘れられて、黒い もやが あちこちの 道を ふさいでいるの。' },
  { speaker: 'しおり', text: 'まずは すぐ 東の 鮫川の 河口へ。もやの うずを しずめに 行きましょう。' },
];

// 字体の読み込みに渡す、この画面の字
export const FIELD_TEXT = JSON.stringify([WALL_HINT, CLEARED_LINES, INTRO, CROSS_SOMA, TOWNS, ITEMS])
  + 'はなすどうぐ文HP旅の者しおりいわき何を買う？やめる買った！足りないようだ……お泊まりになりますか？はいいいえひと晩でございますお代がゆっくり湯につかってつかれがすっかりとれた！お参りして旅を記録しますか？記録を残した八幡さまは武運の神さまと伝わる端末では残せないとくに何もないみたい黒いもやが道をふさいでいるうずまいている食べた回復した使えない▼▲◀▶';

export class FieldScene extends Phaser.Scene {
  constructor() {
    super('field');
  }

  // 地図の絵（Gemini の部品・art_src/prep_tiles.py が assets/tiles/ に出す）
  preload() {
    for (const g of GROUNDS) if (!this.textures.exists(`g_${g}`)) this.load.image(`g_${g}`, `assets/tiles/g_${g}.png`);
    for (const o of OBJECTS) if (!this.textures.exists(`o_${o}`)) this.load.image(`o_${o}`, `assets/tiles/o_${o}.png`);
    preloadKit(this);
    preloadPeople(this);
    for (const id of [...ICON_IDS, ...FISHING_ICON_IDS]) if (!this.textures.exists(`icon_${id}`)) this.load.image(`icon_${id}`, `assets/icons/${id}.png`);
    if (!this.textures.exists('bg_fishing')) this.load.image('bg_fishing', 'assets/bg_fishing.png'); // 小名浜の釣り場（Gemini・夕焼けと灯台と桟橋）
    // 一枚絵（町の入口・章の地図＝Gemini 4組目・art_src/prep_cards.py）
    for (const k of [...Object.keys(TOWNS).filter((t) => !TOWNS[t].cardPending).map((t) => `town_${t}`), 'map']) if (!this.textures.exists(`card_${k}`)) this.load.image(`card_${k}`, `assets/cards/${k}.png`);
    for (const f of ['normal', 'surprise', 'sad', ...FACE_IDS]) if (!this.textures.exists(`face_${f}`)) this.load.image(`face_${f}`, `assets/cards/face_${f}.png`);
  }

  create() {
    // ⚠町に入る・出る・戦いから帰るたびに作り直す＝前の部品（消えた字）を忘れてから作る
    this.statusText = null;
    this.moneyText = null;
    this.g = this.registry.get('game');
    this.mapId = this.g.pos.map;
    this.rows = mapRows(this.mapId);
    this.town = TOWNS[this.mapId] ?? null;

    // ---- 地図：地面を敷き、上に置く物を下の段から順に重ねて、1枚の絵に焼く ----
    // （地図の中身は この場面の間は変わらない＝もやの壁が晴れるのは戦いのあとで、場面ごと作り直す）
    const mapW = this.rows[0].length * CELL;
    const mapH = this.rows.length * CELL;
    this.layer = this.add.renderTexture(0, 0, mapW, mapH).setOrigin(0);
    const objs = [];
    this.rows.forEach((r, y) => [...r].forEach((ch, x) => {
      const look = isField(this.mapId) ? fieldLook(this.g, ch, x, y) : townLook(ch, x, y);
      this.layer.stamp(`g_${look.ground}`, null, x * CELL, y * CELL, { originX: 0, originY: 0 });
      for (const o of look.objs) objs.push({ key: `o_${o}`, x, y, w: 1, h: 1 });
    }));
    for (const pr of this.town?.props ?? []) objs.push({ key: `o_${pr.img}`, x: pr.x, y: pr.y, w: pr.w, h: pr.h });
    objs.sort((a, b) => (a.y + a.h) - (b.y + b.h));
    for (const o of objs) {
      // 幅を w マスに合わせて縮め（大きい物だけ）、下の辺をマスの下にそろえる。1マスの物は元の大きさのまま真ん中に
      const src = this.textures.get(o.key).getSourceImage();
      const k = o.w > 1 ? (o.w * CELL) / src.width : 1;
      const cx = (o.x + o.w / 2) * CELL;
      const by = (o.y + o.h) * CELL;
      this.layer.stamp(o.key, null, cx, by, { originX: 0.5, originY: 1, scale: k });
    }

    // ---- 人 ----
    const { x, y, dir } = this.g.pos;
    this.facing = dir ?? 'up';
    this.px = x;
    this.py = y;
    this.step = 0;
    this.npcs = (this.town?.npcs ?? []).map((n) => ({
      ...n, dir: 'down', sprite: this.add.sprite(...this.center(n.x, n.y), `p-${n.look}`, frameOf('down', 0, n.look)).setOrigin(0.5, ORIGIN_Y),
    }));
    // 後ろに続く仲間（しおり・加わった昔話の味方）。1人ずつ前の人の1歩うしろ
    this.followers = [];
    let [fx, fy] = [x, y];
    for (const id of membersOf(this.g).slice(1)) {
      [fx, fy] = this.behind(fx, fy, this.facing);
      this.followers.push({ id, x: fx, y: fy, dir: this.facing });
    }
    // 後ろの人から置く＝前の人が上に重なる
    for (const f of [...this.followers].reverse()) {
      f.sprite = this.add.sprite(...this.center(f.x, f.y), `p-${lookOf(f.id)}`, frameOf(this.facing, 0, lookOf(f.id))).setOrigin(0.5, ORIGIN_Y);
    }
    this.shiori = this.followers[0].sprite;
    this.player = this.add.sprite(...this.center(x, y), 'p-tabi', frameOf(this.facing, 0, 'tabi')).setOrigin(0.5, ORIGIN_Y);
    this.refreshGhosts();
    // 足踏み（昔のドラクエと同じく、立っていても歩くコマを繰り返す）
    this.time.addEvent({ delay: 380, loop: true, callback: () => { this.step += 1; this.refreshFrames(); } });

    // ---- カメラ：地図用（上）と、窓・ボタン用（全体）----
    const cam = this.cameras.main;
    cam.setViewport(0, 0, W, MAP_H);
    cam.setBounds(0, Math.min(0, (mapH - MAP_H) / 2), Math.max(mapW, W), Math.max(mapH, MAP_H));
    cam.startFollow(this.player, true);
    cam.setRoundPixels(true);
    cam.setBackgroundColor(isField(this.mapId) ? '#2f5fb3' : '#000000');
    this.ui = this.add.container(0, 0);
    this.uiCam = this.cameras.add(0, 0, W, 640);
    cam.ignore(this.ui);
    this.uiCam.ignore([this.layer, this.player, ...this.followers.map((f) => f.sprite), ...this.npcs.map((n) => n.sprite), ...this.makeMistArrows()]);

    this.buildUi();
    this.refreshStatus();

    // ---- さわる・キー ----
    this.held = null;
    this.busy = false;
    this.moving = false;
    this.lastBump = -9999;
    this.input.on('pointerup', () => { this.held = null; });
    this.input.on('pointerdown', () => {
      if (this.busy && this.advance && this.time.now >= this.msgReadyAt) this.advance();
    });
    this.keys = this.input.keyboard?.createCursorKeys();
    this.input.keyboard?.on('keydown-Z', () => this.pressTalk());
    this.input.keyboard?.on('keydown-ENTER', () => (this.busy && this.advance ? (this.time.now >= this.msgReadyAt && this.advance()) : this.pressTalk()));
    this.input.keyboard?.on('keydown-X', () => this.pressItems());

    startBgm(this.fieldBgm());
    cam.fadeIn(300, 0, 0, 0);

    // 旅の始まり／ボスを元に戻して帰ってきたとき
    if (this.g.intro) {
      this.setGame({ ...this.g, intro: false });
      this.time.delayedCall(350, () => this.showMessages(INTRO));
    } else if (this.g.justEntered === this.mapId) {
      this.setGame({ ...this.g, justEntered: null });
      this.showTownCard();
    } else if (this.g.justCrossed) {
      // 地図の口を通ったとき（10/3 1章）：相馬へ入ると章の始まりの一言
      const to = this.g.justCrossed;
      this.setGame({ ...this.g, justCrossed: null });
      if (to === 'soma') this.time.delayedCall(350, () => this.showMessages(CROSS_SOMA));
    } else if (this.g.justCleared) {
      const id = this.g.justCleared;
      // ボスを元に戻したあと、昔話の味方が加わる回はその台詞も続ける（afterWin が justJoined を付ける）
      // 最後の行（「○○が 仲間に 加わった！」）で短い曲を鳴らし、曲が終わるまで止める（本人 10/3「フリーズと短めの音楽」）
      const joined = (this.g.justJoined ?? []).flatMap((j) => COMPANIONS[j].joinLines.map((text, k, all) => ({ text, jingle: k === all.length - 1 ? 'join' : undefined })));
      // ボスを元に戻したら、その場で自動セーブ（本人 10/3「各ボスを倒した時点で、自動セーブをして欲しい。コメント『自動セーブがされた』」）
      const { game, text } = autoSaveAfterBoss(this.g);
      this.setGame(game);
      let stored = false;
      try {
        localStorage.setItem(SAVE_KEY, text);
        stored = true;
      } catch {
        // 端末の決まりで残せないときも、この遊びの間は続けられる
      }
      const saved = { text: stored ? '自動セーブが された。' : '（この 端末では 記録が 残せない ようだ……）' };
      this.time.delayedCall(350, () => this.showMessages([...CLEARED_LINES[id].map((text) => ({ speaker: 'しおり', text })), ...joined, saved]));
    }
  }

  // 力つきた仲間は幽霊の姿で歩く（本人 10/2「死んだら幽霊のキャラを作りたい」＝Gemini の幽霊の絵・少し透ける）
  refreshGhosts() {
    if (!this.player) return;
    for (const [id, s] of [['tabi', this.player], ...this.followers.map((f) => [f.id, f.sprite])]) {
      const dead = !!this.g.party[id]?.dead;
      const key = dead && HAS_GHOST.includes(id) ? `p-${id}_ghost` : `p-${lookOf(id)}`;
      if (s.texture.key !== key) s.setTexture(key, s.frame.name);
      s.setAlpha(dead ? 0.85 : 1);
      // 幽霊の絵がまだ無い者（昔話の味方）は青白く透かす
      if (dead && !HAS_GHOST.includes(id)) s.setAlpha(0.5).setTint(0x9fd0ff);
      else s.clearTint();
    }
  }

  // ---- 黒いもや（道をふさぐ壁・ボスの渦）の上に赤い矢印（本人 10/2「移動画面で、モヤが分かりにくい。上部に赤の矢印を付けて欲しい」）----
  // 晴れた壁・元に戻したボスの場所には出さない。上下にゆっくり揺らす
  makeMistArrows() {
    if (!isField(this.mapId)) return [];
    if (!this.textures.exists('mist_arrow')) {
      const tex = this.textures.createCanvas('mist_arrow', 20, 22);
      const c = tex.getContext();
      const tri = (col, pad) => {
        c.fillStyle = col;
        c.beginPath();
        c.moveTo(10, 21 - pad);
        c.lineTo(1 + pad, 8 + pad / 2);
        c.lineTo(6 + pad / 2, 8 + pad / 2);
        c.lineTo(6 + pad / 2, 1 + pad);
        c.lineTo(14 - pad / 2, 1 + pad);
        c.lineTo(14 - pad / 2, 8 + pad / 2);
        c.lineTo(19 - pad, 8 + pad / 2);
        c.closePath();
        c.fill();
      };
      tri('#2a0a0a', 0); // 黒い縁
      tri('#e8302a', 2); // 赤
      tex.refresh();
    }
    const arrows = [];
    this.rows.forEach((r, y) => [...r].forEach((ch, x) => {
      const wall = WALL_OPENED_BY[ch] && !this.g.cleared[WALL_OPENED_BY[ch]];
      const boss = BOSS_AT[ch] && !this.g.cleared[BOSS_AT[ch]];
      if (!wall && !boss) return;
      const a = this.add.image(x * CELL + CELL / 2, y * CELL - 6, 'mist_arrow').setScale(1.4).setDepth(5); // スマホでも見える大きさ
      this.tweens.add({ targets: a, y: a.y - 8, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      arrows.push(a);
    }));
    return arrows;
  }

  // 歩く地図の曲（本人 10/3「章ごとにBGMは新しく」）＝いわき（序章）は始まりの曲・相馬（1章）は somaField。町の中は その町のある地図の曲
  fieldBgm() {
    const map = isField(this.mapId) ? this.mapId : this.g.fieldMap ?? 'field';
    return { soma: 'somaField' }[map] ?? 'title';
  }

  // ---- 町に入った瞬間の一枚絵（1.3秒・さわると飛ばす）----
  showTownCard() {
    const NAME = { taira: '平の城下町', yumoto: '湯本の湯の町', onahama: '小名浜の港', odaka: '小高の町', nakamura: '相馬の城下町' };
    this.busy = true;
    const box = this.add.container(0, 0).setAlpha(0);
    box.add(this.add.rectangle(0, 0, W, MAP_H, 0x000000, 0.7).setOrigin(0));
    // 町の入口の一枚絵（Gemini）。まだ届いていない町（1章）は名前だけ
    if (this.textures.exists(`card_town_${this.mapId}`)) box.add(this.add.image(W / 2, 190, `card_town_${this.mapId}`));
    box.add(this.add.text(W / 2, 318, NAME[this.mapId], {
      fontFamily: '"Potta One", "Yuji Boku", serif', fontSize: '30px', color: '#ffffff', resolution: 3, stroke: '#1a1008', strokeThickness: 6,
    }).setOrigin(0.5));
    this.addUi(box);
    let done = false;
    const close = () => {
      if (done) return;
      done = true;
      this.tweens.add({ targets: box, alpha: 0, duration: 350, onComplete: () => { box.destroy(); this.busy = false; } });
    };
    this.tweens.add({ targets: box, alpha: 1, duration: 300 });
    this.time.delayedCall(1600, close);
    this.input.once('pointerdown', close);
  }

  // ---- 福島の地図（巻物）を見る。さわると閉じる ----
  showMap() {
    this.closeDialog();
    this.busy = true;
    const box = this.add.container(0, 0);
    box.add(this.add.rectangle(0, 0, W, 640, 0x000000, 0.85).setOrigin(0).setInteractive());
    const card = this.add.image(W / 2, 312, 'card_map');
    box.add(card);
    // いま ここ（本人 10/3「現在地を矢印で表示して欲しい」）＝赤い下向きの矢印が上下にゆれ、先が いまの場所を指す
    const pt = mapPointOf(this.g);
    const px = card.x - card.width / 2 + pt.x;
    const py = card.y - card.height / 2 + pt.y;
    box.add(this.add.circle(px, py, 4, 0xffffff).setStrokeStyle(2, 0xd02020));
    const arrow = this.add.container(px, py - 8);
    arrow.add(this.add.triangle(0, 0, -11, -22, 11, -22, 0, 0, 0xe02020).setOrigin(0, 0).setStrokeStyle(2, 0xffffff));
    arrow.add(this.add.text(0, -26, 'いま ここ', { fontFamily: FONT, fontSize: '14px', color: '#ffffff', resolution: 3, stroke: '#a01010', strokeThickness: 4 }).setOrigin(0.5, 1));
    box.add(arrow);
    this.tweens.add({ targets: arrow, y: py - 16, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    box.add(this.add.text(W / 2, 628, 'さわると とじる', { fontFamily: FONT, fontSize: '15px', color: '#cfd8ff', resolution: 3 }).setOrigin(0.5, 1));
    this.addUi(box);
    this.time.delayedCall(250, () => this.input.once('pointerdown', () => { box.destroy(); this.busy = false; }));
  }

  // ---- 座標 ----
  center(x, y) {
    return [x * CELL + CELL / 2, y * CELL + CELL / 2];
  }

  behind(x, y, dir) {
    const [dx, dy] = DELTA[OPPOSITE[dir]];
    return canWalk(this.g, this.mapId, x + dx, y + dy) && !this.npcAt(x + dx, y + dy) ? [x + dx, y + dy] : [x, y];
  }

  npcAt(x, y) {
    return this.npcs?.find((n) => n.x === x && n.y === y) ?? null;
  }

  setGame(g) {
    this.g = g;
    this.registry.set('game', g);
    this.refreshStatus?.();
  }

  refreshFrames() {
    this.player.setFrame(frameOf(this.facing, this.step, 'tabi'));
    for (const f of this.followers) {
      const look = this.g.party[f.id]?.dead && HAS_GHOST.includes(f.id) ? `${f.id}_ghost` : lookOf(f.id);
      f.sprite.setFrame(frameOf(f.dir, this.step, look));
    }
    for (const n of this.npcs) n.sprite.setFrame(frameOf(n.dir, this.step, n.look));
  }

  // ---- 窓とボタン ----
  addUi(obj) {
    this.ui.add(obj);
    return obj;
  }

  // 和風の窓（藍の地に金の二重線・四隅の雲＝Gemini の部品表）
  box(x, y, w, h) {
    return this.addUi(makeWindow(this, x, y, w, h));
  }

  buildUi() {
    // 上：HP と文と、いまの場所（2人＝2行・3〜4人＝仲間の行が1行ふえる）
    const rows = Math.ceil(membersOf(this.g).length / 2) + 1;
    this.box(4, 4, W - 8, 16 + rows * 23);
    this.statusText = this.addUi(this.add.text(30, 16, '', style(15)));  // 和風の枠の金の線（約12ドット）の内側
    // 所持金は右上＝いちばん下の行の右（本人 10/2「所持金は右上に表示して欲しい」）
    this.moneyText = this.addUi(this.add.text(W - 30, 16 + (rows - 1) * 23, '', style(15, '#ffd98a')).setOrigin(1, 0));
    this.box(0, MAP_H, W, 640 - MAP_H).setAlpha(1);

    // 丸い十字キー（左）と、丸いボタン「はなす」（橙）「どうぐ」（緑）。押すと凹む（本人 10/2）
    this.pad = this.add.container(0, 0);
    this.addUi(this.pad);
    this.pad.add(makePad(this, 102, 530, (dir) => { this.held = dir; }, 1.25));
    this.pad.add(makeButton(this, 280, 488, 'orange', 'はなす', () => this.pressTalk(), { size: 84, fontSize: 18, below: false }));
    this.pad.add(makeButton(this, 280, 584, 'green', 'どうぐ', () => this.pressItems(), { size: 70, fontSize: 16, below: false }));

    // 文の窓（下の窓を使う）
    this.dlg = this.add.container(0, 0).setVisible(false);
    this.addUi(this.dlg);
    this.dlgSpeaker = this.add.text(38, PANEL_Y + 18, '', style(16, '#ffd98a'));
    this.dlgText = this.add.text(26, PANEL_Y + 44, '', style(20));
    this.dlgMore = this.add.text(W - 40, 640 - 40, '▼', style(18)).setOrigin(0.5);
    this.tweens.add({ targets: this.dlgMore, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
    // しおりが話すときは窓の左に顔（Gemini の顔絵・本人 10/2「しおりは3Dしおりに寄せて」）
    this.dlgFace = this.add.image(72, PANEL_Y + 92, 'face_normal').setVisible(false);
    this.dlg.add([this.dlgSpeaker, this.dlgText, this.dlgMore, this.dlgFace]);
    this.menuItems = [];
  }

  refreshStatus() {
    // 作り直しで消えた札の字（scene が無い）には触らない。⛔isActive() で見ると、場面を始め直した直後（create の中）も止まって見えて札が空のままだった（10/2）
    if (!this.statusText?.scene) return;
    const p = this.g.party;
    // 呪い＝呪・取り憑き＝憑 を名前の後ろに。力つきた仲間は「幽霊」（寺社で生き返る）
    const mark = (id) => (p[id].curse ? '呪' : '') + (p[id].ghost ? '憑' : '');
    const hp = (id) => (p[id].dead ? `${NAMES[id]} 幽霊` : `${NAMES[id]}${mark(id)} ${p[id].hp}/${maxOf(this.g, id).hp}`);
    // 術の力も見せる（本人 10/2「術は温泉で回復しますか？」＝宿で戻るのが見えるように）
    const mp = (id) => (maxOf(this.g, id).mp > 0 && !p[id].dead ? ` 術${p[id].mp}` : '');
    const place = this.town ? this.town.name : { field: 'いわき', soma: '相馬' }[this.mapId] ?? ''; // 10/3 1章の地図「相馬」
    // 2人ずつ1行（4人なら2行）・いちばん下の行に Lv と場所（右に所持金）
    const ids = membersOf(this.g);
    const lines = [];
    for (let i = 0; i < ids.length; i += 2) lines.push(ids.slice(i, i + 2).map((id) => `${hp(id)}${mp(id)}`).join('　'));
    this.statusText.setText(`${lines.join('\n')}\nLv ${this.g.lv ?? 1}　${place}`);
    this.moneyText?.setText(`所持金 ${this.g.mon}文`);
    this.refreshGhosts?.();
  }

  // ---- 文と選び ----
  openDialog() {
    this.busy = true;
    this.held = null;
    this.pad.setVisible(false);
    this.dlg.setVisible(true);
  }

  closeDialog() {
    this.clearMenu();
    this.advance = null;
    this.dlg.setVisible(false);
    this.pad.setVisible(true);
    this.busy = false;
  }

  // list＝[{text, speaker?}]。さわるたびに次へ。終わったら done（無ければ窓を閉じる）
  showMessages(list0, done) {
    const list = [...list0];
    this.openDialog();
    this.clearMenu();
    let i = 0;
    const next = () => {
      if (i >= list.length) {
        this.advance = null;
        if (done) done();
        else this.closeDialog();
        return;
      }
      const m = list[i++];
      this.dlgSpeaker.setText(m.speaker ?? '');
      // 顔：しおりは表情（m.face）・ほかの仲間は m.face に その人の id（顔絵が届いていれば）
      this.setFace(m.speaker?.startsWith('しおり') ? m.face ?? 'normal' : m.face && this.textures.exists(`face_${m.face}`) ? m.face : null);
      // 窓（▼の上 y 約600）に収まらなければ、残りを次のページに回す
      const pages = paginate(this.dlgText, m.text, 600);
      list.splice(i, 0, ...pages.slice(1).map((text) => ({ speaker: m.speaker, face: m.face, text })));
      this.dlgMore.setVisible(true);
      this.msgReadyAt = this.time.now + 180;
      // 短い曲の付いた文：曲が終わるまで ▼ を隠して先へ進ませない（音が出ない端末でも同じ長さだけ止める）→ 地図の曲へ戻す
      if (m.jingle) {
        playJingle(m.jingle);
        const ms = jingleSeconds(m.jingle) * 1000 + 400;
        this.dlgMore.setVisible(false);
        this.msgReadyAt = this.time.now + ms;
        this.time.delayedCall(ms, () => { this.dlgMore.setVisible(true); startBgm(this.fieldBgm()); });
      }
      this.advance = next;
    };
    next();
  }

  // 顔あり＝文を顔の右へ寄せて幅を狭める
  setFace(face) {
    this.dlgFace.setVisible(!!face);
    if (face) this.dlgFace.setTexture(`face_${face}`);
    // 金の枠の内側（右の線は x 約342）に収める
    this.dlgText.setX(face ? 128 : 30).setWordWrapWidth(face ? 202 : 302, true);
    // 名前：顔があるときは顔の下に ひとまわり大きく（本人 10/2）／無いときは左上
    if (face) this.dlgSpeaker.setPosition(72, PANEL_Y + 142).setOrigin(0.5, 0).setFontSize(20);
    else this.dlgSpeaker.setPosition(38, PANEL_Y + 18).setOrigin(0, 0).setFontSize(16);
  }



  // options＝[[文字, 押したとき, 右の小さな注記]]
  showMenu(title, options) {
    this.openDialog();
    this.clearMenu();
    this.setFace(null);
    this.advance = null;
    this.dlgSpeaker.setText('');
    this.dlgMore.setVisible(false);
    const readyAt = this.time.now + 200;
    // 選びは文の下の端から（本人 10/2「文字とコマンドが重なっている」＝長い文が3行になると決め打ちの位置と重なった）
    // それでも窓（下の端 y 約620）に収まらないとき（文が長い・項目が多い）は、字をひとまわり小さくして詰める（10/2 2度目「今だ重なるときがある」）
    const BOTTOM = 620;
    let fs = 19;
    let top = 0;
    let pitch = 32;
    for (const [tfs, ofs, minPitch] of [[20, 19, 32], [17, 17, 28], [15, 16, 25]]) {
      this.dlgText.setFontSize(tfs).setText(title);
      fs = ofs;
      top = title ? Math.max(PANEL_Y + 72, this.dlgText.y + this.dlgText.height + 8) : PANEL_Y + 30;
      pitch = Math.min(32, (BOTTOM - top) / options.length);
      if (pitch >= minPitch) break;
    }
    this.menuLayout = { top, pitch, fs }; // 試験（重なりの見張り）用
    options.forEach(([label, fn, note], i) => {
      const y = top + i * pitch;
      const t = this.add.text(30, y, `▶ ${label}`, { ...style(fs, fn ? '#ffffff' : '#777777'), wordWrap: null });
      this.dlg.add(t);
      this.menuItems.push(t);
      if (note) {
        const n = this.add.text(W - 28, y + 2, note, style(16, '#ffd34d')).setOrigin(1, 0);
        this.dlg.add(n);
        this.menuItems.push(n);
      }
      if (fn) {
        t.setInteractive(new Phaser.Geom.Rectangle(-10, -6, 320, 32), Phaser.Geom.Rectangle.Contains);
        t.on('pointerdown', () => {
          if (this.time.now < readyAt) return;
          sfx('select');
          fn();
        });
      }
    });
  }

  clearMenu() {
    for (const t of this.menuItems) t.destroy();
    this.menuItems = [];
  }

  // ---- 歩く ----
  update() {
    if (this.busy || this.moving) return;
    let dir = this.held;
    if (!dir && this.keys) dir = ['up', 'down', 'left', 'right'].find((d) => this.keys[d].isDown) ?? null;
    if (dir) this.tryStep(dir);
  }

  tryStep(dir) {
    this.facing = dir;
    this.refreshFrames();
    const [dx, dy] = DELTA[dir];
    const nx = this.px + dx;
    const ny = this.py + dy;
    if (this.npcAt(nx, ny)) return;
    if (!canWalk(this.g, this.mapId, nx, ny)) {
      this.bump(nx, ny);
      return;
    }
    this.moving = true;
    const [ox, oy] = [this.px, this.py];
    this.px = nx;
    this.py = ny;
    // 後ろの仲間は、1人前の人が今いた所へ（しおり→和尚→岩手の順に続く）
    let [lx, ly] = [ox, oy];
    for (const f of this.followers) {
      const [fx, fy] = [f.x, f.y];
      f.dir = fx === lx && fy === ly ? dir : (lx > fx ? 'right' : lx < fx ? 'left' : ly > fy ? 'down' : 'up');
      f.x = lx;
      f.y = ly;
      const [sx, sy] = this.center(lx, ly);
      this.tweens.add({ targets: f.sprite, x: sx, y: sy, duration: STEP_MS });
      [lx, ly] = [fx, fy];
    }
    const [tx, ty] = this.center(nx, ny);
    this.tweens.add({
      targets: this.player, x: tx, y: ty, duration: STEP_MS,
      onComplete: () => {
        this.moving = false;
        let g = { ...this.g, pos: { map: this.mapId, x: nx, y: ny, dir } };
        if (isField(this.mapId)) g = walkStep(g);
        this.setGame(g);
        this.arrive(nx, ny);
      },
    });
  }

  bump(x, y) {
    const t = terrainAt(this.mapId, x, y);
    if (!isField(this.mapId) || !t || !WALL_OPENED_BY[t.ch]) return;
    if (this.time.now - this.lastBump < 1200) return;
    this.lastBump = this.time.now;
    this.showMessages([{ text: '黒い もやが 道を ふさいでいる……' }, { speaker: 'しおり', text: WALL_HINT[t.ch] }]);
  }

  arrive(x, y) {
    const ch = this.rows[y][x];
    if (isField(this.mapId)) {
      const crossed = crossAt(this.g, this.mapId, x, y); // 地図の口（いわき⇔相馬・10/3 1章）
      if (crossed) {
        sfx('select');
        this.goto({ ...crossed, steps: 0, justCrossed: crossed.pos.map });
      } else if (TOWN_OF[ch]) {
        sfx('select');
        this.goto(enterTown(this.g, TOWN_OF[ch]));
      } else if (this.meet(x, y)) {
        // 道中の敵に出会った（meet の中で戦いへ）
      } else if (BOSS_AT[ch] && !this.g.cleared[BOSS_AT[ch]]) {
        const index = EPISODES.findIndex((e) => e.enemy.id === BOSS_AT[ch]);
        this.showMessages([{ text: '黒い もやが うずまいている……！' }], () => {
          this.busy = true;
          this.cameras.main.fadeOut(400, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('battle', { index, fromField: true }));
        });
      }
    } else if (ch === 'x') {
      this.goto(leaveTown(this.g));
    }
  }

  // 道中の敵：出会ったら画面が光って戦いへ
  meet(x, y) {
    this.rng = this.rng ?? makeRng((Date.now() & 0x7fffffff) || 1);
    const hit = encounterAt(this.g, this.mapId, x, y, this.rng);
    if (!hit) return false;
    this.busy = true;
    this.held = null;
    sfx('bite');
    this.cameras.main.flash(250, 255, 255, 255);
    this.time.delayedCall(260, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('battle', { fromField: true, zako: hit.id, zone: hit.zone }));
    });
    return true;
  }

  goto(g) {
    this.busy = true;
    this.setGame(g);
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart());
  }

  // ---- はなす・しらべる ----
  pressTalk() {
    if (this.busy || this.moving) return;
    const [dx, dy] = DELTA[this.facing];
    let n = this.npcAt(this.px + dx, this.py + dy);
    // カウンター越し
    if (!n && terrainAt(this.mapId, this.px + dx, this.py + dy)?.ch === 'c') n = this.npcAt(this.px + 2 * dx, this.py + 2 * dy);
    if (!n) {
      this.showMessages([{ speaker: 'しおり', text: 'とくに 何も ないみたい。' }]);
      return;
    }
    n.dir = OPPOSITE[this.facing];
    this.refreshFrames();
    const lines = n.lines.map((text) => ({ text }));
    if (n.role === 'shop') this.showMessages(lines, () => this.shopMenu(n));
    else if (n.role === 'inn') this.showMessages(lines, () => this.innMenu(n));
    else if (n.role === 'shrine') this.showMessages(lines, () => this.shrineMenu());
    else if (n.role === 'temple') this.showMessages(lines, () => this.templeMenu());
    else if (n.role === 'equip') this.showMessages(lines, () => this.equipShop(n.goods, n.items));
    else if (n.role === 'bansho') this.banshoTalk();
    else if (n.role === 'fishing') this.showMessages(lines, () => this.fishMenu());
    else this.showMessages(lines);
  }

  shopMenu(n) {
    const opts = n.goods.map((id) => [ITEMS[id].name, () => this.buyOne(n, id), `${PRICE[id]}文`]);
    this.showMenu(`何を 買う？（所持金 ${this.g.mon}文）`, [...opts, ['やめる', () => this.closeDialog()]]);
  }

  buyOne(n, id) {
    const r = buy(this.g, id);
    if (r.ok) {
      this.setGame(r.game);
      sfx('eat');
    }
    const text = r.ok ? `${ITEMS[id].name}を 買った！（${this.g.items[id]}こ 持っている）` : '文が 足りないようだ……';
    if (r.ok) this.showGoods(id);
    this.showMessages([{ text }], () => (n.role === 'equip' ? this.equipShop(n.goods, n.items) : this.shopMenu(n)));
  }

  innMenu(n) {
    this.showMenu(`ひと晩 ${n.price}文で ございます。お泊まりに なりますか？（所持金 ${this.g.mon}文）`, [
      ['はい', () => {
        const r = stayInn(this.g, n.price);
        if (!r.ok) {
          this.showMessages([{ text: 'お代が 足りない ようで ございます……' }]);
          return;
        }
        this.setGame(r.game);
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          sfx('heal');
          this.cameras.main.fadeIn(600, 0, 0, 0);
          this.showMessages([{ text: 'ゆっくり 湯に つかって、つかれが すっかり とれた！' }]);
        });
      }],
      ['いいえ', () => this.showMessages([{ text: 'またの お越しを。' }])],
    ]);
  }

  // 呪い（八幡さまの お祓い）・取り憑き（お寺の 供養）を治す
  cureMenu(fn, price, word, flag) {
    if (!Object.values(this.g.party).some((p) => p[flag])) {
      this.showMessages([{ text: flag === 'ghost' ? 'いまは 何も 憑いて おらぬな。' : 'いまは 呪いは かかって いないようです。' }]);
      return;
    }
    this.showMenu(`${word}を いたしましょうか？ ${price}文 です。（所持金 ${this.g.mon}文）`, [
      ['はい', () => {
        const r = fn(this.g);
        if (!r.ok) {
          this.showMessages([{ text: '文が 足りないようだ……' }]);
          return;
        }
        this.setGame(r.game);
        sfx('reveal');
        this.cameras.main.flash(500, 255, 255, 230);
        this.showMessages([{ text: flag === 'ghost' ? '霊は 安らかに 去っていった。体が 軽くなった！' : '呪いが とけた！ 体が 自由に 動く。' }]);
      }],
      ['いいえ', () => this.closeDialog()],
    ]);
  }

  // 力つきて幽霊になった仲間を、文を払って生き返らせる（八幡さま・湯本のお寺）
  reviveMenu() {
    const dead = Object.keys(this.g.party).filter((id) => this.g.party[id].dead);
    if (!dead.length) {
      this.showMessages([{ text: 'いまは 生き返らせる 人は おらぬようじゃ。' }]);
      return;
    }
    const price = revivePrice(this.g) * dead.length;
    this.showMenu(`${dead.map((id) => NAMES[id]).join('と ')}を 生き返らせますか？ ${price}文 です。（所持金 ${this.g.mon}文）`, [
      ['はい', () => {
        const r = revive(this.g);
        if (!r.ok) {
          this.showMessages([{ text: '文が 足りないようだ……' }]);
          return;
        }
        this.setGame(r.game);
        sfx('reveal');
        this.cameras.main.flash(600, 255, 255, 230);
        this.showMessages([{ text: `${r.who.map((id) => NAMES[id]).join('と ')}は 生き返った！` }]);
      }],
      ['いいえ', () => this.closeDialog()],
    ]);
  }

  // 小名浜の番屋：盗まれた道具を返してくれる
  banshoTalk() {
    const r = returnStolen(this.g);
    if (!r.ok) {
      this.showMessages([{ text: '番屋だ。盗まれた 物は ここに 届く。いまは 何も 預かって おらん。' }]);
      return;
    }
    this.setGame(r.game);
    sfx('heal');
    const names = [...new Set(r.got)].map((id) => `${ITEMS[id].name}×${r.got.filter((x) => x === id).length}`).join('、');
    this.showMessages([
      { text: '番屋だ。おお、狸に 盗まれた 品が 届いて おるぞ。' },
      { text: `${names}を 返してもらった！` },
    ]);
  }

  shrineMenu() {
    this.showMenu(`${this.town?.shrineName ?? '八幡さま'}で 何を しますか？`, [ // 1章の町は町ごとの名（towns.js の shrineName）
      ['お参りして 記録する', () => this.doSave()],
      // 右に効き目（本人 10/2「供養するとどうなる？」＝何が治るか書いていなかった）
      [`お祓い（${HARAI_PRICE}文）`, () => this.cureMenu(purify, HARAI_PRICE, 'お祓い', 'curse'), '呪いを とく'],
      ['生き返らせる', () => this.reviveMenu(), '幽霊を もどす'],
      [`勝守（${EQUIP.kachimori.price}文）`, () => this.pickWho('kachimori', () => this.shrineMenu()), '攻+2'],
      ['やめる', () => this.closeDialog()],
    ]);
  }

  templeMenu() {
    this.showMenu('湯本の 寺で 何を しますか？', [
      [`供養（${KUYO_PRICE}文）`, () => this.cureMenu(kuyo, KUYO_PRICE, '供養', 'ghost'), '憑いた霊を はらう'],
      ['生き返らせる', () => this.reviveMenu(), '幽霊を もどす'],
      [`厄除け守（${EQUIP.yakuyoke.price}文）`, () => this.pickWho('yakuyoke', () => this.templeMenu()), '厄除け'],
      ['やめる', () => this.closeDialog()],
    ]);
  }

  // ---- 小名浜の釣り（本人 10/2「漁港で釣り」「何か景品付けて」「戦闘時に役立つもの」）----
  fishMenu() {
    this.showMenu(`釣り点 ${this.g.fishPts ?? 0}点（所持金 ${this.g.mon}文）`, [
      [`竿を 借りる（${ROD_PRICE}文）`, () => this.startFishing()],
      ['景品と 換える', () => this.prizeMenu()],
      ['やめる', () => this.closeDialog()],
    ]);
  }

  prizeName(p) {
    return p.kind === 'item' ? `${ITEMS[p.id].name}${p.n > 1 ? `×${p.n}` : ''}` : EQUIP[p.id].name;
  }

  // 景品は「使う品」と「着ける品」に分ける（全部並べると窓に入らない）
  prizeMenu(kind = null) {
    if (!kind) {
      this.showMenu(`どちらの 景品に する？（釣り点 ${this.g.fishPts ?? 0}点）`, [
        ['戦いで 使う品', () => this.prizeMenu('item')],
        ['身に 着ける品', () => this.prizeMenu('equip')],
        ['もどる', () => this.fishMenu()],
      ]);
      return;
    }
    const opts = Object.entries(PRIZES).filter(([, p]) => p.kind === kind).map(([pid, p]) => {
      const note = p.kind === 'item' ? `${p.pts}点 ${itemNote(ITEMS[p.id])}` : `${p.pts}点 ${equipNote(p.id)}`;
      return [this.prizeName(p), () => this.takePrize(pid), note];
    });
    this.showMenu(`景品（釣り点 ${this.g.fishPts ?? 0}点）`, [...opts, ['もどる', () => this.prizeMenu()]]);
  }

  takePrize(pid, who = null) {
    const p = PRIZES[pid];
    if ((this.g.fishPts ?? 0) < p.pts) {
      this.showMessages([{ text: `釣り点が 足りないな。あと ${p.pts - (this.g.fishPts ?? 0)}点 だ。` }], () => this.prizeMenu(p.kind));
      return;
    }
    if (p.kind === 'equip' && !who) {
      const opts = EQUIP[p.id].who.filter((w) => membersOf(this.g).includes(w)).map((w) => {
        const now = this.g.equip?.[w]?.[EQUIP[p.id].slot];
        return [`${NAMES[w]}（今：${now ? EQUIP[now].name : 'なし'}）`, () => this.takePrize(pid, w)];
      });
      this.showMenu(`${EQUIP[p.id].name}（${equipNote(p.id)}）。だれが 着ける？`, [...opts, ['もどる', () => this.prizeMenu('equip')]]);
      return;
    }
    const r = exchange(this.g, pid, who);
    if (!r.ok) return;
    this.setGame(r.game);
    sfx('heal');
    this.showGoods(p.id);
    const lines = [{ text: p.kind === 'item' ? `${this.prizeName(p)}を もらった！` : `${NAMES[who]}は ${EQUIP[p.id].name}を 身に着けた！` }];
    if (r.old) lines.push({ text: r.refund > 0 ? `（${EQUIP[r.old].name}は ${r.refund}文で 引き取って もらった）` : `（${EQUIP[r.old].name}は 釣り番に あずけた）` });
    this.showMessages(lines, () => this.prizeMenu(p.kind));
  }

  // 釣りの画面：海と桟橋とうき。①「！」でさわる ②針が緑の帯に入ったらさわる
  startFishing() {
    const r = rentRod(this.g);
    if (!r.ok) {
      this.showMessages([{ text: '文が 足りないようだ……' }], () => this.fishMenu());
      return;
    }
    this.setGame(r.game);
    this.closeDialog();
    this.busy = true;
    const rng = makeRng((Date.now() & 0x7fffffff) || 1);
    const box = this.add.container(0, 0);
    this.addUi(box);
    // 背景＝Gemini の釣り場（空 y0〜約200・海〜約480・桟橋その下）
    box.add(this.add.image(0, 0, 'bg_fishing').setOrigin(0));
    const say = this.add.text(W / 2, 40, '', { ...style(20), align: 'center' }).setOrigin(0.5, 0).setStroke('#1a1030', 5);
    const hint = this.add.text(W / 2, 604, '', { ...style(16, '#ffe9b0'), align: 'center' }).setOrigin(0.5).setStroke('#1a1030', 5);
    const line = this.add.line(0, 0, 180, 560, 200, 330, 0xeeeeee, 0.8).setOrigin(0); // 桟橋の先から うきへ
    const bob = this.add.container(200, 330);
    bob.add(this.add.circle(0, 0, 9, 0xffffff));
    bob.add(this.add.circle(0, -5, 9, 0xd83030).setScale(1, 0.55));
    const mark = this.add.text(200, 270, '！', style(44, '#ffd34d')).setOrigin(0.5).setVisible(false).setStroke('#1a1030', 6);
    box.add([line, bob, say, hint, mark]);
    const bobTween = this.tweens.add({ targets: bob, y: 336, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const tap = this.add.rectangle(0, 0, W, 640, 0x000000, 0.001).setOrigin(0).setInteractive();
    box.add(tap);
    let stage = 'wait';
    let biteAt = 0;
    const fishId = rollFish(rng);
    const f = FISH[fishId];
    let gaugeT = null;
    let pos = 0;
    let dir = 1;
    let zs = 0;
    const end = (lines) => {
      stage = 'done';
      gaugeT?.remove(false);
      bobTween.stop();
      this.time.delayedCall(250, () => { box.destroy(); this.busy = false; this.showMessages(lines, () => this.fishMenu()); });
    };
    // 確かめ用の取っ手（自動の試験が「！」や針の位置を見て さわる。遊ぶ人には見えない）
    this.fishing = { stage: () => stage, tap: () => tap.emit('pointerdown'), inZone: () => inZone(fishId, zs, pos), fish: fishId };
    say.setText('うきを 見て、魚が かかるのを 待とう');
    hint.setText('うきが しずんで「！」が 出たら さわる');
    const wait = WAIT_MS[0] + rng() * (WAIT_MS[1] - WAIT_MS[0]);
    const biteTimer = this.time.delayedCall(wait, () => {
      if (stage !== 'wait') return;
      stage = 'bite';
      biteAt = this.time.now;
      bobTween.pause();
      bob.y = 346;
      mark.setVisible(true);
      sfx('select');
      this.time.delayedCall(BITE_WINDOW_MS, () => {
        if (stage === 'bite') end([{ text: '……おそかった。えさだけ 取られて しまった。' }]);
      });
    });
    const startReel = () => {
      stage = 'reel';
      mark.setVisible(false);
      say.setText('かかった！ 針が 緑に 入ったら さわる');
      hint.setText('');
      zs = zoneStart(fishId, rng);
      const gx = 40;
      const gw = W - 80;
      const gy = 400; // 海の上（桟橋の柱 y 約405 より上）
      const gg = this.add.graphics();
      gg.fillStyle(0x1a1030, 0.9).fillRoundedRect(gx - 6, gy - 16, gw + 12, 32, 8);
      gg.fillStyle(0x6a5a8a, 1).fillRect(gx, gy - 8, gw, 16);
      gg.fillStyle(0x4cd964, 1).fillRect(gx + zs * gw, gy - 8, f.zone * gw, 16);
      const needle = this.add.rectangle(gx, gy, 4, 30, 0xffffff);
      box.add([gg, needle]);
      // 針は端から端まで f.speed 秒で往復
      gaugeT = this.time.addEvent({ delay: 16, loop: true, callback: () => {
        pos += (dir * 16) / (f.speed * 1000);
        if (pos >= 1) { pos = 1; dir = -1; }
        if (pos <= 0) { pos = 0; dir = 1; }
        needle.x = gx + pos * gw;
      } });
    };
    tap.on('pointerdown', () => {
      if (stage === 'wait') {
        biteTimer.remove(false);
        end([{ text: '早すぎた！ 魚が 逃げて しまった。' }]);
      } else if (stage === 'bite') {
        if (this.time.now - biteAt <= BITE_WINDOW_MS) startReel();
      } else if (stage === 'reel') {
        if (inZone(fishId, zs, pos)) {
          this.setGame(addCatch(this.g, fishId));
          sfx(f.pt >= 5 ? 'win' : 'clear');
          this.time.delayedCall(260, () => this.showGoods(fishId)); // 釣れた魚の絵
          end([
            { text: `${f.name}が 釣れた！${f.pt ? `（釣り点 +${f.pt}　いま ${this.g.fishPts}点）` : ''}` },
            { speaker: 'しおり', text: f.line },
          ]);
        } else {
          sfx('down');
          end([{ text: 'ああっ、糸が 切れて しまった……' }]);
        }
      }
    });
  }

  // ---- 刀屋・荒物屋・お守り：買うと その場で着ける（前の品は半値で引き取り）----
  // 刀屋・荒物屋：いま旅にいる人が着けられる品だけ並べる。猟師がいれば鉄砲の玉も（本人 10/2「玉は武器屋で売っている」）
  // 品が多い（4人ぶんの得物＋玉で10行・窓に入らない）ときは、先に「だれの 得物？」と人を選び、その人の品だけ並べる
  equipShop(goods, items = [], who = null) {
    const members = membersOf(this.g);
    const back = () => this.equipShop(goods, items, who);
    const forWho = (w) => goods.filter((id) => EQUIP[id].who.includes(w));
    const all = goods.filter((id) => EQUIP[id].who.some((w) => members.includes(w)));
    const ammo = members.includes('kariudo') ? items.map((id) => [`${ITEMS[id].name}（${this.g.items[id] ?? 0}）`, () => this.buyOne({ role: 'equip', goods, items }, id), `${PRICE[id]}文`]) : [];
    if (who) {
      // その人の品：選べば そのまま その人が着ける
      const opts = forWho(who).map((id) => [EQUIP[id].name, () => this.doBuyEquip(id, who, back), `${EQUIP[id].price}文 ${equipNote(id)}`]);
      this.showMenu(`${NAMES[who]}の 得物（所持金 ${this.g.mon}文）`, [...opts, ['もどる', () => this.equipShop(goods, items)]]);
      return;
    }
    if (all.length + ammo.length > 5) {
      const people = members.filter((w) => forWho(w).length).map((w) => [`${NAMES[w]}の 得物`, () => this.equipShop(goods, items, w)]);
      this.showMenu(`だれの 品を 見る？（所持金 ${this.g.mon}文）`, [...people, ...ammo, ['やめる', () => this.closeDialog()]]);
      return;
    }
    const opts = all.map((id) => [EQUIP[id].name, () => this.pickWho(id, back), `${EQUIP[id].price}文 ${equipNote(id)}`]);
    this.showMenu(`何を 買う？（所持金 ${this.g.mon}文）`, [...opts, ...ammo, ['やめる', () => this.closeDialog()]]);
  }

  // 買った品の絵を、地図の真ん中に少しだけ出す（本人 10/2「買ったときにイラストを添えて」）。絵の無い品は出さない
  showGoods(id) {
    if (!this.textures.exists(`icon_${id}`)) return;
    const box = this.add.container(W / 2, 200);
    box.add(makeWindow(this, -64, -64, 128, 128));
    box.add(this.add.image(0, 0, `icon_${id}`).setScale(2));
    this.addUi(box);
    box.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: box, scale: 1, alpha: 1, duration: 220, ease: 'Back.Out' });
    this.time.delayedCall(1600, () => this.tweens.add({ targets: box, alpha: 0, duration: 300, onComplete: () => box.destroy() }));
  }

  pickWho(id, back) {
    const e = EQUIP[id];
    const eq = this.g.equip ?? START_EQUIP;
    const opts = e.who.filter((w) => membersOf(this.g).includes(w)).map((w) => { // まだ加わっていない人は出さない
      const now = eq[w]?.[e.slot];
      return [`${NAMES[w]}（今：${now ? EQUIP[now].name : 'なし'}）`, () => this.doBuyEquip(id, w, back)];
    });
    this.showMenu(`${e.name}（${equipNote(id)}）。だれが 着ける？（所持金 ${this.g.mon}文）`, [...opts, ['もどる', back]]);
  }

  doBuyEquip(id, who, back) {
    const r = buyEquip(this.g, id, who);
    if (!r.ok) {
      this.showMessages([{ text: r.reason === 'money' ? '文が 足りないようだ……' : 'その人は 着けられない。' }], back);
      return;
    }
    this.setGame(r.game);
    sfx('heal');
    this.showGoods(id);
    const lines = [{ text: `${NAMES[who]}は ${EQUIP[id].name}を 身に着けた！` }];
    if (r.old) lines.push({ text: r.refund > 0 ? `（${EQUIP[r.old].name}は ${r.refund}文で 引き取って もらった）` : `（${EQUIP[r.old].name}は 店に 置いていった）` });
    this.showMessages(lines, back);
  }

  doSave() {
    this.showMenu('お参りして、旅を 記録しますか？', [
      ['はい', () => {
        const { game, text } = save(this.g);
        this.setGame(game);
        let stored = false;
        try {
          localStorage.setItem(SAVE_KEY, text);
          stored = true;
        } catch {
          // 端末の決まりで残せないときも、この遊びの間は続けられる
        }
        sfx('reveal');
        this.showMessages([
          { text: stored ? '旅の 記録を 残した。' : '（この 端末では 記録が 残せない ようだ……）' },
          { speaker: 'しおり', text: this.town?.shrineLine ?? '八幡さまは 武運の 神さまと 伝わるの。旅の 無事を お願いしましょう。' },
        ]);
      }],
      ['いいえ', () => this.closeDialog()],
    ]);
  }

  // ---- どうぐ：道具を使う・そうびを見る・ちずを見る ----
  pressItems() {
    if (this.busy || this.moving) return;
    this.showMenu('どうする？', [
      ['道具を 使う', () => this.foodMenu()],
      ['そうびを 見る', () => this.showGear()],
      ['ちずを 見る', () => this.showMap()],
      ['セーブして 終わる', () => this.saveAndQuit()],
      ['とじる', () => this.closeDialog()],
    ]);
  }

  // どうぐ → セーブして終わる（本人 10/3「通常画面→道具→セーブしてゲームを終了する」）＝その場で記録 → 題の画面へ（題から「つづきから」）
  saveAndQuit() {
    this.showMenu('旅を 記録して、ゲームを 終わりますか？', [
      ['はい', () => {
        const { game, text } = save(this.g);
        this.setGame(game);
        let stored = false;
        try {
          localStorage.setItem(SAVE_KEY, text);
          stored = true;
        } catch {
          // 端末の決まりで残せないときは、終わらずに知らせる（記録が消えるのを防ぐ）
        }
        sfx('reveal');
        if (!stored) {
          this.showMessages([{ text: '（この 端末では 記録が 残せない ようだ……）' }]);
          return;
        }
        this.showMessages([{ text: '旅の 記録を 残した。' }, { speaker: 'しおり', text: 'おつかれさま。また 続きを 語りましょうね。' }], () => {
          this.closeDialog();
          this.cameras.main.fadeOut(600, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('title'));
        });
      }],
      ['いいえ', () => this.closeDialog()],
    ]);
  }



  showGear() {
    const lines = partyView(this.g).map((p) => ({
      speaker: `${NAMES[p.id]}　Lv ${p.lv}`, // 仲間ごとのレベル（10/3〜 加わった味方は低めから）
      face: p.id === 'shiori' ? 'normal' : p.id, // 本人 10/3「しおり以外顔が無い。みんな顔をつけて」
      text: [`攻 ${p.atk}　守 ${p.def}　速 ${p.agi}`, ...SLOTS.map((s) => `${SLOT_NAME[s]}：${p.gear[s] ? EQUIP[p.gear[s]].name : 'なし'}`)].join('\n'),
    }));
    this.showMessages(lines);
  }

  foodMenu() {
    const opts = Object.entries(this.g.items).filter(([id, k]) => k > 0 && !['ammo', 'bind'].includes(ITEMS[id].kind)).map(([id, k]) => { // 鉄砲の玉・投網は戦いで使う
      const it = ITEMS[id];
      return [`${it.name}×${k}`, () => this.eat(id), itemNote(it)];
    });
    this.showMenu(opts.length ? 'どの 道具を 使う？' : '道具を 何も 持っていない。', [...opts, ['とじる', () => this.closeDialog()]]);
  }

  eat(id) {
    const r = useItem(this.g, id);
    if (r.ok) {
      this.setGame(r.game);
      sfx('heal');
    }
    const lines = [{ text: r.text }];
    if (r.ok && ITEMS[id].desc) lines.push({ speaker: 'しおり', text: ITEMS[id].desc });
    this.showMessages(lines);
  }
}
