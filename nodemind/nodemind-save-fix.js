/**
 * NodeMind 保存功能修复脚本
 * 直接在NodeMind页面的浏览器控制台中运行此脚本
 */

console.log('🚀 开始应用NodeMind保存功能修复...');

// 1. 创建紧急保存函数
window.emergencySave = function(data, filename, format = 'json') {
    console.log(`💾 执行保存: ${filename}.${format}`);
    
    let content, mimeType;
    
    if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
    } else if (format === 'md') {
        content = convertToMarkdown(data);
        mimeType = 'text/markdown';
    }
    
    // 尝试现代文件API，失败则降级
    if ('showSaveFilePicker' in window) {
        saveBlobModern(content, filename + '.' + format, mimeType);
    } else {
        saveBlobLegacy(content, filename + '.' + format, mimeType);
    }
};

// 2. 现代文件保存API
window.saveBlobModern = async function(content, filename, mimeType) {
    try {
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
                description: '文件',
                accept: { [mimeType]: ['.' + filename.split('.').pop()] }
            }]
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        
        console.log(`✅ 文件保存成功: ${filename}`);
        alert(`✅ 文件保存成功: ${filename}`);
        return true;
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error(`❌ 现代API保存失败: ${error.message}`);
            // 降级到传统方式
            saveBlobLegacy(content, filename, mimeType);
        }
        return false;
    }
};

// 3. 传统文件保存（降级方案）
window.saveBlobLegacy = function(content, filename, mimeType) {
    try {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`✅ 传统方式保存成功: ${filename}`);
        alert(`✅ 文件下载成功: ${filename}`);
        return true;
    } catch (error) {
        console.error(`❌ 传统方式保存失败: ${error.message}`);
        alert(`❌ 保存失败: ${error.message}`);
        return false;
    }
};

// 4. Markdown转换函数
window.convertToMarkdown = function(data) {
    if (!data || (!data.nodes && !data.project)) {
        return '# NodeMind 思维导图\n\n暂无数据\n\n导出时间: ' + new Date().toLocaleString();
    }
    
    let markdown = '# NodeMind 思维导图\n\n';
    markdown += `导出时间: ${new Date().toLocaleString()}\n\n`;
    
    // 处理不同的数据结构
    if (data.nodes) {
        // 新格式数据
        data.nodes.forEach(node => {
            const level = Math.min(node.level || 1, 6);
            const prefix = '#'.repeat(level + 1);
            markdown += `${prefix} ${node.text || node.name || '未命名节点'}\n\n`;
            
            if (node.description) {
                markdown += `${node.description}\n\n`;
            }
        });
    } else if (data.project && data.project.data) {
        // 旧格式数据
        const processNode = (node, level = 1) => {
            const prefix = '#'.repeat(Math.min(level + 1, 6));
            markdown += `${prefix} ${node.topic || node.text || '未命名节点'}\n\n`;
            
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                    processNode(child, level + 1);
                });
            }
        };
        
        processNode(data.project.data);
    }
    
    markdown += '\n---\n*由 NodeMind 自动生成*\n';
    return markdown;
};

// 5. 修复原始保存函数
function fixOriginalSaveFunctions() {
    // 修复showSaveFormatDialog函数
    if (typeof window.showSaveFormatDialog !== 'function') {
        window.showSaveFormatDialog = function() {
            console.log('🔧 使用修复版本的保存格式对话框');
            
            const choice = confirm(
                '选择保存格式：\n\n' +
                '点击"确定"：保存为JSON格式\n' +
                '点击"取消"：保存为Markdown格式'
            );
            
            // 尝试获取现有数据
            let saveData = null;
            
            if (typeof window.mindmapData !== 'undefined') {
                saveData = window.mindmapData;
            } else if (typeof window.nodeParent !== 'undefined') {
                // 构建基本数据结构
                saveData = {
                    project: {
                        meta: { 
                            name: 'NodeMind项目', 
                            author: 'User', 
                            version: '1.0.0',
                            created: new Date().toISOString()
                        },
                        data: { topic: '思维导图根节点' }
                    },
                    nodeDetails: {},
                    exportInfo: {
                        timestamp: new Date().toISOString(),
                        exported_by: 'NodeMind修复版本'
                    }
                };
            } else {
                // 使用默认数据
                saveData = {
                    project: {
                        meta: { name: 'NodeMind导出', version: '1.0.0' },
                        data: { topic: '思维导图' }
                    },
                    timestamp: new Date().toISOString()
                };
            }
            
            const filename = 'NodeMind-' + new Date().toISOString().slice(0,10);
            
            if (choice) {
                emergencySave(saveData, filename, 'json');
            } else {
                emergencySave(saveData, filename, 'md');
            }
        };
        console.log('✅ showSaveFormatDialog 函数已修复');
    }
    
    // 修复保存按钮
    const saveButton = document.getElementById('export_custom_file_button');
    if (saveButton) {
        saveButton.onclick = function() {
            console.log('💾 保存按钮被点击');
            showSaveFormatDialog();
        };
        console.log('✅ 保存按钮已修复');
    }
    
    // 修复其他可能的保存函数
    if (typeof window.saveProjectMindmap !== 'function') {
        window.saveProjectMindmap = function() {
            console.log('🔧 使用修复版本的saveProjectMindmap');
            showSaveFormatDialog();
        };
        console.log('✅ saveProjectMindmap 函数已修复');
    }
    
    if (typeof window.exportToMDDocumentWithStandardParser !== 'function') {
        window.exportToMDDocumentWithStandardParser = function() {
            console.log('🔧 使用修复版本的MD导出');
            const filename = 'NodeMind-MD-' + new Date().toISOString().slice(0,10);
            emergencySave(window.mindmapData || {}, filename, 'md');
        };
        console.log('✅ exportToMDDocumentWithStandardParser 函数已修复');
    }
}

// 6. 添加键盘快捷键支持
function setupKeyboardShortcuts() {
    // 移除可能的旧监听器，添加新的
    document.removeEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleKeyDown);
    
    function handleKeyDown(e) {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            console.log('⌨️ 检测到Ctrl+S快捷键');
            showSaveFormatDialog();
            return false;
        }
    }
    
    console.log('✅ 键盘快捷键已设置');
}

// 7. 执行修复
try {
    fixOriginalSaveFunctions();
    setupKeyboardShortcuts();
    
    console.log('🎉 NodeMind保存功能修复完成！');
    console.log('📋 使用方法：');
    console.log('  1. 按 Ctrl+S 快捷键');
    console.log('  2. 点击保存按钮');
    console.log('  3. 直接调用 emergencySave(data, "filename", "json|md")');
    
    // 显示成功提示
    if (typeof alert !== 'undefined') {
        alert('🎉 NodeMind保存功能修复完成！\n\n现在可以：\n• 按 Ctrl+S 保存\n• 点击保存按钮\n• 正常使用保存功能');
    }
    
} catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
    if (typeof alert !== 'undefined') {
        alert('❌ 修复失败: ' + error.message);
    }
}

// 8. 提供测试函数
window.testSave = function() {
    console.log('🧪 开始测试保存功能...');
    const testData = {
        project: {
            meta: { name: '测试项目', version: '1.0.0' },
            data: { topic: '测试根节点' }
        },
        timestamp: new Date().toISOString()
    };
    
    emergencySave(testData, 'test-save', 'json');
};

console.log('✨ 修复脚本加载完成！输入 testSave() 可以测试保存功能。'); 