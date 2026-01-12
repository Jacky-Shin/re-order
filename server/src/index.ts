import express from 'express';
import cors from 'cors';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { menuRouter } from './routes/menu.js';
import { orderRouter } from './routes/order.js';
import { cartRouter } from './routes/cart.js';
import { paymentRouter } from './routes/payment.js';
import { merchantRouter } from './routes/merchant.js';
import { adminRouter } from './routes/admin.js';
import { uploadRouter } from './routes/upload.js';
import { printerRouter } from './routes/printer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5000;

// CORS配置 - 优化Safari兼容性
app.use(cors({
  origin: true, // 允许所有来源
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400 // 24小时
}));
// 增加请求体大小限制以支持 base64 图片
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务 - 提供上传的图片访问
app.use('/uploads', express.static(join(__dirname, '../public/uploads')));

app.use('/api/menu', menuRouter);
app.use('/api/orders', orderRouter);
app.use('/api/cart', cartRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/merchant', merchantRouter);
app.use('/api/admin', adminRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/printer', printerRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 根路径
app.get('/', (req, res) => {
  res.json({ 
    message: '星巴克点餐系统 API 服务器',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      menu: '/api/menu',
      orders: '/api/orders',
      cart: '/api/cart',
      payments: '/api/payments',
      merchant: '/api/merchant',
      admin: '/api/admin'
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`网络访问: http://0.0.0.0:${PORT}`);
});
