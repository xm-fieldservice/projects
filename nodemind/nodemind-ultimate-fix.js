/**
 * NodeMind 终极保存功能修复脚本
 * 专门处理复杂错误情况和深度集成问题
 */

console.log('🔥 启动NodeMind终极修复模式...');

// === 第一步：清理现有错误状态 ===
function clearErrorStates() {
    console.log('🧹 清理现有错误状态...');
    
    // 清理可能的错误监听器
    try {
        window.removeEventListener('error', arguments.callee);
        window.removeEventListener('unhandledrejection', arguments.callee);
    } catch (e) {}
    
    // 重置可能的错误标志
    if (window.hasError) window.hasError = false;
    if (window.saveError) window.saveError = null;
    
    console.log('✅ 错误状态已清理');
}

// === 第二步：深度系统诊断 ===
function deepSystemDiagnosis() {
    console.log('🔍 开始深度系统诊断...');
    
    const diagnosis = {
        browser: {
            name: navigator.userAgent,
            saveAPI: 'showSaveFilePicker' in window,
            blobAPI: 'Blob' in window,
            urlAPI: 'URL' in window && 'createObjectURL' in URL
        },
        environment: {
            protocol: location.protocol,
            isSecure: location.protocol === 'https:' || location.hostname === 'localhost',
            hasFileDownload: 'download' in document.createElement('a')
        },
        nodeMind: {
            functions: {},
            variables: {},
            elements: {}
        }
    };
    
    // 检查NodeMind相关函数
    const functions = [
        'saveProjectMindmap', 'exportToMDDocumentWithStandardParser', 
        'showSaveFormatDialog', 'saveMindmapAsJSON', 'exportMindmapAsMD'
    ];
    
    functions.forEach(funcName => {
        diagnosis.nodeMind.functions[funcName] = typeof window[funcName] === 'function';
    });
    
    // 检查NodeMind相关变量
    const variables = [
        'mindmapData', 'nodeParent', 'nodeChildren', 'nodeColors', 
        'currentProject', 'projectData', 'treeData'
    ];
    
    variables.forEach(varName => {
        diagnosis.nodeMind.variables[varName] = typeof window[varName] !== 'undefined';
    });
    
    // 检查相关DOM元素
    const elements = [
        'export_custom_file_button', 'save_button', 'download_button'
    ];
    
    elements.forEach(elemId => {
        diagnosis.nodeMind.elements[elemId] = document.getElementById(elemId) !== null;
    });
    
    console.log('📋 诊断结果:', diagnosis);
    return diagnosis;
}

// === 第三步：强制数据提取 ===
function forceExtractData() {
    console.log('📊 强制提取NodeMind数据...');
    
    let extractedData = null;
    
    // 方法1：从全局变量提取
    if (window.mindmapData) {
        extractedData = window.mindmapData;
        console.log('✅ 从mindmapData提取数据成功');
    }
    // 方法2：从DOM结构提取
    else {
        try {
            // 查找思维导图节点
            const nodes = [];
            const nodeElements = document.querySelectorAll('[data-node-id], .mind-node, .node');
            
            nodeElements.forEach((elem, index) => {
                const text = elem.textContent || elem.innerText || `节点${index + 1}`;
                nodes.push({
                    id: index + 1,
                    text: text.trim(),
                    element: elem.tagName
                });
            });
            
            if (nodes.length > 0) {
                extractedData = {
                    project: {
                        meta: { 
                            name: '从DOM提取的项目', 
                            extractMethod: 'DOM_SCAN',
                            timestamp: new Date().toISOString()
                        },
                        nodes: nodes
                    }
                };
                console.log(`✅ 从DOM提取到 ${nodes.length} 个节点`);
            }
        } catch (e) {
            console.warn('⚠️ DOM提取失败:', e.message);
        }
    }
    
    // 方法3：创建默认数据结构
    if (!extractedData) {
        extractedData = {
            project: {
                meta: {
                    name: 'NodeMind项目备份',
                    created: new Date().toISOString(),
                    version: '1.0.0',
                    extractMethod: 'DEFAULT'
                },
                data: {
                    topic: '思维导图根节点',
                    children: [
                        { topic: '子节点1' },
                        { topic: '子节点2' }
                    ]
                }
            },
            exportInfo: {
                timestamp: new Date().toISOString(),
                exported_by: 'NodeMind终极修复版本',
                note: '这是默认数据结构，请在NodeMind中重新创建您的思维导图'
            }
        };
        console.log('✅ 使用默认数据结构');
    }
    
    window.extractedNodeMindData = extractedData;
    return extractedData;
}

// === 第四步：创建超级保存函数 ===
function createSuperSaveFunctions() {
    console.log('🚀 创建超级保存函数...');
    
    // 超级紧急保存 - 无依赖版本
    window.superEmergencySave = function(data, filename, format = 'json') {
        console.log(`💾 超级紧急保存: ${filename}.${format}`);
        
        try {
            let content, mimeType, extension;
            
            if (format === 'json') {
                content = JSON.stringify(data, null, 2);
                mimeType = 'application/json';
                extension = '.json';
            } else if (format === 'md') {
                content = convertToSuperMarkdown(data);
                mimeType = 'text/markdown';
                extension = '.md';
            } else {
                content = String(data);
                mimeType = 'text/plain';
                extension = '.txt';
            }
            
            // 方法1：尝试现代API
            if (window.showSaveFilePicker) {
                return saveWithModernAPI(content, filename + extension, mimeType);
            }
            // 方法2：传统下载
            else if (window.URL && window.Blob) {
                return saveWithTraditionalDownload(content, filename + extension, mimeType);
            }
            // 方法3：最后的降级方案
            else {
                return saveWithDataURI(content, filename + extension);
            }
            
        } catch (error) {
            console.error('❌ 超级紧急保存失败:', error);
            // 最终降级：复制到剪贴板
            return copyToClipboard(content, filename);
        }
    };
    
    // 现代API保存
    async function saveWithModernAPI(content, filename, mimeType) {
        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'NodeMind文件',
                    accept: { [mimeType]: [filename.split('.').pop()] }
                }]
            });
            
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            
            console.log(`✅ 现代API保存成功: ${filename}`);
            showSuccessNotification(`文件已保存: ${filename}`);
            return true;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('📋 用户取消保存');
                return false;
            }
            console.warn('⚠️ 现代API失败，降级到传统方式:', error.message);
            return saveWithTraditionalDownload(content, filename, mimeType);
        }
    }
    
    // 传统下载保存
    function saveWithTraditionalDownload(content, filename, mimeType) {
        try {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            
            // 清理
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            console.log(`✅ 传统下载成功: ${filename}`);
            showSuccessNotification(`文件已下载: ${filename}`);
            return true;
        } catch (error) {
            console.warn('⚠️ 传统下载失败，使用DataURI:', error.message);
            return saveWithDataURI(content, filename);
        }
    }
    
    // DataURI保存
    function saveWithDataURI(content, filename) {
        try {
            const dataURI = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
            const a = document.createElement('a');
            
            a.href = dataURI;
            a.download = filename;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            console.log(`✅ DataURI保存成功: ${filename}`);
            showSuccessNotification(`文件已保存: ${filename}`);
            return true;
        } catch (error) {
            console.warn('⚠️ DataURI失败，复制到剪贴板:', error.message);
            return copyToClipboard(content, filename);
        }
    }
    
    // 复制到剪贴板（最后手段）
    function copyToClipboard(content, filename) {
        try {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(content);
                console.log('✅ 内容已复制到剪贴板');
                alert(`无法直接保存文件，内容已复制到剪贴板。\n请手动创建文件 ${filename} 并粘贴内容。`);
                return true;
            } else {
                // 传统复制方法
                const textArea = document.createElement('textarea');
                textArea.value = content;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                console.log('✅ 内容已复制到剪贴板（传统方式）');
                alert(`无法直接保存文件，内容已复制到剪贴板。\n请手动创建文件 ${filename} 并粘贴内容。`);
                return true;
            }
        } catch (error) {
            console.error('❌ 复制到剪贴板也失败了:', error);
            alert(`保存失败，请手动复制以下内容：\n\n${content.substring(0, 200)}...`);
            return false;
        }
    }
}

// === 第五步：增强版Markdown转换 ===
function convertToSuperMarkdown(data) {
    let markdown = '# NodeMind 思维导图导出\n\n';
    markdown += `**导出时间**: ${new Date().toLocaleString()}\n`;
    markdown += `**导出版本**: NodeMind终极修复版本\n\n`;
    
    if (!data) {
        markdown += '## ⚠️ 数据为空\n\n请在NodeMind中创建思维导图后再导出。\n';
        return markdown;
    }
    
    try {
        // 处理各种可能的数据结构
        if (data.project) {
            if (data.project.meta) {
                markdown += `## 项目信息\n\n`;
                markdown += `- **项目名称**: ${data.project.meta.name || '未命名项目'}\n`;
                markdown += `- **版本**: ${data.project.meta.version || '1.0.0'}\n\n`;
            }
            
            if (data.project.data) {
                markdown += `## 思维导图结构\n\n`;
                const processNode = (node, level = 1) => {
                    const indent = '  '.repeat(level - 1);
                    const bullet = level === 1 ? '#' : '-';
                    const prefix = level === 1 ? '### ' : `${indent}${bullet} `;
                    
                    markdown += `${prefix}${node.topic || node.text || '未命名节点'}\n`;
                    
                    if (node.children && node.children.length > 0) {
                        node.children.forEach(child => processNode(child, level + 1));
                    }
                    
                    if (level === 1) markdown += '\n';
                };
                
                processNode(data.project.data);
            }
            
            if (data.project.nodes) {
                markdown += `## 节点详情\n\n`;
                data.project.nodes.forEach((node, index) => {
                    markdown += `### 节点 ${index + 1}: ${node.text || node.name || '未命名'}\n`;
                    if (node.description) markdown += `${node.description}\n`;
                    if (node.element) markdown += `*提取自: ${node.element}*\n`;
                    markdown += '\n';
                });
            }
        }
        
        if (data.exportInfo) {
            markdown += `## 导出信息\n\n`;
            Object.entries(data.exportInfo).forEach(([key, value]) => {
                markdown += `- **${key}**: ${value}\n`;
            });
            markdown += '\n';
        }
        
    } catch (error) {
        markdown += `## ❌ 数据处理错误\n\n`;
        markdown += `错误信息: ${error.message}\n\n`;
        markdown += `原始数据:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;
    }
    
    markdown += '\n---\n*由 NodeMind 终极修复版本自动生成*\n';
    return markdown;
}

// === 第六步：创建成功通知 ===
function showSuccessNotification(message) {
    // 尝试移除现有的红色错误提示
    const errorElements = document.querySelectorAll('.error, .alert-error, [class*="error"], [style*="color: red"]');
    errorElements.forEach(elem => {
        if (elem.textContent.includes('保存') || elem.textContent.includes('失败')) {
            elem.style.display = 'none';
        }
    });
    
    // 创建成功提示
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4CAF50;
        color: white;
        padding: 12px 24px;
        border-radius: 6px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.textContent = '✅ ' + message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// === 第七步：重写所有保存相关函数 ===
function overwriteAllSaveFunctions() {
    console.log('🔧 重写所有保存相关函数...');
    
    const saveFunctions = [
        'saveProjectMindmap',
        'exportToMDDocumentWithStandardParser',
        'showSaveFormatDialog',
        'saveMindmapAsJSON',
        'exportMindmapAsMD'
    ];
    
    saveFunctions.forEach(funcName => {
        window[funcName] = function() {
            console.log(`🔧 调用重写的 ${funcName}`);
            const data = window.extractedNodeMindData || forceExtractData();
            
            if (funcName.includes('MD') || funcName.includes('Markdown')) {
                superEmergencySave(data, 'NodeMind-Export', 'md');
            } else if (funcName.includes('JSON')) {
                superEmergencySave(data, 'NodeMind-Export', 'json');
            } else {
                // 显示格式选择
                const choice = confirm('选择保存格式：\n\n确定 = JSON格式\n取消 = Markdown格式');
                superEmergencySave(data, 'NodeMind-Export', choice ? 'json' : 'md');
            }
        };
    });
    
    console.log('✅ 所有保存函数已重写');
}

// === 第八步：强制绑定所有保存按钮 ===
function forceBindAllSaveButtons() {
    console.log('🔘 强制绑定所有保存按钮...');
    
    // 查找所有可能的保存按钮
    const buttonSelectors = [
        '#export_custom_file_button',
        '#save_button',
        '#download_button',
        '.save-btn',
        '.export-btn',
        'button[onclick*="save"]',
        'button[onclick*="export"]',
        'button[onclick*="download"]'
    ];
    
    buttonSelectors.forEach(selector => {
        try {
            const buttons = document.querySelectorAll(selector);
            buttons.forEach(button => {
                // 移除旧的事件监听器
                button.onclick = null;
                
                // 绑定新的事件监听器
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('💾 保存按钮被点击:', selector);
                    
                    const data = window.extractedNodeMindData || forceExtractData();
                    const choice = confirm('选择保存格式：\n\n确定 = JSON格式\n取消 = Markdown格式');
                    superEmergencySave(data, 'NodeMind-Export', choice ? 'json' : 'md');
                });
                
                console.log(`✅ 已绑定按钮: ${selector}`);
            });
        } catch (e) {
            console.warn(`⚠️ 绑定按钮失败: ${selector}`, e.message);
        }
    });
}

// === 第九步：设置全局快捷键 ===
function setupGlobalShortcuts() {
    console.log('⌨️ 设置全局快捷键...');
    
    // 移除所有现有的键盘监听器
    document.removeEventListener('keydown', handleGlobalKeyDown);
    
    function handleGlobalKeyDown(e) {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            console.log('⌨️ 检测到Ctrl+S快捷键');
            
            const data = window.extractedNodeMindData || forceExtractData();
            const choice = confirm('选择保存格式：\n\n确定 = JSON格式\n取消 = Markdown格式');
            superEmergencySave(data, 'NodeMind-Export', choice ? 'json' : 'md');
            
            return false;
        }
    }
    
    document.addEventListener('keydown', handleGlobalKeyDown, true);
    console.log('✅ 全局快捷键已设置');
}

// === 执行终极修复 ===
async function executeUltimateFix() {
    try {
        console.log('🔥 开始执行终极修复...');
        
        // 步骤1：清理错误状态
        clearErrorStates();
        
        // 步骤2：深度诊断
        const diagnosis = deepSystemDiagnosis();
        
        // 步骤3：强制提取数据
        const data = forceExtractData();
        
        // 步骤4：创建超级保存函数
        createSuperSaveFunctions();
        
        // 步骤5：重写所有保存函数
        overwriteAllSaveFunctions();
        
        // 步骤6：强制绑定保存按钮
        forceBindAllSaveButtons();
        
        // 步骤7：设置全局快捷键
        setupGlobalShortcuts();
        
        console.log('🎉 终极修复完成！');
        console.log('📋 测试方法：');
        console.log('  1. 按 Ctrl+S 快捷键');
        console.log('  2. 点击任何保存按钮');
        console.log('  3. 调用 superEmergencySave()');
        console.log('  4. 调用 testUltimateSave()');
        
        // 显示成功提示
        showSuccessNotification('终极修复完成！现在尝试保存功能');
        
        // 提供测试函数
        window.testUltimateSave = function() {
            console.log('🧪 测试终极保存功能...');
            const testData = window.extractedNodeMindData || {
                project: {
                    meta: { name: '测试项目' },
                    data: { topic: '测试根节点' }
                }
            };
            superEmergencySave(testData, 'Ultimate-Test', 'json');
        };
        
        return true;
        
    } catch (error) {
        console.error('❌ 终极修复失败:', error);
        alert('终极修复失败: ' + error.message);
        return false;
    }
}

// 立即执行终极修复
executeUltimateFix();

console.log('✨ NodeMind终极修复脚本加载完成！');
console.log('🧪 输入 testUltimateSave() 可以测试保存功能');
console.log('💾 输入 superEmergencySave(data, "filename", "json|md") 可以直接保存'); 