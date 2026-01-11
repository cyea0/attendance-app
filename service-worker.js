const CACHE_NAME = 'attendance-app-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// fetch 이벤트 (네트워크 요청 가로채기)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 있으면 캐시에서 반환
        if (response) {
          return response;
        }
        // 없으면 네트워크에서 가져오기
        return fetch(event.request).then((response) => {
          // 유효하지 않은 응답은 캐시하지 않음
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // 응답을 복제해서 캐시에 저장
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
      .catch(() => {
        // 네트워크 에러 시 오프라인 페이지 반환 (선택사항)
        return new Response('오프라인 모드입니다.', {
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

