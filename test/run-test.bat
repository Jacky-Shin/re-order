@echo off
echo ========================================
echo 并发订单测试 - 自动启动脚本
echo ========================================
echo.

echo [1/3] 检查服务器是否运行...
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ 服务器已在运行
    goto :run_test
)

echo [2/3] 启动服务器...
echo 注意: 服务器将在新窗口中启动，请保持该窗口打开
start "服务器" cmd /k "cd server && npm run dev"

echo [3/3] 等待服务器启动 (10秒)...
timeout /t 10 /nobreak >nul

echo.
echo [4/4] 运行并发测试...
echo.
node test/concurrent-order-test.js

echo.
echo ========================================
echo 测试完成！
echo ========================================
echo.
echo 提示: 如果看到连接错误，请：
echo 1. 检查服务器窗口是否正常启动
echo 2. 等待更长时间后重新运行此脚本
echo 3. 或手动运行: npm run test:concurrent
echo.
pause

