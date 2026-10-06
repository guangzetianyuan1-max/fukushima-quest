// どうぐ → ちずを見る：いまいる所を、巻物の地図（assets/cards/map.png・340×609・福島県全体）の上の点に置き換える
// 本人 10/3「地図をみる 現在地を矢印で表示して欲しい」
// 歩く地図（40×50マス・海岸は x=31 の列）を、巻物の地図の海ぞいの帯に置く。海岸線は巻物の絵で測った（y ごとの海岸の x）
//   いわき（field）＝右下（北の端 好間・閼伽井嶽 y≈400 〜 南の端 勿来 y≈545）
//   相馬（soma・10/3 1章）＝右上（北の端 新地 y≈65 〜 南の端 小高 y≈235。中村城の絵は y≈125）
const ROWS = 50;
const COAST_COL = { field: 31, soma: 27 }; // 相馬は10/4に東の空きを詰めて海岸が x=27
const AREA = {
  field: { north: 400, south: 545, coast: [[400, 272], [440, 270], [480, 265], [500, 252], [520, 237], [545, 228]] },
  soma: { north: 65, south: 235, coast: [[65, 270], [100, 266], [140, 270], [160, 278], [200, 282], [235, 280]] },
  // 県北（kenpoku・10/4 2章）＝海の無い内陸。猪苗代湖の北東・阿武隈高地の西の谷（福島〜二本松）を箱で置く（36×50 → x150〜215・y95〜250）
  kenpoku: { box: [150, 95, 215, 250], w: 36, h: 50 },
  // 県中・県南（kenchu・10/4 3章）＝県北の南。阿武隈高地の西の谷を 郡山〜白河へ下る（40×58 → x125〜225・y255〜470）
  kenchu: { box: [125, 255, 225, 470], w: 40, h: 58 },
  // 会津（aizu・10/6 4章）＝西の盆地。猪苗代湖（地図の x27〜37・y18〜30）が 絵の 湖に 重なる 箱（46×62 → x35〜165・y140〜480）
  aizu: { box: [35, 140, 165, 480], w: 46, h: 62 },
};

function coastX(coast, py) {
  if (py <= coast[0][0]) return coast[0][1];
  for (let i = 1; i < coast.length; i++) {
    const [y0, x0] = coast[i - 1];
    const [y1, x1] = coast[i];
    if (py <= y1) return x0 + (x1 - x0) * (py - y0) / (y1 - y0);
  }
  return coast.at(-1)[1];
}

// 歩く地図の (x, y) → 巻物の地図の上の点（絵の左上が 0,0）。町の中にいるときは、町の入口（fieldPos・fieldMap）
export function mapPointOf(game) {
  const inField = Object.hasOwn(AREA, game.pos.map);
  const map = inField ? game.pos.map : game.fieldMap ?? 'field';
  const p = inField ? game.pos : game.fieldPos ?? game.pos;
  const a = AREA[map];
  if (a.box) {
    const [x0, y0, x1, y1] = a.box;
    return { x: Math.round(x0 + (x1 - x0) * p.x / (a.w - 1)), y: Math.round(y0 + (y1 - y0) * p.y / (a.h - 1)) };
  }
  const cell = (a.south - a.north) / (ROWS - 1);
  const py = a.north + p.y * cell;
  const px = coastX(a.coast, py) - (COAST_COL[map] - p.x) * cell;
  return { x: Math.round(px), y: Math.round(py) };
}
