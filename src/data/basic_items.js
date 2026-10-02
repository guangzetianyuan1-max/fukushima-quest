// 道具（ふつうの物）。本人 10/2「食べ物を普通に戻して欲しい。ご当地ものは、完成後入れなおします」
// 効き目は いわきの名物（iwaki_foods.js・取っておく）と同じ＝戦いの釣り合いは変わらない（めひかり→薬草・うにの貝焼き→上薬草・カツオとにんにく→霊水）
// count は話ごとの試し（episodes の試験）で持っている数
export const BASIC_ITEMS = {
  yakusou: { name: '薬草', kind: 'hp', amount: 30, count: 2 },
  jouyakusou: { name: '上薬草', kind: 'hp', amount: 60, count: 1 },
  reisui: { name: '霊水', kind: 'mp', amount: 10, count: 1 },
};
