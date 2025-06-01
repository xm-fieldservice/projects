/**
 * AuthBlock认证模块 - 用户认证逻辑
 * 处理登录、演示模式、表单验证等功能
 */
window.AuthBlock = {
    
    // 模块配置
    config: {
        demoCredentials: {
            admin: { username: 'admin', password: 'admin123', role: 'admin' },
            user: { username: 'user', password: 'user123', role: 'user' }
        },
        validationRules: {
            username: {
                minLength: 3,
                maxLength: 20,
                pattern: /^[a-zA-Z0-9_]+$/
            },
            password: {
                minLength: 6,
                maxLength: 50
            }
        },
        redirectUrls: {
            admin: '../ui-block/admin.html',
            user: '../ui-block/main.html',
            demo: '../ui-block/demo.html'
        }
    },
    
    // DOM元素引用
    elements: {},
    
    // 初始化模块
    init() {
        console.log('🔐 AuthBlock 初始化开始...');
        
        this.initElements();
        this.bindEvents();
        this.initFormValidation();
        this.checkAutoLogin();
        
        console.log('✅ AuthBlock 初始化完成');
    },
    
    // 初始化DOM元素引用
    initElements() {
        this.elements = {
            loginForm: document.getElementById('loginForm'),
            usernameInput: document.getElementById('username'),
            passwordInput: document.getElementById('password'),
            passwordToggle: document.getElementById('passwordToggle'),
            rememberMeCheckbox: document.getElementById('rememberMe'),
            loginBtn: document.getElementById('loginBtn'),
            demoBtn: document.getElementById('demoBtn'),
            authError: document.getElementById('authError'),
            authErrorText: document.getElementById('authErrorText'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            usernameError: document.getElementById('usernameError'),
            passwordError: document.getElementById('passwordError')
        };
    },
    
    // 绑定事件监听器
    bindEvents() {
        // 登录表单提交
        this.elements.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // 演示模式按钮
        this.elements.demoBtn.addEventListener('click', () => {
            this.handleDemoMode();
        });
        
        // 密码显示/隐藏切换
        this.elements.passwordToggle.addEventListener('click', () => {
            this.togglePasswordVisibility();
        });
        
        // 实时表单验证
        this.elements.usernameInput.addEventListener('input', 
            QAUtils.debounce(() => this.validateUsername(), 300)
        );
        
        this.elements.passwordInput.addEventListener('input', 
            QAUtils.debounce(() => this.validatePassword(), 300)
        );
        
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.isLoading()) {
                this.handleLogin();
            }
        });
        
        // 忘记密码链接
        const forgotPasswordLink = document.querySelector('.forgot-password');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }
    },
    
    // 初始化表单验证
    initFormValidation() {
        // 设置输入框的自定义验证消息
        this.elements.usernameInput.addEventListener('invalid', (e) => {
            e.preventDefault();
            this.showFieldError('username', '请输入有效的用户名');
        });
        
        this.elements.passwordInput.addEventListener('invalid', (e) => {
            e.preventDefault();
            this.showFieldError('password', '请输入密码');
        });
    },
    
    // 检查自动登录
    checkAutoLogin() {
        const rememberedUser = QAUtils.storage.get('remembered_user');
        const authToken = localStorage.getItem('qa_auth_token');
        
        if (rememberedUser && authToken) {
            this.showMessage('检测到已保存的登录信息，正在自动登录...', 'info');
            
            // 延迟自动登录，给用户看到消息的时间
            setTimeout(() => {
                this.autoLogin(rememberedUser);
            }, 1000);
        }
    },
    
    // 自动登录
    async autoLogin(userInfo) {
        try {
            this.showLoading(true, '正在验证身份...');
            
            // 验证token有效性
            const userResult = await APIClient.getCurrentUser();
            
            if (userResult.success) {
                this.showMessage('自动登录成功！', 'success');
                this.redirectAfterLogin(userInfo.role || 'user');
            } else {
                // Token无效，清除保存的信息
                this.clearRememberedUser();
                this.showMessage('登录状态已过期，请重新登录', 'warning');
            }
        } catch (error) {
            this.clearRememberedUser();
            this.showMessage('自动登录失败，请手动登录', 'warning');
        } finally {
            this.showLoading(false);
        }
    },
    
    // 处理登录
    async handleLogin() {
        if (this.isLoading()) return;
        
        const username = this.elements.usernameInput.value.trim();
        const password = this.elements.passwordInput.value;
        
        // 表单验证
        if (!this.validateForm()) {
            return;
        }
        
        this.hideError();
        this.showLoading(true, '正在登录...');
        
        try {
            // 尝试API登录
            const result = await APIClient.login(username, password);
            
            if (result.success) {
                // 登录成功
                const userData = result.data;
                await this.handleLoginSuccess(userData, username);
            } else {
                // 尝试演示模式登录
                const demoUser = this.checkDemoCredentials(username, password);
                if (demoUser) {
                    await this.handleDemoLogin(demoUser);
                } else {
                    this.showError(result.error || '用户名或密码错误');
                }
            }
        } catch (error) {
            // 网络错误，尝试演示模式
            const demoUser = this.checkDemoCredentials(username, password);
            if (demoUser) {
                await this.handleDemoLogin(demoUser);
            } else {
                this.showError('登录失败：' + error.message);
            }
        } finally {
            this.showLoading(false);
        }
    },
    
    // 检查演示模式凭据
    checkDemoCredentials(username, password) {
        for (const [key, credentials] of Object.entries(this.config.demoCredentials)) {
            if (credentials.username === username && credentials.password === password) {
                return { ...credentials, demo: true };
            }
        }
        return null;
    },
    
    // 处理登录成功
    async handleLoginSuccess(userData, username) {
        console.log('🎉 登录成功:', userData);
        
        // 保存认证信息
        localStorage.setItem('qa_auth_token', userData.token || 'demo_token');
        localStorage.setItem('qa_current_user', JSON.stringify({
            id: userData.id || 'demo_id',
            username: username,
            role: userData.role || 'user',
            email: userData.email || '',
            demo: false
        }));
        
        // 记住用户（如果勾选了记住我）
        if (this.elements.rememberMeCheckbox.checked) {
            this.rememberUser(username, userData.role || 'user');
        }
        
        this.showMessage('登录成功！正在跳转...', 'success');
        
        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
            this.redirectAfterLogin(userData.role || 'user');
        }, 1500);
    },
    
    // 处理演示模式登录
    async handleDemoLogin(demoUser) {
        console.log('🎭 演示模式登录:', demoUser);
        
        // 模拟登录延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 保存演示用户信息
        localStorage.setItem('qa_auth_token', 'demo_token_' + Date.now());
        localStorage.setItem('qa_current_user', JSON.stringify({
            id: 'demo_' + demoUser.username,
            username: demoUser.username,
            role: demoUser.role,
            email: demoUser.username + '@demo.local',
            demo: true
        }));
        
        if (this.elements.rememberMeCheckbox.checked) {
            this.rememberUser(demoUser.username, demoUser.role, true);
        }
        
        this.showMessage('演示模式登录成功！', 'success');
        
        setTimeout(() => {
            this.redirectAfterLogin(demoUser.role, true);
        }, 1500);
    },
    
    // 处理演示模式
    async handleDemoMode() {
        this.showLoading(true, '启动演示模式...');
        
        try {
            // 模拟加载时间
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // 使用默认演示用户
            const demoUser = this.config.demoCredentials.user;
            
            // 自动填充表单
            this.elements.usernameInput.value = demoUser.username;
            this.elements.passwordInput.value = demoUser.password;
            
            // 触发登录
            await this.handleDemoLogin({ ...demoUser, demo: true });
            
        } catch (error) {
            this.showError('演示模式启动失败：' + error.message);
        } finally {
            this.showLoading(false);
        }
    },
    
    // 表单验证
    validateForm() {
        const usernameValid = this.validateUsername();
        const passwordValid = this.validatePassword();
        
        return usernameValid && passwordValid;
    },
    
    // 验证用户名
    validateUsername() {
        const username = this.elements.usernameInput.value.trim();
        const rules = this.config.validationRules.username;
        
        if (!username) {
            this.showFieldError('username', '请输入用户名');
            return false;
        }
        
        if (username.length < rules.minLength) {
            this.showFieldError('username', `用户名至少需要${rules.minLength}个字符`);
            return false;
        }
        
        if (username.length > rules.maxLength) {
            this.showFieldError('username', `用户名不能超过${rules.maxLength}个字符`);
            return false;
        }
        
        if (!rules.pattern.test(username)) {
            this.showFieldError('username', '用户名只能包含字母、数字和下划线');
            return false;
        }
        
        this.hideFieldError('username');
        return true;
    },
    
    // 验证密码
    validatePassword() {
        const password = this.elements.passwordInput.value;
        const rules = this.config.validationRules.password;
        
        if (!password) {
            this.showFieldError('password', '请输入密码');
            return false;
        }
        
        if (password.length < rules.minLength) {
            this.showFieldError('password', `密码至少需要${rules.minLength}个字符`);
            return false;
        }
        
        if (password.length > rules.maxLength) {
            this.showFieldError('password', `密码不能超过${rules.maxLength}个字符`);
            return false;
        }
        
        this.hideFieldError('password');
        return true;
    },
    
    // 显示字段错误
    showFieldError(fieldName, message) {
        const errorElement = this.elements[fieldName + 'Error'];
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
        
        // 为输入框添加错误样式
        const inputElement = this.elements[fieldName + 'Input'];
        if (inputElement) {
            inputElement.style.borderColor = '#e53e3e';
        }
    },
    
    // 隐藏字段错误
    hideFieldError(fieldName) {
        const errorElement = this.elements[fieldName + 'Error'];
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
        
        // 恢复输入框样式
        const inputElement = this.elements[fieldName + 'Input'];
        if (inputElement) {
            inputElement.style.borderColor = '';
        }
    },
    
    // 切换密码显示/隐藏
    togglePasswordVisibility() {
        const passwordInput = this.elements.passwordInput;
        const toggleIcon = this.elements.passwordToggle.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleIcon.className = 'fas fa-eye';
        }
    },
    
    // 记住用户信息
    rememberUser(username, role, demo = false) {
        const userInfo = {
            username: username,
            role: role,
            demo: demo,
            rememberedAt: new Date().toISOString()
        };
        
        // 设置7天过期时间
        QAUtils.storage.set('remembered_user', userInfo, 7 * 24 * 60 * 60 * 1000);
    },
    
    // 清除记住的用户信息
    clearRememberedUser() {
        QAUtils.storage.remove('remembered_user');
        localStorage.removeItem('qa_auth_token');
        localStorage.removeItem('qa_current_user');
    },
    
    // 登录后重定向
    redirectAfterLogin(role, demo = false) {
        let redirectUrl = this.config.redirectUrls.user; // 默认
        
        if (demo) {
            redirectUrl = this.config.redirectUrls.demo;
        } else if (role === 'admin') {
            redirectUrl = this.config.redirectUrls.admin;
        } else {
            redirectUrl = this.config.redirectUrls.user;
        }
        
        console.log(`🔀 重定向到: ${redirectUrl} (角色: ${role}, 演示: ${demo})`);
        
        // 平滑过渡效果
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 300);
    },
    
    // 处理忘记密码
    handleForgotPassword() {
        alert('忘记密码功能正在开发中\n\n演示账号：\n管理员：admin / admin123\n用户：user / user123');
    },
    
    // 显示/隐藏加载状态
    showLoading(show, message = '正在处理...') {
        const overlay = this.elements.loadingOverlay;
        const loadingText = overlay.querySelector('.loading-text');
        
        if (show) {
            loadingText.textContent = message;
            overlay.style.display = 'flex';
            this.elements.loginBtn.classList.add('loading');
            this.elements.loginBtn.disabled = true;
        } else {
            overlay.style.display = 'none';
            this.elements.loginBtn.classList.remove('loading');
            this.elements.loginBtn.disabled = false;
        }
    },
    
    // 检查是否正在加载
    isLoading() {
        return this.elements.loginBtn.classList.contains('loading');
    },
    
    // 显示错误消息
    showError(message) {
        this.elements.authErrorText.textContent = message;
        this.elements.authError.style.display = 'flex';
        
        // 自动隐藏错误消息
        setTimeout(() => {
            this.hideError();
        }, 5000);
    },
    
    // 隐藏错误消息
    hideError() {
        this.elements.authError.style.display = 'none';
    },
    
    // 显示通用消息
    showMessage(message, type = 'info') {
        // 创建临时消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `auth-message auth-message-${type}`;
        messageEl.innerHTML = `
            <i class="fas ${this.getMessageIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // 添加样式
        Object.assign(messageEl.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: this.getMessageBackground(type),
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: '9999',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500'
        });
        
        document.body.appendChild(messageEl);
        
        // 动画显示
        setTimeout(() => {
            messageEl.style.opacity = '1';
            messageEl.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);
        
        // 自动移除
        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => {
                document.body.removeChild(messageEl);
            }, 300);
        }, 3000);
    },
    
    // 获取消息图标
    getMessageIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    },
    
    // 获取消息背景色
    getMessageBackground(type) {
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#4299e1'
        };
        return colors[type] || colors.info;
    },
    
    // 获取当前用户信息
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('qa_current_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    },
    
    // 检查用户是否已登录
    isLoggedIn() {
        const token = localStorage.getItem('qa_auth_token');
        const user = this.getCurrentUser();
        return !!(token && user);
    },
    
    // 退出登录
    async logout() {
        try {
            // 尝试调用API退出
            await APIClient.logout();
        } catch (error) {
            console.warn('API退出失败:', error);
        }
        
        // 清除本地数据
        this.clearRememberedUser();
        
        // 重定向到登录页
        window.location.href = '../auth-block/auth.html';
    }
}; 