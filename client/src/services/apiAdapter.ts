import { localApiService } from './localApi';
import { MenuItem, CartItem, Order, PaymentMethod, MerchantBankAccount } from '../types';

/**
 * API适配器
 * 将现有的HTTP API接口适配到本地API服务
 * 这样前端代码可以无缝切换，不需要大量修改
 */

// 模拟Axios响应格式
class ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;

  constructor(data: T, status = 200, statusText = 'OK') {
    this.data = data;
    this.status = status;
    this.statusText = statusText;
  }
}

// 初始化API服务
localApiService.initialize().catch(console.error);

export const menuApi = {
  getAll: async () => new ApiResponse(await localApiService.getMenuItems()),
  getCategories: async () => new ApiResponse(await localApiService.getCategories()),
  getByCategory: async (category: string) => new ApiResponse(await localApiService.getMenuItemsByCategory(category)),
  getById: async (id: string) => new ApiResponse(await localApiService.getMenuItemById(id)),
};

// 购物车API - 使用localStorage作为临时存储（可以后续改为数据库）
export const cartApi = {
  get: async (sessionId: string): Promise<ApiResponse<CartItem[]>> => {
    const data = localStorage.getItem(`cart_${sessionId}`);
    return new ApiResponse(data ? JSON.parse(data) : []);
  },
  add: async (sessionId: string, item: CartItem): Promise<ApiResponse<CartItem[]>> => {
    const cart = JSON.parse(localStorage.getItem(`cart_${sessionId}`) || '[]');
    const existingIndex = cart.findIndex((i: CartItem) => 
      i.menuItemId === item.menuItemId && 
      (i.size === item.size || (i as any).selectedSize?.name === (item as any).selectedSize?.name) &&
      JSON.stringify(i.customizations || (i as any).selectedCustomizations || []) === JSON.stringify(item.customizations || (item as any).selectedCustomizations || [])
    );
    
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += item.quantity;
    } else {
      cart.push(item);
    }
    
    localStorage.setItem(`cart_${sessionId}`, JSON.stringify(cart));
    return new ApiResponse(cart);
  },
  update: async (sessionId: string, itemId: string, quantity: number): Promise<ApiResponse<CartItem[]>> => {
    const cart = JSON.parse(localStorage.getItem(`cart_${sessionId}`) || '[]');
    const item = cart.find((i: CartItem) => i.id === itemId);
    if (item) {
      if (quantity <= 0) {
        cart.splice(cart.indexOf(item), 1);
      } else {
        item.quantity = quantity;
      }
    }
    localStorage.setItem(`cart_${sessionId}`, JSON.stringify(cart));
    return new ApiResponse(cart);
  },
  remove: async (sessionId: string, itemId: string): Promise<ApiResponse<CartItem[]>> => {
    const cart = JSON.parse(localStorage.getItem(`cart_${sessionId}`) || '[]');
    const filtered = cart.filter((i: CartItem) => i.id !== itemId);
    localStorage.setItem(`cart_${sessionId}`, JSON.stringify(filtered));
    return new ApiResponse(filtered);
  },
  clear: async (sessionId: string): Promise<ApiResponse<CartItem[]>> => {
    localStorage.setItem(`cart_${sessionId}`, JSON.stringify([]));
    return new ApiResponse([]);
  },
};

export const orderApi = {
  create: async (data: { items: CartItem[]; tableNumber?: string; customerName?: string; phone?: string }) => {
    return new ApiResponse(await localApiService.createOrder(data));
  },
  getById: async (id: string) => {
    const order = await localApiService.getOrderById(id);
    if (!order) throw new Error('订单不存在');
    return new ApiResponse(order);
  },
  getByNumber: async (orderNumber: string) => {
    const order = await localApiService.getOrderByNumber(orderNumber);
    if (!order) throw new Error('订单不存在');
    return new ApiResponse(order);
  },
  pay: async (_id: string) => {
    // 这个API在本地应用中不需要，支付直接通过paymentApi处理
    return new ApiResponse({ success: true });
  },
};

export const paymentApi = {
  process: async (data: { orderId: string; method: PaymentMethod; cardInfo?: any }) => {
    return new ApiResponse(await localApiService.processPayment(data));
  },
  getById: async (id: string) => {
    const payment = await localApiService.getPaymentById(id);
    if (!payment) throw new Error('支付记录不存在');
    return new ApiResponse(payment);
  },
  getByOrderId: async (orderId: string) => {
    const payment = await localApiService.getPaymentByOrderId(orderId);
    if (!payment) throw new Error('支付记录不存在');
    return new ApiResponse(payment);
  },
};

export const merchantApi = {
  getAccounts: async () => new ApiResponse(await localApiService.getMerchantAccounts()),
  getDefaultAccount: async () => new ApiResponse(await localApiService.getDefaultMerchantAccount()),
  addAccount: async (data: Partial<MerchantBankAccount>) => new ApiResponse(await localApiService.addMerchantAccount(data)),
  updateAccount: async (id: string, data: Partial<MerchantBankAccount>) => new ApiResponse(await localApiService.updateMerchantAccount(id, data)),
  deleteAccount: async (id: string) => {
    await localApiService.deleteMerchantAccount(id);
    return new ApiResponse({ success: true });
  },
};

export const adminApi = {
  getMenuItems: async () => new ApiResponse(await localApiService.getAdminMenuItems()),
  addMenuItem: async (data: Partial<MenuItem>) => new ApiResponse(await localApiService.addMenuItem(data)),
  updateMenuItem: async (id: string, data: Partial<MenuItem>) => new ApiResponse(await localApiService.updateMenuItem(id, data)),
  deleteMenuItem: async (id: string) => {
    await localApiService.deleteMenuItem(id);
    return new ApiResponse({ success: true });
  },
  getAllOrders: async () => new ApiResponse(await localApiService.getAllOrders()),
  updateOrderStatus: async (id: string, status: Order['status']) => {
    return new ApiResponse(await localApiService.updateOrderStatus(id, status));
  },
  notifyCustomer: async (id: string) => {
    const order = await localApiService.notifyCustomer(id);
    return new ApiResponse({ success: true, message: '客户已通知', order });
  },
  getOrderStats: async () => new ApiResponse(await localApiService.getOrderStats()),
  getPayments: async () => new ApiResponse(await localApiService.getAllPayments()),
  getStats: async () => new ApiResponse(await localApiService.getAdminStats()),
};
