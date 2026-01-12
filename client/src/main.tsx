import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { setupStorageSync } from './utils/storageSync';
import { firebaseService } from './services/firebaseService';
import { checkFirebaseStatus } from './utils/firebaseDebug';
import { APP_VERSION, saveVersion, hasNewVersion } from './config/version';

// 初始化移动端控制台工具（Eruda）
// 可以通过URL参数 ?debug=true 或 localStorage.setItem('eruda', 'true') 启用
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  const enableEruda = 
    urlParams.get('debug') === 'true' || 
    localStorage.getItem('eruda') === 'true' ||
    import.meta.env.DEV; // 开发环境自动启用
  
  if (enableEruda) {
    import('eruda').then((eruda) => {
      eruda.default.init();
      console.log('📱 Eruda控制台已启用 - 可以在移动设备上查看日志');
      console.log('💡 提示：可以通过 ?debug=true 或 localStorage.setItem("eruda", "true") 启用');
    }).catch((error) => {
      console.warn('Eruda加载失败:', error);
    });
  }
}

// Setup storage sync for Web environment
if (typeof window !== 'undefined') {
  // 版本检查和初始化
  console.log(`🚀 应用启动 - 版本 ${APP_VERSION}`);
  
  // 如果是新版本，保存版本号（但不清除缓存，让VersionChecker处理）
  if (!hasNewVersion()) {
    saveVersion(APP_VERSION);
  }
  
  setupStorageSync();
  
  // 初始化Firebase（用于跨设备同步）
  firebaseService.initialize()
    .then(() => {
      console.log('Firebase初始化完成，状态:', firebaseService.isAvailable() ? '可用' : '不可用');
      // 如果Firebase可用，执行状态检查
      if (firebaseService.isAvailable()) {
        checkFirebaseStatus().catch(console.error);
      }
    })
    .catch(error => {
      console.error('Firebase初始化失败:', error);
    });
}


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);
