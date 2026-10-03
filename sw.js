// 中継だけの service worker（Android の「アプリをインストール」用）。何も覚えない＝いつも最新の版を読む
// ページそのもの（navigate）は 端末が覚えた物を使わず 置き場に確かめる（10/4 アプリの自動更新）
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => e.respondWith(e.request.mode === 'navigate' ? fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(e.request)));
