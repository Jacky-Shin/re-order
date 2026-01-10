import { MerchantBankAccount } from '../types.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataPath = join(__dirname, '../../data/merchant.json');

export async function getMerchantAccounts(): Promise<MerchantBankAccount[]> {
  try {
    const data = await readFile(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function saveMerchantAccounts(accounts: MerchantBankAccount[]): Promise<void> {
  await writeFile(dataPath, JSON.stringify(accounts, null, 2), 'utf-8');
}

export async function addMerchantAccount(account: MerchantBankAccount): Promise<MerchantBankAccount> {
  const accounts = await getMerchantAccounts();
  
  // 如果设置为默认，取消其他默认账户
  if (account.isDefault) {
    accounts.forEach(acc => {
      if (acc.id !== account.id) {
        acc.isDefault = false;
      }
    });
  }
  
  accounts.push(account);
  await saveMerchantAccounts(accounts);
  return account;
}

export async function updateMerchantAccount(id: string, updates: Partial<MerchantBankAccount>): Promise<MerchantBankAccount | null> {
  const accounts = await getMerchantAccounts();
  const account = accounts.find(a => a.id === id);
  
  if (account) {
    Object.assign(account, updates);
    
    // 如果设置为默认，取消其他默认账户
    if (updates.isDefault) {
      accounts.forEach(acc => {
        if (acc.id !== id) {
          acc.isDefault = false;
        }
      });
    }
    
    await saveMerchantAccounts(accounts);
    return account;
  }
  
  return null;
}

export async function deleteMerchantAccount(id: string): Promise<boolean> {
  const accounts = await getMerchantAccounts();
  const filtered = accounts.filter(a => a.id !== id);
  
  if (filtered.length !== accounts.length) {
    await saveMerchantAccounts(filtered);
    return true;
  }
  
  return false;
}

export async function getDefaultAccount(): Promise<MerchantBankAccount | null> {
  const accounts = await getMerchantAccounts();
  return accounts.find(a => a.isDefault) || accounts[0] || null;
}
