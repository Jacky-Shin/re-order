# iPad应用快速打包指南

## 🎯 目标
将商家后台系统打包成.ipa文件，可以直接安装到iPad上。

## ⚡ 快速开始（3步）

### 步骤1：构建项目
```bash
cd client
npm run build
npx cap sync ios
```

### 步骤2：在Mac上打开Xcode
```bash
npx cap open ios
```

### 步骤3：在Xcode中打包
1. 选择开发团队（Signing & Capabilities）
2. 选择目标设备：iPad
3. `Product` → `Archive`
4. `Distribute App` → 选择 `Ad Hoc` 或 `Development`
5. 导出.ipa文件

## 📱 安装到iPad

### 方法1：使用3uTools（最简单，Windows/Mac都支持）
1. 下载3uTools：https://www.3u.com/
2. 连接iPad到电脑
3. 打开3uTools → 应用 → 安装
4. 选择导出的.ipa文件
5. 等待安装完成

### 方法2：使用iTunes/Finder（仅Mac）
1. 连接iPad到Mac
2. 打开Finder（或iTunes）
3. 选择iPad → 文件标签
4. 拖拽.ipa文件到应用列表
5. 同步

### 方法3：直接运行（开发测试）
1. 在Xcode中选择连接的iPad
2. 点击运行按钮（▶️）
3. 应用会自动安装

## ⚠️ 重要提示

### 开发者账号
- **免费Apple ID**：只能安装到自己的设备，7天有效期
- **付费账号**（$99/年）：可以安装到多台设备，无有效期限制

### 首次安装后
在iPad上：`设置` → `通用` → `VPN与设备管理` → 信任开发者

### 数据说明
- 每个iPad有独立的数据库
- 数据完全隔离
- 卸载应用会删除数据

## 🔧 如果遇到问题

### 问题1：没有Mac电脑
**解决方案**：
- 使用云Mac服务（MacStadium、AWS Mac等）
- 或使用Hackintosh（不推荐，可能违反Apple许可）

### 问题2：没有开发者账号
**解决方案**：
- 使用免费Apple ID（限制较多）
- 或购买开发者账号（$99/年）

### 问题3：构建失败
**解决方案**：
- 检查Xcode版本（需要Xcode 14+）
- 检查CocoaPods依赖：`cd ios/App && pod install`
- 清理构建：`Product` → `Clean Build Folder`

## 📦 当前项目状态

✅ 前端已构建完成
✅ iOS项目已创建
✅ Capacitor已配置
✅ SQLite数据库服务已实现
✅ 本地API服务已实现

**下一步**：在Mac上打开Xcode进行打包
