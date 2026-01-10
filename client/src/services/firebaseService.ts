/**
 * Firebase服务
 * 用于跨设备数据同步
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { MenuItem, Order, Payment, MerchantBankAccount } from '../types';

// Firebase配置
// 这些配置需要从Firebase控制台获取
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

class FirebaseService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private isInitialized = false;

  /**
   * 初始化Firebase
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 检查是否配置了Firebase
      console.log('正在初始化Firebase...', {
        apiKey: firebaseConfig.apiKey ? '已设置' : '未设置',
        projectId: firebaseConfig.projectId ? '已设置' : '未设置',
        apiKeyValue: firebaseConfig.apiKey?.substring(0, 10) + '...' || '未设置'
      });
      
      if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your-api-key') {
        console.warn('⚠️ Firebase未配置，将使用本地存储（数据不会跨设备同步）');
        console.warn('请在Vercel中设置环境变量：VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID等');
        this.isInitialized = true;
        return;
      }

      this.app = initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);
      this.isInitialized = true;
      console.log('✅ Firebase初始化成功，跨设备同步已启用');
    } catch (error) {
      console.error('❌ Firebase初始化失败:', error);
      console.error('将回退到本地存储（数据不会跨设备同步）');
      this.isInitialized = true; // 标记为已初始化，避免重复尝试
    }
  }

  /**
   * 检查是否可以使用Firebase
   */
  isAvailable(): boolean {
    return this.isInitialized && this.db !== null;
  }

  // ==================== 菜单项操作 ====================

  async getMenuItems(): Promise<MenuItem[]> {
    if (!this.isAvailable()) return [];
    
    try {
      const q = query(collection(this.db!, 'menu_items'), orderBy('category'), orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MenuItem));
    } catch (error) {
      console.error('获取菜单项失败:', error);
      return [];
    }
  }

  async getMenuItemById(id: string): Promise<MenuItem | null> {
    if (!this.isAvailable()) return null;
    
    try {
      const docRef = doc(this.db!, 'menu_items', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as MenuItem;
      }
      return null;
    } catch (error) {
      console.error('获取菜单项失败:', error);
      return null;
    }
  }

  async addMenuItem(item: MenuItem): Promise<MenuItem> {
    if (!this.isAvailable()) throw new Error('Firebase未配置');
    
    try {
      await setDoc(doc(this.db!, 'menu_items', item.id), {
        name: item.name,
        nameEn: item.nameEn || '',
        category: item.category,
        price: item.price,
        image: item.image || '',
        description: item.description || '',
        available: item.available !== undefined ? item.available : true,
        sizes: item.sizes || [],
        customizations: item.customizations || [],
        createdAt: Timestamp.now()
      });
      return item;
    } catch (error) {
      console.error('添加菜单项失败:', error);
      throw error;
    }
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    if (!this.isAvailable()) throw new Error('Firebase未配置');
    
    try {
      const docRef = doc(this.db!, 'menu_items', id);
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.nameEn !== undefined) updateData.nameEn = updates.nameEn;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.image !== undefined) updateData.image = updates.image;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.available !== undefined) updateData.available = updates.available;
      if (updates.sizes !== undefined) updateData.sizes = updates.sizes;
      if (updates.customizations !== undefined) updateData.customizations = updates.customizations;
      
      await setDoc(docRef, updateData, { merge: true });
      
      const updated = await this.getMenuItemById(id);
      if (!updated) throw new Error('更新失败');
      return updated;
    } catch (error) {
      console.error('更新菜单项失败:', error);
      throw error;
    }
  }

  async deleteMenuItem(id: string): Promise<void> {
    if (!this.isAvailable()) throw new Error('Firebase未配置');
    
    try {
      await deleteDoc(doc(this.db!, 'menu_items', id));
    } catch (error) {
      console.error('删除菜单项失败:', error);
      throw error;
    }
  }

  // ==================== 订单操作 ====================

  async getOrders(): Promise<Order[]> {
    if (!this.isAvailable()) return [];
    
    try {
      const q = query(collection(this.db!, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.mapOrderFromFirestore(doc));
    } catch (error) {
      console.error('获取订单失败:', error);
      return [];
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    if (!this.isAvailable()) return null;
    
    try {
      const docRef = doc(this.db!, 'orders', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return this.mapOrderFromFirestore(docSnap);
      }
      return null;
    } catch (error) {
      console.error('获取订单失败:', error);
      return null;
    }
  }

  async addOrder(order: Order): Promise<Order> {
    if (!this.isAvailable()) throw new Error('Firebase未配置');
    
    try {
      await setDoc(doc(this.db!, 'orders', order.id), {
        orderNumber: order.orderNumber,
        pickupNumber: order.pickupNumber,
        pickupDate: order.pickupDate,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentId: order.paymentId,
        tableNumber: order.tableNumber,
        customerName: order.customerName,
        phone: order.phone,
        notifiedAt: order.notifiedAt,
        createdAt: Timestamp.now()
      });
      return order;
    } catch (error) {
      console.error('添加订单失败:', error);
      throw error;
    }
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    if (!this.isAvailable()) throw new Error('Firebase未配置');
    
    try {
      const docRef = doc(this.db!, 'orders', id);
      const updateData: any = {};
      
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.paymentMethod !== undefined) updateData.paymentMethod = updates.paymentMethod;
      if (updates.paymentStatus !== undefined) updateData.paymentStatus = updates.paymentStatus;
      if (updates.paymentId !== undefined) updateData.paymentId = updates.paymentId;
      if (updates.notifiedAt !== undefined) updateData.notifiedAt = updates.notifiedAt;
      
      await setDoc(docRef, updateData, { merge: true });
      
      const updated = await this.getOrderById(id);
      if (!updated) throw new Error('更新失败');
      return updated;
    } catch (error) {
      console.error('更新订单失败:', error);
      throw error;
    }
  }

  // ==================== 支付操作 ====================

  async getPayments(): Promise<Payment[]> {
    if (!this.isAvailable()) return [];
    
    try {
      const q = query(collection(this.db!, 'payments'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.mapPaymentFromFirestore(doc));
    } catch (error) {
      console.error('获取支付记录失败:', error);
      return [];
    }
  }

  async addPayment(payment: Payment): Promise<Payment> {
    if (!this.isAvailable()) throw new Error('Firebase未配置');
    
    try {
      await setDoc(doc(this.db!, 'payments', payment.id), {
        orderId: payment.orderId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        cardInfo: payment.cardInfo,
        createdAt: Timestamp.now()
      });
      return payment;
    } catch (error) {
      console.error('添加支付记录失败:', error);
      throw error;
    }
  }

  // ==================== 商家账户操作 ====================

  async getMerchantAccounts(): Promise<MerchantBankAccount[]> {
    if (!this.isAvailable()) return [];
    
    try {
      const snapshot = await getDocs(collection(this.db!, 'merchant_accounts'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MerchantBankAccount));
    } catch (error) {
      console.error('获取商家账户失败:', error);
      return [];
    }
  }

  async addMerchantAccount(account: MerchantBankAccount): Promise<MerchantBankAccount> {
    if (!this.isAvailable()) throw new Error('Firebase未配置');
    
    try {
      await setDoc(doc(this.db!, 'merchant_accounts', account.id), {
        bankName: account.bankName,
        accountName: account.accountName,
        accountNumber: account.accountNumber,
        cardNumber: account.cardNumber,
        expiryDate: account.expiryDate,
        cvv: account.cvv,
        isDefault: account.isDefault,
        createdAt: Timestamp.now()
      });
      return account;
    } catch (error) {
      console.error('添加商家账户失败:', error);
      throw error;
    }
  }

  // ==================== 辅助方法 ====================

  private mapOrderFromFirestore(doc: any): Order {
    const data = doc.data();
    return {
      id: doc.id,
      orderNumber: data.orderNumber,
      pickupNumber: data.pickupNumber,
      pickupDate: data.pickupDate,
      items: data.items,
      totalAmount: data.totalAmount,
      status: data.status,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      paymentId: data.paymentId,
      tableNumber: data.tableNumber,
      customerName: data.customerName,
      phone: data.phone,
      notifiedAt: data.notifiedAt,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    };
  }

  private mapPaymentFromFirestore(doc: any): Payment {
    const data = doc.data();
    return {
      id: doc.id,
      orderId: data.orderId,
      amount: data.amount,
      method: data.method,
      status: data.status,
      cardInfo: data.cardInfo,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    };
  }

  // ==================== 实时监听 ====================

  /**
   * 监听菜单项变化
   */
  onMenuItemsChange(callback: (items: MenuItem[]) => void): () => void {
    if (!this.isAvailable()) return () => {};
    
    const q = query(collection(this.db!, 'menu_items'), orderBy('category'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MenuItem));
      callback(items);
    });
    
    return unsubscribe;
  }

  /**
   * 监听订单变化
   */
  onOrdersChange(callback: (orders: Order[]) => void): () => void {
    if (!this.isAvailable()) return () => {};
    
    const q = query(collection(this.db!, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => this.mapOrderFromFirestore(doc));
      callback(orders);
    });
    
    return unsubscribe;
  }
}

export const firebaseService = new FirebaseService();
