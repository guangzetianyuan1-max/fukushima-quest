// ひまなぶた の カウンター（art_src/site/make_hima_pages.mjs から 書き出した 物を 手で 写した・10/10）
// ⛔ページの 中に 書くと WordPress が && を &#038;&#038; に 変えて 動かなかった＝別の ファイルにして 読む
// 10/17 本人「ホームページの各ゲームにクリックカウンターを設けて」＝ゲームごとに数える（click＝福島昔話クエストRPG・click_sumo＝トントン紙相撲）
//   ゲームへの リンクを 押した 端末を、ゲームごとに 1回だけ 数える（同じ 端末の 2度目は 数えない）。数は data-hima-count="<kind>" の 札に 出す
(function () {
  var API = '/wp-json/hima/v1/';
  var GAMES = [
    { kind: 'click', url: 'https://guangzetianyuan1-max.github.io/fukushima-quest/', mark: 'hima-click-counted' }, // 10/10 からの 印を そのまま 使う
    { kind: 'click_sumo', url: 'https://guangzetianyuan1-max.github.io/sumo-game/', mark: 'hima-click-counted-sumo' },
  ];
  function uid() { var h = '0123456789abcdef', s = ''; for (var i = 0; i < 32; i++) s += h[Math.floor(Math.random() * 16)]; s = s.slice(0, 12) + '4' + s.slice(13, 16) + '89ab'[Math.floor(Math.random() * 4)] + s.slice(17); return s.slice(0, 8) + '-' + s.slice(8, 12) + '-' + s.slice(12, 16) + '-' + s.slice(16, 20) + '-' + s.slice(20); }
  function vid() { try { var v = localStorage.getItem('hima-vid'); if (!v) { v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : uid(); localStorage.setItem('hima-vid', v); } return v; } catch (e) { return null; } }
  var a = document.getElementById('hima-c-install'), b = document.getElementById('hima-c-click');
  var tags = document.querySelectorAll('[data-hima-count]');
  if ((a && b) || tags.length) fetch(API + 'counts', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (c) {
    if (a && b) { a.textContent = (c.install || 0).toLocaleString(); b.textContent = (c.click || 0).toLocaleString(); }
    for (var i = 0; i < tags.length; i++) tags[i].textContent = (c[tags[i].getAttribute('data-hima-count')] || 0).toLocaleString();
  }).catch(function () {});
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!el) return;
    var g = null;
    for (var i = 0; i < GAMES.length; i++) if (el.href.indexOf(GAMES[i].url) === 0) g = GAMES[i];
    if (!g) return;
    try {
      if (localStorage.getItem(g.mark)) return;
      var v = vid(); if (!v) return;
      var body = JSON.stringify({ kind: g.kind, id: v });
      if (navigator.sendBeacon) navigator.sendBeacon(API + 'hit', new Blob([body], { type: 'text/plain' }));
      else fetch(API + 'hit', { method: 'POST', body: body, keepalive: true });
      localStorage.setItem(g.mark, '1');
    } catch (err) {}
  }, true);
})();
