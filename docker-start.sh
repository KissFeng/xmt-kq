#!/bin/bash

echo "=== 考勤系统 Docker 部署脚本 ==="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 创建环境变量文件
if [ ! -f .env ]; then
    echo "创建环境变量文件..."
    cp env.example .env
    echo "请检查并修改 .env 文件中的配置"
fi

# 构建并启动服务
echo "构建并启动考勤系统..."
docker-compose up -d --build

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo "检查服务状态..."
docker-compose ps

echo ""
echo "=== 部署完成 ==="
echo "考勤系统访问地址: http://localhost:9010"
echo "或访问: http://您的服务器IP:9010"
echo ""
echo "查看日志: docker-compose logs -f"
echo "停止服务: docker-compose down"
echo "重启服务: docker-compose restart"
