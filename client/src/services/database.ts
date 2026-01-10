import { SQLiteConnection, CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { MenuItem, Order, Payment, MerchantBankAccount } from '../types';

/**
 * 数据库服务类
 * 使用SQLite作为本地数据库存储
 */
class DatabaseService {
  private db: SQLiteDBConnection | null = null;
  private sqlite: SQLiteConnection | null = null;
  private isInitialized = false;

  /**
   * 初始化数据库连接
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (Capacitor.getPlatform() === 'web') {
        // Web环境：使用localStorage作为fallback（开发测试用）
        console.warn('Web环境：使用localStorage作为数据库（仅用于开发测试）');
        this.isInitialized = true;
        return;
      }

      // 移动端环境：使用SQLite
      this.sqlite = new SQLiteConnection(CapacitorSQLite);
      this.db = await this.sqlite.createConnection(
        'starbucks_db',
        false,
        'no-encryption',
        1,
        false
      );
      await this.db.open();
      await this.createTables();
      this.isInitialized = true;
      console.log('数据库初始化成功');
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建数据表
   */
  private async createTables(): Promise<void> {
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
      return this.getMenuItemsFromStorage();
    }
    if (!this.db) throw new Error('数据库未初始化');

    const result = await this.db.query('SELECT * FROM menu_items ORDER BY category, name');
    return (result.values || []).map(this.mapMenuItemFromDB);
  }

  async getMenuItemById(id: string): Promise<MenuItem | null> {
    if (Capacitor.getPlatform() === 'web') {
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
      return this.addMenuItemToStorage(item);
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
      return this.deleteMenuItemFromStorage(id);
    }
    if (!this.db) throw new Error('数据库未初始化');

    await this.db.run('DELETE FROM menu_items WHERE id = ?', [id]);
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
      return this.getOrdersFromStorage();
    }
    if (!this.db) throw new Error('数据库未初始化');

    const result = await this.db.query('SELECT * FROM orders ORDER BY createdAt DESC');
    return (result.values || []).map(this.mapOrderFromDB);
  }

  async getOrderById(id: string): Promise<Order | null> {
    if (Capacitor.getPlatform() === 'web') {
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
      return this.addOrderToStorage(order);
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
    return order;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    if (Capacitor.getPlatform() === 'web') {
      return this.updateOrderInStorage(id, updates);
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
    if (index === -1) throw new Error('订单不存在');
    orders[index] = { ...orders[index], ...updates };
    localStorage.setItem('db_orders', JSON.stringify(orders));
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
