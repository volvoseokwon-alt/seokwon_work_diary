// 석원이의 업무 다이어리 — Service Worker
// 앱 셀(HTML/아이콘)을 캐시해서 오프라인에서도 화면이 뜨도록 함.
// 단, Firebase 데이터 통신은 네트워크가 있어야 동작함.

const CACHE_NAME = 'workdiary-cache-v1';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Firebase / 외부 API 요청은 캐시하지 않고 항상 네트워크로 (실시간 데이터 보장)
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 앱 셀(HTML, 아이콘 등)은 캐시 우선, 실패 시 네트워크
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => caches.match('./index.html'))
      );
    })
  );
});
