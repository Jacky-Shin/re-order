#!/bin/bash

# iOS应用自动打包脚本
# 使用方法：在Mac上运行此脚本，会自动完成所有打包步骤

set -e  # 遇到错误立即退出

echo "🚀 开始自动打包iPad应用..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否在Mac上
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ 错误：此脚本只能在Mac上运行${NC}"
    exit 1
fi

# 检查Xcode是否安装
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ 错误：未找到Xcode，请先安装Xcode${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 环境检查通过${NC}"
echo ""

# 进入client目录
cd "$(dirname "$0")"

# 步骤1：安装依赖
echo -e "${YELLOW}📦 步骤1：检查依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo "安装npm依赖..."
    npm install
else
    echo "依赖已存在，跳过安装"
fi
echo ""

# 步骤2：构建前端
echo -e "${YELLOW}📦 步骤2：构建前端代码...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 前端构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 前端构建完成${NC}"
echo ""

# 步骤3：同步到iOS
echo -e "${YELLOW}🔄 步骤3：同步到iOS项目...${NC}"
npx cap sync ios
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 同步失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 同步完成${NC}"
echo ""

# 步骤4：检查iOS项目
echo -e "${YELLOW}📱 步骤4：检查iOS项目...${NC}"
if [ ! -d "ios/App" ]; then
    echo -e "${RED}❌ iOS项目不存在${NC}"
    exit 1
fi
echo -e "${GREEN}✅ iOS项目存在${NC}"
echo ""

# 步骤5：打开Xcode
echo -e "${GREEN}📱 步骤5：打开Xcode项目...${NC}"
echo ""
echo "=========================================="
echo "接下来需要在Xcode中手动操作："
echo "=========================================="
echo ""
echo "1. 在Xcode中："
echo "   - 选择左侧的 'App' 项目"
echo "   - 选择 'App' target"
echo "   - 打开 'Signing & Capabilities' 标签"
echo "   - 勾选 'Automatically manage signing'"
echo "   - 选择您的开发团队"
echo ""
echo "2. 选择目标设备："
echo "   - 在顶部工具栏选择 'Any iPad'"
echo ""
echo "3. 构建Archive："
echo "   - 菜单：Product → Archive"
echo "   - 等待构建完成"
echo ""
echo "4. 导出.ipa文件："
echo "   - 在Organizer中选择Archive"
echo "   - 点击 'Distribute App'"
echo "   - 选择 'Ad Hoc' 或 'Development'"
echo "   - 导出.ipa文件"
echo ""
echo "=========================================="
echo ""

# 打开Xcode
npx cap open ios

echo ""
echo -e "${GREEN}✅ Xcode已打开${NC}"
echo ""
echo "请按照上述步骤在Xcode中完成打包"
echo "完成后，您将得到一个.ipa文件，可以使用3uTools安装到iPad上"
echo ""
