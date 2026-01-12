import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 监听所有网络接口，允许手机访问
    port: 3000,
    strictPort: false, // 如果3000端口被占用，自动尝试其他端口
    open: false, // 不自动打开浏览器
    cors: true, // 启用CORS
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false, // 允许不安全的连接（开发环境）
        ws: true // 支持WebSocket
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // 添加版本号到文件名，强制浏览器重新加载
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // 为JS和CSS文件添加hash，确保版本更新时浏览器重新加载
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  publicDir: 'public'
})
