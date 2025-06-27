// 简单紧急导出脚本 - 专门解决NodeMind导出失败问题
// 直接在控制台运行此脚本

console.log('🆘 启动简单紧急导出...');

// 直接执行导出
(function emergencyExport() {
    
    // 1. 获取所有可能的数据
    function getAllData() {
        console.log('📊 收集所有数据...');
        
        let allData = {
            timestamp: new Date().toISOString(),
            source: 'emergency-export'
        };
        
        // 从localStorage获取
        try {
            const storageData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                try {
                    const value = localStorage.getItem(key);
                    if (value && (value.startsWith('{') || value.startsWith('['))) {
                        storageData[key] = JSON.parse(value);
                    } else {
                        storageData[key] = value;
                    }
                } catch (e) {
                    storageData[key] = localStorage.getItem(key);
                }
            }
            allData.localStorage = storageData;
            console.log('✅ localStorage数据已收集');
        } catch (e) {
            console.log('⚠️ localStorage收集失败:', e.message);
        }
        
        // 从全局变量获取
        const globalVars = [
            'mindmapData', 'nodeDatabase', 'sessionDatabase',
            'nodeParent', 'nodeChildren', 'currentProject',
            'projectData', 'treeData'
        ];
        
        const globals = {};
        globalVars.forEach(varName => {
            if (window[varName] !== undefined) {
                try {
                    globals[varName] = JSON.parse(JSON.stringify(window[varName]));
                    console.log(`✅ 全局变量 ${varName} 已收集`);
                } catch (e) {
                    globals[varName] = String(window[varName]);
                }
            }
        });
        allData.globalVariables = globals;
        
        // 从jsMind获取
        if (window.jm && window.jm.get_data) {
            try {
                allData.jsMindData = window.jm.get_data();
                console.log('✅ jsMind数据已收集');
            } catch (e) {
                console.log('⚠️ jsMind数据收集失败:', e.message);
            }
        }
        
        // 从DOM获取
        try {
            const domNodes = [];
            document.querySelectorAll('*').forEach((elem, index) => {
                const text = elem.textContent?.trim();
                if (text && text.length > 3 && text.length < 200) {
                    domNodes.push({
                        tag: elem.tagName,
                        text: text,
                        id: elem.id,
                        className: elem.className
                    });
                }
            });
            allData.domContent = domNodes.slice(0, 100); // 限制数量
            console.log(`✅ DOM内容已收集 (${domNodes.length}个元素)`);
        } catch (e) {
            console.log('⚠️ DOM收集失败:', e.message);
        }
        
        return allData;
    }
    
    // 2. 生成Markdown内容
    function generateMarkdown(data) {
        console.log('📝 生成Markdown内容...');
        
        let md = `# NodeMind 紧急导出\n\n`;
        md += `**导出时间**: ${data.timestamp}\n\n`;
        md += `**数据来源**: ${data.source}\n\n`;
        
        // localStorage数据
        if (data.localStorage && Object.keys(data.localStorage).length > 0) {
            md += `## 📦 本地存储数据\n\n`;
            for (let [key, value] of Object.entries(data.localStorage)) {
                md += `### ${key}\n\n`;
                if (typeof value === 'object') {
                    md += `\`\`\`json\n${JSON.stringify(value, null, 2)}\`\`\`\n\n`;
                } else {
                    md += `${value}\n\n`;
                }
            }
        }
        
        // 全局变量数据
        if (data.globalVariables && Object.keys(data.globalVariables).length > 0) {
            md += `## 🌐 全局变量数据\n\n`;
            for (let [key, value] of Object.entries(data.globalVariables)) {
                md += `### ${key}\n\n`;
                if (typeof value === 'object') {
                    md += `\`\`\`json\n${JSON.stringify(value, null, 2)}\`\`\`\n\n`;
                } else {
                    md += `${value}\n\n`;
                }
            }
        }
        
        // jsMind数据
        if (data.jsMindData) {
            md += `## 🧠 jsMind 思维导图数据\n\n`;
            md += `\`\`\`json\n${JSON.stringify(data.jsMindData, null, 2)}\`\`\`\n\n`;
        }
        
        // DOM内容（精简版）
        if (data.domContent && data.domContent.length > 0) {
            md += `## 🌐 页面内容摘要\n\n`;
            data.domContent.slice(0, 20).forEach((item, index) => {
                if (item.text && item.text.length > 10) {
                    md += `${index + 1}. **${item.tag}**: ${item.text}\n`;
                }
            });
            md += `\n`;
        }
        
        return md;
    }
    
    // 3. 强制下载
    function forceDownload(content, filename) {
        console.log('💾 强制下载文件...');
        
        try {
            const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            // 创建下载链接
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            // 添加到页面并触发点击
            document.body.appendChild(link);
            link.click();
            
            // 清理
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            console.log('✅ 文件下载已触发');
            return true;
        } catch (error) {
            console.error('❌ 下载失败:', error);
            return false;
        }
    }
    
    // 4. 备用复制到剪贴板
    async function copyToClipboard(content) {
        console.log('📋 复制到剪贴板...');
        
        try {
            await navigator.clipboard.writeText(content);
            console.log('✅ 内容已复制到剪贴板');
            alert('导出内容已复制到剪贴板！\n请打开文本编辑器粘贴并保存为 .md 文件');
            return true;
        } catch (error) {
            console.error('❌ 剪贴板复制失败:', error);
            // 降级方案：使用传统方法
            try {
                const textArea = document.createElement('textarea');
                textArea.value = content;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                console.log('✅ 使用传统方法复制成功');
                alert('导出内容已复制到剪贴板！\n请打开文本编辑器粘贴并保存为 .md 文件');
                return true;
            } catch (e) {
                console.error('❌ 传统复制方法也失败:', e);
                return false;
            }
        }
    }
    
    // 主执行函数
    async function executeEmergencyExport() {
        try {
            console.log('🚀 开始紧急导出...');
            
            // 1. 收集数据
            const allData = getAllData();
            console.log('📊 数据收集完成，大小:', JSON.stringify(allData).length, '字符');
            
            // 2. 生成Markdown
            const markdownContent = generateMarkdown(allData);
            console.log('📝 Markdown生成完成，长度:', markdownContent.length, '字符');
            
            // 3. 生成文件名
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
            const filename = `NodeMind-紧急导出-${timestamp}.md`;
            
            // 4. 尝试下载
            const downloadSuccess = forceDownload(markdownContent, filename);
            
            // 5. 如果下载失败，复制到剪贴板
            if (!downloadSuccess) {
                await copyToClipboard(markdownContent);
            }
            
            // 6. 在控制台也输出内容（备用）
            console.log('📄 完整导出内容（备用）：');
            console.log('='.repeat(50));
            console.log(markdownContent);
            console.log('='.repeat(50));
            
            console.log('🎉 紧急导出完成！');
            
        } catch (error) {
            console.error('❌ 紧急导出失败:', error);
            
            // 最后的备用方案
            const simpleContent = `# NodeMind 基础导出\n\n导出时间: ${new Date().toLocaleString()}\n\n错误: ${error.message}\n\n这是一个基础的导出文档。`;
            await copyToClipboard(simpleContent);
        }
    }
    
    // 执行导出
    executeEmergencyExport();
    
})();

// 创建紧急按钮
const emergencyBtn = document.createElement('button');
emergencyBtn.innerHTML = '🆘 立即导出';
emergencyBtn.style.cssText = `
    position: fixed; top: 50px; right: 10px; z-index: 99999;
    background: #ff6600; color: white; border: none;
    padding: 12px 16px; border-radius: 6px; cursor: pointer;
    font-weight: bold; font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
`;
emergencyBtn.onclick = () => location.reload(); // 刷新后重新运行
document.body.appendChild(emergencyBtn);

console.log('✅ 简单紧急导出脚本完成！右上角橙色按钮可刷新页面重新导出。'); 