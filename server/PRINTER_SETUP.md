# 热敏打印机配置说明

## 配置步骤

### 1. 设置环境变量

在服务器启动前，设置以下环境变量：

```bash
# Windows (PowerShell)
$env:PRINTER_IP="192.168.1.100"
$env:PRINTER_PORT="9100"
$env:PRINTER_TYPE="EPSON"

# Linux/Mac
export PRINTER_IP="192.168.1.100"
export PRINTER_PORT="9100"
export PRINTER_TYPE="EPSON"
```

或者在项目根目录创建 `.env` 文件：

```env
PRINTER_IP=192.168.1.100
PRINTER_PORT=9100
PRINTER_TYPE=EPSON
```

### 2. 打印机类型

支持的打印机类型：
- `EPSON` - Epson 热敏打印机（默认）
- `STAR` - Star 热敏打印机
- `EPOS` - Epson EPOS 打印机

### 3. 网络配置

确保：
1. 打印机已连接到网络
2. 打印机IP地址正确
3. 服务器可以访问打印机IP
4. 打印机端口通常是 `9100`（RAW端口）或 `515`（LPR端口）

### 4. 测试连接

启动服务器后，访问：
```
GET http://localhost:5000/api/printer/test
```

如果连接成功，会返回：
```json
{
  "success": true,
  "message": "打印机连接正常",
  "connected": true
}
```

### 5. 常见问题

#### 无法连接到打印机
- 检查打印机IP地址是否正确
- 检查网络连接
- 检查防火墙设置
- 尝试 ping 打印机IP

#### 打印乱码
- 检查打印机字符集设置
- 确认打印机支持中文
- 尝试更换打印机类型（EPSON/STAR/EPOS）

#### 打印内容不完整
- 检查打印机纸张大小设置
- 调整打印内容格式

## 使用说明

### 自动打印

用户付款成功后，系统会自动调用打印API，无需手动操作。

### 手动测试打印

可以通过API手动触发打印：

```bash
POST http://localhost:5000/api/printer/print-order
Content-Type: application/json

{
  "orderId": "订单ID"
}
```

## 打印机设置

### 获取打印机IP地址

1. 在打印机上按设置按钮
2. 打印网络配置页
3. 查看IP地址

或通过路由器管理界面查看已连接的设备。

### 端口说明

- **9100** - RAW端口（最常用，推荐）
- **515** - LPR端口
- **631** - IPP端口

大多数热敏打印机使用 **9100** 端口。

