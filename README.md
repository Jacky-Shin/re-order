# 星巴克扫码点餐系统

一个功能完整的星巴克扫码点餐系统，包含前端和后端，支持菜单浏览、购物车管理、订单提交和状态跟踪等功能。**完美支持手机扫码点餐！**

## 功能特性

- ✅ **扫码点餐** - 手机扫描二维码即可进入点餐页面
- ✅ **二维码生成** - 商家可生成二维码供顾客扫描
- ✅ **移动端优化** - 完美适配手机端，支持PWA
- ✅ **菜单浏览** - 分类浏览商品，查看详细信息
- ✅ **商品定制** - 选择规格、奶类、浓缩份数等定制选项
- ✅ **购物车管理** - 添加、删除、修改商品数量和规格
- ✅ **订单提交** - 提交订单并填写联系信息
- ✅ **支付功能** - 模拟支付流程
- ✅ **订单跟踪** - 实时查看订单状态（待支付、制作中、待取餐、已完成）
- ✅ **响应式设计** - 适配移动端和桌面端

## 技术栈

### 前端
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- QRCode.react (二维码生成)

### 后端
- Node.js
- Express
- TypeScript
- JSON文件存储（可轻松替换为数据库）

## 项目结构

```
starbucks-order-system/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   │   ├── ScanPage.tsx      # 扫码页面
│   │   │   ├── QRCodePage.tsx    # 二维码生成页面（商家用）
│   │   │   ├── MenuPage.tsx      # 菜单页面
│   │   │   └── ...
│   │   ├── contexts/       # React Context
│   │   ├── api/           # API客户端
│   │   └── types.ts       # TypeScript类型定义
│   └── package.json
├── server/                 # 后端服务
│   ├── src/
│   │   ├── routes/        # API路由
│   │   ├── data/          # 数据文件
│   │   └── types.ts       # TypeScript类型定义
│   └── package.json
└── package.json           # 根package.json
```

## 安装和运行

### 前置要求
- Node.js 18+ 
- npm 或 yarn

### 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 运行项目

#### 方式一：同时运行前后端（推荐）

在项目根目录运行：

```bash
npm run dev
```

这将同时启动：
- 后端服务器：http://localhost:5000
- 前端应用：http://localhost:3000

#### 方式二：分别运行

**启动后端：**
```bash
cd server
npm run dev
```

**启动前端（新终端）：**
```bash
cd client
npm run dev
```

## 使用说明

### 商家端 - 生成二维码

1. **访问二维码生成页面**
   - 打开浏览器访问：http://localhost:3000/qrcode
   - 输入桌号（可选）
   - 修改基础URL为实际部署地址（部署后）

2. **生成和打印二维码**
   - 点击"下载二维码"保存图片
   - 或点击"打印二维码"直接打印
   - 将二维码放置在对应餐桌上

### 顾客端 - 扫码点餐

1. **扫码进入**
   - 使用手机扫描桌上的二维码
   - 或直接访问 http://localhost:3000 点击"开始点餐"

2. **浏览菜单**
   - 选择分类查看不同类别的商品
   - 点击商品查看详细信息

3. **添加商品**
   - 选择规格（中杯/大杯/超大杯）
   - 选择定制选项（奶类、浓缩份数等）
   - 选择数量
   - 点击"加入购物车"

4. **购物车管理**
   - 查看购物车中的商品
   - 修改商品数量
   - 删除不需要的商品
   - 点击"去结算"

5. **提交订单**
   - 确认订单详情
   - 填写联系信息（可选）
   - 点击"提交订单"

6. **支付和跟踪**
   - 点击"立即支付"完成支付
   - 订单状态会自动更新（待支付 → 制作中 → 待取餐）
   - 可以继续点餐或查看订单状态

## 移动端使用

### 扫码方式

1. **微信扫码**
   - 打开微信扫一扫
   - 扫描二维码
   - 在浏览器中打开链接

2. **支付宝扫码**
   - 打开支付宝扫一扫
   - 扫描二维码
   - 在浏览器中打开链接

3. **手机相机扫码**（iOS 11+ / Android 8+）
   - 打开相机应用
   - 对准二维码
   - 点击弹出的链接

### PWA支持

- 支持添加到手机主屏幕
- 离线缓存（需配置Service Worker）
- 全屏体验

## API接口

### 菜单接口
- `GET /api/menu` - 获取所有菜单
- `GET /api/menu/categories` - 获取分类列表
- `GET /api/menu/category/:category` - 根据分类获取菜单
- `GET /api/menu/:id` - 获取单个商品详情

### 购物车接口
- `GET /api/cart/:sessionId` - 获取购物车
- `POST /api/cart/:sessionId/add` - 添加商品到购物车
- `PUT /api/cart/:sessionId/update/:itemId` - 更新商品数量
- `DELETE /api/cart/:sessionId/remove/:itemId` - 删除商品
- `DELETE /api/cart/:sessionId/clear` - 清空购物车

### 订单接口
- `POST /api/orders` - 创建订单
- `GET /api/orders/:id` - 根据ID获取订单
- `GET /api/orders/number/:orderNumber` - 根据订单号获取订单
- `POST /api/orders/:id/pay` - 支付订单
- `PATCH /api/orders/:id/status` - 更新订单状态

## 部署说明

### 部署到服务器

1. **构建前端**
```bash
cd client
npm run build
```

2. **配置后端**
   - 修改 `client/src/pages/QRCodePage.tsx` 中的默认URL
   - 或部署后通过界面修改

3. **部署步骤**
   - 将 `client/dist` 目录部署到静态服务器（如Nginx）
   - 将 `server` 目录部署到Node.js服务器
   - 配置反向代理，将 `/api` 请求转发到后端

4. **Nginx配置示例**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 开发说明

### 添加新商品

编辑 `server/src/data/menuData.ts` 文件，添加新的菜单项：

```typescript
{
  id: '15',
  name: '新商品名称',
  nameEn: 'New Item Name',
  category: '分类名称',
  price: 30,
  image: '图片URL',
  description: '商品描述',
  sizes: [...],
  customizations: [...],
  available: true
}
```

### 自定义样式

修改 `client/tailwind.config.js` 中的颜色配置来自定义主题色。

## 注意事项

- 购物车数据存储在服务器内存中，重启服务器会清空
- 订单数据存储在 `server/data/orders.json` 文件中
- 支付功能为模拟实现，实际项目中需要集成真实的支付接口
- 图片使用Unsplash占位图，实际项目中应使用真实商品图片
- **部署到服务器后，请修改二维码生成页面的基础URL为实际域名**

## 移动端测试

### 本地测试移动端

1. **使用手机和电脑在同一WiFi**
2. **获取电脑IP地址**
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`
3. **手机访问**: `http://[电脑IP]:3000`
4. **生成二维码**: 访问 `http://[电脑IP]:3000/qrcode`，将基础URL改为 `http://[电脑IP]:3000`

## 许可证

MIT License

## 作者

星巴克点餐系统开发团队
