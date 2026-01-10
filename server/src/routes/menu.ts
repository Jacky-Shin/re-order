import { Router } from 'express';
import { menuData } from '../data/menuData.js';

export const menuRouter = Router();

// 获取所有菜单
menuRouter.get('/', (req, res) => {
  res.json(menuData);
});

// 获取菜单分类
menuRouter.get('/categories', (req, res) => {
  const categories = Array.from(new Set(menuData.map(item => item.category)));
  res.json(categories);
});

// 根据分类获取菜单
menuRouter.get('/category/:category', (req, res) => {
  const { category } = req.params;
  const items = menuData.filter(item => item.category === category);
  res.json(items);
});

// 根据ID获取菜单项
menuRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const item = menuData.find(item => item.id === id);
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ error: '菜单项未找到' });
  }
});
