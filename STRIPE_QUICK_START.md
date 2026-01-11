# Stripe支付快速开始指南

## 快速设置（5分钟）

### 1. 注册Stripe账户
访问 https://stripe.com 注册账户，选择"多米尼加共和国"

### 2. 获取测试密钥
1. 登录 Stripe Dashboard
2. 进入 **Developers** → **API keys**
3. 复制 **Publishable key** 和 **Secret key**（测试模式）

### 3. 在Vercel设置环境变量
1. 访问 Vercel Dashboard → 项目设置 → **Environment Variables**
2. 添加两个环境变量：

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_你的测试密钥
STRIPE_SECRET_KEY=sk_test_你的测试密钥
```

⚠️ **注意：**
- `VITE_STRIPE_PUBLISHABLE_KEY` 必须以 `VITE_` 开头
- 选择所有环境（Production, Preview, Development）
- 保存后重新部署

### 4. 测试支付
使用Stripe测试卡号：
- 卡号：`4242 4242 4242 4242`
- 有效期：`12/34`（任意未来日期）
- CVV：`123`（任意3位数字）
- 邮编：`12345`（任意5位数字）

### 5. 激活生产环境
1. 在Stripe Dashboard完成账户验证
2. 获取生产环境密钥（`pk_live_...` 和 `sk_live_...`）
3. 在Vercel中更新环境变量为生产密钥
4. 重新部署

## 支付流程

1. 用户选择"银行卡"或"Visa"支付
2. 系统显示Stripe安全支付表单
3. 用户输入银行卡信息（信息直接发送到Stripe，安全加密）
4. 用户确认支付
5. Stripe处理支付（支持3D Secure验证）
6. 支付成功后，订单状态自动更新

## 支持的功能

✅ 多米尼加共和国当地银行卡
✅ 国际Visa卡
✅ Mastercard
✅ American Express
✅ 3D Secure验证
✅ 自动支付方式检测

## 费用

- 每笔交易：2.9% + $0.30 USD
- 无月费、无设置费

## 需要帮助？

查看完整文档：`STRIPE_SETUP_GUIDE.md`
