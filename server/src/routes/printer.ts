import { Router, Request, Response } from 'express';
import { printOrderReceipt, testPrinterConnection } from '../services/printerService.js';
import * as orderData from '../data/orderData.js';
import * as paymentData from '../data/paymentData.js';

export const printerRouter = Router();

/**
 * 打印订单小票
 * POST /api/printer/print-order
 */
printerRouter.post('/print-order', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        error: '订单ID不能为空' 
      });
    }

    // 获取订单信息
    const order = await orderData.getById(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: '订单不存在' 
      });
    }

    // 获取支付信息（如果存在）
    let payment = null;
    if (order.paymentId) {
      try {
        payment = await paymentData.getById(order.paymentId);
      } catch (error) {
        console.warn('获取支付信息失败:', error);
      }
    }

    // 执行打印
    await printOrderReceipt(order, payment || undefined);

    res.json({ 
      success: true, 
      message: '打印成功' 
    });
  } catch (error: any) {
    console.error('打印订单失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '打印失败' 
    });
  }
});

/**
 * 测试打印机连接
 * GET /api/printer/test
 */
printerRouter.get('/test', async (req: Request, res: Response) => {
  try {
    const isConnected = await testPrinterConnection();
    
    if (isConnected) {
      res.json({ 
        success: true, 
        message: '打印机连接正常',
        connected: true 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: '无法连接到打印机',
        connected: false 
      });
    }
  } catch (error: any) {
    console.error('测试打印机连接失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '测试失败',
      connected: false 
    });
  }
});

