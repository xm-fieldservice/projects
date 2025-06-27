// 项目脑图处理脚本 - 处理从项目管理系统传递的参数
(function() {
    'use strict';
    
    console.log('🚀 项目脑图处理脚本开始执行');
    
    // 解析URL参数
    function parseProjectParams() {
        const urlParams = new URLSearchParams(window.location.search);
        
        const projectData = {
            id: urlParams.get('id') || '',
            name: urlParams.get('name') || '未命名项目',
            title: urlParams.get('title') || urlParams.get('name') || '未命名项目',
            path: decodeURIComponent(urlParams.get('path') || ''),
            panel: urlParams.get('panel') || 'basic',
            mindmap_tab: urlParams.get('mindmap_tab') || 'project'
        };
        
        console.log('📋 解析到的项目参数:', projectData);
        return projectData;
    }
    
    // 更新页面标题和显示信息
    function updatePageInfo(projectData) {
        // 更新页面标题
        document.title = `NodeMind - ${projectData.name}`;
        
        // 查找并更新页面中的标题元素
        const titleElements = document.querySelectorAll('h1, .title, .project-title');
        titleElements.forEach(el => {
            if (el.textContent.includes('jsMind') || el.textContent.includes('演示')) {
                el.textContent = `${projectData.name} - 项目脑图`;
            }
        });
        
        console.log('✅ 页面信息已更新');
    }
    
    // 激活指定的面板和选项卡
    function activatePanel(projectData) {
        // 尝试激活指定的面板
        if (projectData.panel) {
            setTimeout(() => {
                // 查找面板切换按钮
                const panelButtons = document.querySelectorAll(`[data-tab="${projectData.panel}"], .tab-btn[data-tab="${projectData.panel}"]`);
                panelButtons.forEach(btn => {
                    if (btn && typeof btn.click === 'function') {
                        btn.click();
                        console.log(`✅ 激活面板: ${projectData.panel}`);
                    }
                });
            }, 500);
        }
        
        // 尝试激活指定的脑图选项卡
        if (projectData.mindmap_tab) {
            setTimeout(() => {
                const tabButtons = document.querySelectorAll(`[data-tab="${projectData.mindmap_tab}"], .mindmap-tab[data-tab="${projectData.mindmap_tab}"]`);
                tabButtons.forEach(btn => {
                    if (btn && typeof btn.click === 'function') {
                        btn.click();
                        console.log(`✅ 激活脑图选项卡: ${projectData.mindmap_tab}`);
                    }
                });
            }, 1000);
        }
    }
    
    // 显示项目信息
    function displayProjectInfo(projectData) {
        // 尝试在页面中显示项目信息
        const infoElements = document.querySelectorAll('.project-info, .info-panel, .details-panel');
        infoElements.forEach(el => {
            const infoHTML = `
                <div class="project-meta-info" style="padding: 15px; background: #f8f9fa; border-radius: 8px; margin: 10px 0;">
                    <h4 style="margin: 0 0 10px 0; color: #495057;">项目信息</h4>
                    <div style="font-size: 14px; line-height: 1.6;">
                        <div><strong>项目名称:</strong> ${projectData.name}</div>
                        <div><strong>项目路径:</strong> ${projectData.path}</div>
                        <div><strong>项目ID:</strong> ${projectData.id}</div>
                    </div>
                </div>
            `;
            
            // 如果元素为空或只有默认内容，添加项目信息
            if (el.children.length === 0 || el.textContent.trim().length < 50) {
                el.innerHTML = infoHTML + el.innerHTML;
            }
        });
        
        console.log('✅ 项目信息已显示');
    }
    
    // 添加成功提示
    function showSuccessMessage(projectData) {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            max-width: 300px;
        `;
        
        message.innerHTML = `
            <div style="margin-bottom: 5px;"><strong>✅ 项目脑图已加载</strong></div>
            <div style="font-size: 12px; opacity: 0.9;">项目: ${projectData.name}</div>
        `;
        
        document.body.appendChild(message);
        
        // 3秒后自动消失
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }
    
    // 主初始化函数
    function initProjectMindmap() {
        try {
            // 检查是否有URL参数
            if (!window.location.search) {
                console.log('ℹ️ 没有URL参数，使用默认模式');
                return;
            }
            
            // 解析项目参数
            const projectData = parseProjectParams();
            
            // 更新页面信息
            updatePageInfo(projectData);
            
            // 显示项目信息
            displayProjectInfo(projectData);
            
            // 激活指定面板
            activatePanel(projectData);
            
            // 显示成功消息
            showSuccessMessage(projectData);
            
            // 将项目数据保存到全局变量供其他脚本使用
            window.currentProjectData = projectData;
            
            console.log('🎉 项目脑图处理完成');
            
        } catch (error) {
            console.error('❌ 项目脑图处理失败:', error);
        }
    }
    
    // 等待DOM加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProjectMindmap);
    } else {
        // DOM已经加载完成，立即执行
        initProjectMindmap();
    }
    
    // 也可以在window load事件中再次尝试
    window.addEventListener('load', function() {
        // 延迟执行以确保所有脚本都已加载
        setTimeout(initProjectMindmap, 1000);
    });
    
})(); 