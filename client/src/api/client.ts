import { MenuItem, CartItem, Order, Payment, PaymentMethod, MerchantBankAccount } from '../types';
import { useLocalApi } from '../config/environment';
import * as localApi from '../services/apiAdapter';
import axios, { AxiosInstance } from 'axios';

// 创建HTTP API实例（用于非独立模式）
const createHttpApi = (): AxiosInstance => {
  const api = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  api.interceptors.request.use(
    (config) => {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
      return config;
    },
    (error) => {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
      return Promise.reject(error);
    }
  );

  return api;
};

// 根据环境选择使用本地API还是HTTP API
const useLocal = useLocalApi();

let httpApi: AxiosInstance | null = null;

if (!useLocal) {
  httpApi = createHttpApi();
}

// 菜单API
export const menuApi = useLocal ? localApi.menuApi : {
  getAll: () => httpApi!.get<MenuItem[]>('/menu'),
  getCategories: () => httpApi!.get<string[]>('/menu/categories'),
  getByCategory: (category: string) => httpApi!.get<MenuItem[]>(`/menu/category/${category}`),
  getById: (id: string) => httpApi!.get<MenuItem>(`/menu/${id}`),
};

// 购物车API
export const cartApi = useLocal ? localApi.cartApi : {
  get: (sessionId: string) => httpApi!.get<CartItem[]>(`/cart/${sessionId}`),
  add: (sessionId: string, item: CartItem) => httpApi!.post<CartItem[]>(`/cart/${sessionId}/add`, item),
  update: (sessionId: string, itemId: string, quantity: number) => 
    httpApi!.put<CartItem[]>(`/cart/${sessionId}/update/${itemId}`, { quantity }),
  remove: (sessionId: string, itemId: string) => 
    httpApi!.delete<CartItem[]>(`/cart/${sessionId}/remove/${itemId}`),
  clear: (sessionId: string) => httpApi!.delete<CartItem[]>(`/cart/${sessionId}/clear`),
};

// 订单API
export const orderApi = useLocal ? localApi.orderApi : {
  create: (data: { items: CartItem[]; tableNumber?: string; customerName?: string; phone?: string }) =>
    httpApi!.post<Order>('/orders', data),
  getById: (id: string) => httpApi!.get<Order>(`/orders/${id}`),
  getByNumber: (orderNumber: string) => httpApi!.get<Order>(`/orders/number/${orderNumber}`),
  pay: (id: string) => httpApi!.post(`/orders/${id}/pay`),
};

// 支付API
export const paymentApi = useLocal ? localApi.paymentApi : {
  process: (data: { orderId: string; method: PaymentMethod; cardInfo?: any }) =>
    httpApi!.post<{ success: boolean; payment: Payment; message: string }>('/payments/process', data),
  getById: (id: string) => httpApi!.get<Payment>(`/payments/${id}`),
  getByOrderId: (orderId: string) => httpApi!.get<Payment>(`/payments/order/${orderId}`),
};

// 商家API
export const merchantApi = useLocal ? localApi.merchantApi : {
  getAccounts: () => httpApi!.get<MerchantBankAccount[]>('/merchant/accounts'),
  getDefaultAccount: () => httpApi!.get<MerchantBankAccount>('/merchant/accounts/default'),
  addAccount: (data: Partial<MerchantBankAccount>) => httpApi!.post<MerchantBankAccount>('/merchant/accounts', data),
  updateAccount: (id: string, data: Partial<MerchantBankAccount>) => httpApi!.put<MerchantBankAccount>(`/merchant/accounts/${id}`, data),
  deleteAccount: (id: string) => httpApi!.delete(`/merchant/accounts/${id}`),
};

// 管理员API
export const adminApi = useLocal ? localApi.adminApi : {
  getMenuItems: () => httpApi!.get<MenuItem[]>('/admin/menu'),
  addMenuItem: (data: Partial<MenuItem>) => httpApi!.post<MenuItem>('/admin/menu', data),
  updateMenuItem: (id: string, data: Partial<MenuItem>) => httpApi!.put<MenuItem>(`/admin/menu/${id}`, data),
  deleteMenuItem: (id: string) => httpApi!.delete(`/admin/menu/${id}`),
  getAllOrders: () => httpApi!.get<Order[]>('/admin/orders'),
  updateOrderStatus: (id: string, status: Order['status']) => httpApi!.patch<Order>(`/admin/orders/${id}/status`, { status }),
  notifyCustomer: (id: string) => httpApi!.post<{ success: boolean; message: string; order: Order }>(`/admin/orders/${id}/notify`),
  getOrderStats: () => httpApi!.get<any>('/admin/orders/stats'),
  getPayments: () => httpApi!.get<Payment[]>('/admin/payments'),
  getStats: () => httpApi!.get<any>('/admin/stats'),
};
