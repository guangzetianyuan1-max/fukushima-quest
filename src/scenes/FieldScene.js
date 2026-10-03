// 歩く地図（いわき）と町の中。本人 10/1「本来のドラクエらしく、山川を歩く、町で買い物や宿泊は？」
// 上 y0〜420 に地図（1マス32ドット・旅の者が真ん中、しおりと加わった仲間が1歩ずつうしろに続く）／下の窓に十字キーと「はなす」「どうぐ」
// 話す・店・宿の文と選びも下の窓（そのあいだ十字キーは隠す）
// 旅の状態は registry の 'game'（計算は src/field/game.js）。地図が変わる（町に入る・出る）たびに この場面を始め直す
import { EPISODES } from '../data/episodes.js?v=108';
import { ITEMS, PRICE, itemNote } from '../data/items.js?v=108';
import { FISH, PRIZES, ROD_PRICE, BITE_WINDOW_MS, WAIT_MS, rollFish, zoneStart, inZone, rentRod, addCatch, exchange } from '../field/fishing.js?v=108';
import { RIDERS } from '../data/nomaoi_assets.js?v=108';
import { FLAGS, FLAG_PRIZES, ENTRY_PRICE, ROUND_MS, CATCH_P, newRace, stepRace, racePts, flagX, fallP, enterRace, addFlags, exchangeFlag } from '../field/nomaoi.js?v=108';
import { TILE } from '../field/tiles.js?v=108';
import { GROUNDS, OBJECTS, fieldLook, townLook } from '../field/look.js?v=108';
import { preloadKit, makeWindow, makeButton, makePad, paginate } from '../ui/kit.js?v=108';
import { preloadPeople, frameOf, ORIGIN_Y } from '../field/sprites.js?v=108';
import { TOWNS, TOWN_OF } from '../field/towns.js?v=108';
import {
  mapRows, terrainAt, canWalk, tileNameAt, DELTA, BOSS_AT, WALL_OPENED_BY, SAVE_KEY, maxOf,
  enterTown, leaveTown, buy, stayInn, save, autoSaveAfterBoss, useItem, walkStep, encounterAt,
  purify, kuyo, returnStolen, HARAI_PRICE, KUYO_PRICE, revive, revivePrice, NAME, isField, crossAt,
} from '../field/game.js?v=108';
import { membersOf } from '../battle/levels.js?v=108';
import { COMPANIONS } from '../data/companions.js?v=108';
import { ICON_IDS } from '../data/icons.js?v=108';
import { FACE_IDS } from '../data/faces.js?v=108';
import { mapPointOf } from '../field/mapcard.js?v=108';
import { FISHING_ICON_IDS } from '../data/icons_fishing.js?v=108';
import { makeRng } from '../battle/rules.js?v=108';
import { EQUIP, SLOTS, SLOT_NAME, equipNote, START_EQUIP, diffNote, diffDown } from '../data/equip.js?v=108';
import { buyEquip, partyView } from '../field/game.js?v=108';
import { sfx, startBgm, playJingle, jingleSeconds } from '../audio/chip.js?v=108';

// 景品の窓（釣り＝小名浜の釣り番／旗＝雲雀ヶ原の世話役）。同じ窓を 点の名前と景品の表だけ替えて使う
const PRIZE_SHOPS = {
  fish: { key: 'fishPts', label: '釣り点', prizes: PRIZES, exchange, back: 'fishMenu', keeper: '釣り番' },
  flag: { key: 'flagPts', label: '旗点', prizes: FLAG_PRIZES, exchange: exchangeFlag, back: 'nomaoiMenu', keeper: '世話役' },
};

const W = 360;
const MAP_H = 420; // 地図の見える高さ
const CELL = TILE * 2;
const SEA_SHIFT = 96; // 相馬でカメラを右へずらす量（3マス）＝道（x=20）から海（x=28〜）が見える
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
  5: '金谷の 山の 化け物に 会って、獲りすぎないと 誓えば、大悲山への もやも 晴れると 思う。',
  6: '大悲山の 大蛇を 何とか しないと、北へは 行けないわ。',
  7: '鹿狼山の 手長明神さまを 元に もどせば、虎捕山への もやも 晴れるはず。',
  // 2章 県北（10/4）
  8: '虎捕山の 墨虎を 捕らえれば、西の 県北への 口も 開くはず。',
  9: '霊山の 墓地の 母の 霊を しずめたら、福島への もやも 晴れると 思う。',
  0: '信夫山の ご坊狐を 元に もどせば、山の 奥への もやも 晴れるはず。',
  '%': '信夫山の ムカデと オロチを しずめないと、南の 川俣へは 行けないわ。',
  '&': '川俣の へっぴり嫁さんを 迎えて あげたら、二本松への もやも 晴れると 思う。',
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
  sumitora: ['これで 相馬の 昔話は みんな 元に もどったわ。', '虎捕山の 西の 口の もやが 晴れた！ 山を 越えれば、2章「県北」よ。'],
  // 2章 県北（10/4）
  amekai: ['福島への 道の もやが 晴れたわ！', '福島の 町で 支度を しましょう。北の 信夫山に、化け狐が いるそうよ。'],
  gobou: ['信夫山の 奥への もやが 晴れたわ！', '北の 坂と 黒沼に、大きな ムカデと オロチが いるの。どちらも「信夫山の 主」を 名乗っているそうよ。'],
  mukade: ['南の 川俣への 道の もやが 晴れたわ！', '川俣の 村に、何かを こらえている お嫁さんが いるそうよ。'],
  heppiri: ['二本松への 道の もやが 晴れたわ！', '二本松の 町で 支度を しましょう。安達ヶ原の 観世寺の 岩屋に、鬼婆が いるの……おそろしく 強いそうよ。'],
  onibaba: ['これで 県北の 昔話は みんな 元に もどったわ。', '2章「県北」の 旅は ここまで。つづきは 準備中です。'],
};
// いわきの北の口から 相馬へ入ったとき（1章の始まり）
const CROSS_KENPOKU = [
  { text: '虎捕山を 越えて 西へ。ここから 2章「県北」。' },
  { speaker: 'しおり', text: '霊山の ふもとよ。夜に 飴を 買いに くる 女の 人の 話が 伝わっているの。' },
  { speaker: 'しおり', text: '県北の 敵は 相馬より もっと 強いわ。福島の 町で 支度を ととのえましょう。' },
];
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

// 雲雀ヶ原の世話役としおりの言葉（確かめた事だけ：会場＝雲雀ヶ原祭場地・甲冑競馬・花火で打ち上げた神旗を騎馬武者が奪い合う。日取りは書かない）
const NOMAOI_LINES = {
  intro: [
    'ここは 雲雀ヶ原の 祭場地。相馬野馬追では、甲冑を 着た 騎馬武者が ここに 集まるんだ。',
    '花火で 打ち上げた 神旗を、馬で 追って 奪い合う。神旗争奪戦だ。馬は 貸して やろう。',
    '取った 旗は 旗点に なる。点は 景品と 換えて やるぞ。',
  ],
  after: '相馬野馬追の 雲雀ヶ原では、甲冑競馬と 神旗争奪戦が 行われるのよ。',
  none: '……ほかの 騎馬武者は 手ごわいわね。花火が 上がったら すぐ、旗の 真下へ 走るのが こつよ。',
};

// 字体の読み込みに渡す、この画面の字
export const FIELD_TEXT = JSON.stringify([WALL_HINT, CLEARED_LINES, INTRO, CROSS_SOMA, CROSS_KENPOKU, TOWNS, ITEMS, NOMAOI_LINES, FLAGS])
  + '装備中変わらない厄除け無しいまとくらべて右は品の強さ' // 10/3 装備の注記
  + '神旗を追う旗点景品と換えるそこまで！取ったなかった金のもあった！のこり本点画面をおさえた方へ馬が走る花火が上がったら、旗の下へ！世話役陣羽織'
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
    if (!this.textures.exists('bg_nomaoi')) this.load.image('bg_nomaoi', 'assets/bg_nomaoi.png');
    RIDERS.forEach((u, i) => { if (!this.textures.exists(`nomaoi_rider_${i}`)) this.load.image(`nomaoi_rider_${i}`, u); }); // 騎馬の絵（届いた物だけ） // 雲雀ヶ原の神旗争奪戦（Gemini・10/4・art_src/prep_nomaoi.py）
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
    // ⭐相馬は浜街道を歩くとき右に海が見えるよう、カメラを右へずらす（本人 10/4「移動画面の相馬地方は右側に海を入れて欲しい」）。西の山（ザルカブリ・大悲山・虎捕山）へ入ると戻す
    this.camShift = this.seaShiftTarget();
    cam.setFollowOffset(this.camShift, 0);
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
    } else if (this.g.justSwapped) {
      // 必ず負ける1回目のあと（2章 鬼婆）：町の宿で目をさまし、仲間が入れ替わる（本人 10/4「一度全滅→町で祐慶と合流し、再トライ」）
      const id = this.g.justSwapped;
      this.setGame({ ...this.g, justSwapped: null });
      const lines = COMPANIONS[id].joinLines.map((text, k, all) => ({ text, jingle: k === all.length - 1 ? 'join' : undefined }));
      this.time.delayedCall(350, () => this.showMessages([...lines, { speaker: 'しおり', text: '祐慶さまの 破魔の 真弓なら、鬼婆に とどくはず。宿で 休んでから、もう一度 観世寺へ 行きましょう。' }]));
    } else if (this.g.justCrossed) {
      // 地図の口を通ったとき（10/3 1章）：相馬へ入ると章の始まりの一言
      const to = this.g.justCrossed;
      this.setGame({ ...this.g, justCrossed: null });
      if (to === 'soma' && !this.g.cleared.sumitora) this.time.delayedCall(350, () => this.showMessages(CROSS_SOMA));
      if (to === 'kenpoku') this.time.delayedCall(350, () => this.showMessages(CROSS_KENPOKU));
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
    // 雲雀ヶ原の祭場地（P）の上に 赤い旗の目印（10/3）
    if (!this.textures.exists('nomaoi_mark')) {
      const gr = this.make.graphics({ x: 0, y: 0, add: false });
      gr.fillStyle(0x3a2a1a, 1).fillRect(2, 0, 2, 22);
      gr.fillStyle(0xd83030, 1).fillRect(4, 1, 13, 9);
      gr.fillStyle(0xffffff, 1).fillCircle(10, 5, 2.5);
      gr.generateTexture('nomaoi_mark', 18, 22);
      gr.destroy();
    }
    this.rows.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch !== 'P') return;
      const a = this.add.image(x * CELL + CELL / 2, y * CELL - 4, 'nomaoi_mark').setScale(1.4).setDepth(5).setOrigin(0.2, 0.5);
      this.tweens.add({ targets: a, angle: 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      arrows.push(a);
    }));
    return arrows;
  }

  // 歩く地図の曲（本人 10/3「章ごとにBGMは新しく」）＝いわき（序章）は始まりの曲・相馬（1章）は somaField。町の中は その町のある地図の曲
  fieldBgm() {
    const map = isField(this.mapId) ? this.mapId : this.g.fieldMap ?? 'field';
    return { soma: 'somaField', kenpoku: 'kenpokuField' }[map] ?? 'title';
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
    const place = this.town ? this.town.name : { field: 'いわき', soma: '相馬', kenpoku: '県北' }[this.mapId] ?? ''; // 10/3 1章の地図「相馬」
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
    options.forEach(([label, fn, note, noteColor], i) => {
      const y = top + i * pitch;
      const t = this.add.text(30, y, `▶ ${label}`, { ...style(fs, fn ? '#ffffff' : '#777777'), wordWrap: null });
      this.dlg.add(t);
      this.menuItems.push(t);
      if (note) {
        const n = this.add.text(W - 28, y + 2, note, style(16, noteColor ?? '#ffd34d')).setOrigin(1, 0); // 4つ目＝注記の色（装備で下がる品は赤・装備中は灰）
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
  // 相馬で 浜街道より東（x≥16）にいる間は −SEA_SHIFT（＝画面を右へ3マス）・西の山の中では 0
  seaShiftTarget() {
    return this.mapId === 'soma' && this.px >= 16 ? -SEA_SHIFT : 0;
  }

  update() {
    const want = this.seaShiftTarget();
    if (this.camShift !== undefined && this.camShift !== want) {
      this.camShift += Math.sign(want - this.camShift) * Math.min(4, Math.abs(want - this.camShift));
      this.cameras.main.setFollowOffset(this.camShift, 0);
    }
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
      } else if (ch === 'P') {
        sfx('select');
        this.nomaoiTalk();
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
    const opts = n.goods.map((id) => [`${ITEMS[id].name}（${this.g.items[id] ?? 0}）`, () => this.buyOne(n, id), `${PRICE[id]}文 ${itemNote(ITEMS[id])}`]); // 効き目と持っている数も（10/3 道具を強くした）
    // n.back があれば「もどる」（よろず屋・刀屋の中の道具の棚から開いたとき）
    this.showMenu(`何を 買う？（所持金 ${this.g.mon}文）`, [...opts, n.back ? ['もどる', n.back] : ['やめる', () => this.closeDialog()]]);
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
      ['景品と 換える', () => this.prizeMenu(null, 'fish')],
      ['やめる', () => this.closeDialog()],
    ]);
  }

  prizeName(p) {
    return p.kind === 'item' ? `${ITEMS[p.id].name}${p.n > 1 ? `×${p.n}` : ''}` : EQUIP[p.id].name;
  }

  // 景品は「使う品」と「着ける品」に分ける（全部並べると窓に入らない）
  prizeMenu(kind = null, shopId = 'fish') {
    const shop = PRIZE_SHOPS[shopId];
    const pts = this.g[shop.key] ?? 0;
    if (!kind) {
      this.showMenu(`どちらの 景品に する？（${shop.label} ${pts}点）`, [
        ['戦いで 使う品', () => this.prizeMenu('item', shopId)],
        ['身に 着ける品', () => this.prizeMenu('equip', shopId)],
        ['もどる', () => this[shop.back]()],
      ]);
      return;
    }
    const opts = Object.entries(shop.prizes).filter(([, p]) => p.kind === kind).map(([pid, p]) => {
      const note = p.kind === 'item' ? `${p.pts}点 ${itemNote(ITEMS[p.id])}` : `${p.pts}点 ${equipNote(p.id)}`;
      return [this.prizeName(p), () => this.takePrize(pid, null, shopId), note];
    });
    this.showMenu(`景品（${shop.label} ${pts}点）`, [...opts, ['もどる', () => this.prizeMenu(null, shopId)]]);
  }

  takePrize(pid, who = null, shopId = 'fish') {
    const shop = PRIZE_SHOPS[shopId];
    const p = shop.prizes[pid];
    const pts = this.g[shop.key] ?? 0;
    if (pts < p.pts) {
      this.showMessages([{ text: `${shop.label}が 足りないな。あと ${p.pts - pts}点 だ。` }], () => this.prizeMenu(p.kind, shopId));
      return;
    }
    if (p.kind === 'equip' && !who) {
      const opts = EQUIP[p.id].who.filter((w) => membersOf(this.g).includes(w)).map((w) => {
        const now = this.g.equip?.[w]?.[EQUIP[p.id].slot];
        const [, fn, note, color] = this.equipOption(p.id, w, () => this.takePrize(pid, w, shopId)); // いまと比べた変わり方（10/3）
        return [`${NAMES[w]}（今：${now ? EQUIP[now].name : 'なし'}）`, fn, note, color];
      });
      this.showMenu(`${EQUIP[p.id].name}（${equipNote(p.id)}）。だれが 着ける？`, [...opts, ['もどる', () => this.prizeMenu('equip', shopId)]]);
      return;
    }
    const r = shop.exchange(this.g, pid, who);
    if (!r.ok) return;
    this.setGame(r.game);
    sfx('heal');
    this.showGoods(p.id);
    const lines = [{ text: p.kind === 'item' ? `${this.prizeName(p)}を もらった！` : `${NAMES[who]}は ${EQUIP[p.id].name}を 身に着けた！` }];
    if (r.old) lines.push({ text: r.refund > 0 ? `（${EQUIP[r.old].name}は ${r.refund}文で 引き取って もらった）` : `（${EQUIP[r.old].name}は ${shop.keeper}に あずけた）` });
    this.showMessages(lines, () => this.prizeMenu(p.kind, shopId));
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

  // ---- 雲雀ヶ原の祭場地：相馬野馬追の神旗争奪戦（本人 10/3「小名浜の釣りのような」）----
  // 確かめた事だけ語る：本祭りの会場は雲雀ヶ原祭場地・甲冑競馬と、花火で打ち上げた神旗を騎馬武者が奪い合う神旗争奪戦（日取りは書かない）
  nomaoiTalk() {
    this.showMessages(NOMAOI_LINES.intro.map((text) => ({ speaker: '世話役', text })), () => this.nomaoiMenu());
  }

  nomaoiMenu() {
    this.showMenu(`旗点 ${this.g.flagPts ?? 0}点（所持金 ${this.g.mon}文）`, [
      [`神旗を 追う（${ENTRY_PRICE}文）`, () => this.startNomaoi()],
      ['景品と 換える', () => this.prizeMenu(null, 'flag')],
      ['やめる', () => this.closeDialog()],
    ]);
  }

  // 争奪戦の画面：花火で上がった旗が ゆらゆら落ちる → 画面を おさえた方へ 馬が走る → 旗の真下で受け取る
  startNomaoi() {
    const r = enterRace(this.g);
    if (!r.ok) {
      this.showMessages([{ text: '文が 足りないようだ……' }], () => this.nomaoiMenu());
      return;
    }
    this.setGame(r.game);
    this.closeDialog();
    this.busy = true;
    startBgm('nomaoi');
    let race = newRace(makeRng((Date.now() & 0x7fffffff) || 1));
    const X = (x) => 30 + x * 300;
    const GROUND = 560;
    const Y = (p) => 90 + p * (GROUND - 90); // 旗が騎馬の高さ（CATCH_P）に来るのは y 約475
    const box = this.add.container(0, 0);
    this.addUi(box);
    // 背景（Gemini の絵が届くまでは 描いた空と原）
    if (this.textures.exists('bg_nomaoi')) box.add(this.add.image(0, 0, 'bg_nomaoi').setOrigin(0));
    else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x2a3a78, 0x2a3a78, 0xf0a868, 0xf0a868, 1).fillRect(0, 0, W, 340);
      bg.fillStyle(0x3d5a2a, 1).fillTriangle(-40, 340, 90, 285, 220, 340).fillTriangle(140, 340, 290, 270, 420, 340);
      bg.fillStyle(0x6a9a40, 1).fillRect(0, 335, W, 305);
      bg.fillStyle(0x7aa84a, 1).fillRect(0, 400, W, 4).fillRect(0, 470, W, 3);
      bg.fillStyle(0x5a3a1a, 1);
      for (let x = 6; x < W; x += 22) bg.fillRect(x, 580, 4, 26);
      bg.fillRect(0, 588, W, 3);
      box.add(bg);
    }
    // 騎馬（馬＋武者＋背中の旗）。旅の者は金の旗と▼
    if (!this.textures.exists('nomaoi_uma')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x6b3e1e, 1).fillEllipse(24, 24, 34, 14);
      g.fillRect(34, 10, 6, 14).fillEllipse(42, 11, 12, 7);
      g.lineStyle(3, 0x4a2a12, 1);
      for (const lx of [12, 17, 31, 36]) g.lineBetween(lx, 28, lx + (lx % 2 ? 2 : -2), 44);
      g.lineBetween(7, 22, 2, 32);
      g.generateTexture('nomaoi_uma', 50, 46);
      g.clear();
      g.fillStyle(0xffffff, 1).fillRect(6, 10, 12, 14).fillCircle(12, 6, 5);
      g.generateTexture('nomaoi_bushi', 24, 26);
      g.clear();
      g.fillStyle(0x3a2a1a, 1).fillRect(0, 0, 2, 30);
      g.fillStyle(0xffffff, 1).fillRect(2, 0, 9, 14);
      g.generateTexture('nomaoi_sashi', 12, 30);
      g.clear();
      g.fillStyle(0x3a2a1a, 1).fillRect(0, 0, 2, 26);
      g.fillStyle(0xffffff, 1).fillRect(2, 0, 16, 12);
      g.generateTexture('nomaoi_flag', 18, 26);
      g.destroy();
    }
    const rider = (armor, sashi) => {
      const c = this.add.container(0, GROUND);
      c.add(this.add.image(0, -24, 'nomaoi_uma'));
      c.add(this.add.image(-4, -50, 'nomaoi_bushi').setTint(armor));
      c.add(this.add.image(-10, -72, 'nomaoi_sashi').setTint(sashi));
      return c;
    };
    // Gemini の騎馬の絵が届いていれば それを使う（0＝旅の者・1〜3＝ほか）。右を向いた絵＝左へ走るときは裏返す（place）
    const riderImg = (i) => {
      const c = this.add.container(0, GROUND);
      c.add(this.add.image(0, 0, `nomaoi_rider_${i}`).setOrigin(0.5, 1));
      return c;
    };
    const useImg = RIDERS.length === 4 && [0, 1, 2, 3].every((i) => this.textures.exists(`nomaoi_rider_${i}`));
    const rivalViews = useImg ? [1, 2, 3].map(riderImg) : [[0x3a3a46, 0x2e6bd8], [0x5a2a2a, 0xf0f0f0], [0x2a4a3a, 0x9a3ad0]].map(([a, b]) => rider(a, b));
    const me = useImg ? riderImg(0) : rider(0xd8c8a0, 0xffd34d);
    const meMark = this.add.text(0, GROUND - 104, '▼', style(18, '#ffd34d')).setOrigin(0.5).setStroke('#1a1030', 4);
    box.add([...rivalViews, me, meMark]);
    const say = this.add.text(W / 2, 22, '花火が 上がったら、旗の 下へ！', { ...style(18), align: 'center' }).setOrigin(0.5, 0).setStroke('#1a1030', 5);
    const score = this.add.text(W / 2, 52, '', style(16, '#ffe9b0')).setOrigin(0.5, 0).setStroke('#1a1030', 5);
    const hint = this.add.text(W / 2, 620, '画面を おさえた 方へ 馬が 走る', style(14, '#ffffff')).setOrigin(0.5).setStroke('#1a1030', 4);
    box.add([say, score, hint]);
    // 画面の下の窓・十字キーへ さわりが抜けないように、上を覆う
    const cover = this.add.rectangle(0, 0, W, 640, 0x000000, 0.001).setOrigin(0).setInteractive();
    box.add(cover);
    const flagViews = new Map();
    const whistled = new Set();
    let forced = null; // 確かめ用（自動の試験が 馬を動かす）
    const showScore = () => score.setText(`のこり ${Math.ceil((ROUND_MS - race.t) / 1000)}　旗 ${race.mine.length}本　${racePts(race)}点`);
    const burst = (x, y, color) => {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const dot = this.add.circle(x, y, 3, i % 2 ? color : 0xfff4c0);
        box.add(dot);
        this.tweens.add({ targets: dot, x: x + Math.cos(a) * 46, y: y + Math.sin(a) * 46, alpha: 0, duration: 700, ease: 'Quad.Out', onComplete: () => dot.destroy() });
      }
    };
    const place = (view, x) => {
      const nx = X(x);
      if (Math.abs(nx - view.x) > 0.5) view.list[0].setFlipX(nx < view.x);
      view.x = nx;
    };
    const tick = () => {
      let move = 0;
      const p = this.input.activePointer;
      if (forced !== null) move = forced;
      else if (this.keys?.left.isDown) move = -1;
      else if (this.keys?.right.isDown) move = 1;
      else if (p.isDown && Math.abs(p.x - X(race.horse)) > 4) move = Math.sign(p.x - X(race.horse));
      for (const f of race.flags) {
        if (f.state === 'wait' && race.t >= f.t0 - 360 && !whistled.has(f.id)) {
          whistled.add(f.id);
          sfx('hanabi');
        }
      }
      const step = stepRace(race, 16, move);
      race = step.race;
      for (const e of step.events) {
        const f = race.flags[e.flag];
        if (e.type === 'launch') {
          const v = this.add.image(X(f.x0), Y(0), 'nomaoi_flag').setTint(FLAGS[f.kind].color).setOrigin(0.1, 1);
          box.add(v);
          box.bringToTop(cover);
          flagViews.set(f.id, v);
          burst(X(f.x0), Y(0), FLAGS[f.kind].color);
        } else {
          const v = flagViews.get(f.id);
          flagViews.delete(f.id);
          if (e.type === 'catch') {
            const to = e.who === 'me' ? me : rivalViews[e.who];
            if (e.who === 'me') sfx(f.kind === 'kin' ? 'win' : 'heal');
            this.tweens.add({ targets: v, x: to.x, y: to.y - 70, alpha: 0, duration: 380, onComplete: () => v.destroy() });
          } else {
            this.tweens.add({ targets: v, y: GROUND + 10, alpha: 0, duration: 400, onComplete: () => v.destroy() });
          }
        }
      }
      for (const [id, v] of flagViews) {
        const f = race.flags[id];
        v.setPosition(X(flagX(f, race.t)), Y(Math.min(1, fallP(f, race.t))));
        v.angle = 12 * Math.sin(race.t / 300 + f.phase);
      }
      place(me, race.horse);
      meMark.x = me.x;
      race.rivals.forEach((x, i) => place(rivalViews[i], x));
      showScore();
      if (race.done) finish();
    };
    let loop = null;
    const finish = () => {
      loop?.remove(false);
      loop = null;
      const pts = racePts(race);
      const n = race.mine.length;
      const kin = race.mine.filter((k) => k === 'kin').length;
      this.setGame(addFlags(this.g, race.mine));
      say.setText('そこまで！');
      sfx(n ? 'win' : 'down');
      this.time.delayedCall(900, () => {
        box.destroy();
        this.busy = false;
        startBgm(this.fieldBgm());
        const lines = [{ text: n ? `神旗を ${n}本 取った！（旗点 +${pts}　いま ${this.g.flagPts}点）` : '神旗は 1本も 取れなかった……' }];
        if (kin) lines.push({ text: `金の 神旗も ${kin}本 あった！` });
        lines.push({ speaker: 'しおり', text: n ? NOMAOI_LINES.after : NOMAOI_LINES.none });
        this.showMessages(lines, () => this.nomaoiMenu());
      });
    };
    showScore();
    // 確かめ用の取っ手（遊ぶ人には見えない）
    this.nomaoi = { race: () => race, hold: (m) => { forced = m; }, x: (v) => X(v), tick };
    this.time.delayedCall(900, () => {
      say.setText('');
      loop = this.time.addEvent({ delay: 16, loop: true, callback: tick });
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
    // 道具の棚（本人 10/3「よろず屋でも採用」＝道具屋と同じく 効き目と持っている数を出す）。鉄砲の玉は猟師がいる時だけ
    const sell = items.filter((id) => ITEMS[id].kind !== 'ammo' || members.includes('kariudo'));
    const shelf = { goods: sell, back: () => this.equipShop(goods, items) };
    const shelfRow = sell.length ? [[sell.every((id) => ITEMS[id].kind === 'ammo') ? '鉄砲の 玉を 買う' : '道具を 買う', () => this.shopMenu(shelf)]] : [];
    if (who) {
      // その人の品：選べば そのまま その人が着ける
      // 右の字＝いまの品と比べて どう変わるか（装備中の品は 灰色で 選べない・下がる物は 赤）
      const opts = forWho(who).map((id) => this.equipOption(id, who, () => this.doBuyEquip(id, who, back), `${EQUIP[id].price}文 `));
      this.showMenu(`${NAMES[who]}の 品（いまと くらべて）所持金 ${this.g.mon}文`, [...opts, ['もどる', () => this.equipShop(goods, items)]]);
      return;
    }
    if (all.length + shelfRow.length > 5) {
      const people = members.filter((w) => forWho(w).length).map((w) => [`${NAMES[w]}の 得物`, () => this.equipShop(goods, items, w)]);
      this.showMenu(`だれの 品を 見る？（所持金 ${this.g.mon}文）`, [...people, ...shelfRow, ['やめる', () => this.closeDialog()]]);
      return;
    }
    // 人を選ぶ前は 品の強さ（＋を付けない＝「上がる・下がる」と取り違えない）。人を選ぶと いまと比べた変わり方（pickWho）
    const opts = all.map((id) => [EQUIP[id].name, () => this.pickWho(id, back), `${EQUIP[id].price}文 ${equipNote(id).replaceAll('+', '')}`]);
    this.showMenu(`何を 買う？（右は 品の強さ・所持金 ${this.g.mon}文）`, [...opts, ...shelfRow, ['やめる', () => this.closeDialog()]]);
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
      const [, fn, note, color] = this.equipOption(id, w, () => this.doBuyEquip(id, w, back));
      return [`${NAMES[w]}（今：${now ? EQUIP[now].name : 'なし'}）`, fn, note, color];
    });
    this.showMenu(`${e.name}（${equipNote(id).replaceAll('+', '')}）。だれが 着ける？ 右は いまと くらべて（所持金 ${this.g.mon}文）`, [...opts, ['もどる', back]]);
  }

  // 装備の1行：[名前, 選んだとき, 右の字（いまと比べた変わり方）, 字の色]。装備中は選べない（同じ物を買い直さない）
  equipOption(id, who, onPick, prefix = '') {
    const now = (this.g.equip ?? START_EQUIP)[who]?.[EQUIP[id].slot] ?? null;
    if (id === now) return [EQUIP[id].name, null, '装備中', '#9a9a9a'];
    return [EQUIP[id].name, onPick, `${prefix}${diffNote(id, now)}`, diffDown(id, now) ? '#ff8a7a' : '#ffd34d'];
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
