import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const counterPath = join(__dirname, '../../data/orderCounter.json');

interface OrderCounter {
  totalOrders: number; // 总订单数（持续递增）
  lastPickupDate: string; // 最后取单日期 YYYY-MM-DD
  dailyPickupCount: number; // 当天的取单号计数
}

// 使用队列机制确保原子操作，防止并发竞争条件
let counterQueue: Promise<any> = Promise.resolve();

async function getCounter(): Promise<OrderCounter> {
  try {
    const data = await readFile(counterPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {
      totalOrders: 0,
      lastPickupDate: '',
      dailyPickupCount: 0,
    };
  }
}

async function saveCounter(counter: OrderCounter): Promise<void> {
  await writeFile(counterPath, JSON.stringify(counter, null, 2), 'utf-8');
}

export async function getNextOrderInfo(): Promise<{ orderNumber: string; orderCode: string; pickupNumber: number; pickupDate: string }> {
  // 将操作加入队列，确保同一时间只有一个请求在处理计数器
  return new Promise((resolve, reject) => {
    counterQueue = counterQueue.then(async () => {
      try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const counter = await getCounter();
        
        // 如果是新的一天，重置取单号计数
        if (counter.lastPickupDate !== today) {
          counter.lastPickupDate = today;
          counter.dailyPickupCount = 0;
        }
        
        // 增加总订单数和取单号
        counter.totalOrders += 1;
        counter.dailyPickupCount += 1;
        
        await saveCounter(counter);
        
        // 生成订单号：SB + 总订单数（6位，补零）
        const orderNumber = `SB${counter.totalOrders.toString().padStart(6, '0')}`;
        
        // 生成订单编码：年月日+7位随机字符（数字+字母）
        const dateStr = today.replace(/-/g, ''); // YYYYMMDD
        const randomChars = Math.random().toString(36).substring(2, 9).toUpperCase();
        const orderCode = `${dateStr}${randomChars}`;
        
        resolve({
          orderNumber,
          orderCode,
          pickupNumber: counter.dailyPickupCount,
          pickupDate: today,
        });
      } catch (error) {
        reject(error);
      }
    }).catch(reject);
  });
}

export async function getOrderStats() {
  const counter = await getCounter();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  
  // 获取所有订单来计算月订单数
  const { getOrders } = await import('./orderData.js');
  const orders = await getOrders();
  
  const todayOrders = orders.filter(o => o.pickupDate && o.pickupDate === today);
  const monthOrders = orders.filter(o => o.pickupDate && o.pickupDate >= firstDayOfMonth);
  
  return {
    totalOrders: counter.totalOrders,
    todayOrders: todayOrders.length,
    monthOrders: monthOrders.length,
    todayPickupCount: counter.lastPickupDate === today ? counter.dailyPickupCount : 0,
  };
}
