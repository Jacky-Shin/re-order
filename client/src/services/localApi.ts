import { databaseService } from './database';
import { MenuItem, Order, Payment, PaymentMethod, MerchantBankAccount, CartItem, Category } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 本地API服务
 * 替代后端HTTP API，所有操作直接访问本地数据库
 */
class LocalApiService {
  /**
   * 初始化服务（确保数据库已初始化）
   */
  async initialize(): Promise<void> {
    await databaseService.initialize();
  }

  // ==================== 菜单API ====================

  async getMenuItems(): Promise<MenuItem[]> {
    await this.initialize();
    return databaseService.getMenuItems();
  }

  async getMenuItemById(id: string): Promise<MenuItem | null> {
    await this.initialize();
    return databaseService.getMenuItemById(id);
  }

  async getCategories(): Promise<Category[]> {
    await this.initialize();
    return databaseService.getCategories();
  }

  async getCategoryById(id: string): Promise<Category | null> {
    await this.initialize();
    return databaseService.getCategoryById(id);
  }

  async addCategory(category: Category): Promise<Category> {
    await this.initialize();
    return databaseService.addCategory(category);
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    await this.initialize();
    return databaseService.updateCategory(id, updates);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.initialize();
    return databaseService.deleteCategory(id);
  }

  async updateCategoryOrder(categoryIds: string[]): Promise<void> {
    await this.initialize();
    return databaseService.updateCategoryOrder(categoryIds);
  }

  async getMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    await this.initialize();
    const items = await databaseService.getMenuItems();
    return items.filter(item => item.category === categoryId);
  }

  // 计算商品销量（从订单中统计）
  async getMenuItemSalesCount(menuItemId: string): Promise<number> {
    await this.initialize();
    const orders = await databaseService.getOrders();
    let count = 0;
    
    // 只统计已支付的订单
    const paidOrders = orders.filter(order => 
      order.paymentStatus === 'completed' || order.paymentMethod === 'cash'
    );
    
    for (const order of paidOrders) {
      for (const item of order.items) {
        if (item.menuItemId === menuItemId) {
          count += item.quantity;
        }
      }
    }
    
    return count;
  }

  // 批量计算所有商品的销量
  async getAllMenuItemSalesCounts(): Promise<Record<string, number>> {
    await this.initialize();
    const orders = await databaseService.getOrders();
    const salesCounts: Record<string, number> = {};
    
    // 只统计已支付的订单
    const paidOrders = orders.filter(order => 
      order.paymentStatus === 'completed' || order.paymentMethod === 'cash'
    );
    
    for (const order of paidOrders) {
      for (const item of order.items) {
        if (!salesCounts[item.menuItemId]) {
          salesCounts[item.menuItemId] = 0;
        }
        salesCounts[item.menuItemId] += item.quantity;
      }
    }
    
    return salesCounts;
  }

  // ==================== 订单API ====================

  async createOrder(data: {
    items: CartItem[];
    tableNumber?: string;
    customerName?: string;
    phone?: string;
  }): Promise<Order> {
    await this.initialize();

    const { orderNumber, orderCode, pickupNumber } = await databaseService.getNextOrderInfo();
    const today = new Date().toISOString().split('T')[0];

    const totalAmount = data.items.reduce((sum, item) => {
      const basePrice = item.price;
      // 支持selectedSize或size字段
      const sizePrice = ((item as any).selectedSize?.price || 0);
      // 支持selectedCustomizations或customizations字段
      const customizations = (item as any).selectedCustomizations || item.customizations || [];
      const customizationPrice = customizations.reduce((s: number, c: any) => s + (c.price || 0), 0);
      return sum + (basePrice + sizePrice + customizationPrice) * item.quantity;
    }, 0);

    const order: Order = {
      id: uuidv4(),
      orderNumber,
      orderCode,
      pickupNumber,
      pickupDate: today,
      items: data.items,
      totalAmount,
      status: 'pending',
      tableNumber: data.tableNumber,
      customerName: data.customerName,
      phone: data.phone,
      createdAt: new Date().toISOString(),
    };

    return databaseService.addOrder(order);
  }

  async getOrderById(id: string): Promise<Order | null> {
    await this.initialize();
    return databaseService.getOrderById(id);
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    await this.initialize();
    return databaseService.getOrderByNumber(orderNumber);
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    await this.initialize();
    try {
      console.log('📝 更新订单状态...', { id, status });
      const updated = await databaseService.updateOrder(id, { status });
      console.log('✅ 订单状态更新成功');
      return updated;
    } catch (error) {
      console.error('❌ 更新订单状态失败:', error);
      throw error;
    }
  }

  async notifyCustomer(id: string): Promise<Order> {
    await this.initialize();
    try {
      console.log('📢 通知客户取餐...', { orderId: id });
      const order = await databaseService.getOrderById(id);
      if (!order) {
        console.error('❌ 订单不存在:', id);
        throw new Error('订单不存在');
      }

      const updatedOrder = await databaseService.updateOrder(id, {
        status: 'ready',
        notifiedAt: new Date().toISOString(),
      });
      
      console.log('✅ 通知客户成功');
      return updatedOrder;
    } catch (error) {
      console.error('❌ 通知客户失败:', error);
      throw error;
    }
  }

  async getAllOrders(): Promise<Order[]> {
    await this.initialize();
    return databaseService.getOrders();
  }

  async getOrderStats(): Promise<any> {
    await this.initialize();
    const orders = await databaseService.getOrders();
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7);

    const todayOrders = orders.filter(order => order.createdAt.startsWith(today));
    const monthOrders = orders.filter(order => order.createdAt.startsWith(thisMonth));
    const todayPickups = todayOrders.filter(order => order.pickupNumber).length;

    return {
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      monthOrders: monthOrders.length,
      todayPickupCount: todayPickups,
    };
  }

  // ==================== 支付API ====================

  async processPayment(data: {
    orderId: string;
    method: PaymentMethod;
    cardInfo?: any;
  }): Promise<{ success: boolean; payment: Payment; message: string }> {
    await this.initialize();

    const order = await databaseService.getOrderById(data.orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    // 验证支付方式
    if (data.method === 'cash') {
      // 现金支付：状态设为pending，等待商家确认
      const payment: Payment = {
        id: uuidv4(),
        orderId: data.orderId,
        amount: order.totalAmount,
        method: 'cash',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await databaseService.addPayment(payment);
      await databaseService.updateOrder(data.orderId, {
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        paymentId: payment.id,
      });

      return {
        success: true,
        payment,
        message: '订单已提交，请等待商家备餐完成后前往前台支付现金',
      };
    } else if (data.method === 'card' || data.method === 'visa') {
      // 银行卡/Visa支付：Stripe支付已在StripePaymentForm中处理
      // 这里只是更新订单和支付记录
      const payment: Payment = {
        id: uuidv4(),
        orderId: data.orderId,
        amount: order.totalAmount,
        method: data.method,
        status: 'completed',
        transactionId: data.cardInfo?.transactionId, // Stripe Payment Intent ID
        cardInfo: data.cardInfo,
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await databaseService.addPayment(payment);
      await databaseService.updateOrder(data.orderId, {
        paymentMethod: data.method,
        paymentStatus: 'completed',
        paymentId: payment.id,
        status: 'preparing',
      });

      return {
        success: true,
        payment,
        message: '支付成功',
      };
    } else {
      throw new Error('不支持的支付方式');
    }
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    await this.initialize();
    return databaseService.getPaymentById(id);
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    await this.initialize();
    const payments = await databaseService.getPayments();
    return payments.find(p => p.orderId === orderId) || null;
  }

  async getAllPayments(): Promise<Payment[]> {
    await this.initialize();
    return databaseService.getPayments();
  }

  // ==================== 商家账户API ====================

  async getMerchantAccounts(): Promise<MerchantBankAccount[]> {
    await this.initialize();
    return databaseService.getMerchantAccounts();
  }

  async getDefaultMerchantAccount(): Promise<MerchantBankAccount | null> {
    await this.initialize();
    return databaseService.getDefaultMerchantAccount();
  }

  async addMerchantAccount(data: Partial<MerchantBankAccount>): Promise<MerchantBankAccount> {
    await this.initialize();

    const account: MerchantBankAccount = {
      id: uuidv4(),
      bankName: data.bankName || '',
      accountName: data.accountName || '',
      accountNumber: data.accountNumber || '',
      cardNumber: data.cardNumber,
      expiryDate: data.expiryDate,
      cvv: data.cvv,
      isDefault: data.isDefault || false,
      createdAt: new Date().toISOString(),
    };

    return databaseService.addMerchantAccount(account);
  }

  async updateMerchantAccount(id: string, data: Partial<MerchantBankAccount>): Promise<MerchantBankAccount> {
    await this.initialize();
    return databaseService.updateMerchantAccount(id, data);
  }

  async deleteMerchantAccount(id: string): Promise<void> {
    await this.initialize();
    return databaseService.deleteMerchantAccount(id);
  }

  // ==================== 管理员API ====================

  async getAdminMenuItems(): Promise<MenuItem[]> {
    await this.initialize();
    return databaseService.getMenuItems();
  }

  async addMenuItem(data: Partial<MenuItem>): Promise<MenuItem> {
    await this.initialize();

    if (!data.name || !data.category || data.price === undefined) {
      throw new Error('缺少必填字段：商品名称、分类和价格');
    }

    const menuItem: MenuItem = {
      id: uuidv4(),
      name: data.name,
      nameEn: data.nameEn || '',
      category: data.category,
      price: data.price,
      image: data.image || '',
      description: data.description || '',
      available: data.available !== undefined ? data.available : true,
      sizes: data.sizes || [],
      customizations: data.customizations || [],
    };

    return databaseService.addMenuItem(menuItem);
  }

  async updateMenuItem(id: string, data: Partial<MenuItem>): Promise<MenuItem> {
    await this.initialize();
    return databaseService.updateMenuItem(id, data);
  }

  async deleteMenuItem(id: string): Promise<void> {
    await this.initialize();
    return databaseService.deleteMenuItem(id);
  }

  async getAdminStats(): Promise<any> {
    await this.initialize();
    const orders = await databaseService.getOrders();
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7);

    const todayOrders = orders.filter(order => order.createdAt.startsWith(today));
    const monthOrders = orders.filter(order => order.createdAt.startsWith(thisMonth));
    const todayPickups = todayOrders.filter(order => order.pickupNumber).length;

    // 统一收入计算：银行卡/信用卡使用已完成的支付记录；现金订单在状态为 ready/completed 时计入
    const isOrderPaid = (order: Order) => {
      if (order.paymentMethod === 'cash') {
        return order.status === 'ready' || order.status === 'completed';
      }
      return order.paymentStatus === 'completed';
    };

    const calcRevenue = (ordersToCalc: Order[], datePrefix: string | null) => {
      return ordersToCalc
        .filter(o => (datePrefix ? o.createdAt.startsWith(datePrefix) : true))
        .filter(isOrderPaid)
        .reduce((sum, o) => sum + o.totalAmount, 0);
    };

    const todayRevenue = calcRevenue(orders, today);
    const monthRevenue = calcRevenue(orders, thisMonth);
    const totalRevenue = calcRevenue(orders, null); // 所有已支付订单的总收入

    // 今日收入按支付方式分类
    const todayCashRevenue = orders
      .filter(o => o.createdAt.startsWith(today))
      .filter(o => o.paymentMethod === 'cash' && (o.status === 'ready' || o.status === 'completed'))
      .reduce((sum, o) => sum + o.totalAmount, 0);
    
    const todayOtherRevenue = orders
      .filter(o => o.createdAt.startsWith(today))
      .filter(o => o.paymentMethod !== 'cash' && o.paymentStatus === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const preparingOrders = orders.filter(o => o.status === 'preparing').length;

    // 日收入（最近14天）
    const days = 14;
    const dailyRevenue = Array.from({ length: days }).map((_, idx) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - idx));
      const isoDate = date.toISOString().split('T')[0];
      const revenue = calcRevenue(orders, isoDate);
      const count = orders.filter(o => o.createdAt.startsWith(isoDate) && isOrderPaid(o)).length;
      return { date: isoDate, revenue, count };
    });

    // 月收入（最近6个月）
    const months = 6;
    const monthlyRevenue = Array.from({ length: months }).map((_, idx) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (months - 1 - idx));
      const ym = date.toISOString().substring(0, 7); // YYYY-MM
      const revenue = calcRevenue(orders, ym);
      const count = orders.filter(o => o.createdAt.startsWith(ym) && isOrderPaid(o)).length;
      return { month: ym, revenue, count };
    });

    return {
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      monthOrders: monthOrders.length,
      todayPickupCount: todayPickups,
      todayRevenue,
      todayCashRevenue,
      todayOtherRevenue,
      monthRevenue,
      totalRevenue,
      pendingOrders,
      preparingOrders,
      dailyRevenue,
      monthlyRevenue,
    };
  }
}

// 导出单例
export const localApiService = new LocalApiService();
