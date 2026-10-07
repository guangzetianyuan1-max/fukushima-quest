// 歩く地図の人物（Gemini の絵・2026-10-02。art_src/prep_people.py が assets/people/ に出す）
// 旅の者・しおり＝16コマ（正面0〜3／後ろ4〜7／左8〜11／右12〜15＝左の裏返し）・足の運び4コマ
// 町の人＝正面の足踏み2コマ（向きは変わらない）
// 1コマ 36×42 ドット。足もとをマスの中心から14ドット下に置く（origin y＝1−14/42）
import { EXTRA_LOOKS } from '../data/look_assets.js?v=235';

export const DIRS = ['down', 'up', 'left', 'right'];
// 仲間（本人 10/2：猟師・閼伽井嶽の僧）も旅の者・しおりと同じ16コマ
export const HEROES = ['tabi', 'shiori', 'kariudo', 'sou'];
// 力つきた仲間の幽霊（本人 10/2「死んだら幽霊のキャラを作りたい」）＝並びは旅の者・しおりと同じ16コマ
export const GHOSTS = HEROES.map((id) => `${id}_ghost`);
export const NPC_LOOKS = ['kannushi', 'osho', 'okami', 'shonin', 'kaji', 'ryoshi', 'yakunin', 'machibito', 'musume', 'kodomo', 'chaya', 'toshiyori', 'kashira']; // kashira＝黒脛巾組の頭（10/4 夜）
export const FRAME_W = 36;
export const FRAME_H = 42;
export const ORIGIN_Y = 1 - 14 / FRAME_H;

export function frameOf(dir, step, look = 'tabi') {
  if (!HEROES.includes(look) && !GHOSTS.includes(look) && !EXTRA_LOOKS.includes(look)) return step % 2;
  return DIRS.indexOf(dir) * 4 + (step % 4);
}

export function preloadPeople(scene) {
  for (const n of [...HEROES, ...GHOSTS, ...NPC_LOOKS, ...EXTRA_LOOKS]) {
    if (!scene.textures.exists(`p-${n}`)) scene.load.spritesheet(`p-${n}`, `assets/people/${n}.png`, { frameWidth: FRAME_W, frameHeight: FRAME_H });
  }
}
