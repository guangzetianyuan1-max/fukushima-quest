// 巻物に毛筆で縦書きした題「第一話 ﹁龍燈﹂」（本人 10/1「ドット文字で無いほうが良い。習字で背景巻物」）
// 上下に軸（こげ茶・金の端）、間に和紙。右から読む縦書きを1列で：話数 → かぎ括弧 → 話の名 → かぎ括弧
import { GAME_FONT, TITLE_WEIGHT } from './fonts.js?v=283';
const BRUSH = GAME_FONT; // 10/4 夜 ドットのゴシックへ（前＝毛筆の Yuji Boku）
const INK = 0x1a1008;
const PAPER = 0xf1e4c0;
const PAPER_EDGE = 0xd9c493;
const ROLLER = 0x5a3416;
const ROLLER_END = 0xc9a24a;

// 巻物の形を先に決める（描かない・試験できる）。cols＝話の名を何列に折り返すか（右の列から読む）
// 本人 10/4「題名が長いと、しおりの顔が隠れる」＝長い題名は 2列に折り返し、止めたい高さに収める（fitScroll）
export function scrollLayout(top, { episode, tale, epSize, taleSize, cols = 1 }) {
  const colStep = Math.round(taleSize * 1.25);
  const colW = Math.round(taleSize * 1.6) + (cols - 1) * colStep;
  const roller = Math.round(taleSize * 0.28) + 4;
  const epStep = epSize * 1.15;
  const taleStep = taleSize * 1.08;
  const bracket = { w: taleSize * 0.55, h: taleSize * 0.3 };
  const chars = [...tale];
  const per = Math.ceil(chars.length / cols);
  const parts = Array.from({ length: cols }, (_, i) => chars.slice(i * per, (i + 1) * per)).filter((x) => x.length);
  let y = top + roller + epSize * 0.6;
  const epY = [...episode].map((_, i) => y + i * epStep);
  y += episode.length * epStep + epSize * 0.5;
  const openY = y; // ﹁ の横線（右の列）
  y += bracket.h + taleSize * 0.12;
  const taleTop = y;
  const ends = parts.map((pt) => taleTop + pt.length * taleStep + taleSize * 0.05);
  const closeY = ends[ends.length - 1] + bracket.h; // ﹂ の横線（左の列）
  const bottom = Math.max(closeY, ...ends) + taleSize * 0.45 + roller;
  return { colStep, colW, roller, epStep, taleStep, bracket, parts, epY, openY, taleTop, closeY, bottom, cols: parts.length };
}

// 巻物の下の端が maxBottom を越えない字の大きさ（と列の数）を選ぶ。1列で 18 まで小さくして収まらなければ 2列
export function fitScroll(top, maxBottom, { episode, tale, epSize, taleSize }) {
  for (const cols of [1, 2]) {
    for (let t = taleSize; t >= (cols === 1 ? 18 : 14); t -= 1) {
      const e = Math.max(11, Math.round((epSize * t) / taleSize));
      const L = scrollLayout(top, { episode, tale, epSize: e, taleSize: t, cols });
      if (L.bottom <= maxBottom) return { episode, tale, epSize: e, taleSize: t, cols };
    }
  }
  return { episode, tale, epSize: 11, taleSize: 14, cols: 2 };
}

// cx＝巻物の真ん中の x、top＝上の軸の上端。epSize／taleSize＝話数と話の名の字の大きさ・cols＝話の名の列の数
export function drawScroll(scene, cx, top, opts) {
  const { episode, epSize, taleSize } = opts;
  const L = scrollLayout(top, opts);
  const { colW, roller, bracket, bottom } = L;
  const colX = (i) => cx + ((L.cols - 1) / 2 - i) * L.colStep; // i＝0 が右の列
  const rightX = colX(0);
  const leftX = colX(L.cols - 1);

  const g = scene.add.graphics();
  // 和紙
  g.fillStyle(PAPER, 0.97);
  g.fillRect(cx - colW / 2, top + roller / 2, colW, bottom - top - roller);
  g.fillStyle(PAPER_EDGE, 1);
  g.fillRect(cx - colW / 2, top + roller / 2, 2, bottom - top - roller);
  g.fillRect(cx + colW / 2 - 2, top + roller / 2, 2, bottom - top - roller);
  // 上下の軸
  for (const ry of [top, bottom - roller]) {
    g.fillStyle(ROLLER, 1);
    g.fillRoundedRect(cx - colW / 2 - 6, ry, colW + 12, roller, 3);
    g.fillStyle(ROLLER_END, 1);
    g.fillRect(cx - colW / 2 - 6, ry, 4, roller);
    g.fillRect(cx + colW / 2 + 2, ry, 4, roller);
  }
  // かぎ括弧（縦書きの﹁﹂を線で描く）＝﹁は右の列の頭・﹂は左の列の終わり
  g.lineStyle(Math.max(2, taleSize / 14), INK, 1);
  g.beginPath();
  g.moveTo(rightX - bracket.w / 2, L.openY);
  g.lineTo(rightX + bracket.w / 2, L.openY);
  g.lineTo(rightX + bracket.w / 2, L.openY + bracket.h);
  g.moveTo(leftX - bracket.w / 2, L.closeY - bracket.h);
  g.lineTo(leftX - bracket.w / 2, L.closeY);
  g.lineTo(leftX + bracket.w / 2, L.closeY);
  g.strokePath();

  const brush = (size) => ({ fontFamily: BRUSH, fontStyle: TITLE_WEIGHT, fontSize: `${size}px`, color: '#1a1008', resolution: 3 });
  [...episode].forEach((c, i) => smooth(scene.add.text(rightX, L.epY[i], c, brush(epSize)).setOrigin(0.5, 0)));
  L.parts.forEach((pt, ci) => pt.forEach((c, i) => smooth(scene.add.text(colX(ci), L.taleTop + i * L.taleStep, c, brush(taleSize)).setOrigin(0.5, 0))));
  return { bottom, width: colW + 12 };
}

export const BRUSH_FONT = BRUSH;

// 前は毛筆の字だけ縁をなめらかにしていた。10/4 夜 全部ドットのゴシックにした＝ほかの字と同じ角ばった縁のまま（呼ぶ所はそのまま残す）
export function smooth(text) {
  return text;
}
