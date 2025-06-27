/**
 * @file utils.js
 * @description 通用工具函数
 */

/**
 * 显示消息提示 - 迁移自index.html的完整实现
 */
export function showMessage(message, duration = 2000) {
    console.log(`💬 [Utils] 显示消息: ${message}`);
    
    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.className = 'message-toast';
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(messageEl);
    
    // 自动移除
    setTimeout(() => {
        messageEl.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 300);
    }, duration);
}

/**
 * 获取节点的完整路径
 * @param {object} node - jsMind节点对象
 * @returns {string[]} - 包含路径各部分主题的数组
 */
export function getNodePath(node) {
    const path = [];
    let current = node;
    while (current) {
        path.unshift(`<span>${current.topic}</span>`);
        current = current.parent;
    }
    return path;
}

/**
 * 获取节点的自定义属性
 * @param {object} node - jsMind节点对象
 * @returns {Array<{key: string, value: any}>} - 自定义属性的键值对数组
 */
export function getCustomProperties(node) {
    const props = [];
    const standardProps = ['id', 'topic', 'direction', 'expanded', 'parent', 'children', 'data', '_data', 'isroot'];
    for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key) && !standardProps.includes(key)) {
            const value = node[key];
            if (typeof value !== 'function' && typeof value !== 'object') {
                props.push({ key, value });
            }
        }
    }
    return props;
}

/**
 * 备用文件下载函数
 * @param {string} content - 文件内容
 * @param {string} filename - 文件名
 * @param {string} contentType - 文件MIME类型
 */
export function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * 根据项目信息生成自动保存的文件名
 * @param {object} projectInfo - 项目信息对象
 * @param {string} currentMindmap - 当前脑图ID
 * @returns {string} - 文件名
 */
export function getAutoSaveFileName(projectInfo, currentMindmap) {
    const projectName = projectInfo.name || currentMindmap || 'nodemind';
    return `${projectName}-jsmind.json`;
}

/**
 * 获取项目文件的完整路径
 * @param {object} projectInfo - 项目信息对象
 * @param {string} fileName - 文件名
 * @returns {string} - 完整文件路径
 */
export function getProjectFilePath(projectInfo, fileName) {
    const projectPath = projectInfo.path;
    if (projectPath && projectPath !== '未设置') {
        let normalizedPath = projectPath.replace(/\\/g, '/');
        if (!normalizedPath.endsWith('/')) {
            normalizedPath += '/';
        }
        return normalizedPath + fileName;
    }
    return fileName;
}

/**
 * 检查是否有有效的项目路径
 * @param {object} projectInfo - 项目信息对象
 * @returns {boolean} - 是否有效
 */
export function hasValidProjectPath(projectInfo) {
    return projectInfo.path && projectInfo.path !== '未设置' && projectInfo.path.trim() !== '';
}

/**
 * 检查浏览器兼容性
 * @returns {boolean} - 是否兼容
 */
export function checkBrowserCompatibility() {
    return 'indexedDB' in window;
}

/**
 * 根据分类获取模板图标
 * @param {string} category - 分类名
 * @returns {string} - 图标
 */
export function getTemplateIcon(category) {
    const icons = {
        'development': '💻',
        'design': '🎨',
        'analysis': '📊',
        'documentation': '📚',
        'testing': '🧪',
        'planning': '📋',
        'communication': '💬'
    };
    return icons[category] || '📝';
}
