import { state } from '../../state.js';
import { showMessage } from '../../utils/utils.js';

/**
 * 初始化MD浏览器
 */
export function initMdBrowser() {
    const textarea = document.getElementById('md-textarea');
    if (!textarea) return;

    textarea.addEventListener('input', updateMdStats);
    updateMdStats();

    textarea.value = `# 欢迎使用MD文本浏览器
这是一个功能强大的Markdown编辑器和预览工具。
## 主要功能
- ✅ **实时编辑** - 在左侧编辑Markdown文本
- ✅ **即时预览** - 点击"预览"按钮查看渲染效果
- ✅ **文件操作** - 支持加载和保存MD文件
- ✅ **统计信息** - 显示字符数和行数
## 支持的语法
### 标题
\`# 一级标题\`
\`## 二级标题\`
\`### 三级标题\`
### 文本样式
- **粗体文本**
- *斜体文本*
- \`行内代码\`
### 列表
- 无序列表项1
- 无序列表项2
### 代码块
\`\`\`javascript
function hello() {
    console.log("Hello, World!");
}
\`\`\`
### 链接
[GitHub](https://github.com)
### 引用
> 这是一个引用块
---
**提示：** 点击"预览"按钮查看渲染效果！`;

    updateMdStats();
}

/**
 * 切换MD预览/编辑模式
 */
export function toggleMdPreview() {
    const editorPanel = document.getElementById('md-editor');
    const previewPanel = document.getElementById('md-preview');
    const toggleBtn = document.querySelector('.md-browser-controls button[onclick="toggleMdPreview()"]');
    const modeIndicator = document.getElementById('md-mode-indicator');

    if (state.mdPreviewMode) {
        // 切换到编辑模式
        editorPanel.classList.add('active');
        previewPanel.classList.remove('active');
        toggleBtn.innerHTML = '👁️ 预览';
        modeIndicator.textContent = '编辑模式';
        state.mdPreviewMode = false;
    } else {
        // 切换到预览模式
        const mdContent = document.getElementById('md-textarea').value;
        const previewContent = document.getElementById('md-preview-content');

        if (mdContent.trim()) {
            previewContent.innerHTML = convertMarkdownToHtml(mdContent);
        } else {
            previewContent.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📖</div>
                    <div>没有内容可预览</div>
                </div>
            `;
        }

        editorPanel.classList.remove('active');
        previewPanel.classList.add('active');
        toggleBtn.innerHTML = '✏️ 编辑';
        modeIndicator.textContent = '预览模式';
        state.mdPreviewMode = true;
    }
}

/**
 * 简单的Markdown到HTML转换（基础版本）
 * @param {string} markdown 
 * @returns {string}
 */
function convertMarkdownToHtml(markdown) {
    let html = markdown;
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
    html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
    return html;
}

/**
 * 加载MD文件
 */
export function loadMdFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,.txt';
    input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                document.getElementById('md-textarea').value = e.target.result;
                updateMdStats();
                console.log('📁 MD文件已加载:', file.name);
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

/**
 * 保存MD内容
 */
export function saveMdContent() {
    const content = document.getElementById('md-textarea').value;
    const filename = prompt('请输入文件名:', 'document.md');
    if (filename) {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        console.log('💾 MD文件已保存:', filename);
    }
}

/**
 * 更新MD统计信息
 */
function updateMdStats() {
    const textarea = document.getElementById('md-textarea');
    const content = textarea.value;
    const charCount = content.length;
    const lineCount = content.split('\n').length;

    document.getElementById('md-char-count').textContent = `字符: ${charCount}`;
    document.getElementById('md-line-count').textContent = `行数: ${lineCount}`;
} 