/**
 * UI分割器组件
 * 负责处理详细描述面板和侧面板的分割线拖拽功能
 */

export class Splitter {
    /**
     * 初始化详细描述面板分割线拖拽功能
     * @param {string} nodeId - 节点ID
     */
    static initializeDetailSplitter(nodeId) {
        const splitter = document.getElementById(`detail-splitter-${nodeId}`);
        const workspace = document.querySelector('.detail-workspace');
        const mainArea = document.querySelector('.detail-main-area');
        const sidePanel = document.querySelector('.detail-side-panel');
        
        if (!splitter || !workspace || !mainArea || !sidePanel) {
            console.log('[Splitter] ❌ 分割线初始化失败：找不到必要元素');
            return;
        }
        
        let isResizing = false;
        let startX = 0;
        let startMainWidth = 0;
        let startSideWidth = 0;
        
        // 鼠标按下事件
        splitter.addEventListener('mousedown', function(e) {
            isResizing = true;
            startX = e.clientX;
            
            // 获取当前宽度
            const workspaceRect = workspace.getBoundingClientRect();
            const mainRect = mainArea.getBoundingClientRect();
            const sideRect = sidePanel.getBoundingClientRect();
            
            startMainWidth = mainRect.width;
            startSideWidth = sideRect.width;
            
            // 添加拖拽样式
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            
            // 添加遮罩防止iframe干扰
            const overlay = document.createElement('div');
            overlay.id = 'resize-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: transparent;
                cursor: col-resize;
                z-index: 9999;
            `;
            document.body.appendChild(overlay);
            
            e.preventDefault();
        });
        
        // 鼠标移动事件
        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const workspaceRect = workspace.getBoundingClientRect();
            const totalWidth = workspaceRect.width - 4; // 减去分割线宽度
            
            // 计算新的宽度
            let newMainWidth = startMainWidth + deltaX;
            let newSideWidth = startSideWidth - deltaX;
            
            // 设置最小宽度限制
            const minMainWidth = 300;
            const minSideWidth = 200;
            const maxSideWidth = 500;
            
            if (newMainWidth < minMainWidth) {
                newMainWidth = minMainWidth;
                newSideWidth = totalWidth - newMainWidth;
            } else if (newSideWidth < minSideWidth) {
                newSideWidth = minSideWidth;
                newMainWidth = totalWidth - newSideWidth;
            } else if (newSideWidth > maxSideWidth) {
                newSideWidth = maxSideWidth;
                newMainWidth = totalWidth - newSideWidth;
            }
            
            // 应用新的宽度
            mainArea.style.flex = 'none';
            mainArea.style.width = newMainWidth + 'px';
            sidePanel.style.width = newSideWidth + 'px';
            
            e.preventDefault();
        });
        
        // 鼠标释放事件
        document.addEventListener('mouseup', function(e) {
            if (!isResizing) return;
            
            isResizing = false;
            
            // 恢复样式
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            
            // 移除遮罩
            const overlay = document.getElementById('resize-overlay');
            if (overlay) {
                overlay.remove();
            }
            
            // 保存分割线位置到localStorage
            const sideWidth = sidePanel.getBoundingClientRect().width;
            localStorage.setItem('nodemind_detail_side_width', sideWidth.toString());
            
            console.log('[Splitter] ✅ 分割线拖拽完成，侧边栏宽度:', sideWidth);
        });
        
        // 恢复保存的分割线位置
        const savedSideWidth = localStorage.getItem('nodemind_detail_side_width');
        if (savedSideWidth) {
            const width = parseInt(savedSideWidth);
            if (width >= 200 && width <= 500) {
                sidePanel.style.width = width + 'px';
                mainArea.style.flex = 'none';
                mainArea.style.width = `calc(100% - ${width + 4}px)`;
            }
        }
        
        console.log('[Splitter] ✅ 详细描述面板分割线拖拽功能已初始化');
    }

    /**
     * 初始化右侧面板内部分割线拖拽功能
     * @param {string} nodeId - 节点ID
     */
    static initializeSidePanelSplitter(nodeId) {
        const splitter = document.getElementById(`side-panel-splitter-${nodeId}`);
        const sessionSection = document.getElementById(`session-list-section-${nodeId}`);
        const templateSection = document.getElementById(`template-section-${nodeId}`);
        const sidePanel = document.querySelector('.detail-side-panel');
        
        if (!splitter || !sessionSection || !templateSection || !sidePanel) {
            console.log('[Splitter] ❌ 右侧面板分割线初始化失败：找不到必要元素');
            return;
        }
        
        let isResizing = false;
        let startY = 0;
        let startSessionHeight = 0;
        let sidePanelHeight = 0;
        
        // 鼠标按下事件
        splitter.addEventListener('mousedown', function(e) {
            isResizing = true;
            startY = e.clientY;
            
            // 获取当前高度
            const sidePanelRect = sidePanel.getBoundingClientRect();
            const sessionRect = sessionSection.getBoundingClientRect();
            
            sidePanelHeight = sidePanelRect.height;
            startSessionHeight = sessionRect.height;
            
            // 添加拖拽样式
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
            
            // 添加遮罩防止iframe干扰
            const overlay = document.createElement('div');
            overlay.id = 'resize-overlay-side';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: transparent;
                cursor: row-resize;
                z-index: 9999;
            `;
            document.body.appendChild(overlay);
            
            e.preventDefault();
        });
        
        // 鼠标移动事件
        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;
            
            const deltaY = e.clientY - startY;
            
            // 计算新的高度
            let newSessionHeight = startSessionHeight + deltaY;
            
            // 设置最小和最大高度限制
            const minSessionHeight = 100;
            const minTemplateHeight = 80;
            const maxSessionHeight = sidePanelHeight - minTemplateHeight - 4; // 减去分割线高度
            
            if (newSessionHeight < minSessionHeight) {
                newSessionHeight = minSessionHeight;
            } else if (newSessionHeight > maxSessionHeight) {
                newSessionHeight = maxSessionHeight;
            }
            
            // 计算百分比
            const sessionPercentage = (newSessionHeight / sidePanelHeight) * 100;
            
            // 应用新的高度
            sessionSection.style.height = sessionPercentage + '%';
            
            e.preventDefault();
        });
        
        // 鼠标释放事件
        document.addEventListener('mouseup', function(e) {
            if (!isResizing) return;
            
            isResizing = false;
            
            // 恢复样式
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            
            // 移除遮罩
            const overlay = document.getElementById('resize-overlay-side');
            if (overlay) {
                overlay.remove();
            }
            
            // 保存分割线位置到localStorage
            const sessionHeight = sessionSection.getBoundingClientRect().height;
            const sessionPercentage = (sessionHeight / sidePanelHeight) * 100;
            localStorage.setItem('nodemind_side_panel_session_height', sessionPercentage.toString());
            
            console.log('[Splitter] ✅ 右侧面板分割线拖拽完成，会话区域高度:', sessionPercentage + '%');
        });
        
        // 恢复保存的分割线位置
        const savedSessionHeight = localStorage.getItem('nodemind_side_panel_session_height');
        if (savedSessionHeight) {
            const percentage = parseFloat(savedSessionHeight);
            if (percentage >= 20 && percentage <= 80) {
                sessionSection.style.height = percentage + '%';
            }
        }
        
        console.log('[Splitter] ✅ 右侧面板内部分割线拖拽功能已初始化');
    }
}

// 导出给全局使用
window.Splitter = Splitter;

export default Splitter; 