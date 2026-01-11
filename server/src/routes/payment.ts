import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { addPayment, getPaymentById, getPaymentByOrderId, updatePaymentStatus } from '../data/paymentData.js';
import { getOrderById, updateOrderStatus, getOrders, saveOrders } from '../data/orderData.js';
import { Payment, PaymentMethod, PaymentStatus } from '../types.js';

export const paymentRouter = Router();

// 处理支付
paymentRouter.post('/process', async (req: Request, res: Response) => {
  try {
    const { orderId, method, cardInfo } = req.body;
    
    if (!orderId || !method) {
      return res.status(400).json({ error: '订单ID和支付方式不能为空' });
    }
    
    const validMethods: PaymentMethod[] = ['card', 'visa', 'cash'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({ error: '无效的支付方式' });
    }
    
    // 获取订单
    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: '订单未找到' });
    }
    
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: '订单已取消' });
    }
    
    // 创建支付记录
    const payment: Payment = {
      id: uuidv4(),
      orderId: order.id,
      method,
      amount: order.totalAmount,
      status: 'processing',
      createdAt: new Date().toISOString(),
    };
    
    // 模拟支付处理
    let paymentResult;
    
    if (method === 'cash') {
      // 现金支付，标记为待支付（pending），等待到店支付
      payment.status = 'pending';
      payment.transactionId = `CASH-PENDING-${Date.now()}`;
      
      // 保存支付记录（待支付状态）
      const savedPayment = await addPayment(payment);
      
      // 更新订单支付信息（待支付状态）
      const orders = await getOrders();
      const orderIndex = orders.findIndex(o => o.id === order.id);
      if (orderIndex >= 0) {
        orders[orderIndex].paymentMethod = method;
        orders[orderIndex].paymentStatus = 'pending'; // 现金支付为待支付状态
        orders[orderIndex].paymentId = savedPayment.id;
        await saveOrders(orders);
      }
      
      // 现金支付时，订单状态保持为pending，等待商家开始制作
      // 不自动更新为preparing，需要商家手动开始制作
      
      return res.json({
        success: true,
        payment: savedPayment,
        message: '订单已提交，请等待商家备餐。备餐完成后，请前往前台支付现金。'
      });
    } else if (method === 'card' || method === 'visa') {
      // 银行卡/Visa支付：Stripe支付已在StripePaymentForm中完成
      // 这里只需要验证transactionId（Stripe Payment Intent ID）是否存在
      if (!cardInfo || !cardInfo.transactionId) {
        return res.status(400).json({ error: '支付交易ID缺失，支付可能未完成' });
      }
      
      // Stripe支付已经成功，直接标记为完成
      // transactionId 是 Stripe Payment Intent ID（例如：pi_xxx）
      paymentResult = {
        success: true,
        transactionId: cardInfo.transactionId,
        message: `${method === 'visa' ? 'Visa' : '银行卡'}支付成功`
      };
    }
    
    if (paymentResult && paymentResult.success) {
      payment.status = 'completed';
      payment.transactionId = paymentResult.transactionId;
      payment.paidAt = new Date().toISOString();
      
      // 保存Stripe交易信息到cardInfo
      if (cardInfo) {
        payment.cardInfo = {
          transactionId: cardInfo.transactionId,
        };
      }
      
      // 保存支付记录
      const savedPayment = await addPayment(payment);
      
      // 更新订单支付信息
      const orders = await getOrders();
      const orderIndex = orders.findIndex(o => o.id === order.id);
      if (orderIndex >= 0) {
        orders[orderIndex].paymentMethod = method;
        orders[orderIndex].paymentStatus = 'completed';
        orders[orderIndex].paymentId = savedPayment.id;
        // 银行卡/Visa支付成功后，订单状态自动更新为preparing
        if (method === 'card' || method === 'visa') {
          orders[orderIndex].status = 'preparing';
        }
        await saveOrders(orders);
      }
      
      // 更新订单状态（银行卡/Visa支付后自动开始制作）
      if (method === 'card' || method === 'visa') {
        await updateOrderStatus(order.id, 'preparing');
      }
      
      res.json({
        success: true,
        payment: savedPayment,
        message: paymentResult.message
      });
    } else {
      payment.status = 'failed';
      await addPayment(payment);
      
      // 更新订单支付状态
      const orders = await getOrders();
      const orderIndex = orders.findIndex(o => o.id === order.id);
      if (orderIndex >= 0) {
        orders[orderIndex].paymentStatus = 'failed';
        await saveOrders(orders);
      }
      
      res.status(400).json({
        success: false,
        error: paymentResult.message || '支付失败'
      });
    }
  } catch (error) {
    console.error('处理支付失败:', error);
    res.status(500).json({ error: '处理支付失败' });
  }
});

// 获取支付记录
paymentRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payment = await getPaymentById(id);
    
    if (payment) {
      res.json(payment);
    } else {
      res.status(404).json({ error: '支付记录未找到' });
    }
  } catch (error) {
    res.status(500).json({ error: '获取支付记录失败' });
  }
});

// 根据订单ID获取支付记录
paymentRouter.get('/order/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const payment = await getPaymentByOrderId(orderId);
    
    if (payment) {
      res.json(payment);
    } else {
      res.status(404).json({ error: '支付记录未找到' });
    }
  } catch (error) {
    res.status(500).json({ error: '获取支付记录失败' });
  }
});
