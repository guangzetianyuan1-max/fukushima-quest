// 装備の 段で 歩く 姿を 着替える（10/9 夜 本人「買った装備、武器と防具を歩いている姿に身に着けることは可能でしょうか？」→ 案A）
// 画面と 切り離した 計算だけ：着けている 防具の 段から 歩く 絵の 段を 決める（武器は 10/6 から 手もとに 重ねて いる＝FieldScene の EMPTY_HANDS）
// 段の 絵＝`<見た目>_2`（中ごろ）・`<見た目>_3`（終わり）。絵の 無い 段は 1つ 前の 段（無ければ 今の 絵）
import { EQUIP } from '../data/equip.js?v=346';

// 防具の 段 なし〜2＝はじめ（1）／3〜5＝中ごろ（2）／6〜8＝終わり（3）。職業の 無い 防具（蓑・陣羽織）は はじめ
export const STAGE_FROM_TIER = [[6, 3], [3, 2]];
export function gearStage(game, id) {
  const a = EQUIP[game?.equip?.[id]?.armor];
  const t = a?.job ? a.tier ?? 0 : 0;
  return STAGE_FROM_TIER.find(([from]) => t >= from)?.[1] ?? 1;
}
export function stagedLook(base, stage, looks) {
  for (let s = stage; s >= 2; s--) if (looks.includes(`${base}_${s}`)) return `${base}_${s}`;
  return base;
}
// 段の 絵から 元の 見た目へ（手ぶらの 絵か を 見る ため）
export const baseLook = (look) => look.replace(/_[23]$/, '');
