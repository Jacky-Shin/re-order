/**
 * 存储同步工具
 * 用于在Web环境中同步localStorage数据变化
 */

// 监听localStorage变化事件
export function setupStorageSync() {
  if (typeof window === 'undefined') return;

  // 监听storage事件（跨标签页同步）
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('db_')) {
      // 触发自定义事件，通知页面数据已更新
      window.dispatchEvent(new CustomEvent('database-update', { 
        detail: { key: e.key } 
      }));
    }
  });

  // 重写localStorage.setItem，在设置时触发事件
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key: string, value: string) {
    originalSetItem(key, value);
    // 如果是数据库相关的key，触发自定义事件
    if (key.startsWith('db_')) {
      window.dispatchEvent(new CustomEvent('database-update', { 
        detail: { key } 
      }));
    }
  };
}

// 监听数据库更新事件
export function onDatabaseUpdate(callback: (key: string) => void) {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail?.key) {
      callback(customEvent.detail.key);
    }
  };

  window.addEventListener('database-update', handler);
  
  return () => {
    window.removeEventListener('database-update', handler);
  };
}
