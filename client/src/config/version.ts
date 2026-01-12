/**
 * 应用版本管理
 * 每次发布新版本时，更新此版本号
 * 版本号格式：主版本号.次版本号.修订号 (例如: 1.0.0)
 */
export const APP_VERSION = '1.0.1';

/**
 * 版本存储键名
 */
export const VERSION_STORAGE_KEY = 'app_version';

/**
 * 获取当前存储的版本号
 */
export function getStoredVersion(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(VERSION_STORAGE_KEY);
}

/**
 * 保存当前版本号
 */
export function saveVersion(version: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VERSION_STORAGE_KEY, version);
}

/**
 * 检查是否有新版本
 */
export function hasNewVersion(): boolean {
  const storedVersion = getStoredVersion();
  if (!storedVersion) return true; // 首次访问，视为新版本
  return storedVersion !== APP_VERSION;
}

/**
 * 清除所有缓存数据
 */
export async function clearAllCache(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 清除localStorage（保留必要的配置）
    const keysToKeep = ['eruda', 'firebaseConfig']; // 保留调试和配置
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    // 清除sessionStorage
    sessionStorage.clear();

    // 清除IndexedDB（如果使用）
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases();
      await Promise.all(
        databases
          .filter(db => db.name) // 过滤掉没有名称的数据库
          .map(db => {
            return new Promise<void>((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(db.name!);
              deleteReq.onsuccess = () => resolve();
              deleteReq.onerror = () => reject(deleteReq.error);
              deleteReq.onblocked = () => {
                console.warn(`数据库 ${db.name} 删除被阻止`);
                resolve();
              };
            });
          })
      );
    }

    // 清除Service Worker缓存（如果存在）
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
    }

    // 清除Cache API缓存
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }

    console.log('✅ 所有缓存已清除');
  } catch (error) {
    console.error('❌ 清除缓存时出错:', error);
    throw error;
  }
}

/**
 * 更新到新版本
 */
export async function updateToNewVersion(): Promise<void> {
  try {
    await clearAllCache();
    saveVersion(APP_VERSION);
    console.log(`✅ 已更新到版本 ${APP_VERSION}`);
  } catch (error) {
    console.error('❌ 更新版本时出错:', error);
    throw error;
  }
}

