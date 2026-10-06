// コレクション（本人 10/4 夜「コマンド『どうぐ』→『コレクション』を新設定、倒したボスのキャラクターをあつめるように」）
// 元に戻した昔話の主（game.cleared）の 元の姿を、話の順に並べる。まだの主は 影と「？？？」（話数だけ見せる）
// 画面は FieldScene の showCollection（3列×3段＝1ページ9体）
import { EPISODES } from '../data/episodes.js?v=214';

export const PER_PAGE = 9;

export function collection(game) {
  const items = EPISODES.map((ep) => {
    const e = ep.enemy;
    return {
      id: e.id, episode: e.episode, name: e.name, tale: e.tale, place: e.place.replace(/^福島県/, ''),
      img: ep.art.light, hosoku: e.hosoku ?? '', got: !!game?.cleared?.[e.id],
    };
  });
  return { items, got: items.filter((x) => x.got).length, total: items.length, pages: Math.ceil(items.length / PER_PAGE) };
}
