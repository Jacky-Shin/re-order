/**
 * Vercel Serverless Function
 * 确认支付并更新订单状态
 * 
 * 路径: /api/payment/confirm-payment
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
