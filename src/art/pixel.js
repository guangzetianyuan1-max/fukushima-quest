// ドット絵を文字の並びで描く。1文字＝1ドット。'.' は透明。

// 左半分の並びを鏡に映して、左右対称の全体を作る
export function mirrorRows(halfRows) {
  return halfRows.map((r) => r + [...r].reverse().join(''));
}

// 並びとパレット（文字→色の数値）からテクスチャを作る。scale はドット1つの大きさ。
export function makePixelTexture(scene, key, rows, palette, scale = 1) {
  const h = rows.length;
  const w = rows[0].length;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      g.fillStyle(palette[ch], 1);
      g.fillRect(x * scale, y * scale, scale, scale);
    });
  });
  g.generateTexture(key, w * scale, h * scale);
  g.destroy();
}
