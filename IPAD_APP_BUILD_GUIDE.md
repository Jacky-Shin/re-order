# iPad应用打包和安装指南

本指南将帮助您将商家后台系统打包成.ipa文件，并安装到iPad上。

## 📦 打包步骤

### 方法一：使用Xcode Archive（推荐，用于分发）

#### 步骤1：打开Xcode项目
```bash
cd client
npx cap open ios
```

#### 步骤2：在Xcode中配置
1. **选择项目**：在左侧导航栏选择 "App" 项目
2. **选择Target**：选择 "App" target
3. **General设置**：
   - Display Name: `Starbucks Admin`（应用显示名称）
   - Bundle Identifier: `com.starbucks.admin`（应用ID）
   - Version: `1.0.0`
   - Build: `1`

#### 步骤3：配置签名
1. 在 "Signing & Capabilities" 标签页
2. 选择您的开发团队（需要Apple开发者账号）
3. 如果还没有账号，可以：
   - 注册免费Apple ID（只能安装到自己的设备，7天有效期）
   - 或购买Apple开发者账号（$99/年，可以分发到多台设备）

#### 步骤4：选择目标设备
- 在顶部工具栏选择 "Any iPad" 或特定iPad型号
- 确保选择的是iPad设备，不是iPhone

#### 步骤5：构建Archive
1. 菜单：`Product` → `Archive`
2. 等待构建完成（可能需要几分钟）
3. 构建完成后，Organizer窗口会自动打开

#### 步骤6：导出.ipa文件
1. 在Organizer中选择刚创建的Archive
2. 点击 "Distribute App"
3. 选择分发方式：
   - **Development**：用于开发测试（需要设备UDID）
   - **Ad Hoc**：用于内部测试（最多100台设备）
   - **App Store Connect**：用于App Store发布
   - **Enterprise**：用于企业内部分发（需要企业账号）

4. 选择 "Ad Hoc" 或 "Development"
5. 选择证书和配置文件
6. 点击 "Export"
7. 选择保存位置
8. 等待导出完成

### 方法二：直接构建到设备（开发测试用）

#### 步骤1：连接iPad
1. 使用USB线连接iPad到Mac
2. 在iPad上信任此电脑
3. 在Xcode中选择连接的iPad设备

#### 步骤2：运行应用
1. 点击Xcode顶部的运行按钮（▶️）
2. 应用会自动安装到iPad上
3. 首次安装需要在iPad上：`设置` → `通用` → `VPN与设备管理` → 信任开发者

## 📱 安装.ipa文件到iPad

### 方法A：使用iTunes/Finder（macOS）
1. 连接iPad到Mac
2. 打开Finder（macOS Catalina+）或iTunes（旧版本）
3. 选择您的iPad
4. 在 "文件" 标签页，拖拽.ipa文件到应用列表
5. 同步后应用会安装到iPad

### 方法B：使用第三方工具（推荐）
1. **3uTools**（Windows/Mac）：
   - 下载并安装3uTools
   - 连接iPad
   - 选择 "应用" → "安装" → 选择.ipa文件

2. **爱思助手**（Windows/Mac）：
   - 下载并安装爱思助手
   - 连接iPad
   - 选择 "应用" → "导入" → 选择.ipa文件

3. **AltStore**（无需电脑）：
   - 在iPad上安装AltStore
   - 通过AltStore安装.ipa文件

### 方法C：使用Apple Configurator 2（Mac）
1. 在Mac App Store下载Apple Configurator 2
2. 连接iPad
3. 选择设备 → 添加 → 应用 → 选择.ipa文件

## ⚠️ 重要注意事项

### 1. 开发者账号要求
- **免费Apple ID**：
  - 只能安装到自己的设备
  - 应用7天后会过期，需要重新安装
  - 最多3台设备

- **付费开发者账号**（$99/年）：
  - 可以安装到多台设备
  - 应用不会过期
  - 可以分发到100台设备（Ad Hoc）

### 2. 设备信任
首次安装后，需要在iPad上：
1. 打开 `设置` → `通用` → `VPN与设备管理`
2. 找到开发者应用
3. 点击 "信任 [开发者名称]"

### 3. 数据隔离
- 每个iPad安装的应用都有独立的SQLite数据库
- 数据完全隔离，不会互相影响
- 卸载应用会删除所有数据

## 🔧 快速打包脚本

我为您创建了一个自动化脚本，可以简化打包过程。
