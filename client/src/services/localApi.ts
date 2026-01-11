import { databaseService } from './database';
import { MenuItem, Order, Payment, PaymentMethod, MerchantBankAccount, CartItem } from '../types';
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

  async getCategories(): Promise<string[]> {
    await this.initialize();
    return databaseService.getCategories();
  }

  async getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
    await this.initialize();
    const items = await databaseService.getMenuItems();
    return items.filter(item => item.category === category);
  }

  // ==================== 订单API ====================

  async createOrder(data: {
    items: CartItem[];
    tableNumber?: string;
    customerName?: string;
    phone?: string;
  }): Promise<Order> {
    await this.initialize();

    const { orderNumber, pickupNumber } = await databaseService.getNextOrderInfo();
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
      // 银行卡/Visa支付：模拟支付处理
      // 在实际应用中，这里会调用支付网关API
      const payment: Payment = {
        id: uuidv4(),
        orderId: data.orderId,
        amount: order.totalAmount,
        method: data.method,
        status: 'completed',
        cardInfo: data.cardInfo,
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
    const payments = await databaseService.getPayments();
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7);

    const todayOrders = orders.filter(order => order.createdAt.startsWith(today));
    const monthOrders = orders.filter(order => order.createdAt.startsWith(thisMonth));
    const todayPickups = todayOrders.filter(order => order.pickupNumber).length;

    const todayRevenue = payments
      .filter(p => p.createdAt.startsWith(today) && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const monthRevenue = payments
      .filter(p => p.createdAt.startsWith(thisMonth) && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const preparingOrders = orders.filter(o => o.status === 'preparing').length;

    return {
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      monthOrders: monthOrders.length,
      todayPickupCount: todayPickups,
      todayRevenue,
      monthRevenue,
      pendingOrders,
      preparingOrders,
    };
  }
}

// 导出单例
export const localApiService = new LocalApiService();
