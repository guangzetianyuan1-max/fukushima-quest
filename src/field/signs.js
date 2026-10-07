// 町の 店の 看板（10/7 本人「町や城の店に看板が欲しい『武器』『よろず屋』『宿』『温泉』など」）
// 画面と 切り離した 計算だけ：店の人の 置き場（spot）→ 看板の 字と、看板を 掛ける マス（建物の 入口の 上・無ければ 人の 頭の 上）
export const SIGN_OF = {
  katana: '武器', gusoku: '防具', dougu: 'よろず屋', shop: 'よろず屋', yado: '宿', bandai: '温泉',
  shrine: '神社', temple: '寺', kashi: '菓子', chaya: '茶屋', bansho: '番屋', fishing: '釣り',
};

// 店の人 n を 含む（または 左右・上で となる）建物
function buildingOf(props, n) {
  const inside = (p, x, y) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h;
  const big = (props ?? []).filter((p) => p.w >= 2 && p.h >= 2);
  return big.find((p) => inside(p, n.x, n.y))
    ?? big.find((p) => inside(p, n.x, n.y - 1))
    ?? big.find((p) => inside(p, n.x - 1, n.y) || inside(p, n.x + 1, n.y));
}

// 町 t の 看板＝[{ text, x, y }]（x は マスの 真ん中を 小数で・y は 看板の 下の 辺の 行）
export function townSigns(t) {
  if (!t || t.inside) return [];
  const out = [];
  for (const n of t.npcs ?? []) {
    const text = SIGN_OF[n.spot];
    if (!text || n.role === 'master' || n.guide) continue;
    const b = buildingOf(t.props, n);
    // 建物の 入口の 上（入口の 行の 1つ上の 行の 下の 辺）＝建物の 横幅の 真ん中
    if (b) out.push({ text, x: b.x + b.w / 2, y: b.y + b.h - 1, spot: n.spot });
    else out.push({ text, x: n.x + 0.5, y: n.y, spot: n.spot }); // 建物が 無い＝人の 頭の 上
  }
  return out;
}
