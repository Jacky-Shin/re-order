# 独立iPad应用打包指南

本指南将帮助您将商家后台系统打包成独立的iPad应用，每个iPad可以独立运行，不需要网络连接，数据存储在本地。

## 📱 方案选择

### 方案一：Capacitor + SQLite（推荐）
**优点**：
- 可以重用现有的React代码（90%+代码可重用）
- 支持iOS和Android
- 使用SQLite本地数据库，性能好
- 支持插件生态系统
- 可以发布到App Store

**缺点**：
- 需要重构数据层（从文件系统改为SQLite）
- 需要将后端API逻辑移到前端或使用Capacitor插件
- 需要Xcode和Apple开发者账号来构建iOS应用

### 方案二：React Native（需要重写）
**优点**：
- 原生性能
- 成熟的生态系统

**缺点**：
- 需要重写大部分代码
- 学习曲线较陡

### 方案三：PWA + Service Worker（有限支持）
**优点**：
- 最简单，几乎不需要改动代码
- 可以使用IndexedDB存储数据

**缺点**：
- 无法发布到App Store（需要通过Safari安装）
- 功能有限，不适合复杂应用

## 🎯 推荐方案：Capacitor + SQLite

我推荐使用Capacitor，因为您可以重用大部分现有代码，只需重构数据层。

## 📋 实施步骤

### 第一步：安装Capacitor

```bash
cd client
npm install @capacitor/core @capacitor/cli @capacitor/ios
npm install @capacitor/sqlite @capacitor/preferences
npm install @ionic/core @ionic/react  # 可选，用于UI组件
```

### 第二步：初始化Capacitor

```bash
npx cap init
# 应用名称：Starbucks Admin
# 应用ID：com.starbucks.admin
# Web目录：dist
```

### 第三步：重构数据层

需要创建一个新的数据访问层，使用SQLite替代文件系统：

```typescript
// client/src/services/database.ts
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

class DatabaseService {
  private db: SQLiteDBConnection | null = null;

  async initialize() {
    if (Capacitor.getPlatform() === 'web') {
      // Web端使用IndexedDB作为fallback
      // 这里可以集成一个IndexedDB包装器
      return;
    }

    const sqlite = new SQLiteConnection(CapacitorSQLite);
    this.db = await sqlite.createConnection(
      'starbucks_db',
      false,
      'no-encryption',
      1
    );
    await this.db.open();
    await this.createTables();
  }

  private async createTables() {
    if (!this.db) return;

    // 创建菜单表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        nameEn TEXT,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        image TEXT,
        description TEXT,
        available INTEGER DEFAULT 1,
        sizes TEXT,
        customizations TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建订单表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        orderNumber TEXT UNIQUE NOT NULL,
        pickupNumber INTEGER,
        pickupDate TEXT,
        items TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        status TEXT NOT NULL,
        paymentMethod TEXT,
        paymentStatus TEXT,
        paymentId TEXT,
        tableNumber TEXT,
        customerName TEXT,
        phone TEXT,
        notifiedAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建支付记录表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        orderId TEXT NOT NULL,
        amount REAL NOT NULL,
        method TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (orderId) REFERENCES orders(id)
      )
    `);
  }

  // 菜单相关方法
  async getMenuItems() {
    if (!this.db) return [];
    const result = await this.db.query('SELECT * FROM menu_items');
    return result.values || [];
  }

  async addMenuItem(item: any) {
    if (!this.db) return;
    await this.db.run(
      `INSERT INTO menu_items (id, name, nameEn, category, price, image, description, available, sizes, customizations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.id, item.name, item.nameEn || '', item.category, item.price, item.image || '', item.description || '', item.available ? 1 : 0, JSON.stringify(item.sizes || []), JSON.stringify(item.customizations || [])]
    );
  }

  // 订单相关方法
  async getOrders() {
    if (!this.db) return [];
    const result = await this.db.query('SELECT * FROM orders ORDER BY createdAt DESC');
    return result.values || [];
  }

  async addOrder(order: any) {
    if (!this.db) return;
    await this.db.run(
      `INSERT INTO orders (id, orderNumber, pickupNumber, pickupDate, items, totalAmount, status, paymentMethod, paymentStatus, tableNumber, customerName, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order.id, order.orderNumber, order.pickupNumber || null, order.pickupDate || null, JSON.stringify(order.items), order.totalAmount, order.status, order.paymentMethod || null, order.paymentStatus || null, order.tableNumber || null, order.customerName || null, order.phone || null]
    );
  }

  // 其他CRUD操作...
}
```

### 第四步：创建本地API服务

将后端API逻辑移到前端，创建一个本地API服务：

```typescript
// client/src/services/localApi.ts
import { DatabaseService } from './database';

class LocalApiService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  // 菜单API
  async getMenuItems() {
    const items = await this.db.getMenuItems();
    return items.map(item => ({
      ...item,
      sizes: JSON.parse(item.sizes || '[]'),
      customizations: JSON.parse(item.customizations || '[]'),
      available: Boolean(item.available)
    }));
  }

  async addMenuItem(item: any) {
    await this.db.addMenuItem(item);
    return item;
  }

  // 订单API
  async getOrders() {
    const orders = await this.db.getOrders();
    return orders.map(order => ({
      ...order,
      items: JSON.parse(order.items),
    }));
  }

  async createOrder(orderData: any) {
    const order = {
      id: this.generateId(),
      orderNumber: this.generateOrderNumber(),
      ...orderData,
    };
    await this.db.addOrder(order);
    return order;
  }

  // 其他API方法...
}
```

### 第五步：添加iOS平台

```bash
npx cap add ios
npx cap sync
```

### 第六步：在Xcode中构建

```bash
npx cap open ios
```

在Xcode中：
1. 选择您的团队（需要Apple开发者账号）
2. 选择目标设备或模拟器
3. 点击运行按钮

### 第七步：构建发布版本

在Xcode中：
1. Product → Archive
2. 选择分发方式（App Store或Ad Hoc）
3. 上传或导出

## 🔧 关键技术点

### 1. 数据迁移
需要将现有的文件系统数据迁移到SQLite。可以创建一个迁移脚本：

```typescript
// 迁移现有数据
async function migrateData() {
  // 从文件读取现有数据
  const menuData = await fetch('/data/menu.json').then(r => r.json());
  const ordersData = await fetch('/data/orders.json').then(r => r.json());

  // 导入到SQLite
  for (const item of menuData) {
    await db.addMenuItem(item);
  }
  
  for (const order of ordersData) {
    await db.addOrder(order);
  }
}
```

### 2. 图片存储
本地应用中的图片可以：
- 存储在应用的Documents目录
- 使用Base64编码存储在SQLite中（小图片）
- 使用文件系统API存储

### 3. 离线功能
所有功能都在本地运行，不需要网络连接。

### 4. 数据备份
可以实现数据导出功能：
- 导出为JSON文件
- 通过AirDrop分享
- 导出到iCloud

## 📦 项目结构建议

```
client/
├── src/
│   ├── services/
│   │   ├── database.ts          # SQLite数据库服务
│   │   ├── localApi.ts          # 本地API服务
│   │   └── storage.ts           # 本地存储服务（图片等）
│   ├── pages/                   # 现有页面（大部分可重用）
│   ├── contexts/                # 现有上下文（可重用）
│   └── ...
├── capacitor.config.ts          # Capacitor配置
└── ios/                         # iOS项目（自动生成）
```

## ⚠️ 注意事项

1. **Apple开发者账号**：需要Apple开发者账号（$99/年）才能发布到App Store或安装到真实设备

2. **代码签名**：需要配置代码签名才能在设备上运行

3. **数据隔离**：每个iPad安装的应用都有独立的数据存储，不会互相影响

4. **更新机制**：如果需要更新应用，需要通过App Store分发或重新安装

5. **性能考虑**：SQLite性能很好，可以处理大量数据

## 🚀 快速开始

1. **安装依赖**：
```bash
cd client
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor-community/sqlite
```

2. **初始化Capacitor**：
```bash
npx cap init
```

3. **添加iOS平台**：
```bash
npx cap add ios
npx cap sync
```

4. **打开Xcode项目**：
```bash
npx cap open ios
```

## 📝 下一步

由于这是一个较大的重构工作，建议分阶段进行：

1. **阶段1**：设置Capacitor和SQLite基础架构
2. **阶段2**：重构数据层（菜单、订单等）
3. **阶段3**：迁移后端API逻辑到前端
4. **阶段4**：测试和优化
5. **阶段5**：构建和发布

---

**需要帮助吗？** 如果您希望我帮助实现这个方案，我可以：
1. 创建完整的数据库服务代码
2. 重构API服务层
3. 配置Capacitor
4. 实现数据迁移脚本

请告诉我您希望从哪个部分开始！
