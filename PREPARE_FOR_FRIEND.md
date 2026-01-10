# 准备给朋友的项目文件

## 📦 需要发送给朋友的文件

### 方式1：整个项目文件夹（推荐）

将整个 `re_order` 文件夹压缩后发送：

```bash
# 在项目根目录
# Windows PowerShell:
Compress-Archive -Path . -DestinationPath re_order.zip

# 或使用右键菜单：压缩为zip文件
```

**包含的文件**：
- ✅ `client/` - 前端代码
- ✅ `server/` - 后端代码（虽然独立应用不需要，但保留也无妨）
- ✅ `client/auto-build-ios.sh` - 自动打包脚本
- ✅ 所有配置文件

**文件大小**：约10-20MB（压缩后）

### 方式2：只发送client文件夹（更小）

如果只需要打包，可以只发送client文件夹：

```bash
# 只压缩client文件夹
Compress-Archive -Path client -DestinationPath client.zip
```

**文件大小**：约5-10MB（压缩后）

## 📤 发送方式

### 推荐方式：

1. **百度网盘**（国内）
   - 上传zip文件
   - 分享链接给朋友

2. **Google Drive**（国外）
   - 上传zip文件
   - 分享链接给朋友

3. **微信/QQ**
   - 如果文件小于100MB，可以直接发送
   - 如果大于100MB，使用网盘

4. **U盘**
   - 直接复制文件夹到U盘
   - 给朋友U盘

## 📝 给朋友的说明

发送文件时，可以附上这段文字：

```
你好！

我需要打包一个iOS应用，但没有Mac电脑，能麻烦你帮忙打包一下吗？

我已经准备好了所有文件，你只需要：
1. 解压文件
2. 运行自动脚本（./auto-build-ios.sh）
3. 在Xcode中完成打包（按照脚本提示）

详细说明在 FOR_FRIEND.md 文件中。

预计时间：30-60分钟

谢谢！
```

## ✅ 检查清单

在发送前，确保：
- ✅ 项目已构建（`client/dist/` 文件夹存在）
- ✅ `auto-build-ios.sh` 脚本存在
- ✅ `FOR_FRIEND.md` 说明文档存在
- ✅ 文件已压缩

## 🎯 快速命令

### Windows PowerShell:
```powershell
# 压缩整个项目
Compress-Archive -Path . -DestinationPath re_order.zip -Force

# 或只压缩client文件夹
Compress-Archive -Path client -DestinationPath client.zip -Force
```

### 检查文件大小：
```powershell
Get-Item re_order.zip | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB,2)}}
```

---

**提示**：如果使用Git，可以直接发送仓库地址，朋友可以克隆项目，这样更方便。
