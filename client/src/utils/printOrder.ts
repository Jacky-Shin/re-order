import { Order, Payment } from '../types';

/**
 * 打印订单小票
 */
export async function printOrder(order: Order, payment?: Payment) {
  try {
    // 创建打印窗口
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.warn('无法打开打印窗口，可能被浏览器阻止');
      return;
    }

    // 生成小票HTML内容
    const receiptHtml = generateReceiptHTML(order, payment);

    // 写入内容
    printWindow.document.write(receiptHtml);
    printWindow.document.close();

    // 等待内容加载完成后打印
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // 打印后关闭窗口（可选）
        // printWindow.close();
      }, 250);
    };
  } catch (error) {
    console.error('打印订单失败:', error);
  }
}

/**
 * 生成小票HTML内容
 */
function generateReceiptHTML(order: Order, payment?: Payment): string {
  const shopName = '星巴克咖啡';
  const date = new Date(order.createdAt).toLocaleString('zh-CN');
  const paymentMethod = payment?.method || order.paymentMethod || '现金';
  const paymentStatus = payment?.status || order.paymentStatus || 'pending';

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>订单小票</title>
      <style>
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 10mm;
          }
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          max-width: 80mm;
          margin: 0 auto;
          padding: 10mm;
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .shop-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .order-info {
          margin: 10px 0;
        }
        .order-info div {
          margin: 3px 0;
        }
        .items {
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 10px 0;
          margin: 10px 0;
        }
        .item {
          margin: 5px 0;
          display: flex;
          justify-content: space-between;
        }
        .item-name {
          flex: 1;
        }
        .item-quantity {
          margin: 0 5px;
        }
        .item-price {
          text-align: right;
          min-width: 60px;
        }
        .total {
          text-align: right;
          font-size: 16px;
          font-weight: bold;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 2px dashed #000;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px dashed #000;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="shop-name">${shopName}</div>
        <div>${date}</div>
      </div>
      
      <div class="order-info">
        <div>订单号: ${order.orderNumber}</div>
        ${order.orderCode ? `<div>订单编码: ${order.orderCode}</div>` : ''}
        ${order.pickupNumber ? `<div>取单号: ${order.pickupNumber}</div>` : ''}
        ${order.tableNumber ? `<div>桌位: ${order.tableNumber}</div>` : ''}
        <div>支付方式: ${getPaymentMethodText(paymentMethod)}</div>
        <div>支付状态: ${getPaymentStatusText(paymentStatus)}</div>
      </div>
      
      <div class="items">
        ${order.items.map(item => `
          <div class="item">
            <span class="item-name">${item.name}${item.size ? ` (${item.size})` : ''}</span>
            <span class="item-quantity">x${item.quantity}</span>
            <span class="item-price">¥${(item.price * item.quantity).toFixed(2)}</span>
          </div>
          ${item.customizations && item.customizations.length > 0 ? `
            ${item.customizations.map(c => `
              <div class="item" style="padding-left: 10px; font-size: 10px;">
                <span>+ ${c.name}</span>
                <span class="item-price">¥${c.price.toFixed(2)}</span>
              </div>
            `).join('')}
          ` : ''}
        `).join('')}
      </div>
      
      <div class="total">
        总计: ¥${order.totalAmount.toFixed(2)}
      </div>
      
      ${order.customerName || order.phone ? `
        <div class="order-info" style="margin-top: 10px;">
          ${order.customerName ? `<div>客户: ${order.customerName}</div>` : ''}
          ${order.phone ? `<div>电话: ${order.phone}</div>` : ''}
        </div>
      ` : ''}
      
      <div class="footer">
        感谢您的光临！<br>
        欢迎再次惠顾
      </div>
    </body>
    </html>
  `;

  return html;
}

function getPaymentMethodText(method: string): string {
  const methodMap: Record<string, string> = {
    cash: '现金',
    card: '银行卡',
    visa: 'Visa',
  };
  return methodMap[method] || method;
}

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

