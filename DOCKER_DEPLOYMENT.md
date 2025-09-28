# 考勤管理系统 Docker 部署指南

## 概述

本项目已完全支持Docker部署，使用Docker Compose可以一键启动整个系统，包括MySQL数据库和Node.js应用。

## 系统要求

- Docker Desktop (Windows/Mac) 或 Docker Engine (Linux)
- 至少 2GB 可用内存
- 至少 5GB 可用磁盘空间

## 快速开始

### Windows 用户

1. 确保已安装 Docker Desktop
2. 双击运行 `docker-start.bat` 文件
3. 等待服务启动完成
4. 访问 http://localhost:9010

### Linux/Mac 用户

1. 确保已安装 Docker 和 Docker Compose
2. 在终端中运行：
   ```bash
   chmod +x docker-start.sh
   ./docker-start.sh
   ```
3. 访问 http://localhost:9010

### 手动启动

如果自动脚本无法运行，可以手动执行以下命令：

```bash
# 构建并启动所有服务
docker-compose up --build -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 服务配置

### 应用服务
- **端口**: 9010
- **环境变量**:
  - `NODE_ENV`: production
  - `PORT`: 3000
  - `DB_HOST`: mysql
  - `DB_USER`: attendance_user
  - `DB_PASSWORD`: attendance_pass
  - `DB_NAME`: attendance_system
  - `JWT_SECRET`: your-super-secret-jwt-key-change-in-production

### MySQL 数据库
- **端口**: 3307
- **数据库名**: attendance_system
- **用户名**: attendance_user
- **密码**: attendance_pass
- **Root密码**: 123456

## 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f app
docker-compose logs -f mysql

# 进入应用容器
docker-compose exec app sh

# 进入数据库容器
docker-compose exec mysql mysql -u root -p

# 重新构建并启动
docker-compose up --build -d

# 删除所有数据（谨慎使用）
docker-compose down -v
```

## 数据持久化

- MySQL数据存储在Docker卷 `mysql_data` 中
- 上传文件存储在 `./uploads` 目录中
- 即使删除容器，数据也会保留

## 故障排除

### 1. 端口冲突
如果9010或3307端口被占用，可以修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "9011:3000"  # 将应用端口改为9011
  - "3308:3306"  # 将数据库端口改为3308
```

### 2. 数据库连接失败
- 确保MySQL容器已完全启动（通常需要30-60秒）
- 检查数据库初始化脚本是否正确执行
- 查看MySQL容器日志：`docker-compose logs mysql`

### 3. 应用启动失败
- 检查应用容器日志：`docker-compose logs app`
- 确保所有环境变量正确设置
- 检查uploads目录权限

### 4. 内存不足
如果系统内存不足，可以：
- 关闭其他不必要的应用程序
- 在Docker Desktop中增加内存分配
- 使用 `docker-compose down` 停止服务释放内存

## 生产环境部署

### 安全配置
1. 修改默认密码：
   - 在 `docker-compose.yml` 中更改 `MYSQL_ROOT_PASSWORD` 和 `MYSQL_PASSWORD`
   - 修改 `JWT_SECRET` 环境变量

2. 使用环境变量文件：
   ```bash
   # 创建 .env 文件
   MYSQL_ROOT_PASSWORD=your_secure_password
   MYSQL_PASSWORD=your_secure_password
   JWT_SECRET=your_very_secure_jwt_secret
   ```

3. 修改 `docker-compose.yml` 使用环境变量：
   ```yaml
   environment:
     MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
     MYSQL_PASSWORD: ${MYSQL_PASSWORD}
     JWT_SECRET: ${JWT_SECRET}
   ```

### 反向代理
建议使用Nginx作为反向代理：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:9010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 备份和恢复

### 备份数据库
```bash
# 备份
docker-compose exec mysql mysqldump -u root -p attendance_system > backup.sql

# 恢复
docker-compose exec -T mysql mysql -u root -p attendance_system < backup.sql
```

### 备份上传文件
```bash
# 备份uploads目录
tar -czf uploads_backup.tar.gz uploads/

# 恢复uploads目录
tar -xzf uploads_backup.tar.gz
```

## 监控和维护

### 查看资源使用情况
```bash
docker stats
```

### 清理未使用的Docker资源
```bash
# 清理未使用的镜像
docker image prune

# 清理未使用的卷
docker volume prune

# 清理所有未使用的资源
docker system prune
```

## 技术支持

如果遇到问题，请检查：
1. Docker和Docker Compose版本是否最新
2. 系统资源是否充足
3. 端口是否被占用
4. 防火墙设置是否正确

更多帮助请查看Docker官方文档：https://docs.docker.com/
