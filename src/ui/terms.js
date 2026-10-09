// 遊ぶ前の利用規約の画面（本人 10/4「こちらに責任が被らない書面チェック機構を入れて欲しい」）
// 初めて（と規約の版が変わったとき）は全文を出し、「同意します」に印を付けて「同意して はじめる」を押すまで ゲームを始めない
// 同意したことは 端末の中（localStorage）に 版と日時で残す。残せない端末（記録を消す設定など）では 毎回 たずねる
// 画面は Phaser でなく ふつうの HTML（長い文を読みやすく・指でなぞって送れるように）
import { GAME_FONT } from './fonts.js?v=328';
import { TERMS, TERMS_TITLE, TERMS_VERSION, TERMS_CHECK, TERMS_BUTTON } from '../data/terms.js?v=328';

export const TERMS_KEY = 'fq-terms';

export function agreedVersion(store) {
  try {
    return JSON.parse(store.getItem(TERMS_KEY) ?? 'null')?.version ?? null;
  } catch (e) {
    return null;
  }
}

export function needTerms(store) {
  return agreedVersion(store) !== TERMS_VERSION;
}

export function saveAgreement(store, now = new Date()) {
  try {
    store.setItem(TERMS_KEY, JSON.stringify({ version: TERMS_VERSION, at: now.toISOString() }));
  } catch (e) {
    // 残せなくても 遊べる（次に開いたとき また たずねる）
  }
}

function el(tag, css, text) {
  const e = document.createElement(tag);
  if (css) e.style.cssText = css;
  if (text != null) e.textContent = text;
  return e;
}

// 同意が済むと解決する Promise を返す
export function askTerms() {
  let store = null;
  try {
    store = window.localStorage;
  } catch (e) {
    store = null;
  }
  if (store && !needTerms(store)) return Promise.resolve();
  return new Promise((done) => {
    const font = GAME_FONT;
    const wrap = el('div', `position:fixed;inset:0;z-index:9999;background:#0b0a1e;color:#f4f0e6;display:flex;flex-direction:column;align-items:center;font-family:${font};padding:max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));box-sizing:border-box;`);
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'fq-terms-title');
    const box = el('div', 'width:100%;max-width:520px;height:100%;display:flex;flex-direction:column;gap:12px;');
    const h = el('h1', 'margin:0;font-size:22px;color:#ffd98a;text-align:center;font-weight:normal;', TERMS_TITLE);
    h.id = 'fq-terms-title';
    const body = el('div', 'flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;background:#16142e;border:2px solid #b8913a;border-radius:6px;padding:14px;font-size:15px;line-height:1.7;');
    TERMS.forEach(([head, text], i) => {
      body.appendChild(el('h2', 'margin:0 0 4px;font-size:16px;color:#ffd98a;font-weight:normal;', `${i + 1}. ${head}`));
      body.appendChild(el('p', 'margin:0 0 14px;', text));
    });
    body.appendChild(el('p', 'margin:0;font-size:13px;color:#b8b0d0;', `（規約の版：${TERMS_VERSION}）`));
    const label = el('label', 'display:flex;align-items:center;gap:10px;font-size:16px;padding:6px 2px;cursor:pointer;');
    const check = el('input', 'width:26px;height:26px;flex:none;accent-color:#d9a441;');
    check.type = 'checkbox';
    label.append(check, el('span', '', TERMS_CHECK));
    const btn = el('button', `font-family:${font};font-size:18px;padding:14px;border-radius:8px;border:2px solid #b8913a;background:#3a2f5c;color:#7a7590;`, TERMS_BUTTON);
    btn.disabled = true;
    check.addEventListener('change', () => {
      btn.disabled = !check.checked;
      btn.style.background = check.checked ? '#c0392b' : '#3a2f5c';
      btn.style.color = check.checked ? '#fff' : '#7a7590';
    });
    btn.addEventListener('click', () => {
      if (!check.checked) return;
      if (store) saveAgreement(store);
      wrap.remove();
      done();
    });
    box.append(h, body, label, btn);
    wrap.appendChild(box);
    document.body.appendChild(wrap);
  });
}
