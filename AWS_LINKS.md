# AWS相关链接汇总

## 🌐 主要网站

### AWS官方网站
**https://aws.amazon.com/**

### AWS中国（中文）
**https://aws.amazon.com/cn/**

### 免费套餐注册
**https://aws.amazon.com/cn/free/**

### AWS控制台（登录后使用）
**https://console.aws.amazon.com/**

## 📱 Mac实例相关

### Mac实例文档
**https://aws.amazon.com/ec2/instance-types/mac/**

### EC2控制台（启动Mac实例）
**https://console.aws.amazon.com/ec2/**

### EC2 Mac实例定价
**https://aws.amazon.com/ec2/pricing/on-demand/**

## 🚀 快速访问

### 直接启动Mac实例
1. 登录：https://console.aws.amazon.com/
2. 搜索：EC2
3. 点击：启动实例
4. 搜索：macOS

## ⚠️ 重要提示

### 费用说明
- Mac实例有**24小时最小计费周期**
- 即使只使用1小时，也会按24小时收费
- 约$24-48/次（取决于实例类型）

### 更经济的替代方案
如果AWS太贵，推荐使用：
- **MacinCloud**：https://www.macincloud.com/
  - 价格：$20-30/月
  - 可以随时使用
  - 适合偶尔打包

## 📝 使用步骤

1. **注册账号**：https://aws.amazon.com/cn/free/
2. **登录控制台**：https://console.aws.amazon.com/
3. **启动Mac实例**：在EC2中搜索macOS
4. **连接到Mac**：使用SSH或远程桌面
5. **运行打包脚本**：`./auto-build-ios.sh`
6. **在Xcode中打包**
7. **下载.ipa文件**
8. **关闭实例**（节省费用）

---

**提示**：如果预算有限，建议使用MacinCloud而不是AWS，因为AWS的24小时最小计费可能比MacinCloud的月费还贵。
