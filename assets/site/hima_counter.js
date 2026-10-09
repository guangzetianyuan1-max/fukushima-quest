// ひまなぶた の カウンター（art_src/site/make_hima_pages.mjs から 書き出した 物を 手で 写した・10/10）
// ⛔ページの 中に 書くと WordPress が && を &#038;&#038; に 変えて 動かなかった＝別の ファイルにして 読む
(function () {
  var API = '/wp-json/hima/v1/', PLAY = 'https://guangzetianyuan1-max.github.io/fukushima-quest/';
  function uid() { var h = '0123456789abcdef', s = ''; for (var i = 0; i < 32; i++) s += h[Math.floor(Math.random() * 16)]; s = s.slice(0, 12) + '4' + s.slice(13, 16) + '89ab'[Math.floor(Math.random() * 4)] + s.slice(17); return s.slice(0, 8) + '-' + s.slice(8, 12) + '-' + s.slice(12, 16) + '-' + s.slice(16, 20) + '-' + s.slice(20); }
  function vid() { try { var v = localStorage.getItem('hima-vid'); if (!v) { v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : uid(); localStorage.setItem('hima-vid', v); } return v; } catch (e) { return null; } }
  var a = document.getElementById('hima-c-install'), b = document.getElementById('hima-c-click');
  if (a && b) fetch(API + 'counts', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (c) { a.textContent = (c.install || 0).toLocaleString(); b.textContent = (c.click || 0).toLocaleString(); }).catch(function () {});
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!el || el.href.indexOf(PLAY) !== 0) return;
    try {
      if (localStorage.getItem('hima-click-counted')) return;
      var v = vid(); if (!v) return;
      var body = JSON.stringify({ kind: 'click', id: v });
      if (navigator.sendBeacon) navigator.sendBeacon(API + 'hit', new Blob([body], { type: 'text/plain' }));
      else fetch(API + 'hit', { method: 'POST', body: body, keepalive: true });
      localStorage.setItem('hima-click-counted', '1');
    } catch (err) {}
  }, true);
})();
