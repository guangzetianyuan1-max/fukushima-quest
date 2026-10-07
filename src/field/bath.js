// 温泉に つかる 場面（10/8 本人「温泉クエストで、しおりが各温泉のお湯に浸かっているところのイラストが欲しい。温泉を利用する→しおりのイラスト＋ほのぼのした効果音」）
// 画面と 切り離した 計算だけ：どの 温泉か・湯の 色・どの 絵を 使うか
import { ONSEN_RALLY } from './rally.js?v=266';

export const BATH_TOWNS = [...ONSEN_RALLY];
// 地図の 上の 湯（猫啼は 3章の 地図の n から も 入れる）＝町の id へ
const PLACE_TOWN = { 猫啼: 'nekonakiyu' };
export const bathTown = (mapId, place) => (BATH_TOWNS.includes(mapId) ? mapId : PLACE_TOWN[place] ?? null);

// 絵：その 温泉で 湯に つかる しおりの 絵（bath_<町>・Gemini）→ 無ければ 町の 一枚絵 → 無ければ 図形（null）
export function bathBg(town, has) {
  if (town && has(`bath_${town}`)) return { key: `bath_${town}`, own: true };
  if (town && has(`card_town_${town}`)) return { key: `card_town_${town}`, own: false };
  return null;
}
