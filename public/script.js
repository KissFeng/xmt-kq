// 全局变量
let currentStudent = null;
let currentAttendanceScore = null;
let isLoggedIn = false;
let currentUser = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 设置默认日期
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('dateFilter').value = today;
    document.getElementById('attendanceScoreDate').value = today;
    
    // 设置默认月份
    const currentMonth = new Date().toISOString().slice(0, 7);
    document.getElementById('statsMonthFilter').value = currentMonth;
    
    // 检查登录状态
    checkLoginStatus();
    
    // 加载初始数据
    loadDashboard();
    loadStudents();
    loadColleges();
    loadDepartments();
    loadAttendanceScores();
    loadStats();
});

// 认证相关函数
async function checkLoginStatus() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showPermissionNotice();
        return;
    }
    
    try {
        const response = await fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            isLoggedIn = true;
            currentUser = data.user;
            showUserInfo();
            hidePermissionNotice();
        } else {
            localStorage.removeItem('authToken');
            showPermissionNotice();
        }
    } catch (error) {
        console.error('验证登录状态失败:', error);
        localStorage.removeItem('authToken');
        showPermissionNotice();
    }
}

function showPermissionNotice() {
    const notices = document.querySelectorAll('.permission-notice');
    if (notices.length === 0) {
        // 在主要内容区域添加权限提示
        const main = document.querySelector('main');
        const notice = document.createElement('div');
        notice.className = 'permission-notice';
        notice.innerHTML = '🔒 您当前处于只读模式，登录后可进行修改操作';
        main.insertBefore(notice, main.firstChild);
    }
    
    // 禁用所有修改按钮
    disableModifyButtons();
}

function hidePermissionNotice() {
    const notices = document.querySelectorAll('.permission-notice');
    notices.forEach(notice => notice.remove());
    
    // 启用所有修改按钮
    enableModifyButtons();
}

function disableModifyButtons() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-danger, .btn-warning, .btn-success');
    buttons.forEach(button => {
        if (button.textContent.includes('添加') || 
            button.textContent.includes('编辑') || 
            button.textContent.includes('删除') || 
            button.textContent.includes('导入') ||
            button.textContent.includes('保存')) {
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
        }
    });
}

function enableModifyButtons() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-danger, .btn-warning, .btn-success');
    buttons.forEach(button => {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    });
}

function showUserInfo() {
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    userName.textContent = `欢迎，${currentUser.name}`;
    userInfo.style.display = 'flex';
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginForm').reset();
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showMessage('请输入用户名和密码', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('authToken', data.token);
            isLoggedIn = true;
            currentUser = data.user;
            
            showMessage('登录成功', 'success');
            closeLoginModal();
            showUserInfo();
            hidePermissionNotice();
        } else {
            const error = await response.json();
            showMessage(error.error || '登录失败', 'error');
        }
    } catch (error) {
        console.error('登录失败:', error);
        showMessage('登录失败', 'error');
    }
}

function logout() {
    localStorage.removeItem('authToken');
    isLoggedIn = false;
    currentUser = null;
    
    document.getElementById('userInfo').style.display = 'none';
    showPermissionNotice();
    showMessage('已退出登录', 'success');
}

// 登录表单提交
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    login();
});

// 导航功能
function showSection(sectionId) {
    // 隐藏所有section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 显示选中的section
    document.getElementById(sectionId).classList.add('active');
    
    // 更新导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 根据section加载相应数据
    switch(sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'students':
            loadStudents();
            break;
        case 'attendance':
            loadAttendanceScores();
            break;
        case 'stats':
            loadStats();
            break;
    }
}

// 首页数据加载
async function loadDashboard() {
    try {
        const [studentsRes, departmentsRes, attendanceScoresRes] = await Promise.all([
            fetch('/api/students'),
            fetch('/api/departments'),
            fetch('/api/attendance-scores?start_date=' + new Date().toISOString().slice(0, 10))
        ]);
        
        const students = await studentsRes.json();
        const departments = await departmentsRes.json();
        const attendanceScores = await attendanceScoresRes.json();
        
        document.getElementById('totalUsers').textContent = students.length;
        document.getElementById('totalDepartments').textContent = departments.length;
        document.getElementById('todayAttendance').textContent = attendanceScores.length;
        
        // 计算本月总分数
        const currentMonth = new Date().toISOString().slice(0, 7);
        const statsRes = await fetch(`/api/attendance/stats?month=${currentMonth}`);
        const stats = await statsRes.json();
        
        if (stats.length > 0) {
            const totalScore = stats.reduce((sum, stat) => sum + stat.total_score, 0);
            document.getElementById('monthlyRate').textContent = totalScore + '分';
        } else {
            document.getElementById('monthlyRate').textContent = '0分';
        }
        
        // 加载部门统计数据
        await loadDepartmentStats(stats);
    } catch (error) {
        console.error('加载首页数据失败:', error);
        showMessage('加载首页数据失败', 'error');
    }
}

// 加载部门统计数据
async function loadDepartmentStats(stats) {
    const container = document.getElementById('departmentStatsContainer');
    
    try {
        // 获取所有部门
        const departmentsRes = await fetch('/api/departments');
        const allDepartments = await departmentsRes.json();
        
        // 按部门分组统计考勤数据
        const departmentStats = {};
        
        // 初始化所有部门
        allDepartments.forEach(dept => {
            departmentStats[dept.name] = {
                name: dept.name,
                studentCount: 0,
                totalScore: 0,
                recordCount: 0,
                avgScore: 0
            };
        });
        
        // 如果有考勤统计数据，则更新对应部门
        if (stats && stats.length > 0) {
            stats.forEach(stat => {
                const deptName = stat.department_name;
                if (departmentStats[deptName]) {
                    departmentStats[deptName].studentCount++;
                    departmentStats[deptName].totalScore += stat.total_score;
                    departmentStats[deptName].recordCount += stat.record_count;
                }
            });
        }
        
        // 计算平均分数
        Object.values(departmentStats).forEach(dept => {
            dept.avgScore = dept.studentCount > 0 ? Math.round(dept.totalScore / dept.studentCount) : 0;
        });
        
        // 生成HTML
        const departmentCards = Object.values(departmentStats).map(dept => `
            <div class="department-card">
                <h4>${dept.name}</h4>
                <div class="department-metrics">
                    <div class="metric">
                        <div class="metric-label">学生人数</div>
                        <div class="metric-value">${dept.studentCount}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">总分数</div>
                        <div class="metric-value ${dept.totalScore >= 0 ? 'positive' : 'negative'}">${dept.totalScore}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">平均分数</div>
                        <div class="metric-value ${dept.avgScore >= 0 ? 'positive' : 'negative'}">${dept.avgScore}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">记录次数</div>
                        <div class="metric-value">${dept.recordCount}</div>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = `
            <div class="department-stats-grid">
                ${departmentCards}
            </div>
        `;
    } catch (error) {
        console.error('加载部门统计数据失败:', error);
        container.innerHTML = '<p style="text-align: center; color: #dc3545; padding: 2rem;">加载部门数据失败</p>';
    }
}

// 学生管理功能
async function loadStudents() {
    try {
        const collegeFilter = document.getElementById('studentCollegeFilter').value;
        const departmentFilter = document.getElementById('studentDepartmentFilter').value;
        
        let url = '/api/students?';
        if (collegeFilter) url += `college_id=${collegeFilter}&`;
        if (departmentFilter) url += `department_id=${departmentFilter}&`;
        
        const response = await fetch(url);
        const students = await response.json();
        
        const tbody = document.querySelector('#studentsTable tbody');
        tbody.innerHTML = '';
        
        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.student_id}</td>
                <td>${student.name}</td>
                <td>${student.college_name || '未分配'}</td>
                <td>${student.department_name || '未分配'}</td>
                <td>${student.phone || '-'}</td>
                <td><span class="status ${student.status}">${student.status === 'active' ? '在职' : '离职'}</span></td>
                <td>
                    <button class="btn btn-warning" onclick="editStudent(${student.id})">编辑</button>
                    <button class="btn btn-danger" onclick="deleteStudent(${student.id})">删除</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('加载学生列表失败:', error);
        showMessage('加载学生列表失败', 'error');
    }
}

async function loadColleges() {
    try {
        const response = await fetch('/api/colleges');
        const colleges = await response.json();
        
        // 填充学院选择框
        const studentCollegeSelect = document.getElementById('studentCollege');
        const studentCollegeFilter = document.getElementById('studentCollegeFilter');
        
        studentCollegeSelect.innerHTML = '<option value="">请选择学院</option>';
        studentCollegeFilter.innerHTML = '<option value="">所有学院</option>';
        
        colleges.forEach(college => {
            const option1 = document.createElement('option');
            option1.value = college.id;
            option1.textContent = college.name;
            studentCollegeSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = college.id;
            option2.textContent = college.name;
            studentCollegeFilter.appendChild(option2);
        });
    } catch (error) {
        console.error('加载学院列表失败:', error);
    }
}

async function loadDepartments() {
    try {
        const response = await fetch('/api/departments');
        const departments = await response.json();
        
        // 填充部门选择框
        const studentDepartmentSelect = document.getElementById('studentDepartment');
        const studentDepartmentFilter = document.getElementById('studentDepartmentFilter');
        const statsDepartmentSelect = document.getElementById('statsDepartmentFilter');
        
        studentDepartmentSelect.innerHTML = '<option value="">请选择部门</option>';
        studentDepartmentFilter.innerHTML = '<option value="">所有部门</option>';
        statsDepartmentSelect.innerHTML = '<option value="">所有部门</option>';
        
        departments.forEach(dept => {
            const option1 = document.createElement('option');
            option1.value = dept.id;
            option1.textContent = dept.name;
            studentDepartmentSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = dept.id;
            option2.textContent = dept.name;
            studentDepartmentFilter.appendChild(option2);
            
            const option3 = document.createElement('option');
            option3.value = dept.id;
            option3.textContent = dept.name;
            statsDepartmentSelect.appendChild(option3);
        });
    } catch (error) {
        console.error('加载部门列表失败:', error);
    }
}

function showStudentModal(studentId = null) {
    currentStudent = studentId;
    const modal = document.getElementById('studentModal');
    const title = document.getElementById('studentModalTitle');
    const form = document.getElementById('studentForm');
    
    if (studentId) {
        title.textContent = '编辑学生';
        loadStudentData(studentId);
    } else {
        title.textContent = '添加学生';
        form.reset();
        document.getElementById('studentStatus').value = 'active';
    }
    
    modal.style.display = 'block';
}

async function loadStudentData(studentId) {
    try {
        const response = await fetch(`/api/students/${studentId}`);
        const student = await response.json();
        
        document.getElementById('studentId').value = student.id;
        document.getElementById('studentIdInput').value = student.student_id;
        document.getElementById('studentName').value = student.name;
        document.getElementById('studentCollege').value = student.college_id;
        document.getElementById('studentDepartment').value = student.department_id;
        document.getElementById('studentPhone').value = student.phone || '';
        document.getElementById('studentStatus').value = student.status;
    } catch (error) {
        console.error('加载学生数据失败:', error);
        showMessage('加载学生数据失败', 'error');
    }
}

function closeStudentModal() {
    document.getElementById('studentModal').style.display = 'none';
    currentStudent = null;
}

async function editStudent(studentId) {
    showStudentModal(studentId);
}

async function deleteStudent(studentId) {
    if (confirm('确定要删除这个学生吗？')) {
        try {
            const response = await fetch(`/api/students/${studentId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                showMessage('学生删除成功', 'success');
                loadStudents();
            } else {
                const error = await response.json();
                showMessage(error.error || '删除学生失败', 'error');
            }
        } catch (error) {
            console.error('删除学生失败:', error);
            showMessage('删除学生失败', 'error');
        }
    }
}

// 学生表单提交
document.getElementById('studentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        student_id: document.getElementById('studentIdInput').value,
        name: document.getElementById('studentName').value,
        college_id: document.getElementById('studentCollege').value,
        department_id: document.getElementById('studentDepartment').value,
        phone: document.getElementById('studentPhone').value,
        status: document.getElementById('studentStatus').value
    };
    
    try {
        const url = currentStudent ? `/api/students/${currentStudent}` : '/api/students';
        const method = currentStudent ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showMessage(currentStudent ? '学生更新成功' : '学生创建成功', 'success');
            closeStudentModal();
            loadStudents();
        } else {
            const error = await response.json();
            showMessage(error.error || '操作失败', 'error');
        }
    } catch (error) {
        console.error('保存学生失败:', error);
        showMessage('保存学生失败', 'error');
    }
});

// 考勤分数管理功能
async function loadAttendanceScores() {
    try {
        const studentFilter = document.getElementById('studentFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        
        let url = '/api/attendance-scores?';
        if (studentFilter) url += `student_id=${studentFilter}&`;
        if (dateFilter) url += `start_date=${dateFilter}&end_date=${dateFilter}&`;
        
        const response = await fetch(url);
        const attendanceScores = await response.json();
        
        const tbody = document.querySelector('#attendanceScoresTable tbody');
        tbody.innerHTML = '';
        
        attendanceScores.forEach(record => {
            const row = document.createElement('tr');
            const scoreClass = record.score_change > 0 ? 'positive' : 'negative';
            // 格式化日期显示
            const formattedDate = formatDate(record.date);
            row.innerHTML = `
                <td>${record.student_id}</td>
                <td>${record.student_name}</td>
                <td>${record.college_name}</td>
                <td>${record.department_name}</td>
                <td>${formattedDate}</td>
                <td><span class="score-change ${scoreClass}">${record.score_change > 0 ? '+' : ''}${record.score_change}</span></td>
                <td>${record.reason}</td>
                <td>${record.operator || '-'}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteAttendanceScore(${record.id})" ${!isLoggedIn ? 'disabled' : ''}>
                        删除
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('加载考勤分数记录失败:', error);
        showMessage('加载考勤分数记录失败', 'error');
    }
}

async function loadStudentsForAttendance() {
    try {
        const response = await fetch('/api/students');
        const students = await response.json();
        
        const studentFilter = document.getElementById('studentFilter');
        const attendanceStudent = document.getElementById('attendanceStudent');
        
        studentFilter.innerHTML = '<option value="">所有学生</option>';
        attendanceStudent.innerHTML = '<option value="">请选择学生</option>';
        
        students.forEach(student => {
            const option1 = document.createElement('option');
            option1.value = student.id;
            option1.textContent = `${student.name} (${student.student_id})`;
            studentFilter.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = student.id;
            option2.textContent = `${student.name} (${student.student_id})`;
            attendanceStudent.appendChild(option2);
        });
    } catch (error) {
        console.error('加载学生列表失败:', error);
    }
}

function showAttendanceScoreModal(attendanceScoreId = null) {
    currentAttendanceScore = attendanceScoreId;
    const modal = document.getElementById('attendanceScoreModal');
    const title = document.getElementById('attendanceScoreModalTitle');
    const form = document.getElementById('attendanceScoreForm');
    
    title.textContent = '添加考勤分数记录';
    form.reset();
    document.getElementById('attendanceScoreDate').value = new Date().toISOString().slice(0, 10);
    
    // 加载学生列表
    loadStudentsForAttendance();
    
    modal.style.display = 'block';
}


function closeAttendanceScoreModal() {
    document.getElementById('attendanceScoreModal').style.display = 'none';
    currentAttendanceScore = null;
}

// 删除考勤分数记录
async function deleteAttendanceScore(id) {
    if (!isLoggedIn) {
        showMessage('请先登录', 'error');
        return;
    }
    
    if (!confirm('确定要删除这条考勤分数记录吗？此操作不可撤销。')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/attendance-scores/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showMessage('考勤分数记录删除成功', 'success');
            loadAttendanceScores(); // 重新加载列表
        } else {
            const error = await response.json();
            showMessage(error.error || '删除失败', 'error');
        }
    } catch (error) {
        console.error('删除考勤分数记录失败:', error);
        showMessage('删除考勤分数记录失败', 'error');
    }
}


// 考勤分数表单提交
document.getElementById('attendanceScoreForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        student_id: document.getElementById('attendanceStudent').value,
        date: document.getElementById('attendanceScoreDate').value,
        score_change: parseInt(document.getElementById('scoreChange').value),
        reason: document.getElementById('scoreReason').value,
        operator: document.getElementById('operator').value
    };
    
    try {
        const response = await fetch('/api/attendance-scores', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showMessage('考勤分数记录创建成功', 'success');
            closeAttendanceScoreModal();
            loadAttendanceScores();
        } else {
            const error = await response.json();
            showMessage(error.error || '创建失败', 'error');
        }
    } catch (error) {
        console.error('保存考勤分数记录失败:', error);
        showMessage('保存考勤分数记录失败', 'error');
    }
});

// 统计功能
async function loadStats() {
    try {
        const departmentFilter = document.getElementById('statsDepartmentFilter').value;
        const monthFilter = document.getElementById('statsMonthFilter').value;
        
        let url = `/api/attendance/stats?month=${monthFilter}`;
        if (departmentFilter) url += `&department_id=${departmentFilter}`;
        
        const response = await fetch(url);
        const stats = await response.json();
        
        const tbody = document.querySelector('#statsTable tbody');
        tbody.innerHTML = '';
        
        stats.forEach(stat => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${stat.student_id}</td>
                <td>${stat.student_name}</td>
                <td>${stat.college_name}</td>
                <td>${stat.department_name}</td>
                <td><span class="score-display ${stat.total_score >= 0 ? 'positive' : 'negative'}">${stat.total_score}</span></td>
                <td>${stat.record_count}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('加载统计信息失败:', error);
        showMessage('加载统计信息失败', 'error');
    }
}

// Excel导出功能
async function exportToExcel() {
    try {
        const departmentFilter = document.getElementById('statsDepartmentFilter').value;
        const monthFilter = document.getElementById('statsMonthFilter').value;
        
        let url = `/api/export/stats?month=${monthFilter}`;
        if (departmentFilter) url += `&department_id=${departmentFilter}`;
        
        const response = await fetch(url);
        
        if (response.ok) {
            const blob = await response.blob();
            const url2 = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url2;
            a.download = `考勤统计_${monthFilter || new Date().toISOString().slice(0, 7)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url2);
            document.body.removeChild(a);
            showMessage('Excel文件导出成功', 'success');
        } else {
            const error = await response.json();
            showMessage(error.error || '导出失败', 'error');
        }
    } catch (error) {
        console.error('导出Excel失败:', error);
        showMessage('导出Excel失败', 'error');
    }
}

// 工具函数
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        // 处理不同的日期格式
        let date;
        if (dateString.includes('T')) {
            // ISO格式：2025-09-26T16:00:00.000Z
            date = new Date(dateString);
        } else {
            // 简单日期格式：2025-09-26
            date = new Date(dateString);
        }
        
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
            return dateString; // 如果无法解析，返回原始字符串
        }
        
        // 格式化为 YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('日期格式化失败:', error);
        return dateString; // 如果格式化失败，返回原始字符串
    }
}

// 获取认证头
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

function showMessage(message, type = 'info') {
    // 移除现有消息
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 创建新消息
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // 插入到页面顶部
    const main = document.querySelector('main');
    main.insertBefore(messageDiv, main.firstChild);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}

// Excel导入功能
function showImportModal() {
    document.getElementById('importModal').style.display = 'block';
}

function closeImportModal() {
    document.getElementById('importModal').style.display = 'none';
    document.getElementById('importForm').reset();
}

async function downloadTemplate() {
    try {
        const response = await fetch('/api/template/download');
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '学生信息导入示例.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showMessage('模板文件下载成功', 'success');
        } else {
            const error = await response.json();
            showMessage(error.error || '下载模板失败', 'error');
        }
    } catch (error) {
        console.error('下载模板失败:', error);
        showMessage('下载模板失败', 'error');
    }
}

// Excel导入表单提交
document.getElementById('importForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showMessage('请选择Excel文件', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        showMessage('正在导入，请稍候...', 'info');
        
        const response = await fetch('/api/students/import', {
            method: 'POST',
            headers: {
                'Authorization': getAuthHeaders().Authorization
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            let message = `导入完成！总计：${result.total}条，成功：${result.success}条，失败：${result.failed}条`;
            if (result.errors.length > 0) {
                message += '\n\n错误详情：\n' + result.errors.join('\n');
            }
            showMessage(message, result.failed > 0 ? 'error' : 'success');
            closeImportModal();
            loadStudents(); // 刷新学生列表
        } else {
            showMessage(result.error || '导入失败', 'error');
        }
    } catch (error) {
        console.error('导入失败:', error);
        showMessage('导入失败：' + error.message, 'error');
    }
});

// 点击模态框外部关闭
window.onclick = function(event) {
    const studentModal = document.getElementById('studentModal');
    const attendanceScoreModal = document.getElementById('attendanceScoreModal');
    const importModal = document.getElementById('importModal');
    
    if (event.target === studentModal) {
        closeStudentModal();
    }
    if (event.target === attendanceScoreModal) {
        closeAttendanceScoreModal();
    }
    if (event.target === importModal) {
        closeImportModal();
    }
}
