# Capacitor独立应用实施方案

## 核心架构变化

### 当前架构（Web应用）
```
前端 (React) ←→ HTTP API ←→ 后端 (Express) ←→ 文件系统 (JSON文件)
```

### 目标架构（独立应用）
```
前端 (React) ←→ 本地API服务 ←→ SQLite数据库 (每个iPad独立)
```

## 实施步骤

### 阶段1：安装和配置Capacitor

```bash
cd client
npm install @capacitor/core @capacitor/cli @capacitor/ios
npm install @capacitor-community/sqlite
npm install better-sqlite3  # 或者使用 @capacitor-community/sqlite
```

### 阶段2：创建数据库服务层

需要创建以下服务：
1. `DatabaseService` - SQLite数据库操作
2. `LocalApiService` - 本地API服务（替代后端API）
3. `StorageService` - 本地文件存储（图片等）

### 阶段3：重构数据访问层

将所有API调用从HTTP请求改为本地服务调用。

### 阶段4：配置Capacitor和iOS项目

### 阶段5：测试和构建

## 关键决策

1. **数据库选择**：SQLite（轻量、快速、成熟）
2. **图片存储**：本地文件系统 + Base64（小图片）
3. **数据隔离**：每个应用实例有独立的SQLite数据库
4. **更新机制**：通过App Store更新，或提供数据导出/导入功能

## 数据迁移

需要从JSON文件迁移到SQLite数据库，包括：
- 菜单数据
- 订单数据
- 支付记录
- 商家账户信息

## 优势

1. ✅ 完全离线运行
2. ✅ 每个iPad独立数据
3. ✅ 可以发布到App Store
4. ✅ 性能好（本地数据库）
5. ✅ 可以重用90%+现有代码

## 挑战

1. ⚠️ 需要重构数据层
2. ⚠️ 需要Xcode和Apple开发者账号
3. ⚠️ 图片存储需要额外处理
4. ⚠️ 数据备份/恢复机制需要实现
