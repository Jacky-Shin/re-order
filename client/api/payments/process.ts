/**
 * Vercel Serverless Function
 * 处理支付并更新订单状态
 * 
 * 路径: /api/payments/process
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export default async function handler(req: any, res: any) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理OPTIONS请求（CORS预检）
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, method, cardInfo } = req.body;

    if (!orderId || !method) {
      return res.status(400).json({ error: '订单ID和支付方式不能为空' });
    }

    const validMethods = ['card', 'visa', 'cash'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({ error: '无效的支付方式' });
    }

    // 注意：在Vercel Serverless Function中，我们需要使用Firebase或外部数据库
    // 这里我们返回成功，实际的数据更新应该在前端通过localApi或Firebase完成
    // 或者需要配置一个外部API来存储数据

    if (method === 'cash') {
      // 现金支付：返回pending状态
      return res.status(200).json({
        success: true,
        payment: {
          id: `payment_${Date.now()}`,
          orderId,
          method: 'cash',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
        message: '订单已提交，请等待商家备餐。备餐完成后，请前往前台支付现金。',
      });
    } else if (method === 'card' || method === 'visa') {
      // 银行卡/Visa支付：验证transactionId
      if (!cardInfo || !cardInfo.transactionId) {
        return res.status(400).json({ error: '支付交易ID缺失，支付可能未完成' });
      }

      // 验证Stripe Payment Intent
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(cardInfo.transactionId);
        
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({
            success: false,
            error: `支付状态不正确: ${paymentIntent.status}`,
          });
        }

        // 支付成功，返回成功响应
        // 注意：实际的数据保存应该通过Firebase或前端localApi完成
        const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return res.status(200).json({
          success: true,
          payment: {
            id: paymentId,
            orderId,
            method,
            amount: paymentIntent.amount / 100,
            status: 'completed',
            transactionId: paymentIntent.id,
            cardInfo: {
              transactionId: paymentIntent.id,
            },
            paidAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
          message: `${method === 'visa' ? 'Visa' : '银行卡'}支付成功`,
        });
      } catch (stripeError: any) {
        console.error('Stripe验证失败:', stripeError);
        return res.status(400).json({
          success: false,
          error: '支付验证失败: ' + (stripeError.message || '未知错误'),
        });
      }
    }

    return res.status(400).json({ error: '不支持的支付方式' });
  } catch (error: any) {
    console.error('处理支付失败:', error);
    return res.status(500).json({
      error: error.message || '处理支付失败',
    });
  }
}

