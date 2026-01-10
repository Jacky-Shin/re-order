# 点餐系统二维码使用说明

## 📱 二维码文件位置

二维码图片已生成在：`qrcode-output/starbucks-menu-qrcode.png`

## 🚀 使用方法

### 方法一：使用生成的二维码图片（推荐）

1. 打开 `qrcode-output/starbucks-menu-qrcode.png` 文件
2. 用手机扫描二维码
3. 如果手机和电脑在同一网络，可以直接访问
4. 如果不在同一网络，需要重新生成二维码（见下方）

### 方法二：使用HTML页面生成（推荐）

1. 在浏览器中打开 `test-qrcode.html` 文件
2. **重要：** 输入框会自动填入IP地址（例如：`http://10.0.0.59:3000`）
3. 如果IP地址不对，请修改为你的实际IP地址
4. 点击"更新二维码"按钮
5. 点击"下载二维码"保存图片
6. 用手机扫描下载的二维码

### 方法三：使用命令行生成

```bash
# 生成默认地址的二维码（localhost:3000）
node generate-qrcode.js

# 生成指定地址的二维码
node generate-qrcode.js http://192.168.1.100:3000
```

## 📋 获取电脑IP地址

### Windows:
```bash
ipconfig
```
查找 "IPv4 地址"，例如：192.168.1.100

### Mac/Linux:
```bash
ifconfig
```
或
```bash
ip addr
```

## ⚠️ 重要提示

1. **确保点餐系统正在运行**
   - 前端：`cd client && npm run dev`（运行在 http://localhost:3000）
   - 后端：`cd server && npm run dev`（运行在 http://localhost:5000）

2. **手机和电脑需要在同一网络**
   - 如果手机和电脑不在同一WiFi，需要：
     - 将URL改为电脑的IP地址
     - 重新生成二维码
     - 确保防火墙允许3000端口访问

3. **测试步骤**
   - 启动前端和后端服务
   - 用手机扫描二维码
   - 应该能直接进入点餐页面

## 🎯 快速测试

1. 启动服务：
   ```bash
   # 终端1：启动后端
   cd server
   npm run dev
   
   # 终端2：启动前端
   cd client
   npm run dev
   ```

2. 获取电脑IP地址（例如：192.168.1.100）

3. 生成二维码：
   ```bash
   node generate-qrcode.js http://192.168.1.100:3000
   ```

4. 用手机扫描 `qrcode-output/starbucks-menu-qrcode.png`

5. 开始测试点餐功能！

## 📸 二维码说明

- 默认地址：`http://localhost:3000`（仅限本机访问）
- 网络地址：`http://[你的IP]:3000`（手机可访问）
- 二维码颜色：星巴克绿色 (#00704A)
- 文件格式：PNG，500x500像素
