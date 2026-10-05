// 歩く地図（いわき）と町の中。本人 10/1「本来のドラクエらしく、山川を歩く、町で買い物や宿泊は？」
// 上 y0〜420 に地図（1マス32ドット・旅の者が真ん中、しおりと加わった仲間が1歩ずつうしろに続く）／下の窓に十字キーと「はなす」「どうぐ」
// 話す・店・宿の文と選びも下の窓（そのあいだ十字キーは隠す）
// 旅の状態は registry の 'game'（計算は src/field/game.js）。地図が変わる（町に入る・出る）たびに この場面を始め直す
import { collection, PER_PAGE } from '../field/collection.js?v=185';
import { GAME_FONT, TITLE_WEIGHT } from '../ui/fonts.js?v=185';
import { EPISODES } from '../data/episodes.js?v=185';
import { ITEMS, PRICE, itemNote } from '../data/items.js?v=185';
import { FISH, PRIZES, ROD_PRICE, BITE_WINDOW_MS, WAIT_MS, rollFish, zoneStart, inZone, rentRod, addCatch, exchange } from '../field/fishing.js?v=185';
import { RIDERS } from '../data/nomaoi_assets.js?v=185';
import { FLAGS, FLAG_PRIZES, ENTRY_PRICE, ROUND_MS, CATCH_P, newRace, stepRace, racePts, flagX, fallP, enterRace, addFlags, exchangeFlag } from '../field/nomaoi.js?v=185';
import { TILE } from '../field/tiles.js?v=185';
import { GROUNDS, OBJECTS, fieldLook, townLook } from '../field/look.js?v=185';
import { preloadKit, makeWindow, makeButton, makePad, paginate } from '../ui/kit.js?v=185';
import { preloadPeople, frameOf, ORIGIN_Y } from '../field/sprites.js?v=185';
import { TOWNS, TOWN_OF, TOWN_CARD_NAME, townCardName } from '../field/towns.js?v=185';
import { KANBAN, kanbanAt } from '../field/kanban.js?v=185';
import { AILMENTS, badgesOf, hpColor } from '../field/ailments.js?v=185';
import { smooth, BRUSH_FONT } from '../ui/scroll.js?v=185';
import {
  mapRows, terrainAt, canWalk, tileNameAt, DELTA, BOSS_AT, WALL_OPENED_BY, SAVE_KEY, maxOf,
  enterTown, leaveTown, buy, stayInn, save, autoSaveAfterBoss, useItem, walkStep, encounterAt,
  purify, kuyo, returnStolen, HARAI_PRICE, KUYO_PRICE, revive, revivePrice, NAME, nameOf, isField, crossAt, WALL_QUEST_LINES,
  wallQuestLines, startDuel, learnSkill,
} from '../field/game.js?v=185';
import { JOBS, JOB_SPELLS, QUESTS, jobOf } from '../data/jobs.js?v=185';
import { newMondo, answerMondo, mondoDone, mondoPassed, MONDO_COUNT, MONDO_PASS } from '../field/mondo.js?v=185';
import { newMato, shootMato, matoX, matoDone, matoPassed, MATO_ARROWS, MATO_PASS, MATO_HALF } from '../field/mato.js?v=185';
import { membersOf } from '../battle/levels.js?v=185';
import { COMPANIONS, LEARN_AFTER_LOSS, KUNOICHI } from '../data/companions.js?v=185';
import { ICON_IDS } from '../data/icons.js?v=185';
import { FACE_IDS, KUNOICHI_FACES } from '../data/faces.js?v=185';
import { EXTRA_LOOKS } from '../data/look_assets.js?v=185';
import { mapPointOf } from '../field/mapcard.js?v=185';
import { FISHING_ICON_IDS } from '../data/icons_fishing.js?v=185';
import { makeRng } from '../battle/rules.js?v=185';
import { newRun, tapRun, stepRun, runPos, beamX, LANES as KW_LANES, STRIKES as KW_STRIKES, TIME_MS as KW_TIME } from '../field/kagewatari.js?v=185';
import { EQUIP, SLOTS, SLOT_NAME, equipNote, diffNote, diffDown, canWear } from '../data/equip.js?v=185';
const START_EQUIP = {}; // 前の形の名残（職業の旅は game.equip）
import { buyEquip, partyView, soakOnsen, ONSEN_PRICE, prayGojinka, afterKagewatari, CASTLE_CHARS } from '../field/game.js?v=185';
import { sfx, startBgm, stopBgm, playJingle, jingleSeconds } from '../audio/chip.js?v=185';
import { newRound as newTaimatsu, tapAt as tapTaimatsu, sparkX, torchX, target as taimatsuTarget, roundDone as taimatsuDone, timeLeft as taimatsuLeft, roundPts as taimatsuPts, enterRound as enterTaimatsu, addTorches, TAIMATSU_PRIZES, exchangeTaimatsu, ENTRY_PRICE as TAIMATSU_PRICE, TORCHES as TAIMATSU_TORCHES, TIME_MS as TAIMATSU_MS, HALF as TAIMATSU_HALF } from '../field/taimatsu.js?v=185';
import { newRound, tapAt, roundEnd as roundEndAt, roundPts as chochinPts, enterRound, addLanterns, CHOCHIN_PRIZES, exchangeChochin, ENTRY_PRICE as CHOCHIN_PRICE, LANTERNS as CHOCHIN_LANTERNS, BEAT_MS as CHOCHIN_BEAT, OK_MS as CHOCHIN_OK, KAGURA_PASS, KAGURA_MISS, kaguraPassed } from '../field/chochin.js?v=185';

// 景品の窓（釣り＝小名浜の釣り番／旗＝雲雀ヶ原の世話役）。同じ窓を 点の名前と景品の表だけ替えて使う
const PRIZE_SHOPS = {
  chochin: { key: 'chochinPts', label: '提灯点', prizes: CHOCHIN_PRIZES, exchange: exchangeChochin, back: 'chochinMenu', keeper: '世話役' },
  fish: { key: 'fishPts', label: '釣り点', prizes: PRIZES, exchange, back: 'fishMenu', keeper: '釣り番' },
  flag: { key: 'flagPts', label: '旗点', prizes: FLAG_PRIZES, exchange: exchangeFlag, back: 'nomaoiMenu', keeper: '世話役' },
  taimatsu: { key: 'taimatsuPts', label: '松明点', prizes: TAIMATSU_PRIZES, exchange: exchangeTaimatsu, back: 'taimatsuMenu', keeper: '世話役' },
};

const W = 360;
const MAP_H = 420; // 地図の見える高さ
const CELL = TILE * 2;
const SEA_SHIFT = 96; // 相馬でカメラを右へずらす量（3マス）＝道（x=20）から海（x=28〜）が見える
const PANEL_Y = 426;
// 選びの1行の高さと字（本人 10/4「文字が小さく、他のコマンドを押してしまう」）。窓を伸ばすのは上の札（HP・文）の下まで
// 歩く地図の倍率（本人 10/4「拡大縮小のカーソル」）。小さいほど広く見渡せる
export const FIELD_ZOOMS = [0.35, 0.6, 1];
export const MENU_ROW = 46;
export const MENU_FS = 22;
const MENU_TOP = 176;
const STEP_MS = 170; // 1歩の速さ
const FONT = GAME_FONT; // ui/fonts.js（ドットのゴシック）
const style = (size = 20, color = '#ffffff') => ({
  fontFamily: FONT, fontSize: `${size}px`, color, resolution: 3, wordWrap: { width: 318, useAdvancedWrap: true }, lineSpacing: 8,
});

const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
const NAMES = NAME;
// 歩く絵の名前（昔話の味方は自分の絵が届くまで町の人の絵を借りる）。幽霊の絵があるのは旅の者・しおり
// 武士になった旅の者は 武士の絵（本人 10/4「武士になったら、キャラクターの見た目も更新したい」・絵が届くまでは旅の者のまま）
// 着替えた姿（武士・くノ一）は 絵が届いていれば その姿で歩く（EXTRA_LOOKS）
// 10/5 職業の旅：主人公としおりは いまの姿のまま（本人）。仲間2人は 職業の人物＝絵が届くまで 歩く絵（16コマ）のある姿を借り、色で分ける
export const JOB_LOOK = {
  bushi: ['bushi'], sou: ['sou'], yojutsu: ['kunoichi', 0xd8c0ff], ninja: ['kunoichi'], rikishi: ['kariudo', 0xffd8b8],
  yumi: ['kariudo'], miko: ['kunoichi', 0xffd0d0], onmyo: ['sou', 0xc8d8ff], kusushi: ['kunoichi', 0xd0ffd8], yamabushi: ['sou', 0xfff0b8],
};
// 職業の人物の絵が届いたら（EXTRA_LOOKS に 'job_<職業>'・art_src/Geminiプロンプト_職業10人.md）その絵で歩き、色は変えない
const ownLook = (id) => EXTRA_LOOKS.includes(`job_${id}`);
const lookOf = (id, g) => (id === 'tabi' || id === 'shiori' ? id : ownLook(id) ? `job_${id}` : JOB_LOOK[id]?.[0] ?? COMPANIONS[id]?.look ?? id);
const tintOf = (id) => (id === 'tabi' || id === 'shiori' || ownLook(id) ? null : JOB_LOOK[id]?.[1] ?? null);
const HAS_GHOST = ['tabi', 'shiori', 'kariudo', 'sou'];

// もやの壁にぶつかったとき、しおりが言う手がかり
const WALL_HINT = {
  1: '鮫川の 河口の うずを しずめれば、この もやも 晴れるはず。',
  2: '賢沼の ぬしを しずめたら、この もやも 晴れると 思う。',
  3: '好間川の 淵の ぬしを しずめましょう。峠の もやは それからね。',
  4: '閼伽井嶽の 龍の 灯を 取りもどせば、北の 相馬への 道も 開くはず。',
  5: '金谷の 山の 化け物に 会って、獲りすぎないと 誓えば、大悲山への もやも 晴れると 思う。',
  6: '大悲山の 大蛇を 何とか しないと、北へは 行けないわ。',
  7: '鹿狼山の 手長明神さまを 元に もどせば、虎捕山への もやも 晴れるはず。',
  // 2章 県北（10/4）
  8: '虎捕山の 墨虎を 捕らえて、相馬の 町の 道場で 師範に 認めて もらえば、西の 県北への 口も 開くはず。',
  9: '霊山の 墓地の 母の 霊を しずめたら、福島への もやも 晴れると 思う。',
  0: '信夫山の ご坊狐を 元に もどせば、山の 奥への もやも 晴れるはず。',
  '%': '信夫山の ムカデと オロチを しずめないと、南の 川俣へは 行けないわ。',
  '&': '川俣の へっぴり嫁さんを 迎えて あげたら、二本松への もやも 晴れると 思う。',
  // 3章 県中・県南（10/4）
  '(': '安達ヶ原の 鬼婆を しずめないと、南の 郡山へは 行けないわ。',
  ')': '日和田の 西方寺の 大蛇を しずめたら、郡山への もやも 晴れると 思う。',
  '}': '三春の 木の 馬たちを 元に もどせば、大滝根山への もやも 晴れるはず。',
  '[': '大滝根山の 大多鬼丸を 元に もどせば、南の 石川への もやも 晴れるはず。',
  '<': '猫啼の 泉の 猫を 元に もどしたら、東の 鮫川への もやも 晴れると 思う。',
  ']': '鮫川の 天狗を しずめないと、西の 須賀川へは 行けないわ。',
  '>': '狸森の 託善和尚さまを 元に もどせば、天栄の 谷への もやも 晴れるはず。',
  '{': '天栄の カッパを 元に もどしたら、白河への もやも 晴れると 思う。',
};
// ボスを元に戻して歩く地図へ帰ったときの、しおりの一言
const CLEARED_LINES = {
  matsukawa: ['鮫川の 橋の もやが 晴れたわ！', '北へ 行けば、小名浜・湯本・平の 町が あるの。賢沼にも 行けるわ。'],
  kashinuma: ['平の 北、好間川の 橋の もやが 晴れたわ！', '好間川の 淵に、また 黒い うずが あるみたい。'],
  jagan: ['閼伽井嶽へ 登る 峠の もやが 晴れたわ！', '山の上の お寺で、龍の 灯が 消えかけているの。'],
  ryuto: ['これで いわきの 昔話は みんな 元に もどったわ。', '北の 口の もやが 晴れた！ 1章「相馬」へ 行けるわ。いわきの 地図の いちばん 北よ。'],
  // 1章 相馬（10/3）
  zarukaburi: ['大悲山への 入口の もやが 晴れたわ！', '大悲山の 薬師堂の 池に、大蛇が いるそうよ。小高の 町で 支度を しましょう。'],
  daihisan: ['北の 浜街道の もやが 晴れたわ！', '北に 相馬の 町が あるの。その 先の 鹿狼山に、手長明神さまが いらっしゃるわ。'],
  tenaga: ['虎捕山への 山道の もやが 晴れたわ！', '虎捕山には、凶賊 橘墨虎が 隠れているの。相馬の 町で しっかり 支度してね。'],
  sumitora: ['これで 相馬の 昔話は みんな 元に もどったわ。', '虎捕山の 西の 口の もやが うすく なった……。相馬の 町の 道場で 師範に 腕を 認めて もらえば、西の 県北へ 進めるはずよ。'],
  // 2章 県北（10/4）
  amekai: ['福島への 道の もやが 晴れたわ！', '福島の 町で 支度を しましょう。北の 信夫山に、化け狐が いるそうよ。'],
  gobou: ['信夫山の 奥への もやが 晴れたわ！', '北の 坂と 黒沼に、大きな ムカデと オロチが いるの。どちらも「信夫山の 主」を 名乗っているそうよ。'],
  mukade: ['南の 川俣への 道の もやが 晴れたわ！', '川俣の 村に、何かを こらえている お嫁さんが いるそうよ。'],
  heppiri: ['二本松への 道の もやが 晴れたわ！', '二本松の 町で 支度を しましょう。安達ヶ原の 観世寺の 岩屋に、鬼婆が いるの……おそろしく 強いそうよ。'],
  onibaba: ['これで 県北の 昔話は みんな 元に もどったわ。', '二本松の 南の 口の もやが 晴れた！ 3章「県中・県南」へ 行けるわ。'],
  // 3章 県中・県南（10/4）
  jakotsu: ['郡山への 街道の もやが 晴れたわ！', '郡山の 町で 支度を しましょう。東の 三春に、木の 馬の 話が 伝わっているの。'],
  miharugoma: ['大滝根山への 山道の もやが 晴れたわ！', '三春駒の 術を 授かったわ。この 木の 馬たちが、大多鬼丸の 弱みに なるの。'],
  otakimaru: ['南の 石川への 道の もやが 晴れたわ！', '石川の 猫啼の 泉に、鳴きつづける 猫が いるそうよ。'],
  nekonaki: ['東の 鮫川への もやが 晴れたわ！', '猫啼の 湯に つかれるように なったわ。鮫川の 山奥には、天狗が 出るそうよ。'],
  tengu: ['西の 須賀川への 道の もやが 晴れたわ！', '須賀川の 町で 支度を しましょう。町の 東の 狸森に、ふしぎな お坊さまの 話が あるの。'],
  takuzen: ['天栄の 谷への もやが 晴れたわ！', '託善和尚さまが 教えてくれたわ。天栄の カッパは、石の 証文を いちばん こわがるって。'],
  kappa: ['南の 白河への 道の もやが 晴れたわ！', '白河の 町で 支度を しましょう。安珍堂に……おそろしい ものが 待っているの。'],
  kiyohime: ['これで 県中と 県南の 昔話は みんな 元に もどったわ。', '3章「県中・県南」の 旅は ここまで。つづきは 準備中です。'],
};
// いわきの北の口から 相馬へ入ったとき（1章の始まり）
const CROSS_KENPOKU = [
  { text: '虎捕山を 越えて 西へ。ここから 2章「県北」。' },
  { speaker: 'しおり', text: '霊山の ふもとよ。夜に 飴を 買いに くる 女の 人の 話が 伝わっているの。' },
  { speaker: 'しおり', text: '県北の 敵は 相馬より もっと 強いわ。福島の 町で 支度を ととのえましょう。' },
];
const CROSS_KENCHU = [
  { text: '二本松を 南へ。ここから 3章「県中・県南」。' },
  { speaker: 'しおり', text: '日和田の 西方寺には、大蛇の 骨で 作った お地蔵さまの 話が 伝わっているの。' },
  { speaker: 'しおり', text: 'ここの 敵は 県北より もっと 強いわ。郡山の 町で 支度を ととのえましょう。' },
];
const CROSS_SOMA = [
  { text: '浜街道を 北へ。ここから 1章「相馬」。' },
  { speaker: 'しおり', text: '南相馬の 小高よ。金谷の 山に、ざるの ような 頭の 化け物が 出るそうなの。' },
  { speaker: 'しおり', text: '相馬の 道の 敵は いわきより 強いわ。小高の 町で 支度を ととのえましょう。' },
];
// はじめの台詞（10/5 名前を付けたら しおりが 名前で呼ぶ）
const introOf = (g) => (g?.heroName ? INTRO.map((m) => ({ ...m, text: m.text.replace('ようこそ、旅の人。', `ようこそ、${g.heroName}さん。`) })) : INTRO);
const INTRO = [
  { text: 'ここは 勿来の関。むかしから 歌に よまれた、みちのくの 入口。' },
  { speaker: 'しおり', text: 'ようこそ、旅の人。わたしは しおり。昔話の 語り部よ。' },
  { speaker: 'しおり', text: 'このごろ 昔話が 忘れられて、黒い もやが あちこちの 道を ふさいでいるの。' },
  { speaker: 'しおり', text: 'まずは すぐ 東の 鮫川の 河口へ。もやの うずを しずめに 行きましょう。' },
];

// 雲雀ヶ原の世話役としおりの言葉（確かめた事だけ：会場＝雲雀ヶ原祭場地・甲冑競馬・花火で打ち上げた神旗を騎馬武者が奪い合う。日取りは書かない）
// 二本松の提灯祭り（10/4・2章のイベント）＝確かめた事だけ語る（二本松神社の例大祭・宵祭りに7つの町の太鼓台・御神火を提灯に灯す・1台に約300の提灯）
const CHOCHIN_LINES = {
  intro: [
    'ここは 二本松の 提灯祭り。二本松神社の 例大祭で、もう 三百五十年あまり 続いて いるんだ。',
    '宵祭りには 七つの 町の 太鼓台が 集まって、神社の 御神火を 紅い 提灯に 灯す。一台に 三百もの 提灯だ。',
    '太鼓に 合わせて さわれば、提灯が 灯る。灯した 十個で 提灯点 一点。点は 景品と 換えて やるぞ。',
  ],
  after: '二本松の 提灯祭りは、日本三大 提灯祭りの 一つにも 数えられて いるのよ。',
  none: '……輪が 太鼓に 重なる 瞬間に さわるのが こつよ。大太鼓の 拍は 二倍 灯るわ。',
};
const NOMAOI_LINES = {
  intro: [
    'ここは 雲雀ヶ原の 祭場地。相馬野馬追では、甲冑を 着た 騎馬武者が ここに 集まるんだ。',
    '花火で 打ち上げた 神旗を、馬で 追って 奪い合う。神旗争奪戦だ。馬は 貸して やろう。',
    '取った 旗は 旗点に なる。点は 景品と 換えて やるぞ。',
  ],
  after: '相馬野馬追の 雲雀ヶ原では、甲冑競馬と 神旗争奪戦が 行われるのよ。',
  none: '……ほかの 騎馬武者は 手ごわいわね。花火が 上がったら すぐ、旗の 真下へ 走るのが こつよ。',
};

// 字体の読み込みに渡す、この画面の字
export const FIELD_TEXT = JSON.stringify([WALL_HINT, TOWN_CARD_NAME, KANBAN.map((k) => [k.name, k.lines]), '立て札', WALL_QUEST_LINES, CHOCHIN_LINES, '提灯点よいまあそこまで灯した個太鼓台に乗る景品と換える', CLEARED_LINES, INTRO, CROSS_SOMA, CROSS_KENPOKU, CROSS_KENCHU, TOWNS, ITEMS, NOMAOI_LINES, FLAGS])
  + '装備中変わらない厄除け無しいまとくらべて右は品の強さ' // 10/3 装備の注記
  + '神旗を追う旗点景品と換えるそこまで！取ったなかった金のもあった！のこり本点画面をおさえた方へ馬が走る花火が上がったら、旗の下へ！世話役陣羽織'
  + 'はなすどうぐ文HP旅の者しおりいわき何を買う？やめる買った！足りないようだ……お泊まりになりますか？はいいいえひと晩でございますお代がゆっくり湯につかってつかれがすっかりとれた！お参りして旅を記録しますか？記録を残した八幡さまは武運の神さまと伝わる端末では残せないとくに何もないみたい黒いもやが道をふさいでいるうずまいている食べた回復した使えない▼▲◀▶';

export class FieldScene extends Phaser.Scene {
  constructor() {
    super('field');
  }

  // 地図の絵（Gemini の部品・art_src/prep_tiles.py が assets/tiles/ に出す）
  preload() {
    for (const g of GROUNDS) if (!this.textures.exists(`g_${g}`)) this.load.image(`g_${g}`, `assets/tiles/g_${g}.png`);
    for (const o of OBJECTS) if (!this.textures.exists(`o_${o}`)) this.load.image(`o_${o}`, `assets/tiles/o_${o}.png`);
    preloadKit(this);
    preloadPeople(this);
    for (const id of [...ICON_IDS, ...FISHING_ICON_IDS]) if (!this.textures.exists(`icon_${id}`)) this.load.image(`icon_${id}`, `assets/icons/${id}.png`);
    if (!this.textures.exists('bg_fishing')) this.load.image('bg_fishing', 'assets/bg_fishing.png'); // 小名浜の釣り場（Gemini・夕焼けと灯台と桟橋）
    if (!this.textures.exists('bg_nomaoi')) this.load.image('bg_nomaoi', 'assets/bg_nomaoi.png');
    RIDERS.forEach((u, i) => { if (!this.textures.exists(`nomaoi_rider_${i}`)) this.load.image(`nomaoi_rider_${i}`, u); }); // 騎馬の絵（届いた物だけ） // 雲雀ヶ原の神旗争奪戦（Gemini・10/4・art_src/prep_nomaoi.py）
    // 一枚絵（町の入口・章の地図＝Gemini 4組目・art_src/prep_cards.py）
    for (const k of [...Object.keys(TOWNS).filter((t) => !TOWNS[t].cardPending).map((t) => `town_${t}`), 'map']) if (!this.textures.exists(`card_${k}`)) this.load.image(`card_${k}`, `assets/cards/${k}.png`);
    for (const f of ['normal', 'surprise', 'sad', ...FACE_IDS]) if (!this.textures.exists(`face_${f}`)) this.load.image(`face_${f}`, `assets/cards/face_${f}.png`);
    for (const f of KUNOICHI_FACES) if (!this.textures.exists(`face_k_${f}`)) this.load.image(`face_k_${f}`, `assets/cards/face_k_${f}.png`);
  }

  create() {
    // ⚠町に入る・出る・戦いから帰るたびに作り直す＝前の部品（消えた字）を忘れてから作る
    this.statusText = null;
    this.memberUi = []; // 上の札の1人ずつの字（前の回の字は消えている）
    this.zoomLabel = null; // 倍率の字（歩く地図だけ・前の回の字は消えている）
    this.moneyText = null;
    this.g = this.registry.get('game');
    // 場面を作り直すと 前の回の 遊びの取っ手が残る（Phaser は同じ場面の物を使い回す）＝10/5 夜 試運転で 2章の神楽・的当てが 前の回の取っ手で動いた
    this.kagura = null;
    this.mato = null;
    this.taimatsu = null;
    this.kagewatari = null;
    this.mondo = null;
    this.mapId = this.g.pos.map;
    this.rows = mapRows(this.mapId);
    this.town = TOWNS[this.mapId] ?? null;

    // ---- 地図：地面を敷き、上に置く物を下の段から順に重ねて、1枚の絵に焼く ----
    // （地図の中身は この場面の間は変わらない＝もやの壁が晴れるのは戦いのあとで、場面ごと作り直す）
    const mapW = this.rows[0].length * CELL;
    const mapH = this.rows.length * CELL;
    this.layer = this.add.renderTexture(0, 0, mapW, mapH).setOrigin(0);
    const objs = [];
    this.rows.forEach((r, y) => [...r].forEach((ch, x) => {
      const look = isField(this.mapId) ? fieldLook(this.g, ch, x, y, this.mapId) : townLook(ch, x, y);
      this.layer.stamp(`g_${look.ground}`, null, x * CELL, y * CELL, { originX: 0, originY: 0 });
      for (const o of look.objs) objs.push({ key: `o_${o}`, x, y, w: 1, h: 1 });
    }));
    for (const pr of this.town?.props ?? []) objs.push({ key: `o_${pr.img}`, x: pr.x, y: pr.y, w: pr.w, h: pr.h });
    objs.sort((a, b) => (a.y + a.h) - (b.y + b.h));
    for (const o of objs) {
      // 幅を w マスに合わせて縮め（大きい物だけ）、下の辺をマスの下にそろえる。1マスの物は元の大きさのまま真ん中に
      const src = this.textures.get(o.key).getSourceImage();
      const k = o.w > 1 ? (o.w * CELL) / src.width : 1;
      const cx = (o.x + o.w / 2) * CELL;
      const by = (o.y + o.h) * CELL;
      this.layer.stamp(o.key, null, cx, by, { originX: 0.5, originY: 1, scale: k });
    }

    // ---- 人 ----
    const { x, y, dir } = this.g.pos;
    this.facing = dir ?? 'up';
    this.px = x;
    this.py = y;
    this.step = 0;
    this.npcs = (this.town?.npcs ?? []).map((n) => ({
      ...n, dir: 'down', sprite: this.add.sprite(...this.center(n.x, n.y), `p-${n.look}`, frameOf('down', 0, n.look)).setOrigin(0.5, ORIGIN_Y),
    }));
    // 後ろに続く仲間（しおり・加わった昔話の味方）。1人ずつ前の人の1歩うしろ
    this.followers = [];
    let [fx, fy] = [x, y];
    for (const id of membersOf(this.g).slice(1)) {
      [fx, fy] = this.behind(fx, fy, this.facing);
      this.followers.push({ id, x: fx, y: fy, dir: this.facing });
    }
    // 後ろの人から置く＝前の人が上に重なる
    for (const f of [...this.followers].reverse()) {
      f.sprite = this.add.sprite(...this.center(f.x, f.y), `p-${lookOf(f.id, this.g)}`, frameOf(this.facing, 0, lookOf(f.id, this.g))).setOrigin(0.5, ORIGIN_Y);
      if (tintOf(f.id)) f.sprite.setTint(tintOf(f.id));
    }
    this.shiori = this.followers[0].sprite;
    this.player = this.add.sprite(...this.center(x, y), 'p-tabi', frameOf(this.facing, 0, 'tabi')).setOrigin(0.5, ORIGIN_Y);
    this.refreshGhosts();
    // ⭐地図の城（10/5 夜 本人「上から二本松城に入れない」）：城の真上のマスは通れる（北から城下へ入る道）。
    // 真上に人が立つ間だけ 城の絵を人の手前に重ねる＝屋根に乗って見えない（城の下や横では 人が手前のまま）
    this.castleCovers = [];
    if (isField(this.mapId)) {
      this.rows.forEach((r, cy) => [...r].forEach((ch, cx) => {
        if (CASTLE_CHARS.includes(ch)) this.castleCovers.push({ x: cx, y: cy, img: this.add.image((cx + 0.5) * CELL, (cy + 1) * CELL, 'o_shiro').setOrigin(0.5, 1).setVisible(false) });
      }));
    }
    // 足踏み（昔のドラクエと同じく、立っていても歩くコマを繰り返す）
    this.time.addEvent({ delay: 380, loop: true, callback: () => { this.step += 1; this.refreshFrames(); } });

    // ---- カメラ：地図用（上）と、窓・ボタン用（全体）----
    const cam = this.cameras.main;
    cam.setViewport(0, 0, W, MAP_H);
    cam.setBounds(0, Math.min(0, (mapH - MAP_H) / 2), Math.max(mapW, W), Math.max(mapH, MAP_H));
    cam.startFollow(this.player, true);
    // ⭐相馬は浜街道を歩くとき右に海が見えるよう、カメラを右へずらす（本人 10/4「移動画面の相馬地方は右側に海を入れて欲しい」）。西の山（ザルカブリ・大悲山・虎捕山）へ入ると戻す
    this.camShift = this.seaShiftTarget();
    cam.setFollowOffset(this.camShift, 0);
    cam.setRoundPixels(true);
    cam.setBackgroundColor(isField(this.mapId) ? '#2f5fb3' : '#000000');
    // 拡大・縮小（本人 10/4「移動画面で、拡大縮小のカーソルを入れて欲しい。現在地が分かるように」）＝歩く地図だけ。町は いつもの大きさ
    // 縮小しているあいだは、旅の者の頭の上に赤い矢印（いま ここ）
    this.hereMark = this.add.container(0, 0).setDepth(20).setVisible(false);
    this.hereMark.add(this.add.triangle(0, 0, -12, -24, 12, -24, 0, 0, 0xe02020).setOrigin(0, 0).setStrokeStyle(3, 0xffffff));
    this.hereRing = this.add.circle(0, 0, 18).setStrokeStyle(4, 0xff3030).setDepth(19).setVisible(false);
    this.applyZoom(isField(this.mapId) ? this.registry.get('fieldZoom') ?? 1 : 1);
    this.ui = this.add.container(0, 0);
    this.uiCam = this.cameras.add(0, 0, W, 640);
    cam.ignore(this.ui);
    this.uiCam.ignore([this.layer, ...this.castleCovers.map((c) => c.img), this.hereMark, this.hereRing, this.player, ...this.followers.map((f) => f.sprite), ...this.npcs.map((n) => n.sprite), ...this.makeMistArrows(), ...this.makeKanbanLabels()]);

    this.buildUi();
    this.refreshStatus();

    // ---- さわる・キー ----
    this.held = null;
    this.busy = false;
    this.moving = false;
    this.lastBump = -9999;
    this.input.on('pointerup', () => { this.held = null; });
    this.input.on('pointerdown', () => {
      if (this.busy && this.advance && this.time.now >= this.msgReadyAt) this.advance();
    });
    this.keys = this.input.keyboard?.createCursorKeys();
    this.input.keyboard?.on('keydown-Z', () => this.pressTalk());
    this.input.keyboard?.on('keydown-ENTER', () => (this.busy && this.advance ? (this.time.now >= this.msgReadyAt && this.advance()) : this.pressTalk()));
    this.input.keyboard?.on('keydown-X', () => this.pressItems());

    startBgm(this.fieldBgm());
    cam.fadeIn(300, 0, 0, 0);

    // 旅の始まり／ボスを元に戻して帰ってきたとき
    if (this.g.intro) {
      this.setGame({ ...this.g, intro: false });
      this.time.delayedCall(350, () => this.showMessages(introOf(this.g)));
    } else if (this.g.justEntered === this.mapId) {
      this.setGame({ ...this.g, justEntered: null });
      this.showTownCard();
    } else if (this.g.justLearned) {
      // 必ず負ける1回目のあと（2章 鬼婆）：町の宿で目をさまし、祐慶が 僧に 如意輪の経を 教える（本人 10/4 夜「祐慶に替わるは無しで、赤井岳の僧のまま、祐慶にお経を教わる形で」）
      const le = LEARN_AFTER_LOSS[this.g.justLearned];
      this.setGame({ ...this.g, justLearned: null });
      const learned = le.lines.findIndex((t) => t.includes('おぼえた！'));
      const lines = le.lines.map((text, k) => ({ text, jingle: k === learned ? 'join' : undefined }));
      // 祐慶の姿を 旅の者の前に出し、話し終えたら 町の出口のほうへ 歩いて去る（10/5 夜 本人「祐慶に話しかけられたが、姿が無い」）
      const guest = this.spawnGuest('yukei');
      const bye = lines.length; // 祐慶の最後の台詞のあと
      this.time.delayedCall(350, () => this.showMessages([...lines.slice(0, bye), { text: '祐慶は 熊野へ 帰っていった……', onShow: () => this.leaveGuest(guest) }, { speaker: 'しおり', text: '観音さまの 破魔の 真弓なら、鬼婆に とどくはず。宿で 休んでから、もう一度 観世寺へ 行きましょう。' }], () => { this.leaveGuest(guest); this.closeDialog(); }));
    } else if (this.g.justCrossed) {
      // 地図の口を通ったとき（10/3 1章）：相馬へ入ると章の始まりの一言
      const to = this.g.justCrossed;
      this.setGame({ ...this.g, justCrossed: null });
      if (to === 'soma' && !this.g.cleared.sumitora) this.time.delayedCall(350, () => this.showMessages(CROSS_SOMA));
      if (to === 'kenpoku' && !this.g.cleared.onibaba) this.time.delayedCall(350, () => this.showMessages(CROSS_KENPOKU));
      if (to === 'kenchu' && !this.g.cleared.kiyohime) this.time.delayedCall(350, () => this.showMessages(CROSS_KENCHU));
    } else if (this.g.justCleared) {
      const id = this.g.justCleared;
      // ボスを元に戻したあと、昔話の味方が加わる回はその台詞も続ける（afterWin が justJoined を付ける）
      // 最後の行（「○○が 仲間に 加わった！」）で短い曲を鳴らし、曲が終わるまで止める（本人 10/3「フリーズと短めの音楽」）
      const joined = (this.g.justJoined ?? []).flatMap((j) => COMPANIONS[j].joinLines.map((text, k, all) => ({ text, jingle: k === all.length - 1 ? 'join' : undefined })));
      // ボスを元に戻したら、その場で自動セーブ（本人 10/3「各ボスを倒した時点で、自動セーブをして欲しい。コメント『自動セーブがされた』」）
      const { game, text } = autoSaveAfterBoss(this.g);
      this.setGame(game);
      let stored = false;
      try {
        localStorage.setItem(SAVE_KEY, text);
        stored = true;
      } catch {
        // 端末の決まりで残せないときも、この遊びの間は続けられる
      }
      const saved = { text: stored ? '自動セーブが された。' : '（この 端末では 記録が 残せない ようだ……）' };
      this.time.delayedCall(350, () => this.showMessages([...CLEARED_LINES[id].map((text) => ({ speaker: 'しおり', text })), ...joined, saved]));
    }
  }

  // 力つきた仲間は幽霊の姿で歩く（本人 10/2「死んだら幽霊のキャラを作りたい」＝Gemini の幽霊の絵・少し透ける）
  refreshGhosts() {
    if (!this.player) return;
    for (const [id, s] of [['tabi', this.player], ...this.followers.map((f) => [f.id, f.sprite])]) {
      const dead = !!this.g.party[id]?.dead;
      // 幽霊の絵は「見た目」で引く（10/5 夕：職業の僧が自分の絵で歩くのに、倒れると前の僧の幽霊になった）
      const look = lookOf(id, this.g);
      const key = dead && HAS_GHOST.includes(look) ? `p-${look}_ghost` : `p-${look}`;
      if (s.texture.key !== key) s.setTexture(key, s.frame.name);
      s.setAlpha(dead ? 0.85 : 1);
      // 幽霊の絵がまだ無い者（昔話の味方）は青白く透かす
      if (dead && !HAS_GHOST.includes(look)) s.setAlpha(0.5).setTint(0x9fd0ff);
      else if (!dead && tintOf(id)) s.setTint(tintOf(id));
      else s.clearTint();
    }
  }

  // ---- 黒いもや（道をふさぐ壁・ボスの渦）の上に赤い矢印（本人 10/2「移動画面で、モヤが分かりにくい。上部に赤の矢印を付けて欲しい」）----
  // 晴れた壁・元に戻したボスの場所には出さない。上下にゆっくり揺らす
  // 立て看板の名前を、看板の上に毛筆の字で（地図のカメラだけに映す）
  makeKanbanLabels() {
    if (!isField(this.mapId)) return [];
    return KANBAN.filter((k) => k.map === this.mapId && k.x >= 0).map((k) => {
      const [cx, cy] = this.center(k.x, k.y);
      // 10/5 本人「城や名所の上に 字だけ・ひとまわり大きく」＝目印のマスの上に 16ドット（前は 脇の看板の上に 13）
      return smooth(this.add.text(cx, cy - 22, k.name, {
        fontFamily: BRUSH_FONT, fontSize: '16px', color: '#fff4d6', resolution: 3, stroke: '#2a1a08', strokeThickness: 4,
      }).setOrigin(0.5, 1).setDepth(15));
    });
  }

  makeMistArrows() {
    if (!isField(this.mapId)) return [];
    if (!this.textures.exists('mist_arrow')) {
      const tex = this.textures.createCanvas('mist_arrow', 20, 22);
      const c = tex.getContext();
      const tri = (col, pad) => {
        c.fillStyle = col;
        c.beginPath();
        c.moveTo(10, 21 - pad);
        c.lineTo(1 + pad, 8 + pad / 2);
        c.lineTo(6 + pad / 2, 8 + pad / 2);
        c.lineTo(6 + pad / 2, 1 + pad);
        c.lineTo(14 - pad / 2, 1 + pad);
        c.lineTo(14 - pad / 2, 8 + pad / 2);
        c.lineTo(19 - pad, 8 + pad / 2);
        c.closePath();
        c.fill();
      };
      tri('#2a0a0a', 0); // 黒い縁
      tri('#e8302a', 2); // 赤
      tex.refresh();
    }
    const arrows = [];
    this.rows.forEach((r, y) => [...r].forEach((ch, x) => {
      const wall = WALL_OPENED_BY[ch] && !this.g.cleared[WALL_OPENED_BY[ch]];
      const boss = BOSS_AT[ch] && !this.g.cleared[BOSS_AT[ch]];
      if (!wall && !boss) return;
      const a = this.add.image(x * CELL + CELL / 2, y * CELL - 6, 'mist_arrow').setScale(1.4).setDepth(5); // スマホでも見える大きさ
      this.tweens.add({ targets: a, y: a.y - 8, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      arrows.push(a);
    }));
    // 雲雀ヶ原の祭場地（P）の上に 赤い旗の目印（10/3）
    if (!this.textures.exists('nomaoi_mark')) {
      const gr = this.make.graphics({ x: 0, y: 0, add: false });
      gr.fillStyle(0x3a2a1a, 1).fillRect(2, 0, 2, 22);
      gr.fillStyle(0xd83030, 1).fillRect(4, 1, 13, 9);
      gr.fillStyle(0xffffff, 1).fillCircle(10, 5, 2.5);
      gr.generateTexture('nomaoi_mark', 18, 22);
      gr.destroy();
    }
    this.rows.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch !== 'P') return;
      const a = this.add.image(x * CELL + CELL / 2, y * CELL - 4, 'nomaoi_mark').setScale(1.4).setDepth(5).setOrigin(0.2, 0.5);
      this.tweens.add({ targets: a, angle: 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      arrows.push(a);
    }));
    return arrows;
  }

  // 歩く地図の曲（本人 10/3「章ごとにBGMは新しく」）＝いわき（序章）は始まりの曲・相馬（1章）は somaField。町の中は その町のある地図の曲
  fieldBgm() {
    const map = isField(this.mapId) ? this.mapId : this.g.fieldMap ?? 'field';
    return { soma: 'somaField', kenpoku: 'kenpokuField', kenchu: 'kenchuField' }[map] ?? 'title';
  }

  // ---- 町に入った瞬間の一枚絵（1.3秒・さわると飛ばす）----
  showTownCard() {
    this.busy = true;
    const box = this.add.container(0, 0).setAlpha(0);
    box.add(this.add.rectangle(0, 0, W, MAP_H, 0x000000, 0.7).setOrigin(0));
    // 町の入口の一枚絵（Gemini）。まだ届いていない町（1章）は名前だけ
    if (this.textures.exists(`card_town_${this.mapId}`)) box.add(this.add.image(W / 2, 190, `card_town_${this.mapId}`));
    box.add(this.add.text(W / 2, 318, townCardName(this.mapId), {
      fontFamily: GAME_FONT, fontStyle: TITLE_WEIGHT, fontSize: '30px', color: '#ffffff', resolution: 3, stroke: '#1a1008', strokeThickness: 6,
    }).setOrigin(0.5));
    this.addUi(box);
    let done = false;
    const close = () => {
      if (done) return;
      done = true;
      this.tweens.add({ targets: box, alpha: 0, duration: 350, onComplete: () => { box.destroy(); this.busy = false; } });
    };
    this.tweens.add({ targets: box, alpha: 1, duration: 300 });
    this.time.delayedCall(1600, close);
    this.input.once('pointerdown', close);
  }

  // ---- 福島の地図（巻物）を見る。さわると閉じる ----
  showMap() {
    this.closeDialog();
    this.busy = true;
    const box = this.add.container(0, 0);
    box.add(this.add.rectangle(0, 0, W, 640, 0x000000, 0.85).setOrigin(0).setInteractive());
    const card = this.add.image(W / 2, 312, 'card_map');
    box.add(card);
    // いま ここ（本人 10/3「現在地を矢印で表示して欲しい」）＝赤い下向きの矢印が上下にゆれ、先が いまの場所を指す
    const pt = mapPointOf(this.g);
    const px = card.x - card.width / 2 + pt.x;
    const py = card.y - card.height / 2 + pt.y;
    box.add(this.add.circle(px, py, 4, 0xffffff).setStrokeStyle(2, 0xd02020));
    const arrow = this.add.container(px, py - 8);
    arrow.add(this.add.triangle(0, 0, -11, -22, 11, -22, 0, 0, 0xe02020).setOrigin(0, 0).setStrokeStyle(2, 0xffffff));
    arrow.add(this.add.text(0, -26, 'いま ここ', { fontFamily: FONT, fontSize: '14px', color: '#ffffff', resolution: 3, stroke: '#a01010', strokeThickness: 4 }).setOrigin(0.5, 1));
    box.add(arrow);
    this.tweens.add({ targets: arrow, y: py - 16, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    box.add(this.add.text(W / 2, 628, 'さわると とじる', { fontFamily: FONT, fontSize: '15px', color: '#cfd8ff', resolution: 3 }).setOrigin(0.5, 1));
    this.addUi(box);
    this.time.delayedCall(250, () => this.input.once('pointerdown', () => { box.destroy(); this.busy = false; }));
  }

  // ---- コレクション（本人 10/4 夜「倒したボスのキャラクターをあつめる」）＝元に戻した昔話の主の 元の姿。まだの主は影と「？？？」 ----
  showCollection(page = 0) {
    this.closeDialog();
    this.busy = true;
    const col = collection(this.g);
    // 絵は開いたときに読む（まだ読んでいない主の分だけ）
    const need = col.items.filter((it) => !this.textures.exists(`col-${it.id}`));
    if (need.length) {
      need.forEach((it) => this.load.image(`col-${it.id}`, it.img));
      this.load.once('complete', () => this.drawCollection(col, page));
      this.load.start();
      return;
    }
    this.drawCollection(col, page);
  }

  drawCollection(col, page) {
    this.collectionBox?.destroy();
    const box = this.add.container(0, 0).setDepth(2000); // 上の札・十字キーより手前
    this.collectionBox = box;
    box.add(this.add.rectangle(0, 0, W, 640, 0x07061a, 1).setOrigin(0).setInteractive());
    const txt = (x, y, t, size, color = '#ffffff', o = {}) => this.add.text(x, y, t, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 3, align: 'center', ...o });
    box.add(txt(W / 2, 18, `コレクション　${col.got} / ${col.total}`, 22, '#ffd27a').setOrigin(0.5, 0));
    const CW = 110, CH = 160, GX = (W - CW * 3) / 4;
    col.items.slice(page * PER_PAGE, (page + 1) * PER_PAGE).forEach((it, k) => {
      const cx = GX + (k % 3) * (CW + GX), cy = 58 + Math.floor(k / 3) * (CH + 8);
      const card = this.add.graphics();
      card.fillStyle(0x15132e, 1).fillRoundedRect(cx, cy, CW, CH, 8);
      card.lineStyle(2, it.got ? 0xc9a24a : 0x3a3660, 1).strokeRoundedRect(cx, cy, CW, CH, 8);
      box.add(card);
      const im = this.add.image(cx + CW / 2, cy + 50, `col-${it.id}`);
      im.setScale(Math.min(88 / im.width, 84 / im.height));
      if (!it.got) im.setTintFill(0x000000).setAlpha(0.75); // まだの主は 黒い影
      box.add(im);
      box.add(txt(cx + CW / 2, cy + 98, it.got ? it.name : '？？？', it.name.length > 6 ? 13 : 15, it.got ? '#ffffff' : '#8a86b0', { wordWrap: { width: CW - 8, useAdvancedWrap: true } }).setOrigin(0.5, 0));
      box.add(txt(cx + CW / 2, cy + CH - 6, it.episode, 12, '#cfc4a0').setOrigin(0.5, 1));
      if (it.got) {
        const hit = this.add.zone(cx, cy, CW, CH).setOrigin(0).setInteractive();
        hit.on('pointerup', () => this.showCollectionCard(it, col, page));
        box.add(hit);
      }
    });
    // 下の札：まえ・つぎ・とじる（押して離して決まる）
    const btn = (x, label, on, enabled = true) => {
      const t = txt(x, 600, label, 20, enabled ? '#ffffff' : '#555070').setOrigin(0.5);
      box.add(t);
      if (!enabled) return;
      const z = this.add.zone(x - 55, 578, 110, 44).setOrigin(0).setInteractive();
      z.on('pointerup', () => { sfx('select'); on(); });
      box.add(z);
    };
    btn(60, '◀ まえ', () => this.drawCollection(col, page - 1), page > 0);
    btn(W / 2, 'とじる', () => { box.destroy(); this.collectionBox = null; this.busy = false; });
    btn(W - 60, 'つぎ ▶', () => this.drawCollection(col, page + 1), page < col.pages - 1);
    box.add(txt(W / 2, 568, `${page + 1} / ${col.pages}`, 13, '#8a86b0').setOrigin(0.5, 1));
    this.cameras.main.ignore(box); // 窓用のカメラだけで描く（窓の部品の箱の外＝上の札・十字キーより手前）
  }

  // 1体を大きく：元の姿・名前・話・場所・ほんとうのお話（さわると一覧へ）
  showCollectionCard(it, col, page) {
    const box = this.add.container(0, 0).setDepth(2100);
    const txt = (x, y, t, size, color = '#ffffff', o = {}) => this.add.text(x, y, t, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 3, align: 'center', ...o });
    box.add(this.add.rectangle(0, 0, W, 640, 0x07061a, 1).setOrigin(0).setInteractive());
    const im = this.add.image(W / 2, 190, `col-${it.id}`);
    im.setScale(Math.min(240 / im.width, 240 / im.height));
    box.add(im);
    box.add(txt(W / 2, 330, it.name, 26, '#ffd27a').setOrigin(0.5, 0));
    box.add(txt(W / 2, 370, `${it.episode}「${it.tale}」・${it.place}`, 15, '#cfc4a0', { wordWrap: { width: 320, useAdvancedWrap: true } }).setOrigin(0.5, 0));
    if (it.hosoku) box.add(txt(W / 2, 420, it.hosoku, 15, '#ffffff', { align: 'left', wordWrap: { width: 310, useAdvancedWrap: true }, lineSpacing: 6 }).setOrigin(0.5, 0));
    box.add(txt(W / 2, 628, 'さわると もどる', 15, '#cfd8ff').setOrigin(0.5, 1));
    this.cameras.main.ignore(box);
    sfx('select');
    this.time.delayedCall(250, () => this.input.once('pointerup', () => box.destroy()));
  }

  // ---- 座標 ----
  center(x, y) {
    return [x * CELL + CELL / 2, y * CELL + CELL / 2];
  }

  behind(x, y, dir) {
    const [dx, dy] = DELTA[OPPOSITE[dir]];
    return canWalk(this.g, this.mapId, x + dx, y + dy) && !this.npcAt(x + dx, y + dy) ? [x + dx, y + dy] : [x, y];
  }

  npcAt(x, y) {
    return this.npcs?.find((n) => n.x === x && n.y === y) ?? null;
  }

  setGame(g) {
    this.g = g;
    this.registry.set('game', g);
    this.refreshStatus?.();
  }

  refreshFrames() {
    this.player.setFrame(frameOf(this.facing, this.step, 'tabi'));
    for (const f of this.followers) {
      const own = lookOf(f.id, this.g);
      const look = this.g.party[f.id]?.dead && HAS_GHOST.includes(own) ? `${own}_ghost` : own;
      f.sprite.setFrame(frameOf(f.dir, this.step, look));
    }
    for (const n of this.npcs) n.sprite.setFrame(frameOf(n.dir, this.step, n.look));
  }

  // ---- 窓とボタン ----
  addUi(obj) {
    this.ui.add(obj);
    return obj;
  }

  // 和風の窓（藍の地に金の二重線・四隅の雲＝Gemini の部品表）
  box(x, y, w, h) {
    return this.addUi(makeWindow(this, x, y, w, h));
  }

  buildUi() {
    // 上：HP と文と、いまの場所（2人＝2行・3〜4人＝仲間の行が1行ふえる）
    const rows = Math.ceil(membersOf(this.g).length / 2) + 1;
    this.box(4, 4, W - 8, 16 + rows * 23);
    this.statusText = this.addUi(this.add.text(30, 16, '', style(15)));  // 和風の枠の金の線（約12ドット）の内側
    // 所持金は右上＝いちばん下の行の右（本人 10/2「所持金は右上に表示して欲しい」）
    this.moneyText = this.addUi(this.add.text(W - 30, 16 + (rows - 1) * 23, '', style(15, '#ffd98a')).setOrigin(1, 0));
    this.box(0, MAP_H, W, 640 - MAP_H).setAlpha(1);

    // 丸い十字キー（左）と、丸いボタン「はなす」（橙）「どうぐ」（緑）。押すと凹む（本人 10/2）
    this.pad = this.add.container(0, 0);
    this.addUi(this.pad);
    this.pad.add(makePad(this, 102, 530, (dir) => { this.held = dir; }, 1.25));
    this.pad.add(makeButton(this, 280, 488, 'orange', 'はなす', () => this.pressTalk(), { size: 84, fontSize: 18, below: false }));
    this.pad.add(makeButton(this, 280, 584, 'green', 'どうぐ', () => this.pressItems(), { size: 70, fontSize: 16, below: false }));
    // 拡大・縮小のボタン（歩く地図の右上・上の札の下）。いまの倍率を小さく下に
    if (isField(this.mapId)) {
      const zy = 16 + Math.ceil(membersOf(this.g).length / 2 + 1) * 23 + 34;
      this.addUi(makeButton(this, W - 30, zy, 'blue', '＋', () => this.stepZoom(+1), { size: 46, fontSize: 24, below: false }));
      this.addUi(makeButton(this, W - 30, zy + 56, 'blue', '－', () => this.stepZoom(-1), { size: 46, fontSize: 24, below: false }));
      this.zoomLabel = this.addUi(this.add.text(W - 30, zy + 84, `${Math.round((this.zoom ?? 1) * 100)}%`, style(14, '#ffffff')).setOrigin(0.5, 0).setStroke('#1a1030', 4));
    }

    // 文の窓（下の窓を使う）
    this.dlg = this.add.container(0, 0).setVisible(false).setDepth(50); // 伸ばした選びの窓が 下の窓の枠より手前に来るように
    this.addUi(this.dlg);
    this.dlgSpeaker = this.add.text(38, PANEL_Y + 18, '', style(16, '#ffd98a'));
    this.dlgText = this.add.text(26, PANEL_Y + 44, '', style(20));
    this.dlgMore = this.add.text(W - 40, 640 - 40, '▼', style(18)).setOrigin(0.5);
    this.tweens.add({ targets: this.dlgMore, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
    // しおりが話すときは窓の左に顔（Gemini の顔絵・本人 10/2「しおりは3Dしおりに寄せて」）
    this.dlgFace = this.add.image(72, PANEL_Y + 92, 'face_normal').setVisible(false);
    this.dlg.add([this.dlgSpeaker, this.dlgText, this.dlgMore, this.dlgFace]);
    this.menuItems = [];
    this.menuExtras = [];
  }

  refreshStatus() {
    // 作り直しで消えた札の字（scene が無い）には触らない。⛔isActive() で見ると、場面を始め直した直後（create の中）も止まって見えて札が空のままだった（10/2）
    if (!this.statusText?.scene) return;
    const p = this.g.party;
    const place = this.town ? this.town.name : { field: 'いわき', soma: '相馬', kenpoku: '県北', kenchu: '県中' }[this.mapId] ?? ''; // 10/3 1章の地図「相馬」
    // 2人ずつ1行（4人なら2行）・いちばん下の行に Lv と場所（右に所持金）
    // ⭐本人 10/4「憑依されると…分かりにくい。HPを赤字に」＝1人ずつ 名前（白）・印（色つき：憑＝赤／呪＝紫／霊＝水色）・HP（憑依は赤）・術 を別の字で並べる
    const ids = membersOf(this.g);
    for (const t of this.memberUi.flatMap((m) => m.all)) t.destroy();
    this.memberUi = ids.map((id, i) => {
      const x0 = 30 + (i % 2) * 154;
      const y = 16 + Math.floor(i / 2) * 23;
      const m = maxOf(this.g, id);
      const all = [];
      const put = (x, text, color) => { const t = this.addUi(this.add.text(x, y, text, style(15, color))); all.push(t); return t; };
      let x = x0;
      const name = put(x, nameOf(this.g, id), '#ffffff');
      x += name.width + 2;
      for (const k of badgesOf(p[id])) {
        const b = put(x, AILMENTS[k].badge, AILMENTS[k].color).setStroke('#2a0a0a', 3);
        x += b.width + 1;
      }
      const hp = put(x + 5, p[id].dead ? '幽霊' : `${p[id].hp}/${m.hp}`, hpColor(p[id], m.hp));
      // 術の力も見せる（本人 10/2「術は温泉で回復しますか？」＝宿で戻るのが見えるように）
      if (m.mp > 0 && !p[id].dead) put(hp.x + hp.width + 6, `術${p[id].mp}`, '#ffffff');
      return { id, hp, all };
    });
    this.statusText.setY(16 + Math.ceil(ids.length / 2) * 23).setText(`Lv ${this.g.lv ?? 1}　${place}`);
    this.moneyText?.setText(`所持金 ${this.g.mon}文`);
    this.refreshGhosts?.();
  }

  // 憑依で HP が減ったとき（10/4）＝上の札の HP を点滅させ、横に赤い「−1」を浮かせる
  flashHpLoss(id, n) {
    const m = this.memberUi.find((u) => u.id === id);
    if (!m?.hp?.scene) return;
    this.tweens.add({ targets: m.hp, alpha: 0.25, duration: 120, yoyo: true, repeat: 1 });
    // 右隣の「術」に重ならないよう、HP の真上から上へ浮かせる
    const f = this.addUi(this.add.text(m.hp.x + m.hp.width / 2, m.hp.y + 2, `−${n}`, style(14, '#ff5a5a')).setOrigin(0.5, 1).setStroke('#2a0a0a', 4));
    this.tweens.add({ targets: f, y: f.y - 10, alpha: 0, duration: 800, onComplete: () => f.destroy() });
  }

  // ---- 文と選び ----
  openDialog() {
    this.busy = true;
    this.held = null;
    this.pad.setVisible(false);
    this.dlg.setVisible(true);
  }

  closeDialog() {
    this.clearMenu();
    this.advance = null;
    this.dlg.setVisible(false);
    this.pad.setVisible(true);
    this.busy = false;
  }

  // 場面だけに出る人（祐慶など・10/5 夜）：旅の者の となりの空いたマスに立ち、旅の者は その人のほうを向く
  spawnGuest(look) {
    const taken = (gx, gy) => (gx === this.px && gy === this.py) || this.npcAt(gx, gy) || this.followers.some((f) => f.x === gx && f.y === gy);
    const spot = [[0, -1], [1, 0], [-1, 0], [0, 1], [1, -1], [-1, -1]].find(([dx, dy]) => canWalk(this.g, this.mapId, this.px + dx, this.py + dy) && !taken(this.px + dx, this.py + dy)) ?? [0, -1];
    const [dx, dy] = spot;
    const dir = dy > 0 ? 'up' : dy < 0 ? 'down' : dx > 0 ? 'left' : 'right'; // 客は旅の者を向く
    const s = this.add.sprite(...this.center(this.px + dx, this.py + dy), `p-${look}`, frameOf(dir, 0, look)).setOrigin(0.5, ORIGIN_Y).setAlpha(0);
    this.uiCam.ignore(s);
    this.tweens.add({ targets: s, alpha: 1, duration: 400 });
    this.facing = dy > 0 ? 'down' : dy < 0 ? 'up' : dx > 0 ? 'right' : 'left';
    this.refreshFrames();
    return { s, look, leaving: false };
  }

  // 客が 町の出口（下）のほうへ 歩いて 消える
  leaveGuest(g) {
    if (!g?.s?.scene || g.leaving) return;
    g.leaving = true;
    const y0 = g.s.y;
    this.tweens.add({
      targets: g.s, y: y0 + CELL * 3, alpha: 0, duration: 1600,
      onUpdate: (tw) => g.s.setFrame(frameOf('down', Math.floor(tw.progress * 8), g.look)),
      onComplete: () => g.s.destroy(),
    });
  }

  // list＝[{text, speaker?}]。さわるたびに次へ。終わったら done（無ければ窓を閉じる）
  showMessages(list0, done) {
    const list = [...list0];
    this.openDialog();
    this.clearMenu();
    let i = 0;
    const next = () => {
      if (i >= list.length) {
        this.advance = null;
        if (done) done();
        else this.closeDialog();
        return;
      }
      const m = list[i++];
      m.onShow?.(); // その文が出たときに 場面を動かす（祐慶が去る など）
      this.dlgSpeaker.setText(m.speaker ?? '');
      // 顔：しおりは表情（m.face）・ほかの仲間は m.face に その人の id（顔絵が届いていれば）
      const sf = m.face ?? 'normal';
      const shioriFace = this.g?.flags?.kunoichi && KUNOICHI_FACES.includes(sf) ? `k_${sf}` : sf; // くノ一の顔（届いていれば）
      this.setFace(m.speaker?.startsWith('しおり') ? shioriFace : m.face && this.textures.exists(`face_${m.face}`) ? m.face : null);
      // 窓（▼の上 y 約600）に収まらなければ、残りを次のページに回す
      const pages = paginate(this.dlgText, m.text, 600);
      list.splice(i, 0, ...pages.slice(1).map((text) => ({ speaker: m.speaker, face: m.face, text })));
      this.dlgMore.setVisible(true);
      this.msgReadyAt = this.time.now + 180;
      // 短い曲の付いた文：曲が終わるまで ▼ を隠して先へ進ませない（音が出ない端末でも同じ長さだけ止める）→ 地図の曲へ戻す
      if (m.jingle) {
        playJingle(m.jingle);
        const ms = jingleSeconds(m.jingle) * 1000 + 400;
        this.dlgMore.setVisible(false);
        this.msgReadyAt = this.time.now + ms;
        this.time.delayedCall(ms, () => { this.dlgMore.setVisible(true); startBgm(this.fieldBgm()); });
      }
      this.advance = next;
    };
    next();
  }

  // 顔あり＝文を顔の右へ寄せて幅を狭める
  setFace(face) {
    this.dlgFace.setVisible(!!face);
    if (face) this.dlgFace.setTexture(`face_${face}`);
    // 金の枠の内側（右の線は x 約342）に収める
    this.dlgText.setX(face ? 128 : 30).setWordWrapWidth(face ? 202 : 302, true);
    // 名前：顔があるときは顔の下に ひとまわり大きく（本人 10/2）／無いときは左上
    if (face) this.dlgSpeaker.setPosition(72, PANEL_Y + 142).setOrigin(0.5, 0).setFontSize(20);
    else this.dlgSpeaker.setPosition(38, PANEL_Y + 18).setOrigin(0, 0).setFontSize(16);
  }



  // options＝[[文字, 押したとき, 右の小さな注記]]
  // 選び（本人 10/4「UIが使いずらい。文字が小さく、他のコマンドを押してしまう」）
  // ＝1行 ROW（46ドット＝スマホで約50px）・字22px。入りきらなければ字を縮めず、窓を地図の上へ伸ばし（上の札の下まで）、それでも入らなければページに分ける
  // 決まるのは「指を離したとき、押した行の上にいる」とき（指を置くと行が光る・ずらして離すと取り消し）
  showMenu(title, options, page = 0) {
    this.openDialog();
    this.clearMenu();
    this.setFace(null);
    this.advance = null;
    this.dlgSpeaker.setText('');
    this.dlgMore.setVisible(false);
    const readyAt = this.time.now + 200;
    const ROW = MENU_ROW;
    const BOTTOM = 624; // 行の当たりの下の端（窓の金の線の内側）
    this.dlgText.setFontSize(20).setText(title);
    const titleH = title ? this.dlgText.height + 12 : 0;
    // いちばん上まで伸ばした窓に入る行の数
    const maxRows = Math.max(3, Math.floor((BOTTOM - MENU_TOP - 18 - titleH) / ROW));
    let list = options;
    if (options.length > maxRows) {
      // ページ：最後の行を「つぎへ／はじめへ」に使う
      const per = maxRows - 1;
      const pages = Math.ceil(options.length / per);
      const p = page % pages;
      list = [...options.slice(p * per, p * per + per), [p + 1 < pages ? `つぎへ ▶（${p + 1}/${pages}）` : `はじめへ ▶（${p + 1}/${pages}）`, () => this.showMenu(title, options, p + 1)]];
    }
    const top = Math.min(PANEL_Y, BOTTOM - list.length * ROW - titleH - 18);
    // 下の窓に入りきらないときは、地図の上へ伸ばした窓を重ねる
    if (top < PANEL_Y) {
      const sheet = makeWindow(this, 0, top - 8, W, 640 - top + 8); // 下の窓（x0・幅いっぱい）と同じ幅＝角が横からのぞかない
      this.dlg.addAt(sheet, 0);
      this.menuExtras.push(sheet);
    }
    this.dlgText.setY(top + 14);
    const y0 = top + 14 + titleH;
    this.menuLayout = { top: y0, pitch: ROW, fs: MENU_FS }; // 試験（重なりの見張り）用
    let pressed = null;
    const glow = this.add.rectangle(16, 0, W - 32, ROW - 6, 0xffd98a, 0.22).setOrigin(0).setVisible(false);
    this.dlg.add(glow);
    this.menuExtras.push(glow);
    const release = () => { pressed = null; glow.setVisible(false); };
    list.forEach(([label, fn, note, noteColor], i) => {
      const y = y0 + i * ROW; // 行の上の端
      const t = this.add.text(30, y + (ROW - 6) / 2, `▶ ${label}`, { ...style(MENU_FS, fn ? '#ffffff' : '#777777'), wordWrap: null }).setOrigin(0, 0.5);
      this.dlg.add(t);
      this.menuItems.push(t);
      if (note) {
        const n = this.add.text(W - 28, y + (ROW - 6) / 2, note, style(17, noteColor ?? '#ffd34d')).setOrigin(1, 0.5); // 4つ目＝注記の色（装備で下がる品は赤・装備中は灰）
        this.dlg.add(n);
        this.menuItems.push(n);
        // 長い項目（旅の者（今：旅の笠）など）が右の注記とぶつかるときは、その行の字だけ縮める（10/4 試運転）
        for (let fs = MENU_FS; t.x + t.width > n.x - n.width - 8 && fs > 15; fs--) t.setFontSize(fs - 1);
      }
      if (fn) {
        // 当たり＝行の幅いっぱい・高さ ROW−6（行と行のあいだ6ドットは どちらも効かない）
        t.setInteractive(new Phaser.Geom.Rectangle(-14, (t.height - (ROW - 6)) / 2, W - 32, ROW - 6), Phaser.Geom.Rectangle.Contains);
        t.on('pointerdown', () => { if (this.time.now < readyAt) return; pressed = t; glow.setY(y).setVisible(true); });
        t.on('pointerout', () => { if (pressed === t) release(); });
        t.on('pointerup', () => {
          if (pressed !== t) return;
          release();
          sfx('select');
          fn();
        });
      }
    });
  }

  clearMenu() {
    for (const t of [...this.menuItems, ...(this.menuExtras ?? [])]) t.destroy();
    this.menuItems = [];
    this.menuExtras = [];
    this.dlgText?.setY(PANEL_Y + 44).setFontSize(20); // 選びで上へ動かした文を、いつもの所へ戻す
  }

  // ---- 歩く ----
  // 相馬で 浜街道より東（x≥16）にいる間は −SEA_SHIFT（＝画面を右へ3マス）・西の山の中では 0
  // 地図の倍率：FIELD_ZOOMS の中で1段ずつ。印は倍率が小さいほど大きく描いて、同じ大きさに見せる
  applyZoom(z) {
    this.zoom = z;
    this.cameras.main.setZoom(z);
    this.hereMark?.setVisible(z < 1).setScale(1 / z);
    this.hereRing?.setVisible(z < 1).setScale(1 / z);
    this.zoomLabel?.setText(`${Math.round(z * 100)}%`);
  }

  stepZoom(d) {
    const i = FIELD_ZOOMS.indexOf(this.zoom ?? 1);
    const z = FIELD_ZOOMS[Math.max(0, Math.min(FIELD_ZOOMS.length - 1, (i < 0 ? FIELD_ZOOMS.indexOf(1) : i) + d))];
    this.registry.set('fieldZoom', z);
    this.applyZoom(z);
  }

  seaShiftTarget() {
    return this.mapId === 'soma' && this.px >= 16 ? -SEA_SHIFT : 0;
  }

  update() {
    // 城の真上に だれかが立っているか（旅の者・後ろの仲間）
    for (const c of this.castleCovers ?? []) {
      const on = (this.px === c.x && this.py === c.y - 1) || this.followers.some((f) => f.x === c.x && f.y === c.y - 1);
      if (c.img.visible !== on) c.img.setVisible(on);
    }
    // いま ここ の印は旅の者について回る（矢印は上下にゆれる・輪は脈打つ）
    if (this.hereMark?.visible) {
      const k = 1 / (this.zoom ?? 1);
      const bob = Math.sin(this.time.now / 220) * 5 * k;
      this.hereMark.setPosition(this.player.x, this.player.y - 40 * k + bob);
      this.hereRing.setPosition(this.player.x, this.player.y - 4).setAlpha(0.55 + 0.45 * Math.sin(this.time.now / 300));
    }
    const want = this.seaShiftTarget();
    if (this.camShift !== undefined && this.camShift !== want) {
      this.camShift += Math.sign(want - this.camShift) * Math.min(4, Math.abs(want - this.camShift));
      this.cameras.main.setFollowOffset(this.camShift, 0);
    }
    if (this.busy || this.moving) return;
    let dir = this.held;
    if (!dir && this.keys) dir = ['up', 'down', 'left', 'right'].find((d) => this.keys[d].isDown) ?? null;
    if (dir) this.tryStep(dir);
  }

  tryStep(dir) {
    this.facing = dir;
    this.refreshFrames();
    const [dx, dy] = DELTA[dir];
    const nx = this.px + dx;
    const ny = this.py + dy;
    if (this.npcAt(nx, ny)) return;
    if (!canWalk(this.g, this.mapId, nx, ny)) {
      this.bump(nx, ny);
      return;
    }
    this.moving = true;
    const [ox, oy] = [this.px, this.py];
    this.px = nx;
    this.py = ny;
    // 後ろの仲間は、1人前の人が今いた所へ（しおり→和尚→岩手の順に続く）
    let [lx, ly] = [ox, oy];
    for (const f of this.followers) {
      const [fx, fy] = [f.x, f.y];
      f.dir = fx === lx && fy === ly ? dir : (lx > fx ? 'right' : lx < fx ? 'left' : ly > fy ? 'down' : 'up');
      f.x = lx;
      f.y = ly;
      const [sx, sy] = this.center(lx, ly);
      this.tweens.add({ targets: f.sprite, x: sx, y: sy, duration: STEP_MS });
      [lx, ly] = [fx, fy];
    }
    const [tx, ty] = this.center(nx, ny);
    this.tweens.add({
      targets: this.player, x: tx, y: ty, duration: STEP_MS,
      onComplete: () => {
        this.moving = false;
        let g = { ...this.g, pos: { map: this.mapId, x: nx, y: ny, dir } };
        const before = this.g.party;
        if (isField(this.mapId)) g = walkStep(g);
        this.setGame(g);
        // 憑依で HP が減った人は、上の札の HP が点滅して「−1」が浮く（本人 10/4「減っていることを知らせてほしい」）
        for (const id of membersOf(g)) if (g.party[id]?.ghost && g.party[id].hp < (before[id]?.hp ?? 0)) this.flashHpLoss(id, before[id].hp - g.party[id].hp);
        this.arrive(nx, ny);
      },
    });
  }

  bump(x, y) {
    const t = terrainAt(this.mapId, x, y);
    if (!isField(this.mapId) || !t || !WALL_OPENED_BY[t.ch]) return;
    if (this.time.now - this.lastBump < 1200) return;
    this.lastBump = this.time.now;
    // ボスは戻したが その章のクエストが残っている（10/4 本人「クエストが終わっていない場合、進めないように」）
    if (this.g.cleared?.[WALL_OPENED_BY[t.ch]] && WALL_QUEST_LINES[t.ch]) {
      this.showMessages(wallQuestLines(this.g, t.ch).map((text) => ({ text })));
      return;
    }
    this.showMessages([{ text: '黒い もやが 道を ふさいでいる……' }, { speaker: 'しおり', text: WALL_HINT[t.ch] }]);
  }

  arrive(x, y) {
    const ch = this.rows[y][x];
    if (isField(this.mapId)) {
      const crossed = crossAt(this.g, this.mapId, x, y); // 地図の口（いわき⇔相馬・10/3 1章）
      if (crossed) {
        sfx('select');
        this.goto({ ...crossed, steps: 0, justCrossed: crossed.pos.map });
      } else if (TOWN_OF[ch]) {
        sfx('select');
        this.goto(enterTown(this.g, TOWN_OF[ch]));
      } else if (ch === 'P') {
        sfx('select');
        this.nomaoiTalk();
      } else if (ch === 'k') {
        sfx('select');
        this.chochinTalk(); // 二本松の提灯祭り（10/4）
      } else if (this.meet(x, y)) {
        // 道中の敵に出会った（meet の中で戦いへ）
      } else if (BOSS_AT[ch] && !this.g.cleared[BOSS_AT[ch]]) {
        const index = EPISODES.findIndex((e) => e.enemy.id === BOSS_AT[ch]);
        this.showMessages([{ text: '黒い もやが うずまいている……！' }], () => {
          this.busy = true;
          this.cameras.main.fadeOut(400, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('battle', { index, fromField: true }));
        });
      } else if (ch === 'a') {
        sfx('select');
        this.taimatsuTalk(); // 須賀川の松明あかし（3章・10/4）
      } else if (ch === 'n' && this.g.cleared.nekonaki) {
        sfx('select');
        this.onsenMenu(); // 猫啼温泉（3章・和泉式部の猫を元に戻すと湯につかれる）
      }
    } else if (ch === 'x') {
      this.goto(leaveTown(this.g));
    }
  }

  // 道中の敵：出会ったら画面が光って戦いへ
  meet(x, y) {
    this.rng = this.rng ?? makeRng((Date.now() & 0x7fffffff) || 1);
    const hit = encounterAt(this.g, this.mapId, x, y, this.rng);
    if (!hit) return false;
    this.busy = true;
    this.held = null;
    sfx('bite');
    this.cameras.main.flash(250, 255, 255, 255);
    this.time.delayedCall(260, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('battle', { fromField: true, zako: hit.id, zone: hit.zone }));
    });
    return true;
  }

  goto(g) {
    this.busy = true;
    this.setGame(g);
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart());
  }

  // ---- はなす・しらべる ----
  pressTalk() {
    if (this.busy || this.moving) return;
    const [dx, dy] = DELTA[this.facing];
    let n = this.npcAt(this.px + dx, this.py + dy);
    // カウンター越し
    if (!n && terrainAt(this.mapId, this.px + dx, this.py + dy)?.ch === 'c') n = this.npcAt(this.px + 2 * dx, this.py + 2 * dy);
    // 名所（10/4〜・10/5 板は消した）＝城や名所の方へ向いて「はなす」と、名前と短い説明
    const kb = !n && isField(this.mapId) ? kanbanAt(this.mapId, this.px + dx, this.py + dy) : null;
    if (kb) {
      this.showMessages([{ text: `「${kb.name}」` }, ...kb.lines.map((text) => ({ text }))]);
      return;
    }
    if (!n) {
      this.showMessages([{ speaker: 'しおり', text: 'とくに 何も ないみたい。' }]);
      return;
    }
    n.dir = OPPOSITE[this.facing];
    this.refreshFrames();
    const lines = n.lines.map((text) => ({ text }));
    if (n.role === 'shop') this.showMessages(lines, () => this.shopMenu(n));
    else if (n.role === 'inn') this.showMessages(lines, () => this.innMenu(n));
    else if (n.role === 'shrine') this.showMessages(lines, () => this.shrineMenu());
    else if (n.role === 'temple') this.showMessages(lines, () => this.templeMenu());
    else if (n.role === 'equip') this.showMessages(lines, () => this.equipShop(n.goods, n.items));
    else if (n.role === 'bansho') this.banshoTalk();
    else if (n.role === 'fishing') this.showMessages(lines, () => this.fishMenu());
    else if (n.role === 'dojo') this.dojoTalk(n);
    else if (n.role === 'master') this.masterTalk(n);
    else if (n.role === 'shinobi') this.shinobiTalk(n);
    else if (n.role === 'onsen') this.showMessages(lines, () => this.onsenMenu(this.town?.name?.replace('温泉', '') ?? '温泉')); // 温泉地の 湯屋の 番台（10/5 夜 本人「温泉では回復もできるように」）
    else this.showMessages(lines);
  }

  shopMenu(n) {
    const opts = n.goods.map((id) => [`${ITEMS[id].name}（${this.g.items[id] ?? 0}）`, () => this.buyOne(n, id), `${PRICE[id]}文 ${itemNote(ITEMS[id])}`]); // 効き目と持っている数も（10/3 道具を強くした）
    // n.back があれば「もどる」（よろず屋・刀屋の中の道具の棚から開いたとき）
    this.showMenu(`何を 買う？（所持金 ${this.g.mon}文）`, [...opts, n.back ? ['もどる', n.back] : ['やめる', () => this.closeDialog()]]);
  }

  buyOne(n, id) {
    const r = buy(this.g, id);
    if (r.ok) {
      this.setGame(r.game);
      sfx('eat');
    }
    const text = r.ok ? `${ITEMS[id].name}を 買った！（${this.g.items[id]}こ 持っている）` : '文が 足りないようだ……';
    if (r.ok) this.showGoods(id);
    this.showMessages([{ text }], () => (n.role === 'equip' ? this.equipShop(n.goods, n.items) : this.shopMenu(n)));
  }

  // ---- 職業の師匠（10/5 本人「それぞれの職業は必殺技が3つあり、1章から3章までのどこかで、クエストを受けて習得する」）----
  // その職業の人が 旅にいなければ「連れて来い」だけ。習い終えていれば ひと言。試しの形＝一騎打ち／問答／神楽／的当て（jobs.js の QUESTS）
  masterTalk(n) {
    const q = QUESTS[n.ch]?.[n.job];
    const job = JOBS[n.job];
    const master = q?.master ?? '師匠';
    const who = membersOf(this.g).find((id) => jobOf(this.g, id) === n.job);
    const skill = job.skills[n.ch - 1];
    const sp = JOB_SPELLS[skill];
    const say = (text) => ({ speaker: master, text });
    if (!who) {
      this.showMessages([...n.lines.map(say), say(`${job.name}の 腕の 立つ 者を 連れて きたら、${sp.name}を 教えよう。`)]);
      return;
    }
    if ((this.g.skills?.[who] ?? []).includes(skill)) {
      this.showMessages([say(`${sp.name}は 使いこなせて おるか。精進 されよ。`)]);
      return;
    }
    const FORM = {
      duel: `一騎打ちを 受けますか？（${nameOf(this.g, who)} ひとり・3本勝負・2本 先に 取れば 合格）`,
      mondo: `問答を 受けますか？（${MONDO_COUNT}問・${MONDO_PASS}問 正しければ 合格）`,
      kagura: '神楽の 試しを 受けますか？（太鼓に 合わせて 鈴を 振る）',
      mato: `的当てを 受けますか？（矢${MATO_ARROWS}本・${MATO_PASS}本 当てれば 合格）`,
      kagewatari: `影渡りの 試しを 受けますか？（${nameOf(this.g, who)} ひとり・見つかってよいのは 2回まで）`,
    };
    this.showMessages([...n.lines.map(say), say(`${nameOf(this.g, who)}よ、試しに 受かれば ${sp.name}を さずけよう。`)], () => this.showMenu(FORM[q.form], [
      ['受ける', () => this.beginQuest(n, q, who)],
      ['やめる', () => this.showMessages([say('心が 決まったら、また 来なさい。')])],
    ]));
  }

  beginQuest(n, q, who) {
    if (q.form === 'duel') {
      this.setGame(startDuel(this.g, who, n.ch));
      this.showMessages([{ speaker: q.master, text: 'よかろう。仲間は 下がって 見ておれ。' }], () => {
        this.busy = true;
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('battle', { duel: 1, fromField: true }));
      });
    } else if (q.form === 'mondo') {
      this.mondo = { n, q, who, m: newMondo(n.ch, n.job, makeRng((Date.now() & 0x7fffffff) || 1)) };
      this.askMondo();
    } else if (q.form === 'kagura') this.startKagura(n, q, who);
    else if (q.form === 'mato') this.startMato(n, q, who);
    else if (q.form === 'kagewatari') {
      // 2章の忍者（10/5 夜 段階②）＝黒脛巾組の 影渡り。受かれば 影縫い
      this.showMessages([
        { speaker: q.master, text: '城の 庭の 灯りを 抜け、奥の 巻物を 取って まいれ。影から 影へ、灯りが 足もとを 離れた すきに 走れ。' },
        { text: '（画面を さわると、次の 影まで 走る）' },
      ], () => this.startKagewatari({ onPass: () => this.passQuest(n, q, who), master: q.master }));
    }
  }

  // 合格：技を習う（台詞は師匠ごとに同じ形）
  passQuest(n, q, who) {
    const r = learnSkill(this.g, who, n.ch);
    if (r.ok) this.setGame(r.game);
    const sp = JOB_SPELLS[r.skill];
    this.showMessages([
      { speaker: q.master, text: '見事！ その 腕、しかと 認めよう。' },
      { speaker: q.master, text: `わが 奥義、${sp?.name ?? ''}を さずける。` },
      { text: `${nameOf(this.g, who)}は ${sp?.name ?? ''}を おぼえた！`, jingle: 'join' },
    ]);
  }

  // 問答：問いを1つずつ 選びで出す。答えるたびに 正しいか 言う
  askMondo() {
    const st = this.mondo;
    if (mondoDone(st.m)) {
      const ok = mondoPassed(st.m);
      this.mondo = null;
      const head = { speaker: st.q.master, text: `${MONDO_COUNT}問のうち ${st.m.right}問 正しかった。` };
      if (ok) this.showMessages([head], () => this.passQuest(st.n, st.q, st.who));
      else this.showMessages([head, { speaker: st.q.master, text: 'まだまだ。土地の 人の 話を よく 聞いて、出直して こい。' }, { speaker: 'しおり', text: '町の 人や 立て札、昔話の 中に 答えが あるわ。' }]);
      return;
    }
    const cur = st.m.qs[st.m.at];
    this.showMenu(`問${st.m.at + 1}　${cur.q}`, cur.c.map((label, k) => [label, () => {
      const r = answerMondo(st.m, k);
      st.m = r.m;
      sfx(r.ok ? 'heal' : 'cancel');
      this.showMessages([{ speaker: st.q.master, text: r.ok ? 'うむ、そのとおり。' : `ちがう。答えは「${cur.c[cur.a]}」じゃ。` }], () => this.askMondo());
    }]));
  }

  // 神楽：二本松の提灯祭りと同じ遊び（太鼓の拍に合わせて さわる）。鈴が KAGURA_PASS 灯れば合格
  startKagura(n, q, who) {
    this.closeDialog();
    this.busy = true;
    stopBgm();
    let round = newRound(makeRng((Date.now() & 0x7fffffff) || 1));
    const box = this.add.container(0, 0);
    this.addUi(box);
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x14102a, 0x14102a, 0x3a1420, 0x3a1420, 1).fillRect(0, 0, W, 640);
    bg.fillStyle(0xb0302a, 1).fillRect(40, 150, 14, 300).fillRect(W - 54, 150, 14, 300).fillRect(20, 140, W - 40, 16); // 神楽殿の柱と梁
    bg.fillStyle(0x2a1a10, 1).fillRect(0, 450, W, 190);
    box.add(bg);
    const look = lookOf(who, this.g);
    const dancer = this.add.sprite(W / 2, 400, `p-${look}`, frameOf('down', 0, look)).setOrigin(0.5, 0.85).setScale(2.4);
    if (tintOf(who)) dancer.setTint(tintOf(who));
    const DRUM = { x: W / 2, y: 560 };
    const drum = this.add.circle(DRUM.x, DRUM.y, 30, 0x8a4a1a).setStrokeStyle(4, 0xe8d0a0);
    const ringG = this.add.graphics();
    const say = this.add.text(W / 2, 70, '太鼓に 合わせて 鈴を 振れ！', { fontFamily: FONT, fontSize: '20px', color: '#ffd27a' }).setOrigin(0.5).setStroke('#120a04', 5);
    const score = this.add.text(W / 2, 110, '', { fontFamily: FONT, fontSize: '18px', color: '#ffffff' }).setOrigin(0.5).setStroke('#120a04', 4);
    const grade = this.add.text(W / 2, 505, '', { fontFamily: FONT, fontSize: '22px', color: '#ffd27a' }).setOrigin(0.5).setStroke('#120a04', 5);
    box.add([dancer, drum, ringG, say, score, grade]);
    const showScore = () => score.setText(`舞の 冴え ${round.lit} / ${KAGURA_PASS}　乱れ ${round.misses} / ${KAGURA_MISS}`);
    let t0 = this.time.now;
    let cued = 0;
    let loop = null;
    const now = () => this.time.now - t0;
    const tick = () => {
      const t = now();
      while (cued < round.beats.length && round.beats[cued].t <= t) { sfx(round.beats[cued].big ? 'ootaiko' : 'taiko'); cued += 1; }
      ringG.clear();
      const next = round.beats.find((b, i) => !round.hit.includes(i) && b.t + CHOCHIN_OK > t);
      if (next) {
        const k = Math.max(0, Math.min(1, (next.t - t) / CHOCHIN_BEAT));
        ringG.lineStyle(next.big ? 6 : 4, next.big ? 0xff4a2a : 0xffd27a, 1).strokeCircle(DRUM.x, DRUM.y, 30 + k * 70);
      }
      if (t > roundEndAt(round)) finish();
    };
    const tap = () => {
      if (!loop) return;
      const res = tapAt(round, now());
      round = res.round;
      if (res.grade === 'miss') { grade.setText(''); return; }
      grade.setText(res.grade === 'yoi' ? 'よい！' : 'まあ');
      sfx('kagura');
      dancer.setFrame(frameOf(['left', 'right', 'down', 'up'][round.hit.length % 4], 0, look));
      this.tweens.add({ targets: drum, scale: 1.15, duration: 60, yoyo: true });
      showScore();
    };
    const hit = this.add.zone(0, 0, W, 640).setOrigin(0).setInteractive();
    hit.on('pointerdown', tap);
    box.add(hit);
    const finish = () => {
      loop?.remove(false);
      loop = null;
      hit.removeAllListeners();
      const ok = kaguraPassed(round);
      say.setText('そこまで！');
      sfx(ok ? 'win' : 'down');
      this.time.delayedCall(1000, () => {
        box.destroy();
        this.busy = false;
        startBgm(this.fieldBgm());
        if (ok) this.passQuest(n, q, who);
        else this.showMessages([{ speaker: q.master, text: round.misses > KAGURA_MISS ? `拍の 無い所で ${round.misses}回 鈴を 振った。神楽は 太鼓と ひとつに なって 舞うもの。` : `舞の 冴えが ${round.lit}。${KAGURA_PASS}には 届かぬ。太鼓の 輪が 重なる 瞬間を よく 見て。` }]);
      });
    };
    showScore();
    this.kagura = { round: () => round, tap, now, tick }; // 確かめ用の取っ手
    t0 = this.time.now;
    loop = this.time.addEvent({ delay: 16, loop: true, callback: tick });
  }

  // 的当て：左右に ゆれる的が 真ん中の 線に 重なった 瞬間に さわる
  startMato(n, q, who) {
    this.closeDialog();
    this.busy = true;
    stopBgm();
    let m = newMato(makeRng((Date.now() & 0x7fffffff) || 1));
    const box = this.add.container(0, 0);
    this.addUi(box);
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x8ac0e8, 0x8ac0e8, 0xd8eef8, 0xd8eef8, 1).fillRect(0, 0, W, 640);
    bg.fillStyle(0x6a9a4a, 1).fillRect(0, 300, W, 340); // 弓場の 芝
    bg.fillStyle(0x3a2a1a, 1).fillRect(0, 196, W, 8); // 的の 走る 線
    box.add(bg);
    const LINE_Y = 200;
    const aim = this.add.rectangle(W / 2, LINE_Y, 4, 120, 0xe0302a, 0.8);
    const zone = this.add.rectangle(W / 2, LINE_Y, MATO_HALF * 2 * W, 70, 0xffffff, 0.25);
    const target = this.add.container(0, LINE_Y);
    target.add([this.add.circle(0, 0, 26, 0xffffff).setStrokeStyle(2, 0x222222), this.add.circle(0, 0, 18, 0x222222), this.add.circle(0, 0, 11, 0xffffff), this.add.circle(0, 0, 5, 0xe0302a)]);
    const look = lookOf(who, this.g);
    const archer = this.add.sprite(W / 2, 560, `p-${look}`, frameOf('up', 0, look)).setOrigin(0.5, 0.85).setScale(2.4);
    if (tintOf(who)) archer.setTint(tintOf(who));
    const say = this.add.text(W / 2, 60, '的が 赤い 線に 重なったら さわれ！', { fontFamily: FONT, fontSize: '18px', color: '#1a1030' }).setOrigin(0.5).setStroke('#ffffff', 4);
    const info = this.add.text(W / 2, 100, '', { fontFamily: FONT, fontSize: '18px', color: '#1a1030' }).setOrigin(0.5).setStroke('#ffffff', 4);
    const res = this.add.text(W / 2, 300, '', { fontFamily: FONT, fontSize: '24px', color: '#e0302a' }).setOrigin(0.5).setStroke('#ffffff', 5);
    box.add([zone, aim, target, archer, say, info, res]);
    const showInfo = () => info.setText(`矢 ${m.shots.length} / ${MATO_ARROWS}　当たり ${m.hits}（${MATO_PASS}本で 合格）`);
    let t0 = this.time.now;
    let loop = null;
    let lock = 0;
    const now = () => this.time.now - t0;
    const tick = () => { target.x = matoX(m, now()) * W; };
    const tap = () => {
      if (!loop || this.time.now < lock) return;
      lock = this.time.now + 350; // 続けて 射られない（矢を つがえる 間）
      const r = shootMato(m, now());
      m = r.m;
      sfx(r.hit ? 'kaburaya' : 'attack');
      res.setText(r.hit ? '命中！' : 'はずれ');
      this.tweens.add({ targets: res, alpha: { from: 1, to: 0 }, duration: 700 });
      showInfo();
      if (matoDone(m)) finish();
    };
    const hit = this.add.zone(0, 0, W, 640).setOrigin(0).setInteractive();
    hit.on('pointerdown', tap);
    box.add(hit);
    const finish = () => {
      loop?.remove(false);
      loop = null;
      hit.removeAllListeners();
      const ok = matoPassed(m);
      sfx(ok ? 'win' : 'down');
      this.time.delayedCall(900, () => {
        box.destroy();
        this.busy = false;
        startBgm(this.fieldBgm());
        if (ok) this.passQuest(n, q, who);
        else this.showMessages([{ speaker: q.master, text: `${MATO_ARROWS}本のうち ${m.hits}本。的が 線に 来る 少し 前に 指を 動かすのだ。` }]);
      });
    };
    showInfo();
    this.mato = { m: () => m, tap, now, tick }; // 確かめ用の取っ手
    t0 = this.time.now;
    loop = this.time.addEvent({ delay: 16, loop: true, callback: tick });
  }

  // 相馬の道場（本人 10/4「旅の者は、途中クエストを受け剣術使いの『武士』に」）＝師範と木刀で3本勝負。2本取れば免状と居合い斬り（10/5〜 職業の師匠 masterTalk に入れ替え）
  dojoTalk(n) {
    if (this.g.flags?.bushi) {
      this.showMessages([{ text: '師範「おお、武士どの。居合い斬りは 抜く 一瞬が 命。精進 されよ。」' }]);
      return;
    }
    this.showMessages(n.lines.map((text) => ({ text })), () => this.showMenu('試し合いを 受けますか？（3本勝負・2本 先に 取れば 免状）', [
      ['受ける', () => this.showMessages([{ text: '師範「よかろう。木刀を 取れ。仲間は 見ておれ。」' }], () => {
        this.busy = true;
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('battle', { duel: 1, fromField: true }));
      })],
      ['やめる', () => this.showMessages([{ text: '師範「腕に 覚えが できたら、いつでも 来い。」' }])],
    ]));
  }

  // 黒脛巾組の頭（2章 福島の町・本人 10/4 夜「しおりが弱すぎる。女くノ一として、途中クエストを受け変身」）＝試し「影渡り」に受かると くノ一
  shinobiTalk(n) {
    // 10/5 職業の旅：影渡りは 2章の 忍者の試しとして 使い直す（段階②）。それまでは 話すだけ
    if (this.g.jobs) {
      this.showMessages([...n.lines.map((text) => ({ text })), { text: '頭「影渡りの 試しは、忍びの 者に だけ 受けさせる。……いずれ 時が 来たら 声を かけよう。」' }]);
      return;
    }
    if (this.g.flags?.kunoichi) {
      this.showMessages([{ text: '頭「くノ一どの。影を 味方に つけよ。狐火は 闇でこそ 燃える。」' }]);
      return;
    }
    const lines = [...n.lines.map((text) => ({ text })),
      { text: '頭「……そこの 娘。昔話を 語る 声に、ただならぬ 気配が ある。」' },
      { speaker: 'しおり', face: 'surprise', text: 'わたし？ ……わたしも、みんなの 役に 立ちたいの。戦いでは いつも 守られて ばかりで。' },
      { text: '頭「ならば 試しを 受けよ。城の 庭の 灯りを 抜け、奥の 巻物を 取って まいれ。」' },
    ];
    this.showMessages(lines, () => this.showMenu('影渡りの 試しを 受けますか？（しおり ひとり・見つかってよいのは 2回まで）', [
      ['受ける', () => this.showMessages([
        { text: '頭「影から 影へ。灯りが 足もとを 離れた すきに 走れ。」' },
        { text: '（画面を さわると、次の 影まで 走る）' },
      ], () => this.startKagewatari())],
      ['やめる', () => this.showMessages([{ text: '頭「心が 決まったら、また 来い。」' }])],
    ]));
  }

  startKagewatari(quest = null) {
    this.closeDialog();
    this.busy = true;
    stopBgm();
    startBgm('kagewatari');
    let run = newRun(makeRng((Date.now() & 0x7fffffff) || 1));
    const box = this.add.container(0, 0);
    this.addUi(box);
    // 夜の城の庭：上が奥（巻物）・下が始めの影。帯 LANES 本＝灯りの道、そのあいだ＝塀の影
    const TOP = 120, BOT = 560;
    const yOf = (k) => BOT - (k / KW_LANES) * (BOT - TOP); // k＝影の番号（0〜LANES）
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x060716, 0x060716, 0x15122a, 0x15122a, 1).fillRect(0, 0, W, 640);
    box.add(bg);
    const laneG = this.add.graphics();
    const shadeG = this.add.graphics();
    for (let k = 0; k <= KW_LANES; k++) shadeG.fillStyle(0x020205, 0.9).fillRect(0, yOf(k) - 9, W, 18); // 塀の影
    box.add([laneG, shadeG]);
    // 奥の巻物
    const scroll = this.add.rectangle(W / 2, TOP - 22, 34, 14, 0xe8d6a0).setStrokeStyle(2, 0x7a4a1a);
    const look = lookOf('shiori', this.g);
    const me = this.add.sprite(W / 2, BOT, `p-${look}`, frameOf('up', 0, look)).setOrigin(0.5, 0.85).setScale(1.2);
    const say = this.add.text(W / 2, 40, '影から 影へ。灯りの すきに 走れ！', { fontFamily: FONT, fontSize: '19px', color: '#ffd27a' }).setOrigin(0.5).setStroke('#120a04', 5);
    const info = this.add.text(W / 2, 600, '', { fontFamily: FONT, fontSize: '18px', color: '#ffffff' }).setOrigin(0.5).setStroke('#120a04', 4);
    box.add([scroll, me, say, info]);
    let t0 = this.time.now;
    let loop = null;
    let step = 0;
    const now = () => this.time.now - t0;
    const showInfo = (t) => info.setText(`見つかった ${run.found} / ${KW_STRIKES}　のこり ${Math.max(0, Math.ceil((KW_TIME - t) / 1000))}秒`);
    const tick = () => {
      const t = now();
      const r = stepRun(run, t);
      run = r.run;
      if (r.result === 'found') {
        sfx('mitsukaru');
        this.cameras.main.flash(180, 255, 220, 120);
        say.setText(run.failed ? '見張りに 囲まれた……！' : '「何やつ！」見つかった！ 一つ 戻れ！');
      } else if (r.result === 'safe') {
        sfx('kage');
        say.setText('……影に ひそんだ。');
      }
      // 灯りの帯（見張りの灯りが いま照らしている所）
      laneG.clear();
      run.lanes.forEach((lane, i) => {
        const y0 = yOf(i + 1) + 9, y1 = yOf(i) - 9;
        const cx = beamX(lane, t) * W;
        laneG.fillStyle(0x2a2440, 1).fillRect(0, y0, W, y1 - y0);
        laneG.fillStyle(0xffd27a, 0.55).fillRect(cx - lane.half * W, y0, lane.half * W * 2, y1 - y0);
        laneG.fillStyle(0xff8a3a, 1).fillCircle(cx, y0 + (y1 - y0) / 2, 5); // 見張りの 提灯
      });
      const pos = runPos(run, t);
      me.setPosition(W / 2, yOf(pos));
      if (run.dashFrom != null && (step++ % 4 === 0)) me.setFrame(frameOf('up', (step >> 2) % 4, look));
      showInfo(t);
      if (run.done || run.failed) finish(t);
    };
    const tap = () => {
      if (!loop) return;
      const r = tapRun(run, now());
      run = r.run;
    };
    const hit = this.add.zone(0, 0, W, 640).setOrigin(0).setInteractive();
    hit.on('pointerdown', tap);
    box.add(hit);
    const finish = () => {
      loop?.remove(false);
      loop = null;
      hit.removeAllListeners();
      const ok = run.done;
      stopBgm();
      sfx(ok ? 'win' : 'down');
      say.setText(ok ? '巻物を 取った！' : run.found >= KW_STRIKES ? '見張りに 見つかりすぎた……' : '時間切れ……');
      this.time.delayedCall(1100, () => {
        box.destroy();
        this.busy = false;
        startBgm(this.fieldBgm());
        if (!ok) {
          this.showMessages([{ text: '頭「まだ 影が 足りぬ。灯りの 動きを よく 見て、出直して まいれ。」' }]);
          return;
        }
        if (quest) { quest.onPass(); return; } // 職業の旅：忍者が 技を 習う（くノ一には ならない）
        const r = afterKagewatari(this.g);
        this.setGame(r.game);
        this.refreshStatus?.();
        const lines = [
          { text: '頭「見事。黒脛巾組の 名に かけて、そなたを くノ一と 認めよう。」' },
          { text: 'しおりは くノ一に なった！', jingle: 'join' },
          { text: '頭「わが 組の 苦無を さずける。それと、印を 結んで 呼ぶ 妖術を 二つ。」' },
          { text: 'しおりは 苦無を 手に入れた！' + (r.refund ? `（${EQUIP[r.old].name}は 引き取って もらった・${r.refund}文）` : '') },
          { text: 'しおりは 狐火の術と 幻の術を おぼえた！' },
          { speaker: 'しおり', text: 'たたかうときは 短剣で 二度 斬りこめる。語って 弱点が わかったら、狐火で 焼きはらうわ。' },
        ];
        this.showMessages(lines);
      });
    };
    showInfo(0);
    // 確かめ用の取っ手（遊ぶ人には見えない）
    this.kagewatari = { run: () => run, tap, now, tick };
    t0 = this.time.now;
    loop = this.time.addEvent({ delay: 16, loop: true, callback: tick });
  }

  // 須賀川の松明あかし（3章・10/4）。由来＝vault 調査ノートの6（須賀川市・福島県の公式）。⚠滅ぼした側・滅ぼされた側を 善し悪しで語らない
  taimatsuTalk() {
    const lines = [
      '五老山の 世話役「ここは 松明あかしの 山だ。毎年 十一月の 第二土曜に、大きな 松明に 火を つける。」',
      '世話役「むかし 須賀川城が 攻め落とされた ときに 亡くなった 人たちを、松明の 火で とむらうんだ。四百年 あまり 続いて いる。」',
    ];
    this.showMessages([...lines.map((text) => ({ text })), { text: '世話役「大松明に 火を 移す「火移し」を やって いかんか。火の粉が 松明の 真上に 来た 一瞬が 勝負だ。」' }], () => this.taimatsuMenu());
  }

  // 松明あかしの選び（10/5 夜 本人「須賀川のイベント祭りが無い」→「火移し」）
  taimatsuMenu() {
    this.showMenu(`松明点 ${this.g.taimatsuPts ?? 0}点（所持金 ${this.g.mon}文）`, [
      [`火移しに 加わる（${TAIMATSU_PRICE}文）`, () => this.startTaimatsu()],
      ['景品と 換える', () => this.prizeMenu(null, 'taimatsu')],
      ['御神火に 手を 合わせる', () => {
        this.setGame(prayGojinka(this.g));
        sfx('heal');
        this.showMessages([{ text: '御神火に 手を 合わせた。みなの 術の 力が 満ちた！' }]);
      }],
      ['立ち去る', () => this.closeDialog()],
    ]);
  }

  // 火移しの画面：夜の五老山に 大松明10本。火の粉が 左右に ゆれる。光っている松明の 真上に 来た瞬間に さわると 点火
  startTaimatsu() {
    const r0 = enterTaimatsu(this.g);
    if (!r0.ok) {
      this.showMessages([{ text: '文が 足りないようだ……' }], () => this.taimatsuMenu());
      return;
    }
    this.setGame(r0.game);
    this.closeDialog();
    this.busy = true;
    stopBgm();
    let r = newTaimatsu(makeRng((Date.now() & 0x7fffffff) || 1));
    const box = this.add.container(0, 0);
    this.addUi(box);
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0b0a2a, 0x0b0a2a, 0x3a1a3a, 0x3a1a3a, 1).fillRect(0, 0, W, 640);
    // 五老山の 稜線（左右対称に しない）
    bg.fillStyle(0x140c18, 1).beginPath().moveTo(0, 470).lineTo(70, 420).lineTo(150, 440).lineTo(230, 395).lineTo(300, 430).lineTo(W, 410).lineTo(W, 640).lineTo(0, 640).closePath().fillPath();
    box.add(bg);
    const SPARK_Y = 250;
    const TOP = 300;
    const torches = [...Array(TAIMATSU_TORCHES).keys()].map((i) => {
      const x = torchX(i) * W;
      const pole = this.add.rectangle(x, TOP + 70, 16, 140, 0x5a3a1a).setStrokeStyle(2, 0x2a1a0a);
      const ring = this.add.rectangle(x, TOP + 70, 24, 150, 0xffffff, 0).setStrokeStyle(3, 0xffe080, 0);
      const flame = this.add.circle(x, TOP - 8, 14, 0xff7a20).setVisible(false);
      const glow = this.add.circle(x, TOP - 8, 28, 0xffb040, 0.35).setVisible(false);
      box.add([glow, pole, ring, flame]);
      return { pole, ring, flame, glow };
    });
    const spark = this.add.circle(W / 2, SPARK_Y, 9, 0xffc060);
    const sparkGlow = this.add.circle(W / 2, SPARK_Y, 18, 0xff8020, 0.35);
    const say = this.add.text(W / 2, 60, '光る 松明の 真上で さわれ！', { fontFamily: FONT, fontSize: '19px', color: '#ffffff' }).setOrigin(0.5).setStroke('#1a1030', 5);
    const info = this.add.text(W / 2, 100, '', { fontFamily: FONT, fontSize: '18px', color: '#ffe9a8' }).setOrigin(0.5).setStroke('#1a1030', 5);
    const res = this.add.text(W / 2, 170, '', { fontFamily: FONT, fontSize: '26px', color: '#ffb040' }).setOrigin(0.5).setStroke('#1a1030', 6);
    box.add([sparkGlow, spark, say, info, res]);
    let t0 = this.time.now;
    let loop = null;
    let lock = 0;
    const now = () => this.time.now - t0;
    const mark = () => {
      const tg = taimatsuTarget(r);
      torches.forEach((o, i) => {
        const on = r.lit.includes(i);
        o.flame.setVisible(on);
        o.glow.setVisible(on);
        o.ring.setStrokeStyle(3, 0xffe080, i === tg ? 1 : 0);
      });
    };
    const showInfo = () => info.setText(`灯した ${r.lit.length} / ${TAIMATSU_TORCHES}　のこり ${Math.ceil(taimatsuLeft(r, now()) / 1000)}秒`);
    const tick = () => {
      const x = sparkX(r, now()) * W;
      spark.x = x;
      sparkGlow.x = x;
      sparkGlow.setAlpha(0.25 + 0.15 * Math.sin(this.time.now / 90));
      showInfo();
      if (taimatsuDone(r, now())) finish();
    };
    const tap = () => {
      if (!loop || this.time.now < lock) return;
      lock = this.time.now + 250;
      const out = tapTaimatsu(r, now());
      r = out.r;
      sfx(out.hit ? 'flame' : 'attack');
      res.setText(out.hit ? '点火！' : 'はずれ（−2秒）');
      this.tweens.add({ targets: res, alpha: { from: 1, to: 0 }, duration: 600 });
      mark();
      if (taimatsuDone(r, now())) finish();
    };
    const hit = this.add.zone(0, 0, W, 640).setOrigin(0).setInteractive();
    hit.on('pointerdown', tap);
    box.add(hit);
    const finish = () => {
      if (!loop) return;
      loop.remove(false);
      loop = null;
      hit.removeAllListeners();
      const pts = taimatsuPts(r);
      this.setGame(addTorches(this.g, r));
      sfx(r.lit.length >= TAIMATSU_TORCHES ? 'win' : 'select');
      this.time.delayedCall(1000, () => {
        box.destroy();
        this.busy = false;
        this.taimatsu = null;
        startBgm(this.fieldBgm());
        const all = r.lit.length >= TAIMATSU_TORCHES;
        this.showMessages([
          { text: `大松明を ${r.lit.length}本 灯した！${all ? ' 全部 灯った！' : ''}` },
          { text: `松明点を ${pts}点 もらった（いま ${this.g.taimatsuPts ?? 0}点）。` },
        ], () => this.taimatsuMenu());
      });
    };
    mark();
    showInfo();
    this.taimatsu = { r: () => r, tap, now, tick }; // 確かめ用の取っ手
    t0 = this.time.now;
    loop = this.time.addEvent({ delay: 16, loop: true, callback: tick });
  }

  // 猫啼温泉（3章・10/4）：HP・術が満タン＋呪い・取り憑きも落ちる（猫の病が治った湯）。力つきた仲間は戻らない
  onsenMenu(place = '猫啼') {
    this.showMenu(`${place}の 湯に つかりますか？ ${ONSEN_PRICE}文（所持金 ${this.g.mon}文）`, [
      ['つかる', () => {
        const r = soakOnsen(this.g);
        if (!r.ok) { this.showMessages([{ text: '文が 足りないようだ……' }]); return; }
        this.setGame(r.game);
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          sfx('heal');
          this.cameras.main.fadeIn(600, 0, 0, 0);
          this.showMessages([{ text: `${place}の 湯に ゆっくり つかった。つかれも 呪いも、すっかり 落ちた！` }]);
        });
      }],
      ['やめる', () => this.closeDialog()],
    ]);
  }

  innMenu(n) {
    this.showMenu(`ひと晩 ${n.price}文で ございます。お泊まりに なりますか？（所持金 ${this.g.mon}文）`, [
      ['はい', () => {
        const r = stayInn(this.g, n.price);
        if (!r.ok) {
          this.showMessages([{ text: 'お代が 足りない ようで ございます……' }]);
          return;
        }
        this.setGame(r.game);
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          sfx('heal');
          this.cameras.main.fadeIn(600, 0, 0, 0);
          this.showMessages([{ text: 'ゆっくり 湯に つかって、つかれが すっかり とれた！' }]);
        });
      }],
      ['いいえ', () => this.showMessages([{ text: 'またの お越しを。' }])],
    ]);
  }

  // 呪い（八幡さまの お祓い）・取り憑き（お寺の 供養）を治す
  cureMenu(fn, price, word, flag) {
    if (!Object.values(this.g.party).some((p) => p[flag])) {
      this.showMessages([{ text: flag === 'ghost' ? 'いまは 何も 憑いて おらぬな。' : 'いまは 呪いは かかって いないようです。' }]);
      return;
    }
    this.showMenu(`${word}を いたしましょうか？ ${price}文 です。（所持金 ${this.g.mon}文）`, [
      ['はい', () => {
        const r = fn(this.g);
        if (!r.ok) {
          this.showMessages([{ text: '文が 足りないようだ……' }]);
          return;
        }
        this.setGame(r.game);
        sfx('reveal');
        this.cameras.main.flash(500, 255, 255, 230);
        this.showMessages([{ text: flag === 'ghost' ? '霊は 安らかに 去っていった。体が 軽くなった！' : '呪いが とけた！ 体が 自由に 動く。' }]);
      }],
      ['いいえ', () => this.closeDialog()],
    ]);
  }

  // 力つきて幽霊になった仲間を、文を払って生き返らせる（八幡さま・湯本のお寺）
  reviveMenu() {
    const dead = Object.keys(this.g.party).filter((id) => this.g.party[id].dead);
    if (!dead.length) {
      this.showMessages([{ text: 'いまは 生き返らせる 人は おらぬようじゃ。' }]);
      return;
    }
    const price = revivePrice(this.g) * dead.length;
    this.showMenu(`${dead.map((id) => nameOf(this.g, id)).join('と ')}を 生き返らせますか？ ${price}文 です。（所持金 ${this.g.mon}文）`, [
      ['はい', () => {
        const r = revive(this.g);
        if (!r.ok) {
          this.showMessages([{ text: '文が 足りないようだ……' }]);
          return;
        }
        this.setGame(r.game);
        sfx('reveal');
        this.cameras.main.flash(600, 255, 255, 230);
        this.showMessages([{ text: `${r.who.map((id) => nameOf(this.g, id)).join('と ')}は 生き返った！` }]);
      }],
      ['いいえ', () => this.closeDialog()],
    ]);
  }

  // 小名浜の番屋：盗まれた道具を返してくれる
  banshoTalk() {
    const r = returnStolen(this.g);
    if (!r.ok) {
      this.showMessages([{ text: '番屋だ。盗まれた 物は ここに 届く。いまは 何も 預かって おらん。' }]);
      return;
    }
    this.setGame(r.game);
    sfx('heal');
    const names = [...new Set(r.got)].map((id) => `${ITEMS[id].name}×${r.got.filter((x) => x === id).length}`).join('、');
    this.showMessages([
      { text: '番屋だ。おお、狸に 盗まれた 品が 届いて おるぞ。' },
      { text: `${names}を 返してもらった！` },
    ]);
  }

  shrineMenu() {
    this.showMenu(`${this.town?.shrineName ?? '八幡さま'}で 何を しますか？`, [ // 1章の町は町ごとの名（towns.js の shrineName）
      ['お参りして 記録する', () => this.doSave()],
      // 右に効き目（本人 10/2「供養するとどうなる？」＝何が治るか書いていなかった）
      [`お祓い（${HARAI_PRICE}文）`, () => this.cureMenu(purify, HARAI_PRICE, 'お祓い', 'curse'), '呪いを とく'],
      // 1章・2章の神社（shrineName のある町）は 憑いた霊も祓う＝湯本の寺まで戻らなくてよい（10/4 化け猫・犬神が憑くため）
      ...(this.town?.shrineName ? [[`霊祓い（${KUYO_PRICE}文）`, () => this.cureMenu(kuyo, KUYO_PRICE, '霊祓い', 'ghost'), '憑いた霊を はらう']] : []),
      ['生き返らせる', () => this.reviveMenu(), '幽霊を もどす'],
      [`勝守（${EQUIP.kachimori.price}文）`, () => this.pickWho('kachimori', () => this.shrineMenu()), '攻+2'],
      ['やめる', () => this.closeDialog()],
    ]);
  }

  templeMenu() {
    this.showMenu('湯本の 寺で 何を しますか？', [
      [`供養（${KUYO_PRICE}文）`, () => this.cureMenu(kuyo, KUYO_PRICE, '供養', 'ghost'), '憑いた霊を はらう'],
      ['生き返らせる', () => this.reviveMenu(), '幽霊を もどす'],
      [`厄除け守（${EQUIP.yakuyoke.price}文）`, () => this.pickWho('yakuyoke', () => this.templeMenu()), '厄除け'],
      ['やめる', () => this.closeDialog()],
    ]);
  }

  // ---- 小名浜の釣り（本人 10/2「漁港で釣り」「何か景品付けて」「戦闘時に役立つもの」）----
  fishMenu() {
    this.showMenu(`釣り点 ${this.g.fishPts ?? 0}点（所持金 ${this.g.mon}文）`, [
      [`竿を 借りる（${ROD_PRICE}文）`, () => this.startFishing()],
      ['景品と 換える', () => this.prizeMenu(null, 'fish')],
      ['やめる', () => this.closeDialog()],
    ]);
  }

  prizeName(p) {
    return p.kind === 'item' ? `${ITEMS[p.id].name}${p.n > 1 ? `×${p.n}` : ''}` : EQUIP[p.id].name;
  }

  // 景品は「使う品」と「着ける品」に分ける（全部並べると窓に入らない）
  prizeMenu(kind = null, shopId = 'fish') {
    const shop = PRIZE_SHOPS[shopId];
    const pts = this.g[shop.key] ?? 0;
    if (!kind) {
      this.showMenu(`どちらの 景品に する？（${shop.label} ${pts}点）`, [
        ['戦いで 使う品', () => this.prizeMenu('item', shopId)],
        ['身に 着ける品', () => this.prizeMenu('equip', shopId)],
        ['もどる', () => this[shop.back]()],
      ]);
      return;
    }
    const opts = Object.entries(shop.prizes).filter(([, p]) => p.kind === kind).map(([pid, p]) => {
      const note = p.kind === 'item' ? `${p.pts}点 ${itemNote(ITEMS[p.id])}` : `${p.pts}点 ${equipNote(p.id)}`;
      return [this.prizeName(p), () => this.takePrize(pid, null, shopId), note];
    });
    this.showMenu(`景品（${shop.label} ${pts}点）`, [...opts, ['もどる', () => this.prizeMenu(null, shopId)]]);
  }

  takePrize(pid, who = null, shopId = 'fish') {
    const shop = PRIZE_SHOPS[shopId];
    const p = shop.prizes[pid];
    const pts = this.g[shop.key] ?? 0;
    if (pts < p.pts) {
      this.showMessages([{ text: `${shop.label}が 足りないな。あと ${p.pts - pts}点 だ。` }], () => this.prizeMenu(p.kind, shopId));
      return;
    }
    if (p.kind === 'equip' && !who) {
      const opts = membersOf(this.g).filter((w) => canWear(this.g, p.id, w)).map((w) => {
        const now = this.g.equip?.[w]?.[EQUIP[p.id].slot];
        const [, fn, note, color] = this.equipOption(p.id, w, () => this.takePrize(pid, w, shopId)); // いまと比べた変わり方（10/3）
        return [`${nameOf(this.g, w)}（今：${now ? EQUIP[now].name : 'なし'}）`, fn, note, color];
      });
      this.showMenu(`${EQUIP[p.id].name}（${equipNote(p.id)}）。だれが 着ける？`, [...opts, ['もどる', () => this.prizeMenu('equip', shopId)]]);
      return;
    }
    const r = shop.exchange(this.g, pid, who);
    if (!r.ok) return;
    this.setGame(r.game);
    sfx('heal');
    this.showGoods(p.id);
    const lines = [{ text: p.kind === 'item' ? `${this.prizeName(p)}を もらった！` : `${nameOf(this.g, who)}は ${EQUIP[p.id].name}を 身に着けた！` }];
    if (r.old) lines.push({ text: r.refund > 0 ? `（${EQUIP[r.old].name}は ${r.refund}文で 引き取って もらった）` : `（${EQUIP[r.old].name}は ${shop.keeper}に あずけた）` });
    this.showMessages(lines, () => this.prizeMenu(p.kind, shopId));
  }

  // 釣りの画面：海と桟橋とうき。①「！」でさわる ②針が緑の帯に入ったらさわる
  startFishing() {
    const r = rentRod(this.g);
    if (!r.ok) {
      this.showMessages([{ text: '文が 足りないようだ……' }], () => this.fishMenu());
      return;
    }
    this.setGame(r.game);
    this.closeDialog();
    this.busy = true;
    const rng = makeRng((Date.now() & 0x7fffffff) || 1);
    const box = this.add.container(0, 0);
    this.addUi(box);
    // 背景＝Gemini の釣り場（空 y0〜約200・海〜約480・桟橋その下）
    box.add(this.add.image(0, 0, 'bg_fishing').setOrigin(0));
    const say = this.add.text(W / 2, 40, '', { ...style(20), align: 'center' }).setOrigin(0.5, 0).setStroke('#1a1030', 5);
    const hint = this.add.text(W / 2, 604, '', { ...style(16, '#ffe9b0'), align: 'center' }).setOrigin(0.5).setStroke('#1a1030', 5);
    const line = this.add.line(0, 0, 180, 560, 200, 330, 0xeeeeee, 0.8).setOrigin(0); // 桟橋の先から うきへ
    const bob = this.add.container(200, 330);
    bob.add(this.add.circle(0, 0, 9, 0xffffff));
    bob.add(this.add.circle(0, -5, 9, 0xd83030).setScale(1, 0.55));
    const mark = this.add.text(200, 270, '！', style(44, '#ffd34d')).setOrigin(0.5).setVisible(false).setStroke('#1a1030', 6);
    box.add([line, bob, say, hint, mark]);
    const bobTween = this.tweens.add({ targets: bob, y: 336, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const tap = this.add.rectangle(0, 0, W, 640, 0x000000, 0.001).setOrigin(0).setInteractive();
    box.add(tap);
    let stage = 'wait';
    let biteAt = 0;
    const fishId = rollFish(rng);
    const f = FISH[fishId];
    let gaugeT = null;
    let pos = 0;
    let dir = 1;
    let zs = 0;
    const end = (lines) => {
      stage = 'done';
      gaugeT?.remove(false);
      bobTween.stop();
      this.time.delayedCall(250, () => { box.destroy(); this.busy = false; this.showMessages(lines, () => this.fishMenu()); });
    };
    // 確かめ用の取っ手（自動の試験が「！」や針の位置を見て さわる。遊ぶ人には見えない）
    this.fishing = { stage: () => stage, tap: () => tap.emit('pointerdown'), inZone: () => inZone(fishId, zs, pos), fish: fishId };
    say.setText('うきを 見て、魚が かかるのを 待とう');
    hint.setText('うきが しずんで「！」が 出たら さわる');
    const wait = WAIT_MS[0] + rng() * (WAIT_MS[1] - WAIT_MS[0]);
    const biteTimer = this.time.delayedCall(wait, () => {
      if (stage !== 'wait') return;
      stage = 'bite';
      biteAt = this.time.now;
      bobTween.pause();
      bob.y = 346;
      mark.setVisible(true);
      sfx('select');
      this.time.delayedCall(BITE_WINDOW_MS, () => {
        if (stage === 'bite') end([{ text: '……おそかった。えさだけ 取られて しまった。' }]);
      });
    });
    const startReel = () => {
      stage = 'reel';
      mark.setVisible(false);
      say.setText('かかった！ 針が 緑に 入ったら さわる');
      hint.setText('');
      zs = zoneStart(fishId, rng);
      const gx = 40;
      const gw = W - 80;
      const gy = 400; // 海の上（桟橋の柱 y 約405 より上）
      const gg = this.add.graphics();
      gg.fillStyle(0x1a1030, 0.9).fillRoundedRect(gx - 6, gy - 16, gw + 12, 32, 8);
      gg.fillStyle(0x6a5a8a, 1).fillRect(gx, gy - 8, gw, 16);
      gg.fillStyle(0x4cd964, 1).fillRect(gx + zs * gw, gy - 8, f.zone * gw, 16);
      const needle = this.add.rectangle(gx, gy, 4, 30, 0xffffff);
      box.add([gg, needle]);
      // 針は端から端まで f.speed 秒で往復
      gaugeT = this.time.addEvent({ delay: 16, loop: true, callback: () => {
        pos += (dir * 16) / (f.speed * 1000);
        if (pos >= 1) { pos = 1; dir = -1; }
        if (pos <= 0) { pos = 0; dir = 1; }
        needle.x = gx + pos * gw;
      } });
    };
    tap.on('pointerdown', () => {
      if (stage === 'wait') {
        biteTimer.remove(false);
        end([{ text: '早すぎた！ 魚が 逃げて しまった。' }]);
      } else if (stage === 'bite') {
        if (this.time.now - biteAt <= BITE_WINDOW_MS) startReel();
      } else if (stage === 'reel') {
        if (inZone(fishId, zs, pos)) {
          this.setGame(addCatch(this.g, fishId));
          sfx(f.pt >= 5 ? 'win' : 'clear');
          this.time.delayedCall(260, () => this.showGoods(fishId)); // 釣れた魚の絵
          end([
            { text: `${f.name}が 釣れた！${f.pt ? `（釣り点 +${f.pt}　いま ${this.g.fishPts}点）` : ''}` },
            { speaker: 'しおり', text: f.line },
          ]);
        } else {
          sfx('down');
          end([{ text: 'ああっ、糸が 切れて しまった……' }]);
        }
      }
    });
  }

  // ---- 二本松の提灯祭り（本人 10/4「各章1つ、イベントを」→ 2章＝二本松の提灯祭り）----
  chochinTalk() {
    this.showMessages(CHOCHIN_LINES.intro.map((text) => ({ speaker: '世話役', text })), () => this.chochinMenu());
  }

  chochinMenu() {
    this.showMenu(`提灯点 ${this.g.chochinPts ?? 0}点（所持金 ${this.g.mon}文）`, [
      [`太鼓台に 乗る（${CHOCHIN_PRICE}文）`, () => this.startChochin()],
      ['景品と 換える', () => this.prizeMenu(null, 'chochin')],
      ['やめる', () => this.closeDialog()],
    ]);
  }

  // 提灯祭りの画面：夜の町に太鼓台（提灯100個）。拍の輪が太鼓に重なる瞬間に さわると提灯が灯る
  startChochin() {
    const r = enterRound(this.g);
    if (!r.ok) {
      this.showMessages([{ text: '文が 足りないようだ……' }], () => this.chochinMenu());
      return;
    }
    this.setGame(r.game);
    this.closeDialog();
    this.busy = true;
    stopBgm();
    let round = newRound(makeRng((Date.now() & 0x7fffffff) || 1));
    const box = this.add.container(0, 0);
    this.addUi(box);
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0b0a24, 0x0b0a24, 0x2a1838, 0x2a1838, 1).fillRect(0, 0, W, 640);
    // 町の屋根の影
    bg.fillStyle(0x120d1c, 1);
    for (let x = -20; x < W; x += 70) bg.fillTriangle(x, 470, x + 35, 440, x + 70, 470).fillRect(x, 470, 70, 60);
    bg.fillStyle(0x1a1410, 1).fillRect(0, 530, W, 110);
    box.add(bg);
    // 太鼓台：上が細い ピラミッドに提灯を並べる（下から 14・13・…）
    const spots = [];
    for (let row = 0, n = 14; spots.length < CHOCHIN_LANTERNS; row++, n = Math.max(4, n - 1)) {
      for (let i = 0; i < n && spots.length < CHOCHIN_LANTERNS; i++) spots.push({ x: W / 2 + (i - (n - 1) / 2) * 17, y: 420 - row * 22 });
    }
    const frame = this.add.graphics();
    frame.fillStyle(0x3a2412, 1).fillRect(W / 2 - 130, 430, 260, 34);
    frame.fillStyle(0xc9a24a, 1).fillRect(W / 2 - 130, 430, 260, 4);
    frame.lineStyle(2, 0x5a3a1a, 1);
    for (const s of spots) frame.lineBetween(s.x, s.y - 9, s.x, s.y - 14);
    box.add(frame);
    const lamps = spots.map((s) => this.add.ellipse(s.x, s.y, 13, 16, 0x4a1a1a).setStrokeStyle(1, 0x2a0a0a));
    box.add(lamps);
    // 太鼓と拍の輪（輪が縮んで太鼓に重なる瞬間に さわる）
    const DRUM = { x: W / 2, y: 560 };
    const drum = this.add.circle(DRUM.x, DRUM.y, 30, 0x8a4a1a).setStrokeStyle(4, 0xe8d0a0);
    const ringG = this.add.graphics();
    const say = this.add.text(W / 2, 70, '太鼓に 合わせて さわれ！', { fontFamily: FONT, fontSize: '20px', color: '#ffd27a' }).setOrigin(0.5).setStroke('#120a04', 5);
    const score = this.add.text(W / 2, 110, '', { fontFamily: FONT, fontSize: '18px', color: '#ffffff' }).setOrigin(0.5).setStroke('#120a04', 4);
    const grade = this.add.text(W / 2, 505, '', { fontFamily: FONT, fontSize: '22px', color: '#ffd27a' }).setOrigin(0.5).setStroke('#120a04', 5);
    box.add([drum, ringG, say, score, grade]);
    const showScore = () => score.setText(`提灯 ${round.lit} / ${CHOCHIN_LANTERNS}`);
    const relight = () => lamps.forEach((l, i) => l.setFillStyle(i < round.lit ? 0xff4a2a : 0x4a1a1a).setStrokeStyle(1, i < round.lit ? 0xffd27a : 0x2a0a0a));
    let t0 = this.time.now;
    let cued = 0;
    let loop = null;
    const now = () => this.time.now - t0;
    const tick = () => {
      const t = now();
      // 拍の合図の音（打つ拍の ちょうどの時刻に鳴る）
      while (cued < round.beats.length && round.beats[cued].t <= t) { sfx(round.beats[cued].big ? 'ootaiko' : 'taiko'); cued += 1; }
      // 次の拍の輪：拍の 1拍前から 縮む
      ringG.clear();
      const next = round.beats.find((b, i) => !round.hit.includes(i) && b.t + CHOCHIN_OK > t);
      if (next) {
        const k = Math.max(0, Math.min(1, (next.t - t) / CHOCHIN_BEAT));
        ringG.lineStyle(next.big ? 6 : 4, next.big ? 0xff4a2a : 0xffd27a, 1).strokeCircle(DRUM.x, DRUM.y, 30 + k * 70);
      }
      if (t > roundEndAt(round)) finish();
    };
    const tap = () => {
      if (!loop) return;
      const res = tapAt(round, now());
      round = res.round;
      if (res.grade === 'miss') { grade.setText(''); return; }
      grade.setText(res.grade === 'yoi' ? 'よい！' : 'まあ');
      sfx('kane');
      this.tweens.add({ targets: drum, scale: 1.15, duration: 60, yoyo: true });
      relight();
      showScore();
    };
    const hit = this.add.zone(0, 0, W, 640).setOrigin(0).setInteractive();
    hit.on('pointerdown', tap);
    box.add(hit);
    const finish = () => {
      loop?.remove(false);
      loop = null;
      hit.removeAllListeners();
      const pts = chochinPts(round);
      this.setGame(addLanterns(this.g, round.lit));
      say.setText('そこまで！');
      sfx(pts ? 'win' : 'down');
      this.time.delayedCall(1000, () => {
        box.destroy();
        this.busy = false;
        startBgm(this.fieldBgm());
        const lines = [{ text: round.lit ? `提灯を ${round.lit}個 灯した！（提灯点 +${pts}　いま ${this.g.chochinPts}点）` : '提灯は 1つも 灯らなかった……' }];
        if (round.lit >= CHOCHIN_LANTERNS) lines.push({ text: '太鼓台の 提灯が すべて 灯った！ 見事な 宵祭りだ。' });
        lines.push({ speaker: 'しおり', text: pts ? CHOCHIN_LINES.after : CHOCHIN_LINES.none });
        this.showMessages(lines, () => this.chochinMenu());
      });
    };
    showScore();
    // 確かめ用の取っ手（遊ぶ人には見えない）
    this.chochin = { round: () => round, tap, now, tick };
    t0 = this.time.now;
    loop = this.time.addEvent({ delay: 16, loop: true, callback: tick });
  }

  // ---- 雲雀ヶ原の祭場地：相馬野馬追の神旗争奪戦（本人 10/3「小名浜の釣りのような」）----
  // 確かめた事だけ語る：本祭りの会場は雲雀ヶ原祭場地・甲冑競馬と、花火で打ち上げた神旗を騎馬武者が奪い合う神旗争奪戦（日取りは書かない）
  nomaoiTalk() {
    this.showMessages(NOMAOI_LINES.intro.map((text) => ({ speaker: '世話役', text })), () => this.nomaoiMenu());
  }

  nomaoiMenu() {
    this.showMenu(`旗点 ${this.g.flagPts ?? 0}点（所持金 ${this.g.mon}文）`, [
      [`神旗を 追う（${ENTRY_PRICE}文）`, () => this.startNomaoi()],
      ['景品と 換える', () => this.prizeMenu(null, 'flag')],
      ['やめる', () => this.closeDialog()],
    ]);
  }

  // 争奪戦の画面：花火で上がった旗が ゆらゆら落ちる → 画面を おさえた方へ 馬が走る → 旗の真下で受け取る
  startNomaoi() {
    const r = enterRace(this.g);
    if (!r.ok) {
      this.showMessages([{ text: '文が 足りないようだ……' }], () => this.nomaoiMenu());
      return;
    }
    this.setGame(r.game);
    this.closeDialog();
    this.busy = true;
    startBgm('nomaoi');
    let race = newRace(makeRng((Date.now() & 0x7fffffff) || 1));
    const X = (x) => 30 + x * 300;
    const GROUND = 560;
    const Y = (p) => 90 + p * (GROUND - 90); // 旗が騎馬の高さ（CATCH_P）に来るのは y 約475
    const box = this.add.container(0, 0);
    this.addUi(box);
    // 背景（Gemini の絵が届くまでは 描いた空と原）
    if (this.textures.exists('bg_nomaoi')) box.add(this.add.image(0, 0, 'bg_nomaoi').setOrigin(0));
    else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x2a3a78, 0x2a3a78, 0xf0a868, 0xf0a868, 1).fillRect(0, 0, W, 340);
      bg.fillStyle(0x3d5a2a, 1).fillTriangle(-40, 340, 90, 285, 220, 340).fillTriangle(140, 340, 290, 270, 420, 340);
      bg.fillStyle(0x6a9a40, 1).fillRect(0, 335, W, 305);
      bg.fillStyle(0x7aa84a, 1).fillRect(0, 400, W, 4).fillRect(0, 470, W, 3);
      bg.fillStyle(0x5a3a1a, 1);
      for (let x = 6; x < W; x += 22) bg.fillRect(x, 580, 4, 26);
      bg.fillRect(0, 588, W, 3);
      box.add(bg);
    }
    // 騎馬（馬＋武者＋背中の旗）。旅の者は金の旗と▼
    if (!this.textures.exists('nomaoi_uma')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x6b3e1e, 1).fillEllipse(24, 24, 34, 14);
      g.fillRect(34, 10, 6, 14).fillEllipse(42, 11, 12, 7);
      g.lineStyle(3, 0x4a2a12, 1);
      for (const lx of [12, 17, 31, 36]) g.lineBetween(lx, 28, lx + (lx % 2 ? 2 : -2), 44);
      g.lineBetween(7, 22, 2, 32);
      g.generateTexture('nomaoi_uma', 50, 46);
      g.clear();
      g.fillStyle(0xffffff, 1).fillRect(6, 10, 12, 14).fillCircle(12, 6, 5);
      g.generateTexture('nomaoi_bushi', 24, 26);
      g.clear();
      g.fillStyle(0x3a2a1a, 1).fillRect(0, 0, 2, 30);
      g.fillStyle(0xffffff, 1).fillRect(2, 0, 9, 14);
      g.generateTexture('nomaoi_sashi', 12, 30);
      g.clear();
      g.fillStyle(0x3a2a1a, 1).fillRect(0, 0, 2, 26);
      g.fillStyle(0xffffff, 1).fillRect(2, 0, 16, 12);
      g.generateTexture('nomaoi_flag', 18, 26);
      g.destroy();
    }
    const rider = (armor, sashi) => {
      const c = this.add.container(0, GROUND);
      c.add(this.add.image(0, -24, 'nomaoi_uma'));
      c.add(this.add.image(-4, -50, 'nomaoi_bushi').setTint(armor));
      c.add(this.add.image(-10, -72, 'nomaoi_sashi').setTint(sashi));
      return c;
    };
    // Gemini の騎馬の絵が届いていれば それを使う（0＝旅の者・1〜3＝ほか）。右を向いた絵＝左へ走るときは裏返す（place）
    const riderImg = (i) => {
      const c = this.add.container(0, GROUND);
      c.add(this.add.image(0, 0, `nomaoi_rider_${i}`).setOrigin(0.5, 1));
      return c;
    };
    const useImg = RIDERS.length === 4 && [0, 1, 2, 3].every((i) => this.textures.exists(`nomaoi_rider_${i}`));
    const rivalViews = useImg ? [1, 2, 3].map(riderImg) : [[0x3a3a46, 0x2e6bd8], [0x5a2a2a, 0xf0f0f0], [0x2a4a3a, 0x9a3ad0]].map(([a, b]) => rider(a, b));
    const me = useImg ? riderImg(0) : rider(0xd8c8a0, 0xffd34d);
    const meMark = this.add.text(0, GROUND - 104, '▼', style(18, '#ffd34d')).setOrigin(0.5).setStroke('#1a1030', 4);
    box.add([...rivalViews, me, meMark]);
    const say = this.add.text(W / 2, 22, '花火が 上がったら、旗の 下へ！', { ...style(18), align: 'center' }).setOrigin(0.5, 0).setStroke('#1a1030', 5);
    const score = this.add.text(W / 2, 52, '', style(16, '#ffe9b0')).setOrigin(0.5, 0).setStroke('#1a1030', 5);
    const hint = this.add.text(W / 2, 620, '画面を おさえた 方へ 馬が 走る', style(14, '#ffffff')).setOrigin(0.5).setStroke('#1a1030', 4);
    box.add([say, score, hint]);
    // 画面の下の窓・十字キーへ さわりが抜けないように、上を覆う
    const cover = this.add.rectangle(0, 0, W, 640, 0x000000, 0.001).setOrigin(0).setInteractive();
    box.add(cover);
    const flagViews = new Map();
    const whistled = new Set();
    let forced = null; // 確かめ用（自動の試験が 馬を動かす）
    const showScore = () => score.setText(`のこり ${Math.ceil((ROUND_MS - race.t) / 1000)}　旗 ${race.mine.length}本　${racePts(race)}点`);
    const burst = (x, y, color) => {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const dot = this.add.circle(x, y, 3, i % 2 ? color : 0xfff4c0);
        box.add(dot);
        this.tweens.add({ targets: dot, x: x + Math.cos(a) * 46, y: y + Math.sin(a) * 46, alpha: 0, duration: 700, ease: 'Quad.Out', onComplete: () => dot.destroy() });
      }
    };
    const place = (view, x) => {
      const nx = X(x);
      if (Math.abs(nx - view.x) > 0.5) view.list[0].setFlipX(nx < view.x);
      view.x = nx;
    };
    const tick = () => {
      let move = 0;
      const p = this.input.activePointer;
      if (forced !== null) move = forced;
      else if (this.keys?.left.isDown) move = -1;
      else if (this.keys?.right.isDown) move = 1;
      else if (p.isDown && Math.abs(p.x - X(race.horse)) > 4) move = Math.sign(p.x - X(race.horse));
      for (const f of race.flags) {
        if (f.state === 'wait' && race.t >= f.t0 - 360 && !whistled.has(f.id)) {
          whistled.add(f.id);
          sfx('hanabi');
        }
      }
      const step = stepRace(race, 16, move);
      race = step.race;
      for (const e of step.events) {
        const f = race.flags[e.flag];
        if (e.type === 'launch') {
          const v = this.add.image(X(f.x0), Y(0), 'nomaoi_flag').setTint(FLAGS[f.kind].color).setOrigin(0.1, 1);
          box.add(v);
          box.bringToTop(cover);
          flagViews.set(f.id, v);
          burst(X(f.x0), Y(0), FLAGS[f.kind].color);
        } else {
          const v = flagViews.get(f.id);
          flagViews.delete(f.id);
          if (e.type === 'catch') {
            const to = e.who === 'me' ? me : rivalViews[e.who];
            if (e.who === 'me') sfx(f.kind === 'kin' ? 'win' : 'heal');
            this.tweens.add({ targets: v, x: to.x, y: to.y - 70, alpha: 0, duration: 380, onComplete: () => v.destroy() });
          } else {
            this.tweens.add({ targets: v, y: GROUND + 10, alpha: 0, duration: 400, onComplete: () => v.destroy() });
          }
        }
      }
      for (const [id, v] of flagViews) {
        const f = race.flags[id];
        v.setPosition(X(flagX(f, race.t)), Y(Math.min(1, fallP(f, race.t))));
        v.angle = 12 * Math.sin(race.t / 300 + f.phase);
      }
      place(me, race.horse);
      meMark.x = me.x;
      race.rivals.forEach((x, i) => place(rivalViews[i], x));
      showScore();
      if (race.done) finish();
    };
    let loop = null;
    const finish = () => {
      loop?.remove(false);
      loop = null;
      const pts = racePts(race);
      const n = race.mine.length;
      const kin = race.mine.filter((k) => k === 'kin').length;
      this.setGame(addFlags(this.g, race.mine));
      say.setText('そこまで！');
      sfx(n ? 'win' : 'down');
      this.time.delayedCall(900, () => {
        box.destroy();
        this.busy = false;
        startBgm(this.fieldBgm());
        const lines = [{ text: n ? `神旗を ${n}本 取った！（旗点 +${pts}　いま ${this.g.flagPts}点）` : '神旗は 1本も 取れなかった……' }];
        if (kin) lines.push({ text: `金の 神旗も ${kin}本 あった！` });
        lines.push({ speaker: 'しおり', text: n ? NOMAOI_LINES.after : NOMAOI_LINES.none });
        this.showMessages(lines, () => this.nomaoiMenu());
      });
    };
    showScore();
    // 確かめ用の取っ手（遊ぶ人には見えない）
    this.nomaoi = { race: () => race, hold: (m) => { forced = m; }, x: (v) => X(v), tick };
    this.time.delayedCall(900, () => {
      say.setText('');
      loop = this.time.addEvent({ delay: 16, loop: true, callback: tick });
    });
  }

  // ---- 刀屋・荒物屋・お守り：買うと その場で着ける（前の品は半値で引き取り）----
  // 刀屋・荒物屋：いま旅にいる人が着けられる品だけ並べる。猟師がいれば鉄砲の玉も（本人 10/2「玉は武器屋で売っている」）
  // 品が多い（4人ぶんの得物＋玉で10行・窓に入らない）ときは、先に「だれの 得物？」と人を選び、その人の品だけ並べる
  equipShop(goods, items = [], who = null) {
    const members = membersOf(this.g);
    const back = () => this.equipShop(goods, items, who);
    const forWho = (w) => goods.filter((id) => canWear(this.g, id, w)); // 武器は その職業の系統だけ（10/5）
    const all = goods.filter((id) => members.some((w) => canWear(this.g, id, w)));
    // 道具の棚（本人 10/3「よろず屋でも採用」＝道具屋と同じく 効き目と持っている数を出す）。鉄砲の玉は猟師がいる時だけ
    const sell = items.filter((id) => ITEMS[id].kind !== 'ammo' || members.includes('kariudo'));
    const shelf = { goods: sell, back: () => this.equipShop(goods, items) };
    const shelfRow = sell.length ? [[sell.every((id) => ITEMS[id].kind === 'ammo') ? '鉄砲の 玉を 買う' : '道具を 買う', () => this.shopMenu(shelf)]] : [];
    if (who) {
      // その人の品：選べば そのまま その人が着ける
      // 右の字＝いまの品と比べて どう変わるか（装備中の品は 灰色で 選べない・下がる物は 赤）
      const opts = forWho(who).map((id) => this.equipOption(id, who, () => this.doBuyEquip(id, who, back), `${EQUIP[id].price}文 `));
      this.showMenu(`${nameOf(this.g, who)}の 品（いまと くらべて）所持金 ${this.g.mon}文`, [...opts, ['もどる', () => this.equipShop(goods, items)]]);
      return;
    }
    if (all.length + shelfRow.length > 5) {
      // 10/5 武器と防具は職業ごと＝あなたと しおりは 職業も 添える（仲間は 名前が職業）
      const who = (w) => (w === 'tabi' || w === 'shiori') && jobOf(this.g, w) ? `${nameOf(this.g, w)}（${JOBS[jobOf(this.g, w)].name}）` : nameOf(this.g, w);
      const people = members.filter((w) => forWho(w).length).map((w) => [`${who(w)}の 品`, () => this.equipShop(goods, items, w)]);
      this.showMenu(`だれの 品を 見る？（所持金 ${this.g.mon}文）`, [...people, ...shelfRow, ['やめる', () => this.closeDialog()]]);
      return;
    }
    // 人を選ぶ前は 品の強さ（＋を付けない＝「上がる・下がる」と取り違えない）。人を選ぶと いまと比べた変わり方（pickWho）
    const opts = all.map((id) => [EQUIP[id].name, () => this.pickWho(id, back), `${EQUIP[id].price}文 ${equipNote(id).replaceAll('+', '')}`]);
    this.showMenu(`何を 買う？（右は 品の強さ・所持金 ${this.g.mon}文）`, [...opts, ...shelfRow, ['やめる', () => this.closeDialog()]]);
  }

  // 買った品の絵を、地図の真ん中に少しだけ出す（本人 10/2「買ったときにイラストを添えて」）。絵の無い品は出さない
  showGoods(id0) {
    const id = EQUIP[id0]?.icon ?? id0; // 職業ごとの品は 前の品の絵を使い回す（10/5）
    if (!this.textures.exists(`icon_${id}`)) return;
    const box = this.add.container(W / 2, 200);
    box.add(makeWindow(this, -64, -64, 128, 128));
    box.add(this.add.image(0, 0, `icon_${id}`).setScale(2));
    this.addUi(box);
    box.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: box, scale: 1, alpha: 1, duration: 220, ease: 'Back.Out' });
    this.time.delayedCall(1600, () => this.tweens.add({ targets: box, alpha: 0, duration: 300, onComplete: () => box.destroy() }));
  }

  pickWho(id, back) {
    const e = EQUIP[id];
    const eq = this.g.equip ?? START_EQUIP;
    const opts = membersOf(this.g).filter((w) => canWear(this.g, id, w)).map((w) => {
      const now = eq[w]?.[e.slot];
      const [, fn, note, color] = this.equipOption(id, w, () => this.doBuyEquip(id, w, back));
      return [`${nameOf(this.g, w)}（今：${now ? EQUIP[now].name : 'なし'}）`, fn, note, color];
    });
    this.showMenu(`${e.name}（${equipNote(id).replaceAll('+', '')}）。だれが 着ける？ 右は いまと くらべて（所持金 ${this.g.mon}文）`, [...opts, ['もどる', back]]);
  }

  // 装備の1行：[名前, 選んだとき, 右の字（いまと比べた変わり方）, 字の色]。装備中は選べない（同じ物を買い直さない）
  equipOption(id, who, onPick, prefix = '') {
    const now = (this.g.equip ?? START_EQUIP)[who]?.[EQUIP[id].slot] ?? null;
    if (id === now) return [EQUIP[id].name, null, '装備中', '#9a9a9a'];
    return [EQUIP[id].name, onPick, `${prefix}${diffNote(id, now)}`, diffDown(id, now) ? '#ff8a7a' : '#ffd34d'];
  }

  doBuyEquip(id, who, back) {
    const r = buyEquip(this.g, id, who);
    if (!r.ok) {
      this.showMessages([{ text: r.reason === 'money' ? '文が 足りないようだ……' : 'その人は 着けられない。' }], back);
      return;
    }
    this.setGame(r.game);
    sfx('heal');
    this.showGoods(id);
    const lines = [{ text: `${nameOf(this.g, who)}は ${EQUIP[id].name}を 身に着けた！` }];
    if (r.old) lines.push({ text: r.refund > 0 ? `（${EQUIP[r.old].name}は ${r.refund}文で 引き取って もらった）` : `（${EQUIP[r.old].name}は 店に 置いていった）` });
    this.showMessages(lines, back);
  }

  doSave() {
    this.showMenu('お参りして、旅を 記録しますか？', [
      ['はい', () => {
        const { game, text } = save(this.g);
        this.setGame(game);
        let stored = false;
        try {
          localStorage.setItem(SAVE_KEY, text);
          stored = true;
        } catch {
          // 端末の決まりで残せないときも、この遊びの間は続けられる
        }
        sfx('reveal');
        this.showMessages([
          { text: stored ? '旅の 記録を 残した。' : '（この 端末では 記録が 残せない ようだ……）' },
          { speaker: 'しおり', text: this.town?.shrineLine ?? '八幡さまは 武運の 神さまと 伝わるの。旅の 無事を お願いしましょう。' },
        ]);
      }],
      ['いいえ', () => this.closeDialog()],
    ]);
  }

  // ---- どうぐ：道具を使う・そうびを見る・ちずを見る・コレクション ----
  pressItems() {
    if (this.busy || this.moving) return;
    this.showMenu('どうする？', [
      ['道具を 使う', () => this.foodMenu()],
      ['そうびを 見る', () => this.showGear()],
      ['ちずを 見る', () => this.showMap()],
      ['コレクション', () => this.showCollection(0)],
      ['セーブして 終わる', () => this.saveAndQuit()],
      ['とじる', () => this.closeDialog()],
    ]);
  }

  // どうぐ → セーブして終わる（本人 10/3「通常画面→道具→セーブしてゲームを終了する」）＝その場で記録 → 題の画面へ（題から「つづきから」）
  saveAndQuit() {
    this.showMenu('旅を 記録して、ゲームを 終わりますか？', [
      ['はい', () => {
        const { game, text } = save(this.g);
        this.setGame(game);
        let stored = false;
        try {
          localStorage.setItem(SAVE_KEY, text);
          stored = true;
        } catch {
          // 端末の決まりで残せないときは、終わらずに知らせる（記録が消えるのを防ぐ）
        }
        sfx('reveal');
        if (!stored) {
          this.showMessages([{ text: '（この 端末では 記録が 残せない ようだ……）' }]);
          return;
        }
        this.showMessages([{ text: '旅の 記録を 残した。' }, { speaker: 'しおり', text: 'おつかれさま。また 続きを 語りましょうね。' }], () => {
          this.closeDialog();
          this.cameras.main.fadeOut(600, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('title'));
        });
      }],
      ['いいえ', () => this.closeDialog()],
    ]);
  }



  showGear() {
    const lines = partyView(this.g).map((p) => ({
      speaker: `${nameOf(this.g, p.id)}${p.job && (p.id === 'tabi' || p.id === 'shiori') ? `（${JOBS[p.job].name}）` : ''}　Lv ${p.lv}`, // 10/5 主人公・しおりは 職業を 添える
      face: p.id === 'shiori' ? 'normal' : FACE_IDS.includes(`job_${p.id}`) ? `job_${p.id}` : p.id, // 本人 10/3「しおり以外顔が無い。みんな顔をつけて」・10/5 職業の人物の顔が届いたら job_<職業>
      text: [`攻 ${p.atk}　守 ${p.def}　速 ${p.agi}　知 ${p.int}`, ...SLOTS.map((s) => `${SLOT_NAME[s]}：${p.gear[s] ? EQUIP[p.gear[s]].name : 'なし'}`),
        ...(p.job ? [`技：${[JOBS[p.job].basic, ...(this.g.skills?.[p.id] ?? [])].filter(Boolean).map((id) => JOB_SPELLS[id].name).join('・') || 'まだ ない'}`] : [])].join('\n'),
    }));
    this.showMessages(lines);
  }

  foodMenu() {
    const opts = Object.entries(this.g.items).filter(([id, k]) => k > 0 && !['ammo', 'bind'].includes(ITEMS[id].kind)).map(([id, k]) => { // 鉄砲の玉・投網は戦いで使う
      const it = ITEMS[id];
      return [`${it.name}×${k}`, () => this.eat(id), itemNote(it)];
    });
    this.showMenu(opts.length ? 'どの 道具を 使う？' : '道具を 何も 持っていない。', [...opts, ['とじる', () => this.closeDialog()]]);
  }

  eat(id) {
    const r = useItem(this.g, id);
    if (r.ok) {
      this.setGame(r.game);
      sfx('heal');
    }
    const lines = [{ text: r.text }];
    if (r.ok && ITEMS[id].desc) lines.push({ speaker: 'しおり', text: ITEMS[id].desc });
    this.showMessages(lines);
  }
}
