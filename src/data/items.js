// 道具の一覧と値段（文）。歩く地図の店と持ち物はここを引く
// 10/2 本人「食べ物を普通に戻して欲しい。ご当地ものは、完成後入れなおします」＝いわきの名物（iwaki_foods.js）は取っておき、いまは ふつうの道具
import { BASIC_ITEMS } from './basic_items.js?v=353';

const strip = ({ count, ...rest }) => rest;

export const ITEMS = {
  ...Object.fromEntries(Object.entries(BASIC_ITEMS).map(([id, it]) => [id, strip(it)])),
  // 鉄砲の玉（本人 10/2「猟師の攻撃、術→鉄砲。ただし、玉が必要。武器屋で売っている」）＝平の刀屋で1発ずつ。道具としては使えない（ammo）
  tama: { name: '鉄砲の玉', kind: 'ammo', amount: 1 },
  // 小名浜の釣りの景品だけ（店では売らない）。本人 10/2「戦闘時に役立つもの」
  toami: { name: '投網', kind: 'bind', amount: 1 },
  sake: { name: '大漁の酒', kind: 'hpall', amount: 40 },
  // 1章 相馬の道具（本人 10/3「武器や防具、道具も、強い敵に合わせて強くしてほしい」）＝Lv7〜9のHP（旅の者 約110〜125・4人で約400）に合わせた。小高の薬売り・相馬の道具屋で売る
  tokujou: { name: '特上薬草', kind: 'hp', amount: 120 },
  goshinsui: { name: '御神水', kind: 'mp', amount: 25 },
  kusuribako: { name: '薬箱', kind: 'hpall', amount: 60 },
  // 二本松の提灯祭りの景品（10/4）＝二本松の名物（ようかんを丸い玉に流した菓子）。⭐10/9 夜 本人「『薄皮饅頭』『玉羊羹』も変えてください」＝店の 商品名と 重なる 名前は 使わない＝まんまる羊羹
  tamayokan: { name: 'まんまる羊羹', kind: 'hp', amount: 90 },
  // 福島グルメ（10/6 本人「福島グルメ登場させ、各お店より購入する」＝スタンプラリー・src/field/rally.js）。名物は ネットで 確かめた 物だけ
  // ⚠id は g_ を付ける（mehikari・manju は 前の記録の 読み替え OLD_ITEM で 薬草に 化ける）
  g_unikai: { name: 'うに貝焼き', kind: 'hp', amount: 80 }, // いわきの 郷土料理（江戸時代は 献上品）
  g_mehikari: { name: 'めひかり', kind: 'hp', amount: 40 }, // いわきの 魚
  g_manju: { name: '温泉饅頭', kind: 'hp', amount: 30 },
  g_hokki: { name: 'ほっき飯', kind: 'hp', amount: 70 }, // 相馬の 冬から 早春の 郷土料理
  g_momo: { name: '桃', kind: 'hp', amount: 60 },
  g_usukawa: { name: '茶まんじゅう', kind: 'hp', amount: 80 }, // 郡山の 名物の 皮の 薄い 茶色の 饅頭（10/9 夜 商品名と 重ならない よう 茶まんじゅうに）
  g_ramen: { name: '白河ラーメン', kind: 'hpall', amount: 50 },
  g_soba: { name: '猪苗代の そば', kind: 'hp', amount: 100 },
  g_kozuyu: { name: 'こづゆ', kind: 'hpall', amount: 70 }, // 会津の 冠婚葬祭の 汁物
  g_awaman: { name: 'あわまんじゅう', kind: 'hp', amount: 120 }, // 柳津・1818年の 大火の あと「二度と 災難に あわないように」と 粟で 作った
  // ⭐10/9 夜 本人「菓子屋でお菓子が売られていない。福島名物を出すようにして欲しい。商標権があるので、名前は変えて」「お菓子は特殊効果にしてほしい。この戦闘中のみ防御力が1.5倍など」
  //   ＝菓子屋（二本松・会津若松）と 郡山の 茶屋で 売る。戦いの 中で 食べた 本人に その戦いの 間だけ 効く（同じ 菓子は 重ならない・自動の 戦いでは 使わない＝店の 人が 注意する）
  //   名前は 中身を 表す 言い方（店の 商品名は 使わない・rally.test が 見張る）。fx＝効き目（battle/rules.js の 'sweet'）
  s_milkan: { name: '乳あんの まんじゅう', kind: 'sweet', fx: { stat: 'def', mult: 1.5 }, note: '守り1.5倍', amount: 0 },
  s_yubeshi: { name: 'くるみの ゆべし', kind: 'sweet', fx: { stat: 'atk', mult: 1.3 }, note: '攻め1.3倍', amount: 0 },
  s_hoshigaki: { name: '身知らず柿の 干し柿', kind: 'sweet', fx: { stat: 'agi', mult: 1.5 }, note: '素早さ1.5倍', amount: 0 },
  s_mizuame: { name: '米の 水飴', kind: 'sweet', fx: { mpRegen: 3 }, note: '術 毎ターン+3', amount: 0 },
  s_shimimochi: { name: '凍み餅', kind: 'sweet', fx: { ward: true }, note: '毒・術封じよけ', amount: 0 },
  s_anpo: { name: 'あんぽ柿', kind: 'sweet', fx: { endure: true }, note: '1度踏みとどまる', amount: 0 },
};

// 道具の効き目の短い書き方（店・戦いの道具の右に出す）
export function itemNote(it) {
  if (it.kind === 'sweet') return it.note; // 10/9 夜 お菓子＝その戦いの 間だけの 効き目（短く＝店の 窓で 名前が 切れた・「この戦いの間」は 店の 人が 言う）
  return { mp: `術+${it.amount}`, hpall: `全員HP+${it.amount}`, bind: '敵を止める', ammo: '鉄砲' }[it.kind] ?? `HP+${it.amount}`;
}

export const PRICE = { yakusou: 8, jouyakusou: 30, reisui: 15, tama: 10, tokujou: 60, goshinsui: 45, kusuribako: 90, tamayokan: 45, g_unikai: 40, g_mehikari: 15, g_manju: 10, g_hokki: 35, g_momo: 30, g_usukawa: 40, g_ramen: 70, g_soba: 50, g_kozuyu: 90, g_awaman: 60, s_milkan: 80, s_yubeshi: 100, s_hoshigaki: 80, s_mizuame: 100, s_shimimochi: 120, s_anpo: 150 }; // まんまる羊羹＝二本松の菓子屋（10/5 夜・HP90＝上薬草と特上の間）

// 前の記録（名物のころ）の持ち物を、いまの道具に読み替える
export const OLD_ITEM = { mehikari: 'yakusou', manju: 'yakusou', uni: 'jouyakusou', katsuo: 'reisui' };
