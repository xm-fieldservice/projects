// 脑图保存和导入功能
// 为外部jsMind页面添加保存和导入按钮

(function() {
    'use strict';
    
    // 等待页面加载完成
    function waitForPageLoad(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }
    
    // 获取当前活跃的脑图实例
    function getCurrentMindmap() {
        if (window.mindmaps) {
            // 尝试获取当前活跃的脑图
            const activeTab = document.querySelector('.mindmap-tab-button.active');
            if (activeTab) {
                const tabName = activeTab.getAttribute('data-tab');
                return window.mindmaps[tabName];
            }
            
            // 默认返回project脑图
            return window.mindmaps.project;
        }
        return null;
    }
    
    // 保存脑图数据到JSON文件
    function saveMindmapToFile() {
        const mindmap = getCurrentMindmap();
        if (!mindmap) {
            alert('无法获取脑图实例！');
            return;
        }
        
        try {
            // 获取脑图数据
            const mindData = mindmap.get_data();
            const jsonData = JSON.stringify(mindData, null, 2);
            
            // 创建下载链接
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // 创建下载元素
            const link = document.createElement('a');
            link.href = url;
            link.download = `mindmap_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 清理URL对象
            URL.revokeObjectURL(url);
            
            console.log('✓ 脑图数据已保存到文件');
            alert('脑图数据已保存到下载文件夹！');
            
        } catch (error) {
            console.error('✗ 保存脑图失败:', error);
            alert('保存失败：' + error.message);
        }
    }
    
    // 从文件导入脑图数据
    function importMindmapFromFile() {
        // 创建文件输入元素
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    
                    // 验证数据格式
                    if (!jsonData.meta || !jsonData.data) {
                        throw new Error('无效的脑图数据格式');
                    }
                    
                    const mindmap = getCurrentMindmap();
                    if (!mindmap) {
                        throw new Error('无法获取脑图实例');
                    }
                    
                    // 导入数据到脑图
                    mindmap.show(jsonData);
                    
                    console.log('✓ 脑图数据导入成功');
                    alert('脑图数据导入成功！');
                    
                } catch (error) {
                    console.error('✗ 导入脑图失败:', error);
                    alert('导入失败：' + error.message);
                }
            };
            
            reader.readAsText(file);
        });
        
        // 触发文件选择
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }
    
    // 导出当前脑图为图片
    function exportMindmapAsImage() {
        const mindmap = getCurrentMindmap();
        if (!mindmap) {
            alert('无法获取脑图实例！');
            return;
        }
        
        try {
            // 使用jsMind的截图功能
            if (mindmap.screenshot && mindmap.screenshot.shootDownload) {
                mindmap.screenshot.shootDownload();
                console.log('✓ 脑图图片导出成功');
            } else {
                alert('当前版本不支持图片导出功能');
            }
        } catch (error) {
            console.error('✗ 导出图片失败:', error);
            alert('导出图片失败：' + error.message);
        }
    }
    
    // 创建浮动按钮
    function createFloatingButtons() {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            background: rgba(255, 255, 255, 0.9);
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        // 保存按钮
        const saveBtn = document.createElement('button');
        saveBtn.style.cssText = `
            padding: 8px 16px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;
        saveBtn.innerHTML = '💾 保存脑图';
        saveBtn.onclick = saveMindmapToFile;
        
        // 导入按钮
        const importBtn = document.createElement('button');
        importBtn.style.cssText = `
            padding: 8px 16px;
            background: #17a2b8;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;
        importBtn.innerHTML = '📂 导入脑图';
        importBtn.onclick = importMindmapFromFile;
        
        buttonContainer.appendChild(saveBtn);
        buttonContainer.appendChild(importBtn);
        document.body.appendChild(buttonContainer);
        
        console.log('✓ 浮动保存和导入按钮已创建');
    }
    
    // 初始化功能
    function initializeSaveImport() {
        let attempts = 0;
        const maxAttempts = 50;
        
        function checkAndInit() {
            attempts++;
            
            if (window.jsMind && window.mindmaps) {
                console.log('✓ jsMind已加载，初始化保存导入功能');
                createFloatingButtons();
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.error('✗ 等待jsMind加载超时，仍创建按钮');
                createFloatingButtons();
                return;
            }
            
            setTimeout(checkAndInit, 200);
        }
        
        checkAndInit();
    }
    
    // 页面加载完成后初始化
    waitForPageLoad(initializeSaveImport);
    
    // 导出到全局作用域
    window.MindmapSaveImport = {
        saveMindmapToFile,
        importMindmapFromFile,
        exportMindmapAsImage,
        getCurrentMindmap
    };
    
})(); 