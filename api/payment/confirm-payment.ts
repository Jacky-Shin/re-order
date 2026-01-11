/**
 * Vercel Serverless Function
 * 确认支付并更新订单状态
 * 
 * 路径: /api/payment/confirm-payment
 * 
 * 注意：此文件需要放在项目根目录的 api/ 文件夹中
 * Vercel会自动识别并部署为Serverless Function
 */

// @ts-ignore - Stripe类型定义
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
    // 检查Stripe密钥是否配置
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY未配置');
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    const { paymentIntentId, orderId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    // 获取支付意图状态
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      return res.status(200).json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100, // 转换回元
          currency: paymentIntent.currency,
          paymentMethod: paymentIntent.payment_method,
          created: new Date(paymentIntent.created * 1000).toISOString(),
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        error: `Payment status: ${paymentIntent.status}`,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
        },
      });
    }
  } catch (error: any) {
    console.error('确认支付失败:', error);
    return res.status(500).json({
      error: error.message || 'Failed to confirm payment',
    });
  }
}
