// 生成点餐系统二维码图片
// 使用方法: node generate-qrcode.js

import QRCode from 'qrcode';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 默认点餐系统地址（可以根据实际情况修改）
const DEFAULT_URL = 'http://localhost:3000/menu';
let URL = process.argv[2] || DEFAULT_URL;

// 确保URL指向客户点餐页面（/menu），而不是商家后台
if (URL) {
  // 如果URL指向商家后台，替换为客户点餐页面
  if (URL.includes('/admin') || URL.includes('/merchant')) {
    URL = URL.replace(/\/admin.*$/, '/menu').replace(/\/merchant.*$/, '/menu');
  } else {
    // 检查URL是否只有域名和端口（不包含路径）
    // 使用正则表达式匹配：http://domain:port 或 https://domain:port
    const urlPattern = /^https?:\/\/[^\/]+$/;
    if (urlPattern.test(URL)) {
      // 如果URL只有域名和端口，添加 /menu 路径
      URL = URL + '/menu';
    } else if (!URL.includes('/menu') && !URL.includes('/admin') && !URL.includes('/merchant')) {
      // 如果URL包含其他路径但不是/menu，也替换为/menu
      URL = URL.replace(/\/[^\/]*$/, '/menu');
    }
  }
}

// 输出目录
const outputDir = join(__dirname, 'qrcode-output');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// 生成二维码
async function generateQRCode() {
  try {
    console.log('正在生成二维码...');
    console.log('点餐系统地址:', URL);
    
    // 生成PNG格式的二维码
    const pngPath = join(outputDir, 'starbucks-menu-qrcode.png');
    await QRCode.toFile(pngPath, URL, {
      width: 500,
      margin: 2,
      color: {
        dark: '#00704A',  // 星巴克绿色
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });
    
    console.log('✅ 二维码生成成功！');
    console.log('📁 文件位置:', pngPath);
    console.log('');
    console.log('📱 使用说明:');
    console.log('1. 用手机扫描二维码即可进入客户点餐页面（/menu）');
    console.log('2. 如果手机和电脑不在同一网络，请将URL改为电脑的IP地址');
    console.log('3. 例如: node generate-qrcode.js http://192.168.1.100:3000');
    console.log('4. 二维码会自动指向客户点餐页面，不会指向商家后台');
    console.log('');
    console.log('💡 提示: 确保点餐系统正在运行在', URL);
    
  } catch (error) {
    console.error('❌ 生成二维码失败:', error.message);
    console.log('');
    console.log('请先安装qrcode包:');
    console.log('  cd server');
    console.log('  npm install qrcode');
  }
}

generateQRCode();
