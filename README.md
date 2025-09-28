# 新媒体考勤管理系统

## 📋 项目简介

新媒体考勤管理系统是一个基于Web的学生考勤分数管理系统，专为学校或组织管理学生考勤分数而设计。系统采用现代化的技术栈，提供直观的用户界面和完整的权限控制。

### 🎯 主要功能

- **学生管理**：学生信息的增删改查，支持按学院和部门筛选
- **考勤分数管理**：记录学生的考勤分数变化，支持加分和扣分
- **统计报表**：按月份和部门统计考勤数据，支持Excel导出
- **Excel导入**：支持批量导入学生信息
- **权限控制**：基于JWT的身份认证，未登录用户只能查看数据
- **数据可视化**：直观的仪表板显示考勤统计信息

### 🛠️ 技术栈

- **后端**：Node.js + Express
- **数据库**：MySQL
- **前端**：HTML5 + CSS3 + JavaScript (原生)
- **认证**：JWT (JSON Web Token)
- **文件处理**：Multer (文件上传) + XLSX (Excel处理)
- **密码加密**：bcryptjs

## 🚀 快速开始

### 环境要求

- Node.js (版本 14.0 或更高)
- MySQL (版本 5.7 或更高)
- 现代浏览器 (Chrome, Firefox, Safari, Edge)

### 安装步骤

#### 1. 克隆项目
```bash
git clone <项目地址>
cd attendance-system
```

#### 2. 安装依赖
```bash
npm install
```

#### 3. 配置数据库

1. **启动MySQL服务**
   ```bash
   # Windows
   net start mysql
   
   # macOS/Linux
   sudo systemctl start mysql
   ```

2. **创建数据库**
   ```sql
   CREATE DATABASE attendance_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **导入数据库结构**
   ```bash
   mysql -u root -p attendance_system < database/init.sql
   ```

#### 4. 配置数据库连接

编辑 `server.js` 文件中的数据库配置：

```javascript
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'your_password', // 修改为您的MySQL密码
    database: 'attendance_system',
    charset: 'utf8mb4'
};
```

#### 5. 启动服务器
```bash
node server.js
```

#### 6. 访问系统
打开浏览器访问：`http://localhost:3000`

### 🔐 默认账户

- **用户名**：`admin`
- **密码**：`admin123`

## 📁 项目结构

```
attendance-system/
├── public/                 # 前端文件
│   ├── index.html         # 主页面
│   ├── script.js          # 前端逻辑
│   └── styles.css         # 样式文件
├── database/              # 数据库文件
│   └── init.sql           # 数据库初始化脚本
├── uploads/               # 文件上传目录
├── server.js              # 服务器主文件
├── package.json           # 项目依赖配置
├── .gitignore            # Git忽略文件
└── 学生信息导入示例.xlsx   # Excel导入模板
```

## 🔧 功能详解

### 1. 学生管理
- **添加学生**：录入学生基本信息
- **编辑学生**：修改学生信息
- **删除学生**：移除学生记录
- **筛选功能**：按学院和部门筛选学生
- **Excel导入**：批量导入学生数据

### 2. 考勤分数管理
- **添加记录**：记录学生的考勤分数变化
- **删除记录**：移除错误的考勤记录
- **筛选查询**：按学生和日期筛选记录
- **权限控制**：需要登录才能进行修改操作

### 3. 统计报表
- **月度统计**：查看指定月份的考勤数据
- **部门统计**：按部门查看考勤情况
- **Excel导出**：将统计数据导出为Excel文件
- **排序功能**：按考勤分数从高到低排序

### 4. 权限管理
- **登录系统**：基于JWT的身份认证
- **权限分级**：
  - 未登录：只能查看数据
  - 已登录：可以进行所有操作
- **安全特性**：密码加密存储，令牌过期机制

## 📊 数据库设计

### 主要数据表

1. **colleges** - 学院表
2. **departments** - 部门表
3. **students** - 学生表
4. **attendance_scores** - 考勤分数记录表
5. **admins** - 管理员表

### 表关系
- 学生表关联学院表和部门表
- 考勤分数记录表关联学生表
- 支持级联删除，保证数据一致性

## 🎨 界面特色

- **现代化设计**：简约风格，浅色主题
- **响应式布局**：适配不同屏幕尺寸
- **直观操作**：清晰的操作流程和反馈
- **数据可视化**：图表展示统计信息

## 🔒 安全特性

- **密码加密**：使用bcryptjs加密存储密码
- **JWT认证**：安全的令牌认证机制
- **权限控制**：细粒度的操作权限管理
- **数据验证**：前后端双重数据验证

## 📝 API接口

### 认证接口
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/verify` - 验证登录状态

### 学生管理
- `GET /api/students` - 获取学生列表
- `POST /api/students` - 创建学生
- `PUT /api/students/:id` - 更新学生
- `DELETE /api/students/:id` - 删除学生
- `POST /api/students/import` - Excel导入学生

### 考勤管理
- `GET /api/attendance-scores` - 获取考勤记录
- `POST /api/attendance-scores` - 创建考勤记录
- `DELETE /api/attendance-scores/:id` - 删除考勤记录

### 统计报表
- `GET /api/attendance/stats` - 获取统计数据
- `GET /api/export/stats` - 导出Excel报表
- `GET /api/template/download` - 下载Excel模板

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查MySQL服务是否启动
   - 验证数据库配置信息
   - 确认数据库用户权限

2. **依赖安装失败**
   - 使用 `npm cache clean --force` 清理缓存
   - 删除 `node_modules` 重新安装
   - 检查Node.js版本兼容性

3. **端口占用**
   - 修改 `server.js` 中的端口号
   - 使用 `netstat -an | findstr :3000` 检查端口占用

4. **Excel导入失败**
   - 检查文件格式（支持.xlsx和.xls）
   - 确认Excel文件包含必要列
   - 验证数据格式正确性

## 📞 技术支持

如果您在使用过程中遇到问题，请检查：

1. **系统要求**：确保Node.js和MySQL版本符合要求
2. **依赖安装**：确保所有依赖包正确安装
3. **数据库配置**：验证数据库连接配置
4. **权限设置**：确认文件读写权限

## 📄 许可证

本项目采用 MIT 许可证，详情请参阅 LICENSE 文件。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

---

**注意**：首次使用前请务必修改默认管理员密码，确保系统安全。
