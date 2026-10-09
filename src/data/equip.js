// 装備（本人 10/1「武器、防具の採用は無いか？」→「3」＝刀屋と装備の回）
// 1人に3か所：weapon 武器／armor 防具／charm お守り。who＝着けられる人。買うとその場で着け、前の品は半値で引き取ってもらう
// 序章いわきで買える所：平の刀屋（武器）・平の荒物屋（防具）・平の八幡さま（勝守）・湯本のお寺（厄除け守）
import { JOBS, jobOf } from './jobs.js?v=302';

export const EQUIP = {
  // ---- 武器と防具＝職業ごと（本人 10/5「武器、防具は職業別に作ってください」）。id＝<職業>_w<段>（武器 段0〜6）／<職業>_a<段>（防具 段1〜6）
  // 強さと値段は 段ごとに どの職業も同じ（前の 刀の段・防具の 旅の笠〜当世具足と同じ数＝強さ合わせは変わらない）
  // 段0＝はじめに持つ・段1〜2＝序章の平・段3＝1章の小高・段4＝1章の相馬・段5＝2章・段6＝3章・段7＝4章 会津（10/6）・段8＝終章 田島（10/8 夜 本人「田島の町ではさらに強い武器と防具を」）
  // bushi
  bushi_w0: { name: '木の棒', slot: 'weapon', job: 'bushi', tier: 0, atk: 2, price: 0, icon: 'bou' },
  bushi_w1: { name: '木刀', slot: 'weapon', job: 'bushi', tier: 1, atk: 5, price: 30, icon: 'bokuto' },
  bushi_w2: { name: '刀', slot: 'weapon', job: 'bushi', tier: 2, atk: 10, price: 100, icon: 'katana' },
  bushi_w3: { name: '太刀', slot: 'weapon', job: 'bushi', tier: 3, atk: 16, price: 220 },
  bushi_w4: { name: '野太刀', slot: 'weapon', job: 'bushi', tier: 4, atk: 24, price: 380 },
  bushi_w5: { name: '名刀', slot: 'weapon', job: 'bushi', tier: 5, atk: 33, price: 640 },
  bushi_w6: { name: '大太刀', slot: 'weapon', job: 'bushi', tier: 6, atk: 44, price: 1000 },
  bushi_w7: { name: '名工の太刀', slot: 'weapon', job: 'bushi', tier: 7, atk: 57, price: 1500 }, // 4章 会津（10/6）
  bushi_a1: { name: '陣笠', slot: 'armor', job: 'bushi', tier: 1, def: 2, price: 15, icon: 'kasa' },
  bushi_a2: { name: '腹当', slot: 'armor', job: 'bushi', tier: 2, def: 6, price: 60 },
  bushi_a3: { name: '胴丸', slot: 'armor', job: 'bushi', tier: 3, def: 10, price: 150 },
  bushi_a4: { name: '腹巻', slot: 'armor', job: 'bushi', tier: 4, def: 15, price: 300 },
  bushi_a5: { name: '大鎧', slot: 'armor', job: 'bushi', tier: 5, def: 22, price: 520 },
  bushi_a6: { name: '当世具足', slot: 'armor', job: 'bushi', tier: 6, def: 30, price: 820 },
  bushi_a7: { name: '黒漆の具足', slot: 'armor', job: 'bushi', tier: 7, def: 39, price: 1250 }, // 4章 会津（10/6）
  bushi_w8: { name: '雪華の太刀', slot: 'weapon', job: 'bushi', tier: 8, atk: 72, price: 2200 }, // 終章 田島（10/8 夜・絵＝6qdyc8・art_src/cut_gear_tier8.py）
  bushi_a8: { name: '金小札の大鎧', slot: 'armor', job: 'bushi', tier: 8, def: 49, price: 1800 }, // 終章 田島（10/8 夜）
  // sou
  sou_w0: { name: '木の杖', slot: 'weapon', job: 'sou', tier: 0, atk: 2, price: 0 },
  sou_w1: { name: '樫の杖', slot: 'weapon', job: 'sou', tier: 1, atk: 5, price: 30, icon: 'kashizue' },
  sou_w2: { name: '金剛杖', slot: 'weapon', job: 'sou', tier: 2, atk: 10, price: 100, icon: 'kongozue' },
  sou_w3: { name: '鉄の杖', slot: 'weapon', job: 'sou', tier: 3, atk: 16, price: 220 },
  sou_w4: { name: '白檀の杖', slot: 'weapon', job: 'sou', tier: 4, atk: 24, price: 380 },
  sou_w5: { name: '銀の如意', slot: 'weapon', job: 'sou', tier: 5, atk: 33, price: 640 },
  sou_w6: { name: '金の如意', slot: 'weapon', job: 'sou', tier: 6, atk: 44, price: 1000 },
  sou_w7: { name: '白檀の如意', slot: 'weapon', job: 'sou', tier: 7, atk: 57, price: 1500 }, // 4章 会津（10/6）
  sou_a1: { name: '網代笠', slot: 'armor', job: 'sou', tier: 1, def: 2, price: 15 },
  sou_a2: { name: '墨染めの衣', slot: 'armor', job: 'sou', tier: 2, def: 6, price: 60 },
  sou_a3: { name: '木綿の法衣', slot: 'armor', job: 'sou', tier: 3, def: 10, price: 150 },
  sou_a4: { name: '絹の法衣', slot: 'armor', job: 'sou', tier: 4, def: 15, price: 300 },
  sou_a5: { name: '緋の衣', slot: 'armor', job: 'sou', tier: 5, def: 22, price: 520 },
  sou_a6: { name: '金襴の袈裟', slot: 'armor', job: 'sou', tier: 6, def: 30, price: 820 },
  sou_a7: { name: '紫の袈裟', slot: 'armor', job: 'sou', tier: 7, def: 39, price: 1250 }, // 4章 会津（10/6）
  sou_w8: { name: '水晶の如意', slot: 'weapon', job: 'sou', tier: 8, atk: 72, price: 2200 }, // 終章 田島（10/8 夜・絵＝6qdyc8・art_src/cut_gear_tier8.py）
  sou_a8: { name: '錦の袈裟', slot: 'armor', job: 'sou', tier: 8, def: 49, price: 1800 }, // 終章 田島（10/8 夜）
  // yojutsu
  yojutsu_w0: { name: '檜扇', slot: 'weapon', job: 'yojutsu', tier: 0, atk: 2, price: 0 },
  yojutsu_w1: { name: '舞扇', slot: 'weapon', job: 'yojutsu', tier: 1, atk: 5, price: 30, icon: 'sensu' },
  yojutsu_w2: { name: '鉄扇', slot: 'weapon', job: 'yojutsu', tier: 2, atk: 10, price: 100, icon: 'tessen' },
  yojutsu_w3: { name: '狐火の扇', slot: 'weapon', job: 'yojutsu', tier: 3, atk: 16, price: 220 },
  yojutsu_w4: { name: '妖しの扇', slot: 'weapon', job: 'yojutsu', tier: 4, atk: 24, price: 380 },
  yojutsu_w5: { name: '九尾の扇', slot: 'weapon', job: 'yojutsu', tier: 5, atk: 33, price: 640 },
  yojutsu_w6: { name: '天狗の羽団扇', slot: 'weapon', job: 'yojutsu', tier: 6, atk: 44, price: 1000 },
  yojutsu_w7: { name: '鳳凰の扇', slot: 'weapon', job: 'yojutsu', tier: 7, atk: 57, price: 1500 }, // 4章 会津（10/6）
  yojutsu_a1: { name: '旅の頭巾', slot: 'armor', job: 'yojutsu', tier: 1, def: 2, price: 15 },
  yojutsu_a2: { name: '藍の羽織', slot: 'armor', job: 'yojutsu', tier: 2, def: 6, price: 60 },
  yojutsu_a3: { name: '狐の羽織', slot: 'armor', job: 'yojutsu', tier: 3, def: 10, price: 150 },
  yojutsu_a4: { name: '黒の羽織', slot: 'armor', job: 'yojutsu', tier: 4, def: 15, price: 300 },
  yojutsu_a5: { name: '月の羽衣', slot: 'armor', job: 'yojutsu', tier: 5, def: 22, price: 520 },
  yojutsu_a6: { name: '九尾の羽衣', slot: 'armor', job: 'yojutsu', tier: 6, def: 30, price: 820 },
  yojutsu_a7: { name: '天女の羽衣', slot: 'armor', job: 'yojutsu', tier: 7, def: 39, price: 1250 }, // 4章 会津（10/6）
  yojutsu_w8: { name: '玉藻の扇', slot: 'weapon', job: 'yojutsu', tier: 8, atk: 72, price: 2200 }, // 終章 田島（10/8 夜・絵＝6qdyc8・art_src/cut_gear_tier8.py）
  yojutsu_a8: { name: '月影の羽衣', slot: 'armor', job: 'yojutsu', tier: 8, def: 49, price: 1800 }, // 終章 田島（10/8 夜）
  // ninja
  ninja_w0: { name: '小刀', slot: 'weapon', job: 'ninja', tier: 0, atk: 2, price: 0 },
  ninja_w1: { name: '短刀', slot: 'weapon', job: 'ninja', tier: 1, atk: 5, price: 30 },
  ninja_w2: { name: '脇差', slot: 'weapon', job: 'ninja', tier: 2, atk: 10, price: 100 },
  ninja_w3: { name: '苦無', slot: 'weapon', job: 'ninja', tier: 3, atk: 16, price: 220 },
  ninja_w4: { name: '忍び刀', slot: 'weapon', job: 'ninja', tier: 4, atk: 24, price: 380 },
  ninja_w5: { name: '鎧通し', slot: 'weapon', job: 'ninja', tier: 5, atk: 33, price: 640 },
  ninja_w6: { name: '小太刀', slot: 'weapon', job: 'ninja', tier: 6, atk: 44, price: 1000 },
  ninja_w7: { name: '霞の忍び刀', slot: 'weapon', job: 'ninja', tier: 7, atk: 57, price: 1500 }, // 4章 会津（10/6）
  ninja_a1: { name: '黒頭巾', slot: 'armor', job: 'ninja', tier: 1, def: 2, price: 15 },
  ninja_a2: { name: '忍び装束', slot: 'armor', job: 'ninja', tier: 2, def: 6, price: 60 },
  ninja_a3: { name: '鎖の籠手', slot: 'armor', job: 'ninja', tier: 3, def: 10, price: 150 },
  ninja_a4: { name: '鎖帷子', slot: 'armor', job: 'ninja', tier: 4, def: 15, price: 300 },
  ninja_a5: { name: '黒鉄の帷子', slot: 'armor', job: 'ninja', tier: 5, def: 22, price: 520 },
  ninja_a6: { name: '影の装束', slot: 'armor', job: 'ninja', tier: 6, def: 30, price: 820 },
  ninja_a7: { name: '闇夜の装束', slot: 'armor', job: 'ninja', tier: 7, def: 39, price: 1250 }, // 4章 会津（10/6）
  ninja_w8: { name: '朧月の忍び刀', slot: 'weapon', job: 'ninja', tier: 8, atk: 72, price: 2200 }, // 終章 田島（10/8 夜・絵＝6qdyc8・art_src/cut_gear_tier8.py）
  ninja_a8: { name: '夜叉の装束', slot: 'armor', job: 'ninja', tier: 8, def: 49, price: 1800 }, // 終章 田島（10/8 夜）
  // rikishi（10/5 夕 本人「力士の武器で刃物はおかしい、素手が基本」＝手に巻く・はめる物。金剛の手甲＝力士の名の元の 金剛力士から）
  rikishi_w0: { name: '素手', slot: 'weapon', job: 'rikishi', tier: 0, atk: 2, price: 0 },
  rikishi_w1: { name: '晒しの巻き手', slot: 'weapon', job: 'rikishi', tier: 1, atk: 5, price: 30 },
  rikishi_w2: { name: '革の手甲', slot: 'weapon', job: 'rikishi', tier: 2, atk: 10, price: 100 },
  rikishi_w3: { name: '鉄の手甲', slot: 'weapon', job: 'rikishi', tier: 3, atk: 16, price: 220 },
  rikishi_w4: { name: '鋲打ちの手甲', slot: 'weapon', job: 'rikishi', tier: 4, atk: 24, price: 380 },
  rikishi_w5: { name: '黒鉄の手甲', slot: 'weapon', job: 'rikishi', tier: 5, atk: 33, price: 640 },
  rikishi_w6: { name: '金剛の手甲', slot: 'weapon', job: 'rikishi', tier: 6, atk: 44, price: 1000 },
  rikishi_w7: { name: '鬼の手甲', slot: 'weapon', job: 'rikishi', tier: 7, atk: 57, price: 1500 }, // 4章 会津（10/6）
  rikishi_a1: { name: '稽古まわし', slot: 'armor', job: 'rikishi', tier: 1, def: 2, price: 15 },
  rikishi_a2: { name: '浴衣', slot: 'armor', job: 'rikishi', tier: 2, def: 6, price: 60 },
  rikishi_a3: { name: '化粧まわし', slot: 'armor', job: 'rikishi', tier: 3, def: 10, price: 150 },
  rikishi_a4: { name: '鉄の胸当て', slot: 'armor', job: 'rikishi', tier: 4, def: 15, price: 300 },
  rikishi_a5: { name: '大関の化粧まわし', slot: 'armor', job: 'rikishi', tier: 5, def: 22, price: 520 },
  rikishi_a6: { name: '横綱の綱', slot: 'armor', job: 'rikishi', tier: 6, def: 30, price: 820 },
  rikishi_a7: { name: '雲竜の綱', slot: 'armor', job: 'rikishi', tier: 7, def: 39, price: 1250 }, // 4章 会津（10/6）
  rikishi_w8: { name: '大関の鉄手甲', slot: 'weapon', job: 'rikishi', tier: 8, atk: 72, price: 2200 }, // 終章 田島（10/8 夜・絵＝6qdyc8・art_src/cut_gear_tier8.py）
  rikishi_a8: { name: '横綱の化粧廻し', slot: 'armor', job: 'rikishi', tier: 8, def: 49, price: 1800 }, // 終章 田島（10/8 夜）
  // yumi
  yumi_w0: { name: '竹の弓', slot: 'weapon', job: 'yumi', tier: 0, atk: 2, price: 0 },
  yumi_w1: { name: '半弓', slot: 'weapon', job: 'yumi', tier: 1, atk: 5, price: 30 },
  yumi_w2: { name: '弓', slot: 'weapon', job: 'yumi', tier: 2, atk: 10, price: 100 },
  yumi_w3: { name: '重籐の弓', slot: 'weapon', job: 'yumi', tier: 3, atk: 16, price: 220 },
  yumi_w4: { name: '強弓', slot: 'weapon', job: 'yumi', tier: 4, atk: 24, price: 380 },
  yumi_w5: { name: '塗籠籐の弓', slot: 'weapon', job: 'yumi', tier: 5, atk: 33, price: 640 },
  yumi_w6: { name: '大弓', slot: 'weapon', job: 'yumi', tier: 6, atk: 44, price: 1000 },
  yumi_w7: { name: '梓の大弓', slot: 'weapon', job: 'yumi', tier: 7, atk: 57, price: 1500 }, // 4章 会津（10/6）
  yumi_a1: { name: '鉢巻', slot: 'armor', job: 'yumi', tier: 1, def: 2, price: 15 },
  yumi_a2: { name: '射籠手', slot: 'armor', job: 'yumi', tier: 2, def: 6, price: 60 },
  yumi_a3: { name: '狩衣', slot: 'armor', job: 'yumi', tier: 3, def: 10, price: 150 },
  yumi_a4: { name: '革の胴', slot: 'armor', job: 'yumi', tier: 4, def: 15, price: 300 },
  yumi_a5: { name: '小札の鎧', slot: 'armor', job: 'yumi', tier: 5, def: 22, price: 520 },
  yumi_a6: { name: '大将の鎧', slot: 'armor', job: 'yumi', tier: 6, def: 30, price: 820 },
  yumi_a7: { name: '緋縅の鎧', slot: 'armor', job: 'yumi', tier: 7, def: 39, price: 1250 }, // 4章 会津（10/6）
  yumi_w8: { name: '雷上動の弓', slot: 'weapon', job: 'yumi', tier: 8, atk: 72, price: 2200 }, // 終章 田島（10/8 夜・絵＝6qdyc8・art_src/cut_gear_tier8.py）
  yumi_a8: { name: '紺糸縅の鎧', slot: 'armor', job: 'yumi', tier: 8, def: 49, price: 1800 }, // 終章 田島（10/8 夜）
  // miko
  miko_w0: { name: '大幣', slot: 'weapon', job: 'miko', tier: 0, atk: 2, price: 0 },
  miko_w1: { name: '神楽鈴', slot: 'weapon', job: 'miko', tier: 1, atk: 5, price: 30 },
  miko_w2: { name: '薙刀', slot: 'weapon', job: 'miko', tier: 2, atk: 10, price: 100 },
  miko_w3: { name: '大薙刀', slot: 'weapon', job: 'miko', tier: 3, atk: 16, price: 220 },
  miko_w4: { name: '神鉾', slot: 'weapon', job: 'miko', tier: 4, atk: 24, price: 380 },
  miko_w5: { name: '長巻', slot: 'weapon', job: 'miko', tier: 5, atk: 33, price: 640 },
  miko_w6: { name: '天の沼矛', slot: 'weapon', job: 'miko', tier: 6, atk: 44, price: 1000 },
  miko_w7: { name: '神楽の鉾', slot: 'weapon', job: 'miko', tier: 7, atk: 57, price: 1500 }, // 4章 会津（10/6）
  miko_a1: { name: '白衣', slot: 'armor', job: 'miko', tier: 1, def: 2, price: 15 },
  miko_a2: { name: '緋袴', slot: 'armor', job: 'miko', tier: 2, def: 6, price: 60 },
  miko_a3: { name: '千早', slot: 'armor', job: 'miko', tier: 3, def: 10, price: 150 },
  miko_a4: { name: '錦の千早', slot: 'armor', job: 'miko', tier: 4, def: 15, price: 300 },
  miko_a5: { name: '天冠と千早', slot: 'armor', job: 'miko', tier: 5, def: 22, price: 520 },
  miko_a6: { name: '神衣', slot: 'armor', job: 'miko', tier: 6, def: 30, price: 820 },
  miko_a7: { name: '白妙の神衣', slot: 'armor', job: 'miko', tier: 7, def: 39, price: 1250 }, // 4章 会津（10/6）
  miko_w8: { name: '日輪の鉾', slot: 'weapon', job: 'miko', tier: 8, atk: 72, price: 2200 }, // 終章 田島（10/8 夜・絵＝6qdyc8・art_src/cut_gear_tier8.py）
  miko_a8: { name: '千早の神衣', slot: 'armor', job: 'miko', tier: 8, def: 49, price: 1800 }, // 終章 田島（10/8 夜）
  // onmyo
  onmyo_w0: { name: '木の笏', slot: 'weapon', job: 'onmyo', tier: 0, atk: 2, price: 0 },
  onmyo_w1: { name: '桃の木の杖', slot: 'weapon', job: 'onmyo', tier: 1, atk: 5, price: 30 },
  onmyo_w2: { name: '鉄の笏', slot: 'weapon', job: 'onmyo', tier: 2, atk: 10, price: 100 },
  onmyo_w3: { name: '星の杖', slot: 'weapon', job: 'onmyo', tier: 3, atk: 16, price: 220 },
  onmyo_w4: { name: '陰陽の杖', slot: 'weapon', job: 'onmyo', tier: 4, atk: 24, price: 380 },
  onmyo_w5: { name: '七星剣', slot: 'weapon', job: 'onmyo', tier: 5, atk: 33, price: 640 },
  onmyo_w6: { name: '天文の宝剣', slot: 'weapon', job: 'onmyo', tier: 6, atk: 44, price: 1000 },
  onmyo_w7: { name: '北斗の宝剣', slot: 'weapon', job: 'onmyo', tier: 7, atk: 57, price: 1500 }, // 4章 会津（10/6）
  onmyo_a1: { name: '烏帽子', slot: 'armor', job: 'onmyo', tier: 1, def: 2, price: 15 },
  onmyo_a2: { name: '白の狩衣', slot: 'armor', job: 'onmyo', tier: 2, def: 6, price: 60 },
  onmyo_a3: { name: '星の狩衣', slot: 'armor', job: 'onmyo', tier: 3, def: 10, price: 150 },
  onmyo_a4: { name: '五芒星の衣', slot: 'armor', job: 'onmyo', tier: 4, def: 15, price: 300 },
  onmyo_a5: { name: '陰陽の装束', slot: 'armor', job: 'onmyo', tier: 5, def: 22, price: 520 },
  onmyo_a6: { name: '天文の装束', slot: 'armor', job: 'onmyo', tier: 6, def: 30, price: 820 },
  onmyo_a7: { name: '星辰の装束', slot: 'armor', job: 'onmyo', tier: 7, def: 39, price: 1250 }, // 4章 会津（10/6）
  onmyo_w8: { name: '七星の宝剣', slot: 'weapon', job: 'onmyo', tier: 8, atk: 72, price: 2200 }, // 終章 田島（10/8 夜・絵＝6qdyc8・art_src/cut_gear_tier8.py）
  onmyo_a8: { name: '天文の狩衣', slot: 'armor', job: 'onmyo', tier: 8, def: 49, price: 1800 }, // 終章 田島（10/8 夜）
  // kusushi
  kusushi_w0: { name: '薬の匙', slot: 'weapon', job: 'kusushi', tier: 0, atk: 2, price: 0 },
  kusushi_w1: { name: '乳棒', slot: 'weapon', job: 'kusushi', tier: 1, atk: 5, price: 30 },
  kusushi_w2: { name: '吹き矢の筒', slot: 'weapon', job: 'kusushi', tier: 2, atk: 10, price: 100 },
  kusushi_w3: { name: '毒針', slot: 'weapon', job: 'kusushi', tier: 3, atk: 16, price: 220 },
  kusushi_w4: { name: '銀の針', slot: 'weapon', job: 'kusushi', tier: 4, atk: 24, price: 380 },
  kusushi_w5: { name: '薬師の杖', slot: 'weapon', job: 'kusushi', tier: 5, atk: 33, price: 640 },
  kusushi_w6: { name: '神農の杖', slot: 'weapon', job: 'kusushi', tier: 6, atk: 44, price: 1000 },
  kusushi_w7: { name: '薬王の杖', slot: 'weapon', job: 'kusushi', tier: 7, atk: 57, price: 1500 }, // 4章 会津（10/6）
  kusushi_a1: { name: '手ぬぐい', slot: 'armor', job: 'kusushi', tier: 1, def: 2, price: 15 },
  kusushi_a2: { name: '前掛け', slot: 'armor', job: 'kusushi', tier: 2, def: 6, price: 60 },
  kusushi_a3: { name: '小袖', slot: 'armor', job: 'kusushi', tier: 3, def: 10, price: 150 },
  kusushi_a4: { name: '薬師の羽織', slot: 'armor', job: 'kusushi', tier: 4, def: 15, price: 300 },
  kusushi_a5: { name: '錦の羽織', slot: 'armor', job: 'kusushi', tier: 5, def: 22, price: 520 },
  kusushi_a6: { name: '神農の衣', slot: 'armor', job: 'kusushi', tier: 6, def: 30, price: 820 },
  kusushi_a7: { name: '薬王の衣', slot: 'armor', job: 'kusushi', tier: 7, def: 39, price: 1250 }, // 4章 会津（10/6）
  kusushi_w8: { name: '霊芝の杖', slot: 'weapon', job: 'kusushi', tier: 8, atk: 72, price: 2200 }, // 終章 田島（10/8 夜・絵＝6qdyc8・art_src/cut_gear_tier8.py）
  kusushi_a8: { name: '桃源の衣', slot: 'armor', job: 'kusushi', tier: 8, def: 49, price: 1800 }, // 終章 田島（10/8 夜）
  // yamabushi
  yamabushi_w0: { name: '山の杖', slot: 'weapon', job: 'yamabushi', tier: 0, atk: 2, price: 0 },
  yamabushi_w1: { name: '小錫杖', slot: 'weapon', job: 'yamabushi', tier: 1, atk: 5, price: 30 },
  yamabushi_w2: { name: '錫杖', slot: 'weapon', job: 'yamabushi', tier: 2, atk: 10, price: 100 },
  yamabushi_w3: { name: '鉄の錫杖', slot: 'weapon', job: 'yamabushi', tier: 3, atk: 16, price: 220 },
  yamabushi_w4: { name: '黒鉄の錫杖', slot: 'weapon', job: 'yamabushi', tier: 4, atk: 24, price: 380 },
  yamabushi_w5: { name: '銀の錫杖', slot: 'weapon', job: 'yamabushi', tier: 5, atk: 33, price: 640 },
  yamabushi_w6: { name: '金の錫杖', slot: 'weapon', job: 'yamabushi', tier: 6, atk: 44, price: 1000 },
  yamabushi_w7: { name: '白金の錫杖', slot: 'weapon', job: 'yamabushi', tier: 7, atk: 57, price: 1500 }, // 4章 会津（10/6）
  yamabushi_a1: { name: '頭襟', slot: 'armor', job: 'yamabushi', tier: 1, def: 2, price: 15, icon: 'kasa' },
  yamabushi_a2: { name: '鈴懸', slot: 'armor', job: 'yamabushi', tier: 2, def: 6, price: 60 },
  yamabushi_a3: { name: '結袈裟', slot: 'armor', job: 'yamabushi', tier: 3, def: 10, price: 150 },
  yamabushi_a4: { name: '笈と鈴懸', slot: 'armor', job: 'yamabushi', tier: 4, def: 15, price: 300 },
  yamabushi_a5: { name: '引敷と鈴懸', slot: 'armor', job: 'yamabushi', tier: 5, def: 22, price: 520 },
  yamabushi_a6: { name: '大峰の装束', slot: 'armor', job: 'yamabushi', tier: 6, def: 30, price: 820 },
  yamabushi_a7: { name: '羽黒の装束', slot: 'armor', job: 'yamabushi', tier: 7, def: 39, price: 1250 }, // 4章 会津（10/6）
  yamabushi_w8: { name: '金剛の錫杖', slot: 'weapon', job: 'yamabushi', tier: 8, atk: 72, price: 2200 }, // 終章 田島（10/8 夜・絵＝6qdyc8・art_src/cut_gear_tier8.py）
  yamabushi_a8: { name: '大峯の装束', slot: 'armor', job: 'yamabushi', tier: 8, def: 49, price: 1800 }, // 終章 田島（10/8 夜）
  // ---- だれでも着けられる物（景品の防具・お守り）
  mino: { name: '蓑', slot: 'armor', def: 6, price: 60 }, // 小名浜の釣りの景品（店では売らない）
  kachimori: { name: '勝守', slot: 'charm', atk: 2, price: 25 }, // 八幡さま＝武運の神さまと伝わる
  // 小名浜の釣りの景品だけ（本人 10/2「何か景品付けて」）。えびす様＝漁の神さまと伝わる。店では売らない（price 0＝引き取りも0）
  ebisu: { name: 'えびす様の守り', slot: 'charm', atk: 2, def: 2, agi: 2, price: 0 },
  // 相馬野馬追の神旗争奪戦の景品だけ（本人 10/3）。店では売らない
  jinbaori: { name: '陣羽織', slot: 'armor', def: 9, agi: 4, price: 0 },
  // 二本松の提灯祭りの景品（10/4）＝宵祭りで提灯に灯す 二本松神社の御神火にちなむ お守り（ゲームの作り）。ここでしか手に入らない
  gojinka: { name: '御神火の守り', slot: 'charm', atk: 4, def: 3, agi: 2, price: 0 },
  yakuyoke: { name: '厄除け守', slot: 'charm', ward: true, price: 25 }, // 呪い・取り憑きを半分はね返す
  // お城の お題の 褒美（10/8 夜 本人「殿様クエで、殿様に報告しても何もない。味気が無い」）＝お殿様から いただく お守り。店では 売らない（rally.js の CASTLE_REWARD）。絵＝95ek0e・art_src/cut_reward_charms.py
  r_taira: { name: '平の 殿の 扇', slot: 'charm', atk: 2, def: 2, agi: 1, price: 0 },
  r_nakamura: { name: '九曜の 守り', slot: 'charm', atk: 3, def: 3, agi: 2, price: 0 }, // 九曜＝相馬氏の 家紋
  r_nihonmatsu: { name: '霞ヶ城の 守り', slot: 'charm', atk: 4, def: 3, agi: 3, price: 0 },
  r_shirakawa: { name: '白河の 関守り', slot: 'charm', atk: 5, def: 4, agi: 3, price: 0 },
  r_aizuwakamatsu: { name: '鶴ヶ城の 守り刀', slot: 'charm', atk: 6, def: 5, agi: 4, price: 0 },
};

// その人が いま着けられるか（武器と防具＝その職業の品だけ・お守りと景品の防具＝だれでも）
export function canWear(game, id, who) {
  const e = EQUIP[id];
  if (!e) return false;
  if (!e.job) return true; // お守り・景品の防具＝だれでも
  return jobOf(game, who) === e.job; // 武器と防具＝その職業の品だけ（10/5）
}

export const SLOTS = ['weapon', 'armor', 'charm'];
export const SLOT_NAME = { weapon: '武器', armor: '防具', charm: 'お守り' };

// はじめの装備＝その職業の段0の武器
export function startEquipFor(job) {
  return { weapon: EQUIP[`${job}_w0`] ? `${job}_w0` : null, armor: null, charm: null };
}
// 店に並べる品：武器の段・防具の段 → 10職業ぶんの id（町の店は 旅にいる人の品だけ見せる）
export const JOB_GEAR_IDS = Object.keys(EQUIP).filter((id) => EQUIP[id].job);
export function gearAt(weaponTiers, armorTiers = []) {
  return JOB_GEAR_IDS.filter((id) => (EQUIP[id].slot === 'weapon' ? weaponTiers : armorTiers).includes(EQUIP[id].tier));
}
// 前の版（〜v165）の記録の品 → いまの品（同じ段の その職業の品へ）
const OLD_WEAPON_TIER = Object.fromEntries([
  ['bou', 'bokuto', 'katana', 'tachi', 'nodachi', 'meito', 'ootachi'], ['hiougi', 'sensu', 'tessen', 'naginata', 'oonaginata', 'hokonaginata', 'nagamaki'],
  ['kogatana', 'tanto', 'wakizashi', 'kunai', 'shinobigatana', 'yoroidoshi', 'kodachi'], ['konbo', 'nata', 'yamagatana', 'kumayari', 'jumonji', 'matagiyari', 'oomiyari'],
  ['kinotsue', 'kashizue', 'kongozue', 'shakujo', 'tetsushakujo', 'ginshakujo', 'kinshakujo'], ['takeyumi', 'hankyu', 'yumi', 'shigetou', 'tsuyoyumi', 'nurigome', 'daikyu'],
].flatMap((line) => line.map((id, t) => [id, t])));
const OLD_ARMOR_TIER = { kasa: 1, kyahan: 1, domaru: 3, kusari: 4, yoroi: 5, gusoku: 6 };
export function migrateEquip(game) {
  if (!game?.equip) return game;
  const equip = Object.fromEntries(Object.entries(game.equip).map(([who, g]) => {
    const job = jobOf(game, who);
    const w = g?.weapon && !EQUIP[g.weapon] && OLD_WEAPON_TIER[g.weapon] != null ? `${job}_w${OLD_WEAPON_TIER[g.weapon]}` : g?.weapon;
    const a = g?.armor && !EQUIP[g.armor] && OLD_ARMOR_TIER[g.armor] ? `${job}_a${OLD_ARMOR_TIER[g.armor]}` : g?.armor;
    return [who, { ...g, weapon: EQUIP[w] ? w : null, armor: EQUIP[a] ? a : null, charm: EQUIP[g?.charm] ? g.charm : null }]; // 10/7 夜 お守りも 無い品は 外す（そうびを見るで 止まらない）
  }));
  return { ...game, equip };
}
export function startEquip(game) {
  return Object.fromEntries((game.members ?? []).map((id) => [id, startEquipFor(jobOf(game, id))]));
}
export const START_EQUIP = {}; // 前の形の名残（職業の旅では startEquip(game)）

// 効き目の短い書き方（店の右に出す）：攻+5 守+2 速+2 厄除け
export function equipNote(id) {
  const e = EQUIP[id];
  return [e.atk && `攻+${e.atk}`, e.def && `守+${e.def}`, e.agi && `速+${e.agi}`, e.ward && '厄除け'].filter(Boolean).join(' ');
}

// 着け替えたら どう変わるか（本人 10/3「装備は間違えて買うことが無いように、装備中、-10(着ることによりさがる)など、注記してほしい」）
// id＝これから着ける品・nowId＝その人が その場所に いま着けている品（無ければ null）
export function equipDiff(id, nowId) {
  const a = EQUIP[id];
  const b = EQUIP[nowId] ?? {};
  return { atk: (a.atk ?? 0) - (b.atk ?? 0), def: (a.def ?? 0) - (b.def ?? 0), agi: (a.agi ?? 0) - (b.agi ?? 0), ward: Number(!!a.ward) - Number(!!b.ward) };
}
// 店の右に出す字：装備中／攻+6 守-4（＋は上がる・－は下がる）／変わらない
export function diffNote(id, nowId) {
  if (id === nowId) return '装備中';
  const d = equipDiff(id, nowId);
  const sg = (n) => (n > 0 ? `+${n}` : `${n}`);
  const parts = [d.atk && `攻${sg(d.atk)}`, d.def && `守${sg(d.def)}`, d.agi && `速${sg(d.agi)}`, d.ward > 0 && '厄除け', d.ward < 0 && '厄除け無し'].filter(Boolean);
  return parts.length ? parts.join(' ') : '変わらない';
}
// 着けると どれか1つでも下がるか（字を赤くする）
export const diffDown = (id, nowId) => id !== nowId && Object.values(equipDiff(id, nowId)).some((n) => n < 0);

// 装備の足し算
export function gearBonus(equip) {
  const b = { atk: 0, def: 0, agi: 0, ward: false };
  for (const s of SLOTS) {
    const e = EQUIP[equip?.[s]];
    if (!e) continue;
    b.atk += e.atk ?? 0;
    b.def += e.def ?? 0;
    b.agi += e.agi ?? 0;
    b.ward = b.ward || !!e.ward;
  }
  return b;
}

// ボスに着くころの装備（試算と試験の前提。そのころの文で無理なく買える物）＝ レベルごとに 武器の段・防具・お守り
// （10/5 職業の旅へ作り替え：前の表の「旅の者の刀の段」と防具を そのまま使った）
// ＝[武器の段, 防具の段]（防具の段1＝旅の笠・2＝蓑・3＝胴丸・4＝鎖帷子・5＝大鎧・6＝当世具足 と同じ強さ）
const GEAR_AT = {
  1: [0, 0], 2: [0, 0], 3: [1, 0], 4: [1, 1], 5: [2, 1], 6: [2, 2], 7: [3, 2], 8: [4, 3], 9: [4, 4],
  10: [4, 4], 11: [5, 4], 12: [5, 4], 13: [5, 5], 14: [5, 5], 15: [5, 5], 16: [6, 5], 17: [6, 6], 18: [6, 6], 19: [6, 6], 20: [6, 6],
  21: [7, 6], 22: [7, 7], 23: [7, 7], 24: [7, 7], 25: [7, 7], // 4章 会津（10/6）＝猪苗代・若松で 7段目
  26: [7, 7], 27: [7, 7], 28: [8, 8], 29: [8, 8], 30: [8, 8], // ⭐10/9 本人「子分、ラスボスが弱い」＝最終話（Lv28・手下と 大将）は 田島の 8段目を 着けた 4人で 合わせる。それより 前は 終章 南会津（10/8 Lv30 まで）＝ボスの 強さは 7段目で 合わせた まま（8段目＝田島の 刀屋は 買えば 楽に なる ごほうび・10/8 夜）
};
export function expectEquipFor(lv, job) {
  const [wt, at] = GEAR_AT[Math.min(30, Math.max(1, lv))];
  return { weapon: EQUIP[`${job}_w${wt}`] ? `${job}_w${wt}` : null, armor: at ? `${job}_a${at}` : null, charm: null };
}
// その旅の4人ぶん（id → 装備）
export function expectEquip(lv, game) {
  return Object.fromEntries((game.members ?? []).map((id) => [id, expectEquipFor(lv, jobOf(game, id))]));
}
