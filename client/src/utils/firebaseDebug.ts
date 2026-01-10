/**
 * Firebase调试工具
 * 用于检查Firebase配置和连接状态
 */

import { firebaseService } from '../services/firebaseService';

export async function checkFirebaseStatus() {
  console.log('=== Firebase状态检查 ===');
  
  // 检查环境变量
  const envVars = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  
  console.log('环境变量检查:');
  Object.entries(envVars).forEach(([key, value]) => {
    if (value && value !== `your-${key.replace('VITE_FIREBASE_', '').toLowerCase()}`) {
      console.log(`  ✅ ${key}: 已设置 (${value.substring(0, 10)}...)`);
    } else {
      console.log(`  ❌ ${key}: 未设置或使用默认值`);
    }
  });
  
  // 初始化Firebase
  try {
    await firebaseService.initialize();
    console.log('Firebase初始化:', firebaseService.isAvailable() ? '✅ 成功' : '❌ 失败');
    
    if (firebaseService.isAvailable()) {
      // 测试读取
      const items = await firebaseService.getMenuItems();
      console.log(`Firebase数据测试: 读取到 ${items.length} 个商品`);
    }
  } catch (error) {
    console.error('Firebase初始化错误:', error);
  }
  
  console.log('=== 检查完成 ===');
}

// 在浏览器控制台中使用：window.checkFirebase()
if (typeof window !== 'undefined') {
  (window as any).checkFirebase = checkFirebaseStatus;
}
