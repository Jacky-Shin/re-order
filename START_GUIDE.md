# 🚀 启动指南

## 同时启动前端和后端（推荐）

### 方法一：使用根目录的 npm 脚本（最简单）

在项目根目录运行：

```bash
npm run dev
```

这会同时启动：
- 后端服务器：`http://localhost:5000`
- 前端应用：`http://localhost:3000`

### 方法二：分别启动（两个终端窗口）

**终端1 - 启动后端：**
```bash
cd server
npm run dev
```

**终端2 - 启动前端：**
```bash
cd client
npm run dev
```

## 📋 启动前检查

### 1. 安装依赖

如果还没有安装依赖，请先安装：

```bash
# 安装根目录依赖（concurrently）
npm install

# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd client
npm install
```

### 2. 检查端口占用

如果遇到端口占用错误：

**Windows PowerShell:**
```powershell
# 检查5000端口
netstat -ano | findstr :5000 | findstr LISTENING

# 检查3000端口
netstat -ano | findstr :3000 | findstr LISTENING

# 终止进程（替换PID为实际进程ID）
taskkill /PID [进程ID] /F
```

**或者使用一行命令：**
```powershell
# 终止占用5000端口的进程
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# 终止占用3000端口的进程
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

## ✅ 启动成功标志

启动成功后，你应该看到：

**后端输出：**
```
服务器运行在 http://localhost:5000
网络访问: http://0.0.0.0:5000
```

**前端输出：**
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://0.0.0.0:3000/
```

## 🌐 访问地址

- **前端（用户端）**: http://localhost:3000
- **后端API**: http://localhost:5000
- **商家后台**: http://localhost:3000/admin

## 📱 手机测试

1. 确保手机和电脑在同一WiFi网络
2. 获取电脑IP地址：
   ```bash
   ipconfig  # Windows
   ```
3. 在手机浏览器访问：`http://[你的IP]:3000`
4. 或使用二维码：打开 `test-qrcode.html`，输入IP地址，生成二维码扫描

## 🛠️ 其他命令

```bash
# 只启动后端
npm run dev:server

# 只启动前端
npm run dev:client

# 构建前端（生产环境）
npm run build

# 启动生产服务器
npm start
```
