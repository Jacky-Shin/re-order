// Service Worker - 最小化版本
// 不拦截任何请求，只提供基本的安装和激活功能

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // 立即激活
  self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    // 清理旧缓存
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).catch(() => {
      // 忽略错误
      return Promise.resolve();
    })
  );
  // 立即控制所有客户端
  return self.clients.claim();
});

// 不拦截任何 fetch 请求，让所有请求直接通过网络
// 这样可以避免 Service Worker 相关的错误
