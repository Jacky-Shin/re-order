export interface MenuItem {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  price: number;
  image: string;
  description: string;
  sizes?: SizeOption[];
  customizations?: Customization[];
  available: boolean;
}

export interface SizeOption {
  name: string;
  price: number;
}

export interface Customization {
  id: string;
  name: string;
  options: CustomizationOption[];
  required: boolean;
}

export interface CustomizationOption {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  size?: string;
  price: number;
  quantity: number;
  customizations?: SelectedCustomization[];
  image: string;
}

export interface SelectedCustomization {
  customizationId: string;
  optionId: string;
  name: string;
  price: number;
}

export type PaymentMethod = 'card' | 'visa' | 'cash';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string; // 订单号（每日从0开始计数，每日清零）
  orderCode?: string; // 订单编码（年月日+7位字符，例如：202503121231a31）
  pickupNumber?: number; // 取单号（每天从1开始，每日清零）
  pickupDate?: string; // 取单日期 YYYY-MM-DD
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentId?: string;
  createdAt: string;
  tableNumber?: string;
  customerName?: string;
  phone?: string;
  notifiedAt?: string; // 通知客户的时间
}

export interface MerchantBankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface ShopSettings {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  bannerImages: string[]; // 商铺顶部展示图片（可多张）
  logo?: string; // 店铺Logo
  createdAt: string;
  updatedAt: string;
}