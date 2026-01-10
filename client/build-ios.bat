@echo off
REM iOS应用构建脚本 (Windows)
REM 使用方法: build-ios.bat

echo 🚀 开始构建iOS应用...

REM 进入client目录
cd /d "%~dp0"

REM 1. 构建前端
echo 📦 构建前端...
call npm run build

if errorlevel 1 (
    echo ❌ 前端构建失败
    exit /b 1
)

REM 2. 同步到iOS项目
echo 🔄 同步到iOS项目...
call npx cap sync ios

if errorlevel 1 (
    echo ❌ 同步失败
    exit /b 1
)

echo.
echo ✅ 构建完成！
echo.
echo 📱 下一步：
echo 1. 在Mac上打开项目: cd client ^&^& npx cap open ios
echo 2. 在Xcode中选择开发团队
echo 3. Product → Archive 构建
echo 4. Distribute App 导出.ipa文件
echo.

pause
