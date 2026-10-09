// アプリの自動更新（本人 10/4「アプリ更新を自動でお願いしたい。現在、スマホ電源OFFにして、再起動でないとアプリ更新ができない」）
// ホーム画面のアプリは 閉じても裏で生きていて、開き直しても前の版のページのまま戻ってくる＝新しい版を読みにいかない
// ⇒ 開いたとき・裏から戻ったとき・遊んでいる間は10分ごとに、置き場の version.json（art_src/build_site.py が書く）を読みに行き、
//   いま動いている版より新しければ：表紙（と始まる前）なら すぐ読み直す／遊んでいる途中なら 上に知らせを出し、さわったら読み直す
//   （途中で勝手に読み直すと セーブしていない旅が消えるため）
// いまの版＝この部品の住所の ?v=（publish_prep・build_site が付ける）。手元の確かめ（?v= 無し）と claude.ai（version.json 無し）では何もしない

import { GAME_FONT } from './fonts.js?v=307';
export const CURRENT = (() => {
  try {
    return new URL(import.meta.url).searchParams.get('v');
  } catch (e) {
    return null;
  }
})();

export function isNewer(latest, current) {
  if (latest == null || current == null) return false; // ⚠Number(null) は 0＝無い版を 0 と見て「新しい」と取り違える
  const a = Number(latest);
  const b = Number(current);
  return Number.isFinite(a) && Number.isFinite(b) && a > b;
}

// その版へ もう読み直したことがあるか（?u=版 が付いている）＝置き場の配り直しが遅れて 前のページが返ってきた時に、読み直しを繰り返さない
export function alreadyTried(href, ver) {
  try {
    const u = new URL(href).searchParams.get('u');
    return u != null && Number(u) >= Number(ver);
  } catch (e) {
    return false;
  }
}

// 新しい版の住所（?u=版 を付けて、端末が覚えている前のページを使わせない）
export function freshUrl(loc, ver) {
  const u = new URL(loc.href);
  u.search = '';
  u.hash = '';
  u.searchParams.set('u', String(ver));
  return u.toString();
}

const EVERY_MS = 10 * 60 * 1000;
let shown = null;
let checking = false;

async function latestVersion() {
  const r = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) return null;
  return (await r.json())?.v ?? null;
}

// 起動のとき（ローディングバーの最初）：新しい版があれば その版の番号、無ければ null（読み直しを繰り返さない）
export async function newerOnLaunch() {
  if (!CURRENT) return null;
  try {
    const v = await latestVersion();
    return isNewer(v, CURRENT) && !alreadyTried(window.location.href, v) ? v : null;
  } catch (e) {
    return null;
  }
}

export function reloadTo(ver) {
  window.location.replace(freshUrl(window.location, ver));
}

function banner(ver) {
  if (shown) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = `新しい版（版${ver}）が出ました。ここを さわると 更新します（セーブしていない旅は 消えます）`;
  b.style.cssText = 'position:fixed;left:8px;right:8px;top:max(8px, env(safe-area-inset-top));z-index:9998;font-family:'+GAME_FONT.replace(/"/g, "'")+';font-size:14px;line-height:1.5;padding:10px 12px;border-radius:8px;border:2px solid #b8913a;background:#3a2f5c;color:#fff;text-align:left;';
  b.addEventListener('click', () => reloadTo(ver));
  document.body.appendChild(b);
  shown = b;
}

// atTitle()＝いま表紙（または始まる前）か。表紙なら知らせを出さずに読み直す
export async function checkUpdate(atTitle) {
  if (!CURRENT || checking) return;
  checking = true;
  try {
    const v = await latestVersion();
    if (!isNewer(v, CURRENT)) return;
    if (atTitle() && !alreadyTried(window.location.href, v)) reloadTo(v);
    else banner(v);
  } catch (e) {
    // 電波が無い・claude.ai の上（version.json が無い）＝そのまま遊ぶ
  } finally {
    checking = false;
  }
}

export function watchUpdates(atTitle) {
  if (!CURRENT) return;
  checkUpdate(atTitle);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkUpdate(atTitle); });
  window.addEventListener('pageshow', (e) => { if (e.persisted) checkUpdate(atTitle); }); // 前のページを そのまま戻した時（iPhone）
  window.addEventListener('focus', () => checkUpdate(atTitle));
  setInterval(() => { if (document.visibilityState === 'visible') checkUpdate(atTitle); }, EVERY_MS);
}
