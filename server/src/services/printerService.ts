import { createRequire } from 'module';
import { Order, Payment } from '../types.js';

// node-thermal-printer 是 CommonJS 模块，需要使用 createRequire 导入
const require = createRequire(import.meta.url);
const thermalPrinter = require('node-thermal-printer');
const Printer = thermalPrinter.printer || thermalPrinter.ThermalPrinter;
const PrinterTypes = thermalPrinter.types || thermalPrinter.PrinterTypes;

// 打印机配置（从环境变量读取，或使用默认值）
const PRINTER_IP = process.env.PRINTER_IP || '192.168.1.100';
const PRINTER_PORT = parseInt(process.env.PRINTER_PORT || '9100');
const PRINTER_TYPE = process.env.PRINTER_TYPE || 'EPSON'; // EPSON, STAR, EPOS

/**
 * 初始化打印机
 */
function createPrinter(): InstanceType<typeof Printer> {
  const printerType = PRINTER_TYPE as keyof typeof PrinterTypes;
  
  const printer = new Printer({
    type: PrinterTypes[printerType] || PrinterTypes.EPSON,
    interface: `tcp://${PRINTER_IP}:${PRINTER_PORT}`,
    characterSet: 'SLOVENIA', // 支持中文
    removeSpecialCharacters: false,
    lineCharacter: '=',
    breakLine: '\n',
    options: {
      timeout: 3000,
    },
  });

  return printer;
}

/**
 * 打印订单小票
 */
export async function printOrderReceipt(order: Order, payment?: Payment): Promise<void> {
  const printer = createPrinter();
  
  try {
    // 检查打印机连接
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error(`无法连接到打印机 ${PRINTER_IP}:${PRINTER_PORT}`);
    }

    // 开始打印
    printer.clear();
    
    // 标题
    printer.alignCenter();
    printer.setTextSize(1, 1);
    printer.bold(true);
    printer.println('星巴克咖啡');
    printer.bold(false);
    printer.drawLine();
    printer.newLine();

    // 订单信息
    printer.alignLeft();
    printer.setTextNormal();
    printer.println(`订单号: ${order.orderNumber}`);
    
    if (order.orderCode) {
      printer.println(`订单编码: ${order.orderCode}`);
    }
    
    if (order.pickupNumber) {
      printer.setTextSize(1, 1);
      printer.bold(true);
      printer.println(`取单号: ${order.pickupNumber}`);
      printer.bold(false);
      printer.setTextNormal();
    }
    
    if (order.tableNumber) {
      printer.println(`桌位: ${order.tableNumber}`);
    }
    
    printer.println(`时间: ${new Date(order.createdAt).toLocaleString('zh-CN')}`);
    printer.drawLine();
    printer.newLine();

    // 商品明细
    printer.alignLeft();
    order.items.forEach((item) => {
      // 商品名称和数量
      printer.setTextSize(1, 1);
      printer.bold(true);
      printer.println(`${item.name} x${item.quantity}`);
      printer.bold(false);
      printer.setTextNormal();
      
      // 尺寸
      if (item.size) {
        printer.println(`  尺寸: ${item.size}`);
      }
      
      // 自定义选项
      if (item.customizations && item.customizations.length > 0) {
        item.customizations.forEach((custom) => {
          printer.println(`  + ${custom.name}`);
        });
      }
      
      // 价格
      const itemTotal = (item.price * item.quantity) + 
        (item.customizations?.reduce((sum, c) => sum + c.price, 0) || 0);
      printer.alignRight();
      printer.println(`¥${itemTotal.toFixed(2)}`);
      printer.alignLeft();
      printer.newLine();
    });

    printer.drawLine();
    printer.newLine();

    // 总计
    printer.alignRight();
    printer.setTextSize(1, 1);
    printer.bold(true);
    printer.println(`总计: ¥${order.totalAmount.toFixed(2)}`);
    printer.bold(false);
    printer.setTextNormal();
    printer.alignLeft();
    printer.newLine();

    // 支付信息
    if (payment || order.paymentMethod) {
      printer.drawLine();
      const paymentMethod = payment?.method || order.paymentMethod || '现金';
      const paymentStatus = payment?.status || order.paymentStatus || 'pending';
      
      printer.println(`支付方式: ${getPaymentMethodText(paymentMethod)}`);
      printer.println(`支付状态: ${getPaymentStatusText(paymentStatus)}`);
      
      if (payment?.transactionId) {
        printer.println(`交易号: ${payment.transactionId}`);
      }
      
      if (payment?.paidAt) {
        printer.println(`支付时间: ${new Date(payment.paidAt).toLocaleString('zh-CN')}`);
      }
      printer.newLine();
    }

    // 客户信息
    if (order.customerName || order.phone) {
      printer.drawLine();
      if (order.customerName) {
        printer.println(`客户: ${order.customerName}`);
      }
      if (order.phone) {
        printer.println(`电话: ${order.phone}`);
      }
      printer.newLine();
    }

    // 底部信息
    printer.alignCenter();
    printer.drawLine();
    printer.println('感谢您的光临！');
    printer.println('欢迎再次惠顾');
    printer.newLine();
    printer.newLine();
    printer.newLine();
    
    // 切纸（如果打印机支持）
    printer.cut();

    // 执行打印
    await printer.execute();
    
    console.log(`✅ 订单 ${order.orderNumber} 打印成功`);
  } catch (error: any) {
    console.error('❌ 打印失败:', error);
    throw new Error(`打印失败: ${error.message}`);
  }
}

/**
 * 测试打印机连接
 */
export async function testPrinterConnection(): Promise<boolean> {
  try {
    const printer = createPrinter();
    const isConnected = await printer.isPrinterConnected();
    return isConnected;
  } catch (error) {
    console.error('打印机连接测试失败:', error);
    return false;
  }
}

/**
 * 获取支付方式文本
 */
function getPaymentMethodText(method: string): string {
  const methodMap: Record<string, string> = {
    cash: '现金',
    card: '银行卡',
    visa: 'Visa',
  };
  return methodMap[method] || method;
}

/**
 * 获取支付状态文本
 */
function getPaymentStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待支付',
    processing: '处理中',
    completed: '已支付',
    failed: '支付失败',
    cancelled: '已取消',
  };
  return statusMap[status] || status;
}

