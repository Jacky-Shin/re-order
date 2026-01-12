import { useEffect, useState } from 'react';
import { APP_VERSION, hasNewVersion, updateToNewVersion, getStoredVersion } from '../config/version';

/**
 * 版本检查组件
 * 自动检测新版本并提示用户更新
 */
export default function VersionChecker() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // 延迟检查，避免影响初始加载
    const timer = setTimeout(() => {
      checkVersion();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const checkVersion = () => {
    if (hasNewVersion()) {
      const storedVersion = getStoredVersion();
      console.log(`🔄 检测到新版本: ${storedVersion || '未知'} -> ${APP_VERSION}`);
      setShowUpdatePrompt(true);
    } else {
      console.log(`✅ 当前版本已是最新: ${APP_VERSION}`);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateToNewVersion();
      // 延迟刷新，让用户看到成功消息
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('更新失败:', error);
      alert('更新失败，请手动刷新页面');
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    // 即使用户忽略，也保存当前版本，避免重复提示
    // 但会在下次访问时再次检查
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <p className="font-semibold">Nueva versión disponible</p>
            <p className="text-sm opacity-90">Versión {APP_VERSION}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="px-4 py-2 bg-white text-yellow-600 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUpdating ? 'Actualizando...' : 'Actualizar ahora'}
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

