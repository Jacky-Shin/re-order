# iPad应用安装指南

## 📦 已完成的准备工作

✅ 项目已构建完成
✅ iOS项目已创建
✅ Capacitor已配置
✅ 所有代码已就绪

## 🎯 现在需要做的（在Mac上）

### 步骤1：打开Xcode项目
```bash
cd client
npx cap open ios
```

### 步骤2：配置应用信息
在Xcode中：
1. 选择左侧的 "App" 项目
2. 选择 "App" target
3. 在 "General" 标签页：
   - Display Name: `Starbucks Admin`
   - Bundle Identifier: `com.starbucks.admin`
   - Version: `1.0.0`

### 步骤3：配置签名
1. 打开 "Signing & Capabilities" 标签
2. 勾选 "Automatically manage signing"
3. 选择您的开发团队（如果没有，点击 "+" 添加Apple ID）

### 步骤4：选择目标设备
- 在顶部工具栏选择 "Any iPad"

### 步骤5：构建Archive
1. 菜单：`Product` → `Archive`
2. 等待构建完成

### 步骤6：导出.ipa文件
1. 在Organizer中选择Archive
2. 点击 "Distribute App"
3. 选择 "Ad Hoc" 或 "Development"
4. 选择证书
5. 点击 "Export"
6. 保存.ipa文件

## 📱 安装到iPad

### 推荐方法：使用3uTools

1. **下载3uTools**
   - Windows/Mac: https://www.3u.com/

2. **连接iPad**
   - USB连接iPad到电脑
   - 在iPad上点击"信任此电脑"

3. **安装应用**
   - 打开3uTools
   - 应用 → 安装
   - 选择.ipa文件
   - 等待安装完成

4. **信任开发者**（首次安装后）
   - iPad: 设置 → 通用 → VPN与设备管理
   - 点击"信任 [开发者名称]"

## ⚠️ 重要提示

1. **需要Mac电脑**：Xcode只能在Mac上运行
2. **需要开发者账号**：免费或付费都可以
3. **数据隔离**：每个iPad有独立数据库
4. **离线运行**：不需要网络连接

## 🔧 如果没有Mac

可以：
1. 使用云Mac服务（MacStadium等）
2. 找有Mac的朋友帮忙打包
3. 我可以提供详细的打包步骤文档

---

**当前状态**：代码已准备就绪，等待在Mac上打包！
