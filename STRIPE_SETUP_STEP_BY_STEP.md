# Stripe支付设置 - 详细步骤指南

## 📋 设置清单

### ✅ 第1步：注册Stripe账户

1. **访问Stripe官网**
   - 打开浏览器，访问：https://stripe.com
   - 点击右上角 "Sign up" 或 "Sign in"

2. **注册新账户**
   - 如果已有账户，直接登录
   - 如果没有，点击 "Sign up"
   - 输入邮箱和密码
   - 选择 "多米尼加共和国" (Dominican Republic) 作为业务所在地

3. **完成账户验证**
   - 验证邮箱
   - 填写基本信息（姓名、电话等）
   - 暂时不需要提供银行账户（测试环境）

### ✅ 第2步：获取API密钥

1. **登录Stripe Dashboard**
   - 访问：https://dashboard.stripe.com
   - 使用刚才注册的账户登录

2. **进入API密钥页面**
   - 点击左侧菜单 "Developers"（开发者）
   - 点击 "API keys"（API密钥）

3. **复制密钥**
   - 您会看到两个密钥：
     - **Publishable key**（发布密钥）：`pk_test_...` 或 `pk_live_...`
     - **Secret key**（密钥）：`sk_test_...` 或 `sk_live_...`
   
   ⚠️ **重要：**
   - 默认显示的是**测试模式**（Test mode）的密钥
   - 测试模式密钥以 `test` 开头
   - 生产模式密钥以 `live` 开头（需要激活账户后才能看到）
   - **先使用测试模式密钥进行测试**

4. **复制密钥**
   - 点击 "Reveal test key" 显示Secret key
   - 复制两个密钥，保存到安全的地方（稍后需要用到）

### ✅ 第3步：在Vercel设置环境变量

1. **访问Vercel Dashboard**
   - 打开浏览器，访问：https://vercel.com
   - 登录您的Vercel账户

2. **进入项目设置**
   - 找到您的项目 `re-order`
   - 点击项目进入详情页
   - 点击顶部菜单 "Settings"（设置）

3. **进入环境变量页面**
   - 在左侧菜单找到 "Environment Variables"（环境变量）
   - 点击进入

4. **添加第一个环境变量：VITE_STRIPE_PUBLISHABLE_KEY**
   - 点击 "Add New" 或 "Add" 按钮
   - **Key（键）**：`VITE_STRIPE_PUBLISHABLE_KEY`
   - **Value（值）**：粘贴您从Stripe复制的 `pk_test_...` 密钥
   - **Environment（环境）**：选择所有三个（Production, Preview, Development）
   - 点击 "Save" 保存

5. **添加第二个环境变量：STRIPE_SECRET_KEY**
   - 再次点击 "Add New"
   - **Key（键）**：`STRIPE_SECRET_KEY`
   - **Value（值）**：粘贴您从Stripe复制的 `sk_test_...` 密钥
   - **Environment（环境）**：选择所有三个（Production, Preview, Development）
   - 点击 "Save" 保存

6. **确认环境变量**
   - 您应该看到两个环境变量：
     - `VITE_STRIPE_PUBLISHABLE_KEY`
     - `STRIPE_SECRET_KEY`
   - 确保两个都选择了所有环境

### ✅ 第4步：重新部署应用

1. **触发重新部署**
   - 方法1：在Vercel Dashboard点击 "Deployments"（部署）
   - 点击最新的部署，然后点击 "Redeploy"（重新部署）
   - 方法2：推送任何代码更改到GitHub（会自动触发部署）

2. **等待部署完成**
   - 部署通常需要1-3分钟
   - 等待状态变为 "Ready"（就绪）

### ✅ 第5步：测试支付功能

1. **访问您的应用**
   - 打开部署后的URL（例如：https://re-order.vercel.app）
   - 进入商家后台，添加一些商品
   - 使用客户端下单

2. **测试支付**
   - 选择 "银行卡" 或 "Visa" 支付方式
   - 使用Stripe测试卡号：
     - **卡号**：`4242 4242 4242 4242`
     - **有效期**：`12/34`（任意未来日期）
     - **CVV**：`123`（任意3位数字）
     - **邮编**：`12345`（任意5位数字）

3. **验证支付**
   - 支付应该成功
   - 订单状态应该更新为"已支付"
   - 可以在Stripe Dashboard → Payments 中查看支付记录

## 🔍 故障排查

### 问题1：支付表单不显示
**可能原因：** `VITE_STRIPE_PUBLISHABLE_KEY` 未正确设置
**解决方法：**
- 检查Vercel环境变量是否正确
- 确保密钥以 `pk_test_` 或 `pk_live_` 开头
- 重新部署应用

### 问题2：支付失败，提示"Payment gateway not configured"
**可能原因：** `STRIPE_SECRET_KEY` 未正确设置
**解决方法：**
- 检查Vercel环境变量中是否有 `STRIPE_SECRET_KEY`
- 确保密钥以 `sk_test_` 或 `sk_live_` 开头
- 重新部署应用

### 问题3：API路由404错误
**可能原因：** Vercel Serverless Functions未正确部署
**解决方法：**
- 检查 `api/` 文件夹是否在项目根目录
- 检查 `vercel.json` 配置是否正确
- 查看Vercel部署日志

### 问题4：支付成功但订单未更新
**可能原因：** 支付确认API调用失败
**解决方法：**
- 检查浏览器控制台错误
- 检查网络请求是否成功
- 查看Vercel函数日志

## 📞 需要帮助？

如果您在设置过程中遇到问题，请告诉我：
1. 您当前在哪一步？
2. 遇到了什么错误信息？
3. 我可以帮您检查配置或代码

## 🎯 下一步

设置完成后：
1. ✅ 使用测试卡号测试支付功能
2. ✅ 验证支付成功后订单状态更新
3. ✅ 在Stripe Dashboard查看支付记录
4. ✅ 准备激活生产环境（完成Stripe账户验证后）
