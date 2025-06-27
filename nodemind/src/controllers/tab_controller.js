/**
 * 标签页控制器 - 模块化JavaScript
 * 负责处理内部标签页的切换逻辑
 * 创建日期: 2025-01-XX
 */

console.log('🚀 [TabController] 脚本开始加载...');

class TabController {
    constructor() {
        this.initialized = false;
        this.innerTabButtons = null;
        this.innerTabContents = null;
    }

    /**
     * 初始化内部标签页切换功能
     */
    initInnerTabSwitching() {
        console.log('🔧 [TabController] 初始化内部标签页切换功能...');
        
        this.innerTabButtons = document.querySelectorAll('.inner-tab-button');
        this.innerTabContents = document.querySelectorAll('.inner-tab-content');
        
        console.log('📋 [TabController] 找到标签页按钮数量:', this.innerTabButtons.length);
        console.log('📋 [TabController] 找到标签页内容数量:', this.innerTabContents.length);

        // 绑定标签页按钮事件
        this.innerTabButtons.forEach((button, index) => {
            console.log(`🔘 [TabController] 绑定按钮 ${index + 1}:`, button.getAttribute('data-tab'));
            button.addEventListener('click', (event) => this.handleTabClick(event, button));
        });
        
        // 绑定会话列表项点击事件
        this.initSessionListeners();
        
        // 绑定模板列表项点击事件
        this.initTemplateListeners();
        
        this.initialized = true;
        console.log('✅ [TabController] 内部标签页切换功能初始化完成');
    }

    /**
     * 处理标签页点击事件
     */
    handleTabClick(event, button) {
        const targetTab = button.getAttribute('data-tab');
        console.log('🎯 [TabController] 点击标签页:', targetTab);
        
        // 移除所有按钮的active类
        this.innerTabButtons.forEach(btn => btn.classList.remove('active'));
        // 隐藏所有内容
        this.innerTabContents.forEach(content => content.classList.remove('active'));
        
        // 激活点击的按钮
        button.classList.add('active');
        
        // 显示对应的内容
        const targetContent = document.getElementById(`inner-tab-${targetTab}`);
        if (targetContent) {
            targetContent.classList.add('active');
            console.log('✅ [TabController] 成功激活标签页:', targetTab);
            
            // 触发标签页切换事件
            this.emitTabChangeEvent(targetTab);
        } else {
            console.error('❌ [TabController] 找不到标签页内容:', `inner-tab-${targetTab}`);
        }
    }

    /**
     * 触发标签页切换事件
     */
    emitTabChangeEvent(tabName) {
        if (window.eventBus) {
            window.eventBus.emit('tab:switched', {
                tabName: tabName,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 初始化会话列表监听器
     */
    initSessionListeners() {
        const sessionItems = document.querySelectorAll('.session-item');
        console.log('📋 [TabController] 找到会话项数量:', sessionItems.length);
        
        sessionItems.forEach((item, index) => {
            item.addEventListener('click', (event) => this.handleSessionClick(event, item, index));
            console.log(`🔘 [TabController] 绑定会话项 ${index + 1}`);
        });
    }

    /**
     * 初始化模板列表监听器
     */
    initTemplateListeners() {
        const templateItems = document.querySelectorAll('.template-item');
        console.log('📄 [TabController] 找到模板项数量:', templateItems.length);
        
        templateItems.forEach((item, index) => {
            item.addEventListener('click', (event) => this.handleTemplateClick(event, item, index));
            console.log(`🔘 [TabController] 绑定模板项 ${index + 1}`);
        });
    }

    /**
     * 处理会话项点击事件
     */
    handleSessionClick(event, sessionItem, index) {
        const sessionTitle = sessionItem.querySelector('.session-title')?.textContent || `会话 ${index + 1}`;
        const sessionTime = sessionItem.querySelector('.session-time')?.textContent || '--';
        
        console.log('🎯 [TabController] 点击会话:', sessionTitle);
        
        // 移除其他会话项的选中状态
        document.querySelectorAll('.session-item').forEach(item => {
            item.classList.remove('session-selected');
        });
        
        // 添加当前项的选中状态
        sessionItem.classList.add('session-selected');
        
        // 如果是空白会话，显示创建提示
        if (sessionItem.classList.contains('session-item-empty')) {
            this.showCreateSessionDialog(index + 1);
        } else {
            // 加载会话内容
            this.loadSession(index, sessionTitle, sessionTime);
        }
        
        // 触发会话选择事件
        if (window.eventBus) {
            window.eventBus.emit('session:selected', {
                index: index,
                title: sessionTitle,
                time: sessionTime,
                isEmpty: sessionItem.classList.contains('session-item-empty')
            });
        }
    }

    /**
     * 处理模板项点击事件
     */
    handleTemplateClick(event, templateItem, index) {
        const templateTitle = templateItem.querySelector('.template-title')?.textContent || `模板 ${index + 1}`;
        const templateDesc = templateItem.querySelector('.template-desc')?.textContent || '--';
        
        console.log('🎯 [TabController] 点击模板:', templateTitle);
        
        // 移除其他模板项的选中状态
        document.querySelectorAll('.template-item').forEach(item => {
            item.classList.remove('template-selected');
        });
        
        // 添加当前项的选中状态
        templateItem.classList.add('template-selected');
        
        // 如果是空白模板，显示创建提示
        if (templateItem.classList.contains('template-item-empty')) {
            this.showCreateTemplateDialog(index + 1);
        } else {
            // 应用模板
            this.applyTemplate(index, templateTitle, templateDesc);
        }
        
        // 触发模板选择事件
        if (window.eventBus) {
            window.eventBus.emit('template:selected', {
                index: index,
                title: templateTitle,
                description: templateDesc,
                isEmpty: templateItem.classList.contains('template-item-empty')
            });
        }
    }

    /**
     * 显示创建会话对话框
     */
    showCreateSessionDialog(sessionNumber) {
        const message = `您点击了空白会话 ${sessionNumber}。\n\n是否要创建新会话？`;
        if (confirm(message)) {
            console.log(`✨ [TabController] 创建新会话: 会话 ${sessionNumber}`);
            // 这里可以添加创建会话的逻辑
            alert(`会话 ${sessionNumber} 创建功能待实现`);
        }
    }

    /**
     * 显示创建模板对话框
     */
    showCreateTemplateDialog(templateNumber) {
        const message = `您点击了空白模板 ${templateNumber}。\n\n是否要创建新模板？`;
        if (confirm(message)) {
            console.log(`✨ [TabController] 创建新模板: 模板 ${templateNumber}`);
            // 这里可以添加创建模板的逻辑
            alert(`模板 ${templateNumber} 创建功能待实现`);
        }
    }

    /**
     * 加载会话内容
     */
    loadSession(index, title, time) {
        console.log(`📂 [TabController] 加载会话: ${title} (${time})`);
        // 这里可以添加加载会话内容的逻辑
        alert(`加载会话: ${title}\n时间: ${time}\n\n会话加载功能待实现`);
    }

    /**
     * 应用模板
     */
    applyTemplate(index, title, description) {
        console.log(`📋 [TabController] 应用模板: ${title}`);
        // 这里可以添加应用模板的逻辑
        alert(`应用模板: ${title}\n描述: ${description}\n\n模板应用功能待实现`);
    }

    /**
     * 获取当前活跃的标签页
     */
    getActiveTab() {
        const activeButton = document.querySelector('.inner-tab-button.active');
        return activeButton ? activeButton.getAttribute('data-tab') : null;
    }

    /**
     * 程序化切换到指定标签页
     */
    switchToTab(tabName) {
        const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetButton) {
            targetButton.click();
            return true;
        }
        console.warn(`🟡 [TabController] 未找到标签页: ${tabName}`);
        return false;
    }

    /**
     * 销毁控制器，清理事件监听器
     */
    destroy() {
        if (this.innerTabButtons) {
            this.innerTabButtons.forEach(button => {
                button.removeEventListener('click', this.handleTabClick);
            });
        }
        this.initialized = false;
        console.log('🗑️ [TabController] 已销毁');
    }

    /**
     * 测试标签页切换功能
     */
    testTabSwitching() {
        console.log('🧪 [TabController] 开始测试标签页切换功能...');
        
        // 检查按钮是否存在
        const buttons = document.querySelectorAll('.inner-tab-button');
        console.log('🔍 [TabController] 找到按钮数量:', buttons.length);
        
        buttons.forEach((button, index) => {
            const tabName = button.getAttribute('data-tab');
            console.log(`🔘 [TabController] 按钮 ${index + 1}: ${tabName}`, button);
        });
        
        // 检查内容区域是否存在
        const contents = document.querySelectorAll('.inner-tab-content');
        console.log('🔍 [TabController] 找到内容区域数量:', contents.length);
        
        contents.forEach((content, index) => {
            console.log(`📄 [TabController] 内容区域 ${index + 1}:`, content.id, content);
        });
        
        // 手动触发第一个标签页切换
        if (buttons.length > 0) {
            console.log('🎯 [TabController] 手动触发第一个标签页点击...');
            buttons[0].click();
        }
        
        return {
            buttons: buttons.length,
            contents: contents.length,
            initialized: this.initialized
        };
    }
}

// 创建全局实例
console.log('🔧 [TabController] 创建全局实例...');
window.tabController = new TabController();
console.log('✅ [TabController] 全局实例创建完成');

// 自动初始化
function autoInitTabController() {
    console.log('🔄 [TabController] 开始自动初始化...');
    console.log('🔍 [TabController] 当前document.readyState:', document.readyState);
    
    if (document.readyState === 'loading') {
        console.log('⏳ [TabController] DOM加载中，等待DOMContentLoaded事件...');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 [TabController] DOMContentLoaded事件触发');
            window.tabController.initInnerTabSwitching();
        });
    } else {
        console.log('✅ [TabController] DOM已加载完成，立即初始化');
        window.tabController.initInnerTabSwitching();
    }
    
    // 延迟初始化确保DOM完全加载
    window.addEventListener('load', () => {
        setTimeout(() => {
            console.log('🔄 [TabController] 延迟初始化（确保DOM完全加载）');
            console.log('🔍 [TabController] 当前初始化状态:', window.tabController.initialized);
            if (!window.tabController.initialized) {
                console.log('🔧 [TabController] 执行延迟初始化');
                window.tabController.initInnerTabSwitching();
            } else {
                console.log('✅ [TabController] 已初始化，跳过延迟初始化');
            }
        }, 500);
    });
}

// 执行自动初始化
console.log('🚀 [TabController] 执行自动初始化...');
autoInitTabController();

// 导出模块
export { TabController };
export default window.tabController; 