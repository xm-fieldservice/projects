/**
 * @file ui_controller.js
 * @description UI 控制器模块
 * 
 * 职责:
 * - 封装所有与 DOM 操作和用户界面更新相关的逻辑。
 * - 包括更新节点详情、显示消息、切换主题、处理面板显隐等。
 * - 不应包含任何核心业务逻辑（如数据存取、思维导图操作）。
 */

import state from '../services/state.js';
import { themes } from '../config.js';
import { showMessage } from '../utils/utils.js';
import mindmapService from '../services/mindmap_service.js';
import * as utils from '../utils/utils.js';
import { mindmapData } from '../config.js';

/**
 * 更新项目信息显示
 */
function updateProjectInfoDisplay() {
    const projectInfo = state.state.projectInfo;
    const nameElements = document.querySelectorAll('#project-name-display');
    nameElements.forEach(el => {
        el.textContent = projectInfo.name || 'Untitled';
        el.title = projectInfo.path || 'No file loaded';
    });
}

/**
 * 更新选中节点显示
 */
function updateSelectedNodeDisplay() {
    const currentJsMind = mindmapService.getCurrentJsMind();
    const selectedNode = currentJsMind?.get_selected_node();
    const statusElement = document.getElementById('selectedNode');
    
    if (selectedNode && statusElement) {
        const cleanTitle = selectedNode.topic.replace(' 📄', '');
        statusElement.textContent = `已选择: ${cleanTitle}`;
    } else if (statusElement) {
        statusElement.textContent = '请选择一个节点';
    }
}

/**
 * 切换暗色模式
 */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('nodemind_theme', isDarkMode ? 'dark' : 'light');
    console.log(`Theme changed to ${isDarkMode ? 'dark' : 'light'}`);
}

/**
 * 更新布局高度
 */
function updateLayoutHeight() {
    // 计算并设置合适的布局高度
    const header = document.querySelector('.header');
    const toolbar = document.querySelector('.toolbar');
    const status = document.querySelector('.status');
    
    if (header && toolbar && status) {
        const headerHeight = header.offsetHeight;
        const toolbarHeight = toolbar.offsetHeight;
        const statusHeight = status.offsetHeight;
        const totalHeight = headerHeight + toolbarHeight + statusHeight + 40; // 40px for margins
        
        const mainLayout = document.querySelector('.main-layout');
        if (mainLayout) {
            mainLayout.style.height = `calc(100vh - ${totalHeight}px)`;
        }
    }
}

/**
 * 切换详情面板显示/隐藏
 */
export function toggleDetailsPanel() {
    const layout = document.querySelector('.main-layout');
    const btn = document.getElementById('panelToggleBtn');
    if (layout && btn) {
        layout.classList.toggle('panel-hidden');
        if (layout.classList.contains('panel-hidden')) {
            btn.textContent = '📋 显示详情面板';
        } else {
            btn.textContent = '📋 隐藏详情面板';
        }
    }
}

/**
 * 切换右侧扩展面板
 */
export function toggleExtensionPanel() {
    const panel = document.querySelector('.details-panel');
    const btn = document.getElementById('extensionToggleBtn');
    if (panel && btn) {
        panel.classList.toggle('extension-collapsed');
        if (panel.classList.contains('extension-collapsed')) {
            btn.innerHTML = '▶ 展开扩展区';
        } else {
            btn.innerHTML = '◀ 折叠扩展区';
        }
    }
}

/**
 * 切换思维导图标签页 - 迁移自index.html
 */
export function switchMindmapTab(mapId) {
    console.log(`🎯 [UIController] 切换到思维导图: ${mapId}`);
    
    // 隐藏所有容器和标签内容
    ['workspace', 'knowledge', 'project'].forEach(id => {
        const container = document.getElementById(`jsmind_container_${id}`);
        const tabContent = document.getElementById(`mindmap-tab-${id}`);
        if (container) container.style.display = 'none';
        if (tabContent) {
            tabContent.style.display = 'none';
            tabContent.classList.remove('active');
        }
    });
    
    // 显示目标容器和标签内容
    const targetContainer = document.getElementById(`jsmind_container_${mapId}`);
    const targetTabContent = document.getElementById(`mindmap-tab-${mapId}`);
    if (targetContainer && targetTabContent) {
        targetContainer.style.display = 'block';
        targetTabContent.style.display = 'block';
        targetTabContent.classList.add('active');
        
        // 调整思维导图大小并重新布局
        const instance = window.mindmaps[mapId];
        if (instance) {
            setTimeout(() => {
                instance.resize();
                // 对于标签管理，强制重新显示以修复布局问题
                if (mapId === 'workspace') {
                    instance.show(mindmapData.workspace);
                }
            }, 100);
        }
    }
    
    // 更新标签UI
    document.querySelectorAll('.mindmap-tab-button').forEach(tab => tab.classList.remove('active'));
    const activeTab = document.querySelector(`[data-tab="${mapId}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    window.currentMindmap = mapId;
    console.log(`✅ [UIController] 已切换到思维导图: ${mapId}`);
}

/**
 * 切换详情面板标签页
 */
function switchDetailTab(tabName) {
    console.log('🔄 切换详情标签页:', tabName);
    
    // 更新按钮状态
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.id === `detail_tab_${tabName}`) {
            btn.classList.add('active');
        }
    });
    
    // 更新内容显示
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `tab-${tabName}`) {
            content.classList.add('active');
        }
    });
}

/**
 * 显示用户指南
 */
function showUserGuide() {
    utils.showMessage(`
🎯 NodeMind 使用指南:
• 点击节点查看/编辑详情
• 拖拽节点重新组织结构  
• 使用工具栏添加/删除节点
• 标签系统帮助分类管理
• 支持数据导入/导出
• Ctrl+S 快速保存
    `, 5000);
}

/**
 * 触发文件导入
 */
export function triggerImport() {
    const importInput = document.getElementById('import_file_input');
    if (importInput) {
        importInput.click();
    }
}

/**
 * 绑定所有增强的DOM事件
 */
export function bindEnhancedEvents() {
    console.log('🔗 绑定增强事件监听器...');
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateLayoutHeight);
    
    // 绑定主题切换
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themes.forEach((theme, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = theme.label;
            themeSelect.appendChild(option);
        });
        
        themeSelect.addEventListener('change', function() {
            const themeIndex = this.value;
            const themeName = themes[themeIndex].name;
            
            // Apply theme to all mindmap instances
            Object.values(state.state.jsMindInstances).forEach(jm => {
                if (jm) jm.set_theme(themeName);
            });
            
            const currentThemeElement = document.getElementById('currentTheme');
            if (currentThemeElement) {
                currentThemeElement.textContent = themeName;
            }
            
            console.log(`🎨 主题已切换到: ${themeName}`);
        });
    }
    
    console.log('✅ 增强事件监听器绑定完成');
}

/**
 * 创建新的思维导图
 * 简单直接的方法：清除localStorage并重新加载页面
 */
export function createNewMindmap() {
    if (confirm('确定要创建一个全新的空白脑图吗？\n\n⚠️ 所有未保存的数据将被清除！')) {
        try {
            // 显示操作提示
            showMessage('🔄 正在清除数据并创建新脑图...', 2000);
            
            // 延迟执行，让用户看到提示信息
            setTimeout(() => {
                // 清除所有localStorage数据
                localStorage.clear();
                
                // 显示成功信息
                showMessage('✅ 数据已清除，正在重新加载...', 1000);
                
                // 延迟重新加载页面
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }, 500);
            
        } catch (error) {
            console.error('❌ 创建新脑图时发生错误:', error);
            showMessage('❌ 创建新脑图失败，请手动刷新页面', 3000);
        }
    }
}

/**
 * 绑定所有UI事件监听器
 */
export function bindUIEventListeners() {
    console.log('🔗 绑定UI事件监听器...');
    
    // 绑定思维导图标签页切换
    document.getElementById('tab_button_workspace')?.addEventListener('click', () => switchMindmapTab('workspace'));
    document.getElementById('tab_button_knowledge')?.addEventListener('click', () => switchMindmapTab('knowledge'));
    document.getElementById('tab_button_project')?.addEventListener('click', () => switchMindmapTab('project'));
    
    // 绑定详情面板标签页切换
    document.getElementById('detail_tab_basic')?.addEventListener('click', () => switchTab('basic'));
    document.getElementById('detail_tab_detail')?.addEventListener('click', () => switchTab('detail'));
    document.getElementById('detail_tab_history')?.addEventListener('click', () => switchTab('history'));
    
    // 绑定面板切换按钮
    document.getElementById('panelToggleBtn')?.addEventListener('click', toggleDetailsPanel);
    document.getElementById('extensionToggleBtn')?.addEventListener('click', toggleExtensionPanel);
    
    // 绑定工具栏按钮
    document.getElementById('show_guide_button')?.addEventListener('click', showUserGuide);
    document.getElementById('import_file_button')?.addEventListener('click', triggerImport);
    document.getElementById('create_new_mindmap_button')?.addEventListener('click', createNewMindmap);
    
    // 绑定节点操作按钮
    document.getElementById('add_node_button')?.addEventListener('click', () => {
        showMessage('🚧 添加节点功能正在开发中...');
    });
    
    document.getElementById('remove_node_button')?.addEventListener('click', () => {
        showMessage('🚧 删除节点功能正在开发中...');
    });
    
    console.log('✅ UI事件监听器绑定完成');
}

/**
 * 获取当前活跃的jsMind实例 - 迁移自index.html
 */
export function getCurrentJsMind() {
    return window.mindmaps[window.currentMindmap];
}

export {
    updateProjectInfoDisplay,
    updateSelectedNodeDisplay,
    toggleDarkMode,
    updateLayoutHeight,
    switchDetailTab,
    showUserGuide
};
