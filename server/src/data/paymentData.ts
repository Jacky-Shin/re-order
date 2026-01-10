import { Payment } from '../types.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataPath = join(__dirname, '../../data/payments.json');

export async function getPayments(): Promise<Payment[]> {
  try {
    const data = await readFile(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function savePayments(payments: Payment[]): Promise<void> {
  await writeFile(dataPath, JSON.stringify(payments, null, 2), 'utf-8');
}

export async function addPayment(payment: Payment): Promise<Payment> {
  const payments = await getPayments();
  payments.push(payment);
  await savePayments(payments);
  return payment;
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  const payments = await getPayments();
  return payments.find(p => p.id === id) || null;
}

export async function getPaymentByOrderId(orderId: string): Promise<Payment | null> {
  const payments = await getPayments();
  return payments.find(p => p.orderId === orderId) || null;
}

export async function updatePaymentStatus(id: string, status: Payment['status'], transactionId?: string): Promise<Payment | null> {
  const payments = await getPayments();
  const payment = payments.find(p => p.id === id);
  if (payment) {
    payment.status = status;
    if (transactionId) {
      payment.transactionId = transactionId;
    }
    if (status === 'completed') {
      payment.paidAt = new Date().toISOString();
    }
    await savePayments(payments);
    return payment;
  }
  return null;
}
