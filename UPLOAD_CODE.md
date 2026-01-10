# 📤 上传代码到GitHub - 详细步骤

## 🎯 前提条件

1. ✅ 您已经在GitHub上创建了仓库
2. ✅ 您已经复制了仓库URL
3. ✅ 您知道仓库URL（类似：`https://github.com/用户名/仓库名.git`）

## 🚀 上传步骤

### 第一步：打开PowerShell

1. 按 `Win + X`
2. 选择 **"Windows PowerShell"** 或 **"终端"**
3. 或者按 `Win + R`，输入 `powershell`，回车

### 第二步：进入项目目录

```powershell
cd D:\re_order
```

### 第三步：检查Git是否已初始化

```powershell
git status
```

**如果显示 "not a git repository"**，运行：
```powershell
git init
```

**如果显示文件列表**，说明已经初始化，继续下一步。

### 第四步：添加所有文件

```powershell
git add .
```

### 第五步：提交代码

```powershell
git commit -m "Initial commit"
```

### 第六步：设置主分支

```powershell
git branch -M main
```

### 第七步：添加远程仓库

**替换成您的实际仓库URL**：

```powershell
git remote add origin https://github.com/您的用户名/仓库名.git
```

例如：
```powershell
git remote add origin https://github.com/Jacky-Shin/starbucks-admin.git
```

### 第八步：上传代码

```powershell
git push -u origin main
```

## ⚠️ 常见问题

### 问题1：提示需要用户名和密码

**解决方案**：

1. **用户名**：输入您的GitHub用户名
2. **密码**：**不是您的GitHub登录密码！**
   - 需要使用Personal Access Token

### 如何创建Personal Access Token：

1. 在GitHub页面，点击右上角头像
2. 选择 **"Settings"**
3. 左侧菜单最底部，点击 **"Developer settings"**
4. 点击 **"Personal access tokens"**
5. 点击 **"Tokens (classic)"**
6. 点击 **"Generate new token"** → **"Generate new token (classic)"**
7. 填写：
   - **Note**：`Vercel Deploy`（任何名称）
   - **Expiration**：`90 days` 或 `No expiration`
   - **Select scopes**：勾选 **`repo`**（全部权限）
8. 滚动到底部，点击 **"Generate token"**
9. **复制生成的token**（类似：`ghp_xxxxxxxxxxxxxxxxxxxx`）
10. 在PowerShell中，当提示输入密码时，**粘贴这个token**

### 问题2：提示 "remote origin already exists"

**解决方案**：

```powershell
# 删除现有的远程仓库
git remote remove origin

# 重新添加
git remote add origin https://github.com/您的用户名/仓库名.git
```

### 问题3：提示 "failed to push"

**解决方案**：

1. 检查网络连接
2. 检查仓库URL是否正确
3. 检查Personal Access Token是否正确

## ✅ 成功标志

上传成功后，您会看到：

```
Enumerating objects: XX, done.
Counting objects: 100% (XX/XX), done.
Writing objects: 100% (XX/XX), done.
To https://github.com/用户名/仓库名.git
 * [new branch]      main -> main
Branch 'main' set up to track 'remote/origin/main'.
```

## 🎉 完成！

现在您可以：
1. 刷新GitHub页面
2. 看到您的所有文件
3. 继续下一步：部署到Vercel

---

**如果遇到任何问题，告诉我具体的错误信息，我会帮您解决！**
