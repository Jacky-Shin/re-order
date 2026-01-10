import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext'
import { setupStorageSync } from './utils/storageSync'
import { firebaseService } from './services/firebaseService'

// Setup storage sync for Web environment
if (typeof window !== 'undefined') {
  setupStorageSync();
  
  // 初始化Firebase（用于跨设备同步）
  firebaseService.initialize().catch(error => {
    console.error('Firebase初始化失败:', error);
  });
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
)
