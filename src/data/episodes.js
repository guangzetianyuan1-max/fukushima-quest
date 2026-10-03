// 遊ぶ順（話数＝順路の順・本人 10/1）。題の画面は先頭の話を出し、勝つと「つぎの話へ」で次へ進む
// 序章：第一話 松川様 → 第二話 賢沼の大うなぎ → 第三話 蛇岸淵（淵の主）→ 第四話 龍燈
import { MATSUKAWA } from './matsukawa.js?v=114';
import { KASHINUMA } from './kashinuma.js?v=114';
import { JAGAN } from './jagan.js?v=114';
import { RYUTO } from './ryuto.js?v=114';
// 1章 相馬（10/3）：第五話 ザルカブリ山 → 第六話 大悲山の大蛇 → 第七話 手長明神 → 第八話 虎捕山の白狼（橘墨虎）
import { ZARUKABURI } from './zarukaburi.js?v=114';
import { DAIHISAN } from './daihisan.js?v=114';
import { TENAGA } from './tenaga.js?v=114';
import { SUMITORA } from './sumitora.js?v=114';
// 2章 県北（10/4）：第九話 飴買い幽霊 → 第十話 ご坊狐 → 第十一話 ムカデとオロチ → 第十二話 へっぴり嫁 → 第十三話 安達ヶ原の鬼婆
import { AMEKAI } from './amekai.js?v=114';
import { GOBOU } from './gobou.js?v=114';
import { MUKADE } from './mukade.js?v=114';
import { HEPPIRI } from './heppiri.js?v=114';
import { ONIBABA } from './onibaba.js?v=114';

export const EPISODES = [MATSUKAWA, KASHINUMA, JAGAN, RYUTO, ZARUKABURI, DAIHISAN, TENAGA, SUMITORA, AMEKAI, GOBOU, MUKADE, HEPPIRI, ONIBABA];
