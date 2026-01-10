import { MenuItem } from '../types.js';

export const menuData: MenuItem[] = [
  {
    id: '1',
    name: '美式咖啡',
    nameEn: 'Caffè Americano',
    category: '经典咖啡',
    price: 25,
    image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400',
    description: '浓郁醇厚的意式浓缩咖啡，加入热水调制而成',
    sizes: [
      { name: '中杯', price: 0 },
      { name: '大杯', price: 3 },
      { name: '超大杯', price: 6 }
    ],
    customizations: [
      {
        id: 'milk',
        name: '奶类选择',
        required: false,
        options: [
          { id: 'none', name: '无', price: 0 },
          { id: 'whole', name: '全脂奶', price: 0 },
          { id: 'skim', name: '脱脂奶', price: 0 },
          { id: 'soy', name: '豆奶', price: 3 },
          { id: 'oat', name: '燕麦奶', price: 5 }
        ]
      },
      {
        id: 'shots',
        name: '浓缩咖啡份数',
        required: false,
        options: [
          { id: 'single', name: '单份', price: 0 },
          { id: 'double', name: '双份', price: 5 },
          { id: 'triple', name: '三份', price: 10 }
        ]
      }
    ],
    available: true
  },
  {
    id: '2',
    name: '拿铁',
    nameEn: 'Caffè Latte',
    category: '经典咖啡',
    price: 32,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
    description: '意式浓缩咖啡与蒸煮牛奶的完美融合',
    sizes: [
      { name: '中杯', price: 0 },
      { name: '大杯', price: 3 },
      { name: '超大杯', price: 6 }
    ],
    customizations: [
      {
        id: 'milk',
        name: '奶类选择',
        required: false,
        options: [
          { id: 'whole', name: '全脂奶', price: 0 },
          { id: 'skim', name: '脱脂奶', price: 0 },
          { id: 'soy', name: '豆奶', price: 3 },
          { id: 'oat', name: '燕麦奶', price: 5 }
        ]
      }
    ],
    available: true
  },
  {
    id: '3',
    name: '卡布奇诺',
    nameEn: 'Cappuccino',
    category: '经典咖啡',
    price: 32,
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
    description: '意式浓缩咖啡、蒸煮牛奶和丰厚奶泡的经典组合',
    sizes: [
      { name: '中杯', price: 0 },
      { name: '大杯', price: 3 },
      { name: '超大杯', price: 6 }
    ],
    available: true
  },
  {
    id: '4',
    name: '焦糖玛奇朵',
    nameEn: 'Caramel Macchiato',
    category: '经典咖啡',
    price: 38,
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400',
    description: '香草糖浆、新鲜蒸奶、意式浓缩咖啡和焦糖酱的完美融合',
    sizes: [
      { name: '中杯', price: 0 },
      { name: '大杯', price: 3 },
      { name: '超大杯', price: 6 }
    ],
    available: true
  },
  {
    id: '5',
    name: '摩卡',
    nameEn: 'Caffè Mocha',
    category: '经典咖啡',
    price: 38,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    description: '意式浓缩咖啡、摩卡酱、蒸煮牛奶和奶油的完美融合',
    sizes: [
      { name: '中杯', price: 0 },
      { name: '大杯', price: 3 },
      { name: '超大杯', price: 6 }
    ],
    available: true
  },
  {
    id: '6',
    name: '星冰乐（香草）',
    nameEn: 'Vanilla Frappuccino',
    category: '星冰乐',
    price: 38,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400',
    description: '香草风味的星冰乐，顶部覆盖奶油',
    sizes: [
      { name: '中杯', price: 0 },
      { name: '大杯', price: 3 },
      { name: '超大杯', price: 6 }
    ],
    available: true
  },
  {
    id: '7',
    name: '星冰乐（焦糖）',
    nameEn: 'Caramel Frappuccino',
    category: '星冰乐',
    price: 40,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400',
    description: '焦糖风味的星冰乐，顶部覆盖奶油和焦糖酱',
    sizes: [
      { name: '中杯', price: 0 },
      { name: '大杯', price: 3 },
      { name: '超大杯', price: 6 }
    ],
    available: true
  },
  {
    id: '8',
    name: '星冰乐（摩卡）',
    nameEn: 'Mocha Frappuccino',
    category: '星冰乐',
    price: 40,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400',
    description: '摩卡风味的星冰乐，顶部覆盖奶油',
    sizes: [
      { name: '中杯', price: 0 },
      { name: '大杯', price: 3 },
      { name: '超大杯', price: 6 }
    ],
    available: true
  },
  {
    id: '9',
    name: '抹茶拿铁',
    nameEn: 'Matcha Latte',
    category: '茶饮',
    price: 35,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
    description: '优质抹茶粉与蒸煮牛奶的完美融合',
    sizes: [
      { name: '中杯', price: 0 },
      { name: '大杯', price: 3 },
      { name: '超大杯', price: 6 }
    ],
    available: true
  },
  {
    id: '10',
    name: '英式红茶拿铁',
    nameEn: 'English Breakfast Tea Latte',
    category: '茶饮',
    price: 32,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
    description: '经典英式红茶与蒸煮牛奶的完美融合',
    sizes: [
      { name: '中杯', price: 0 },
      { name: '大杯', price: 3 },
      { name: '超大杯', price: 6 }
    ],
    available: true
  },
  {
    id: '11',
    name: '蓝莓芝士蛋糕',
    nameEn: 'Blueberry Cheesecake',
    category: '甜品',
    price: 32,
    image: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400',
    description: '经典蓝莓芝士蛋糕，口感浓郁',
    available: true
  },
  {
    id: '12',
    name: '提拉米苏',
    nameEn: 'Tiramisu',
    category: '甜品',
    price: 35,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
    description: '经典意式提拉米苏，咖啡与奶香的完美结合',
    available: true
  },
  {
    id: '13',
    name: '可颂',
    nameEn: 'Croissant',
    category: '轻食',
    price: 18,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400',
    description: '经典法式可颂，外酥内软',
    available: true
  },
  {
    id: '14',
    name: '三明治（火腿芝士）',
    nameEn: 'Ham & Cheese Sandwich',
    category: '轻食',
    price: 28,
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400',
    description: '新鲜火腿、芝士和蔬菜的三明治',
    available: true
  }
];
