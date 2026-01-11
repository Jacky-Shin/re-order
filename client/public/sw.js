// Service Worker for PWA
// 简化版本，只提供基本的缓存功能，避免复杂的网络请求处理

const CACHE_NAME = 'starbucks-pwa-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.warn('Service Worker: Cache failed (non-critical):', error);
        // 即使缓存失败也继续安装
        return Promise.resolve();
      })
  );
  // 立即激活新的 Service Worker
  self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 立即控制所有客户端
  return self.clients.claim();
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }
  
  // 跳过非 HTTP/HTTPS 请求
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // 对于 API 请求和 Firebase 请求，直接通过网络获取，不使用缓存
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('firebaseapp.com')) {
    // 直接通过网络获取，不缓存
    event.respondWith(
      fetch(event.request).catch((error) => {
        console.warn('Service Worker: Network request failed (non-critical):', error);
        // 如果网络请求失败，返回一个简单的错误响应
        return new Response(JSON.stringify({ error: 'Network request failed' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
  
  // 对于静态资源，尝试从缓存获取，失败则从网络获取
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果缓存中有，返回缓存
        if (response) {
          return response;
        }
        // 否则从网络获取
        return fetch(event.request).then((response) => {
          // 检查响应是否有效
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // 克隆响应（因为响应流只能使用一次）
          const responseToCache = response.clone();
          // 将响应添加到缓存
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            })
            .catch((error) => {
              console.warn('Service Worker: Cache put failed (non-critical):', error);
            });
          return response;
        }).catch((error) => {
          console.warn('Service Worker: Fetch failed (non-critical):', error);
          // 如果网络请求失败，返回一个简单的错误响应
          return new Response(JSON.stringify({ error: 'Network request failed' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
  );
});
