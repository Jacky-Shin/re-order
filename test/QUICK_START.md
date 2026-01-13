# 快速开始 - 并发测试

## 🚀 快速测试步骤

### 步骤1: 启动服务器

在项目根目录运行：
```bash
npm run dev:server
```

服务器将在 `http://localhost:5000` 启动。

### 步骤2: 运行测试

打开**新的终端窗口**，运行：
```bash
npm run test:concurrent
```

或者：
```bash
node test/concurrent-order-test.js
```

### 步骤3: 查看结果

测试会自动执行并显示结果，包括：
- ✅ 成功/失败统计
- ✅ 订单号重复检查
- ✅ 取单号重复检查
- ✅ 订单编码重复检查
- ✅ 响应时间统计
- ✅ QPS（每秒请求数）

## 📊 预期结果

### ✅ 正常情况
- 所有请求成功（成功率100%）
- 没有订单号重复
- 没有取单号重复
- 没有订单编码重复
- 平均响应时间 < 1000ms

### ⚠️ 如果看到错误

**错误: ECONNREFUSED**
- 说明：服务器未启动或无法连接
- 解决：确保服务器正在运行 (`npm run dev:server`)

**错误: 订单号重复**
- 说明：订单号生成存在竞争条件
- 解决：需要优化订单号生成逻辑（加锁或使用原子操作）

**错误: 取单号重复**
- 说明：取单号计数器存在并发问题
- 解决：需要优化计数器逻辑（使用数据库事务或文件锁）

## 🎯 自定义测试

### 修改并发用户数
```bash
CONCURRENT_USERS=50 node test/concurrent-order-test.js
```

### 修改API地址
```bash
API_URL=http://localhost:3000 node test/concurrent-order-test.js
```

### 同时修改多个参数
```bash
CONCURRENT_USERS=50 API_URL=http://localhost:5000 node test/concurrent-order-test.js
```

## 💡 测试建议

1. **首次测试**: 使用较小的并发数（如10）确保基本功能正常
2. **压力测试**: 逐步增加并发数（30, 50, 100）观察系统表现
3. **持续监控**: 观察响应时间和错误率的变化
4. **清理数据**: 测试后可能需要清理测试订单数据

## 🔍 浏览器测试（localStorage模式）

如果使用localStorage模式（前端直接访问），可以使用浏览器测试工具：

1. 打开 `test/browser-concurrent-test.html`
2. 选择"本地模式 (localStorage)"
3. 设置并发用户数
4. 点击"开始测试"

注意：浏览器测试需要在开发环境中运行，确保可以访问到localApi模块。

