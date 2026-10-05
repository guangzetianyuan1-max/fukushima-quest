// 遊ぶ順（話数＝順路の順・本人 10/1）。題の画面は先頭の話を出し、勝つと「つぎの話へ」で次へ進む
// 序章：第一話 松川様 → 第二話 賢沼の大うなぎ → 第三話 蛇岸淵（淵の主）→ 第四話 龍燈
import { MATSUKAWA } from './matsukawa.js?v=168';
import { KASHINUMA } from './kashinuma.js?v=168';
import { JAGAN } from './jagan.js?v=168';
import { RYUTO } from './ryuto.js?v=168';
// 1章 相馬（10/3）：第五話 ザルカブリ山 → 第六話 大悲山の大蛇 → 第七話 手長明神 → 第八話 虎捕山の白狼（橘墨虎）
import { ZARUKABURI } from './zarukaburi.js?v=168';
import { DAIHISAN } from './daihisan.js?v=168';
import { TENAGA } from './tenaga.js?v=168';
import { SUMITORA } from './sumitora.js?v=168';
// 2章 県北（10/4）：第九話 飴買い幽霊 → 第十話 ご坊狐 → 第十一話 ムカデとオロチ → 第十二話 へっぴり嫁 → 第十三話 安達ヶ原の鬼婆
import { AMEKAI } from './amekai.js?v=168';
import { GOBOU } from './gobou.js?v=168';
import { MUKADE } from './mukade.js?v=168';
import { HEPPIRI } from './heppiri.js?v=168';
import { ONIBABA } from './onibaba.js?v=168';
// 3章 県中・県南（10/4）：第十四話 蛇骨地蔵 → 第十五話 三春駒 → 第十六話 大多鬼丸 → 第十七話 和泉式部と猫 → 第十八話 天狗のいけにえ
//   → 第十九話 狸森の託善和尚 → 第二十話 カッパのわび証文 → 第二十一話 安珍と清姫（本人 10/4「戦わない3話を戦う形で」＝8話とも戦う）
import { JAKOTSU } from './jakotsu.js?v=168';
import { MIHARUGOMA } from './miharugoma.js?v=168';
import { OTAKIMARU } from './otakimaru.js?v=168';
import { NEKONAKI } from './nekonaki.js?v=168';
import { TENGU } from './tengu.js?v=168';
import { TAKUZEN } from './takuzen.js?v=168';
import { KAPPA } from './kappa.js?v=168';
import { KIYOHIME } from './kiyohime.js?v=168';

export const EPISODES = [MATSUKAWA, KASHINUMA, JAGAN, RYUTO, ZARUKABURI, DAIHISAN, TENAGA, SUMITORA, AMEKAI, GOBOU, MUKADE, HEPPIRI, ONIBABA, JAKOTSU, MIHARUGOMA, OTAKIMARU, NEKONAKI, TENGU, TAKUZEN, KAPPA, KIYOHIME];
