// 町の 店の 看板（10/7 本人「町や城の店に看板が欲しい『武器』『よろず屋』『宿』『温泉』など」）
// 画面と 切り離した 計算だけ：店の人の 置き場（spot）→ 看板の 字と、看板を 掛ける マス（建物の 入口の 上・無ければ 人の 頭の 上）
import { EQUIP } from '../data/equip.js?v=296';

export const SIGN_OF = {
  katana: '武器', gusoku: '防具', dougu: 'よろず屋', shop: 'よろず屋', yado: '宿', bandai: '温泉',
  shrine: '神社', temple: '寺', kashi: '菓子', chaya: '茶屋', bansho: '番屋', fishing: '釣り',
};

// 建物が 無ければ 看板を 出さない 置き場（10/8）
export const NEED_BUILDING = ['chaya'];

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
    // 10/9 本人「武器、防具屋の表記方法をチェック」＝武器も 防具も 売る 刀屋（檜枝岐・田島・只見・小高）は「武器・防具」
    const both = n.role === 'equip' && ['weapon', 'armor'].every((s) => (n.goods ?? []).some((id) => EQUIP[id]?.slot === s));
    const text = both ? '武器・防具' : SIGN_OF[n.spot];
    if (!text || n.role === 'master' || n.guide) continue;
    const b = buildingOf(t.props, n);
    if (!b && NEED_BUILDING.includes(n.spot)) continue; // 10/8 本人「『茶屋』は無い」＝温泉地の 茶屋の 人は 立っているだけ（建物が 無い）＝看板を 出さない
    // ⭐10/7 本人「文字を頭ひとつ上に。人物に被ります」＝人の 頭（1マス）より 上＝入口の 行の 2つ上の 行の 下の 辺
    if (b) out.push({ text, x: b.x + b.w / 2, y: b.y + b.h - 2, spot: n.spot });
    else out.push({ text, x: n.x + 0.5, y: n.y - 1, spot: n.spot }); // 建物が 無い＝人の 頭の さらに 上
  }
  return out;
}
