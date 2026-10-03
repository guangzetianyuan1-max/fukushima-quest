import { TitleScene } from './scenes/TitleScene.js?v=84';
import { BattleScene } from './scenes/BattleScene.js?v=84';
import { FieldScene, FIELD_TEXT } from './scenes/FieldScene.js?v=84';
import { ZAKO, ZAKO_TELL } from './data/zako.js?v=84';
import { HARAI } from './field/game.js?v=84';
import { EQUIP } from './data/equip.js?v=84';
import { EPISODES } from './data/episodes.js?v=84';
import { unlock, isUnlocked } from './audio/chip.js?v=84';

// 本人 10/2「松川と戦うまで、BGMが無い」＝iPhone は指を置いた瞬間（pointerdown）では音の出口を開けず、指を離した瞬間・クリックで開く
// ⇒ 画面のどこを さわっても、離した瞬間に音の出口を開け直す（題の画面で一度さわった後だけ。止まっていれば鳴りだす）
for (const ev of ['touchend', 'pointerup', 'click', 'keydown']) {
  document.addEventListener(ev, () => { if (isUnlocked()) unlock(); }, { passive: true, capture: true });
}

const FONT = 'DotGothic16';
const BRUSH = 'Yuji Boku'; // 題の毛筆（本人 10/1「習字で」）
const BRUSH_TEXT = '福島昔話クエストRPG' + EPISODES.map((e) => e.enemy.episode + e.enemy.tale).join('');
// 画面に出る字を全部集めて、字体の読み込みに渡す（足りない字だけ端末の字になるのを防ぐ）
const UI_TEXT = '▶旅の者しおりはどうする？たたかう術語る道具にげる自動中（さわると手動）HP弱点：灯の約束もどるどの術をつかう？道具を薬草×はないもう一度いどむ0123456789/が あらわれた！を しずめた！の こうげき！に ダメージ！となえた！しかし術の力がたりない！もうないつかった！かいふくした！昔話を語りはじめた……弱点は明かされている。にげだした！まわりこまれてしまった！をはいた！うけた！力つきた……語り部の補足必殺技！食べた！わけた！もどった！とりだした。食べる者がいない。名物さわってはじめる音：入切／昔話旅に出るつぎの話へ（）序章のつづきは準備中です黒いもやがひとつ晴れたのこりすっかり術がまっすぐとどく。さえぎられて弱まったまわりにまた立ちこめた●○';
const ALL_TEXT = UI_TEXT + JSON.stringify(EPISODES) + FIELD_TEXT + JSON.stringify([ZAKO, ZAKO_TELL, HARAI, EQUIP]) + '攻守速武器防具お守りなし今だれが着ける？身に着けた引き取ってもらった名物を食べるそうびを見るどうする？ゲームを終わる所持金仲間を生き返らせますか？生き返った人はおらぬようじゃ幽霊憑かいしんのいちげき授かる勝守厄除け守湯本の寺でたのむもどる店に置いていったちずを見るさわるととじる平の城下町湯本の湯の町小名浜の港腕に合った得物を選びな旅の支度ならまかせておくれその人は着けられないつづきからはじめから［］旅をつづける記録した所からやり直す経験手に入れた！お礼にもらったレベルに上がった！もやをはらった逃げきったLv呪霊お祓い供養受ける八幡さまで何をしますか？いたしましょうか？です安らかに去っていった体が軽くなった呪いがとけた自由に動く番屋届いておるぞ返してもらった' + 'まだ旅の記録がありません旅のつづきへ小高の町相馬の城下町セーブして終わる旅を記録してゲームを終わりますか？おつかれさまいまここ急所に命中した一発でしとめた'; // 10/3 足した画面の字

async function start() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`16px "${FONT}"`, ALL_TEXT),
        document.fonts.load(`32px "${BRUSH}"`, BRUSH_TEXT),
        document.fonts.load('33px "Potta One"', '福島昔話クエストRPG平の城下町湯本の湯の町小名浜の港' + EPISODES.map((e) => e.enemy.place).join('')), // 題字と場所
      ]),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  } catch (e) {
    // 字が読めなくても遊べるようにする（端末の字で出る）
  }
  // 確かめ用の取っ手：ブラウザから window.fqGame で場面を動かせる（遊ぶ人には見えない）
  window.fqGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: 360,
    height: 640,
    backgroundColor: '#000000',
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [TitleScene, FieldScene, BattleScene], // 題の画面 → 歩く地図 ⇄ 戦い
  });
}

start();
