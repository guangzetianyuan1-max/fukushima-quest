// 中継だけの service worker（Android の「アプリをインストール」用）。何も覚えない＝いつも最新の版を読む
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => e.respondWith(fetch(e.request)));
