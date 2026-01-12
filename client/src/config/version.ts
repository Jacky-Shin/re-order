/**
 * 应用版本管理
 * 每次发布新版本时，更新此版本号
 * 版本号格式：主版本号.次版本号.修订号 (例如: 1.0.0)
 */
export const APP_VERSION = '1.0.2';

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
 * 注意：此函数只清除缓存，不会删除业务数据（商品、订单等）
 */
export async function clearAllCache(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 清除localStorage（保留业务数据和必要配置）
    const keysToKeep = [
      // 业务数据 - 必须保留
      'db_menu_items',           // 商品数据
      'db_orders',                // 订单数据
      'db_categories',            // 分类数据
      'db_payments',              // 支付记录
      'db_merchant_accounts',     // 商家账户
      'db_last_pickup_date',      // 最后取单日期
      'db_last_order_number',     // 最后订单号
      'db_last_pickup_number',    // 最后取单号
      'db_shop_settings',         // 店铺设置
      // 用户配置 - 保留
      'userLanguage',             // 用户语言设置
      'adminLanguage',            // 管理员语言设置
      'adminUsername',            // 管理员登录状态
      // 系统配置 - 保留
      'eruda',                    // 调试工具
      'firebaseConfig',           // Firebase配置
      VERSION_STORAGE_KEY,        // 版本号（会在更新后重新设置）
    ];
    
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    // 清除sessionStorage（通常只存储临时会话数据，不影响业务数据）
    sessionStorage.clear();

    // 注意：不清除IndexedDB，因为可能存储业务数据
    // 如果将来使用IndexedDB存储业务数据，需要在这里添加保护逻辑
    // 目前应用主要使用localStorage和Firebase，IndexedDB可能被其他库使用

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

    console.log('✅ 缓存已清除（业务数据已保留）');
    console.log('📦 保留的业务数据：商品、订单、分类、支付记录、商家账户等');
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

