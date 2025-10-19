# 考勤系统 Docker 部署指南

## 部署说明

本项目已配置为使用Docker部署，连接到您本机的MySQL数据库（端口3307）。

## 快速开始

### 1. 确保环境准备
- 已安装 Docker 和 Docker Compose
- 本机MySQL服务运行在3307端口
- MySQL用户名：root，密码：123456

### 2. 启动服务

**Linux/Mac:**
```bash
chmod +x docker-start.sh
./docker-start.sh
```

**Windows:**
```cmd
docker-start.bat
```

**手动启动:**
```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 3. 访问系统
- 访问地址：http://localhost:9010
- 或：http://您的服务器IP:9010

## 配置说明

### 环境变量
复制 `env.example` 为 `.env` 并根据需要修改：
```bash
cp env.example .env
```

### 数据库配置
- 主机：host.docker.internal（Docker容器访问本机）
- 端口：3307
- 用户名：root
- 密码：123456
- 数据库：attendance_system

## 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 重新构建
docker-compose up -d --build

# 进入容器
docker-compose exec app sh
```

## 故障排除

1. **数据库连接失败**
   - 确保MySQL服务运行在3307端口
   - 检查用户名密码是否正确
   - 确保MySQL允许外部连接

2. **端口冲突**
   - 修改docker-compose.yml中的端口映射
   - 确保9010端口未被占用

3. **权限问题**
   - 确保uploads目录有写权限
   - Linux下可能需要：`chmod 755 uploads`

## 生产环境建议

1. 修改JWT_SECRET为强密码
2. 使用HTTPS（配置SSL证书）
3. 设置防火墙规则
4. 定期备份数据库
5. 监控服务状态
