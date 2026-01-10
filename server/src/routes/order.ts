import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { addOrder, getOrders, getOrderById, updateOrderStatus } from '../data/orderData.js';
import { getNextOrderInfo } from '../data/orderCounter.js';
import { Order } from '../types.js';

export const orderRouter = Router();

// 创建订单
orderRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { items, tableNumber, customerName, phone } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: '购物车为空' });
    }
    
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    // 获取下一个订单号和取单号
    const { orderNumber, pickupNumber, pickupDate } = await getNextOrderInfo();
    
    const order: Order = {
      id: uuidv4(),
      orderNumber,
      pickupNumber,
      pickupDate,
      items,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      tableNumber,
      customerName,
      phone
    };
    
    const savedOrder = await addOrder(order);
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ error: '创建订单失败' });
  }
});

// 获取所有订单
orderRouter.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await getOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: '获取订单失败' });
  }
});

// 根据ID获取订单
orderRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await getOrderById(id);
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: '订单未找到' });
    }
  } catch (error) {
    res.status(500).json({ error: '获取订单失败' });
  }
});

// 根据订单号获取订单
orderRouter.get('/number/:orderNumber', async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const orders = await getOrders();
    const order = orders.find(o => o.orderNumber === orderNumber);
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: '订单未找到' });
    }
  } catch (error) {
    res.status(500).json({ error: '获取订单失败' });
  }
});

// 更新订单状态
orderRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的订单状态' });
    }
    
    const order = await updateOrderStatus(id, status);
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: '订单未找到' });
    }
  } catch (error) {
    res.status(500).json({ error: '更新订单状态失败' });
  }
});

// 支付订单（模拟）
orderRouter.post('/:id/pay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await getOrderById(id);
    
    if (!order) {
      return res.status(404).json({ error: '订单未找到' });
    }
    
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: '订单已取消' });
    }
    
    // 模拟支付成功，更新订单状态为准备中
    const updatedOrder = await updateOrderStatus(id, 'preparing');
    
    // 模拟5秒后订单准备好
    setTimeout(async () => {
      await updateOrderStatus(id, 'ready');
    }, 5000);
    
    res.json({ 
      success: true, 
      message: '支付成功',
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ error: '支付失败' });
  }
});
