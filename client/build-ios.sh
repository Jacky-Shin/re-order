#!/bin/bash

# iOS应用构建脚本
# 使用方法: ./build-ios.sh

echo "🚀 开始构建iOS应用..."

# 进入client目录
cd "$(dirname "$0")"

# 1. 构建前端
echo "📦 构建前端..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败"
    exit 1
fi

# 2. 同步到iOS项目
echo "🔄 同步到iOS项目..."
npx cap sync ios

if [ $? -ne 0 ]; then
    echo "❌ 同步失败"
    exit 1
fi

# 3. 打开Xcode
echo "📱 打开Xcode项目..."
echo "请在Xcode中："
echo "1. 选择开发团队"
echo "2. 选择目标设备（iPad）"
echo "3. Product → Archive 构建"
echo "4. Distribute App 导出.ipa文件"

npx cap open ios

echo "✅ 完成！"
