// 巻物に毛筆で縦書きした題「第一話 ﹁龍燈﹂」（本人 10/1「ドット文字で無いほうが良い。習字で背景巻物」）
// 上下に軸（こげ茶・金の端）、間に和紙。右から読む縦書きを1列で：話数 → かぎ括弧 → 話の名 → かぎ括弧
const BRUSH = '"Yuji Boku", "Hiragino Mincho ProN", "Yu Mincho", serif';
const INK = 0x1a1008;
const PAPER = 0xf1e4c0;
const PAPER_EDGE = 0xd9c493;
const ROLLER = 0x5a3416;
const ROLLER_END = 0xc9a24a;

// cx＝巻物の真ん中の x、top＝上の軸の上端。epSize／taleSize＝話数と話の名の字の大きさ
export function drawScroll(scene, cx, top, { episode, tale, epSize, taleSize }) {
  const colW = Math.round(taleSize * 1.6);
  const roller = Math.round(taleSize * 0.28) + 4;
  const epStep = epSize * 1.15;
  const taleStep = taleSize * 1.08;
  const bracket = { w: taleSize * 0.55, h: taleSize * 0.3 };

  // 先に位置を決めてから描く（紙の長さを字に合わせるため）
  let y = top + roller + epSize * 0.6;
  const epY = [...episode].map((_, i) => y + i * epStep);
  y += episode.length * epStep + epSize * 0.5;
  const openY = y; // ﹁ の横線
  y += bracket.h + taleSize * 0.12;
  const taleY = [...tale].map((_, i) => y + i * taleStep);
  y += tale.length * taleStep + taleSize * 0.05;
  const closeY = y + bracket.h; // ﹂ の横線
  const bottom = closeY + taleSize * 0.45 + roller;

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
  // かぎ括弧（縦書きの﹁﹂を線で描く）
  g.lineStyle(Math.max(2, taleSize / 14), INK, 1);
  g.beginPath();
  g.moveTo(cx - bracket.w / 2, openY);
  g.lineTo(cx + bracket.w / 2, openY);
  g.lineTo(cx + bracket.w / 2, openY + bracket.h);
  g.moveTo(cx - bracket.w / 2, closeY - bracket.h);
  g.lineTo(cx - bracket.w / 2, closeY);
  g.lineTo(cx + bracket.w / 2, closeY);
  g.strokePath();

  const brush = (size) => ({ fontFamily: BRUSH, fontSize: `${size}px`, color: '#1a1008', resolution: 3 });
  [...episode].forEach((c, i) => smooth(scene.add.text(cx, epY[i], c, brush(epSize)).setOrigin(0.5, 0)));
  [...tale].forEach((c, i) => smooth(scene.add.text(cx, taleY[i], c, brush(taleSize)).setOrigin(0.5, 0)));
  return { bottom, width: colW + 12 };
}

export const BRUSH_FONT = BRUSH;

// 毛筆の字はドット絵と違って、縁をなめらかに見せる（ゲーム全体は pixelArt＝角ばった縁）
export function smooth(text) {
  text.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return text;
}
