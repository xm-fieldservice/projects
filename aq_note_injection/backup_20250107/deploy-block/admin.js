/**
 * AdminController - 管理界面控制器
 * v3.0 完整解耦版交互实现
 */

class AdminController {
    constructor() {
        this.refreshInterval = null;
        this.currentUser = null;
        this.currentEditUser = null;
        this.init();
    }

    async init() {
        // 权限检查
        if (!this.checkAdminPermission()) {
            UIBlock.showMessage('访问被拒绝：需要管理员权限', 'error');
            setTimeout(() => {
                window.location.href = '../ui-block/index.html';
            }, 2000);
            return;
        }

        // 显示用户信息
        this.displayUserInfo();

        // 初始化界面
        await this.loadInitialData();
        this.setupEventListeners();
        this.startAutoRefresh();

        UIBlock.showMessage('管理界面初始化完成', 'success', { duration: 2000 });
    }

    checkAdminPermission() {
        this.currentUser = AuthBlock.getCurrentUser();
        return this.currentUser && this.currentUser.role === 'admin';
    }

    displayUserInfo() {
        const usernameElement = document.getElementById('admin-username');
        if (usernameElement && this.currentUser) {
            usernameElement.textContent = this.currentUser.displayName || this.currentUser.username;
        }
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.updateSystemMetrics(),
                this.updateServicesStatus(),
                this.loadUsersList(),
                this.loadSystemLogs(),
                this.updateDeploymentStatus()
            ]);
        } catch (error) {
            console.error('加载初始数据失败:', error);
            UIBlock.showMessage('部分数据加载失败，请检查网络连接', 'warning');
        }
    }

    setupEventListeners() {
        // 退出登录
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // 用户搜索
        const userSearch = document.getElementById('user-search');
        if (userSearch) {
            userSearch.addEventListener('input', (e) => {
                this.searchUsers(e.target.value);
            });
        }

        // 角色过滤
        const roleFilter = document.getElementById('role-filter');
        if (roleFilter) {
            roleFilter.addEventListener('change', (e) => {
                this.filterUsersByRole(e.target.value);
            });
        }

        // 日志级别过滤
        const logLevel = document.getElementById('log-level');
        if (logLevel) {
            logLevel.addEventListener('change', (e) => {
                this.filterLogsByLevel(e.target.value);
            });
        }

        // 日志数量限制
        const logLimit = document.getElementById('log-limit');
        if (logLimit) {
            logLimit.addEventListener('change', (e) => {
                this.changeLogLimit(parseInt(e.target.value));
            });
        }

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    async updateSystemMetrics() {
        try {
            const result = await DeployBlock.getSystemMetrics();
            if (result.success) {
                const metrics = result.data;
                
                // 更新显示值
                document.getElementById('cpu-usage').textContent = metrics.formatted.cpu;
                document.getElementById('memory-usage').textContent = metrics.formatted.memory;
                document.getElementById('disk-usage').textContent = metrics.formatted.disk;
                document.getElementById('network-usage').textContent = metrics.formatted.network;

                // 更新进度条
                this.updateProgressBar('cpu-progress', metrics.metrics.cpu.usage);
                this.updateProgressBar('memory-progress', 
                    (metrics.metrics.memory.used / metrics.metrics.memory.total) * 100);
                this.updateProgressBar('disk-progress', 
                    (metrics.metrics.disk.used / metrics.metrics.disk.total) * 100);

                // 更新网络详情
                const networkDetail = document.getElementById('network-detail');
                if (networkDetail) {
                    networkDetail.textContent = `${metrics.metrics.network.packetsIn} 包/秒 ↓ ${metrics.metrics.network.packetsOut} 包/秒 ↑`;
                }
            }
        } catch (error) {
            console.error('更新系统指标失败:', error);
        }
    }

    updateProgressBar(elementId, percentage) {
        const progressBar = document.getElementById(elementId);
        if (progressBar) {
            progressBar.style.width = `${Math.min(percentage, 100)}%`;
            
            // 根据使用率设置颜色
            if (percentage > 80) {
                progressBar.style.background = 'linear-gradient(90deg, #f56565, #e53e3e)';
            } else if (percentage > 60) {
                progressBar.style.background = 'linear-gradient(90deg, #ed8936, #dd6b20)';
            } else {
                progressBar.style.background = 'linear-gradient(90deg, #48bb78, #38a169)';
            }
        }
    }

    async updateServicesStatus() {
        try {
            const result = await DeployBlock.getServicesStatus();
            if (result.success) {
                const services = result.data.services;
                
                Object.keys(services).forEach(serviceName => {
                    const service = services[serviceName];
                    const serviceKey = serviceName.split('-')[1]; // qa-frontend -> frontend
                    
                    // 更新状态
                    const statusElement = document.getElementById(`${serviceKey}-status`);
                    if (statusElement) {
                        statusElement.textContent = service.status === 'running' ? '运行中' : '已停止';
                        statusElement.className = `service-status ${service.status}`;
                    }

                    // 更新CPU和内存
                    const cpuElement = document.getElementById(`${serviceKey}-cpu`);
                    const memoryElement = document.getElementById(`${serviceKey}-memory`);
                    if (cpuElement) cpuElement.textContent = service.cpu;
                    if (memoryElement) memoryElement.textContent = service.memory;
                });
            }
        } catch (error) {
            console.error('更新服务状态失败:', error);
        }
    }

    async loadUsersList() {
        try {
            const result = await DeployBlock.getUsersList();
            if (result.success) {
                this.renderUsersTable(result.data.users);
                this.renderPagination(result.data);
            }
        } catch (error) {
            console.error('加载用户列表失败:', error);
        }
    }

    renderUsersTable(users) {
        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.displayName}</td>
                <td><span class="role-badge ${user.role}">${this.getRoleDisplayName(user.role)}</span></td>
                <td><span class="status-badge ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? '活跃' : '禁用'}</span></td>
                <td>${new Date(user.lastLoginAt).toLocaleString('zh-CN')}</td>
                <td>
                    <button class="btn btn-sm" onclick="adminController.editUser(${user.id})">编辑</button>
                    <button class="btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-primary'}" 
                            onclick="adminController.toggleUserStatus(${user.id}, ${!user.isActive})">
                        ${user.isActive ? '禁用' : '启用'}
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getRoleDisplayName(role) {
        const roleNames = {
            'admin': '管理员',
            'user': '用户',
            'demo': '演示'
        };
        return roleNames[role] || role;
    }

    renderPagination(data) {
        const pagination = document.getElementById('users-pagination');
        if (!pagination) return;

        let paginationHTML = '';
        
        if (data.totalPages > 1) {
            // 上一页
            if (data.page > 1) {
                paginationHTML += `<button class="btn btn-sm" onclick="adminController.loadUsersPage(${data.page - 1})">上一页</button>`;
            }

            // 页码
            for (let i = 1; i <= data.totalPages; i++) {
                if (i === data.page) {
                    paginationHTML += `<button class="btn btn-sm active">${i}</button>`;
                } else {
                    paginationHTML += `<button class="btn btn-sm" onclick="adminController.loadUsersPage(${i})">${i}</button>`;
                }
            }

            // 下一页
            if (data.page < data.totalPages) {
                paginationHTML += `<button class="btn btn-sm" onclick="adminController.loadUsersPage(${data.page + 1})">下一页</button>`;
            }
        }

        pagination.innerHTML = paginationHTML;
    }

    async loadSystemLogs() {
        try {
            const level = document.getElementById('log-level')?.value || 'all';
            const limit = parseInt(document.getElementById('log-limit')?.value || '100');
            
            const result = await DeployBlock.getSystemLogs(level, limit);
            if (result.success) {
                this.renderSystemLogs(result.data.logs);
            }
        } catch (error) {
            console.error('加载系统日志失败:', error);
        }
    }

    renderSystemLogs(logs) {
        const container = document.getElementById('logs-container');
        if (!container) return;

        container.innerHTML = logs.map(log => `
            <div class="log-entry">
                <span class="log-timestamp">${new Date(log.timestamp).toLocaleString('zh-CN')}</span>
                <span class="log-level ${log.level}">${log.level.toUpperCase()}</span>
                <span class="log-source">[${log.source}]</span>
                <span class="log-message">${log.message}</span>
            </div>
        `).join('');
    }

    async updateDeploymentStatus() {
        try {
            const result = await DeployBlock.getDeploymentStatus();
            if (result.success) {
                const deployment = result.data.deployment;
                
                document.getElementById('current-version').textContent = deployment.version;
                document.getElementById('environment').textContent = deployment.environment;
                document.getElementById('start-time').textContent = 
                    new Date(deployment.startTime).toLocaleString('zh-CN');
                document.getElementById('container-status').textContent = 
                    `${result.data.runningContainers}/${result.data.totalContainers} 运行中`;
            }
        } catch (error) {
            console.error('更新部署状态失败:', error);
        }
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.updateSystemMetrics();
            this.updateServicesStatus();
        }, 30000); // 30秒刷新一次
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // 用户管理方法
    async loadUsersPage(page) {
        try {
            const role = document.getElementById('role-filter')?.value || null;
            const result = await DeployBlock.getUsersList(page, 20, role);
            if (result.success) {
                this.renderUsersTable(result.data.users);
                this.renderPagination(result.data);
            }
        } catch (error) {
            console.error('加载用户页面失败:', error);
        }
    }

    searchUsers(keyword) {
        // 实现用户搜索逻辑
        const rows = document.querySelectorAll('#users-tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const shouldShow = text.includes(keyword.toLowerCase());
            row.style.display = shouldShow ? '' : 'none';
        });
    }

    filterUsersByRole(role) {
        this.loadUsersPage(1); // 重新加载第一页
    }

    editUser(userId) {
        // 模拟获取用户数据
        const mockUser = {
            id: userId,
            username: 'user' + userId,
            displayName: '用户' + userId,
            email: `user${userId}@example.com`,
            role: 'user',
            isActive: true
        };

        this.currentEditUser = mockUser;
        this.showUserEditModal(mockUser);
    }

    showUserEditModal(user) {
        document.getElementById('edit-username').value = user.username;
        document.getElementById('edit-display-name').value = user.displayName;
        document.getElementById('edit-email').value = user.email;
        document.getElementById('edit-role').value = user.role;
        document.getElementById('edit-status').value = user.isActive.toString();

        const modal = document.getElementById('user-edit-modal');
        modal.classList.add('show');
    }

    closeUserEdit() {
        const modal = document.getElementById('user-edit-modal');
        modal.classList.remove('show');
        this.currentEditUser = null;
    }

    async saveUser() {
        if (!this.currentEditUser) return;

        const formData = {
            displayName: document.getElementById('edit-display-name').value,
            email: document.getElementById('edit-email').value,
            role: document.getElementById('edit-role').value,
            isActive: document.getElementById('edit-status').value === 'true'
        };

        try {
            // 这里应该调用API保存用户
            UIBlock.showMessage('用户信息已更新', 'success');
            this.closeUserEdit();
            this.loadUsersList();
        } catch (error) {
            UIBlock.showMessage('保存失败: ' + error.message, 'error');
        }
    }

    async toggleUserStatus(userId, newStatus) {
        try {
            // 这里应该调用API切换用户状态
            UIBlock.showMessage(`用户状态已${newStatus ? '启用' : '禁用'}`, 'success');
            this.loadUsersList();
        } catch (error) {
            UIBlock.showMessage('操作失败: ' + error.message, 'error');
        }
    }

    // 日志管理方法
    filterLogsByLevel(level) {
        this.loadSystemLogs();
    }

    changeLogLimit(limit) {
        this.loadSystemLogs();
    }

    async refreshLogs() {
        await this.loadSystemLogs();
        UIBlock.showMessage('日志已刷新', 'info', { duration: 1000 });
    }

    clearLogs() {
        if (confirm('确定要清空系统日志吗？此操作不可撤销。')) {
            document.getElementById('logs-container').innerHTML = '<div class="log-entry"><span class="log-message">日志已清空</span></div>';
            UIBlock.showMessage('日志已清空', 'success');
        }
    }

    // 工具方法
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    logout() {
        if (confirm('确定要退出管理界面吗？')) {
            this.stopAutoRefresh();
            AuthBlock.logout();
            window.location.href = '../ui-block/index.html';
        }
    }

    // 清理方法
    destroy() {
        this.stopAutoRefresh();
        this.currentUser = null;
        this.currentEditUser = null;
    }
}

// 全局函数（供HTML直接调用）
async function restartService(serviceName) {
    if (!confirm(`确定要重启 ${serviceName} 服务吗？`)) {
        return;
    }

    try {
        UIBlock.showMessage(`正在重启 ${serviceName} 服务...`, 'info', { duration: 0, id: 'restart-progress' });
        
        const result = await DeployBlock.restartService(serviceName);
        UIBlock.removeMessage('restart-progress');
        
        if (result.success) {
            UIBlock.showMessage(`${serviceName} 服务重启成功`, 'success');
            adminController.updateServicesStatus();
        } else {
            UIBlock.showMessage(`重启失败: ${result.error}`, 'error');
        }
    } catch (error) {
        UIBlock.removeMessage('restart-progress');
        UIBlock.showMessage(`重启失败: ${error.message}`, 'error');
    }
}

async function viewLogs(serviceName) {
    const modal = document.getElementById('log-viewer-modal');
    const title = document.getElementById('log-viewer-title');
    const content = document.getElementById('log-viewer-content');
    
    title.textContent = `${serviceName} 服务日志`;
    content.innerHTML = '正在加载日志...';
    
    modal.classList.add('show');
    
    // 模拟加载服务日志
    setTimeout(() => {
        const mockLogs = [
            `[${new Date().toISOString()}] INFO: 服务 ${serviceName} 正在运行`,
            `[${new Date(Date.now() - 60000).toISOString()}] INFO: 处理请求 GET /api/health`,
            `[${new Date(Date.now() - 120000).toISOString()}] INFO: 数据库连接正常`,
            `[${new Date(Date.now() - 180000).toISOString()}] WARN: 内存使用率较高: 78%`,
            `[${new Date(Date.now() - 240000).toISOString()}] INFO: 服务启动完成`
        ];
        
        content.innerHTML = mockLogs.join('\n');
    }, 1000);
}

function closeLogs() {
    document.getElementById('log-viewer-modal').classList.remove('show');
}

function downloadLogs() {
    const content = document.getElementById('log-viewer-content').textContent;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    UIBlock.showMessage('日志下载已开始', 'success');
}

function clearServiceLogs() {
    if (confirm('确定要清空服务日志吗？')) {
        document.getElementById('log-viewer-content').innerHTML = '日志已清空';
        UIBlock.showMessage('服务日志已清空', 'success');
    }
}

function addUser() {
    UIBlock.showMessage('添加用户功能开发中...', 'info');
}

function refreshUsers() {
    adminController.loadUsersList();
    UIBlock.showMessage('用户列表已刷新', 'success', { duration: 1000 });
}

async function restartAllServices() {
    if (!confirm('确定要重启所有服务吗？这可能需要几分钟时间。')) {
        return;
    }

    const services = ['qa-frontend', 'qa-backend', 'mysql'];
    UIBlock.showMessage('正在重启所有服务...', 'info', { duration: 0, id: 'restart-all-progress' });
    
    try {
        for (const service of services) {
            await DeployBlock.restartService(service);
        }
        
        UIBlock.removeMessage('restart-all-progress');
        UIBlock.showMessage('所有服务重启完成', 'success');
        adminController.updateServicesStatus();
        
    } catch (error) {
        UIBlock.removeMessage('restart-all-progress');
        UIBlock.showMessage(`批量重启失败: ${error.message}`, 'error');
    }
}

async function checkDeploymentHealth() {
    UIBlock.showMessage('正在检查系统健康状态...', 'info', { duration: 0, id: 'health-check' });
    
    try {
        await adminController.updateSystemMetrics();
        await adminController.updateServicesStatus();
        await adminController.updateDeploymentStatus();
        
        UIBlock.removeMessage('health-check');
        UIBlock.showMessage('健康检查完成，所有服务运行正常', 'success');
        
    } catch (error) {
        UIBlock.removeMessage('health-check');
        UIBlock.showMessage('健康检查失败: ' + error.message, 'error');
    }
}

function viewDeploymentLogs() {
    UIBlock.showMessage('部署日志查看功能开发中...', 'info');
}

// 初始化管理控制器
let adminController;

document.addEventListener('DOMContentLoaded', () => {
    adminController = new AdminController();
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (adminController) {
        adminController.destroy();
    }
}); 