import { Capacitor } from '@capacitor/core';
import { MenuItem, Order, Payment, MerchantBankAccount } from '../types';
import { firebaseService } from './firebaseService';

/**
 * 数据库服务类
 * 使用SQLite作为本地数据库存储
 */
class DatabaseService {
  private db: any = null; // SQLite only used in native apps (not in web)
  // private sqlite: any = null; // SQLite only used in native apps (not in web) - removed for web deployment
  private isInitialized = false;

  /**
   * 初始化数据库连接
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 首先尝试初始化Firebase（用于跨设备同步）
      await firebaseService.initialize();
      
      if (Capacitor.getPlatform() === 'web') {
        // Web环境：优先使用Firebase，否则使用localStorage
        if (firebaseService.isAvailable()) {
          console.log('Web环境：使用Firebase进行跨设备数据同步');
        } else {
          console.warn('Web环境：Firebase未配置，使用localStorage作为数据库（仅用于开发测试）');
        }
        this.isInitialized = true;
        return;
      }

      // 移动端环境：SQLite功能仅在原生应用中可用
      // 对于Web部署，我们只使用Firebase + localStorage
      console.warn('移动端环境：SQLite功能仅在原生应用中可用，Web环境使用Firebase + localStorage');
      this.isInitialized = true;
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建数据表（仅在原生应用中使用）
   * Note: This method is not used in web deployment
   */
  // @ts-ignore - Method kept for potential future native app support
  private async createTables(): Promise<void> {
    // SQLite tables only needed in native apps
    // For web, we use Firebase + localStorage
    if (!this.db) return;

    try {
      // 菜单项表
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS menu_items (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          nameEn TEXT DEFAULT '',
          category TEXT NOT NULL,
          price REAL NOT NULL,
          image TEXT DEFAULT '',
          description TEXT DEFAULT '',
          available INTEGER DEFAULT 1,
          sizes TEXT DEFAULT '[]',
          customizations TEXT DEFAULT '[]',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 订单表
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

      // 支付记录表
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY,
          orderId TEXT NOT NULL,
          amount REAL NOT NULL,
          method TEXT NOT NULL,
          status TEXT NOT NULL,
          cardInfo TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (orderId) REFERENCES orders(id)
        )
      `);

      // 商家账户表
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS merchant_accounts (
          id TEXT PRIMARY KEY,
          bankName TEXT NOT NULL,
          accountName TEXT NOT NULL,
          accountNumber TEXT NOT NULL,
          cardNumber TEXT,
          expiryDate TEXT,
          cvv TEXT,
          isDefault INTEGER DEFAULT 0,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 订单计数器表
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS order_counter (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lastOrderNumber INTEGER DEFAULT 0,
          lastPickupNumber INTEGER DEFAULT 0,
          lastPickupDate TEXT DEFAULT ''
        )
      `);

      // 初始化计数器
      const counterResult = await this.db.query('SELECT * FROM order_counter LIMIT 1');
      if (!counterResult.values || counterResult.values.length === 0) {
        await this.db.run('INSERT INTO order_counter (lastOrderNumber, lastPickupNumber, lastPickupDate) VALUES (0, 0, ?)', [new Date().toISOString().split('T')[0]]);
      }

      console.log('数据表创建完成');
    } catch (error) {
      console.error('创建数据表失败:', error);
      throw error;
    }
  }

  // ==================== 菜单项操作 ====================

  async getMenuItems(): Promise<MenuItem[]> {
    if (Capacitor.getPlatform() === 'web') {
      // Web环境：优先使用Firebase，否则使用localStorage
      if (firebaseService.isAvailable()) {
        console.log('✅ 从Firebase读取商品列表（跨设备同步）');
        const items = await firebaseService.getMenuItems();
        console.log(`✅ 从Firebase获取到 ${items.length} 个商品`);
        return items;
      } else {
        console.warn('⚠️ Firebase不可用，从本地存储读取（不会跨设备同步）');
        const items = await this.getMenuItemsFromStorage();
        console.log(`从本地存储获取到 ${items.length} 个商品`);
        return items;
      }
    }
    if (!this.db) throw new Error('数据库未初始化');

    const result = await this.db.query('SELECT * FROM menu_items ORDER BY category, name');
    return (result.values || []).map(this.mapMenuItemFromDB);
  }

  async getMenuItemById(id: string): Promise<MenuItem | null> {
    if (Capacitor.getPlatform() === 'web') {
      // Web环境：优先使用Firebase，否则使用localStorage
      if (firebaseService.isAvailable()) {
        return firebaseService.getMenuItemById(id);
      }
      const items = await this.getMenuItemsFromStorage();
      return items.find(item => item.id === id) || null;
    }
    if (!this.db) throw new Error('数据库未初始化');

    const result = await this.db.query('SELECT * FROM menu_items WHERE id = ?', [id]);
    if (!result.values || result.values.length === 0) return null;
    return this.mapMenuItemFromDB(result.values[0]);
  }

  async addMenuItem(item: MenuItem): Promise<MenuItem> {
    if (Capacitor.getPlatform() === 'web') {
      // Web环境：优先使用Firebase，否则使用localStorage
      console.log('📝 添加商品到数据库...', { 
        itemId: item.id, 
        itemName: item.name,
        firebaseAvailable: firebaseService.isAvailable()
      });
      
      if (firebaseService.isAvailable()) {
        console.log('✅ Firebase可用，使用Firebase同步（跨设备）');
        try {
          await firebaseService.addMenuItem(item);
          console.log('✅ 商品已成功同步到Firebase');
          // 同时保存到localStorage作为备份
          await this.addMenuItemToStorage(item);
          console.log('✅ 商品已保存到本地备份');
          return item;
        } catch (error) {
          console.error('❌ Firebase同步失败，错误详情:', error);
          console.warn('⚠️ 回退到本地存储（不会跨设备同步）');
          // 如果Firebase失败，至少保存到本地
          return this.addMenuItemToStorage(item);
        }
      } else {
        console.warn('⚠️ Firebase不可用，仅保存到本地存储（不会跨设备同步）');
        console.warn('⚠️ 请检查Vercel环境变量是否已正确设置');
        return this.addMenuItemToStorage(item);
      }
    }
    if (!this.db) throw new Error('数据库未初始化');

    await this.db.run(
      `INSERT INTO menu_items (id, name, nameEn, category, price, image, description, available, sizes, customizations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.name,
        item.nameEn || '',
        item.category,
        item.price,
        item.image || '',
        item.description || '',
        item.available ? 1 : 0,
        JSON.stringify(item.sizes || []),
        JSON.stringify(item.customizations || []),
      ]
    );
    
    // 如果Firebase可用，同步到Firebase
    if (firebaseService.isAvailable()) {
      try {
        await firebaseService.addMenuItem(item);
      } catch (error) {
        console.warn('同步到Firebase失败:', error);
      }
    }
    
    return item;
  }

  async updateMenuItem(id: string, item: Partial<MenuItem>): Promise<MenuItem> {
    if (Capacitor.getPlatform() === 'web') {
      return this.updateMenuItemInStorage(id, item);
    }
    if (!this.db) throw new Error('数据库未初始化');

    const updates: string[] = [];
    const values: any[] = [];

    if (item.name !== undefined) {
      updates.push('name = ?');
      values.push(item.name);
    }
    if (item.nameEn !== undefined) {
      updates.push('nameEn = ?');
      values.push(item.nameEn);
    }
    if (item.category !== undefined) {
      updates.push('category = ?');
      values.push(item.category);
    }
    if (item.price !== undefined) {
      updates.push('price = ?');
      values.push(item.price);
    }
    if (item.image !== undefined) {
      updates.push('image = ?');
      values.push(item.image);
    }
    if (item.description !== undefined) {
      updates.push('description = ?');
      values.push(item.description);
    }
    if (item.available !== undefined) {
      updates.push('available = ?');
      values.push(item.available ? 1 : 0);
    }
    if (item.sizes !== undefined) {
      updates.push('sizes = ?');
      values.push(JSON.stringify(item.sizes));
    }
    if (item.customizations !== undefined) {
      updates.push('customizations = ?');
      values.push(JSON.stringify(item.customizations));
    }

    if (updates.length === 0) {
      const item = await this.getMenuItemById(id);
      if (!item) throw new Error('菜单项不存在');
      return item;
    }

    values.push(id);
    await this.db.run(`UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`, values);

    const updated = await this.getMenuItemById(id);
    if (!updated) throw new Error('更新失败');
    return updated;
  }

  async deleteMenuItem(id: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      // Web环境：优先使用Firebase，否则使用localStorage
      if (firebaseService.isAvailable()) {
        await firebaseService.deleteMenuItem(id);
      }
      return this.deleteMenuItemFromStorage(id);
    }
    if (!this.db) throw new Error('数据库未初始化');

    await this.db.run('DELETE FROM menu_items WHERE id = ?', [id]);
    
    // 如果Firebase可用，同步到Firebase
    if (firebaseService.isAvailable()) {
      try {
        await firebaseService.deleteMenuItem(id);
      } catch (error) {
        console.warn('同步到Firebase失败:', error);
      }
    }
  }

  async getCategories(): Promise<string[]> {
    if (Capacitor.getPlatform() === 'web') {
      const items = await this.getMenuItemsFromStorage();
      const categories = new Set(items.map(item => item.category));
      return Array.from(categories);
    }
    if (!this.db) throw new Error('数据库未初始化');

    const result = await this.db.query('SELECT DISTINCT category FROM menu_items ORDER BY category');
    return (result.values || []).map((row: any) => row.category);
  }

  // ==================== 订单操作 ====================

  async getOrders(): Promise<Order[]> {
    if (Capacitor.getPlatform() === 'web') {
      // Web环境：优先使用Firebase，否则使用localStorage
      if (firebaseService.isAvailable()) {
        return firebaseService.getOrders();
      }
      return this.getOrdersFromStorage();
    }
    if (!this.db) throw new Error('数据库未初始化');

    const result = await this.db.query('SELECT * FROM orders ORDER BY createdAt DESC');
    return (result.values || []).map(this.mapOrderFromDB);
  }

  async getOrderById(id: string): Promise<Order | null> {
    if (Capacitor.getPlatform() === 'web') {
      // Web环境：优先使用Firebase，如果Firebase中没有，再检查localStorage
      if (firebaseService.isAvailable()) {
        const firebaseOrder = await firebaseService.getOrderById(id);
        if (firebaseOrder) {
          return firebaseOrder;
        }
        // 如果Firebase中没有，检查本地存储
        console.log('⚠️ 订单在Firebase中不存在，检查本地存储...', id);
        const orders = await this.getOrdersFromStorage();
        const localOrder = orders.find(order => order.id === id);
        if (localOrder) {
          console.log('✅ 在本地存储中找到订单，准备同步到Firebase...', id);
          // 如果本地有但Firebase没有，同步到Firebase
          try {
            await firebaseService.addOrder(localOrder);
            console.log('✅ 订单已同步到Firebase');
          } catch (error) {
            console.warn('⚠️ 同步订单到Firebase失败（非关键）:', error);
          }
          return localOrder;
        }
        return null;
      }
      // Firebase不可用，只检查本地存储
      const orders = await this.getOrdersFromStorage();
      return orders.find(order => order.id === id) || null;
    }
    if (!this.db) throw new Error('数据库未初始化');

    const result = await this.db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!result.values || result.values.length === 0) return null;
    return this.mapOrderFromDB(result.values[0]);
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    if (Capacitor.getPlatform() === 'web') {
      const orders = await this.getOrdersFromStorage();
      return orders.find(order => order.orderNumber === orderNumber) || null;
    }
    if (!this.db) throw new Error('数据库未初始化');

    const result = await this.db.query('SELECT * FROM orders WHERE orderNumber = ?', [orderNumber]);
    if (!result.values || result.values.length === 0) return null;
    return this.mapOrderFromDB(result.values[0]);
  }

  async addOrder(order: Order): Promise<Order> {
    if (Capacitor.getPlatform() === 'web') {
      // Web环境：优先使用Firebase，否则使用localStorage
      console.log('📝 添加订单到数据库...', { 
        orderId: order.id, 
        orderNumber: order.orderNumber,
        firebaseAvailable: firebaseService.isAvailable()
      });
      
      if (firebaseService.isAvailable()) {
        console.log('✅ Firebase可用，使用Firebase同步订单（跨设备）');
        try {
          await firebaseService.addOrder(order);
          console.log('✅ 订单已成功同步到Firebase');
          // 同时保存到localStorage作为备份
          await this.addOrderToStorage(order);
          console.log('✅ 订单已保存到本地备份');
          return order;
        } catch (error) {
          console.error('❌ Firebase同步订单失败，错误详情:', error);
          console.warn('⚠️ 回退到本地存储（不会跨设备同步）');
          // 如果Firebase失败，至少保存到本地
          return this.addOrderToStorage(order);
        }
      } else {
        console.warn('⚠️ Firebase不可用，仅保存到本地存储（不会跨设备同步）');
        return this.addOrderToStorage(order);
      }
    }
    if (!this.db) throw new Error('数据库未初始化');

    await this.db.run(
      `INSERT INTO orders (id, orderNumber, pickupNumber, pickupDate, items, totalAmount, status, paymentMethod, paymentStatus, paymentId, tableNumber, customerName, phone, notifiedAt, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id,
        order.orderNumber,
        order.pickupNumber || null,
        order.pickupDate || null,
        JSON.stringify(order.items),
        order.totalAmount,
        order.status,
        order.paymentMethod || null,
        order.paymentStatus || null,
        order.paymentId || null,
        order.tableNumber || null,
        order.customerName || null,
        order.phone || null,
        order.notifiedAt || null,
        order.createdAt,
      ]
    );
    
    // 如果Firebase可用，同步到Firebase
    if (firebaseService.isAvailable()) {
      try {
        await firebaseService.addOrder(order);
      } catch (error) {
        console.warn('同步到Firebase失败:', error);
      }
    }
    
    return order;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    if (Capacitor.getPlatform() === 'web') {
      // Web环境：优先使用Firebase，否则使用localStorage
      console.log('📝 更新订单...', { 
        orderId: id, 
        updates: updates,
        firebaseAvailable: firebaseService.isAvailable()
      });
      
      if (firebaseService.isAvailable()) {
        console.log('✅ Firebase可用，使用Firebase同步更新（跨设备）');
        try {
          // getOrderById 已经会检查 Firebase 和本地存储，并自动同步
          const order = await this.getOrderById(id);
          if (!order) {
            console.error('❌ 订单不存在:', id);
            throw new Error('订单不存在');
          }
          
          // 现在更新Firebase
          const updated = await firebaseService.updateOrder(id, updates);
          console.log('✅ 订单已成功同步到Firebase');
          // 同时更新localStorage作为备份
          await this.updateOrderInStorage(id, updates);
          console.log('✅ 订单已保存到本地备份');
          return updated;
        } catch (error: any) {
          console.error('❌ Firebase同步订单更新失败，错误详情:', error);
          // 如果错误是"订单不存在"，尝试从本地存储更新
          if (error.message && error.message.includes('订单不存在')) {
            console.warn('⚠️ 尝试从本地存储更新订单...');
            try {
              return this.updateOrderInStorage(id, updates);
            } catch (localError) {
              console.error('❌ 本地存储更新也失败:', localError);
              throw new Error('订单不存在');
            }
          }
          console.warn('⚠️ 回退到本地存储（不会跨设备同步）');
          // 如果Firebase失败，至少保存到本地
          try {
            return this.updateOrderInStorage(id, updates);
          } catch (localError) {
            console.error('❌ 本地存储更新失败:', localError);
            throw error; // 抛出原始错误
          }
        }
      } else {
        console.warn('⚠️ Firebase不可用，仅保存到本地存储（不会跨设备同步）');
        return this.updateOrderInStorage(id, updates);
      }
    }
    if (!this.db) throw new Error('数据库未初始化');

    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.paymentMethod !== undefined) {
      updateFields.push('paymentMethod = ?');
      values.push(updates.paymentMethod);
    }
    if (updates.paymentStatus !== undefined) {
      updateFields.push('paymentStatus = ?');
      values.push(updates.paymentStatus);
    }
    if (updates.paymentId !== undefined) {
      updateFields.push('paymentId = ?');
      values.push(updates.paymentId);
    }
    if (updates.notifiedAt !== undefined) {
      updateFields.push('notifiedAt = ?');
      values.push(updates.notifiedAt);
    }
    if (updates.tableNumber !== undefined) {
      updateFields.push('tableNumber = ?');
      values.push(updates.tableNumber);
    }
    if (updates.customerName !== undefined) {
      updateFields.push('customerName = ?');
      values.push(updates.customerName);
    }
    if (updates.phone !== undefined) {
      updateFields.push('phone = ?');
      values.push(updates.phone);
    }

    if (updateFields.length === 0) {
      const order = await this.getOrderById(id);
      if (!order) throw new Error('订单不存在');
      return order;
    }

    values.push(id);
    await this.db.run(`UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`, values);

    const updated = await this.getOrderById(id);
    if (!updated) throw new Error('更新失败');
    
    // 如果Firebase可用，同步到Firebase
    if (firebaseService.isAvailable()) {
      try {
        await firebaseService.updateOrder(id, updates);
      } catch (error) {
        console.warn('同步到Firebase失败:', error);
      }
    }
    
    return updated;
  }

  async getNextOrderInfo(): Promise<{ orderNumber: string; pickupNumber: number }> {
    if (Capacitor.getPlatform() === 'web') {
      return this.getNextOrderInfoFromStorage();
    }
    if (!this.db) throw new Error('数据库未初始化');

    const today = new Date().toISOString().split('T')[0];
    const counterResult = await this.db.query('SELECT * FROM order_counter LIMIT 1');
    const counter = counterResult.values?.[0] || { lastOrderNumber: 0, lastPickupNumber: 0, lastPickupDate: today };

    let newOrderNumber = (counter.lastOrderNumber || 0) + 1;
    let newPickupNumber = 1;

    // 如果日期改变了，重置取单号
    if (counter.lastPickupDate !== today) {
      newPickupNumber = 1;
    } else {
      newPickupNumber = (counter.lastPickupNumber || 0) + 1;
    }

    // 更新计数器
    await this.db.run(
      'UPDATE order_counter SET lastOrderNumber = ?, lastPickupNumber = ?, lastPickupDate = ?',
      [newOrderNumber, newPickupNumber, today]
    );

    return {
      orderNumber: newOrderNumber.toString().padStart(6, '0'),
      pickupNumber: newPickupNumber,
    };
  }

  // ==================== 支付操作 ====================

  async getPayments(): Promise<Payment[]> {
    if (Capacitor.getPlatform() === 'web') {
      return this.getPaymentsFromStorage();
    }
    if (!this.db) throw new Error('数据库未初始化');

    const result = await this.db.query('SELECT * FROM payments ORDER BY createdAt DESC');
    return (result.values || []).map(this.mapPaymentFromDB);
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    if (Capacitor.getPlatform() === 'web') {
      const payments = await this.getPaymentsFromStorage();
      return payments.find(payment => payment.id === id) || null;
    }
    if (!this.db) throw new Error('数据库未初始化');

    const result = await this.db.query('SELECT * FROM payments WHERE id = ?', [id]);
    if (!result.values || result.values.length === 0) return null;
    return this.mapPaymentFromDB(result.values[0]);
  }

  async addPayment(payment: Payment): Promise<Payment> {
    if (Capacitor.getPlatform() === 'web') {
      return this.addPaymentToStorage(payment);
    }
    if (!this.db) throw new Error('数据库未初始化');

    await this.db.run(
      `INSERT INTO payments (id, orderId, amount, method, status, cardInfo, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payment.id,
        payment.orderId,
        payment.amount,
        payment.method,
        payment.status,
        JSON.stringify(payment.cardInfo || null),
        payment.createdAt,
      ]
    );
    return payment;
  }

  // ==================== 商家账户操作 ====================

  async getMerchantAccounts(): Promise<MerchantBankAccount[]> {
    if (Capacitor.getPlatform() === 'web') {
      // Web环境：优先使用Firebase，否则使用localStorage
      if (firebaseService.isAvailable()) {
        return firebaseService.getMerchantAccounts();
      }
      return this.getMerchantAccountsFromStorage();
    }
    if (!this.db) throw new Error('数据库未初始化');

    const result = await this.db.query('SELECT * FROM merchant_accounts ORDER BY isDefault DESC, createdAt DESC');
    return (result.values || []).map(this.mapMerchantAccountFromDB);
  }

  async getDefaultMerchantAccount(): Promise<MerchantBankAccount | null> {
    if (Capacitor.getPlatform() === 'web') {
      const accounts = await this.getMerchantAccountsFromStorage();
      return accounts.find(acc => acc.isDefault) || accounts[0] || null;
    }
    if (!this.db) throw new Error('数据库未初始化');

    const result = await this.db.query('SELECT * FROM merchant_accounts WHERE isDefault = 1 LIMIT 1');
    if (!result.values || result.values.length === 0) {
      // 如果没有默认账户，返回第一个
      const allResult = await this.db.query('SELECT * FROM merchant_accounts LIMIT 1');
      if (!allResult.values || allResult.values.length === 0) return null;
      return this.mapMerchantAccountFromDB(allResult.values[0]);
    }
    return this.mapMerchantAccountFromDB(result.values[0]);
  }

  async addMerchantAccount(account: MerchantBankAccount): Promise<MerchantBankAccount> {
    if (Capacitor.getPlatform() === 'web') {
      // Web环境：优先使用Firebase，否则使用localStorage
      if (firebaseService.isAvailable()) {
        await firebaseService.addMerchantAccount(account);
        await this.addMerchantAccountToStorage(account);
        return account;
      }
      return this.addMerchantAccountToStorage(account);
    }
    if (!this.db) throw new Error('数据库未初始化');

    // 如果设置为默认，先取消其他默认账户
    if (account.isDefault) {
      await this.db.run('UPDATE merchant_accounts SET isDefault = 0');
    }

    await this.db.run(
      `INSERT INTO merchant_accounts (id, bankName, accountName, accountNumber, cardNumber, expiryDate, cvv, isDefault)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        account.id,
        account.bankName,
        account.accountName,
        account.accountNumber,
        account.cardNumber || null,
        account.expiryDate || null,
        account.cvv || null,
        account.isDefault ? 1 : 0,
      ]
    );
    
    // 如果Firebase可用，同步到Firebase
    if (firebaseService.isAvailable()) {
      try {
        await firebaseService.addMerchantAccount(account);
      } catch (error) {
        console.warn('同步到Firebase失败:', error);
      }
    }
    
    return account;
  }

  async updateMerchantAccount(id: string, account: Partial<MerchantBankAccount>): Promise<MerchantBankAccount> {
    if (Capacitor.getPlatform() === 'web') {
      return this.updateMerchantAccountInStorage(id, account);
    }
    if (!this.db) throw new Error('数据库未初始化');

    const updates: string[] = [];
    const values: any[] = [];

    if (account.bankName !== undefined) {
      updates.push('bankName = ?');
      values.push(account.bankName);
    }
    if (account.accountName !== undefined) {
      updates.push('accountName = ?');
      values.push(account.accountName);
    }
    if (account.accountNumber !== undefined) {
      updates.push('accountNumber = ?');
      values.push(account.accountNumber);
    }
    if (account.cardNumber !== undefined) {
      updates.push('cardNumber = ?');
      values.push(account.cardNumber);
    }
    if (account.expiryDate !== undefined) {
      updates.push('expiryDate = ?');
      values.push(account.expiryDate);
    }
    if (account.cvv !== undefined) {
      updates.push('cvv = ?');
      values.push(account.cvv);
    }
    if (account.isDefault !== undefined) {
      if (account.isDefault) {
        // 先取消其他默认账户
        await this.db.run('UPDATE merchant_accounts SET isDefault = 0');
      }
      updates.push('isDefault = ?');
      values.push(account.isDefault ? 1 : 0);
    }

    if (updates.length === 0) {
      const accounts = await this.getMerchantAccounts();
      const acc = accounts.find(a => a.id === id);
      if (!acc) throw new Error('账户不存在');
      return acc;
    }

    values.push(id);
    await this.db.run(`UPDATE merchant_accounts SET ${updates.join(', ')} WHERE id = ?`, values);

    const accounts = await this.getMerchantAccounts();
    const acc = accounts.find(a => a.id === id);
    if (!acc) throw new Error('更新失败');
    return acc;
  }

  async deleteMerchantAccount(id: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      return this.deleteMerchantAccountFromStorage(id);
    }
    if (!this.db) throw new Error('数据库未初始化');

    await this.db.run('DELETE FROM merchant_accounts WHERE id = ?', [id]);
  }

  // ==================== 数据映射辅助方法 ====================

  private mapMenuItemFromDB(row: any): MenuItem {
    return {
      id: row.id,
      name: row.name,
      nameEn: row.nameEn || '',
      category: row.category,
      price: row.price,
      image: row.image || '',
      description: row.description || '',
      available: Boolean(row.available),
      sizes: JSON.parse(row.sizes || '[]'),
      customizations: JSON.parse(row.customizations || '[]'),
    };
  }

  private mapOrderFromDB(row: any): Order {
    return {
      id: row.id,
      orderNumber: row.orderNumber,
      pickupNumber: row.pickupNumber,
      pickupDate: row.pickupDate,
      items: JSON.parse(row.items),
      totalAmount: row.totalAmount,
      status: row.status,
      paymentMethod: row.paymentMethod,
      paymentStatus: row.paymentStatus,
      paymentId: row.paymentId,
      tableNumber: row.tableNumber,
      customerName: row.customerName,
      phone: row.phone,
      notifiedAt: row.notifiedAt,
      createdAt: row.createdAt,
    };
  }

  private mapPaymentFromDB(row: any): Payment {
    return {
      id: row.id,
      orderId: row.orderId,
      amount: row.amount,
      method: row.method,
      status: row.status,
      createdAt: row.createdAt,
      cardInfo: row.cardInfo ? JSON.parse(row.cardInfo) : undefined,
    };
  }

  private mapMerchantAccountFromDB(row: any): MerchantBankAccount {
    return {
      id: row.id,
      bankName: row.bankName,
      accountName: row.accountName,
      accountNumber: row.accountNumber,
      cardNumber: row.cardNumber,
      expiryDate: row.expiryDate,
      cvv: row.cvv,
      isDefault: Boolean(row.isDefault),
    };
  }

  // ==================== Web环境 localStorage fallback ====================

  private async getMenuItemsFromStorage(): Promise<MenuItem[]> {
    const data = localStorage.getItem('db_menu_items');
    return data ? JSON.parse(data) : [];
  }

  private async addMenuItemToStorage(item: MenuItem): Promise<MenuItem> {
    const items = await this.getMenuItemsFromStorage();
    items.push(item);
    localStorage.setItem('db_menu_items', JSON.stringify(items));
    return item;
  }

  private async updateMenuItemInStorage(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    const items = await this.getMenuItemsFromStorage();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) throw new Error('菜单项不存在');
    items[index] = { ...items[index], ...updates };
    localStorage.setItem('db_menu_items', JSON.stringify(items));
    return items[index];
  }

  private async deleteMenuItemFromStorage(id: string): Promise<void> {
    const items = await this.getMenuItemsFromStorage();
    const filtered = items.filter(item => item.id !== id);
    localStorage.setItem('db_menu_items', JSON.stringify(filtered));
  }

  private async getOrdersFromStorage(): Promise<Order[]> {
    const data = localStorage.getItem('db_orders');
    return data ? JSON.parse(data) : [];
  }

  private async addOrderToStorage(order: Order): Promise<Order> {
    const orders = await this.getOrdersFromStorage();
    orders.push(order);
    localStorage.setItem('db_orders', JSON.stringify(orders));
    return order;
  }

  private async updateOrderInStorage(id: string, updates: Partial<Order>): Promise<Order> {
    const orders = await this.getOrdersFromStorage();
    const index = orders.findIndex(order => order.id === id);
    if (index === -1) {
      console.error('❌ 订单在本地存储中不存在:', id);
      throw new Error('订单不存在');
    }
    orders[index] = { ...orders[index], ...updates };
    localStorage.setItem('db_orders', JSON.stringify(orders));
    // 触发存储更新事件（用于跨标签页同步）
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'db_orders',
        newValue: localStorage.getItem('db_orders'),
        url: window.location.href,
        storageArea: localStorage,
      }));
    }
    return orders[index];
  }

  private async getNextOrderInfoFromStorage(): Promise<{ orderNumber: string; pickupNumber: number }> {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem('db_last_pickup_date') || today;
    const lastOrderNumber = parseInt(localStorage.getItem('db_last_order_number') || '0');
    const lastPickupNumber = parseInt(localStorage.getItem('db_last_pickup_number') || '0');

    const newOrderNumber = lastOrderNumber + 1;
    let newPickupNumber = 1;

    if (lastDate === today) {
      newPickupNumber = lastPickupNumber + 1;
    } else {
      localStorage.setItem('db_last_pickup_date', today);
    }

    localStorage.setItem('db_last_order_number', newOrderNumber.toString());
    localStorage.setItem('db_last_pickup_number', newPickupNumber.toString());

    return {
      orderNumber: newOrderNumber.toString().padStart(6, '0'),
      pickupNumber: newPickupNumber,
    };
  }

  private async getPaymentsFromStorage(): Promise<Payment[]> {
    const data = localStorage.getItem('db_payments');
    return data ? JSON.parse(data) : [];
  }

  private async addPaymentToStorage(payment: Payment): Promise<Payment> {
    const payments = await this.getPaymentsFromStorage();
    payments.push(payment);
    localStorage.setItem('db_payments', JSON.stringify(payments));
    return payment;
  }

  private async getMerchantAccountsFromStorage(): Promise<MerchantBankAccount[]> {
    const data = localStorage.getItem('db_merchant_accounts');
    return data ? JSON.parse(data) : [];
  }

  private async addMerchantAccountToStorage(account: MerchantBankAccount): Promise<MerchantBankAccount> {
    const accounts = await this.getMerchantAccountsFromStorage();
    if (account.isDefault) {
      accounts.forEach(acc => acc.isDefault = false);
    }
    accounts.push(account);
    localStorage.setItem('db_merchant_accounts', JSON.stringify(accounts));
    return account;
  }

  private async updateMerchantAccountInStorage(id: string, updates: Partial<MerchantBankAccount>): Promise<MerchantBankAccount> {
    const accounts = await this.getMerchantAccountsFromStorage();
    const index = accounts.findIndex(acc => acc.id === id);
    if (index === -1) throw new Error('账户不存在');
    if (updates.isDefault) {
      accounts.forEach(acc => acc.isDefault = false);
    }
    accounts[index] = { ...accounts[index], ...updates };
    localStorage.setItem('db_merchant_accounts', JSON.stringify(accounts));
    return accounts[index];
  }

  private async deleteMerchantAccountFromStorage(id: string): Promise<void> {
    const accounts = await this.getMerchantAccountsFromStorage();
    const filtered = accounts.filter(acc => acc.id !== id);
    localStorage.setItem('db_merchant_accounts', JSON.stringify(filtered));
  }
}

// 导出单例
export const databaseService = new DatabaseService();
