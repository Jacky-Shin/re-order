export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  order: number; // 排序顺序，数字越小越靠前
  createdAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  nameEn: string;
  category: string; // 分类ID，不再是分类名称
  price: number;
  image: string;
  description: string;
  sizes?: SizeOption[];
  customizations?: Customization[];
  available: boolean;
  salesCount?: number; // 销量统计
}

export interface SizeOption {
  name: string;
  price: number; // 如果是尺寸，这是替换基础价格；如果是加料，这是累加价格
  isBasePrice?: boolean; // true表示这是基础价格（替换），false表示这是加价（累加）
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
  transactionId?: string; // Stripe Payment Intent ID
  paidAt?: string;
  createdAt: string;
  cardInfo?: {
    cardNumber?: string; // 仅存储后4位（如果可用）
    expiryDate?: string;
    cvv?: string;
    cardholderName?: string;
    transactionId?: string; // Stripe Payment Intent ID
  };
}

export interface Order {
  id: string;
  orderNumber: string; // 订单号（持续递增，不重置）
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
  createdAt?: string;
}

export interface CardInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName?: string;
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
