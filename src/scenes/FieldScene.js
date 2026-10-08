// 歩く地図（いわき）と町の中。本人 10/1「本来のドラクエらしく、山川を歩く、町で買い物や宿泊は？」
// 上 y0〜420 に地図（1マス32ドット・旅の者が真ん中、しおりと加わった仲間が1歩ずつうしろに続く）／下の窓に十字キーと「はなす」「どうぐ」
// 話す・店・宿の文と選びも下の窓（そのあいだ十字キーは隠す）
// 旅の状態は registry の 'game'（計算は src/field/game.js）。地図が変わる（町に入る・出る）たびに この場面を始め直す
import { collection, PER_PAGE } from '../field/collection.js?v=281';
import { stampOnsen, stampGourmet, lordTalk, wearReward, relicWait, endFoeReady, endRematch, karoTalk, rallyKeys, hasStamp, stampCount, rallyDone, relicFoeAt, stageNext, RELICS, GOURMET_RALLY, CASTLE_RALLY, RALLY_NAME } from '../field/rally.js?v=281';
import { GAME_FONT, TITLE_WEIGHT } from '../ui/fonts.js?v=281';
import { EPISODES } from '../data/episodes.js?v=281';
import { ITEMS, PRICE, itemNote } from '../data/items.js?v=281';
import { FISH, PRIZES, ROD_PRICE, BITE_WINDOW_MS, WAIT_MS, rollFish, zoneStart, inZone, rentRod, addCatch, exchange } from '../field/fishing.js?v=281';
import { RIDERS } from '../data/nomaoi_assets.js?v=281';
import { TAIMATSU_ART } from '../data/taimatsu_assets.js?v=281';
import { HADAKA_ART } from '../data/hadaka_assets.js?v=281';
import { RELIC_ART, RELIC_VOICE } from '../data/relic_assets.js?v=281';
import { WALL_HINT } from '../field/wall_hints.js?v=281';
import { ATTR_ART } from '../data/attr_assets.js?v=281';
import { ATTRACTIONS, ATTR_IDS, enterAttr, addAttrPts, exchangeAttr, jangaraPts, yuPts, warajiPts, hanaPts, darumaPts, darumaAll, swanPts, koboPts, WARAJI_GOAL, KOBO_THROWS, SWAN_ROUNDS } from '../field/attractions.js?v=281';
import { ATTR_PLAY, ATTR_TEXT } from './attractionsUI.js?v=281';
import { newRound as newHadaka, grab as grabRope, heightAt as ropeHeight, roundDone as hadakaDone, timeLeft as hadakaLeft, roundPts as hadakaPts, enterRound as enterHadaka, addRope, HADAKA_PRIZES, exchangeHadaka, ENTRY_PRICE as HADAKA_PRICE } from '../field/hadaka.js?v=281';
import { FLAGS, FLAG_PRIZES, ENTRY_PRICE, ROUND_MS, CATCH_P, newRace, stepRace, racePts, flagX, fallP, enterRace, addFlags, exchangeFlag } from '../field/nomaoi.js?v=281';
import { TILE } from '../field/tiles.js?v=281';
import { GROUNDS, OBJECTS, fieldLook, townLook } from '../field/look.js?v=281';
import { preloadKit, makeWindow, makeButton, makePad, paginate, fitSpeaker, hitBox } from '../ui/kit.js?v=281';
import { preloadPeople, frameOf, ORIGIN_Y } from '../field/sprites.js?v=281';
import { TOWNS, TOWN_OF, TOWN_CARD_NAME, townCardName, townEntry } from '../field/towns.js?v=281';
import { CASTLE_QUESTS, QUEST_BOSS_AT, GATE_OF, gateGround, gateMarks, enterCastle, leaveCastle } from '../field/castle.js?v=281';
import { KANBAN, kanbanAt } from '../field/kanban.js?v=281';
import { townSigns, SIGN_OF } from '../field/signs.js?v=281';
import { AILMENTS, badgesOf, hpColor } from '../field/ailments.js?v=281';
import { smooth, BRUSH_FONT } from '../ui/scroll.js?v=281';
import {
  mapRows, terrainAt, canWalk, tileNameAt, DELTA, BOSS_AT, WALL_OPENED_BY, SAVE_KEY, slotKey, maxOf,
  enterTown, leaveTown, buy, stayInn, save, autoSaveAfterBoss, useItem, walkStep, encounterAt,
  purify, kuyo, returnStolen, HARAI_PRICE, KUYO_PRICE, revive, revivePrice, NAME, nameOf, isField, crossAt, WALL_QUEST_LINES,
  wallQuestLines, startDuel, learnSkill, canTakeQuest } from '../field/game.js?v=281';
import { JOBS, JOB_SPELLS, QUESTS, jobOf } from '../data/jobs.js?v=281';
import { newMondo, answerMondo, mondoDone, mondoPassed, MONDO_COUNT, MONDO_PASS } from '../field/mondo.js?v=281';
import { newMato, shootMato, matoX, matoDone, matoPassed, MATO_ARROWS, MATO_PASS, MATO_HALF } from '../field/mato.js?v=281';
import { membersOf } from '../battle/levels.js?v=281';
import { COMPANIONS, LEARN_AFTER_LOSS, KUNOICHI } from '../data/companions.js?v=281';
import { ICON_IDS } from '../data/icons.js?v=281';
import { FACE_IDS, KUNOICHI_FACES } from '../data/faces.js?v=281';
import { EXTRA_LOOKS } from '../data/look_assets.js?v=281';
import { mapPointOf } from '../field/mapcard.js?v=281';
import { FISHING_ICON_IDS } from '../data/icons_fishing.js?v=281';
import { heroLook, heroFace, heroSexOf } from '../field/hero.js?v=281';
import { bathTown, bathBg } from '../field/bath.js?v=281';
import { BATH_ART } from '../data/bath_assets.js?v=281';
import { QUEST_ART, KAGURA_TORII } from '../data/quest_assets.js?v=281';
import { makeRng } from '../battle/rules.js?v=281';
import { newRun, tapRun, stepRun, runPos, beamX, LANES as KW_LANES, STRIKES as KW_STRIKES, TIME_MS as KW_TIME } from '../field/kagewatari.js?v=281';
import { EQUIP, SLOTS, SLOT_NAME, equipNote, diffNote, diffDown, canWear } from '../data/equip.js?v=281';

const STATUS_PAD = 96; // 上の札（4,4 から 高さ 16＋23×行）の下の端＋少し
const START_EQUIP = {}; // 前の形の名残（職業の旅は game.equip）
import { buyEquip, partyView, soakOnsen, ONSEN_PRICE, prayGojinka, afterKagewatari, CASTLE_CHARS } from '../field/game.js?v=281';
import { sfx, startBgm, stopBgm, playJingle, jingleSeconds, playVoice } from '../audio/chip.js?v=281';
import { newRound as newTaimatsu, tapAt as tapTaimatsu, sparkX, torchX, target as taimatsuTarget, roundDone as taimatsuDone, timeLeft as taimatsuLeft, roundPts as taimatsuPts, enterRound as enterTaimatsu, addTorches, TAIMATSU_PRIZES, exchangeTaimatsu, ENTRY_PRICE as TAIMATSU_PRICE, TORCHES as TAIMATSU_TORCHES, TIME_MS as TAIMATSU_MS, HALF as TAIMATSU_HALF } from '../field/taimatsu.js?v=281';
import { newRound, tapAt, roundEnd as roundEndAt, roundPts as chochinPts, enterRound, addLanterns, CHOCHIN_PRIZES, exchangeChochin, ENTRY_PRICE as CHOCHIN_PRICE, LANTERNS as CHOCHIN_LANTERNS, BEAT_MS as CHOCHIN_BEAT, OK_MS as CHOCHIN_OK, KAGURA_PASS, KAGURA_MISS, kaguraPassed } from '../field/chochin.js?v=281';

// 景品の窓（釣り＝小名浜の釣り番／旗＝雲雀ヶ原の世話役）。同じ窓を 点の名前と景品の表だけ替えて使う
const PRIZE_SHOPS = {
  chochin: { key: 'chochinPts', label: '提灯点', prizes: CHOCHIN_PRIZES, exchange: exchangeChochin, back: 'chochinMenu', keeper: '世話役' },
  fish: { key: 'fishPts', label: '釣り点', prizes: PRIZES, exchange, back: 'fishMenu', keeper: '釣り番' },
  flag: { key: 'flagPts', label: '旗点', prizes: FLAG_PRIZES, exchange: exchangeFlag, back: 'nomaoiMenu', keeper: '世話役' },
  taimatsu: { key: 'taimatsuPts', label: '松明点', prizes: TAIMATSU_PRIZES, exchange: exchangeTaimatsu, back: 'taimatsuMenu', keeper: '世話役' },
  hadaka: { key: 'hadakaPts', label: '縄のぼり点', prizes: HADAKA_PRIZES, exchange: exchangeHadaka, back: 'hadakaMenu', keeper: '世話役' },
};
// 町の催し7つ（10/7）の 景品
for (const id of ATTR_IDS) PRIZE_SHOPS[id] = { key: ATTRACTIONS[id].key, label: ATTRACTIONS[id].label, prizes: ATTRACTIONS[id].prizes, exchange: exchangeAttr(id), backFn: (sc) => sc.attrMenu(id), keeper: '世話役' };
// ラリーが そろった ときの しおりの ひと言（10/7→10/8 道具は 戦って もらう＝行き先の 知らせ）。3つの ラリーが そろった ときは all
const RELIC_SAY = {
  castle: '揚羽蝶は、平家の 紋として 知られて いるの。南会津の モーカケの滝に、旗の 手がかりが あるはずよ。',
  onsen: '福島の 湯を めぐった しるしね。会津駒ヶ岳へ 行けば、花が 手に 入るはず。',
  gourmet: '福島の 名物を 味わった おかげね。台本の ことは、檜枝岐の ばんばさまが 知って いるはず。',
  all: '三つの 旅が そろったわ！ 南会津で 三つの 道具を 手に 入れて、最後の 幕を 開けに 行きましょう。',
};
// 道具を 守る 相手に 勝って 手に 入れた 時の しおりの ひと言（10/9 本人「ラスボスに合うための3アイテム、ゲットしたら画像もだして」「音楽付きで」）
const RELIC_GOT_SAY = {
  more: (n) => `舞台に 供える 道具は、あと ${n}つ。そろったら 檜枝岐の 舞台へ 行きましょう。`,
  all: '三つの 道具が そろったわ！ 檜枝岐の 舞台へ 行って、最後の 幕を 開けましょう。',
};
// 判子の 文から「ぜんぶ そろった」「手がかり」を 外す＝図鑑の 上の 知らせの 場面で 見せる（10/7・先に 文で 言うと ネタばらし）
const noRelic = (lines) => lines.filter((x) => !x.includes('ぜんぶ そろった') && !x.includes('授かった') && !x.includes('手がかり'));
// 催しの 結果 → 点と ひと言
function attrResult(id, r) {
  switch (id) {
    case 'jangara': return { pts: jangaraPts(r.best), line: r.best ? `鉦と 太鼓の 打ち方を ${r.best}つまで 真似できた！` : '打ち方が そろわなかった……' };
    case 'yukagen': return { pts: yuPts(r.st), line: `ちょうど良い 湯加減を ${Math.floor(r.st.inBand / 1000)}秒 保った！` };
    case 'waraji': return { pts: warajiPts(r.st), line: r.st.dist >= WARAJI_GOAL ? '大わらじを 羽黒神社まで 運んだ！' : `大わらじを ${Math.round((r.st.dist / WARAJI_GOAL) * 100)}%まで 運んだ！` };
    case 'hanakatsumi': return { pts: hanaPts(r.good, r.bad), line: `花かつみを ${r.good}本 摘んだ！（まちがい ${r.bad}）` };
    case 'daruma': return darumaAll(r.st) ? { pts: darumaPts(r.st), line: `${r.st.moves}組で だるまを ぜんぶ 合わせた！` } : { pts: r.st.done.length / 2, line: `だるまを ${r.st.done.length / 2}組 合わせた。` };
    case 'hakucho': return { pts: swanPts(r.correct), line: `白鳥の 数を ${SWAN_ROUNDS}回中 ${r.correct}回 当てた！` };
    case 'kobosi': return { pts: koboPts(r.stood), line: `小法師が ${KOBO_THROWS}個中 ${r.stood}個 起き上がった！` };
    default: return { pts: 0, line: '' };
  }
}

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
const lookOf = (id, g) => (id === 'tabi' ? heroLook(g, EXTRA_LOOKS) : id === 'shiori' ? id : ownLook(id) ? `job_${id}` : JOB_LOOK[id]?.[0] ?? COMPANIONS[id]?.look ?? id);
const tintOf = (id) => (id === 'tabi' || id === 'shiori' || ownLook(id) ? null : JOB_LOOK[id]?.[1] ?? null);
// 旅の者は 10/6 夜 しおりの頭身で描き直した＝前の頭身の幽霊の絵は使わず 青く透かす
const HAS_GHOST = ['shiori', 'kariudo', 'sou'];
// 歩くとき いまの武器を手に持つ（10/6 本人「4人が歩いているときも、現在の装備に変えて欲しい」）＝武器の品の絵を小さくして手もとに重ねる
// 手に何も持たない絵だけ（武器を描きこんだ絵に重ねると2本になる）。職業の歩く絵は しおりの頭身で 手ぶらに描き直して ここへ足す
export const EMPTY_HANDS = ['shiori', 'tabi', 'tabi_f', ...['bushi', 'sou', 'yojutsu', 'ninja', 'rikishi', 'yumi', 'miko', 'onmyo', 'kusushi', 'yamabushi'].map((j) => `job_${j}`)];
// 向きごとの手の位置（足もとの点＝絵の origin からのずれ）・裏返し・人の後ろに隠すか
// しおりの絵で測った（肌の色の点）：正面の手＝(10,32)・横＝(17,30)・後ろ＝(25,31)／足もとの点＝(18,28)。刃先は体の外へ向ける
const HAND = { down: [-8, 4, true, false], up: [7, 3, false, false], left: [-1, 3, true, false], right: [1, 3, false, false] };
const HELD_SCALE = 0.32;

// もやの壁にぶつかったとき、しおりが言う手がかり
// ボスを元に戻して歩く地図へ帰ったときの、しおりの一言
const CLEARED_LINES = {
  // お城クエスト（10/7）＝お殿様に 知らせに 戻る
  onigajo: ['鬼ヶ城山の 鬼が、元に もどったわ。', '平の お城へ 戻って、お殿様に 知らせましょう。'],
  usunuma: ['臼沼の 大蛇が、元に もどったわ。', '相馬の お城へ 戻って、お殿様に 知らせましょう。'],
  oniishi: ['安達太良山の 鬼が、元に もどったわ。', '二本松の お城へ 戻って、お殿様に 知らせましょう。'],
  kenkatsura: ['剣桂の 鬼神が、桂の 木に 帰ったわ。', '白河の お城へ 戻って、お殿様に 知らせましょう。'],
  kagaminuma: ['鏡ヶ沼の 主が、元に もどったわ。', '鶴ヶ城へ 戻って、お殿様に 知らせましょう。'],
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
  kiyohime: ['これで 県中と 県南の 昔話は みんな 元に もどったわ。', '白河の 西、甲子峠を こえれば 会津よ。温泉の 師匠の 技を 4人とも 習ってから 行きましょう。'],
  // 4章 会津（10/6）
  kamehime: ['亀ヶ城の 北、猫魔ヶ岳への 道の もやが 晴れたわ！', '猫魔ヶ岳の 頂には、山の 主の 猫王が いると いうの。'],
  nekoma: ['猫魔ヶ岳の 西、磐梯山への 道の もやが 晴れたわ！', '磐梯山の 頂に、手の 長い 人と 足の 長い 人が いるみたい。'],
  ashinaga: ['磐梯山の 南、会津若松への 道の もやが 晴れたわ！', '若松は 鶴ヶ城の 城下町。支度を ととのえて、夜道には 気を つけて。'],
  shunobon: ['若松の 南、柳津への 道の もやが 晴れたわ！', '柳津は 只見川の ほとりの 町。圓藏寺の 撫牛を 見に 行きましょう。'],
  akabeko: ['只見川の 橋の もやが 晴れたわ！', '川の 向こうは 西会津。縄沢の 渕に、黒い うずが あるみたい。'],
  nawakappa: ['芹沼への 道の もやが 晴れたわ！', '芹沼の 野には、三匹の 悪狐が いると いうの。'],
  okon: ['南の 金山への 道の もやが 晴れたわ！', 'ここから 先は 雪の 国。沼沢湖に……湖の 主が 待っているの。'],
  numagozen: ['これで 会津の 昔話は みんな 元に もどったわ。', '金山の 南の 口の もやが 晴れた！ 終章「南会津」へ 行けるわ。'], // 10/8 南会津が できた（前は「準備中」）
  ochikerai: ['家来は、花を 守る 役目を 終えたのね。', '「駒ヶ岳の花」を 手に 入れた！'], // 終章（10/8）
  mokake: ['姫の 霊の 涙が、滝の しぶきに 溶けていったわ。', '「揚羽蝶の旗」を 手に 入れた！'], // 終章（10/8）
  teshita: ['手下たちは、道を 開けて くれたわ。', '幕の 奥に、大将が いる……。このまま 行きましょう！'], // 終章（10/8）＝そのまま 大将へ（FINAL_CHAIN）
  taisho: ['大将も、落人たちも、光に なって 昇っていったわ。', '福島じゅうの もやが、晴れていく……'], // 終章（10/8）＝終わりの 場面へ
  banba: ['ばんばさまが、また にこにこ顔に もどったわ。', '「お伊勢参りの 台本」を 手に 入れた！ 参道の もやも 晴れて、鎮守さまの 舞台へ 行けるわ。'], // 終章（10/8）
};
// いわきの北の口から 相馬へ入ったとき（1章の始まり）
const CROSS_KENPOKU = [
  { text: '虎捕山を 越えて 西へ。ここから 2章「県北」。' },
  { speaker: 'しおり', text: '霊山の ふもとよ。夜に 飴を 買いに くる 女の 人の 話が 伝わっているの。' },
  { speaker: 'しおり', text: '県北の 敵は 相馬より もっと 強いわ。福島の 町で 支度を ととのえましょう。' },
];
const CROSS_AIZU = [
  { text: '甲子峠を 西へ。ここから 4章「会津」。' },
  { speaker: 'しおり', text: '会津は 紅葉の 季節ね。猪苗代湖の ほとりから、昔話を たずねて いきましょう。' },
  { speaker: 'しおり', text: 'ここの 敵は 県中より もっと 強いわ。猪苗代の 町で 支度を ととのえましょう。' },
];
const CROSS_MINAMI = [
  { text: '金山の 山を 南へ。ここから 終章「南会津」。' },
  { speaker: 'しおり', text: '雪の 檜枝岐よ。鎮守さまの 境内に、村の 歌舞伎の 舞台が あるの。' },
  { speaker: 'しおり', text: 'ここの 敵は 会津より もっと 強いわ。檜枝岐の 村で 支度を ととのえましょう。' },
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
  // 10/7 本人「各モンスターを倒す、3つのクエストの重要性を冒頭説明してほしい」（道具の割り当ては rally.js の RELICS どおり）
  { speaker: 'しおり', text: 'もやの 奥には、忘れに 呑まれた 昔話の 主たちが いるの。' },
  { speaker: 'しおり', text: '戦って 鎮めれば、主は 元の 姿に 戻り、もやが 晴れて 先へ 進めるわ。' },
  { speaker: 'しおり', text: '元に 戻した 主は、図鑑に「祓」の 判子で 残るのよ。' },
  { speaker: 'しおり', text: 'それから、福島を めぐる 三つの 旅も 大事なの。' },
  { speaker: 'しおり', text: 'ひとつは 温泉めぐり。判子が そろうと「駒ヶ岳の 花」を 取りに 行けるの。' },
  { speaker: 'しおり', text: 'ふたつめは 名物の グルメ。そろうと「お伊勢参りの 台本」。' },
  { speaker: 'しおり', text: 'みっつめは お城の お殿様の お題。そろうと「揚羽蝶の 旗」。' },
  { speaker: 'しおり', text: '道具は、それを 守る 者に 勝って 手に 入れるのよ。' },
  { speaker: 'しおり', text: '判子は 湯に つかる、催しの 景品で 名物を もらう、お題を 果たすと もらえるわ。' },
  { speaker: 'しおり', text: 'この 三つが ないと、最後の 忘れの 化身は 姿を 現さないの。' }, // 10/8 夜 本人「冒頭しおりの話で、檜枝岐とあるが、初めは地名を言わないで」＝最後の 場所は 旅の 終わりまで 伏せる
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
export const FIELD_TEXT = JSON.stringify([WALL_HINT, TOWN_CARD_NAME, KANBAN.map((k) => [k.name, k.lines]), '立て札', WALL_QUEST_LINES, CHOCHIN_LINES, '提灯点よいまあそこまで灯した個太鼓台に乗る景品と換える', CLEARED_LINES, INTRO, CROSS_SOMA, CROSS_KENPOKU, CROSS_KENCHU, CROSS_AIZU, CROSS_MINAMI, TOWNS, ITEMS, NOMAOI_LINES, FLAGS, CASTLE_RALLY, CASTLE_QUESTS, RELICS, RALLY_NAME, SIGN_OF, '門番ここから先はお殿様が大広間でお待ちだへ入りますか？入るやめるお題を受けた入口がひらいた件で手一杯じゃそれが鎮まったらまた来てくれ件たのんだぞおおのもやをはらってくれたか礼を言うぞ地図に道しるべが立ったはずよ行ってみましょう家老へは', '：の判子をもらった！ぜんぶそろった授かったまだそろうと昔話温泉グルメお城「」よう来たそなたらの働き者はみな忘れぬぞ旅の者かひとつ頼みがあるおお果たしてくれたか礼を言うぞ'])
  + '装備中変わらない厄除け無しいまとくらべて右は品の強さ' // 10/3 装備の注記
  + ATTR_TEXT + JSON.stringify(ATTRACTIONS) + '判子がぜんぶそろった授かった終章檜枝岐の舞台に供える道具のひとつさわるともどる' + 'お殿様たちの願いがこもった旗ね揚羽蝶は平家の紋として知られているのよ福島の湯をめぐったしるしね会津駒ヶ岳の花とてもきれい名物を味わったおかげね檜枝岐の舞台で使う台本よ三つの道具がそろったわ最後の幕を開けに行きましょう' + '真似できた打ち方がそろわなかった湯加減を保った運んだ％摘んだまちがい組でぜんぶ合わせた回中当てた個中起き上がった' // 10/7 町の催し
  + '縄のぼり点加わる左手右手を交互に！高さ段のこり秒ずり落ちた鰐口に届いた麻縄をのぼりきって手が一年の無病息災を願ったぶん七日堂世話役百十三石段駆け上がる本堂下がるよじ登って男衆合図鐘夜' // 10/7 縄のぼり
  + '神旗を追う旗点景品と換えるそこまで！取ったなかった金のもあった！のこり本点画面をおさえた方へ馬が走る花火が上がったら、旗の下へ！世話役陣羽織'
  + 'はなすどうぐ文HP旅の者しおりいわき何を買う？やめる買った！足りないようだ……お泊まりになりますか？はいいいえひと晩でございますお代がゆっくり湯につかってつかれがすっかりとれた！お参りして旅を記録しますか？記録を残した八幡さまは武運の神さまと伝わる端末では残せないとくに何もないみたい黒いもやが道をふさいでいるうずまいている食べた回復した使えない▼▲◀▶';

// 図鑑の 札で「もう一度 戦う」を 出すか（10/9）：倒した 主・昔話の 戦い（EPISODES に ある）・勝った 直後の 続き（afterCollection）が 無い
export const REMATCH_OK = (it, scene) => !!it?.got && EPISODES.some((e) => e.enemy.id === it.id) && !scene?.afterCollection;

// 歩いて ぶつかると「はなす」と 同じに なる 印（終章の 道具を 守る 相手と 舞台・10/9）
export const BUMP_TALK = ['婆', '駒', '滝', '舞'];

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
    for (const [k, path] of Object.entries(QUEST_ART)) if (!this.textures.exists(`qa_${k}`)) this.load.image(`qa_${k}`, path); // 師匠の 試しの 絵（10/8）
    if (!this.textures.exists('qa_torii')) this.load.image('qa_torii', KAGURA_TORII);
    for (const [k, path] of Object.entries(BATH_ART)) if (!this.textures.exists(`bath_${k}`)) this.load.image(`bath_${k}`, path); // 温泉に つかる 場面（10/8）
    for (const id of [...ICON_IDS, ...FISHING_ICON_IDS]) if (!this.textures.exists(`icon_${id}`)) this.load.image(`icon_${id}`, `assets/icons/${id}.png`);
    if (!this.textures.exists('bg_fishing')) this.load.image('bg_fishing', 'assets/bg_fishing.png'); // 小名浜の釣り場（Gemini・夕焼けと灯台と桟橋）
    if (!this.textures.exists('bg_nomaoi')) this.load.image('bg_nomaoi', 'assets/bg_nomaoi.png');
    for (const [aid, art] of Object.entries(ATTR_ART)) {
      if (art?.bg && !this.textures.exists(`attrbg_${aid}`)) this.load.image(`attrbg_${aid}`, art.bg); // 町の催しの 背景（10/7）
      for (const [pn, f] of Object.entries(art?.parts ?? {})) if (!this.textures.exists(`attrp_${aid}_${pn}`)) this.load.image(`attrp_${aid}_${pn}`, f); // 催しの 中の 絵（10/7）
    }
    for (const [rid, f] of Object.entries(RELIC_ART)) if (!this.textures.exists(`relic_${rid}`)) this.load.image(`relic_${rid}`, f); // 終章の 道具の 大きな 絵（10/7）
    if (HADAKA_ART) for (const [k, f] of Object.entries(HADAKA_ART)) if (!this.textures.exists(`hadaka_${k}`)) this.load.image(`hadaka_${k}`, f); // 縄のぼり（Gemini・10/7・art_src/prep_hadaka.py）
    if (TAIMATSU_ART) for (const [k, f] of Object.entries(TAIMATSU_ART)) if (!this.textures.exists(`taimatsu_${k}`)) this.load.image(`taimatsu_${k}`, f); // 松明あかし（Gemini・10/5 夜・art_src/prep_taimatsu.py）
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
    this.kanbanLabels = []; // 10/8 夜 前の 地図の 名所の 名前（消えた 字）が 町に 入っても 残っていた＝作り直す たびに 空ける
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
      const look = isField(this.mapId) ? fieldLook(this.g, ch, x, y, this.mapId) : townLook(ch, x, y, this.g, this.mapId); // 10/9 町の 中の 季節
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
    this.player = this.add.sprite(...this.center(x, y), `p-${lookOf('tabi', this.g)}`, frameOf(this.facing, 0, lookOf('tabi', this.g))).setOrigin(0.5, ORIGIN_Y);
    this.refreshGhosts();
    this.heldWeapons = [['tabi', this.player], ...this.followers.map((f) => [f.id, f.sprite])].map(([id, sprite]) => ({
      id, sprite, img: this.add.image(sprite.x, sprite.y, '__WHITE').setOrigin(0.25, 0.8).setScale(HELD_SCALE).setVisible(false),
    }));
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
    // ⭐上の名前・HPの札（高さ約90）の下に 地図の上の端が 隠れないよう、カメラの範囲を 札の高さぶん 上へ 広げる（10/6 本人「地図の上、名前HPなどの札に隠れて、通りにくい場所がある」）
    this.camArea = { mapW, mapH };
    this.setCamBounds(1);
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
    this.uiCam.ignore([this.layer, ...this.castleCovers.map((c) => c.img), this.hereMark, this.hereRing, this.player, ...this.followers.map((f) => f.sprite), ...this.heldWeapons.map((w) => w.img), ...this.npcs.map((n) => n.sprite), ...this.makeMistArrows(), ...this.makeKanbanLabels(), ...this.makeShopSigns()]);

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
      if (to === 'aizu' && !this.g.cleared.numagozen) this.time.delayedCall(350, () => this.showMessages(CROSS_AIZU));
      if (to === 'minami' && !this.g.cleared.banba) this.time.delayedCall(350, () => this.showMessages(CROSS_MINAMI)); // 終章（10/8）
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
        localStorage.setItem(slotKey(this.registry.get('slot') ?? 1), text); // 選んだ記憶（10/7 記憶①〜③）
        stored = true;
      } catch {
        // 端末の決まりで残せないときも、この遊びの間は続けられる
      }
      const saved = { text: stored ? '自動セーブが された。' : '（この 端末では 記録が 残せない ようだ……）' };
      // ⭐台詞のあとに 図鑑を そのボスの ページで 開き、判子を 押す（10/6 本人「コレクションは各ボスを倒したあと、自動表示をして欲しい。判子を押し、倒したボスがコレクションに並ぶ」）
      const at = collection(this.g).items.findIndex((it) => it.id === id);
      // 終章の 舞台（10/8）：手下に 勝つと 図鑑を 閉じたあと そのまま 大将へ・大将に 勝つと 終わりの 場面へ
      const chain = { teshita: () => this.startBoss('taisho'), taisho: () => { this.busy = true; this.cameras.main.fadeOut(1200, 0, 0, 0); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('ending')); } }[id];
      if (chain) this.afterCollection = () => { this.busy = true; this.time.delayedCall(300, chain); }; // 10/8 夜 続く 0.3秒の 間に 歩けた（読み手の 指摘）
      // 10/9 道具を 守る 相手（家来・姫の霊・ばんば）に 勝った＝図鑑を 閉じたら 道具の 絵を 曲つきで
      const gotKind = Object.keys(RELICS).find((k) => RELICS[k].boss === id);
      if (gotKind) this.afterCollection = () => { this.busy = true; this.time.delayedCall(250, () => this.showRelic(gotKind, true)); };
      this.time.delayedCall(350, () => this.showMessages([...CLEARED_LINES[id].map((text) => ({ speaker: 'しおり', text })), ...joined, saved], () => (at >= 0 ? this.showCollection(Math.floor(at / PER_PAGE), id) : null)));
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
  // 町の 店の 看板（10/7 本人「町や城の店に看板が欲しい『武器』『よろず屋』『宿』『温泉』など」）＝木の 板に 店の 名前（src/field/signs.js が 場所を 決める）
  makeShopSigns() {
    if (isField(this.mapId) || !this.town) return [];
    const out = [];
    for (const s of townSigns(this.town)) {
      const t = smooth(this.add.text(s.x * CELL, s.y * CELL - 4, s.text, {
        fontFamily: FONT, fontSize: '15px', color: '#fff2d0', resolution: 3,
      }).setOrigin(0.5, 1).setDepth(4.1));
      const w = Math.round(t.width) + 10;
      const h = Math.round(t.height) + 4;
      const g = this.add.graphics().setDepth(4);
      const x0 = Math.round(s.x * CELL - w / 2);
      const y0 = Math.round(s.y * CELL - 2 - h);
      g.fillStyle(0x2a170b, 1).fillRect(x0 - 1, y0 - 1, w + 2, h + 2); // 黒い 縁
      g.fillStyle(0x6b3f1d, 1).fillRect(x0, y0, w, h); // 木の 板
      g.fillStyle(0x8a5a2e, 1).fillRect(x0, y0, w, 2); // 上の 明るい 縁
      g.fillStyle(0xc9a24a, 1).fillRect(x0 + 2, y0 + h - 2, w - 4, 1); // 下の 金の 線
      out.push(g, t);
    }
    return out;
  }

  makeKanbanLabels() {
    if (!isField(this.mapId)) return [];
    // お題を 受けた 入口にも 場所の 名前（10/7 本人「鬼ヶ城山が分からない」）
    this.kanbanLabels = [...KANBAN.filter((k) => k.map === this.mapId && k.x >= 0), ...gateMarks(this.g, this.mapId)].map((k) => {
      const [cx, cy] = this.center(k.x, k.y);
      // 10/5 本人「城や名所の上に 字だけ・ひとまわり大きく」＝目印のマスの上に 16ドット（前は 脇の看板の上に 13）
      return smooth(this.add.text(cx, cy - 22, k.name, {
        fontFamily: BRUSH_FONT, fontSize: '16px', color: '#fff4d6', resolution: 3, stroke: '#2a1a08', strokeThickness: 4,
      }).setOrigin(0.5, 1).setDepth(15));
    });
    const z = this.zoom ?? 1;
    for (const t of this.kanbanLabels) t.setScale(Math.max(1, 0.8 / z));
    this.cullLabels();
    return this.kanbanLabels;
  }

  // 地図を 縮めると 名前の 字は 大きさを 保つ＝近い 名前どうしが ぶつかる（10/8 字の 点検：35％で 甲子温泉と この先 会津）
  // ⇒ 先に 並んだ 名前を 残し、それと 重なる 名前は 隠す（倍率を 戻せば また 出る）
  cullLabels() {
    const shown = [];
    for (const t of this.kanbanLabels ?? []) {
      const b = t.getBounds();
      const hit = shown.some((s) => b.right > s.left + 1 && b.left < s.right - 1 && b.bottom > s.top + 1 && b.top < s.bottom - 1);
      t.setVisible(!hit);
      if (!hit) shown.push(b);
    }
  }

  makeMistArrows() {
    if (!isField(this.mapId) && this.town?.inside !== 'quest') return []; // お題の 新しい場所でも 怪物の 上に（10/7）
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
      // お城の お題の 入口は 金色（10/8 本人「会津の城クエ、戦うところが見つからない」＝赤い 矢印が 名前の 字に 隠れ、隣の 紅葉の 赤に 紛れた）
      const gt = this.textures.createCanvas('gate_arrow', 20, 22);
      const gc = gt.getContext();
      const tri2 = (col, pad) => {
        gc.fillStyle = col;
        gc.beginPath();
        gc.moveTo(10, 21 - pad);
        gc.lineTo(1 + pad, 8 + pad / 2);
        gc.lineTo(6 + pad / 2, 8 + pad / 2);
        gc.lineTo(6 + pad / 2, 1 + pad);
        gc.lineTo(14 - pad / 2, 1 + pad);
        gc.lineTo(14 - pad / 2, 8 + pad / 2);
        gc.lineTo(19 - pad, 8 + pad / 2);
        gc.closePath();
        gc.fill();
      };
      tri2('#2a1a00', 0);
      tri2('#ffd23a', 2);
      gt.refresh();
    }
    const arrows = [];
    const field = isField(this.mapId);
    const gates = new Set(gateMarks(this.g, this.mapId).map((m) => `${m.x},${m.y}`)); // お題を 受けた 入口（10/7 本人「鬼ヶ城山が分からない」）
    this.rows.forEach((r, y) => [...r].forEach((ch, x) => {
      const wall = field && WALL_OPENED_BY[ch] && !this.g.cleared[WALL_OPENED_BY[ch]];
      const boss = field && BOSS_AT[ch] && !this.g.cleared[BOSS_AT[ch]];
      const qboss = !field && QUEST_BOSS_AT[ch] && !this.g.cleared[QUEST_BOSS_AT[ch]];
      const gate = gates.has(`${x},${y}`);
      const endFoe = field && BUMP_TALK.includes(ch) && endFoeReady(this.g, ch); // 10/9 終章の 印も 戦える 間は 赤い 矢印
      if (!wall && !boss && !qboss && !gate && !endFoe) return;
      // お題の 入口＝金色・大きく・名前の 字（深さ 15）の さらに 上（10/8）。ほかは 赤い 矢印の まま
      const a = gate
        ? this.add.image(x * CELL + CELL / 2, y * CELL - 30, 'gate_arrow').setScale(1.8).setDepth(16)
        : this.add.image(x * CELL + CELL / 2, y * CELL - 6, 'mist_arrow').setScale(1.4).setDepth(5); // スマホでも見える大きさ
      this.tweens.add({ targets: a, y: a.y - 8, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      arrows.push(a);
    }));
    if (!field) return arrows;
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
    return { soma: 'somaField', kenpoku: 'kenpokuField', kenchu: 'kenchuField', aizu: 'aizuField', minami: 'minamiField' }[map] ?? 'title';
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
  // stampId＝いま元に戻した主（影から始めて 判子を 押す）
  // rally＝{ kind, key }：ラリーの判子を いま もらった（そのページを開いて 判子を押す・10/6 夜 本人「クエスト完成時これらの画面が出て、『祓』と効果音つきで」）
  showCollection(page = 0, stampId = null, rally = null) {
    this.closeDialog();
    this.busy = true;
    const col = collection(this.g);
    const draw = () => (rally ? this.drawRally(rally.kind, page, col, rally.key) : this.drawCollection(col, page, stampId));
    // 絵は開いたときに読む（まだ読んでいない主の分だけ）
    const need = col.items.filter((it) => !this.textures.exists(`col-${it.id}`));
    if (need.length) {
      need.forEach((it) => this.load.image(`col-${it.id}`, it.img));
      this.load.once('complete', draw);
      this.load.start();
      return;
    }
    draw();
  }

  // ラリーの判子を もらったあと：その札の ページを開いて 判子を押す。閉じたら after
  showRallyStamp(kind, key, after = null) {
    this.afterCollection = after;
    // この 判子で そろった＝判子を 押したあと 道具を 授かる 場面（10/7）
    this.relicPending = stampCount(this.g, kind) >= rallyKeys(kind).length ? kind : null;
    this.showCollection(Math.floor(rallyKeys(kind).indexOf(key) / PER_PAGE), null, { kind, key });
  }

  // 図鑑の上の札（4つ）＝さわると その ページへ
  collectionTabs(box, active, col) {
    const tabs = [
      ['tales', `昔話 ${col.got}/${col.total}`],
      ['onsen', `温泉 ${stampCount(this.g, 'onsen')}/${rallyKeys('onsen').length}`],
      ['gourmet', `グルメ ${stampCount(this.g, 'gourmet')}/${rallyKeys('gourmet').length}`],
      ['castle', `お城 ${stampCount(this.g, 'castle')}/${rallyKeys('castle').length}`],
    ];
    const TW = (W - 16) / 4;
    tabs.forEach(([k, label], i) => {
      const x = 8 + i * TW;
      const on = k === active;
      const g = this.add.graphics();
      g.fillStyle(on ? 0x3a2f5c : 0x15132e, 1).fillRoundedRect(x + 2, 10, TW - 4, 38, 6);
      g.lineStyle(2, on ? 0xc9a24a : 0x3a3660, 1).strokeRoundedRect(x + 2, 10, TW - 4, 38, 6);
      box.add(g);
      box.add(this.add.text(x + TW / 2, 29, label, { fontFamily: FONT, fontSize: '13px', color: on ? '#ffd27a' : '#cfc4a0', resolution: 3 }).setOrigin(0.5));
      if (!on) {
        const z = hitBox(this, x, 8, TW, 42).setOrigin(0).setInteractive();
        z.on('pointerup', () => { sfx('select'); if (k === 'tales') this.drawCollection(col, 0); else this.drawRally(k, 0, col); });
        box.add(z);
      }
    });
  }

  // 温泉・グルメ・お城の ページ（判子を もらった所に 朱の判子・まだは 灰色）
  drawRally(kind, page, col, freshKey = null) {
    this.collectionBox?.destroy();
    const box = this.add.container(0, 0).setDepth(2000);
    this.collectionBox = box;
    box.add(this.add.rectangle(0, 0, W, 640, 0x07061a, 1).setOrigin(0).setInteractive());
    const txt = (x, y, t, size, color = '#ffffff', o = {}) => this.add.text(x, y, t, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 3, align: 'center', ...o });
    this.collectionTabs(box, kind, col);
    const keys = rallyKeys(kind);
    const pages = Math.ceil(keys.length / PER_PAGE);
    const CW = 110, CH = 150, GX = (W - CW * 3) / 4;
    keys.slice(page * PER_PAGE, (page + 1) * PER_PAGE).forEach((key, k) => {
      const cx = GX + (k % 3) * (CW + GX), cy = 60 + Math.floor(k / 3) * (CH + 8);
      const got = hasStamp(this.g, kind, key);
      const fresh = key === freshKey; // いま もらった判子＝暗い札から 始めて 判子で 色が つく
      const card = this.add.graphics();
      card.fillStyle(0x15132e, 1).fillRoundedRect(cx, cy, CW, CH, 8);
      card.lineStyle(2, got ? 0xc9a24a : 0x3a3660, 1).strokeRoundedRect(cx, cy, CW, CH, 8);
      box.add(card);
      const name = kind === 'castle' ? CASTLE_RALLY[key].castle : TOWNS[key]?.name ?? key;
      const sub = kind === 'gourmet' ? ITEMS[GOURMET_RALLY[key]]?.name ?? '' : kind === 'castle' ? CASTLE_RALLY[key].lord : '';
      box.add(txt(cx + CW / 2, cy + 6, name, name.length > 7 ? 12 : 14, got ? '#ffffff' : '#8a86b0').setOrigin(0.5, 0));
      // 絵（10/6 夜 本人「コレクション、温泉、グルメ、お城は絵も添えて」）＝グルメは名物の品の絵・お城と温泉は その町の入口の絵（温泉地の絵は届くまで温泉マーク）
      const PX = cx + 4, PY = cy + 28, PW = CW - 8, PH = 58;
      const pic = this.rallyPicture(kind, key);
      if (pic) {
        const im = this.add.image(PX + PW / 2, PY + PH / 2, pic.key);
        const k = pic.fill ? Math.max(PW / im.width, PH / im.height) : Math.min(PW / im.width, PH / im.height, pic.max ?? 9);
        im.setScale(k);
        if (pic.fill) im.setCrop((im.width - PW / k) / 2, (im.height - PH / k) / 2, PW / k, PH / k);
        if (!got || fresh) im.setTint(0x55536e).setAlpha(0.55);
        box.add(im);
        if (fresh) this.time.delayedCall(870, () => { if (box.active) im.clearTint().setAlpha(1); }); // 判子が 当たった 瞬間に 色が つく（箱が 消えて いれば 何もしない・10/8）
      }
      if (sub) box.add(txt(cx + CW / 2, cy + 92, sub, 12, got ? '#cfc4a0' : '#6a6690', { wordWrap: { width: CW - 8, useAdvancedWrap: true } }).setOrigin(0.5, 0));
      if (fresh) {
        const st = this.seal(cx + CW / 2, cy + 60, 64, '済').setScale(2.4).setAlpha(0);
        box.add(st);
        this.time.delayedCall(700, () => {
          // 10/8 箱が 消えて いれば 動きは 出さない（昔話の 図鑑と 同じ 止まり方）。そろった 判子なら 授かる 場面だけは 出す
          const relicNow = () => { if (this.relicPending === kind) { this.relicPending = null; this.showRelic(kind); } };
          if (!box.active) { relicNow(); return; }
          this.tweens.add({
            targets: st, scale: 1, alpha: 1, duration: 170, ease: 'Quad.easeIn',
            onComplete: () => {
              if (!box.active) { relicNow(); return; }
              sfx('hanko');
              this.uiCam?.shake(120, 0.006);
              this.tweens.add({ targets: st, x: cx + CW - 24, y: cy + 74, scale: 40 / 64, delay: 650, duration: 350, ease: 'Quad.easeInOut' });
              if (this.relicPending === kind) { this.relicPending = null; this.time.delayedCall(1300, () => this.showRelic(kind)); }
            },
          });
        });
      } else if (got) box.add(this.seal(cx + CW - 24, cy + 74, 40, '済'));
      else box.add(txt(cx + CW / 2, cy + CH - 14, 'まだ', 13, '#55507a').setOrigin(0.5));
    });
    const relic = RELICS[kind];
    const have = !!this.g.relics?.[relic.id];
    const done = rallyDone(this.g, kind);
    box.add(txt(W / 2, 540, have ? `「${relic.name}」を 手に 入れた` : done ? `「${relic.name}」は ${relic.place}に` : `そろうと「${relic.name}」の 手がかり`, 15, have || done ? '#ffd27a' : '#cfd8ff').setOrigin(0.5));
    const btn = (x, label, on, enabled = true) => {
      const t = txt(x, 600, label, 20, enabled ? '#ffffff' : '#555070').setOrigin(0.5);
      box.add(t);
      if (!enabled) return;
      const z = hitBox(this, x - 55, 578, 110, 44).setOrigin(0).setInteractive();
      z.on('pointerup', () => { sfx('select'); on(); });
      box.add(z);
    };
    btn(60, '◀ まえ', () => this.drawRally(kind, page - 1, col), page > 0);
    btn(W / 2, 'とじる', () => this.closeCollection());
    btn(W - 60, 'つぎ ▶', () => this.drawRally(kind, page + 1, col), page < pages - 1);
    box.add(txt(W / 2, 568, `${page + 1} / ${pages}`, 13, '#8a86b0').setOrigin(0.5, 1));
    this.cameras.main.ignore(box);
  }

  // 図鑑のラリーの札に添える絵（無ければ null）。fill＝札の窓いっぱいに切る一枚絵
  rallyPicture(kind, key) {
    if (kind === 'gourmet') {
      const id = `icon_${GOURMET_RALLY[key]}`;
      return this.textures.exists(id) ? { key: id, max: 1.15 } : null;
    }
    if (this.textures.exists(`card_town_${key}`)) return { key: `card_town_${key}`, fill: true };
    return kind === 'onsen' && this.textures.exists('o_icon_onsen') ? { key: 'o_icon_onsen', max: 2 } : null;
  }

  // 判子が そろって 終章の 道具の 行き先を 知る（10/7 本人「ファンファーレと共に」→ 10/8「もらいかたは全て戦い」＝道具は 渡さず 行き先の 知らせ）
  // 図鑑の 上に 重ねる：暗い 幕・光の 輪・道具の 大きな 絵・ファンファーレ。曲が 終わるまでは 閉じない → さわると 図鑑へ
  // got＝道具を 守る 相手に 勝って 手に 入れた（10/9）／無し＝ラリーの 判子が そろって 道具の 在りかが 分かった（10/7）
  showRelic(kind, got = false) {
    const relic = RELICS[kind];
    const box = this.add.container(0, 0).setDepth(2300);
    this.relicBox = box;
    const txt = (x, y, t, size, color = '#ffffff') => this.add.text(x, y, t, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 3, align: 'center', wordWrap: { width: 320, useAdvancedWrap: true } }).setOrigin(0.5).setStroke('#1a1030', Math.max(3, size / 4));
    box.add(this.add.rectangle(0, 0, W, 640, 0x05040e, 0.88).setOrigin(0).setInteractive());
    const glow = this.add.circle(W / 2, 250, 120, 0xffd27a, 0.25);
    const glow2 = this.add.circle(W / 2, 250, 80, 0xfff0c0, 0.25);
    const key = this.textures.exists(`relic_${relic.id}`) ? `relic_${relic.id}` : `icon_${relic.id}`;
    const im = this.add.image(W / 2, 250, key);
    const k = Math.min(190 / im.width, 190 / im.height);
    im.setScale(k * 0.2).setAlpha(0);
    box.add([glow, glow2, im]);
    const left = Object.values(RELICS).filter((r) => !this.g.relics?.[r.id]).length;
    box.add(txt(W / 2, 88, got ? '舞台に 供える 道具を 手に 入れた！' : `${RALLY_NAME[kind]}の 判子が ぜんぶ そろった！`, 18, '#cfd8ff'));
    const title = txt(W / 2, 400, got ? `「${relic.name}」` : `「${relic.name}」は ${relic.place}に`, 22, '#ffd27a').setAlpha(0);
    const note = txt(W / 2, 438, got ? `${relic.foe}から 授かった。` : `${relic.foe}に 勝てば、手に 入る。`, 15, '#ffffff').setAlpha(0);
    const tapNote = txt(W / 2, 614, '', 15, '#cfd8ff');
    // しおりの ひと言（10/7 本人「ファンファーレと3Dしおりからコメントが欲しい」）＝会話と 同じ 顔の 絵・吹き出し
    const all = Object.keys(RELICS).every((k) => rallyDone(this.g, k));
    const face = this.g?.flags?.kunoichi && this.textures.exists('face_k_normal') ? 'face_k_normal' : 'face_normal';
    const say = got ? (left ? RELIC_GOT_SAY.more(left) : RELIC_GOT_SAY.all) : all ? RELIC_SAY.all : RELIC_SAY[kind];
    const bubble = this.add.graphics().setAlpha(0);
    bubble.fillStyle(0x2a2050, 0.95).fillRoundedRect(98, 476, 248, 104, 12).lineStyle(2, 0xc9a24a, 1).strokeRoundedRect(98, 476, 248, 104, 12);
    bubble.fillStyle(0x2a2050, 0.95).fillTriangle(98, 516, 86, 528, 98, 538);
    const faceIm = this.textures.exists(face) ? this.add.image(52, 528, face).setAlpha(0) : null;
    if (faceIm) faceIm.setScale(Math.min(84 / faceIm.width, 96 / faceIm.height));
    const name = txt(52, 590, 'しおり', 13, '#ffd27a').setAlpha(0);
    const sayT = this.add.text(110, 486, say, { fontFamily: FONT, fontSize: '15px', color: '#ffffff', resolution: 3, wordWrap: { width: 226, useAdvancedWrap: true }, lineSpacing: 6 }).setAlpha(0);
    box.add([title, note, bubble, ...(faceIm ? [faceIm] : []), name, sayT, tapNote]);
    this.tweens.add({ targets: [bubble, faceIm, name, sayT].filter(Boolean), alpha: 1, delay: 1500, duration: 500 });
    this.cameras.main.ignore(box);
    this.tweens.add({ targets: im, scale: k, alpha: 1, duration: 900, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [glow, glow2], scale: { from: 0.6, to: 1.25 }, alpha: { from: 0.4, to: 0.12 }, duration: 1400, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: [title, note], alpha: 1, delay: 700, duration: 500 });
    const ms = playJingle('relic') ? jingleSeconds('relic') * 1000 : jingleSeconds('relic') * 1000; // 音の 出ない 端末でも 同じ 長さ 待つ
    // ファンファーレの あと しおりの 声（届いて いれば）
    const voice = got ? null : RELIC_VOICE[all ? 'all' : kind]; // 声は 判子の 時の 台詞だけ（手に 入れた 時の 台詞は 字だけ）
    if (voice) this.time.delayedCall(ms, () => { if (this.relicBox === box) playVoice(voice); });
    this.time.delayedCall(ms + 300, () => {
      if (!box.active) return; // 10/9 夜の 点検：場面が 先に 消えて いると 消えた 字に setText して 落ちた（10/8 図鑑と 同じ 形）
      tapNote.setText('さわると もどる');
      this.input.once('pointerup', () => { box.destroy(); this.relicBox = null; if (got) this.busy = false; startBgm(this.fieldBgm()); });
    });
  }

  closeCollection() {
    this.collectionBox?.destroy();
    this.collectionBox = null;
    this.busy = false;
    const after = this.afterCollection;
    this.afterCollection = null;
    after?.();
  }

  // 判子（朱の「祓」＝もやを 祓った 印）
  // ch＝判子の字（昔話の主＝祓・ラリー＝済・10/6 夜 本人「温泉、グルメ、お城は『祓』ではなく『済』」）
  seal(x, y, size, ch = '祓') {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0xc0281e, 0.92).fillRoundedRect(-size / 2, -size / 2, size, size, size * 0.18);
    g.lineStyle(Math.max(1.5, size * 0.07), 0xffe9d6, 0.9).strokeRoundedRect(-size / 2 + size * 0.12, -size / 2 + size * 0.12, size * 0.76, size * 0.76, size * 0.12);
    c.add(g);
    c.add(this.add.text(0, 0, ch, { fontFamily: FONT, fontSize: `${Math.round(size * 0.58)}px`, color: '#fff3e6', resolution: 3 }).setOrigin(0.5));
    c.setAngle(-8);
    return c;
  }

  drawCollection(col, page, stampId = null) {
    this.collectionBox?.destroy();
    const box = this.add.container(0, 0).setDepth(2000); // 上の札・十字キーより手前
    this.collectionBox = box;
    box.add(this.add.rectangle(0, 0, W, 640, 0x07061a, 1).setOrigin(0).setInteractive());
    const txt = (x, y, t, size, color = '#ffffff', o = {}) => this.add.text(x, y, t, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 3, align: 'center', ...o });
    this.collectionTabs(box, 'tales', col); // 昔話の主・温泉・グルメ・お城（10/6 スタンプラリー）
    const CW = 110, CH = 160, GX = (W - CW * 3) / 4;
    col.items.slice(page * PER_PAGE, (page + 1) * PER_PAGE).forEach((it, k) => {
      const cx = GX + (k % 3) * (CW + GX), cy = 58 + Math.floor(k / 3) * (CH + 8);
      const card = this.add.graphics();
      card.fillStyle(0x15132e, 1).fillRoundedRect(cx, cy, CW, CH, 8);
      card.lineStyle(2, it.got ? 0xc9a24a : 0x3a3660, 1).strokeRoundedRect(cx, cy, CW, CH, 8);
      box.add(card);
      const im = this.add.image(cx + CW / 2, cy + 50, `col-${it.id}`);
      im.setScale(Math.min(88 / im.width, 84 / im.height));
      const fresh = it.id === stampId; // いま 元に戻した主＝影から 始めて 判子で 色が つく
      if (!it.got || fresh) im.setTintFill(0x000000).setAlpha(0.75); // まだの主は 黒い影
      box.add(im);
      const name = txt(cx + CW / 2, cy + 98, it.got && !fresh ? it.name : '？？？', it.name.length > 6 ? 13 : 15, it.got && !fresh ? '#ffffff' : '#8a86b0', { wordWrap: { width: CW - 8, useAdvancedWrap: true } }).setOrigin(0.5, 0);
      box.add(name);
      if (it.got && !fresh) box.add(this.seal(cx + CW - 16, cy + 16, 22)); // 集めた札には 小さな 判子
      if (fresh) {
        const st = this.seal(cx + CW / 2, cy + 50, 64).setScale(2.4).setAlpha(0);
        box.add(st);
        // ⭐10/8 本人「コレクション画面でまたフリーズ」＝判子の 動きの 途中で 見出し・ページ・とじるで 箱を 消すと、動きの 終わりが 消えた 字に setText して 止まった
        //   ⇒ 箱が もう 無ければ 何もしない（box.active）
        this.time.delayedCall(700, () => {
          if (!box.active) return;
          this.tweens.add({
            targets: st, scale: 1, alpha: 1, duration: 170, ease: 'Quad.easeIn',
            onComplete: () => {
              if (!box.active) return;
              sfx('hanko');
              this.uiCam?.shake(120, 0.006);
              im.clearTint().setAlpha(1);
              name.setText(it.name).setColor('#ffffff');
              // 判子は 小さくなって 右上の 角へ（ほかの 集めた札と 同じ 形に）
              this.tweens.add({ targets: st, x: cx + CW - 16, y: cy + 16, scale: 22 / 64, delay: 650, duration: 350, ease: 'Quad.easeInOut' });
            },
          });
        });
      }
      box.add(txt(cx + CW / 2, cy + CH - 6, it.episode, 12, '#cfc4a0').setOrigin(0.5, 1));
      if (it.got) {
        const hit = hitBox(this, cx, cy, CW, CH).setOrigin(0).setInteractive();
        hit.on('pointerup', () => this.showCollectionCard(it, col, page));
        box.add(hit);
      }
    });
    // 下の札：まえ・つぎ・とじる（押して離して決まる）
    const btn = (x, label, on, enabled = true) => {
      const t = txt(x, 600, label, 20, enabled ? '#ffffff' : '#555070').setOrigin(0.5);
      box.add(t);
      if (!enabled) return;
      const z = hitBox(this, x - 55, 578, 110, 44).setOrigin(0).setInteractive();
      z.on('pointerup', () => { sfx('select'); on(); });
      box.add(z);
    };
    btn(60, '◀ まえ', () => this.drawCollection(col, page - 1), page > 0);
    btn(W / 2, 'とじる', () => this.closeCollection()); // 10/8 ほかの 図鑑と 同じ（閉じた あとの 続きも 呼ぶ）
    btn(W - 60, 'つぎ ▶', () => this.drawCollection(col, page + 1), page < col.pages - 1);
    box.add(txt(W / 2, 568, `${page + 1} / ${col.pages}`, 13, '#8a86b0').setOrigin(0.5, 1));
    this.cameras.main.ignore(box); // 窓用のカメラだけで描く（窓の部品の箱の外＝上の札・十字キーより手前）
  }

  // 1体を大きく：元の姿・名前・話・場所・ほんとうのお話（さわると一覧へ）
  showCollectionCard(it, col, page) {
    const box = this.add.container(0, 0).setDepth(2100);
    const txt = (x, y, t, size, color = '#ffffff', o = {}) => this.add.text(x, y, t, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 3, align: 'center', ...o });
    box.add(this.add.rectangle(0, 0, W, 640, 0x07061a, 1).setOrigin(0).setInteractive());
    // 10/9 もう一度 戦うの 札の ぶん 上へ 詰めた（絵 240→200）＝いちばん 長い 補足（鬼石・鏡ヶ沼）でも 札の 上で 止まる
    const im = this.add.image(W / 2, 160, `col-${it.id}`);
    im.setScale(Math.min(200 / im.width, 200 / im.height));
    box.add(im);
    box.add(txt(W / 2, 278, it.name, 26, '#ffd27a').setOrigin(0.5, 0));
    box.add(txt(W / 2, 316, `${it.episode}「${it.tale}」・${it.place}`, 15, '#cfc4a0', { wordWrap: { width: 320, useAdvancedWrap: true } }).setOrigin(0.5, 0));
    if (it.hosoku) box.add(txt(W / 2, 368, it.hosoku, 15, '#ffffff', { align: 'left', wordWrap: { width: 310, useAdvancedWrap: true }, lineSpacing: 6 }).setOrigin(0.5, 0));
    // もう一度 戦う（10/9 本人「クリアすると戦えないので、もういちどボスと戦うのコマンドを」）＝倒した 主だけ・勝った 直後の 図鑑（続きが ある 時）は 出さない
    const canFight = REMATCH_OK(it, this);
    const FY = 588;
    if (canFight) {
      const g = this.add.graphics();
      g.fillStyle(0x3a1a1a, 1).fillRoundedRect(W / 2 - 110, FY - 22, 220, 44, 10).lineStyle(2, 0xc9a24a, 1).strokeRoundedRect(W / 2 - 110, FY - 22, 220, 44, 10);
      box.add([g, txt(W / 2, FY, 'もう一度 戦う', 20, '#ffd27a').setOrigin(0.5)]);
    }
    box.add(txt(W / 2, 632, 'さわると もどる', 15, '#cfd8ff').setOrigin(0.5, 1));
    this.cameras.main.ignore(box);
    sfx('select');
    this.time.delayedCall(250, () => this.input.once('pointerup', (p) => {
      box.destroy();
      if (canFight && Math.abs(p.x - W / 2) <= 110 && Math.abs(p.y - FY) <= 22) {
        sfx('select');
        this.closeCollection();
        this.startBoss(it.id, true);
      }
    }));
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
    this.player.setFrame(frameOf(this.facing, this.step, lookOf('tabi', this.g)));
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
    const place = this.town ? this.town.name : { field: 'いわき', soma: '相馬', kenpoku: '県北', kenchu: '県中', aizu: '会津', minami: '南会津' }[this.mapId] ?? ''; // 10/3 1章の地図「相馬」
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
      if (m.sfx) sfx(m.sfx); // 判子の 知らせ（10/6 スタンプラリー）など
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
    if (face) {
      this.dlgSpeaker.setPosition(72, PANEL_Y + 142).setOrigin(0.5, 0).setFontSize(20);
      fitSpeaker(this.dlgSpeaker); // 顔の 幅に 収める（10/6）
    } else this.dlgSpeaker.setPosition(38, PANEL_Y + 18).setOrigin(0, 0).setFontSize(16);
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
        for (let fs = MENU_FS; t.x + t.width > n.x - n.width - 8 && fs > 12; fs--) t.setFontSize(fs - 1);
        // 10/6 それでも ぶつかる（勝守の 人選び「あいうえ（今：厄除け守）」と「攻+2 厄除け無し」）＝注記も 縮め、最後は 項目を「…」で 詰める
        for (let fs = 17; t.x + t.width > n.x - n.width - 8 && fs > 13; fs--) n.setFontSize(fs - 1);
        while (t.x + t.width > n.x - n.width - 8 && t.text.length > 4) t.setText(`${t.text.replace(/…$/, '').slice(0, -1)}…`);
      }
      // 10/7 夜 注記の 無い 長い 行（「▶ 打ち方まねに 加わる（15文）」）も 窓の 右の 端を 越えるなら 縮める（試運転の はみ出しの 見張り）
      for (let fs = MENU_FS; t.x + t.width > W - 24 && fs > 14; fs--) t.setFontSize(fs - 1);
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
  // カメラの範囲＝地図＋上の札の高さ（倍率で割る＝縮小しても 札の下に 同じだけ 空く）
  setCamBounds(z) {
    const { mapW, mapH } = this.camArea;
    const pad = STATUS_PAD / z;
    this.cameras.main.setBounds(0, Math.min(0, (mapH - MAP_H) / 2) - pad, Math.max(mapW, W), Math.max(mapH, MAP_H) + pad);
  }

  applyZoom(z) {
    this.zoom = z;
    this.cameras.main.setZoom(z);
    if (this.camArea) this.setCamBounds(z);
    // 名前の字は 縮小しても 読める大きさを保つ（10/6 本人「町やお城の名前が表記されていない」＝60%・35%で 字が つぶれていた）
    for (const t of this.kanbanLabels ?? []) t.setScale(Math.max(1, 0.8 / z));
    this.cullLabels();
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

  // 手に持つ武器を 人に合わせて動かす（装備を替えたら絵も替わる・幽霊は持たない）
  updateHeldWeapons() {
    for (const w of this.heldWeapons ?? []) {
      const look = lookOf(w.id, this.g);
      // 力士の武器は 手甲（手に はめる物）＝手に 持たせない
      const weapon = this.g.equip?.[w.id]?.weapon;
      const key = EMPTY_HANDS.includes(look) && !this.g.party[w.id]?.dead && EQUIP[weapon]?.job !== 'rikishi' ? this.gearIcon(weapon) : null;
      if (!key || !w.sprite.visible) { if (w.img.visible) w.img.setVisible(false); continue; }
      if (w.img.texture.key !== key) w.img.setTexture(key);
      const dir = w.id === 'tabi' ? this.facing : this.followers.find((f) => f.id === w.id)?.dir ?? 'down';
      const [dx, dy, flip, behind] = HAND[dir];
      w.img.setVisible(true).setFlipX(flip).setOrigin(flip ? 0.7 : 0.3, 0.72).setPosition(w.sprite.x + dx, w.sprite.y + dy + (this.step % 2));
      if (w.behind !== behind) {
        w.behind = behind;
        if (behind) this.children.moveBelow(w.img, w.sprite); else this.children.moveAbove(w.img, w.sprite);
      }
    }
  }

  update() {
    this.updateHeldWeapons();
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
    if (!canWalk(this.g, this.mapId, nx, ny, { x: this.px, y: this.py })) { // いま立っている所も渡す（壁の 向こう側から 戻れるか・10/6）
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
    // 10/9 本人「橋場のばんばで戦えません」＝ばんば・駒ヶ岳・モーカケの滝・舞台は 通れない 印で、「はなす」でしか 始まらなかった（ほかの ボスは 踏み込めば 戦い）
    // ⇒ 歩いて ぶつかっても「はなす」と 同じ（tryStep が 向きを 先に 変えて いる）
    // 10/9 読み手の 指摘：戻し 終えた 後も 話すと、キーを 押したまま 歩くと 看板の 文が くり返し 出た ⇒ 戦える か まだ 足りない 間だけ
    const endTalk = BUMP_TALK.includes(t?.ch) && (endFoeReady(this.g, t.ch) || relicWait(this.g, t.ch) || (t.ch === '舞' && stageNext(this.g).need.length) || endRematch(this.g, t.ch).length);
    if (isField(this.mapId) && endTalk) {
      if (this.time.now - this.lastBump < 1200) return;
      this.lastBump = this.time.now;
      this.pressTalk();
      return;
    }
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
      } else if (gateGround(this.g, ch)) {
        sfx('select');
        this.goto(enterTown(this.g, gateGround(this.g, ch))); // お城クエストの 新しい場所へ（10/7・依頼が 出るまでは 入れない）
      } else if (ch === 'P') {
        sfx('select');
        this.nomaoiTalk();
      } else if (ch === 'k') {
        sfx('select');
        this.chochinTalk(); // 二本松の提灯祭り（10/4）
      } else if (this.meet(x, y)) {
        // 道中の敵に出会った（meet の中で戦いへ）
      } else if (BOSS_AT[ch] && !this.g.cleared[BOSS_AT[ch]]) {
        this.startBoss(BOSS_AT[ch]);
      } else if (ch === 'a') {
        sfx('select');
        this.taimatsuTalk(); // 須賀川の松明あかし（3章・10/4）
      } else if (ch === 'n' && this.g.cleared.nekonaki) {
        sfx('select');
        this.onsenMenu(); // 猫啼温泉（3章・和泉式部の猫を元に戻すと湯につかれる）
      }
    } else if (ch === 'x') {
      this.goto(this.town?.inside === 'castle' ? leaveCastle(this.g, townEntry) : leaveTown(this.g)); // 大広間から出ると 城下町の 門の 前（10/7）
    } else if (QUEST_BOSS_AT[ch] && !this.g.cleared[QUEST_BOSS_AT[ch]]) {
      this.startBoss(QUEST_BOSS_AT[ch]); // お題の 怪物（10/7・新しい場所の 奥）
    }
  }

  // ボスの 渦に 乗った：黒い もや → 戦いへ
  startBoss(id, rematch = false) {
    const index = EPISODES.findIndex((e) => e.enemy.id === id);
    this.showMessages([{ text: rematch ? 'もう一度、昔話の 主に いどむ……！' : '黒い もやが うずまいている……！' }], () => {
      this.busy = true;
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('battle', { index, fromField: true, rematch }));
    });
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
    // 檜枝岐の 舞台（10/8 段2e）：道具3つを 供えると 幕が 開き、手下 → 大将。足りない 間は しおりが 足りない 道具を 言う
    if (!n && isField(this.mapId) && terrainAt(this.mapId, this.px + dx, this.py + dy)?.ch === '舞') {
      const st = stageNext(this.g);
      if (st.need.length) {
        this.showMessages([{ text: '「檜枝岐の舞台」' }, { speaker: 'しおり', text: `舞台に 供える 道具が、まだ そろって いないわ。あと ${st.need.map((x) => `「${x}」`).join('')}が 要るの。` }]);
        return;
      }
      if (st.next === 'teshita') {
        this.showMessages([{ text: '揚羽蝶の 旗、お伊勢参りの 台本、駒ヶ岳の 花を、舞台に 供えた……' }, { text: '拍子木の 音が 鳴りひびき、幕が 静かに 開いていく！', sfx: 'kane' }, { speaker: 'しおり', text: '最後の 演目よ。行きましょう！' }], () => this.startBoss('teshita'));
        return;
      }
      if (st.next === 'taisho') {
        this.showMessages([{ text: '幕の 奥で、大将が 待っている……' }], () => this.startBoss('taisho'));
        return;
      }
    }
    // 10/9 本人「クリア後…それぞれのボスと戦えるように」＝戻した 後の 終章の 印は「もう一度 戦う」（進みは 変わらない＝図鑑と 同じ）
    const again = !n && isField(this.mapId) ? endRematch(this.g, terrainAt(this.mapId, this.px + dx, this.py + dy)?.ch) : [];
    if (again.length) {
      this.showMenu('もう一度 戦いますか？（旅の 進みは 変わりません）', [
        ...again.map(([name, id]) => [`${name}と 戦う`, () => { this.closeDialog(); this.startBoss(id, true); }]),
        ['やめる', () => this.closeDialog()],
      ]);
      return;
    }
    // 終章の 道具を 守る 相手（10/8・ラリーが そろって いれば 話しかけると 戦い／そろって いなければ 立て札＝ばんばは にこにこ）
    const foe = !n && isField(this.mapId) ? relicFoeAt(this.g, terrainAt(this.mapId, this.px + dx, this.py + dy)?.ch) : null;
    if (foe) {
      this.startBoss(foe);
      return;
    }
    const kb = !n && isField(this.mapId) ? kanbanAt(this.mapId, this.px + dx, this.py + dy) : null;
    if (kb) {
      // 10/9 道具を 守る 相手の 前で まだ 戦えない＝しおりが 足りない 判子の 数を 言う
      const wait = isField(this.mapId) ? relicWait(this.g, terrainAt(this.mapId, this.px + dx, this.py + dy)?.ch) : null;
      const hint = wait ? [{ speaker: 'しおり', text: `${wait.name}の 判子が あと ${wait.left}つ そろえば、「${wait.relic}」を かけて 戦えるはずよ。` }] : [];
      this.showMessages([{ text: `「${kb.name}」` }, ...kb.lines.map((text) => ({ text })), ...hint]);
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
    else if (n.role === 'lord') this.lordMeet(n); // お城の お殿様（10/6 お城クエスト・10/7〜 大広間の 上段の間）
    else if (n.role === 'castle_gate') this.castleGate(); // お城の 門番＝大広間へ（10/7）
    else if (n.role === 'karo') this.showMessages(karoTalk(this.g, n.castleOf, n.lines).map((text) => ({ text }))); // 家老＝お題の 行き先
    else if (n.role === 'hadaka') this.showMessages(lines, () => this.hadakaMenu()); // 柳津の七日堂裸まいり（10/7）
    else if (n.role === 'attr') this.showMessages(lines, () => this.attrMenu(n.attr)); // 町の催し7つ（10/7）
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
    let stamp = [];
    if (r.ok) {
      this.setGame(r.game);
      sfx('eat');
      // 福島グルメの判子は 店では 出ない（10/7 アトラクションの 景品で もらう）
    }
    const text = r.ok ? `${ITEMS[id].name}を 買った！（${this.g.items[id]}こ 持っている）` : '文が 足りないようだ……';
    if (r.ok) this.showGoods(id);
    const back = () => (n.role === 'equip' ? this.equipShop(n.goods, n.items) : this.shopMenu(n));
    this.showMessages([{ text }, ...stamp], back);
  }

  // お城の お殿様（10/6 本人「お城クエスト、各お城のお殿様に合い、クエストのお題を授かる」）
  lordMeet(n) {
    const town = n?.castleOf ?? this.mapId;
    const r = lordTalk(this.g, town);
    const stamped = r.lines.some((text) => text.includes('判子を もらった'));
    this.setGame(r.game);
    // 10/8 夜 褒美の 行で ほうびの 曲（join）・お守りを だれが 着けるか 選んでから 判子
    const lines = noRelic(r.lines).map((text) => ({ text, sfx: text.includes('判子を もらった') ? 'win' : undefined, jingle: text.startsWith('褒美に ') ? 'join' : undefined }));
    const stamp = stamped ? () => this.showRallyStamp('castle', town) : undefined;
    if (r.charm) { this.showMessages(lines, () => this.giveReward(r.charm, stamp)); return; }
    this.showMessages(lines, stamp ?? (r.accepted ? () => this.showAccepted(town) : undefined));
  }

  // お殿様の 褒美の お守り（10/8 夜）：品の 絵を 見せ、だれが 着けるか 選ぶ（前の お守りは 家老に あずける）
  giveReward(id, after) {
    sfx('heal');
    this.showGoods(id);
    const opts = membersOf(this.g).map((w) => {
      const now = this.g.equip?.[w]?.charm;
      const [, fn, note, color] = this.equipOption(id, w, () => this.wearRewardOn(id, w, after));
      return [`${nameOf(this.g, w)}（今：${now ? EQUIP[now].name : 'なし'}）`, fn ?? (() => this.wearRewardOn(id, w, after)), note, color];
    });
    this.showMenu(`${EQUIP[id].name}（${equipNote(id)}）を いただいた！ だれが 着ける？`, [...opts, ['着けずに あずける', () => this.showMessages([{ text: `${EQUIP[id].name}は 家老に あずけた。` }], after)]]); // 10/8 夜 いまの お守りの ほうが 良い 時
  }

  wearRewardOn(id, who, after) {
    const r = wearReward(this.g, id, who);
    this.setGame(r.game);
    const lines = [{ text: `${nameOf(this.g, who)}は ${EQUIP[id].name}を 身に着けた！`, sfx: 'select' }];
    if (r.old) lines.push({ text: `（${EQUIP[r.old].name}は 家老に あずけた）` });
    this.showMessages(lines, after);
  }

  // お城の 門番：話すと 大広間へ（10/7 本人「お城の中に入って、お殿様よりクエストを受ける」）
  castleGate() {
    const town = this.mapId;
    const q = CASTLE_QUESTS[town];
    const name = TOWNS[q.hall].name;
    this.showMessages([{ text: `門番「ここから 先は ${name}。お殿様が 大広間で お待ちだ。」` }], () => this.showMenu(`${name}へ 入りますか？`, [
      ['入る', () => { sfx('select'); this.goto(enterCastle(this.g, town, townEntry(q.hall))); }],
      ['やめる', () => this.closeDialog()],
    ]));
  }

  // お題を 授かった：入口の ある 地図の 場所を 地図で 見せる（しおりの ひと言）
  showAccepted(town) {
    const q = CASTLE_QUESTS[town];
    this.showMessages([{ speaker: 'しおり', text: `${q.place}ね。地図に 道しるべが 立ったはずよ。行ってみましょう。` }]);
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
    // 10/8 力つきた 者は 試しを 受けられない（神社か お寺で 生き返らせて から）
    if (!canTakeQuest(this.g, who)) {
      this.showMessages([...n.lines.map(say), say(`${nameOf(this.g, who)}は 力つきて おる。神社か お寺で 生き返らせて から、また 来なさい。`)]);
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
      this.setGame(startDuel(this.g, who, n.ch, n.look));
      this.showMessages([{ speaker: q.master, text: 'よかろう。仲間は 下がって 見ておれ。' }], () => {
        this.busy = true;
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('battle', { duel: 1, fromField: true }));
      });
    } else if (q.form === 'mondo') {
      this.mondo = { n, q, who, m: newMondo(n.ch, n.job, makeRng((Date.now() & 0x7fffffff) || 1)) };
      // 10/8 問答の 間は 窓の 上を 師匠の 座敷の 絵で 覆う（届けば）
      if (this.textures.exists('qa_mondo_bg')) { this.mondoBg = this.add.image(0, 0, 'qa_mondo_bg').setOrigin(0); this.addUi(this.mondoBg); this.ui.sendToBack(this.mondoBg); }
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
      const bgOff = () => { this.mondoBg?.destroy(); this.mondoBg = null; };
      if (ok) this.showMessages([head], () => { bgOff(); this.passQuest(st.n, st.q, st.who); });
      else this.showMessages([head, { speaker: st.q.master, text: 'まだまだ。土地の 人の 話を よく 聞いて、出直して こい。' }, { speaker: 'しおり', text: '町の 人や 立て札、昔話の 中に 答えが あるわ。' }], bgOff);
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
    // 10/8 本人「画面が淡泊。太鼓や鳥居のドット画像を」＝背景の 絵（qa_kagura_bg）が 届けば それ。無ければ 図形の 夜空と 舞台に、奥の 鳥居（大わらじの 絵を 借りる）
    if (this.textures.exists('qa_kagura_bg')) box.add(this.add.image(0, 0, 'qa_kagura_bg').setOrigin(0));
    else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x14102a, 0x14102a, 0x3a1420, 0x3a1420, 1).fillRect(0, 0, W, 640);
      box.add(bg);
      if (this.textures.exists('qa_torii')) box.add(this.add.image(W / 2, 452, 'qa_torii').setOrigin(0.5, 1).setScale(1.2).setAlpha(0.9));
      const st = this.add.graphics();
      st.fillStyle(0x2a1a10, 1).fillRect(0, 450, W, 190);
      st.fillStyle(0xb0302a, 1).fillRect(28, 150, 12, 300).fillRect(W - 40, 150, 12, 300).fillRect(16, 140, W - 32, 14); // 神楽殿の 柱と 梁（鳥居より 手前）
      box.add(st);
    }
    const look = lookOf(who, this.g);
    const dancer = this.add.sprite(W / 2, 400, `p-${look}`, frameOf('down', 0, look)).setOrigin(0.5, 0.85).setScale(2.4);
    if (tintOf(who)) dancer.setTint(tintOf(who));
    const DRUM = { x: W / 2, y: 560 };
    // 太鼓：絵（qa_kagura_taiko）が 届けば それ・無ければ 丸（10/8）
    const taikoSrc = this.textures.exists('qa_kagura_taiko') ? this.textures.get('qa_kagura_taiko').getSourceImage() : null;
    const drum = taikoSrc
      ? this.add.image(DRUM.x, DRUM.y + 8, 'qa_kagura_taiko').setScale(Math.min(110 / taikoSrc.width, 96 / taikoSrc.height))
      : this.add.circle(DRUM.x, DRUM.y, 30, 0x8a4a1a).setStrokeStyle(4, 0xe8d0a0);
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
    const hit = hitBox(this, 0, 0, W, 640).setOrigin(0).setInteractive();
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
    if (this.textures.exists('qa_mato_bg')) box.add(this.add.image(0, 0, 'qa_mato_bg').setOrigin(0)); // 10/8 弓道場の 絵（届けば）
    else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x8ac0e8, 0x8ac0e8, 0xd8eef8, 0xd8eef8, 1).fillRect(0, 0, W, 640);
      bg.fillStyle(0x6a9a4a, 1).fillRect(0, 300, W, 340); // 弓場の 芝
      bg.fillStyle(0x3a2a1a, 1).fillRect(0, 196, W, 8); // 的の 走る 線（絵の 時は 安土の 前を 走る＝線は 引かない）
      box.add(bg);
    }
    const LINE_Y = 200;
    const aim = this.add.rectangle(W / 2, LINE_Y, 4, 120, 0xe0302a, 0.8);
    const zone = this.add.rectangle(W / 2, LINE_Y, MATO_HALF * 2 * W, 70, 0xffffff, 0.25);
    const target = this.add.container(0, LINE_Y);
    if (this.textures.exists('qa_mato_target')) { const ti = this.add.image(0, 0, 'qa_mato_target'); target.add(ti.setScale(56 / Math.max(ti.width, ti.height))); } // 的の 絵（届けば・直径 56＝図形と 同じ 大きさ）
    else target.add([this.add.circle(0, 0, 26, 0xffffff).setStrokeStyle(2, 0x222222), this.add.circle(0, 0, 18, 0x222222), this.add.circle(0, 0, 11, 0xffffff), this.add.circle(0, 0, 5, 0xe0302a)]);
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
    const hit = hitBox(this, 0, 0, W, 640).setOrigin(0).setInteractive();
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
    if (this.textures.exists('qa_kage_bg')) box.add(this.add.image(0, 0, 'qa_kage_bg').setOrigin(0)); // 10/8 夜の 城の 庭の 絵（届けば）
    else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x060716, 0x060716, 0x15122a, 0x15122a, 1).fillRect(0, 0, W, 640);
      box.add(bg);
    }
    const laneG = this.add.graphics();
    const shadeG = this.add.graphics();
    const shadeA = this.textures.exists('qa_kage_bg') ? 0.6 : 0.9; // 10/8 庭の 絵の 時は 影の 帯を 少し 薄く（0.9 では 絵が ほとんど 隠れた）
    for (let k = 0; k <= KW_LANES; k++) shadeG.fillStyle(0x020205, shadeA).fillRect(0, yOf(k) - 9, W, 18); // 塀の影
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
    const hit = hitBox(this, 0, 0, W, 640).setOrigin(0).setInteractive();
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
    // 絵が 届いていれば 夜の五老山と 大松明の絵（10/5 夜）・無ければ 図形で描く（Artifact は 1版512まで＝絵を載せない）
    const art = TAIMATSU_ART && ['bg', 'off', 'on'].every((k) => this.textures.exists(`taimatsu_${k}`));
    if (art) box.add(this.add.image(0, 0, 'taimatsu_bg').setOrigin(0));
    else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x0b0a2a, 0x0b0a2a, 0x3a1a3a, 0x3a1a3a, 1).fillRect(0, 0, W, 640);
      // 五老山の 稜線（左右対称に しない）
      bg.fillStyle(0x140c18, 1).beginPath().moveTo(0, 470).lineTo(70, 420).lineTo(150, 440).lineTo(230, 395).lineTo(300, 430).lineTo(W, 410).lineTo(W, 640).lineTo(0, 640).closePath().fillPath();
      box.add(bg);
    }
    const BASE = 548; // 大松明の 足もと（絵のとき・丘の草地の上）
    const offH = art ? this.textures.get('taimatsu_off').getSourceImage().height : 0;
    const onH = art ? this.textures.get('taimatsu_on').getSourceImage().height : 0;
    const SPARK_Y = art ? BASE - onH - 22 : 250; // 火の粉は 燃えた炎の 先より 上を 走る
    const TOP = 300;
    const torches = [...Array(TAIMATSU_TORCHES).keys()].map((i) => {
      const x = torchX(i) * W;
      if (art) {
        // 目当ての松明＝足もとに 金の光・頭の上に ▼
        const ring = this.add.ellipse(x, BASE - 2, 40, 12, 0xffd060, 0.55).setVisible(false);
        const arrow = this.add.text(x, BASE - offH - 6, '▼', { fontFamily: FONT, fontSize: '16px', color: '#ffe080' }).setOrigin(0.5, 1).setStroke('#1a1030', 4).setVisible(false);
        const pole = this.add.image(x, BASE, 'taimatsu_off').setOrigin(0.5, 1);
        const glow = this.add.circle(x, BASE - onH + 26, 30, 0xffb040, 0.3).setVisible(false);
        box.add([glow, ring, pole, arrow]);
        return { pole, ring, arrow, glow, ph: i * 1.7 };
      }
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
        o.glow.setVisible(on);
        if (art) {
          o.pole.setTexture(on ? 'taimatsu_on' : 'taimatsu_off');
          o.ring.setVisible(i === tg);
          o.arrow.setVisible(i === tg);
          return;
        }
        o.flame.setVisible(on);
        o.ring.setStrokeStyle(3, 0xffe080, i === tg ? 1 : 0);
      });
    };
    const showInfo = () => info.setText(`灯した ${r.lit.length} / ${TAIMATSU_TORCHES}　のこり ${Math.ceil(taimatsuLeft(r, now()) / 1000)}秒`);
    const tick = () => {
      const x = sparkX(r, now()) * W;
      spark.x = x;
      sparkGlow.x = x;
      sparkGlow.setAlpha(0.25 + 0.15 * Math.sin(this.time.now / 90));
      if (art) {
        // 灯った炎は ゆらぐ・目当ての光は 脈打つ
        torches.forEach((o, i) => {
          if (r.lit.includes(i)) o.glow.setAlpha(0.22 + 0.1 * Math.sin(this.time.now / 110 + o.ph));
        });
        const k = 0.4 + 0.25 * Math.sin(this.time.now / 160);
        torches.forEach((o) => o.ring.setAlpha(k));
      }
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
    const hit = hitBox(this, 0, 0, W, 640).setOrigin(0).setInteractive();
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

  // 町の催し7つ（10/7 本人「柳津以外のアトラクションも全部進めて」）＝計算 attractions.js・画面 attractionsUI.js
  attrMenu(id) {
    const X = ATTRACTIONS[id];
    this.showMenu(`${X.label} ${this.g[X.key] ?? 0}点（所持金 ${this.g.mon}文）`, [
      [`${X.verb}（${X.price}文）`, () => this.startAttr(id)],
      ['景品と 換える', () => this.prizeMenu(null, id)],
      ['立ち去る', () => this.closeDialog()],
    ]);
  }

  startAttr(id) {
    const r0 = enterAttr(this.g, id);
    if (!r0.ok) {
      this.showMessages([{ text: '文が 足りないようだ……' }], () => this.attrMenu(id));
      return;
    }
    this.setGame(r0.game);
    this.closeDialog();
    this.busy = true;
    stopBgm();
    const box = this.add.container(0, 0);
    this.addUi(box);
    const X = ATTRACTIONS[id];
    const done = (res) => {
      const { pts, line } = attrResult(id, res);
      this.setGame(addAttrPts(this.g, id, pts));
      box.destroy();
      this.busy = false;
      this.attr = null;
      startBgm(this.fieldBgm());
      this.showMessages([{ text: line }, { text: `${X.label}を ${pts}点 もらった（いま ${this.g[X.key] ?? 0}点）。` }], () => this.attrMenu(id));
    };
    this.attr = ATTR_PLAY[id](this, box, { rng: makeRng((Date.now() & 0x7fffffff) || 1), done }); // 確かめ用の 取っ手
  }

  // 七日堂裸まいり「縄のぼり」の選び（10/7 本人「アトラクションはもっと増やして」→ 柳津）
  hadakaMenu() {
    this.showMenu(`縄のぼり点 ${this.g.hadakaPts ?? 0}点（所持金 ${this.g.mon}文）`, [
      [`縄のぼりに 加わる（${HADAKA_PRICE}文）`, () => this.startHadaka()],
      ['景品と 換える', () => this.prizeMenu(null, 'hadaka')],
      ['立ち去る', () => this.closeDialog()],
    ]);
  }

  // 縄のぼりの画面：本堂の 鰐口から 麻縄。「左手」「右手」を 交互に さわって のぼる（同じ手を 続けると ずり落ちる・止めると 下がる）
  startHadaka() {
    const r0 = enterHadaka(this.g);
    if (!r0.ok) {
      this.showMessages([{ text: '文が 足りないようだ……' }], () => this.hadakaMenu());
      return;
    }
    this.setGame(r0.game);
    this.closeDialog();
    this.busy = true;
    stopBgm();
    let r = newHadaka();
    const box = this.add.container(0, 0);
    this.addUi(box);
    const art = HADAKA_ART && ['bg', 'climbL', 'climbR'].every((k) => this.textures.exists(`hadaka_${k}`));
    const TOPY = 128; // 鰐口の すぐ下（のぼりきった所）
    const FLOOR = 482; // 床（登る人が 下の 左手・右手の 札に かからない 高さ）
    const ROPE_X = W / 2;
    if (art) box.add(this.add.image(0, 0, 'hadaka_bg').setOrigin(0));
    else {
      // 絵が届くまで：夜の本堂（木の柱と梁）・鰐口・麻縄を 図形で
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x1a0f08, 0x1a0f08, 0x3a2414, 0x3a2414, 1).fillRect(0, 0, W, 640);
      bg.fillStyle(0x2a1a0e, 1).fillRect(24, 0, 22, 640).fillRect(W - 46, 0, 22, 640).fillRect(0, 34, W, 18);
      bg.fillStyle(0x4a2e18, 1).fillRect(0, FLOOR + 8, W, 640 - FLOOR);
      bg.fillStyle(0xd8b04a, 1).fillEllipse(ROPE_X, 82, 64, 40);
      bg.fillStyle(0x6a4a1a, 1).fillEllipse(ROPE_X, 88, 26, 10);
      bg.lineStyle(9, 0xc8a46a, 1).lineBetween(ROPE_X, 100, ROPE_X, FLOOR + 6);
      bg.lineStyle(2, 0x8a6a3a, 1);
      for (let y = 104; y < FLOOR; y += 12) bg.lineBetween(ROPE_X - 4, y, ROPE_X + 4, y + 6);
      box.add(bg);
    }
    // のぼる人：絵が届くまでは 旅の者の 後ろ姿
    // 絵のとき：登る人の 頭の上の端が 床で y316（足が 縄の房の上）・のぼりきると y140（上げた手が 鰐口の下）。上げた手が 縄に かかるよう 左右に ずらす（10/7 重ねた見本で 決めた）
    const ART_FLOOR = 316, ART_TOP = 140, HAND_DX = { L: 14, R: -14 };
    // ⭐10/7 あなたが 女のときは 登る人の絵（男の 裸まいり）を 使わず、あなたの 歩く絵の 後ろ姿で 登る
    const climbArt = art && heroSexOf(this.g) === 'm';
    const me = lookOf('tabi', this.g);
    const climber = climbArt ? this.add.image(ROPE_X + HAND_DX.L, ART_FLOOR, 'hadaka_climbL').setOrigin(0.5, 0)
      : art ? this.add.sprite(ROPE_X, ART_FLOOR, `p-${me}`, frameOf('up', 0, me)).setOrigin(0.5, 0).setScale(3.6)
        : this.add.sprite(ROPE_X, FLOOR, `p-${me}`, frameOf('up', 0, me)).setOrigin(0.5, 0.3).setScale(2.2);
    // 字は 登る人の 通り道を よけて 床の あたり（絵のとき）
    const TY = art ? 478 : 168;
    const say = this.add.text(W / 2, TY, '左手・右手を 交互に！', { fontFamily: FONT, fontSize: '19px', color: '#ffffff' }).setOrigin(0.5).setStroke('#1a1030', 5);
    const info = this.add.text(W / 2, TY + 28, '', { fontFamily: FONT, fontSize: '18px', color: '#ffe9a8' }).setOrigin(0.5).setStroke('#1a1030', 5);
    const res = this.add.text(W / 2, art ? TY + 58 : 240, '', { fontFamily: FONT, fontSize: art ? '22px' : '26px', color: '#ffb040' }).setOrigin(0.5).setStroke('#1a1030', 6);
    // 左手・右手の 札（画面の 左半分・右半分を さわっても 同じ）
    const pad = (x, label) => {
      const g = this.add.graphics();
      g.fillStyle(0x2a2050, 0.85).fillRoundedRect(x - 72, 562, 144, 66, 14).lineStyle(3, 0xc9a24a, 1).strokeRoundedRect(x - 72, 562, 144, 66, 14);
      const t = this.add.text(x, 595, label, { fontFamily: FONT, fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
      return [g, t];
    };
    box.add([climber, say, info, res, ...pad(92, '左手'), ...pad(W - 92, '右手')]);
    let t0 = this.time.now;
    let loop = null;
    const now = () => this.time.now - t0;
    const yOf = (h) => (art ? ART_FLOOR - (ART_FLOOR - ART_TOP) * h : FLOOR - (FLOOR - TOPY) * h);
    const showInfo = () => info.setText(`高さ ${Math.round(ropeHeight(r, now()) * 113)}段　のこり ${Math.ceil(hadakaLeft(r, now()) / 1000)}秒`);
    const tick = () => {
      climber.y = yOf(ropeHeight(r, now()));
      showInfo();
      if (hadakaDone(r, now())) finish();
    };
    const tap = (side) => {
      if (!loop) return;
      const out = grabRope(r, side, now());
      r = out.r;
      if (climbArt) climber.setTexture(side === 'L' ? 'hadaka_climbL' : 'hadaka_climbR').setX(ROPE_X + HAND_DX[side]);
      else climber.setFrame(frameOf('up', side === 'L' ? 1 : 3, me));
      sfx(out.ok ? 'select' : 'damage');
      if (!out.ok) {
        res.setText('ずり落ちた！');
        this.tweens.add({ targets: res, alpha: { from: 1, to: 0 }, duration: 600 });
      }
      if (out.top) {
        sfx('gong');
        res.setAlpha(1).setText('鰐口に 届いた！');
        this.uiCam?.shake(220, 0.006);
      }
      tick();
    };
    const hit = hitBox(this, 0, 0, W, 640).setOrigin(0).setInteractive();
    hit.on('pointerdown', (p) => tap(p.x < W / 2 ? 'L' : 'R'));
    box.add(hit);
    const finish = () => {
      if (!loop) return;
      loop.remove(false);
      loop = null;
      hit.removeAllListeners();
      const pts = hadakaPts(r);
      this.setGame(addRope(this.g, r));
      if (!r.top) sfx('select');
      this.time.delayedCall(1200, () => {
        box.destroy();
        this.busy = false;
        this.hadaka = null;
        startBgm(this.fieldBgm());
        this.showMessages([
          { text: r.top ? '麻縄を のぼりきって、鰐口に 手が 届いた！ 一年の 無病息災を 願った。' : `麻縄を ${Math.round(r.best * 113)}段ぶん のぼった！` },
          { text: `縄のぼり点を ${pts}点 もらった（いま ${this.g.hadakaPts ?? 0}点）。` },
        ], () => this.hadakaMenu());
      });
    };
    showInfo();
    this.hadaka = { r: () => r, tap, now, tick }; // 確かめ用の取っ手
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
        this.closeDialog(); // 10/8 二度押しで 2回 払った（暗くなる 間も「つかる」が 押せた）
        this.busy = true;
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.cameras.main.fadeIn(600, 0, 0, 0);
          // 福島温泉めぐり（10/6）＝湯に つかると その温泉の 判子（10/8 猫啼は 3章の 地図の 湯からも＝町の id で 押す）
          const town = bathTown(this.mapId, place);
          const st = stampOnsen(this.g, town ?? this.mapId);
          if (st.added) this.setGame(st.game);
          // 10/8 湯に つかる しおりの 絵と ほのぼのした 音と 曲（5秒）→ いつもの 文 → 図鑑の 判子
          this.showBath(town, place, () => {
          sfx('heal');
          this.showMessages([{ text: `${place}の 湯に ゆっくり つかった。つかれも 呪いも、すっかり 落ちた！` }, ...noRelic(st.lines).map((text, i) => ({ text, sfx: i === 0 ? 'win' : undefined }))], st.added ? () => this.showRallyStamp('onsen', town) : undefined);
          });
        });
      }],
      ['やめる', () => this.closeDialog()],
    ]);
  }

  // 温泉に つかる 場面（10/8 本人「しおりが各温泉のお湯に浸かっているところのイラスト＋ほのぼのした効果音」）
  // 上＝その 温泉で 湯に つかる しおりの 絵（Gemini・無ければ 町の 一枚絵）と 湯気。5秒（本人「効果音＋短いほのぼのした音楽 5秒」）
  // そのあと 文と 図鑑の 判子（⛔10/8 絵の 上の「済」の 判子は 本人「コレクションでの判子とダブる」で 外した）。2秒より あとは さわると 先へ
  showBath(town, place, done) {
    const TOP = 40;
    const S = 360;
    const box = this.add.container(0, 0).setDepth(200);
    this.addUi(box);
    this.busy = true;
    box.add(this.add.rectangle(0, 0, W, 640, 0x0c0a18, 1).setOrigin(0).setInteractive()); // 下の 物を 押させない
    const bg = bathBg(town, (k) => this.textures.exists(k));
    if (bg) {
      const im = this.add.image(W / 2, TOP + S / 2, bg.key);
      const k = Math.max(S / im.width, S / im.height);
      im.setScale(k).setCrop((im.width - S / k) / 2, (im.height - S / k) / 2, S / k, S / k); // 正方形に 切る（町の 一枚絵は 横長）
      box.add(im);
    } else {
      const g = this.add.graphics();
      g.fillGradientStyle(0x2a3a5a, 0x2a3a5a, 0x5a6a7a, 0x5a6a7a, 1).fillRect(0, TOP, W, S);
      box.add(g);
    }
    // 10/8 本人「画面はGeminiで」＝しおりも 湯船も 入った 1枚の 絵（温泉ごと）。絵が まだの 温泉は 町の 一枚絵に 湯気だけ
    // 湯気
    for (let i = 0; i < 12; i++) {
      const c = this.add.circle(20 + Math.random() * (W - 40), TOP + S - 60, 14 + Math.random() * 16, 0xffffff, 0);
      box.add(c);
      this.tweens.add({ targets: c, y: TOP + 40 + Math.random() * 120, alpha: { from: 0.28, to: 0 }, scale: { from: 0.6, to: 1.6 }, duration: 2600 + Math.random() * 1600, delay: Math.random() * 2400, repeat: -1 });
    }
    box.add(this.add.rectangle(0, TOP, W, S).setOrigin(0).setStrokeStyle(3, 0xc9a24a, 1));
    box.add(this.add.text(W / 2, TOP + S + 34, `${place}の 湯`, { fontFamily: FONT, fontSize: '24px', color: '#ffd98a' }).setOrigin(0.5).setStroke('#1a1030', 5));
    box.add(this.add.text(W / 2, TOP + S + 80, 'しおり「ふぅ……いい お湯。」', { fontFamily: FONT, fontSize: '20px', color: '#ffffff' }).setOrigin(0.5).setStroke('#1a1030', 5));
    sfx('yuami');
    const t0 = this.time.now;
    let ended = false;
    const finish = () => {
      if (ended) return;
      ended = true;
      this.input.off('pointerdown', tap);
      this.tweens.killTweensOf(box.list);
      box.destroy();
      this.bath = null;
      this.busy = false;
      done?.();
    };
    const tap = () => { if (this.time.now - t0 > 2000) finish(); };
    this.input.on('pointerdown', tap);
    this.time.delayedCall(5000, finish);
    this.bath = { town, finish, art: bg?.key ?? null, own: !!bg?.own }; // 確かめ用の 取っ手
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
        this.closeDialog(); // 10/8 二度押しで 2回 払わない（温泉と 同じ）
        this.busy = true;
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
    this.showMenu(`${this.town?.name ?? '湯本'}の 寺で 何を しますか？`, [ // 10/5 夜 相馬・郡山にも お寺
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
    const backToShop = () => (shop.backFn ? shop.backFn(this) : this[shop.back]());
    // 景品が 1種類だけ（戦いで 使う品だけ など）なら「どちらの 景品に する？」は 出さない（10/7 本人「身に着ける品が無い場合、表示はしない」）
    const kinds = ['item', 'equip'].filter((k) => Object.values(shop.prizes).some((p) => p.kind === k));
    const onlyKind = kinds.length === 1 ? kinds[0] : null;
    if (!kind && onlyKind) kind = onlyKind;
    if (!kind) {
      this.showMenu(`どちらの 景品に する？（${shop.label} ${pts}点）`, [
        ['戦いで 使う品', () => this.prizeMenu('item', shopId)],
        ['身に 着ける品', () => this.prizeMenu('equip', shopId)],
        ['もどる', backToShop],
      ]);
      return;
    }
    const opts = Object.entries(shop.prizes).filter(([, p]) => p.kind === kind).map(([pid, p]) => {
      const note = p.kind === 'item' ? `${p.pts}点 ${itemNote(ITEMS[p.id])}` : `${p.pts}点 ${equipNote(p.id)}`;
      return [this.prizeName(p), () => this.takePrize(pid, null, shopId), note];
    });
    this.showMenu(`景品（${shop.label} ${pts}点）`, [...opts, ['もどる', () => (onlyKind ? backToShop() : this.prizeMenu(null, shopId))]]);
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
    const back = () => this.prizeMenu(p.kind, shopId);
    // 景品の 名物＝福島グルメの判子（10/7）→ 図鑑を開いて「済」を押す
    const st = p.kind === 'item' ? stampGourmet(this.g, p.id) : { added: false };
    if (st.added) {
      this.setGame(st.game);
      lines.push(...noRelic(st.lines).map((text, i) => ({ text, sfx: i === 0 ? 'win' : undefined })));
      this.showMessages(lines, () => this.showRallyStamp('gourmet', st.town, back));
      return;
    }
    this.showMessages(lines, back);
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
    // 10/8 夜 本人「提灯祭りの背景、Geminiで作成してほしい」＝絵（attrbg_chochin・art_src/prep_attr_bg.py chochin=…）が あれば 絵・無ければ 前の 図形
    if (this.textures.exists('attrbg_chochin')) box.add(this.add.image(0, 0, 'attrbg_chochin').setOrigin(0));
    else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x0b0a24, 0x0b0a24, 0x2a1838, 0x2a1838, 1).fillRect(0, 0, W, 640);
      // 町の屋根の影
      bg.fillStyle(0x120d1c, 1);
      for (let x = -20; x < W; x += 70) bg.fillTriangle(x, 470, x + 35, 440, x + 70, 470).fillRect(x, 470, 70, 60);
      bg.fillStyle(0x1a1410, 1).fillRect(0, 530, W, 110);
      box.add(bg);
    }
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
    const hit = hitBox(this, 0, 0, W, 640).setOrigin(0).setInteractive();
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
    // 10/8 字の 点検：始めの 一瞬 馬と ▼が 画面の 左の 端（x 0）に 半分 はみ出して いた＝作った すぐ 後に 置く
    place(me, race.horse);
    meMark.x = me.x;
    race.rivals.forEach((x, i) => place(rivalViews[i], x));
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
    const id = this.textures.exists(`icon_${id0}`) ? id0 : EQUIP[id0]?.icon ?? id0; // 自分の絵が 届いて いれば それ（10/6）・無ければ 前の品の絵を使い回す（10/5）
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
          localStorage.setItem(slotKey(this.registry.get('slot') ?? 1), text); // 選んだ記憶（10/7 記憶①〜③）
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
          localStorage.setItem(slotKey(this.registry.get('slot') ?? 1), text); // 選んだ記憶（10/7 記憶①〜③）
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



  // 品の絵の名前（自分の絵が 届いて いれば それ・無ければ 前の品の 絵を 借りる）
  gearIcon(id) {
    if (!id) return null;
    if (this.textures.exists(`icon_${id}`)) return `icon_${id}`;
    const alt = EQUIP[id]?.icon;
    return alt && this.textures.exists(`icon_${alt}`) ? `icon_${alt}` : null;
  }

  // そうびを見る（10/6 本人「装備画面でこれらの装備を見せて欲しい」）＝1人 1ページの 札（名前・強さ・武器と防具と お守りの 絵・技）
  showGear(page = 0) {
    this.closeDialog();
    this.busy = true;
    const views = partyView(this.g);
    const p = views[page];
    this.gearBox?.destroy();
    const box = this.add.container(0, 0).setDepth(2000);
    this.gearBox = box;
    box.add(this.add.rectangle(0, 0, W, 640, 0x07061a, 1).setOrigin(0).setInteractive());
    const txt = (x, y, t, size, color = '#ffffff', o = {}) => this.add.text(x, y, t, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 3, ...o });
    const name = `${nameOf(this.g, p.id)}${p.job && (p.id === 'tabi' || p.id === 'shiori') ? `（${JOBS[p.job].name}）` : ''}`;
    box.add(makeWindow(this, 8, 10, W - 16, 96));
    const face = p.id === 'shiori' ? 'face_normal' : p.id === 'tabi' ? `face_${heroFace(this.g, FACE_IDS, EXTRA_LOOKS)}` : FACE_IDS.includes(`job_${p.id}`) ? `face_job_${p.id}` : `face_${p.id}`;
    if (this.textures.exists(face)) box.add(this.add.image(52, 58, face).setDisplaySize(72, 72));
    box.add(txt(100, 22, name, 20, '#ffd27a'));
    box.add(txt(100, 52, `Lv ${p.lv}　攻 ${p.atk}　守 ${p.def}
速 ${p.agi}　知 ${p.int}`, 15, '#ffffff', { lineSpacing: 4 }));
    box.add(makeWindow(this, 8, 114, W - 16, 300));
    SLOTS.forEach((sl, k) => {
      const y = 158 + k * 92;
      const id = p.gear[sl];
      const ic = this.gearIcon(id);
      const frame = this.add.graphics();
      frame.fillStyle(0x15132e, 1).fillRoundedRect(22, y - 38, 76, 76, 8);
      frame.lineStyle(2, id ? 0xc9a24a : 0x3a3660, 1).strokeRoundedRect(22, y - 38, 76, 76, 8);
      box.add(frame);
      if (ic) box.add(this.add.image(60, y, ic).setScale(1.5));
      box.add(txt(112, y - 24, SLOT_NAME[sl], 14, '#cfc4a0'));
      box.add(txt(112, y - 2, id ? EQUIP[id].name : 'なし', 20, id ? '#ffffff' : '#8a86b0'));
    });
    const skills = p.job ? [JOBS[p.job].basic, ...(this.g.skills?.[p.id] ?? [])].filter(Boolean).map((sid) => JOB_SPELLS[sid].name) : [];
    box.add(makeWindow(this, 8, 422, W - 16, 140));
    box.add(txt(24, 434, '技', 14, '#cfc4a0'));
    box.add(txt(24, 456, skills.join('・') || 'まだ ない', 16, '#ffffff', { wordWrap: { width: W - 48, useAdvancedWrap: true }, lineSpacing: 6 }));
    const btn = (x, label, on, enabled = true) => {
      const t = txt(x, 600, label, 20, enabled ? '#ffffff' : '#555070').setOrigin(0.5);
      box.add(t);
      if (!enabled) return;
      const z = hitBox(this, x - 55, 578, 110, 44).setOrigin(0).setInteractive();
      z.on('pointerup', () => { sfx('select'); on(); });
      box.add(z);
    };
    btn(60, '◀ まえ', () => this.showGear(page - 1), page > 0);
    btn(W / 2, 'とじる', () => { box.destroy(); this.gearBox = null; this.busy = false; });
    btn(W - 60, 'つぎ ▶', () => this.showGear(page + 1), page < views.length - 1);
    box.add(txt(W / 2, 572, `${page + 1} / ${views.length}`, 13, '#8a86b0').setOrigin(0.5, 1));
    this.cameras.main.ignore(box);
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
