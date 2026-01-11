/**
 * Vercel Serverless Function
 * 创建Stripe支付意图（Payment Intent）
 * 
 * 路径: /api/payment/create-payment-intent
 */

import Stripe from 'stripe';

// 初始化Stripe（使用服务器端密钥）
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

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 检查Stripe密钥是否配置
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY未配置');
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    const { amount, currency = 'USD', orderId, metadata = {} } = req.body;

    // 验证金额
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // 创建支付意图
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // 转换为分（Stripe使用最小货币单位）
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true, // 自动启用所有可用的支付方式（包括Visa、Mastercard等）
      },
      metadata: {
        orderId: orderId || '',
        ...metadata,
      },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('创建支付意图失败:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create payment intent',
    });
  }
}
