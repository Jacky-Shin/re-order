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

export async function getShopSettings(): Promise<ShopSettings> {
  try {
    const data = await readFile(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // 如果文件不存在，返回默认设置
    await saveShopSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
}

export async function saveShopSettings(settings: ShopSettings): Promise<void> {
  settings.updatedAt = new Date().toISOString();
  await writeFile(dataPath, JSON.stringify(settings, null, 2), 'utf-8');
}

export async function updateShopSettings(updates: Partial<ShopSettings>): Promise<ShopSettings> {
  const settings = await getShopSettings();
  const updated = { ...settings, ...updates };
  await saveShopSettings(updated);
  return updated;
}

