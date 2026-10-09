// 名所の名前（本人 10/4「お城や地域、名所にドットの立て看板が欲しい。相馬城や三春桜など」→ 10/5 板は消して 字だけ）
// 絵＝assets/tiles/o_kanban_<種類>.png（art_src/prep_kanban.py・板は無地）。名前は地図の上に毛筆の字で重ね、看板に向いて「はなす」と短い説明
// 置き場＝目印（町・地図の口の字、または座標）の隣の草地（.）を、左→右→左下→右下→下→左上→右上→上 の順に探す
// 説明は確かめた事だけ（10/4 ネットで確かめた：中村城跡に相馬中村神社／小高城は相馬氏の約280年の居城・1611年に中村へ／磐城平城＝平藩／鵜ノ尾埼灯台＝松川浦の岬／霞ヶ城公園＝石垣・さくら名所100選）。三春の滝桜は 3章の地図ができたら足す
import { IWAKI_ROWS } from './iwaki_map.js?v=307';
import { SOMA_ROWS } from './soma_map.js?v=307';
import { KENPOKU_ROWS } from './kenpoku_map.js?v=307';
import { KENCHU_ROWS } from './kenchu_map.js?v=307';
import { AIZU_ROWS } from './aizu_map.js?v=307';
import { MINAMI_ROWS } from './minami_map.js?v=307';

const ROWS = { field: IWAKI_ROWS, soma: SOMA_ROWS, kenpoku: KENPOKU_ROWS, kenchu: KENCHU_ROWS, aizu: AIZU_ROWS, minami: MINAMI_ROWS };
export const KANBAN_KINDS = ['shiro', 'meisho', 'hana', 'michi'];

// near＝目印の字（地図に1つだけの字）／at＝目印の座標（灯台など）
export const KANBAN_DEFS = [
  // 祭り（10/5 夜 本人「須賀川のイベント祭りが無い」＝祭りのマスに 名前が無く 気づけなかった）
  { map: 'kenchu', near: 'a', kind: 'meisho', name: '松明あかし', lines: ['須賀川の 五老山で 大松明を 燃やす 火祭り。'] },
  { map: 'kenpoku', near: 'k', kind: 'meisho', name: '提灯祭り', lines: ['二本松神社の 秋の 祭り。太鼓台に 提灯が 灯る。'] },
  { map: 'soma', near: 'P', kind: 'meisho', name: '相馬野馬追', lines: ['雲雀ヶ原で 騎馬武者が 神旗を 奪い合う 祭り。'] },
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
  { map: 'field', near: 'H', kind: 'shiro', name: '磐城平城', lines: ['江戸時代、平藩の 城。'] }, // 10/6 本人「平城跡の跡は消して、お城扱いに」
  { map: 'field', near: 'Y', kind: 'meisho', name: 'いわき湯本温泉', lines: ['古くから 知られた 湯の町。'] },
  { map: 'field', near: 'O', kind: 'meisho', name: '小名浜港', lines: ['いわきの 漁と 船の 港。'] },
  { map: 'field', at: [31, 26], kind: 'meisho', name: '塩屋埼灯台', lines: ['いわきの 岬に 立つ 白い 灯台。'] },
  { map: 'field', near: 'E', kind: 'michi', name: 'この先 相馬', lines: ['北へ 行けば 相馬の 里。'] },
  // 1章 相馬
  { map: 'soma', near: 'M', kind: 'shiro', name: '相馬中村城', lines: ['相馬氏の 城。いまは 城の 中に 相馬中村神社が まつられている。'] }, // 10/8 夜 本人「小峰城跡→小峰城に変更。お城で跡は消してほしい」
  { map: 'soma', near: 'Q', kind: 'shiro', name: '小高城', lines: ['相馬氏が 中村城へ 移るまで、およそ 280年 置いた 城。'] },
  { map: 'soma', at: [27, 4], kind: 'meisho', name: '鵜ノ尾埼灯台', lines: ['相馬の 松川浦の 入口の 岬に 立つ 灯台。'] },
  { map: 'soma', near: 'E', kind: 'michi', name: 'この先 いわき', lines: ['南へ 行けば いわきの 里。'] },
  { map: 'soma', near: 'X', kind: 'michi', name: 'この先 県北', lines: ['西へ 山を こえれば 福島・二本松。'] },
  // 2章 県北
  { map: 'kenpoku', near: 'U', kind: 'meisho', name: '福島・信夫山', lines: ['福島の 町の なかに ある 山。'] },
  { map: 'kenpoku', near: 'W', kind: 'shiro', name: '二本松城（霞ヶ城）', lines: ['石垣の 残る 城。いまは 霞ヶ城公園。', '春は 桜の 名所。'] },
  { map: 'kenpoku', near: 'X', kind: 'michi', name: 'この先 相馬', lines: ['東へ 山を こえれば 相馬の 里。'] },
  { map: 'kenpoku', near: 'I', kind: 'michi', name: 'この先 郡山', lines: ['南へ 行けば 郡山・須賀川・白河。'] },
  // 3章 県中・県南（10/4）
  { map: 'kenchu', near: 'I', kind: 'michi', name: 'この先 二本松', lines: ['北へ 行けば 二本松の 城下。'] },
  { map: 'kenchu', near: 'm', kind: 'hana', name: '三春滝桜', lines: ['樹齢 千年を こえると いわれる しだれ桜。国の 天然記念物。'] },
  { map: 'kenchu', near: 'v', kind: 'shiro', name: '小峰城', lines: ['白河藩の 城。石垣と 三重櫓が ある。'] },
  // 4章 会津（10/6・vault 2026-10-06 調べノートで 確かめた 事だけ）
  { map: 'kenchu', near: '関', kind: 'michi', name: 'この先 会津', lines: ['西へ 峠を こえれば 会津。'] },
  { map: 'aizu', near: '関', kind: 'michi', name: 'この先 白河', lines: ['東へ 峠を 下れば 白河。'] },
  { map: 'aizu', near: '若', kind: 'shiro', name: '会津若松・鶴ヶ城', lines: ['会津若松の 城。蒲生氏郷が 鶴ヶ城と 名づけたと 伝わる。'] },
  { map: 'aizu', near: '亀', kind: 'shiro', name: '亀ヶ城', lines: ['戦国の ころ、鶴ヶ城の 支城として 築かれた 城。いまは 桜と 紅葉の 名所。'] },
  // 町の名前（10/6 本人「会津で町やお城の名前が表記されていない」）
  { map: 'aizu', near: '苗', kind: 'meisho', name: '猪苗代', lines: ['猪苗代湖の 北の 町。'] },
  { map: 'aizu', near: '津', kind: 'meisho', name: '柳津', lines: ['只見川の ほとりの 門前町。'] },
  { map: 'kenchu', near: 'g', kind: 'meisho', name: '郡山', lines: ['県の まんなかの 町。'] },
  { map: 'kenchu', near: 's', kind: 'meisho', name: '須賀川', lines: ['松明あかしの 町。'] },
  { map: 'aizu', at: [32, 24], kind: 'meisho', name: '猪苗代湖', lines: ['日本で 4番目に 広い 湖。「天鏡湖」とも よばれる。'] },
  { map: 'aizu', near: '足', kind: 'meisho', name: '磐梯山', lines: ['会津富士とも よばれる 山。むかしは「病悩山」と よばれたと 伝わる。'] },
  { map: 'aizu', near: '猫', kind: 'meisho', name: '猫魔ヶ岳', lines: ['猫又が すんでいたので 名が ついたと 伝わる 山。'] },
  { map: 'aizu', near: '牛', kind: 'meisho', name: '圓藏寺', lines: ['只見川を 見下ろす 崖の 上の 寺。赤べこ 発祥の 地と いわれる。'] },
  { map: 'aizu', near: '沼', kind: 'meisho', name: '沼沢湖', lines: ['噴火で できた 湖。県内で いちばん 深い。'] },
  { map: 'aizu', near: '沢', kind: 'meisho', name: '中ノ沢温泉', lines: ['安達太良山の 西の ふもと、高原の 湯の里。'] },
  { map: 'aizu', near: '東', kind: 'meisho', name: '東山温泉', lines: ['若松の 東の 山あいの 湯の町。'] },
  { map: 'aizu', near: '芦', kind: 'meisho', name: '芦ノ牧温泉', lines: ['大川の 渓谷に わく 湯の町。'] },
  { map: 'aizu', near: '西', kind: 'meisho', name: '西山温泉', lines: ['柳津の 滝谷川の 渓谷に わく 山の湯。「たん切りの湯」とも よばれる。'] },
  { map: 'aizu', near: '早', kind: 'meisho', name: '早戸温泉', lines: ['只見川の 谷の 湯。けがを した 鶴が つかっていたと 伝わる。'] },
  // 10/8 終章 南会津（確かめた事：檜枝岐村は 県の 南西の 端・尾瀬の 福島県側の 玄関口／檜枝岐川は 伊南川の 上流／会津駒ヶ岳 2133m・燧ヶ岳 2356m／ばんばは 鎮守神社への 参道の 途中／舞台は 境内の 茅葺き）
  { map: 'aizu', near: '南', kind: 'michi', name: 'この先 南会津', lines: ['南へ 山を 越えれば 南会津。'] },
  { map: 'minami', near: '南', kind: 'michi', name: 'この先 会津', lines: ['北へ 山を 越えれば 金山。'] },
  { map: 'minami', near: '檜', kind: 'meisho', name: '檜枝岐', lines: ['福島県の 南西の 端の 村。尾瀬の 入口に あたる。'] },
  { map: 'minami', near: '只', kind: 'meisho', name: '只見', lines: ['只見川と 伊南川が 流れる、雪深い 山あいの 町。'] }, // 10/9
  { map: 'minami', near: '田', kind: 'meisho', name: '田島', lines: ['会津西街道の 宿場町。夏の 祇園祭で 知られる。'] }, // 10/8 夜
  { map: 'minami', near: '駒', kind: 'meisho', name: '会津駒ヶ岳', lines: ['高さ 2133メートルの 山。'] },
  { map: 'minami', near: '滝', kind: 'meisho', name: 'モーカケの滝', lines: ['平家の 姫の 裳を 掛けた 姿に 似ていると 伝わる 滝（ほかの 説も ある）。'] }, // 10/8 七入〜御池の 道ぞい
  { map: 'minami', at: [23, 35], kind: 'meisho', name: '燧ヶ岳', lines: ['高さ 2356メートルの 山。尾瀬国立公園の 山の ひとつ。'] },
  { map: 'minami', at: [20, 16], kind: 'meisho', name: '檜枝岐川', lines: ['伊南川の 上流の 川。'] },
  { map: 'minami', near: '婆', kind: 'meisho', name: '橋場のばんば', lines: ['鎮守神社へ 続く 参道の 途中に まつられた 姥神さま。', 'ばんばさまは、ただ にこにこと ほほえんで いる。'] }, // 10/8 本人「スタンプが揃っていない場合、橋場のばんばはただニコニコしている」
  { map: 'minami', near: '舞', kind: 'meisho', name: '檜枝岐の舞台', lines: ['鎮守神社の 境内に 建つ、茅葺きの 歌舞伎の 舞台。'] },
  { map: 'minami', at: [14, 38], kind: 'michi', name: 'この先 尾瀬', lines: ['南の 山を 越えれば 尾瀬。'] },
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
