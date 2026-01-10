import { Order } from '../types.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataPath = join(__dirname, '../../data/orders.json');

export async function getOrders(): Promise<Order[]> {
  try {
    const data = await readFile(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function saveOrders(orders: Order[]): Promise<void> {
  await writeFile(dataPath, JSON.stringify(orders, null, 2), 'utf-8');
}

export async function addOrder(order: Order): Promise<Order> {
  const orders = await getOrders();
  orders.push(order);
  await saveOrders(orders);
  return order;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const orders = await getOrders();
  return orders.find(o => o.id === id) || null;
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
  const orders = await getOrders();
  const order = orders.find(o => o.id === id);
  if (order) {
    order.status = status;
    await saveOrders(orders);
    return order;
  }
  return null;
}
