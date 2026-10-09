// コレクション（本人 10/4 夜「コマンド『どうぐ』→『コレクション』を新設定、倒したボスのキャラクターをあつめるように」）
// 元に戻した昔話の主（game.cleared）の 元の姿を、話の順に並べる。まだの主は 影と「？？？」（話数だけ見せる）
// 画面は FieldScene の showCollection（3列×3段＝1ページ9体）
import { EPISODES } from '../data/episodes.js?v=340';

export const PER_PAGE = 9;

// 10/9 本人「南会津のボスキャラを倒すと、コレクション画面がいつもとちがう」＝①お城の お題5枚が 第二十九話と 第三十話の 間に 挟まった
//   （EPISODES の 並びは 試験が 頼るので 動かさない）⇒ 図鑑だけ 話の 順＝本編が 先・お城の お題（enemy.side）は 最後
//   ②終章の 名前だけ 分かち書きの 空白が 入った（「落人の 家来」）⇒ 札の 名前は 空白を 抜く
export const ORDERED = [...EPISODES.filter((ep) => !ep.enemy.side), ...EPISODES.filter((ep) => ep.enemy.side)];

export function collection(game) {
  const items = ORDERED.map((ep) => {
    const e = ep.enemy;
    return {
      id: e.id, episode: e.episode, name: e.name.replace(/[ 　]/g, ''), tale: e.tale, place: e.place.replace(/^福島県/, ''),
      img: ep.art.light, hosoku: e.hosoku ?? '', got: !!game?.cleared?.[e.id],
    };
  });
  return { items, got: items.filter((x) => x.got).length, total: items.length, pages: Math.ceil(items.length / PER_PAGE) };
}
