// Service Worker for PWA - 简化版本
// 只提供基本的离线支持，不拦截网络请求

const CACHE_NAME = 'starbucks-pwa-v1';

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // 立即激活，不等待
  self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
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
    }).catch((error) => {
      console.warn('Service Worker: Cache cleanup failed (non-critical):', error);
      return Promise.resolve();
    })
  );
  // 立即控制所有客户端
  return self.clients.claim();
});

// 拦截网络请求 - 只处理静态资源，不处理 API 或 Firebase
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 跳过所有 API 请求
  if (url.pathname.startsWith('/api/')) {
    return; // 不拦截，直接通过网络
  }
  
  // 跳过所有 Firebase 和 Google API 请求
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('google.com')) {
    return; // 不拦截，直接通过网络
  }
  
  // 跳过所有外部请求
  if (url.origin !== self.location.origin) {
    return; // 不拦截，直接通过网络
  }
  
  // 只处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }
  
  // 只处理 HTML、CSS、JS、图片等静态资源
  const isStaticResource = 
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname === '/' ||
    url.pathname === '/index.html';
  
  if (!isStaticResource) {
    return; // 不拦截，直接通过网络
  }
  
  // 对于静态资源，尝试从缓存获取
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        // 从网络获取
        return fetch(event.request).catch((error) => {
          console.warn('Service Worker: Fetch failed (non-critical):', error);
          // 返回一个简单的错误响应，而不是抛出错误
          return new Response('Network error', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
      .catch((error) => {
        console.warn('Service Worker: Cache match failed (non-critical):', error);
        // 如果缓存匹配失败，尝试从网络获取
        return fetch(event.request).catch((fetchError) => {
          console.warn('Service Worker: Network fetch also failed (non-critical):', fetchError);
          return new Response('Network error', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// 错误处理
self.addEventListener('error', (event) => {
  console.warn('Service Worker: Error (non-critical):', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.warn('Service Worker: Unhandled rejection (non-critical):', event.reason);
  event.preventDefault(); // 阻止错误传播
});
