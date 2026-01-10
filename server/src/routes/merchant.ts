import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  getMerchantAccounts, 
  addMerchantAccount, 
  updateMerchantAccount, 
  deleteMerchantAccount,
  getDefaultAccount 
} from '../data/merchantData.js';
import { MerchantBankAccount } from '../types.js';

export const merchantRouter = Router();

// 获取所有收款账户
merchantRouter.get('/accounts', async (req: Request, res: Response) => {
  try {
    const accounts = await getMerchantAccounts();
    // 隐藏敏感信息
    const safeAccounts = accounts.map(acc => ({
      ...acc,
      accountNumber: maskAccountNumber(acc.accountNumber),
      cardNumber: acc.cardNumber ? maskCardNumber(acc.cardNumber) : undefined,
      cvv: undefined, // 不返回CVV
    }));
    res.json(safeAccounts);
  } catch (error) {
    res.status(500).json({ error: '获取账户列表失败' });
  }
});

// 获取默认收款账户
merchantRouter.get('/accounts/default', async (req: Request, res: Response) => {
  try {
    const account = await getDefaultAccount();
    if (account) {
      res.json({
        ...account,
        accountNumber: maskAccountNumber(account.accountNumber),
        cardNumber: account.cardNumber ? maskCardNumber(account.cardNumber) : undefined,
        cvv: undefined,
      });
    } else {
      res.status(404).json({ error: '未设置默认收款账户' });
    }
  } catch (error) {
    res.status(500).json({ error: '获取默认账户失败' });
  }
});

// 添加收款账户
merchantRouter.post('/accounts', async (req: Request, res: Response) => {
  try {
    const { bankName, accountName, accountNumber, cardNumber, expiryDate, cvv, isDefault } = req.body;
    
    if (!bankName || !accountName || !accountNumber) {
      return res.status(400).json({ error: '银行名称、账户名和账号不能为空' });
    }
    
    const account: MerchantBankAccount = {
      id: uuidv4(),
      bankName,
      accountName,
      accountNumber,
      cardNumber,
      expiryDate,
      cvv,
      isDefault: isDefault || false,
      createdAt: new Date().toISOString(),
    };
    
    const savedAccount = await addMerchantAccount(account);
    
    // 返回时隐藏敏感信息
    res.status(201).json({
      ...savedAccount,
      accountNumber: maskAccountNumber(savedAccount.accountNumber),
      cardNumber: savedAccount.cardNumber ? maskCardNumber(savedAccount.cardNumber) : undefined,
      cvv: undefined,
    });
  } catch (error) {
    console.error('添加账户失败:', error);
    res.status(500).json({ error: '添加账户失败' });
  }
});

// 更新收款账户
merchantRouter.put('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // 如果更新了账号，需要掩码处理
    if (updates.accountNumber) {
      updates.accountNumber = updates.accountNumber;
    }
    if (updates.cardNumber) {
      updates.cardNumber = updates.cardNumber;
    }
    
    const updated = await updateMerchantAccount(id, updates);
    
    if (updated) {
      res.json({
        ...updated,
        accountNumber: maskAccountNumber(updated.accountNumber),
        cardNumber: updated.cardNumber ? maskCardNumber(updated.cardNumber) : undefined,
        cvv: undefined,
      });
    } else {
      res.status(404).json({ error: '账户未找到' });
    }
  } catch (error) {
    res.status(500).json({ error: '更新账户失败' });
  }
});

// 删除收款账户
merchantRouter.delete('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteMerchantAccount(id);
    
    if (deleted) {
      res.json({ success: true, message: '账户已删除' });
    } else {
      res.status(404).json({ error: '账户未找到' });
    }
  } catch (error) {
    res.status(500).json({ error: '删除账户失败' });
  }
});

// 辅助函数：掩码账号
function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return '****' + accountNumber.slice(-4);
}

// 辅助函数：掩码卡号
function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length <= 4) return cleaned;
  return '**** **** **** ' + cleaned.slice(-4);
}
