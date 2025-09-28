#!/bin/bash

echo "========================================"
echo "新媒体考勤管理系统 - 启动脚本"
echo "========================================"
echo

echo "检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

echo "检查项目依赖..."
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo "错误: 依赖安装失败"
        exit 1
    fi
fi

echo "检查数据库配置..."
echo "请确保MySQL服务已启动，并且数据库attendance_system已创建"
echo

echo "启动服务器..."
echo "服务器将在 http://localhost:3000 启动"
echo "按 Ctrl+C 停止服务器"
echo

node server.js
