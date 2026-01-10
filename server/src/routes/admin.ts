import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { menuData } from '../data/menuData.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { MenuItem } from '../types.js';
import { getOrders } from '../data/orderData.js';
import { getPayments } from '../data/paymentData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const menuDataPath = join(__dirname, '../../src/data/menuData.ts');

export const adminRouter = Router();

// 获取所有商品
adminRouter.get('/menu', (req: Request, res: Response) => {
  res.json(menuData);
});

// 添加商品
adminRouter.post('/menu', (req: Request, res: Response) => {
  try {
    // 验证必填字段
    if (!req.body.name || !req.body.category || req.body.price === undefined) {
      return res.status(400).json({ error: '缺少必填字段：商品名称、分类和价格' });
    }

    const newItem: MenuItem = {
      id: uuidv4(),
      name: req.body.name,
      nameEn: req.body.nameEn || '',
      category: req.body.category,
      price: parseFloat(req.body.price) || 0,
      image: req.body.image || '',
      description: req.body.description || '',
      available: req.body.available !== undefined ? Boolean(req.body.available) : true,
      sizes: req.body.sizes || [],
      customizations: req.body.customizations || [],
    };
    
    menuData.push(newItem);
    res.status(201).json(newItem);
  } catch (error: any) {
    console.error('添加商品失败:', error);
    res.status(500).json({ error: error.message || '添加商品失败' });
  }
});

// 更新商品
adminRouter.put('/menu/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const index = menuData.findIndex(item => item.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: '商品未找到' });
    }
    
    menuData[index] = { ...menuData[index], ...req.body };
    res.json(menuData[index]);
  } catch (error) {
    res.status(500).json({ error: '更新商品失败' });
  }
});

// 删除商品
adminRouter.delete('/menu/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const index = menuData.findIndex(item => item.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: '商品未找到' });
    }
    
    menuData.splice(index, 1);
    res.json({ success: true, message: '商品已删除' });
  } catch (error) {
    res.status(500).json({ error: '删除商品失败' });
  }
});

// 获取所有订单
adminRouter.get('/orders', async (req: Request, res: Response) => {
  try {
    const orders = await getOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: '获取订单失败' });
  }
});

// 更新订单状态
adminRouter.patch('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const orders = await getOrders();
    const order = orders.find(o => o.id === id);
    
    if (!order) {
      return res.status(404).json({ error: '订单未找到' });
    }
    
    order.status = status;
    const { saveOrders } = await import('../data/orderData.js');
    await saveOrders(orders);
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: '更新订单状态失败' });
  }
});

// 通知客户订单已准备好
adminRouter.post('/orders/:id/notify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const orders = await getOrders();
    const order = orders.find(o => o.id === id);
    
    if (!order) {
      return res.status(404).json({ error: '订单未找到' });
    }
    
    // 更新订单状态为ready并记录通知时间
    order.status = 'ready';
    order.notifiedAt = new Date().toISOString();
    
    const { saveOrders } = await import('../data/orderData.js');
    await saveOrders(orders);
    
    res.json({
      success: true,
      message: '客户已收到通知',
      order
    });
  } catch (error) {
    res.status(500).json({ error: '通知客户失败' });
  }
});

// 获取支付记录
adminRouter.get('/payments', async (req: Request, res: Response) => {
  try {
    const payments = await getPayments();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: '获取支付记录失败' });
  }
});

// 获取统计数据
adminRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const orders = await getOrders();
    const payments = await getPayments();
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    
    // 按日期筛选订单
    const todayOrders = orders.filter(o => o.pickupDate === today);
    const monthOrders = orders.filter(o => o.pickupDate >= firstDayOfMonth);
    
    const todayPayments = payments.filter(p => {
      const paymentDate = p.paidAt ? new Date(p.paidAt).toISOString().split('T')[0] : new Date(p.createdAt).toISOString().split('T')[0];
      return paymentDate === today && p.status === 'completed';
    });
    
    const monthPayments = payments.filter(p => {
      const paymentDate = p.paidAt ? new Date(p.paidAt).toISOString().split('T')[0] : new Date(p.createdAt).toISOString().split('T')[0];
      return paymentDate >= firstDayOfMonth && p.status === 'completed';
    });
    
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const todayRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    const monthRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // 获取订单计数器信息
    const { getOrderStats } = await import('../data/orderCounter.js');
    const counterStats = await getOrderStats();
    
    const stats = {
      // 订单统计
      totalOrders: counterStats.totalOrders, // 总订单数（从计数器获取）
      todayOrders: todayOrders.length, // 今日订单数
      monthOrders: monthOrders.length, // 本月订单数
      todayPickupCount: counterStats.todayPickupCount, // 今日取单号
      
      // 订单状态
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      preparingOrders: orders.filter(o => o.status === 'preparing').length,
      readyOrders: orders.filter(o => o.status === 'ready').length,
      
      // 收入统计
      totalRevenue,
      todayRevenue,
      monthRevenue,
      
      // 支付统计
      totalPayments: payments.length,
      completedPayments: payments.filter(p => p.status === 'completed').length,
      
      // 商品统计
      totalMenuItems: menuData.length,
      availableMenuItems: menuData.filter(m => m.available).length,
    };
    
    res.json(stats);
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// 获取订单统计详情
adminRouter.get('/orders/stats', async (req: Request, res: Response) => {
  try {
    const orders = await getOrders();
    const payments = await getPayments();
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    
    // 按日期分组统计
    const ordersByDate: Record<string, { count: number; revenue: number }> = {};
    
    orders.forEach(order => {
      const date = order.pickupDate || order.createdAt.split('T')[0];
      if (!ordersByDate[date]) {
        ordersByDate[date] = { count: 0, revenue: 0 };
      }
      ordersByDate[date].count += 1;
      
      // 计算该订单的收入
      const payment = payments.find(p => p.orderId === order.id && p.status === 'completed');
      if (payment) {
        ordersByDate[date].revenue += payment.amount;
      }
    });
    
    // 获取最近30天的数据
    const last30Days: Array<{ date: string; count: number; revenue: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last30Days.push({
        date: dateStr,
        count: ordersByDate[dateStr]?.count || 0,
        revenue: ordersByDate[dateStr]?.revenue || 0,
      });
    }
    
    const stats = {
      today: {
        orders: orders.filter(o => o.pickupDate === today).length,
        revenue: payments
          .filter(p => {
            const paymentDate = p.paidAt ? new Date(p.paidAt).toISOString().split('T')[0] : new Date(p.createdAt).toISOString().split('T')[0];
            return paymentDate === today && p.status === 'completed';
          })
          .reduce((sum, p) => sum + p.amount, 0),
      },
      month: {
        orders: orders.filter(o => o.pickupDate >= firstDayOfMonth).length,
        revenue: payments
          .filter(p => {
            const paymentDate = p.paidAt ? new Date(p.paidAt).toISOString().split('T')[0] : new Date(p.createdAt).toISOString().split('T')[0];
            return paymentDate >= firstDayOfMonth && p.status === 'completed';
          })
          .reduce((sum, p) => sum + p.amount, 0),
      },
      total: {
        orders: orders.length,
        revenue: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
      },
      last30Days,
    };
    
    res.json(stats);
  } catch (error) {
    console.error('获取订单统计详情失败:', error);
    res.status(500).json({ error: '获取订单统计详情失败' });
  }
});
