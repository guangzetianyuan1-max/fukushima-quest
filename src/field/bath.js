// 温泉に つかる 場面（10/8 本人「温泉クエストで、しおりが各温泉のお湯に浸かっているところのイラストが欲しい。温泉を利用する→しおりのイラスト＋ほのぼのした効果音」）
// 画面と 切り離した 計算だけ：どの 温泉か・湯の 色・どの 絵を 使うか
import { ONSEN_RALLY } from './rally.js?v=361';

export const BATH_TOWNS = [...ONSEN_RALLY];
// しおりの ひと言の 声（10/9 夜 本人「しおりの温泉入浴時にナレーションが欲しい『ふう…いいお湯』」・art_src/prep_bath_voice.py・2.8秒）
// ちゃぽん の あと BATH_VOICE_AT 秒で 鳴らす＝場面 5秒の 中で 言い終わる（BATH_SECONDS）
export const BATH_VOICE = 'assets/voice/onsen_fuu.mp3';
export const BATH_VOICE_AT = 1.2;
export const BATH_SECONDS = 5;
// 地図の 上の 湯（猫啼は 3章の 地図の n から も 入れる）＝町の id へ
const PLACE_TOWN = { 猫啼: 'nekonakiyu' };
export const bathTown = (mapId, place) => (BATH_TOWNS.includes(mapId) ? mapId : PLACE_TOWN[place] ?? null);

// 絵：その 温泉で 湯に つかる しおりの 絵（bath_<町>・Gemini）→ 無ければ 町の 一枚絵 → 無ければ 図形（null）
export function bathBg(town, has) {
  if (town && has(`bath_${town}`)) return { key: `bath_${town}`, own: true };
  if (town && has(`card_town_${town}`)) return { key: `card_town_${town}`, own: false };
  return null;
}
