// 遊ぶ順（話数＝順路の順・本人 10/1）。題の画面は先頭の話を出し、勝つと「つぎの話へ」で次へ進む
// 序章：第一話 松川様 → 第二話 賢沼の大うなぎ → 第三話 蛇岸淵（淵の主）→ 第四話 龍燈
import { MATSUKAWA } from './matsukawa.js?v=266';
import { KASHINUMA } from './kashinuma.js?v=266';
import { JAGAN } from './jagan.js?v=266';
import { RYUTO } from './ryuto.js?v=266';
// 1章 相馬（10/3）：第五話 ザルカブリ山 → 第六話 大悲山の大蛇 → 第七話 手長明神 → 第八話 虎捕山の白狼（橘墨虎）
import { ZARUKABURI } from './zarukaburi.js?v=266';
import { DAIHISAN } from './daihisan.js?v=266';
import { TENAGA } from './tenaga.js?v=266';
import { SUMITORA } from './sumitora.js?v=266';
// 2章 県北（10/4）：第九話 飴買い幽霊 → 第十話 ご坊狐 → 第十一話 ムカデとオロチ → 第十二話 へっぴり嫁 → 第十三話 安達ヶ原の鬼婆
import { AMEKAI } from './amekai.js?v=266';
import { GOBOU } from './gobou.js?v=266';
import { MUKADE } from './mukade.js?v=266';
import { HEPPIRI } from './heppiri.js?v=266';
import { ONIBABA } from './onibaba.js?v=266';
// 3章 県中・県南（10/4）：第十四話 蛇骨地蔵 → 第十五話 三春駒 → 第十六話 大多鬼丸 → 第十七話 和泉式部と猫 → 第十八話 天狗のいけにえ
//   → 第十九話 狸森の託善和尚 → 第二十話 カッパのわび証文 → 第二十一話 安珍と清姫（本人 10/4「戦わない3話を戦う形で」＝8話とも戦う）
import { JAKOTSU } from './jakotsu.js?v=266';
import { MIHARUGOMA } from './miharugoma.js?v=266';
import { OTAKIMARU } from './otakimaru.js?v=266';
import { NEKONAKI } from './nekonaki.js?v=266';
import { TENGU } from './tengu.js?v=266';
import { TAKUZEN } from './takuzen.js?v=266';
import { KAPPA } from './kappa.js?v=266';
import { KIYOHIME } from './kiyohime.js?v=266';
// 4章 会津（10/6）：第二十二話 亀姫 → 第二十三話 猫魔ヶ岳の化け猫 → 第二十四話 磐梯山の手長足長 → 第二十五話 朱の盤 → 第二十六話 赤べこ
//   → 第二十七話 河童の恩返し → 第二十八話 母子狐の仇討ち → 第二十九話 沼御前（章ボス）
import { KAMEHIME } from './kamehime.js?v=266';
import { NEKOMA } from './nekoma.js?v=266';
import { ASHINAGA } from './ashinaga.js?v=266';
import { SHUNOBON } from './shunobon.js?v=266';
import { AKABEKO } from './akabeko.js?v=266';
import { NAWAKAPPA } from './nawakappa.js?v=266';
import { OKON } from './okon.js?v=266';
import { NUMAGOZEN } from './numagozen.js?v=266';

// お城クエスト（10/7）：お殿様の お題の 怪物＝昔話の 並びの 後ろに まとめる（どの章の あとの 寄り道かは castle.js の CASTLE_QUESTS の after）
import { ONIGAJO } from './onigajo.js?v=266';
import { USUNUMA } from './usunuma.js?v=266';
import { ONIISHI } from './oniishi.js?v=266';
import { KENKATSURA } from './kenkatsura.js?v=266';
import { KAGAMINUMA } from './kagaminuma.js?v=266';

export const EPISODES = [MATSUKAWA, KASHINUMA, JAGAN, RYUTO, ZARUKABURI, DAIHISAN, TENAGA, SUMITORA, AMEKAI, GOBOU, MUKADE, HEPPIRI, ONIBABA, JAKOTSU, MIHARUGOMA, OTAKIMARU, NEKONAKI, TENGU, TAKUZEN, KAPPA, KIYOHIME, KAMEHIME, NEKOMA, ASHINAGA, SHUNOBON, AKABEKO, NAWAKAPPA, OKON, NUMAGOZEN, ONIGAJO, USUNUMA, ONIISHI, KENKATSURA, KAGAMINUMA];
