# Stripe支付设置检查清单

## ✅ 完成以下步骤以启用Stripe支付

### 步骤1：注册Stripe账户 ⏳
- [ ] 访问 https://stripe.com
- [ ] 注册新账户或登录现有账户
- [ ] 选择"多米尼加共和国"作为业务所在地
- [ ] 完成基本账户验证

### 步骤2：获取API密钥 ⏳
- [ ] 登录 Stripe Dashboard (https://dashboard.stripe.com)
- [ ] 进入 Developers → API keys
- [ ] 复制 **Publishable key** (pk_test_...)
- [ ] 点击 "Reveal test key" 显示并复制 **Secret key** (sk_test_...)
- [ ] 保存这两个密钥（稍后需要）

### 步骤3：在Vercel设置环境变量 ⏳
- [ ] 访问 Vercel Dashboard (https://vercel.com)
- [ ] 进入项目 `re-order` → Settings → Environment Variables
- [ ] 添加环境变量1：
  - Key: `VITE_STRIPE_PUBLISHABLE_KEY`
  - Value: `pk_test_你的密钥`
  - Environment: ✅ Production ✅ Preview ✅ Development
- [ ] 添加环境变量2：
  - Key: `STRIPE_SECRET_KEY`
  - Value: `sk_test_你的密钥`
  - Environment: ✅ Production ✅ Preview ✅ Development
- [ ] 点击 "Save" 保存所有环境变量

### 步骤4：重新部署 ⏳
- [ ] 在Vercel Dashboard点击 "Deployments"
- [ ] 点击最新的部署
- [ ] 点击 "Redeploy" 重新部署
- [ ] 等待部署完成（1-3分钟）

### 步骤5：测试支付 ⏳
- [ ] 访问部署后的应用URL
- [ ] 创建一个测试订单
- [ ] 选择"银行卡"或"Visa"支付
- [ ] 使用测试卡号：
  - 卡号: `4242 4242 4242 4242`
  - 有效期: `12/34`
  - CVV: `123`
  - 邮编: `12345`
- [ ] 确认支付成功
- [ ] 检查订单状态是否更新为"已支付"

## 🔍 验证检查

完成设置后，请检查：

1. **环境变量是否正确设置？**
   - 在Vercel Dashboard → Settings → Environment Variables
   - 确认看到两个环境变量
   - 确认都选择了所有环境

2. **API路由是否正常工作？**
   - 打开浏览器开发者工具（F12）
   - 尝试支付，查看Network标签
   - 检查 `/api/payment/create-payment-intent` 请求是否成功

3. **Stripe支付表单是否显示？**
   - 选择银行卡/Visa支付时
   - 应该看到Stripe的安全支付表单
   - 而不是普通的输入框

## ❓ 需要帮助？

如果您在某个步骤遇到问题，请告诉我：
- 您当前在哪一步？
- 看到了什么错误信息？
- 我可以帮您检查配置

## 📚 相关文档

- 详细步骤：`STRIPE_SETUP_STEP_BY_STEP.md`
- 快速开始：`STRIPE_QUICK_START.md`
- 完整指南：`STRIPE_SETUP_GUIDE.md`
