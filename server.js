require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 飞书机器人配置
const FEISHU_WEBHOOK_URL = 'https://open.feishu.cn/open-apis/bot/v2/hook/b75e2592-a969-48b3-8958-428539fe9784';

// 飞书机器人通知函数
const sendFeishuNotification = (operation, details) => {
    // 根据操作类型选择不同的颜色和图标
    let color = "blue";
    let icon = "📝";
    
    switch(operation) {
        case "新增学生":
            color = "green";
            icon = "➕";
            break;
        case "修改学生":
            color = "orange";
            icon = "✏️";
            break;
        case "删除学生":
            color = "red";
            icon = "🗑️";
            break;
        case "新增考勤记录":
            color = "green";
            icon = "📊";
            break;
        case "删除考勤记录":
            color = "red";
            icon = "🗑️";
            break;
        case "Excel批量导入":
            color = "purple";
            icon = "📋";
            break;
    }

    const message = {
        msg_type: "interactive",
        card: {
            config: {
                wide_screen_mode: true
            },
            header: {
                template: color,
                title: {
                    content: `${icon} 考勤系统数据库操作通知`,
                    tag: "plain_text"
                }
            },
            elements: [
                {
                    tag: "div",
                    text: {
                        content: `**操作类型：** ${operation}`,
                        tag: "lark_md"
                    }
                },
                {
                    tag: "div",
                    text: {
                        content: `**操作时间：** ${new Date().toLocaleString('zh-CN')}`,
                        tag: "lark_md"
                    }
                },
                {
                    tag: "div",
                    text: {
                        content: `**详细信息：**\n${details}`,
                        tag: "lark_md"
                    }
                },
                {
                    tag: "hr"
                },
                {
                    tag: "div",
                    text: {
                        content: "🤖 系统自动通知",
                        tag: "plain_text"
                    }
                }
            ]
        }
    };

    const postData = JSON.stringify(message);
    
    const options = {
        hostname: 'open.feishu.cn',
        port: 443,
        path: '/open-apis/bot/v2/hook/b75e2592-a969-48b3-8958-428539fe9784',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = https.request(options, (res) => {
        console.log(`飞书通知发送状态: ${res.statusCode}`);
        res.on('data', (d) => {
            console.log('飞书通知响应:', d.toString());
        });
    });

    req.on('error', (e) => {
        console.error('飞书通知发送失败:', e);
    });

    req.write(postData);
    req.end();
};

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// 认证中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '需要登录才能访问' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: '登录已过期，请重新登录' });
        }
        req.user = user;
        next();
    });
};

// 登录API
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    const query = 'SELECT * FROM admins WHERE username = ?';
    pool.execute(query, [username], async (err, results) => {
        if (err) {
            console.error('登录查询失败:', err);
            return res.status(500).json({ error: '登录失败' });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        
        const admin = results[0];
        const validPassword = await bcrypt.compare(password, admin.password);
        
        if (!validPassword) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        
        const token = jwt.sign(
            { id: admin.id, username: admin.username, name: admin.name, role: admin.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            message: '登录成功',
            token,
            user: {
                id: admin.id,
                username: admin.username,
                name: admin.name,
                role: admin.role
            }
        });
    });
});

// 验证登录状态API
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});

// 下载Excel模板API
app.get('/api/template/download', (req, res) => {
    const templatePath = path.join(__dirname, '学生信息导入示例.xlsx');
    
    // 检查文件是否存在
    if (!fs.existsSync(templatePath)) {
        return res.status(404).json({ error: '模板文件不存在' });
    }
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="student_template.xlsx"');
    
    // 发送文件
    res.sendFile(templatePath);
});

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel' ||
            file.originalname.endsWith('.xlsx') ||
            file.originalname.endsWith('.xls')) {
            cb(null, true);
        } else {
            cb(new Error('只支持Excel文件格式'), false);
        }
    }
});

// 数据库连接配置
const dbConfig = {
    host: process.env.DB_HOST || '43.138.28.205',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'attendance_system',
    charset: 'utf8mb4'
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 学生管理API
// 获取所有学生
app.get('/api/students', (req, res) => {
    const { college_id, department_id } = req.query;
    let query = `
        SELECT s.*, c.name as college_name, d.name as department_name 
        FROM students s 
        LEFT JOIN colleges c ON s.college_id = c.id 
        LEFT JOIN departments d ON s.department_id = d.id 
        WHERE 1=1
    `;
    const params = [];

    if (college_id) {
        query += ' AND s.college_id = ?';
        params.push(college_id);
    }
    if (department_id) {
        query += ' AND s.department_id = ?';
        params.push(department_id);
    }

    query += ' ORDER BY s.id DESC';

    pool.execute(query, params, (err, results) => {
        if (err) {
            console.error('获取学生列表失败:', err);
            return res.status(500).json({ error: '获取学生列表失败' });
        }
        res.json(results);
    });
});

// 获取单个学生
app.get('/api/students/:id', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT s.*, c.name as college_name, d.name as department_name 
        FROM students s 
        LEFT JOIN colleges c ON s.college_id = c.id 
        LEFT JOIN departments d ON s.department_id = d.id 
        WHERE s.id = ?
    `;
    pool.execute(query, [id], (err, results) => {
        if (err) {
            console.error('获取学生信息失败:', err);
            return res.status(500).json({ error: '获取学生信息失败' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: '学生不存在' });
        }
        res.json(results[0]);
    });
});

// 创建学生
app.post('/api/students', authenticateToken, (req, res) => {
    const { student_id, name, college_id, department_id, phone, status } = req.body;
    const query = `
        INSERT INTO students (student_id, name, college_id, department_id, phone, status) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    pool.execute(query, [student_id, name, college_id, department_id, phone, status], (err, results) => {
        if (err) {
            console.error('创建学生失败:', err);
            return res.status(500).json({ error: '创建学生失败' });
        }
        
        // 发送飞书通知
        const details = `**学生姓名：** ${name}\n**学号：** ${student_id}\n**学院ID：** ${college_id}\n**部门ID：** ${department_id}\n**状态：** ${status}`;
        sendFeishuNotification('新增学生', details);
        
        res.json({ id: results.insertId, message: '学生创建成功' });
    });
});

// 更新学生
app.put('/api/students/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { student_id, name, college_id, department_id, phone, status } = req.body;
    
    // 先获取原学生信息用于通知
    const getStudentQuery = 'SELECT * FROM students WHERE id = ?';
    pool.execute(getStudentQuery, [id], (err, studentResults) => {
        if (err) {
            console.error('获取学生信息失败:', err);
            return res.status(500).json({ error: '获取学生信息失败' });
        }
        
        if (studentResults.length === 0) {
            return res.status(404).json({ error: '学生不存在' });
        }
        
        const oldStudent = studentResults[0];
        
        const query = `
            UPDATE students 
            SET student_id = ?, name = ?, college_id = ?, department_id = ?, phone = ?, status = ?
            WHERE id = ?
        `;
        pool.execute(query, [student_id, name, college_id, department_id, phone, status, id], (err, results) => {
            if (err) {
                console.error('更新学生失败:', err);
                return res.status(500).json({ error: '更新学生失败' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: '学生不存在' });
            }
            
            // 发送飞书通知
            const details = `**学生姓名：** ${oldStudent.name} → ${name}\n**学号：** ${oldStudent.student_id} → ${student_id}\n**学院ID：** ${oldStudent.college_id} → ${college_id}\n**部门ID：** ${oldStudent.department_id} → ${department_id}\n**状态：** ${oldStudent.status} → ${status}`;
            sendFeishuNotification('修改学生', details);
            
            res.json({ message: '学生更新成功' });
        });
    });
});

// 删除学生
app.delete('/api/students/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    // 先获取学生信息用于通知
    const getStudentQuery = 'SELECT * FROM students WHERE id = ?';
    pool.execute(getStudentQuery, [id], (err, studentResults) => {
        if (err) {
            console.error('获取学生信息失败:', err);
            return res.status(500).json({ error: '获取学生信息失败' });
        }
        
        if (studentResults.length === 0) {
            return res.status(404).json({ error: '学生不存在' });
        }
        
        const student = studentResults[0];
        
        const query = 'DELETE FROM students WHERE id = ?';
        pool.execute(query, [id], (err, results) => {
            if (err) {
                console.error('删除学生失败:', err);
                return res.status(500).json({ error: '删除学生失败' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: '学生不存在' });
            }
            
            // 发送飞书通知
            const details = `**学生姓名：** ${student.name}\n**学号：** ${student.student_id}\n**学院ID：** ${student.college_id}\n**部门ID：** ${student.department_id}`;
            sendFeishuNotification('删除学生', details);
            
            res.json({ message: '学生删除成功' });
        });
    });
});

// 学院管理API
// 获取所有学院
app.get('/api/colleges', (req, res) => {
    const query = 'SELECT * FROM colleges ORDER BY id';
    pool.execute(query, (err, results) => {
        if (err) {
            console.error('获取学院列表失败:', err);
            return res.status(500).json({ error: '获取学院列表失败' });
        }
        res.json(results);
    });
});

// 部门管理API
// 获取所有部门
app.get('/api/departments', (req, res) => {
    const query = 'SELECT * FROM departments ORDER BY id';
    pool.execute(query, (err, results) => {
        if (err) {
            console.error('获取部门列表失败:', err);
            return res.status(500).json({ error: '获取部门列表失败' });
        }
        res.json(results);
    });
});

// 考勤分数管理API
// 获取考勤分数记录
app.get('/api/attendance-scores', (req, res) => {
    const { student_id, start_date, end_date, month } = req.query;
    let query = `
        SELECT asr.*, s.name as student_name, s.student_id, c.name as college_name, d.name as department_name
        FROM attendance_scores asr
        LEFT JOIN students s ON asr.student_id = s.id
        LEFT JOIN colleges c ON s.college_id = c.id
        LEFT JOIN departments d ON s.department_id = d.id
        WHERE 1=1
    `;
    const params = [];

    if (student_id) {
        query += ' AND asr.student_id = ?';
        params.push(student_id);
    }
    if (start_date && end_date) {
        query += ' AND asr.date BETWEEN ? AND ?';
        params.push(start_date, end_date);
    }
    if (month) {
        query += ' AND DATE_FORMAT(asr.date, "%Y-%m") = ?';
        params.push(month);
    }

    query += ' ORDER BY asr.date DESC, asr.student_id';

    pool.execute(query, params, (err, results) => {
        if (err) {
            console.error('获取考勤分数记录失败:', err);
            return res.status(500).json({ error: '获取考勤分数记录失败' });
        }
        res.json(results);
    });
});

// 创建考勤分数记录
app.post('/api/attendance-scores', authenticateToken, (req, res) => {
    const { student_id, score_change, reason, date, operator } = req.body;
    
    // 验证必填字段
    if (!student_id || !score_change || !reason || !date || !operator) {
        return res.status(400).json({ error: '所有字段都是必填的，包括操作员' });
    }
    
    // 先获取学生信息用于通知
    const getStudentQuery = 'SELECT s.*, c.name as college_name, d.name as department_name FROM students s LEFT JOIN colleges c ON s.college_id = c.id LEFT JOIN departments d ON s.department_id = d.id WHERE s.id = ?';
    pool.execute(getStudentQuery, [student_id], (err, studentResults) => {
        if (err) {
            console.error('获取学生信息失败:', err);
            return res.status(500).json({ error: '获取学生信息失败' });
        }
        
        if (studentResults.length === 0) {
            return res.status(404).json({ error: '学生不存在' });
        }
        
        const student = studentResults[0];
        
        const query = `
            INSERT INTO attendance_scores (student_id, score_change, reason, date, operator) 
            VALUES (?, ?, ?, ?, ?)
        `;
        pool.execute(query, [student_id, score_change, reason, date, operator], (err, results) => {
            if (err) {
                console.error('创建考勤分数记录失败:', err);
                return res.status(500).json({ error: '创建考勤分数记录失败' });
            }
            
            // 发送飞书通知
            const details = `**学生姓名：** ${student.name}\n**学号：** ${student.student_id}\n**学院：** ${student.college_name}\n**部门：** ${student.department_name}\n**分数变化：** ${score_change > 0 ? '+' : ''}${score_change}\n**原因：** ${reason}\n**日期：** ${date}\n**操作员：** ${operator}`;
            sendFeishuNotification('新增考勤记录', details);
            
            res.json({ message: '考勤分数记录保存成功' });
        });
    });
});

// 删除考勤分数记录
app.delete('/api/attendance-scores/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    // 先获取考勤记录信息用于通知
    const getRecordQuery = `
        SELECT asr.*, s.name as student_name, s.student_id, c.name as college_name, d.name as department_name
        FROM attendance_scores asr
        LEFT JOIN students s ON asr.student_id = s.id
        LEFT JOIN colleges c ON s.college_id = c.id
        LEFT JOIN departments d ON s.department_id = d.id
        WHERE asr.id = ?
    `;
    pool.execute(getRecordQuery, [id], (err, recordResults) => {
        if (err) {
            console.error('获取考勤记录失败:', err);
            return res.status(500).json({ error: '获取考勤记录失败' });
        }
        
        if (recordResults.length === 0) {
            return res.status(404).json({ error: '考勤分数记录不存在' });
        }
        
        const record = recordResults[0];
        
        const query = 'DELETE FROM attendance_scores WHERE id = ?';
        pool.execute(query, [id], (err, results) => {
            if (err) {
                console.error('删除考勤分数记录失败:', err);
                return res.status(500).json({ error: '删除考勤分数记录失败' });
            }
            
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: '考勤分数记录不存在' });
            }
            
            // 发送飞书通知
            const details = `**学生姓名：** ${record.student_name}\n**学号：** ${record.student_id}\n**学院：** ${record.college_name}\n**部门：** ${record.department_name}\n**分数变化：** ${record.score_change > 0 ? '+' : ''}${record.score_change}\n**原因：** ${record.reason}\n**日期：** ${record.date}\n**操作员：** ${record.operator}`;
            sendFeishuNotification('删除考勤记录', details);
            
            res.json({ message: '考勤分数记录删除成功' });
        });
    });
});

// 月度统计API
app.get('/api/attendance/stats', (req, res) => {
    const { month, department_id } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    
    let query = `
        SELECT 
            s.id as student_id,
            s.student_id,
            s.name as student_name,
            c.name as college_name,
            d.name as department_name,
            COALESCE(SUM(asr.score_change), 0) as total_score,
            COUNT(asr.id) as record_count
        FROM students s
        LEFT JOIN colleges c ON s.college_id = c.id
        LEFT JOIN departments d ON s.department_id = d.id
        LEFT JOIN attendance_scores asr ON s.id = asr.student_id 
            AND DATE_FORMAT(asr.date, '%Y-%m') = ?
        WHERE s.status = 'active'
    `;
    const params = [targetMonth];

    if (department_id) {
        query += ' AND s.department_id = ?';
        params.push(department_id);
    }

    query += ' GROUP BY s.id, s.student_id, s.name, c.name, d.name ORDER BY COALESCE(SUM(asr.score_change), 0) DESC, d.name, s.name';

    pool.execute(query, params, (err, results) => {
        if (err) {
            console.error('获取统计信息失败:', err);
            return res.status(500).json({ error: '获取统计信息失败' });
        }
        
        // 确保数据类型正确
        const processedResults = results.map(row => ({
            ...row,
            total_score: parseInt(row.total_score) || 0,
            record_count: parseInt(row.record_count) || 0
        }));
        
        res.json(processedResults);
    });
});

// Excel导出API
app.get('/api/export/stats', (req, res) => {
    const { month, department_id } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    
    let query = `
        SELECT 
            s.student_id as '学号',
            s.name as '姓名',
            c.name as '学院',
            d.name as '部门',
            COALESCE(SUM(asr.score_change), 0) as '考勤分数',
            COUNT(asr.id) as '记录次数'
        FROM students s
        LEFT JOIN colleges c ON s.college_id = c.id
        LEFT JOIN departments d ON s.department_id = d.id
        LEFT JOIN attendance_scores asr ON s.id = asr.student_id 
            AND DATE_FORMAT(asr.date, '%Y-%m') = ?
        WHERE s.status = 'active'
    `;
    const params = [targetMonth];

    if (department_id) {
        query += ' AND s.department_id = ?';
        params.push(department_id);
    }

    query += ' GROUP BY s.id, s.student_id, s.name, c.name, d.name ORDER BY COALESCE(SUM(asr.score_change), 0) DESC, d.name, s.name';

    pool.execute(query, params, (err, results) => {
        if (err) {
            console.error('获取导出数据失败:', err);
            return res.status(500).json({ error: '获取导出数据失败' });
        }

        // 确保数据类型正确
        const processedResults = results.map(row => ({
            ...row,
            '考勤分数': parseInt(row['考勤分数']) || 0,
            '记录次数': parseInt(row['记录次数']) || 0
        }));

        // 创建工作簿
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(processedResults);
        
        // 设置列宽
        const colWidths = [
            { wch: 15 }, // 学号
            { wch: 10 }, // 姓名
            { wch: 20 }, // 学院
            { wch: 15 }, // 部门
            { wch: 10 }, // 考勤分数
            { wch: 10 }  // 记录次数
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, '考勤统计');

        // 生成Excel文件
        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        // 设置响应头
        const fileName = `考勤统计_${targetMonth}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        res.send(excelBuffer);
    });
});

// Excel导入学生API
app.post('/api/students/import', authenticateToken, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '请选择Excel文件' });
    }

    // 获取当前登录用户信息作为操作员
    const operator = req.user ? req.user.name || req.user.username : '未知用户';

    try {
        // 读取Excel文件
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ error: 'Excel文件为空' });
        }

        // 验证Excel格式
        const requiredFields = ['学号', '姓名', '学院', '部门', '手机号'];
        const firstRow = data[0];
        const missingFields = requiredFields.filter(field => !(field in firstRow));
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                error: `Excel文件缺少必要字段: ${missingFields.join(', ')}` 
            });
        }

        // 获取学院和部门映射
        const collegeMap = new Map();
        const departmentMap = new Map();
        
        // 获取所有学院
        pool.execute('SELECT id, name FROM colleges', (err, colleges) => {
            if (err) {
                console.error('获取学院列表失败:', err);
                return res.status(500).json({ error: '获取学院列表失败' });
            }
            
            colleges.forEach(college => {
                collegeMap.set(college.name, college.id);
            });

            // 获取所有部门
            pool.execute('SELECT id, name FROM departments', (err, departments) => {
                if (err) {
                    console.error('获取部门列表失败:', err);
                    return res.status(500).json({ error: '获取部门列表失败' });
                }
                
                departments.forEach(department => {
                    departmentMap.set(department.name, department.id);
                });

                // 处理导入数据
                const importResults = {
                    success: 0,
                    failed: 0,
                    errors: []
                };

                let processedCount = 0;
                const totalCount = data.length;

                data.forEach((row, index) => {
                    const studentId = row['学号'];
                    const name = row['姓名'];
                    const collegeName = row['学院'];
                    const departmentName = row['部门'];
                    const phone = row['手机号'] || '';
                    const status = row['是否在职'] === '在职' ? 'active' : 'inactive';

                    // 验证学院是否存在
                    const collegeId = collegeMap.get(collegeName);
                    if (!collegeId) {
                        importResults.failed++;
                        importResults.errors.push(`第${index + 2}行: 学院"${collegeName}"不存在`);
                        processedCount++;
                        if (processedCount === totalCount) {
                            sendResponse();
                        }
                        return;
                    }

                    // 验证部门是否存在
                    const departmentId = departmentMap.get(departmentName);
                    if (!departmentId) {
                        importResults.failed++;
                        importResults.errors.push(`第${index + 2}行: 部门"${departmentName}"不存在`);
                        processedCount++;
                        if (processedCount === totalCount) {
                            sendResponse();
                        }
                        return;
                    }

                    // 插入学生数据
                    const insertQuery = `
                        INSERT INTO students (student_id, name, college_id, department_id, phone, status) 
                        VALUES (?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        college_id = VALUES(college_id),
                        department_id = VALUES(department_id),
                        phone = VALUES(phone),
                        status = VALUES(status)
                    `;
                    
                    pool.execute(insertQuery, [studentId, name, collegeId, departmentId, phone, status], (err, results) => {
                        if (err) {
                            importResults.failed++;
                            importResults.errors.push(`第${index + 2}行: ${err.message}`);
                        } else {
                            importResults.success++;
                        }
                        
                        processedCount++;
                        if (processedCount === totalCount) {
                            sendResponse();
                        }
                    });
                });

                function sendResponse() {
                    // 删除临时文件
                    const fs = require('fs');
                    fs.unlink(req.file.path, (err) => {
                        if (err) console.error('删除临时文件失败:', err);
                    });

                    // 发送飞书通知
                    const errorSummary = importResults.errors.length > 0 ? 
                        `\n**错误详情：**\n${importResults.errors.slice(0, 3).map(err => `• ${err}`).join('\n')}${importResults.errors.length > 3 ? '\n• ...' : ''}` : '';
                    const details = `**总记录数：** ${totalCount}\n**成功导入：** ${importResults.success}\n**失败数量：** ${importResults.failed}\n**操作员：** ${operator}${errorSummary}`;
                    sendFeishuNotification('Excel批量导入', details);

                    res.json({
                        message: '导入完成',
                        total: totalCount,
                        success: importResults.success,
                        failed: importResults.failed,
                        errors: importResults.errors
                    });
                }
            });
        });

    } catch (error) {
        console.error('Excel导入失败:', error);
        res.status(500).json({ error: 'Excel文件解析失败' });
    }
});

// 首页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`考勤管理系统服务器运行在 http://localhost:${PORT}`);
    console.log('请确保MySQL数据库已启动并执行了初始化脚本');
});
