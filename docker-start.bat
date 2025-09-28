@echo off
echo ========================================
echo 新媒体考勤管理系统 - Docker部署
echo ========================================
echo.

echo 检查Docker环境...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Docker，请先安装Docker Desktop
    echo 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo 检查Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Docker Compose，请确保Docker Desktop已正确安装
    pause
    exit /b 1
)

echo 创建uploads目录...
if not exist "uploads" mkdir uploads

echo 停止并删除现有容器...
docker-compose down

echo 构建并启动服务...
docker-compose up --build -d

if %errorlevel% neq 0 (
    echo 错误: Docker服务启动失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo 部署成功！
echo ========================================
echo 考勤管理系统已启动，访问地址: http://localhost:9010
echo.
echo 管理命令:
echo   查看日志: docker-compose logs -f
echo   停止服务: docker-compose down
echo   重启服务: docker-compose restart
echo.
echo 数据库信息:
echo   主机: localhost:3307
echo   数据库: attendance_system
echo   用户名: attendance_user
echo   密码: attendance_pass
echo.

echo 等待服务完全启动...
timeout /t 10 /nobreak >nul

echo 正在检查服务状态...
docker-compose ps

echo.
echo 按任意键退出...
pause >nul
