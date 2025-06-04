// 智能问答笔记系统 Service Worker
// 简单版本，主要用于避免404错误

const CACHE_NAME = 'qa-note-system-v2';
const urlsToCache = [
  '/',
  '/qa-system/qa-note.html',
  '/qa-system/qa-note.css',
  '/shared/api.js',
  '/shared/notebook.js',
  '/shared/utils.js',
  '/qa-system/qa-note.js',
  '/qa-system/local-note-saver.js',
  '/qa-system/qa-note-saver.js'
];

// 需要跳过的路径（避免返回HTML错误页面）
const skipPaths = [
  '/ui-block/',
  '/auth-block/',
  'client.js',
  'main.js',
  'qua-entry-point'
];

// 安装Service Worker
self.addEventListener('install', function(event) {
  console.log('Service Worker 安装中...');
  // 跳过等待，立即激活新版本
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('缓存文件失败:', error);
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', function(event) {
  const requestUrl = new URL(event.request.url);
  
  // 检查是否是需要跳过的路径
  const shouldSkip = skipPaths.some(path => 
    requestUrl.pathname.includes(path)
  );
  
  if (shouldSkip) {
    // 对于不存在的模块文件，返回空的JavaScript响应
    console.log('跳过不存在的模块:', requestUrl.pathname);
    event.respondWith(
      new Response('// 模块不存在，已跳过', {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-cache'
        }
      })
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // 如果在缓存中找到了，返回缓存的版本
        if (response) {
          return response;
        }
        
        // 否则发起网络请求
        return fetch(event.request)
          .catch(function(error) {
            console.log('网络请求失败:', event.request.url, error);
            
            // 如果是JavaScript文件请求失败，返回空响应而不是HTML错误页面
            if (event.request.url.endsWith('.js')) {
              return new Response('// 文件加载失败', {
                status: 200,
                statusText: 'OK',
                headers: {
                  'Content-Type': 'application/javascript',
                  'Cache-Control': 'no-cache'
                }
              });
            }
            
            throw error;
          });
      })
  );
});

// 激活Service Worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker 已激活');
  // 立即控制所有客户端
  self.clients.claim();
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 消息监听器
self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
}); 