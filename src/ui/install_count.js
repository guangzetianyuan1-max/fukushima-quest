// ダウンロードの数（10/10 本人「ホームページ上でアプリのダウンロード数…のカウンターを設置して欲しい。同じアカウントからの重複はカウントしない」）
// ＝ホーム画面の アイコンから 初めて 開いた 端末を 1回だけ 数える（本人が 選んだ 数え方）。ゲームに アカウントは 無い ⇒ 端末ごとの ランダムな 番号（UUID）で 重複を はぶく
// 送る 先＝ホームページ（seizo-ai.com）の Hima Counter プラグイン（art_src/site/hima-counter）。届かなくても ゲームは 止めない（次に 開いた 時に もう一度）
export const COUNTER_URL = 'https://seizo-ai.com/wp-json/hima/v1/hit';
const VID = 'fq-vid';
const DONE = 'fq-install-counted';

export function uuid4(rand = Math.random) {
  const h = [...Array(32)].map(() => Math.floor(rand() * 16).toString(16));
  h[12] = '4';
  h[16] = '89ab'[Math.floor(rand() * 4)];
  const s = h.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

// アイコンから 開いたか（Android＝display-mode standalone／iPhone＝navigator.standalone）
export function isStandalone(win) {
  try {
    return !!(win.matchMedia?.('(display-mode: standalone)')?.matches || win.navigator?.standalone === true);
  } catch {
    return false;
  }
}

// 数えるなら 送る 中身を 返す（数えないなら null）。番号は 無ければ 作って 残す
export function installHit(win) {
  const st = win.localStorage;
  if (!isStandalone(win) || st.getItem(DONE)) return null;
  let id = st.getItem(VID);
  if (!id) { id = win.crypto?.randomUUID?.() ?? uuid4(); st.setItem(VID, id); }
  return { kind: 'install', id };
}

export function countInstall(win = globalThis.window, doFetch = globalThis.fetch) {
  try {
    const hit = installHit(win);
    if (!hit) return false;
    // text/plain＝前もっての 問い合わせ（CORS の preflight）を 起こさない 送り方
    doFetch(COUNTER_URL, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(hit) })
      .then((r) => { if (r.ok) win.localStorage.setItem(DONE, '1'); })
      .catch(() => {});
    return true;
  } catch {
    return false; // 記録の 使えない 端末（プライベートなど）は 数えない
  }
}
