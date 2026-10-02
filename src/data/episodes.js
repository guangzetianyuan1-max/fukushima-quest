// 遊ぶ順（話数＝順路の順・本人 10/1）。題の画面は先頭の話を出し、勝つと「つぎの話へ」で次へ進む
// 序章：第一話 松川様 → 第二話 賢沼の大うなぎ → 第三話 蛇岸淵（淵の主）→ 第四話 龍燈
import { MATSUKAWA } from './matsukawa.js?v=78';
import { KASHINUMA } from './kashinuma.js?v=78';
import { JAGAN } from './jagan.js?v=78';
import { RYUTO } from './ryuto.js?v=78';

export const EPISODES = [MATSUKAWA, KASHINUMA, JAGAN, RYUTO];
