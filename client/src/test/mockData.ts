import { MenuItem, Category, CartItem, Order, Payment } from '../types';

export const mockCategory: Category = {
  id: 'cat-1',
  name: '咖啡',
  nameEn: 'Coffee',
  order: 1,
  createdAt: new Date().toISOString(),
};

export const mockMenuItem: MenuItem = {
  id: 'item-1',
  name: '美式咖啡',
  nameEn: 'Americano',
  description: '经典美式咖啡',
  price: 25.00,
  image: 'https://example.com/americano.jpg',
  category: 'cat-1',
  available: true,
  sizes: [
    { name: '中杯', price: 0 },
    { name: '大杯', price: 5 },
  ],
  customizations: [
    {
      id: 'custom-1',
      name: '加糖',
      required: false,
      options: [
        { id: 'opt-1', name: '加糖', price: 2 },
      ],
    },
  ],
};

export const mockCartItem: CartItem = {
  id: 'cart-1',
  menuItemId: 'item-1',
  name: '美式咖啡',
  price: 25.00,
  quantity: 2,
  image: 'https://example.com/americano.jpg',
  size: '大杯',
  customizations: [
    {
      customizationId: 'custom-1',
      optionId: 'opt-1',
      name: '加糖',
      price: 2,
    },
  ],
};

export const mockOrder: Order = {
  id: 'order-1',
  orderNumber: 'ORD-001',
  orderCode: '202501011234567',
  items: [mockCartItem],
  totalAmount: 64.00,
  status: 'pending',
  paymentStatus: 'pending',
  paymentMethod: 'cash',
  tableNumber: '1',
  customerName: '张三',
  phone: '13800138000',
  createdAt: new Date().toISOString(),
};

export const mockPayment: Payment = {
  id: 'payment-1',
  orderId: 'order-1',
  amount: 64.00,
  method: 'cash',
  status: 'completed',
  paidAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

