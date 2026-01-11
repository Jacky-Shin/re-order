# 在Vercel添加Stripe环境变量 - 详细步骤

## 📍 您当前的位置

您正在 Vercel Dashboard 的 **Environment Variables**（环境变量）页面。

我看到您已经有了 Firebase 的环境变量，现在需要添加 Stripe 的环境变量。

---

## ✅ 添加第一个环境变量：VITE_STRIPE_PUBLISHABLE_KEY

### 步骤1：点击"Add New"按钮

在环境变量列表的**右上角**，您应该能看到一个按钮：
- 可能是 **"Add New"** 或 **"Add"** 或 **"New"** 按钮
- 点击这个按钮

### 步骤2：填写环境变量信息

在弹出的对话框中，填写：

1. **Key（键名）**：
   ```
   VITE_STRIPE_PUBLISHABLE_KEY
   ```
   ⚠️ **重要**：必须完全按照这个名称，包括大小写

2. **Value（值）**：
   ```
   pk_test_您的Stripe密钥
   ```
   - 这是您从 Stripe Dashboard 复制的 **Publishable key**
   - 应该以 `pk_test_` 开头（测试环境）
   - 或 `pk_live_` 开头（生产环境）

3. **Environment（环境）**：
   - ✅ 勾选 **Production**
   - ✅ 勾选 **Preview**
   - ✅ 勾选 **Development**
   - 或者选择 **"All Environments"**

4. 点击 **"Save"** 或 **"Add"** 保存

---

## ✅ 添加第二个环境变量：STRIPE_SECRET_KEY

### 步骤1：再次点击"Add New"

添加完第一个后，再次点击 **"Add New"** 按钮

### 步骤2：填写环境变量信息

1. **Key（键名）**：
   ```
   STRIPE_SECRET_KEY
   ```
   ⚠️ **注意**：这个**不需要** `VITE_` 前缀（因为它是后端API使用的）

2. **Value（值）**：
   ```
   sk_test_您的Stripe密钥
   ```
   - 这是您从 Stripe Dashboard 复制的 **Secret key**
   - 应该以 `sk_test_` 开头（测试环境）
   - 或 `sk_live_` 开头（生产环境）
   - 需要点击 "Reveal test key" 才能看到完整密钥

3. **Environment（环境）**：
   - ✅ 勾选 **Production**
   - ✅ 勾选 **Preview**
   - ✅ 勾选 **Development**
   - 或者选择 **"All Environments"**

4. 点击 **"Save"** 或 **"Add"** 保存

---

## 🔍 如何获取Stripe密钥？

如果您还没有Stripe密钥，请按以下步骤获取：

### 步骤1：登录Stripe Dashboard

1. 访问：https://dashboard.stripe.com
2. 使用您的Stripe账户登录

### 步骤2：进入API密钥页面

1. 点击左侧菜单 **"Developers"**（开发者）
2. 点击 **"API keys"**（API密钥）

### 步骤3：复制密钥

您会看到两个密钥：

1. **Publishable key**（发布密钥）
   - 显示为：`pk_test_...` 或 `pk_live_...`
   - 直接复制即可

2. **Secret key**（密钥）
   - 显示为：`sk_test_...` 或 `sk_live_...`
   - 可能需要点击 **"Reveal test key"** 才能看到完整密钥
   - 复制完整密钥

### 步骤4：使用测试密钥

⚠️ **建议**：先使用**测试模式**（Test mode）的密钥
- 测试密钥以 `test` 开头
- 不会真实扣款
- 可以安全测试

---

## ✅ 添加完成后的检查

添加完成后，您的环境变量列表应该包含：

**Firebase相关（已有）：**
- ✅ VITE_FIREBASE_AUTH_DOMAIN
- ✅ VITE_FIREBASE_PROJECT_ID
- ✅ VITE_FIREBASE_STORAGE_BUCKET
- ✅ VITE_FIREBASE_MESSAGING_SENDER_ID
- ✅ VITE_FIREBASE_APP_ID

**Stripe相关（新增）：**
- ✅ VITE_STRIPE_PUBLISHABLE_KEY
- ✅ STRIPE_SECRET_KEY

---

## 🚨 常见问题

### Q1: 找不到"Add New"按钮？

**A:** 按钮可能在以下位置：
- 页面右上角
- 环境变量列表上方
- 可能显示为 "Add"、"New" 或 "+" 图标

### Q2: 添加后看不到新变量？

**A:** 
- 刷新页面
- 检查是否点击了 "Save"
- 确认没有错误提示

### Q3: 密钥格式不对？

**A:** 检查：
- `VITE_STRIPE_PUBLISHABLE_KEY` 应该以 `pk_test_` 或 `pk_live_` 开头
- `STRIPE_SECRET_KEY` 应该以 `sk_test_` 或 `sk_live_` 开头
- 确保没有多余的空格

### Q4: 需要添加VITE_FIREBASE_API_KEY吗？

**A:** 我看到您的列表中没有 `VITE_FIREBASE_API_KEY`，但这是Firebase必需的。如果Firebase正常工作，可能已经配置了。如果需要，也可以添加。

---

## 📸 添加步骤图示

```
1. 点击右上角 "Add New" 按钮
   ↓
2. 填写：
   Key: VITE_STRIPE_PUBLISHABLE_KEY
   Value: pk_test_您的密钥
   Environment: 选择所有环境
   ↓
3. 点击 "Save"
   ↓
4. 再次点击 "Add New"
   ↓
5. 填写：
   Key: STRIPE_SECRET_KEY
   Value: sk_test_您的密钥
   Environment: 选择所有环境
   ↓
6. 点击 "Save"
   ↓
7. 完成！现在应该看到两个新的环境变量
```

---

## ✅ 下一步

添加完环境变量后：

1. ✅ 确认两个Stripe环境变量都已添加
2. ✅ 确认都选择了所有环境（Production, Preview, Development）
3. ✅ 重新部署应用（在 Deployments 页面点击 Redeploy）
4. ✅ 测试支付功能

---

## 💬 需要帮助？

如果您在添加过程中遇到问题，请告诉我：
- 您看到了什么错误信息？
- "Add New" 按钮在哪里？
- 我可以帮您检查配置
