import { FONT_NAME, TITLE_WEIGHT } from './ui/fonts.js?v=169';
import { TitleScene } from './scenes/TitleScene.js?v=169';
import { JobScene } from './scenes/JobScene.js?v=169';
import { BattleScene } from './scenes/BattleScene.js?v=169';
import { FieldScene, FIELD_TEXT } from './scenes/FieldScene.js?v=169';
import { ZAKO, ZAKO_TELL } from './data/zako.js?v=169';
import { HARAI } from './field/game.js?v=169';
import { EQUIP } from './data/equip.js?v=169';
import { EPISODES } from './data/episodes.js?v=169';
import { unlock, isUnlocked } from './audio/chip.js?v=169';
import { askTerms } from './ui/terms.js?v=169';
import { watchUpdates, newerOnLaunch, reloadTo } from './ui/update.js?v=169';
import { showLoading, preloadImages } from './ui/loading.js?v=169';
import { PRELOAD_ASSETS } from './data/preload_assets.js?v=169';

// 本人 10/2「松川と戦うまで、BGMが無い」＝iPhone は指を置いた瞬間（pointerdown）では音の出口を開けず、指を離した瞬間・クリックで開く
// ⇒ 画面のどこを さわっても、離した瞬間に音の出口を開け直す（題の画面で一度さわった後だけ。止まっていれば鳴りだす）
for (const ev of ['touchend', 'pointerup', 'click', 'keydown']) {
  document.addEventListener(ev, () => { if (isUnlocked()) unlock(); }, { passive: true, capture: true });
}

const FONT = FONT_NAME; // ドットのゴシック（10/4 夜 明朝体を試して 本人「全てドットのゴシックに」）
const BRUSH = FONT_NAME; // 題字と巻物も同じ字（前＝毛筆）
const BRUSH_TEXT = '福島昔話クエストRPG' + EPISODES.map((e) => e.enemy.episode + e.enemy.tale).join('');
// 画面に出る字を全部集めて、字体の読み込みに渡す（足りない字だけ端末の字になるのを防ぐ）
const UI_TEXT = '▶旅の者しおりはどうする？たたかう術語る道具にげる自動中（さわると手動）HP弱点：灯の約束もどる戻るどの術をつかう？道具を薬草×はないもう一度いどむ0123456789/が あらわれた！を しずめた！の こうげき！に ダメージ！となえた！しかし術の力がたりない！もうないつかった！かいふくした！昔話を語りはじめた……弱点は明かされている。にげだした！まわりこまれてしまった！をはいた！うけた！力つきた……語り部の補足必殺技！食べた！わけた！もどった！とりだした。食べる者がいない。名物さわってはじめる音：入切／昔話旅に出るつぎの話へ（）序章のつづきは準備中です黒いもやがひとつ晴れたのこりすっかり術がまっすぐとどく。さえぎられて弱まったまわりにまた立ちこめた●○';
// 相馬の道場と武士（10/4）の字
const DOJO_TEXT = '武士道場の師範一本取られた勝ち見事その太刀筋まことの認めよう免状をさずける流奥義居合い斬り抜く瞬すべてこめよおぼえた出直してこい一閃光筋えがく刀柄に手をかけた刃はばんだ鈍った木刀打ちこみ本目はじめ精進されよ試し合い受けますか先に取れば見ておれよかろう腕覚えができたらいつでも来い';
const ALL_TEXT = DOJO_TEXT + UI_TEXT + JSON.stringify(EPISODES) + FIELD_TEXT + JSON.stringify([ZAKO, ZAKO_TELL, HARAI, EQUIP]) + '攻守速武器防具お守りなし今だれが着ける？身に着けた引き取ってもらった名物を食べるそうびを見るどうする？ゲームを終わる所持金仲間を生き返らせますか？生き返った人はおらぬようじゃ幽霊憑かいしんのいちげき授かる勝守厄除け守湯本の寺でたのむもどる店に置いていったちずを見るさわるととじる平の城下町湯本の湯の町小名浜の港腕に合った得物を選びな旅の支度ならまかせておくれその人は着けられないつづきからはじめから［］旅をつづける記録した所からやり直す経験手に入れた！お礼にもらったレベルに上がった！もやをはらった逃げきったLv呪霊お祓い供養受ける八幡さまで何をしますか？いたしましょうか？です安らかに去っていった体が軽くなった呪いがとけた自由に動く番屋届いておるぞ返してもらった' + 'まだ旅の記録がありません旅のつづきへ小高の町相馬の城下町セーブして終わる旅を記録してゲームを終わりますか？おつかれさまいまここ急所に命中した一発でしとめた'; // 10/3 足した画面の字

async function start() {
  // ⭐起動のローディングバー（本人 10/4「はじめの画面にローディングバーを表示し、毎回データ更新を」）＝最新の版を確かめる → 字 → よく使う絵
  const bar = showLoading();
  bar.set(0.03, '最新の版を 確かめています');
  const nv = await newerOnLaunch();
  if (nv) {
    bar.set(0.1, `新しい版（版${nv}）に 更新しています`);
    reloadTo(nv);
    return;
  }
  bar.set(0.1, '字を 読み込んでいます');
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`16px "${FONT}"`, ALL_TEXT),
        document.fonts.load(`${TITLE_WEIGHT} 32px "${BRUSH}"`, BRUSH_TEXT + '福島昔話クエストRPG平の城下町湯本の湯の町小名浜の港' + EPISODES.map((e) => e.enemy.place).join('')), // 題字・巻物・場所（太字）
      ]),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  } catch (e) {
    // 字が読めなくても遊べるようにする（端末の字で出る）
  }
  await preloadImages(PRELOAD_ASSETS, (k, n) => bar.set(0.15 + 0.85 * (k / n), `絵を 読み込んでいます ${Math.round((100 * k) / n)}%`));
  bar.done();
  // 遊ぶ前の利用規約（本人 10/4「こちらに責任が被らない書面チェック機構」）＝同意するまで ゲームを始めない
  await askTerms();
  // 遊んでいる間の自動更新（裏から戻った時など・表紙ならすぐ読み直し、途中は知らせだけ）
  watchUpdates(() => !window.fqGame || window.fqGame.scene.isActive('title'));
  // 確かめ用の取っ手：ブラウザから window.fqGame で場面を動かせる（遊ぶ人には見えない）
  window.fqGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: 360,
    height: 640,
    backgroundColor: '#000000',
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [TitleScene, JobScene, FieldScene, BattleScene], // 題の画面 →（はじめから）職業を選ぶ → 歩く地図 ⇄ 戦い
  });
}

start();
