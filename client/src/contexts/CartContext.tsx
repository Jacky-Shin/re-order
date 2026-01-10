import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '../types';
import { cartApi } from '../api/client';

interface CartContextType {
  cart: CartItem[];
  sessionId: string;
  addToCart: (item: CartItem) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('sessionId');
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sessionId', id);
    }
    return id;
  });

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const response = await cartApi.get(sessionId);
      setCart(response.data);
    } catch (error) {
      console.error('加载购物车失败:', error);
    }
  };

  const addToCart = async (item: CartItem) => {
    try {
      const response = await cartApi.add(sessionId, item);
      setCart(response.data);
    } catch (error) {
      console.error('添加到购物车失败:', error);
      throw error;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const response = await cartApi.update(sessionId, itemId, quantity);
      setCart(response.data);
    } catch (error) {
      console.error('更新数量失败:', error);
      throw error;
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const response = await cartApi.remove(sessionId, itemId);
      setCart(response.data);
    } catch (error) {
      console.error('删除商品失败:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clear(sessionId);
      setCart([]);
    } catch (error) {
      console.error('清空购物车失败:', error);
      throw error;
    }
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        sessionId,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
