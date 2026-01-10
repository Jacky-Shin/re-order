import { Router, Request, Response } from 'express';
import { CartItem } from '../types.js';

export const cartRouter = Router();

// 临时存储购物车（实际应用中应使用session或数据库）
const carts: Map<string, CartItem[]> = new Map();

// 获取购物车
cartRouter.get('/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const cart = carts.get(sessionId) || [];
  res.json(cart);
});

// 添加商品到购物车
cartRouter.post('/:sessionId/add', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const item: CartItem = req.body;
  
  const cart = carts.get(sessionId) || [];
  const existingIndex = cart.findIndex(
    ci => ci.menuItemId === item.menuItemId && 
    ci.size === item.size &&
    JSON.stringify(ci.customizations) === JSON.stringify(item.customizations)
  );
  
  if (existingIndex >= 0) {
    cart[existingIndex].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  
  carts.set(sessionId, cart);
  res.json(cart);
});

// 更新购物车商品数量
cartRouter.put('/:sessionId/update/:itemId', (req: Request, res: Response) => {
  const { sessionId, itemId } = req.params;
  const { quantity } = req.body;
  
  const cart = carts.get(sessionId) || [];
  const item = cart.find(ci => ci.id === itemId);
  
  if (item) {
    if (quantity <= 0) {
      const index = cart.indexOf(item);
      cart.splice(index, 1);
    } else {
      item.quantity = quantity;
    }
    carts.set(sessionId, cart);
    res.json(cart);
  } else {
    res.status(404).json({ error: '商品未找到' });
  }
});

// 从购物车删除商品
cartRouter.delete('/:sessionId/remove/:itemId', (req: Request, res: Response) => {
  const { sessionId, itemId } = req.params;
  
  const cart = carts.get(sessionId) || [];
  const filtered = cart.filter(ci => ci.id !== itemId);
  carts.set(sessionId, filtered);
  
  res.json(filtered);
});

// 清空购物车
cartRouter.delete('/:sessionId/clear', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  carts.set(sessionId, []);
  res.json([]);
});
