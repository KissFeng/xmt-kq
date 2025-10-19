@echo off
echo === 考勤系统 Docker 部署脚本 ===

REM 检查Docker是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: Docker 未安装，请先安装 Docker Desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: Docker Compose 未安装，请先安装 Docker Compose
    pause
    exit /b 1
)

REM 创建环境变量文件
if not exist .env (
    echo 创建环境变量文件...
    copy env.example .env
    echo 请检查并修改 .env 文件中的配置
)

REM 构建并启动服务
echo 构建并启动考勤系统...
docker-compose up -d --build

REM 等待服务启动
echo 等待服务启动...
timeout /t 10 /nobreak >nul

REM 检查服务状态
echo 检查服务状态...
docker-compose ps

echo.
echo === 部署完成 ===
echo 考勤系统访问地址: http://localhost:9010
echo.
echo 查看日志: docker-compose logs -f
echo 停止服务: docker-compose down
echo 重启服务: docker-compose restart
pause
