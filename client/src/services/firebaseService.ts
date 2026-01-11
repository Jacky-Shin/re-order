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
        console.warn('环境变量检查:', {
          apiKey: firebaseConfig.apiKey ? '已设置' : '未设置',
          projectId: firebaseConfig.projectId ? '已设置' : '未设置',
          authDomain: firebaseConfig.authDomain ? '已设置' : '未设置',
          storageBucket: firebaseConfig.storageBucket ? '已设置' : '未设置',
          messagingSenderId: firebaseConfig.messagingSenderId ? '已设置' : '未设置',
          appId: firebaseConfig.appId ? '已设置' : '未设置'
        });
        this.isInitialized = true;
        return;
      }

      console.log('🔧 正在初始化Firebase应用...');
      this.app = initializeApp(firebaseConfig);
      console.log('🔧 正在初始化Firestore数据库...');
      this.db = getFirestore(this.app);
      this.isInitialized = true;
      console.log('✅ Firebase初始化成功，跨设备同步已启用');
      console.log('✅ Firebase配置:', {
        projectId: firebaseConfig.projectId,
        apiKey: firebaseConfig.apiKey.substring(0, 10) + '...'
      });
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
    if (!this.isAvailable()) {
      console.warn('⚠️ Firebase不可用，无法从Firebase获取菜单项');
      return [];
    }
    
    try {
      console.log('📥 正在从Firebase读取商品列表...');
      // 使用单个orderBy避免需要复合索引
      // 先按category排序，然后在客户端按name排序
      const q = query(collection(this.db!, 'menu_items'), orderBy('category'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MenuItem));
      
      // 在客户端按category和name排序
      items.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return (a.name || '').localeCompare(b.name || '');
      });
      
      console.log(`✅ 从Firebase成功获取 ${items.length} 个商品`);
      return items;
    } catch (error) {
      console.error('❌ 从Firebase获取菜单项失败:', error);
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
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
    if (!this.isAvailable()) {
      console.error('❌ Firebase不可用，无法添加菜单项');
      throw new Error('Firebase未配置');
    }
    
    try {
      console.log('📤 正在添加商品到Firebase...', {
        id: item.id,
        name: item.name,
        category: item.category
      });
      
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
      
      console.log('✅ 商品已成功添加到Firebase:', item.id);
      return item;
    } catch (error) {
      console.error('❌ 添加菜单项到Firebase失败:', error);
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
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
    if (!this.isAvailable()) {
      console.warn('⚠️ Firebase不可用，无法从Firebase获取订单');
      return [];
    }
    
    try {
      console.log('📥 正在从Firebase读取订单列表...');
      // 注意：orderBy('createdAt', 'desc') 需要createdAt字段有索引
      // 如果出错，可以改为不排序，然后在客户端排序
      const q = query(collection(this.db!, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => this.mapOrderFromFirestore(doc));
      console.log(`✅ 从Firebase成功获取 ${orders.length} 个订单`);
      return orders;
    } catch (error: any) {
      console.error('❌ 从Firebase获取订单失败:', error);
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : String(error),
        code: error?.code,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // 如果是因为缺少索引，尝试不使用排序
      if (error?.code === 'failed-precondition') {
        console.warn('⚠️ 尝试不使用排序获取订单...');
        try {
          const snapshot = await getDocs(collection(this.db!, 'orders'));
          const orders = snapshot.docs.map(doc => this.mapOrderFromFirestore(doc));
          // 在客户端按createdAt排序
          orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          console.log(`✅ 从Firebase成功获取 ${orders.length} 个订单（客户端排序）`);
          return orders;
        } catch (retryError) {
          console.error('❌ 重试获取订单也失败:', retryError);
        }
      }
      
      return [];
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    if (!this.isAvailable()) {
      console.warn('⚠️ Firebase不可用，无法从Firebase获取订单');
      return null;
    }
    
    try {
      const docRef = doc(this.db!, 'orders', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const order = this.mapOrderFromFirestore(docSnap);
        console.log('✅ 从Firebase成功获取订单:', id);
        return order;
      }
      console.warn('⚠️ 订单不存在:', id);
      return null;
    } catch (error) {
      console.error('❌ 从Firebase获取订单失败:', error);
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }

  async addOrder(order: Order): Promise<Order> {
    if (!this.isAvailable()) {
      console.error('❌ Firebase不可用，无法添加订单');
      throw new Error('Firebase未配置');
    }
    
    try {
      console.log('📤 正在添加订单到Firebase...', {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount
      });
      
      // Firebase Firestore不支持undefined值，需要转换为null或过滤掉
      // 先构建基础数据对象
      const orderDataRaw: any = {
        orderNumber: order.orderNumber,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: Timestamp.now()
      };
      
      // 只添加非undefined的字段
      if (order.pickupNumber !== undefined && order.pickupNumber !== null) {
        orderDataRaw.pickupNumber = order.pickupNumber;
      }
      if (order.pickupDate !== undefined && order.pickupDate !== null) {
        orderDataRaw.pickupDate = order.pickupDate;
      }
      if (order.paymentMethod !== undefined && order.paymentMethod !== null) {
        orderDataRaw.paymentMethod = order.paymentMethod;
      }
      if (order.paymentStatus !== undefined && order.paymentStatus !== null) {
        orderDataRaw.paymentStatus = order.paymentStatus;
      }
      if (order.paymentId !== undefined && order.paymentId !== null) {
        orderDataRaw.paymentId = order.paymentId;
      }
      if (order.tableNumber !== undefined && order.tableNumber !== null) {
        orderDataRaw.tableNumber = order.tableNumber;
      }
      if (order.customerName !== undefined && order.customerName !== null) {
        orderDataRaw.customerName = order.customerName;
      }
      if (order.phone !== undefined && order.phone !== null) {
        orderDataRaw.phone = order.phone;
      }
      if (order.notifiedAt !== undefined && order.notifiedAt !== null) {
        orderDataRaw.notifiedAt = Timestamp.fromDate(new Date(order.notifiedAt));
      }
      
      // 清理所有undefined值（包括嵌套在items数组中的）
      const orderData = this.cleanUndefined(orderDataRaw);
      
      await setDoc(doc(this.db!, 'orders', order.id), orderData);
      
      console.log('✅ 订单已成功添加到Firebase:', order.id);
      return order;
    } catch (error) {
      console.error('❌ 添加订单到Firebase失败:', error);
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    if (!this.isAvailable()) {
      console.error('❌ Firebase不可用，无法更新订单');
      throw new Error('Firebase未配置');
    }
    
    try {
      console.log('📤 正在更新订单到Firebase...', {
        orderId: id,
        updates: updates
      });
      
      const docRef = doc(this.db!, 'orders', id);
      const updateDataRaw: any = {};
      
      // 只添加非undefined的字段，Firebase不支持undefined
      if (updates.status !== undefined) updateDataRaw.status = updates.status;
      if (updates.paymentMethod !== undefined) {
        updateDataRaw.paymentMethod = updates.paymentMethod === null ? null : updates.paymentMethod;
      }
      if (updates.paymentStatus !== undefined) {
        updateDataRaw.paymentStatus = updates.paymentStatus === null ? null : updates.paymentStatus;
      }
      if (updates.paymentId !== undefined) {
        updateDataRaw.paymentId = updates.paymentId === null ? null : updates.paymentId;
      }
      if (updates.notifiedAt !== undefined) {
        // 如果notifiedAt是null，需要明确设置为null（Firebase支持null）
        if (updates.notifiedAt === null) {
          updateDataRaw.notifiedAt = null;
        } else if (updates.notifiedAt) {
          updateDataRaw.notifiedAt = Timestamp.fromDate(new Date(updates.notifiedAt));
        }
      }
      if (updates.tableNumber !== undefined) {
        updateDataRaw.tableNumber = updates.tableNumber === null ? null : updates.tableNumber;
      }
      if (updates.customerName !== undefined) {
        updateDataRaw.customerName = updates.customerName === null ? null : updates.customerName;
      }
      if (updates.phone !== undefined) {
        updateDataRaw.phone = updates.phone === null ? null : updates.phone;
      }
      
      // 清理所有undefined值
      const updateData = this.cleanUndefined(updateDataRaw);
      
      if (Object.keys(updateData).length === 0) {
        console.warn('⚠️ 没有需要更新的字段');
        // 如果没有更新字段，直接返回现有订单
        const existing = await this.getOrderById(id);
        if (!existing) throw new Error('订单不存在');
        return existing;
      }
      
      await setDoc(docRef, updateData, { merge: true });
      console.log('✅ 订单已成功更新到Firebase');
      
      const updated = await this.getOrderById(id);
      if (!updated) {
        console.error('❌ 更新后无法获取订单');
        throw new Error('更新失败：无法获取更新后的订单');
      }
      return updated;
    } catch (error) {
      console.error('❌ 更新订单到Firebase失败:', error);
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        stack: error instanceof Error ? error.stack : undefined
      });
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
      const paymentDataRaw: any = {
        orderId: payment.orderId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        createdAt: Timestamp.now()
      };
      
      // 只添加非undefined的字段
      if (payment.cardInfo !== undefined && payment.cardInfo !== null) {
        paymentDataRaw.cardInfo = payment.cardInfo;
      }
      
      // 清理所有undefined值
      const paymentData = this.cleanUndefined(paymentDataRaw);
      
      await setDoc(doc(this.db!, 'payments', payment.id), paymentData);
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
      const accountDataRaw: any = {
        bankName: account.bankName,
        accountName: account.accountName,
        accountNumber: account.accountNumber,
        isDefault: account.isDefault !== undefined ? account.isDefault : false,
        createdAt: Timestamp.now()
      };
      
      // 只添加非undefined的字段
      if (account.cardNumber !== undefined && account.cardNumber !== null) {
        accountDataRaw.cardNumber = account.cardNumber;
      }
      if (account.expiryDate !== undefined && account.expiryDate !== null) {
        accountDataRaw.expiryDate = account.expiryDate;
      }
      if (account.cvv !== undefined && account.cvv !== null) {
        accountDataRaw.cvv = account.cvv;
      }
      
      // 清理所有undefined值
      const accountData = this.cleanUndefined(accountDataRaw);
      
      await setDoc(doc(this.db!, 'merchant_accounts', account.id), accountData);
      return account;
    } catch (error) {
      console.error('添加商家账户失败:', error);
      throw error;
    }
  }

  async updateMerchantAccount(id: string, account: Partial<MerchantBankAccount>): Promise<MerchantBankAccount> {
    if (!this.isAvailable()) throw new Error('Firebase未配置');
    
    try {
      const docRef = doc(this.db!, 'merchant_accounts', id);
      const updateDataRaw: any = {};
      
      if (account.bankName !== undefined) updateDataRaw.bankName = account.bankName;
      if (account.accountName !== undefined) updateDataRaw.accountName = account.accountName;
      if (account.accountNumber !== undefined) updateDataRaw.accountNumber = account.accountNumber;
      if (account.isDefault !== undefined) updateDataRaw.isDefault = account.isDefault;
      
      // 只添加非undefined的字段
      if (account.cardNumber !== undefined) {
        updateDataRaw.cardNumber = account.cardNumber === null ? null : account.cardNumber;
      }
      if (account.expiryDate !== undefined) {
        updateDataRaw.expiryDate = account.expiryDate === null ? null : account.expiryDate;
      }
      if (account.cvv !== undefined) {
        updateDataRaw.cvv = account.cvv === null ? null : account.cvv;
      }
      
      // 清理所有undefined值
      const updateData = this.cleanUndefined(updateDataRaw);
      
      await setDoc(docRef, updateData, { merge: true });
      
      const updatedDoc = await getDoc(docRef);
      if (updatedDoc.exists()) {
        return {
          id: updatedDoc.id,
          ...updatedDoc.data()
        } as MerchantBankAccount;
      }
      throw new Error('更新失败');
    } catch (error) {
      console.error('更新商家账户失败:', error);
      throw error;
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 递归清理对象中的所有undefined值
   * Firebase不支持undefined，需要移除或转换为null
   */
  private cleanUndefined(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanUndefined(item)).filter(item => item !== undefined);
    }
    
    if (typeof obj === 'object' && obj.constructor === Object) {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (value !== undefined) {
            cleaned[key] = this.cleanUndefined(value);
          }
        }
      }
      return cleaned;
    }
    
    return obj;
  }

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
      notifiedAt: data.notifiedAt?.toDate?.()?.toISOString(),
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
    
    // 使用单个orderBy避免需要复合索引
    const q = query(collection(this.db!, 'menu_items'), orderBy('category'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MenuItem));
      
      // 在客户端按category和name排序
      items.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return (a.name || '').localeCompare(b.name || '');
      });
      
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
