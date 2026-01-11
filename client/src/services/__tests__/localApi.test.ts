import { describe, it, expect, beforeEach, vi } from 'vitest';
import { localApiService } from '../localApi';
import { databaseService } from '../database';
import { mockMenuItem, mockCategory, mockOrder, mockPayment } from '../../test/mockData';

// Mock database service
vi.mock('../database', () => ({
  databaseService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getMenuItems: vi.fn(),
    getMenuItemById: vi.fn(),
    getCategories: vi.fn(),
    getCategoryById: vi.fn(),
    addCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    addMenuItem: vi.fn(),
    updateMenuItem: vi.fn(),
    deleteMenuItem: vi.fn(),
    getNextOrderInfo: vi.fn(),
    addOrder: vi.fn(),
    getOrderById: vi.fn(),
    getOrderByNumber: vi.fn(),
    getOrders: vi.fn(),
    updateOrder: vi.fn(),
    addPayment: vi.fn(),
    getPaymentById: vi.fn(),
    getPayments: vi.fn(),
  },
}));

describe('LocalApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('菜单API', () => {
    it('应该获取所有菜单项', async () => {
      const mockItems = [mockMenuItem];
      (databaseService.getMenuItems as any).mockResolvedValue(mockItems);

      const result = await localApiService.getMenuItems();

      expect(result).toEqual(mockItems);
      expect(databaseService.getMenuItems).toHaveBeenCalled();
    });

    it('应该根据ID获取菜单项', async () => {
      (databaseService.getMenuItemById as any).mockResolvedValue(mockMenuItem);

      const result = await localApiService.getMenuItemById('item-1');

      expect(result).toEqual(mockMenuItem);
      expect(databaseService.getMenuItemById).toHaveBeenCalledWith('item-1');
    });

    it('应该获取所有分类', async () => {
      const mockCategories = [mockCategory];
      (databaseService.getCategories as any).mockResolvedValue(mockCategories);

      const result = await localApiService.getCategories();

      expect(result).toEqual(mockCategories);
      expect(databaseService.getCategories).toHaveBeenCalled();
    });
  });

  describe('订单API', () => {
    it('应该创建订单', async () => {
      const orderData = {
        items: mockOrder.items,
        tableNumber: '1',
        customerName: '张三',
        phone: '13800138000',
      };

      (databaseService.getNextOrderInfo as any).mockResolvedValue({
        orderNumber: 'ORD-001',
        pickupNumber: 1,
      });
      (databaseService.addOrder as any).mockResolvedValue(mockOrder);

      const result = await localApiService.createOrder(orderData);

      expect(result).toEqual(mockOrder);
      expect(databaseService.getNextOrderInfo).toHaveBeenCalled();
      expect(databaseService.addOrder).toHaveBeenCalled();
    });

    it('应该根据ID获取订单', async () => {
      (databaseService.getOrderById as any).mockResolvedValue(mockOrder);

      const result = await localApiService.getOrderById('order-1');

      expect(result).toEqual(mockOrder);
      expect(databaseService.getOrderById).toHaveBeenCalledWith('order-1');
    });

    it('应该根据订单号获取订单', async () => {
      (databaseService.getOrderByNumber as any).mockResolvedValue(mockOrder);

      const result = await localApiService.getOrderByNumber('ORD-001');

      expect(result).toEqual(mockOrder);
      expect(databaseService.getOrderByNumber).toHaveBeenCalledWith('ORD-001');
    });
  });

  describe('支付API', () => {
    it('应该处理支付', async () => {
      const paymentData = {
        orderId: 'order-1',
        method: 'cash' as const,
      };

      (databaseService.getOrderById as any).mockResolvedValue(mockOrder);
      (databaseService.addPayment as any).mockResolvedValue(mockPayment);
      (databaseService.updateOrder as any).mockResolvedValue({
        ...mockOrder,
        paymentId: 'payment-1',
        paymentStatus: 'pending',
      });

      const result = await localApiService.processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.payment).toBeDefined();
      expect(databaseService.getOrderById).toHaveBeenCalledWith('order-1');
    });

    it('应该根据ID获取支付', async () => {
      (databaseService.getPaymentById as any).mockResolvedValue(mockPayment);

      const result = await localApiService.getPaymentById('payment-1');

      expect(result).toEqual(mockPayment);
      expect(databaseService.getPaymentById).toHaveBeenCalledWith('payment-1');
    });
  });
});

