// 道具の一覧と値段（文）。歩く地図の店と持ち物はここを引く
// 10/2 本人「食べ物を普通に戻して欲しい。ご当地ものは、完成後入れなおします」＝いわきの名物（iwaki_foods.js）は取っておき、いまは ふつうの道具
import { BASIC_ITEMS } from './basic_items.js?v=192';

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
  // 二本松の提灯祭りの景品（10/4）＝二本松の名物 玉羊羹（ようかんを丸い玉に流した菓子）
  tamayokan: { name: '玉羊羹', kind: 'hp', amount: 90 },
};

// 道具の効き目の短い書き方（店・戦いの道具の右に出す）
export function itemNote(it) {
  return { mp: `術+${it.amount}`, hpall: `全員HP+${it.amount}`, bind: '敵を止める', ammo: '鉄砲' }[it.kind] ?? `HP+${it.amount}`;
}

export const PRICE = { yakusou: 8, jouyakusou: 30, reisui: 15, tama: 10, tokujou: 60, goshinsui: 45, kusuribako: 90, tamayokan: 45 }; // 玉羊羹＝二本松の菓子屋（10/5 夜・HP90＝上薬草と特上の間）

// 前の記録（名物のころ）の持ち物を、いまの道具に読み替える
export const OLD_ITEM = { mehikari: 'yakusou', manju: 'yakusou', uni: 'jouyakusou', katsuo: 'reisui' };
