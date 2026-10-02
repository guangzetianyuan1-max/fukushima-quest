// どうぐ → ちずを見る：いまいる所を、巻物の地図（assets/cards/map.png・340×609・福島県全体）の上の点に置き換える
// 本人 10/3「地図をみる 現在地を矢印で表示して欲しい」
// 歩く地図（いわき・40×50マス）は、巻物の地図の右下の海ぞい（北の端＝好間・閼伽井嶽 y≈400 〜 南の端＝勿来 y≈545）
// 海岸線は巻物の絵で測った（y ごとの海岸の x）。歩く地図の海岸は x=31 の列
const NORTH_Y = 400;
const SOUTH_Y = 545;
const ROWS = 50;
const COAST_COL = 31;
const COAST = [[400, 272], [440, 270], [480, 265], [500, 252], [520, 237], [545, 228]];
const CELL = (SOUTH_Y - NORTH_Y) / (ROWS - 1); // 1マス ≈ 3ドット

function coastX(py) {
  if (py <= COAST[0][0]) return COAST[0][1];
  for (let i = 1; i < COAST.length; i++) {
    const [y0, x0] = COAST[i - 1];
    const [y1, x1] = COAST[i];
    if (py <= y1) return x0 + (x1 - x0) * (py - y0) / (y1 - y0);
  }
  return COAST.at(-1)[1];
}

// 歩く地図の (x, y) → 巻物の地図の上の点（絵の左上が 0,0）。町の中にいるときは、町の入口（fieldPos）
export function mapPointOf(game) {
  const p = game.pos.map === 'field' ? game.pos : game.fieldPos ?? game.pos;
  const py = NORTH_Y + p.y * CELL;
  const px = coastX(py) - (COAST_COL - p.x) * CELL;
  return { x: Math.round(px), y: Math.round(py) };
}
