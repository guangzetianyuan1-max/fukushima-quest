// 取り忘れた 判子（10/9 本人「相馬の殿様クエスト終わらずに県北に入れた。この画面で忘れたスタンプをアナウンスして欲しい」）
// 次の エリアの 地図へ 入った 時に、それより 前の エリアで まだ 押して いない 判子（温泉・グルメ・お城）を しおりが 言う
// 画面と 切り離した 計算だけ（FieldScene が 地図の口を 通った 時に 呼ぶ）
import { mapRows } from './game.js?v=299';
import { TOWN_OF, TOWNS } from './towns.js?v=299';
import { ONSEN_RALLY, GOURMET_RALLY, CASTLE_RALLY, hasStamp } from './rally.js?v=299';
import { ITEMS } from '../data/items.js?v=299';

// エリア＝歩く 地図（旅の 順）
export const AREA_ORDER = ['field', 'soma', 'kenpoku', 'kenchu', 'aizu', 'minami'];
export const AREA_NAME = { field: 'いわき', soma: '相馬', kenpoku: '県北', kenchu: '県中・県南', aizu: '会津', minami: '南会津' };

// 町 → その町が ある 地図（地図の 字から 引く）
let townArea = null;
export function areaOfTown(town) {
  if (!townArea) {
    townArea = {};
    for (const map of AREA_ORDER) for (const row of mapRows(map)) for (const ch of row) if (TOWN_OF[ch] && !townArea[TOWN_OF[ch]]) townArea[TOWN_OF[ch]] = map;
  }
  return townArea[town] ?? null;
}

// 地図 map に 入った 時：それより 前の エリアの 取り忘れ＝[{ area, text }]（エリアごとに 1行）
export function missedStamps(game, map) {
  const idx = AREA_ORDER.indexOf(map);
  if (idx <= 0) return [];
  const out = [];
  for (const area of AREA_ORDER.slice(0, idx)) {
    const pick = (kind, keys, name) => keys.filter((t) => areaOfTown(t) === area && !hasStamp(game, kind, t)).map(name);
    const castle = pick('castle', Object.keys(CASTLE_RALLY), (t) => CASTLE_RALLY[t].castle);
    const gourmet = pick('gourmet', Object.keys(GOURMET_RALLY), (t) => ITEMS[GOURMET_RALLY[t]]?.name ?? TOWNS[t].name);
    const onsen = pick('onsen', ONSEN_RALLY, (t) => TOWNS[t].name);
    const items = [...(castle.length ? [`お城（${castle.join('、')}）`] : []), ...(gourmet.length ? [`グルメ（${gourmet.join('、')}）`] : []), ...(onsen.length ? [`温泉（${onsen.join('、')}）`] : [])];
    if (items.length) out.push({ area, text: `${AREA_NAME[area]}：${items.join('・')}` });
  }
  return out;
}
