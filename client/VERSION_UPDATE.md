# 版本更新说明

## 如何更新应用版本

当需要发布新版本时，请按以下步骤操作：

### 1. 更新版本号

编辑 `client/src/config/version.ts` 文件，更新 `APP_VERSION` 常量：

```typescript
export const APP_VERSION = '1.0.2'; // 更新版本号
```

版本号格式：`主版本号.次版本号.修订号`
- 主版本号：重大功能更新或架构变更
- 次版本号：新功能添加
- 修订号：bug修复和小优化

### 2. 构建和部署

```bash
cd client
npm run build
git add .
git commit -m "chore: Bump version to 1.0.2"
git push origin main
```

### 3. 自动更新机制

应用会自动检测新版本：

1. **首次访问**：自动保存当前版本号
2. **版本检查**：每次加载时检查是否有新版本
3. **更新提示**：检测到新版本时，显示更新提示栏
4. **一键更新**：用户点击"更新"按钮后：
   - 清除所有缓存（localStorage、sessionStorage、IndexedDB、Service Worker、Cache API）
   - 保存新版本号
   - 自动刷新页面

### 4. 手动清除缓存（备用方案）

如果自动更新失败，用户可以：

1. **浏览器设置**：
   - Chrome/Edge: 设置 → 隐私和安全 → 清除浏览数据
   - Safari: 偏好设置 → 隐私 → 管理网站数据
   - Firefox: 设置 → 隐私与安全 → Cookie和网站数据

2. **开发者工具**：
   - 打开开发者工具（F12）
   - Application/存储 → Clear storage
   - 勾选所有选项并清除

3. **强制刷新**：
   - Windows/Linux: `Ctrl + Shift + R` 或 `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

## 缓存策略

- **HTML文件**：不缓存，每次请求最新版本
- **静态资源（JS/CSS）**：使用hash文件名，长期缓存
- **版本检查**：延迟2秒执行，避免影响初始加载

## 注意事项

- 版本号更新后，所有用户会在下次访问时看到更新提示
- 更新会清除所有缓存数据，但会保留必要的配置（如Firebase配置）
- 建议在更新前通知用户，避免数据丢失

