// 和風の窓とボタン（Gemini の部品表・art_src/prep_ui.py が assets/ui/ に出す）
// 本人 10/2「デザインをもっと上げたい」「ボタンは押されたら、凹ませたい」
// ・窓＝四隅の飾りはそのまま、辺と中だけを伸ばす（9つに分けて並べる。NineSlice は WebGL だけなので使わない）
// ・丸いボタン＝押すと凹んだ絵に替わり2ドット沈む。離す・指が外れると戻る
// ・十字キー＝押したキーだけ凹む。当たりはキーより広め（親指で外さない）
import { GAME_FONT } from './fonts.js?v=274';
import { KEY_POS } from './kit_layout.js?v=274';

export const BTN_COLORS = ['orange', 'purple', 'red', 'green', 'blue', 'gray']; // gray＝戦いの「戻る」（art_src/make_btn_gray.py）
const DIRS = ['up', 'down', 'left', 'right'];
const FONT = GAME_FONT; // ui/fonts.js

// 押せる 見えない 当たり（10/7 本人「とじるのボタンが押せない」）：Zone は 描かれない＝Phaser が 指の 当たりの 上下を
// 「その画面で 描いた 順」で 決めるとき いつも 一番下に 回り、押せる印の 背景（画面いっぱいの 四角）に 負けた。
// ほぼ透明の 四角は 描かれる＝置いた 順に 上へ 並ぶ。Zone と 同じく 真ん中が 原点
export const hitBox = (scene, x, y, w, h) => scene.add.rectangle(x, y, w, h, 0x000000, 0.001);

export function preloadKit(scene) {
  const names = ['window', 'tab', 'bar', 'pad',
    ...BTN_COLORS.flatMap((c) => [`btn_${c}`, `btn_${c}_down`]),
    ...DIRS.flatMap((d) => [`key_${d}`, `key_${d}_down`])];
  for (const n of names) if (!scene.textures.exists(`ui_${n}`)) scene.load.image(`ui_${n}`, `assets/ui/${n}.png`);
}

// 絵を9つに分けたコマ（s0〜s8）を、1度だけ作る
function slice(scene, key, c) {
  const tex = scene.textures.get(key);
  if (tex.has('s0')) return;
  const img = tex.getSourceImage();
  const xs = [0, c, img.width - c, img.width];
  const ys = [0, c, img.height - c, img.height];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) tex.add(`s${j * 3 + i}`, 0, xs[i], ys[j], xs[i + 1] - xs[i], ys[j + 1] - ys[j]);
}

// 伸び縮みする枠（左上 x,y・幅 w・高さ h・角の大きさ c）
export function makeFrame(scene, key, x, y, w, h, c) {
  slice(scene, key, c);
  const box = scene.add.container(x, y);
  const xs = [0, c, w - c];
  const ws = [c, w - 2 * c, c];
  const ys = [0, c, h - c];
  const hs = [c, h - 2 * c, c];
  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 3; i++) {
      box.add(scene.add.image(xs[i], ys[j], key, `s${j * 3 + i}`).setOrigin(0).setDisplaySize(ws[i], hs[j]));
    }
  }
  return box;
}

export const makeWindow = (scene, x, y, w, h) => makeFrame(scene, 'ui_window', x, y, w, h, 16);

// 丸いボタン（中心 x,y）。label はボタンの下に出す（below=false なら ボタンの上に重ねる）
export function makeButton(scene, x, y, color, label, onPress, { size = 62, fontSize = 16, below = true } = {}) {
  const box = scene.add.container(x, y);
  const face = scene.add.container(0, 0);
  const img = scene.add.image(0, 0, `ui_btn_${color}`).setDisplaySize(size, size);
  face.add(img);
  if (label && !below) {
    face.add(scene.add.text(0, 0, label, {
      fontFamily: FONT, fontSize: `${fontSize}px`, color: '#ffffff', resolution: 3, stroke: '#1a1030', strokeThickness: 4,
    }).setOrigin(0.5));
  }
  box.add(face);
  if (label && below) {
    box.add(scene.add.text(0, size / 2 + 4, label, {
      fontFamily: FONT, fontSize: `${fontSize}px`, color: '#ffffff', resolution: 3,
    }).setOrigin(0.5, 0));
  }
  const up = () => { img.setTexture(`ui_btn_${color}`); face.y = 0; };
  img.setInteractive(new Phaser.Geom.Circle(img.width / 2, img.height / 2, img.width / 2), Phaser.Geom.Circle.Contains);
  img.input.cursor = 'pointer';
  // 押すと凹み、離したときに そのボタンの上なら決まる（本人 10/4「他のコマンドを押してしまう」＝指がずれて離れたら取り消し）
  let pressed = false;
  img.on('pointerdown', () => {
    img.setTexture(`ui_btn_${color}_down`);
    face.y = 2; // 凹む
    pressed = true;
  });
  img.on('pointerup', () => {
    const go = pressed;
    pressed = false;
    up();
    if (go) onPress?.();
  });
  img.on('pointerout', () => { pressed = false; up(); });
  scene.input.on('pointerup', () => { pressed = false; up(); });
  return box;
}

// 十字キー（中心 cx,cy・倍率 scale）。onDir(向き) を押した時に、onDir(null) を離した時に呼ぶ
export function makePad(scene, cx, cy, onDir, scale = 1) {
  const box = scene.add.container(cx, cy);
  const base = scene.add.image(0, 0, 'ui_pad').setScale(scale);
  box.add(base);
  const left = -base.displayWidth / 2;
  const top = -base.displayHeight / 2;
  const downs = {};
  for (const d of DIRS) {
    const [kx, ky] = KEY_POS[d];
    const img = scene.add.image(left + kx * scale, top + ky * scale, `ui_key_${d}_down`).setOrigin(0).setScale(scale).setVisible(false);
    downs[d] = img;
    box.add(img);
    // 当たり：キーの1.6倍の四角（キーの中心に合わせる）
    const keyImg = scene.textures.get(`ui_key_${d}`).getSourceImage();
    const kw = keyImg.width * scale * 1.6;
    const kh = keyImg.height * scale * 1.6;
    const hit = hitBox(scene, left + (kx + keyImg.width / 2) * scale, top + (ky + keyImg.height / 2) * scale, kw, kh).setInteractive();
    hit.on('pointerdown', () => { downs[d].setVisible(true); onDir(d); });
    const release = () => { downs[d].setVisible(false); onDir(null); };
    hit.on('pointerup', release);
    hit.on('pointerout', release);
    box.add(hit);
  }
  scene.input.on('pointerup', () => { for (const d of DIRS) downs[d].setVisible(false); });
  return box;
}

// 窓に収まらない文を、ページに分ける（区切りは文の中の空白＝言葉の切れ目。本人 10/2「下の会話の文字がはみ出る。枠内に収めて」）
// ⛔字を小さくして収める手は、顔ありの長い文で15ドットでもはみ出した
export function paginate(textObj, text, maxY) {
  // 10/6 本人「文字が画面からはみ出る」＝半角の空白でしか 区切らなかった（「技：…・…・…」や 改行だけの 文は 1ページに 入りきらず 窓の 下へ）
  const segs = text.split(/(?<=[ 　\n・、。])/);
  const over = (s) => { textObj.setText(s); return textObj.y + textObj.height > maxY; };
  const pages = [];
  let cur = '';
  const push = () => { const p = cur.replace(/^\n+/, '').trimEnd(); if (p) pages.push(p); cur = ''; };
  for (const s of segs) {
    if (!over(cur + s)) { cur += s; continue; }
    if (cur) push();
    if (!over(s)) { cur = s; continue; }
    for (const ch of s) { // 1語だけで 窓を越える＝1字ずつ
      if (cur && over(cur + ch)) push();
      cur += ch;
    }
  }
  push();
  textObj.setText(pages[0] ?? '');
  return pages.length ? pages : [''];
}

// 顔絵の 下の 名前を 顔の 幅（maxW）に 収める（10/6 本人「そうびを見るで重なり」＝「あいうえ（武士）　Lv 20」が 本文と 画面の 左の 外まで はみ出した）
// 字を 小さく → それでも 入らなければ「（」か 全角の空白の 前で 2行に
export function fitSpeaker(t, maxW = 104, size = 20, min = 13) {
  const raw = t.text.replace(/\n/g, '');
  const tryFit = (txt) => {
    t.setText(txt);
    for (let fs = size; fs >= min; fs--) {
      t.setFontSize(fs);
      if (t.width <= maxW) return true;
    }
    return false;
  };
  if (tryFit(raw)) return;
  const i = raw.search(/[（　]/);
  if (i > 0 && tryFit(`${raw.slice(0, i)}\n${raw.slice(i).trim()}`)) return;
  t.setFontSize(min);
}
