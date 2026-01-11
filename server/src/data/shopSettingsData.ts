import { ShopSettings } from '../types.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataPath = join(__dirname, '../../data/shopSettings.json');

const DEFAULT_SETTINGS: ShopSettings = {
  id: 'default',
  name: '星巴克',
  nameEn: 'Starbucks',
  description: '欢迎光临星巴克',
  descriptionEn: 'Welcome to Starbucks',
  bannerImages: [],
  logo: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// 内存存储（用于 Vercel 等只读文件系统环境）
let memoryStore: ShopSettings | null = null;

// 检查是否在只读文件系统环境（如 Vercel）
const isReadOnlyFileSystem = () => {
  // 检查环境变量或尝试写入文件
  return process.env.VERCEL === '1' || process.env.NOW_REGION !== undefined;
};

export async function getShopSettings(): Promise<ShopSettings> {
  // 如果在只读文件系统环境，使用内存存储
  if (isReadOnlyFileSystem()) {
    if (memoryStore) {
      return memoryStore;
    }
    memoryStore = { ...DEFAULT_SETTINGS };
    return memoryStore;
  }

  // 否则尝试从文件读取
  try {
    const data = await readFile(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // 如果文件不存在，尝试创建
    try {
      await saveShopSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    } catch (writeError) {
      // 如果写入失败（可能是只读文件系统），使用内存存储
      console.warn('无法写入文件系统，使用内存存储:', writeError);
      memoryStore = { ...DEFAULT_SETTINGS };
      return memoryStore;
    }
  }
}

export async function saveShopSettings(settings: ShopSettings): Promise<void> {
  settings.updatedAt = new Date().toISOString();
  
  // 如果在只读文件系统环境，只更新内存存储
  if (isReadOnlyFileSystem()) {
    memoryStore = settings;
    return;
  }

  // 否则尝试写入文件
  try {
    await writeFile(dataPath, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (error) {
    // 如果写入失败，使用内存存储
    console.warn('无法写入文件系统，使用内存存储:', error);
    memoryStore = settings;
  }
}

export async function updateShopSettings(updates: Partial<ShopSettings>): Promise<ShopSettings> {
  const settings = await getShopSettings();
  const updated = { ...settings, ...updates };
  await saveShopSettings(updated);
  return updated;
}

