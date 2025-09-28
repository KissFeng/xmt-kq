#!/bin/bash

echo "========================================"
echo "新媒体考勤管理系统 - Docker部署"
echo "========================================"
echo

echo "检查Docker环境..."
if ! command -v docker &> /dev/null; then
    echo "错误: 未找到Docker，请先安装Docker"
    echo "安装指南: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "检查Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "错误: 未找到Docker Compose，请确保Docker已正确安装"
    exit 1
fi

echo "创建uploads目录..."
mkdir -p uploads

echo "停止并删除现有容器..."
docker-compose down

echo "构建并启动服务..."
docker-compose up --build -d

if [ $? -ne 0 ]; then
    echo "错误: Docker服务启动失败"
    exit 1
fi

echo
echo "========================================"
echo "部署成功！"
echo "========================================"
echo "考勤管理系统已启动，访问地址: http://localhost:9010"
echo
echo "管理命令:"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo
echo "数据库信息:"
echo "  主机: localhost:3307"
echo "  数据库: attendance_system"
echo "  用户名: attendance_user"
echo "  密码: attendance_pass"
echo

echo "等待服务完全启动..."
sleep 10

echo "正在检查服务状态..."
docker-compose ps
