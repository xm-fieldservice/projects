// NodeMind 保存功能修复脚本
// 使用方法：在浏览器控制台中运行此脚本

console.log('🔧 NodeMind保存功能修复脚本启动...');

// 1. 检查当前环境
function checkEnvironment() {
    console.log('🔍 检查当前环境...');
    
    const checks = {
        'showSaveFilePicker API': !!window.showSaveFilePicker,
        'nodeDatabase': !!window.nodeDatabase,
        'mindmaps': !!window.mindmaps,
        'showSaveFormatDialog函数': typeof window.showSaveFormatDialog === 'function',
        'exportToMDDocumentWithStandardParser函数': typeof window.exportToMDDocumentWithStandardParser === 'function',
        'saveProjectMindmap函数': typeof window.saveProjectMindmap === 'function'
    };
    
    console.table(checks);
    
    const supportCount = Object.values(checks).filter(Boolean).length;
    console.log(`✅ 环境检查完成：${supportCount}/${Object.keys(checks).length} 项支持`);
    
    return checks;
}

// 2. 简单的保存功能实现
function createSimpleSaveFunction() {
    console.log('🛠️ 创建简单保存功能...');
    
    window.simpleSave = async function() {
        try {
            console.log('💾 开始简单保存...');
            
            // 获取数据
            const nodeDatabase = window.nodeDatabase || {};
            const mindmaps = window.mindmaps || {};
            const sessionDatabase = window.sessionDatabase || {};
            
            const nodeCount = Object.keys(nodeDatabase).length;
            const mindmapCount = Object.keys(mindmaps).length;
            
            console.log(`📊 数据统计: 节点${nodeCount}个, 脑图${mindmapCount}个`);
            
            if (nodeCount === 0 && mindmapCount === 0) {
                alert('❌ 没有可保存的数据');
                return;
            }
            
            // 选择格式
            const useJSON = confirm(
                '选择保存格式：\n\n' +
                '✅ 确定 = JSON格式（完整数据）\n' +
                '❌ 取消 = MD格式（标准文档）'
            );
            
            if (useJSON) {
                await saveAsJSON(nodeDatabase, mindmaps, sessionDatabase);
            } else {
                await saveAsMD(nodeDatabase, mindmaps, sessionDatabase);
            }
            
        } catch (error) {
            console.error('❌ 保存失败:', error);
            alert(`保存失败: ${error.message}`);
        }
    };
    
    console.log('✅ simpleSave函数已创建，可以调用 simpleSave() 进行保存');
}

// 3. JSON格式保存
async function saveAsJSON(nodeDatabase, mindmaps, sessionDatabase) {
    console.log('📊 保存为JSON格式...');
    
    const exportData = {
        mindmapData: mindmaps,
        nodeDatabase: nodeDatabase,
        sessionDatabase: sessionDatabase,
        projectInfo: {
            name: '当前NodeMind项目',
            description: '通过修复脚本导出的项目数据',
            author: 'NodeMind用户',
            version: '1.0.0',
            exportTime: new Date().toISOString()
        },
        exportInfo: {
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            exported_by: "NodeMind修复脚本",
            export_type: "simple_save"
        }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const fileName = `NodeMind_简单保存_${new Date().toISOString().slice(0,10)}.json`;
    
    await saveFile(dataStr, fileName, 'application/json', '.json');
}

// 4. MD格式保存
async function saveAsMD(nodeDatabase, mindmaps, sessionDatabase) {
    console.log('📝 保存为MD格式...');
    
    let mdContent = `# NodeMind 项目导出

## 项目信息
- **导出时间**: ${new Date().toLocaleString('zh-CN')}
- **导出方式**: 修复脚本
- **节点数量**: ${Object.keys(nodeDatabase).length}
- **脑图数量**: ${Object.keys(mindmaps).length}

## 节点数据

`;

    // 添加节点信息
    Object.values(nodeDatabase).forEach(node => {
        mdContent += `### ${node.title || node.id}
**ID**: ${node.id}
**内容**: ${node.content || '(无内容)'}
**作者**: ${node.author || '未知'}
**创建时间**: ${node.created || '未知'}
**修改时间**: ${node.modified || '未知'}

`;
    });

    // 添加脑图结构
    mdContent += `## 脑图结构

`;
    
    Object.entries(mindmaps).forEach(([mapId, mapData]) => {
        mdContent += `### ${mapId} 脑图
`;
        if (mapData && mapData.data) {
            mdContent += generateMindmapTree(mapData.data, 0);
        }
        mdContent += '\n';
    });

    mdContent += `
---
*此文档由 NodeMind 修复脚本自动生成*
`;

    const fileName = `NodeMind_简单导出_${new Date().toISOString().slice(0,10)}.md`;
    await saveFile(mdContent, fileName, 'text/markdown', '.md');
}

// 5. 生成脑图树结构
function generateMindmapTree(node, level) {
    const indent = '  '.repeat(level);
    let result = `${indent}- ${node.topic || node.id}\n`;
    
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            result += generateMindmapTree(child, level + 1);
        });
    }
    
    return result;
}

// 6. 通用文件保存函数
async function saveFile(content, fileName, mimeType, extension) {
    if (!window.showSaveFilePicker) {
        // 降级到下载模式
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`✅ 文件已下载: ${fileName}`);
        alert(`文件已下载: ${fileName}`);
        return;
    }
    
    // 使用现代文件系统API
    const fileHandle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
            {
                description: `NodeMind文件 (${extension})`,
                accept: {
                    [mimeType]: [extension]
                }
            }
        ]
    });
    
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    
    console.log(`✅ 文件已保存: ${fileName}`);
    alert(`文件已保存: ${fileName}`);
}

// 7. 添加快捷键支持
function addKeyboardShortcut() {
    console.log('⌨️ 添加Ctrl+S快捷键支持...');
    
    // 移除现有的Ctrl+S监听器
    document.removeEventListener('keydown', window.ctrlSHandler);
    
    // 添加新的监听器
    window.ctrlSHandler = function(e) {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            console.log('⌨️ 检测到Ctrl+S，调用简单保存功能');
            if (window.simpleSave) {
                window.simpleSave();
            } else {
                alert('保存功能未初始化，请先运行修复脚本');
            }
            return false;
        }
    };
    
    document.addEventListener('keydown', window.ctrlSHandler);
    console.log('✅ Ctrl+S快捷键已添加');
}

// 8. 主修复函数
function fixSaveFunction() {
    console.log('🚀 开始修复NodeMind保存功能...');
    
    // 检查环境
    const env = checkEnvironment();
    
    // 创建简单保存功能
    createSimpleSaveFunction();
    
    // 添加快捷键支持
    addKeyboardShortcut();
    
    // 修复保存按钮
    const saveButton = document.getElementById('export_custom_file_button');
    if (saveButton) {
        saveButton.onclick = function() {
            console.log('🖱️ 保存按钮被点击');
            window.simpleSave();
        };
        console.log('✅ 保存按钮已修复');
    } else {
        console.log('⚠️ 未找到保存按钮');
    }
    
    console.log('🎉 NodeMind保存功能修复完成！');
    console.log('💡 使用方法：');
    console.log('   1. 按 Ctrl+S 快捷键');
    console.log('   2. 点击 "💾 保存文件" 按钮');
    console.log('   3. 在控制台调用 simpleSave()');
    
    // 显示成功提示
    if (window.showMessage) {
        window.showMessage('✅ 保存功能已修复！按Ctrl+S或点击保存按钮测试', 3000);
    } else {
        alert('✅ 保存功能已修复！按Ctrl+S或点击保存按钮测试');
    }
}

// 自动运行修复
fixSaveFunction(); 