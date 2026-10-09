// あなたの 男・女（10/7 本人「初めの職業をえらぶで、あなたは男か女を選択できる。しおりは女、仲間①仲間②は選んだ職業(イラスト)より性別が決まる」）
// 画面と 切り離した 計算だけ：あなたの 歩く絵と 顔の 名前を 決める
import { JOBS, JOB_IDS } from '../data/jobs.js?v=347';

export const HERO_SEXES = ['m', 'f'];
export const SEX_NAME = { m: '男', f: '女' };
// 前の 記録（男・女の 無い ころ）は 男＝いままでの 旅の者
export const heroSexOf = (game) => (game?.heroSex === 'f' ? 'f' : 'm');

// 女の あなたの 絵が 届くまで 借りる 女の職業（あなたの 職業が 女なら その絵・ほかは 仲間と かぶらない 女の職業）
function borrowedJob(game, has) {
  const own = game?.jobs?.tabi;
  if (JOBS[own]?.sex === 'f' && has(`job_${own}`)) return own;
  const used = new Set([game?.jobs?.shiori, ...(game?.members ?? []).slice(2)]);
  return JOB_IDS.find((j) => JOBS[j].sex === 'f' && !used.has(j) && has(`job_${j}`)) ?? null;
}

// 歩く絵：男＝tabi／女＝tabi_f（届いて いれば）
export function heroLook(game, extraLooks = []) {
  if (heroSexOf(game) === 'm') return 'tabi';
  const has = (l) => extraLooks.includes(l);
  if (has('tabi_f')) return 'tabi_f';
  const j = borrowedJob(game, has);
  return j ? `job_${j}` : 'tabi';
}

// 顔（そうびを見る など）：男＝tabi／女＝tabi_f（届いて いれば）・無ければ 歩く絵と 同じ 職業の 顔
export function heroFace(game, faceIds = [], extraLooks = []) {
  if (heroSexOf(game) === 'm') return 'tabi';
  if (faceIds.includes('tabi_f')) return 'tabi_f';
  const look = heroLook(game, extraLooks);
  return look.startsWith('job_') && faceIds.includes(look) ? look : 'tabi';
}
