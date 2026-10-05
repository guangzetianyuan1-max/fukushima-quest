// 名所の名前（本人 10/4「お城や地域、名所にドットの立て看板が欲しい。相馬城や三春桜など」→ 10/5 板は消して 字だけ）
// 絵＝assets/tiles/o_kanban_<種類>.png（art_src/prep_kanban.py・板は無地）。名前は地図の上に毛筆の字で重ね、看板に向いて「はなす」と短い説明
// 置き場＝目印（町・地図の口の字、または座標）の隣の草地（.）を、左→右→左下→右下→下→左上→右上→上 の順に探す
// 説明は確かめた事だけ（10/4 ネットで確かめた：中村城跡に相馬中村神社／小高城は相馬氏の約280年の居城・1611年に中村へ／磐城平城＝平藩／鵜ノ尾埼灯台＝松川浦の岬／霞ヶ城公園＝石垣・さくら名所100選）。三春の滝桜は 3章の地図ができたら足す
import { IWAKI_ROWS } from './iwaki_map.js?v=181';
import { SOMA_ROWS } from './soma_map.js?v=181';
import { KENPOKU_ROWS } from './kenpoku_map.js?v=181';
import { KENCHU_ROWS } from './kenchu_map.js?v=181';

const ROWS = { field: IWAKI_ROWS, soma: SOMA_ROWS, kenpoku: KENPOKU_ROWS, kenchu: KENCHU_ROWS };
export const KANBAN_KINDS = ['shiro', 'meisho', 'hana', 'michi'];

// near＝目印の字（地図に1つだけの字）／at＝目印の座標（灯台など）
export const KANBAN_DEFS = [
  // 温泉地（10/5 夜 本人「温泉マークの上に『土湯温泉』など明記」）
  { map: 'kenpoku', near: 'e', kind: 'meisho', name: '飯坂温泉', lines: ['福島の 北の 湯の町。奥州三名湯の ひとつと 伝わる。'] },
  { map: 'kenpoku', near: 'f', kind: 'meisho', name: '高湯温泉', lines: ['吾妻山の ふもとの 硫黄の 湯。'] },
  { map: 'kenpoku', near: 'j', kind: 'meisho', name: '土湯温泉', lines: ['こけしの 里の 湯の町。'] },
  { map: 'kenpoku', near: 'l', kind: 'meisho', name: '岳温泉', lines: ['安達太良山の ふもとの 湯の町。'] },
  { map: 'kenchu', near: 'c', kind: 'meisho', name: '磐梯熱海温泉', lines: ['郡山の 西の 湯の町。'] },
  { map: 'kenchu', near: 'x', kind: 'meisho', name: '母畑温泉', lines: ['石川の 湯の町。'] },
  { map: 'kenchu', near: 'u', kind: 'meisho', name: '猫啼温泉', lines: ['和泉式部の 猫が 元気を 取りもどした 湯と 伝わる。'] },
  { map: 'kenchu', near: 'y', kind: 'meisho', name: '二岐温泉', lines: ['二岐山の ふもとの 山の湯。'] },
  { map: 'kenchu', near: 'i', kind: 'meisho', name: '甲子温泉', lines: ['阿武隈川の 源の 近くの 山の湯。'] },
  // 序章 いわき
  { map: 'field', near: 'H', kind: 'shiro', name: '磐城平城跡', lines: ['江戸時代、平藩の 城が あった所。'] },
  { map: 'field', near: 'Y', kind: 'meisho', name: 'いわき湯本温泉', lines: ['古くから 知られた 湯の町。'] },
  { map: 'field', near: 'O', kind: 'meisho', name: '小名浜港', lines: ['いわきの 漁と 船の 港。'] },
  { map: 'field', at: [31, 26], kind: 'meisho', name: '塩屋埼灯台', lines: ['いわきの 岬に 立つ 白い 灯台。'] },
  { map: 'field', near: 'E', kind: 'michi', name: 'この先 相馬', lines: ['北へ 行けば 相馬の 里。'] },
  // 1章 相馬
  { map: 'soma', near: 'M', kind: 'shiro', name: '相馬中村城跡', lines: ['相馬氏の 城が あった所。いまは 相馬中村神社が まつられている。'] },
  { map: 'soma', near: 'Q', kind: 'shiro', name: '小高城跡', lines: ['相馬氏が 中村城へ 移るまで、およそ 280年 城を 置いた所。'] },
  { map: 'soma', at: [27, 4], kind: 'meisho', name: '鵜ノ尾埼灯台', lines: ['相馬の 松川浦の 入口の 岬に 立つ 灯台。'] },
  { map: 'soma', near: 'E', kind: 'michi', name: 'この先 いわき', lines: ['南へ 行けば いわきの 里。'] },
  { map: 'soma', near: 'X', kind: 'michi', name: 'この先 県北', lines: ['西へ 山を こえれば 福島・二本松。'] },
  // 2章 県北
  { map: 'kenpoku', near: 'U', kind: 'meisho', name: '信夫山', lines: ['福島の 町の なかに ある 山。'] },
  { map: 'kenpoku', near: 'W', kind: 'shiro', name: '二本松城跡（霞ヶ城）', lines: ['石垣の 残る 城あと。いまは 霞ヶ城公園。', '春は 桜の 名所。'] },
  { map: 'kenpoku', near: 'X', kind: 'michi', name: 'この先 相馬', lines: ['東へ 山を こえれば 相馬の 里。'] },
  { map: 'kenpoku', near: 'I', kind: 'michi', name: 'この先 郡山', lines: ['南へ 行けば 郡山・須賀川・白河。'] },
  // 3章 県中・県南（10/4）
  { map: 'kenchu', near: 'I', kind: 'michi', name: 'この先 二本松', lines: ['北へ 行けば 二本松の 城下。'] },
  { map: 'kenchu', near: 'm', kind: 'hana', name: '三春滝桜', lines: ['樹齢 千年を こえると いわれる しだれ桜。国の 天然記念物。'] },
  { map: 'kenchu', near: 'v', kind: 'shiro', name: '白河小峰城跡', lines: ['白河藩の 城あと。石垣と 三重櫓が ある。'] },
];

function anchorOf(rows, d) {
  if (d.at) return d.at;
  const y = rows.findIndex((r) => r.includes(d.near));
  return y < 0 ? null : [rows[y].indexOf(d.near), y];
}

// ⭐10/5 本人「城などの脇の看板は消して。城や名所の上に『平城』などの文字表記のみ。文字はひとまわり大きく」
//   ＝板は描かない・通れなくしない。名前は 目印（町・城・地図の出口・灯台）の そのマスの上に字だけで出す
function place() {
  return KANBAN_DEFS.map((d) => {
    const a = anchorOf(ROWS[d.map], d);
    return a ? { ...d, x: a[0], y: a[1] } : { ...d, x: -1, y: -1 };
  });
}
export const KANBAN = place();

export const kanbanAt = (map, x, y) => KANBAN.find((k) => k.map === map && k.x === x && k.y === y) ?? null;
