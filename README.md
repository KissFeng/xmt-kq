# 2025级大学生新媒体中心考勤管理系统

一个基于Node.js和MySQL的现代化考勤管理系统，专为大学生新媒体中心设计，提供学生管理、考勤分数记录、统计报表等功能。

## 📋 项目简介

本系统是一个全栈Web应用，采用前后端分离架构，为大学生新媒体中心提供完整的考勤管理解决方案。系统支持学生信息管理、考勤分数记录、Excel导入导出、统计报表等功能，并集成了飞书机器人通知功能。

## ✨ 主要功能

### 🎯 核心功能
- **学生管理**：添加、编辑、删除学生信息，支持按学院和部门筛选
- **考勤分数管理**：记录学生的加减分情况，支持详细原因说明
- **统计报表**：按月份和部门统计考勤情况，支持Excel导出
- **Excel导入导出**：批量导入学生信息，导出考勤统计报表
- **权限管理**：基于JWT的身份认证和权限控制

### 🔔 通知功能
- **飞书机器人集成**：自动发送考勤操作通知到飞书群
- **实时通知**：学生信息变更、考勤记录操作等实时通知

### 📊 数据统计
- **首页概览**：显示总用户数、今日考勤、本月总分数等关键指标
- **部门统计**：各部门考勤情况对比分析
- **月度报表**：按月份生成详细的考勤统计报表

## 🛠️ 技术栈

### 后端技术
- **Node.js** - 服务器运行环境
- **Express.js** - Web应用框架
- **MySQL** - 关系型数据库
- **JWT** - 身份认证
- **bcryptjs** - 密码加密
- **multer** - 文件上传处理
- **xlsx** - Excel文件处理

### 前端技术
- **原生JavaScript** - 前端交互逻辑
- **HTML5/CSS3** - 页面结构和样式
- **Fetch API** - HTTP请求处理

### 部署技术
- **Docker** - 容器化部署
- **Docker Compose** - 多容器编排

## 📦 项目结构

```
attendance-system/
├── public/                 # 前端静态文件
│   ├── index.html         # 主页面
│   ├── script.js          # 前端JavaScript逻辑
│   └── styles.css         # 样式文件
├── uploads/               # 文件上传目录
├── server.js              # 后端服务器主文件
├── package.json           # 项目依赖配置
├── docker-compose.yml     # Docker编排配置
├── Dockerfile             # Docker镜像构建文件
├── env.example            # 环境变量示例
├── docker-start.sh        # Linux/Mac启动脚本
├── docker-start.bat       # Windows启动脚本
├── DOCKER_DEPLOYMENT.md   # Docker部署说明
└── 学生信息导入示例.xlsx   # Excel导入模板
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- MySQL 5.7+
- Docker & Docker Compose（可选）

### 方式一：Docker部署（推荐）

1. **克隆项目**
```bash
git clone <repository-url>
cd attendance-system
```

2. **配置环境变量**
```bash
cp env.example .env
# 根据需要修改.env文件中的配置
```

3. **启动服务**
```bash
# Linux/Mac
chmod +x docker-start.sh
./docker-start.sh

# Windows
docker-start.bat

# 或手动启动
docker-compose up -d --build
```

4. **访问系统**
- 访问地址：http://localhost:9010
- 在线演示：https://xmt-kq.hbcit.chat

### 方式二：本地开发

1. **安装依赖**
```bash
npm install
```

2. **配置数据库**
- 确保MySQL服务运行在3307端口
- 创建数据库：`attendance_system`
- 执行数据库初始化脚本

3. **配置环境变量**
```bash
cp env.example .env
# 修改.env文件中的数据库配置
```

4. **启动服务**
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

5. **访问系统**
- 访问地址：http://localhost:3000
- 在线演示：https://xmt-kq.hbcit.chat

## ⚙️ 配置说明

### 环境变量配置

创建`.env`文件并配置以下变量：

```env
# 数据库配置
MYSQL_HOST=localhost
MYSQL_PORT=3307
MYSQL_USER=root
MYSQL_PASSWORD=123456
MYSQL_DATABASE=attendance_system

# JWT密钥（生产环境请修改）
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# 应用配置
NODE_ENV=production
PORT=3000
```

### 飞书机器人配置

在`server.js`中修改飞书机器人Webhook URL：

```javascript
const FEISHU_WEBHOOK_URL = 'https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_WEBHOOK_URL';
```

## 📊 数据库设计

### 主要数据表

- **students** - 学生信息表
- **colleges** - 学院信息表
- **departments** - 部门信息表
- **attendance_scores** - 考勤分数记录表
- **admins** - 管理员信息表

### 数据库初始化

请确保执行相应的SQL脚本来创建数据库表结构。

## 🔧 API接口

### 认证接口
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/verify` - 验证登录状态

### 学生管理
- `GET /api/students` - 获取学生列表
- `POST /api/students` - 创建学生
- `PUT /api/students/:id` - 更新学生信息
- `DELETE /api/students/:id` - 删除学生
- `POST /api/students/import` - Excel批量导入学生

### 考勤管理
- `GET /api/attendance-scores` - 获取考勤记录
- `POST /api/attendance-scores` - 创建考勤记录
- `DELETE /api/attendance-scores/:id` - 删除考勤记录

### 统计报表
- `GET /api/attendance/stats` - 获取统计信息
- `GET /api/export/stats` - 导出Excel报表

## 📱 使用说明

### 管理员登录
1. 点击右上角"登录"按钮
2. 输入管理员用户名和密码
3. 登录成功后可以执行增删改操作

### 学生管理
1. 在"学生管理"页面可以查看所有学生
2. 支持按学院和部门筛选
3. 点击"添加学生"可以新增学生信息
4. 点击"Excel导入"可以批量导入学生

### 考勤分数管理
1. 在"考勤分数管理"页面记录学生的加减分
2. 支持按学生和日期筛选
3. 每次操作都会记录操作员信息

### 统计报表
1. 在"统计报表"页面查看考勤统计
2. 支持按月份和部门筛选
3. 可以导出Excel格式的统计报表

## 🔒 安全特性

- **JWT身份认证**：基于Token的无状态认证
- **密码加密**：使用bcryptjs加密存储密码
- **权限控制**：敏感操作需要登录验证
- **输入验证**：前后端双重数据验证
- **SQL注入防护**：使用参数化查询

## 📈 性能优化

- **数据库连接池**：使用MySQL连接池提高数据库性能
- **静态文件缓存**：Express静态文件中间件优化
- **Docker优化**：多阶段构建减小镜像体积
- **健康检查**：Docker容器健康检查机制

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查MySQL服务是否运行
   - 验证数据库连接配置
   - 确保数据库用户权限正确

2. **端口冲突**
   - 修改docker-compose.yml中的端口映射
   - 检查端口是否被其他服务占用

3. **文件上传失败**
   - 确保uploads目录存在且有写权限
   - 检查文件大小限制

4. **飞书通知失败**
   - 验证Webhook URL是否正确
   - 检查网络连接是否正常

## 🔄 更新日志

### v1.0.0 (2025-01-XX)
- 初始版本发布
- 实现基础的学生管理和考勤功能
- 集成飞书机器人通知
- 支持Excel导入导出
- Docker容器化部署

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🌐 在线演示

- **演示地址**：https://xmt-kq.hbcit.chat
- **功能说明**：在线演示包含所有核心功能，可以体验学生管理、考勤记录、统计报表等功能

## 📞 联系方式

如有问题或建议，请联系：
- 项目维护者：[Power]
- 邮箱：[+26699525@qq.com]
- 在线演示：https://xmt-kq.hbcit.chat

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

**注意**：本系统仅供学习和内部使用，请勿用于商业用途。
