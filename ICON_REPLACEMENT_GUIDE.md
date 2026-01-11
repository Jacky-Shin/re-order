# 图标更换指南

## 快速更换图标

是的，您只需要将新的图标文件保存到 `client/public/` 目录即可！

## 步骤

### 1. 准备图标文件

您需要准备两个尺寸的PNG图标：
- **icon-192.png** - 192x192 像素（用于小尺寸显示）
- **icon-512.png** - 512x512 像素（用于大尺寸显示，iPad主屏幕）

### 2. 替换文件

将新图标文件保存到 `client/public/` 目录，**文件名必须保持一致**：
```
client/public/
  ├── icon-192.png  ← 替换这个文件
  ├── icon-512.png  ← 替换这个文件
  └── icon.svg      ← 可选，也可以替换SVG源文件
```

### 3. 提交并部署

```bash
git add client/public/icon-192.png client/public/icon-512.png
git commit -m "Update app icons"
git push origin main
```

### 4. 清除缓存（重要！）

部署后，在iPad上需要清除缓存才能看到新图标：

**方法一：删除并重新添加**
1. 长按主屏幕上的应用图标
2. 选择"移除 App"
3. 重新访问网站并添加到主屏幕

**方法二：清除Safari缓存**
1. 设置 > Safari > 清除历史记录和网站数据
2. 重新访问网站并添加到主屏幕

## 重要提示

### ✅ **文件名必须正确**
- `icon-192.png` - 必须是这个文件名
- `icon-512.png` - 必须是这个文件名
- 如果文件名不同，需要修改 `manifest.json`

### ✅ **文件格式**
- 必须是 PNG 格式
- 必须是正方形（宽高相等）
- 建议使用透明背景或纯色背景

### ✅ **文件位置**
- 必须放在 `client/public/` 目录
- 部署后会在网站根目录 `/icon-192.png` 和 `/icon-512.png`

### ✅ **图标设计建议**
- **简洁明了**：在小尺寸下也要清晰可见
- **高对比度**：确保图标在各种背景下都清晰
- **无文字**：避免使用小文字，在小尺寸下看不清
- **中心对齐**：重要元素放在中心，避免被裁剪

## 如果使用不同的文件名

如果您想使用不同的文件名（例如 `starbucks-icon-192.png`），需要：

1. **更新 manifest.json**
```json
{
  "icons": [
    {
      "src": "/starbucks-icon-192.png",  // 修改这里
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/starbucks-icon-512.png",  // 修改这里
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

2. **更新 index.html**（如果需要）
```html
<link rel="apple-touch-icon" href="/starbucks-icon-192.png" />
```

## 当前配置

当前系统使用的图标文件：
- `client/public/icon-192.png` - 192x192 像素
- `client/public/icon-512.png` - 512x512 像素
- `client/public/icon.svg` - SVG源文件（可选）

这些文件在 `manifest.json` 和 `index.html` 中已配置好，直接替换即可。

## 测试新图标

1. **本地测试**
   ```bash
   cd client
   npm run dev
   ```
   访问 `http://localhost:3000`，检查浏览器标签页的图标

2. **部署后测试**
   - 部署到 Vercel
   - 在 iPad 上清除缓存
   - 重新添加到主屏幕
   - 检查主屏幕上的图标

## 常见问题

**Q: 替换后图标没有更新？**
A: 需要清除浏览器缓存，或删除并重新添加应用到主屏幕。

**Q: 可以使用其他格式吗？**
A: 建议使用 PNG，SVG 在某些设备上可能不支持。

**Q: 图标尺寸不对会怎样？**
A: 系统会自动缩放，但建议使用正确的尺寸以获得最佳效果。

**Q: 可以只替换一个尺寸吗？**
A: 可以，但建议同时替换两个尺寸以确保在所有设备上显示正常。
