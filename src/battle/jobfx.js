// 4人の 技の 演出の 段（10/8 本人「4人の必殺技を出すとき、効果音やエフェクトを多用してほしい、強い必殺技ほど派手に」）
// 段＝jobs.js の tier（はじめの技・1章＝1／2章＝2／3章の 奥義＝3／4章 会津＝4）。段ごとに 重ねる 物を ここで 決め、
// BattleScene.playJobFx が この 通りに 描く・音は chip.js の waza1〜4（技ごとの 音 sp.sfx に 重ねる）
// ⛔効き目（傷・回復・術の力）は 変えない＝見せ方だけ
export const JOBFX_COLORS = {
  attack: [255, 236, 190], // 斬る・射る・投げる＝白金
  magic: [150, 175, 255], // 術＝青白
  heal: [140, 255, 170], // 回復・起こす＝若草
  buff: [255, 180, 80], // 舞・法螺貝＝橙
  guard: [255, 222, 110], // 結界・かばう・かわす＝金
  curse: [205, 120, 255], // 封じ・毒・まどわし＝紫
};
export const JOBFX_LOOK = {
  strike: 'attack', hpstrike: 'attack', charge: 'attack', counter: 'attack',
  magic: 'magic', summon: 'magic',
  heal: 'heal', healOne: 'heal', revive: 'heal', cleanse: 'heal', medAll: 'heal', mpall: 'heal',
  buff: 'buff', mistall: 'buff',
  guard: 'guard', cover: 'guard', lifeguard: 'guard', evade: 'guard', decoy: 'guard',
  debuff: 'curse', seal: 'curse', daze: 'curse', bind: 'curse', poison: 'curse',
};
export const JOBFX_LABEL = { 3: '奥義', 4: '秘奥義' };
// 技の 名の 毛筆の 高さ（画面の ドット・段 1〜4）＝強い 技ほど 大きく（10/10 本人「必殺技の強さにより字の大きさが変わる」）・幅は 画面に 収める
export const SKILLNAME_H = { 1: 30, 2: 38, 3: 48, 4: 62 };

// 段 → 重ねる 物。flash＝光る 長さ(ms)・shake＝揺れの 強さ・sparks＝飛び散る 星・rings＝広がる 輪・banner＝技の 名の 帯
// darken＝先に 暗く なる・rays＝回る 光の 筋・afterFlash＝遅れて もう一度 光る・sfx＝重ねる 音・hold＝その 文を 見せる 長さ(ms・自動でも 短く しない)
export function jobFxPlan(tier) {
  const t = Math.min(4, Math.max(1, Math.floor(tier) || 1));
  return {
    tier: t,
    flash: [140, 220, 320, 420][t - 1],
    shake: [0, 0.006, 0.012, 0.02][t - 1],
    sparks: [8, 14, 22, 34][t - 1],
    rings: [0, 1, 2, 3][t - 1],
    banner: t >= 3,
    darken: t >= 4,
    rays: t >= 4 ? 12 : 0,
    afterFlash: t >= 4,
    sfx: [['waza1'], ['waza1', 'waza2'], ['waza2', 'waza3'], ['waza3', 'waza4']][t - 1],
    hold: [0, 0, 1300, 1900][t - 1],
  };
}

// 重ねる 物の 数（試験で「段が 上がるほど 派手」を 数える）
export const jobFxParts = (p) => (p.flash > 0) + (p.shake > 0) + p.sparks + p.rings + (p.banner ? 1 : 0) + (p.darken ? 1 : 0) + p.rays + (p.afterFlash ? 1 : 0) + p.sfx.length;
