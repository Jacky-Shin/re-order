import { useEffect, useState } from 'react';
import { APP_VERSION, hasNewVersion, updateToNewVersion, getStoredVersion } from '../config/version';

/**
 * 版本检查组件
 * 自动检测新版本并自动更新
 */
export default function VersionChecker() {
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // 延迟检查，避免影响初始加载
    const timer = setTimeout(() => {
      checkAndUpdateVersion();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const checkAndUpdateVersion = async () => {
    if (hasNewVersion()) {
      const storedVersion = getStoredVersion();
      console.log(`🔄 检测到新版本: ${storedVersion || '未知'} -> ${APP_VERSION}`);
      console.log('🔄 开始自动更新...');
      
      setIsUpdating(true);
      
      try {
        // 自动执行更新
        await updateToNewVersion();
        console.log('✅ 更新完成，正在刷新页面...');
        
        // 短暂延迟后刷新页面，确保所有操作完成
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } catch (error) {
        console.error('❌ 自动更新失败:', error);
        setIsUpdating(false);
        // 如果自动更新失败，提示用户手动刷新
        alert('检测到新版本，但自动更新失败。请手动刷新页面以获取最新版本。');
      }
    } else {
      console.log(`✅ 当前版本已是最新: ${APP_VERSION}`);
    }
  };

  // 如果正在更新，显示简单的加载提示
  if (isUpdating) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <div>
            <p className="font-semibold">Actualizando a la versión {APP_VERSION}...</p>
            <p className="text-sm opacity-90">Por favor espere, esto solo tomará un momento</p>
          </div>
        </div>
      </div>
    );
  }

  // 不需要显示任何UI，静默更新
  return null;
}

