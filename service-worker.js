// Wonder Diary 서비스워커
// ─────────────────────────────────────────────────────────
// 배포할 때마다 아래 CACHE_VERSION 숫자만 1씩 올려서 다시 올리면,
// 사용자가 다음에 앱을 열 때 자동으로 새 버전을 받아오고 화면이 새로고침됩니다.
// (index.html 쪽에서 새 서비스워커가 설치되면 자동으로 활성화 요청을 보내도록 되어 있음)
const CACHE_VERSION = 'wonder-diary-v2';
const CACHE_FILES = [
  './',
  './index.html',
];

// 설치: 새 캐시를 미리 채워둠 (기존 캐시는 그대로 두고, activate에서 정리)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CACHE_FILES)).catch(() => {})
  );
});

// 활성화: 이전 버전의 캐시를 모두 삭제 (옛 버전이 영구히 남아있는 문제 방지)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// index.html에서 "새 버전 설치 완료" 시점에 보내는 메시지를 받아서 즉시 활성화
// (대기(waiting) 상태로 머물지 않고 바로 적용되게 함 → 새로고침 한 번으로 최신 버전이 보임)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 요청 가로채기: 네트워크 우선(network-first) 전략.
// 항상 최신 파일을 먼저 시도하고, 오프라인일 때만 캐시를 사용한다.
// (캐시 우선으로 하면 배포해도 옛 파일이 계속 보이는 문제가 생기므로 이 전략을 사용)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
