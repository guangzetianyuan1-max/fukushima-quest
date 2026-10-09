// 起動のローディングバー（本人 10/4「はじめの画面にローディングバーを表示し、毎回データ更新をするのは？」）
// 題の画面の前に HTML で出す：最新の版を確かめる → 字 → よく使う絵（何%）。終わったら消してゲームを始める
// 全部を毎回読み直すと約35MB＝通信量と待ち時間が大きい ⇒ 毎回するのは「新しい版が出ていないか」の確かめ（小さな version.json）だけ。出ていれば読み直す

import { GAME_FONT } from './fonts.js?v=300';
export function showLoading() {
  const font = GAME_FONT;
  const wrap = document.createElement('div');
  wrap.style.cssText = `position:fixed;inset:0;z-index:9990;background:#0b0a1e;color:#f4f0e6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;font-family:${font};padding:16px;box-sizing:border-box;`;
  const title = document.createElement('div');
  title.textContent = '福島昔話クエストRPG';
  title.style.cssText = 'font-size:24px;color:#ffd98a;letter-spacing:2px;';
  const track = document.createElement('div');
  track.style.cssText = 'width:min(280px,80vw);height:14px;border:2px solid #b8913a;border-radius:8px;background:#16142e;overflow:hidden;';
  const fill = document.createElement('div');
  fill.style.cssText = 'height:100%;width:0%;background:linear-gradient(90deg,#c0392b,#ffd27a);transition:width .2s;';
  track.appendChild(fill);
  const label = document.createElement('div');
  label.style.cssText = 'font-size:14px;color:#cfc6e6;min-height:1.5em;text-align:center;';
  wrap.append(title, track, label);
  document.body.appendChild(wrap);
  return {
    set(frac, text) {
      fill.style.width = `${Math.round(Math.max(0, Math.min(1, frac)) * 100)}%`;
      if (text != null) label.textContent = text;
    },
    done() {
      fill.style.width = '100%';
      wrap.style.transition = 'opacity .3s';
      wrap.style.opacity = '0';
      setTimeout(() => wrap.remove(), 320);
    },
  };
}

// 絵を先に読んで ブラウザに覚えさせる（Phaser が同じ住所を読むときに速い）。1枚読めるごとに onStep(読めた数, 全部)
// 読めない絵があっても止めない（その場面で読み直す）。全部で 15 秒を越えたら見切る
export function preloadImages(urls, onStep, limitMs = 15000) {
  let n = 0;
  const one = (u) => new Promise((res) => {
    const im = new Image();
    im.onload = im.onerror = () => { n += 1; onStep(n, urls.length); res(); };
    im.src = u;
  });
  return Promise.race([Promise.all(urls.map(one)), new Promise((r) => setTimeout(r, limitMs))]);
}
