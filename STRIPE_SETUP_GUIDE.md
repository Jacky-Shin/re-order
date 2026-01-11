# Stripe支付网关集成指南

## 概述

本系统已集成Stripe支付网关，支持：
- ✅ 多米尼加共和国当地银行卡
- ✅ 国际Visa卡
- ✅ Mastercard
- ✅ 其他Stripe支持的支付方式

## 设置步骤

### 1. 注册Stripe账户

1. 访问 [Stripe官网](https://stripe.com)
2. 点击"Sign up"注册账户
3. 选择"多米尼加共和国"作为业务所在地
4. 完成账户验证和激活

### 2. 获取API密钥

1. 登录Stripe Dashboard
2. 进入 **Developers** → **API keys**
3. 复制以下密钥：
   - **Publishable key** (pk_test_... 或 pk_live_...)
   - **Secret key** (sk_test_... 或 sk_live_...)

⚠️ **重要：**
- `test` 开头的密钥用于测试环境
- `live` 开头的密钥用于生产环境
- 测试环境可以使用测试卡号，不会真实扣款

### 3. 在Vercel中设置环境变量

1. 访问 Vercel Dashboard
2. 进入项目设置 → **Environment Variables**
3. 添加以下环境变量：

#### 测试环境（推荐先使用）
```
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

#### 生产环境（上线后使用）
```
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
```

⚠️ **安全提示：**
- Secret Key 必须保密，只存储在服务器端（Vercel环境变量）
- Publishable Key 可以安全地在前端使用

### 4. 测试支付

#### 使用测试卡号（测试环境）

Stripe提供测试卡号，不会真实扣款：

**成功支付：**
- 卡号：`4242 4242 4242 4242`
- 有效期：任意未来日期（如 `12/34`）
- CVV：任意3位数字（如 `123`）
- 邮编：任意5位数字（如 `12345`）

**支付失败：**
- 卡号：`4000 0000 0000 0002`（卡被拒绝）
- 卡号：`4000 0000 0000 9995`（余额不足）

更多测试卡号：[Stripe测试卡号](https://stripe.com/docs/testing)

### 5. 激活生产环境

当准备接受真实支付时：

1. 在Stripe Dashboard完成账户验证
2. 提供业务信息（公司信息、银行账户等）
3. 将Vercel环境变量切换为 `live` 密钥
4. 重新部署应用

## 支付流程

1. **用户选择支付方式**（银行卡/Visa）
2. **前端调用API创建支付意图** → `/api/payment/create-payment-intent`
3. **Stripe Elements显示安全支付表单**
4. **用户输入银行卡信息**（信息直接发送到Stripe，不经过我们的服务器）
5. **用户确认支付**
6. **Stripe处理支付**
7. **前端调用API确认支付** → `/api/payment/confirm-payment`
8. **更新订单状态为已支付**

## 安全特性

✅ **PCI DSS合规**：银行卡信息直接发送到Stripe，不经过我们的服务器
✅ **加密传输**：所有支付数据使用HTTPS加密
✅ **Token化**：不存储完整银行卡信息
✅ **3D Secure**：支持3D Secure验证（如果发卡行要求）

## 费用说明

Stripe收费标准（多米尼加共和国）：
- **每笔交易**：2.9% + $0.30 USD
- **无月费**
- **无设置费**

例如：$10订单 = $0.29 + $0.30 = $0.59手续费

## 支持的国家和货币

Stripe在多米尼加共和国支持：
- **货币**：USD（美元）、DOP（多米尼加比索）
- **支付方式**：Visa、Mastercard、American Express等

## 常见问题

### Q: 测试环境可以接受真实支付吗？
A: 不可以。测试环境只能使用测试卡号，不会真实扣款。

### Q: 如何查看支付记录？
A: 在Stripe Dashboard → **Payments** 中查看所有支付记录。

### Q: 支付失败怎么办？
A: 系统会显示错误信息，用户可以重试或选择其他支付方式。

### Q: 支持退款吗？
A: 支持。可以在Stripe Dashboard中手动退款，或通过API实现自动退款。

## 技术支持

- Stripe文档：https://stripe.com/docs
- Stripe支持：https://support.stripe.com
- 测试卡号：https://stripe.com/docs/testing
