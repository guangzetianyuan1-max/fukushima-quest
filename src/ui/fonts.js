// 画面の字は ここ1か所で決める（10/4 夜）
// 本人 10/4 夜「ゲーム画面の全ての文字を明朝体に」→ 同夜「全てドットのゴシックにしてください」＝DotGothic16（Google Fonts）
// 題字・巻物・町の名前も同じ字（前＝題字 Potta One・巻物 Yuji Boku の毛筆）。DotGothic16 は太字が無い＝太さは つけない（縁取りで目立たせる）
export const FONT_NAME = 'DotGothic16';
export const GAME_FONT = `${FONT_NAME}, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif`;
export const TITLE_WEIGHT = 'normal';
// ⭐例外：紙芝居の始めのアイキャッチの話数と題だけ 太い習字（10/5 夜 本人「アイキャッチ画像の文字は太い習字に」）
// Yuji Boku（Google Fonts・index.html／Artifact／build_site.py の3か所で読む）に 白い縁を足して太らせる（BattleScene の ink）
export const EYE_FONT_NAME = 'Yuji Boku';
export const EYE_FONT = `"${EYE_FONT_NAME}", ${GAME_FONT}`;
