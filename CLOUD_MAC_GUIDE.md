# 云Mac服务使用指南

## 🎯 推荐方案：使用云Mac服务

由于iOS应用打包必须在Mac上完成，我推荐使用云Mac服务。

## 🌐 推荐的云Mac服务

### 1. MacinCloud（最便宜）⭐ 推荐

**价格**：$20-30/月
**网址**：https://www.macincloud.com/

**优点**：
- 价格便宜
- 提供多种套餐
- 支持远程桌面
- 适合偶尔使用

**使用步骤**：
1. 注册账号并选择套餐
2. 通过远程桌面连接到Mac
3. 上传项目文件
4. 运行打包脚本
5. 下载.ipa文件

### 2. AWS Mac Instances（按需付费）

**价格**：约$1-2/小时
**网址**：https://aws.amazon.com/ec2/instance-types/mac/

**优点**：
- 按小时计费，灵活
- 不需要长期订阅
- 性能好

**使用步骤**：
1. 注册AWS账号
2. 启动Mac实例
3. 通过SSH或远程桌面连接
4. 运行打包脚本
5. 下载.ipa文件后关闭实例

### 3. MacStadium（专业）

**价格**：$99/月起
**网址**：https://www.macstadium.com/

**优点**：
- 专业、稳定
- 适合企业使用
- 技术支持好

## 📋 在云Mac上打包的完整步骤

### 第一步：连接到云Mac

1. 使用远程桌面工具（如Microsoft Remote Desktop、VNC Viewer）
2. 连接到分配的Mac实例

### 第二步：准备环境

```bash
# 1. 安装Node.js（如果还没有）
# 通常云Mac已经预装，检查版本：
node --version

# 2. 安装Xcode（如果还没有）
# 从Mac App Store下载Xcode（可能需要一些时间）

# 3. 安装Xcode命令行工具
xcode-select --install
```

### 第三步：上传项目

**方法1：使用Git**
```bash
# 如果项目在Git仓库中
git clone <your-repo-url>
cd re_order
```

**方法2：使用文件传输**
- 将整个项目文件夹压缩
- 通过远程桌面或文件共享上传到Mac
- 解压文件

### 第四步：运行自动打包脚本

```bash
cd client
chmod +x auto-build-ios.sh
./auto-build-ios.sh
```

脚本会自动：
1. 安装依赖
2. 构建前端
3. 同步到iOS
4. 打开Xcode

### 第五步：在Xcode中完成打包

按照脚本提示在Xcode中操作：
1. 配置签名
2. Product → Archive
3. Distribute App → 导出.ipa

### 第六步：下载.ipa文件

- 通过远程桌面下载文件
- 或使用云存储服务（如Dropbox、Google Drive）

## 💰 成本估算

### 一次性打包（推荐AWS）
- AWS Mac实例：约$2-5（使用2-3小时）
- 总计：约$2-5

### 每月打包几次（推荐MacinCloud）
- MacinCloud基础套餐：$20-30/月
- 可以随时使用

## 🎯 最快方案

**如果您只需要打包一次**：
1. 注册AWS账号
2. 启动Mac实例（约10分钟）
3. 运行打包脚本（约30分钟）
4. 下载.ipa文件
5. 关闭实例
6. **总成本：约$2-5，总时间：约1小时**

## 📝 我为您准备的自动化脚本

我已经创建了 `client/auto-build-ios.sh` 脚本，它会自动完成：
- ✅ 检查环境
- ✅ 安装依赖
- ✅ 构建前端
- ✅ 同步到iOS
- ✅ 打开Xcode

您只需要在Xcode中完成最后的打包步骤即可。

---

**建议**：如果您只需要打包一次，使用AWS Mac Instances最经济。如果需要频繁打包，考虑MacinCloud。
