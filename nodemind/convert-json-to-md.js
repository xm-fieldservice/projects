/**
 * 将脑图开发计划.json转换为符合第三次重构标准的MD格式文档
 * 
 * 转换规则：
 * 1. 每个节点转换为一个MD会话块
 * 2. 保持层级关系
 * 3. 包含标签和元数据信息
 * 4. 符合万能数据架构的MD格式规范
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取JSON文件
function loadProjectData() {
    try {
        const jsonPath = path.join(__dirname, '脑图开发计划.json');
        const jsonContent = fs.readFileSync(jsonPath, 'utf8');
        return JSON.parse(jsonContent);
    } catch (error) {
        console.error('❌ 读取JSON文件失败:', error);
        return null;
    }
}

// 将节点转换为MD格式
function convertNodeToMD(node, level = 1, parentPath = '') {
    const indent = '#'.repeat(Math.min(level + 1, 6)); // 最多6级标题
    const nodePath = parentPath ? `${parentPath} > ${node.topic}` : node.topic;
    
    let mdContent = '';
    
    // 节点标题
    mdContent += `${indent} ${node.topic}\n\n`;
    
    // 节点ID和路径信息
    mdContent += `**节点ID**: \`${node.id}\`  \n`;
    mdContent += `**节点路径**: ${nodePath}  \n`;
    
    // 节点内容（如果有）
    if (node.customData?.content && node.customData.content.trim()) {
        mdContent += `**节点内容**:  \n`;
        mdContent += `${node.customData.content}\n\n`;
    }
    
    // 标签信息
    const tags = node.customData?.tags;
    if (tags) {
        const allTags = [
            ...(tags.categories || []),
            ...(tags.technical || []),
            ...(tags.status || []),
            ...(tags.custom || []),
            ...(tags.future || [])
        ];
        
        if (allTags.length > 0) {
            mdContent += `**标签**: ${allTags.map(tag => `#${tag}`).join(' ')}  \n`;
        }
    }
    
    // 作者信息
    if (node.customData?.author) {
        mdContent += `**作者**: ${node.customData.author}  \n`;
    }
    
    // 展开状态
    mdContent += `**展开状态**: ${node.expanded ? '展开' : '折叠'}  \n`;
    
    // 方向信息（如果有）
    if (node.direction) {
        mdContent += `**方向**: ${node.direction}  \n`;
    }
    
    mdContent += '\n';
    
    // 递归处理子节点
    if (node.children && node.children.length > 0) {
        mdContent += `**子节点 (${node.children.length}个)**:\n\n`;
        
        for (const child of node.children) {
            mdContent += convertNodeToMD(child, level + 1, nodePath);
        }
    }
    
    return mdContent;
}

// 生成完整的MD文档
function generateMDDocument(projectData) {
    let mdContent = '';
    
    // 文档头部
    mdContent += `# NodeMind 脑图开发计划\n\n`;
    mdContent += `> 📝 **文档说明**: 本文档由脑图开发计划.json自动转换生成，符合NodeMind第三次重构的万能数据架构MD格式规范\n\n`;
    
    // 项目元信息
    const meta = projectData.mindmap?.meta;
    if (meta) {
        mdContent += `## 项目元信息\n\n`;
        mdContent += `**项目名称**: ${meta.name || '未命名'}  \n`;
        mdContent += `**作者**: ${meta.author || '未知'}  \n`;
        mdContent += `**版本**: ${meta.version || '1.0.0'}  \n`;
        mdContent += `**格式**: ${projectData.mindmap?.format || 'node_tree'}  \n`;
        mdContent += `**转换时间**: ${new Date().toISOString()}  \n\n`;
    }
    
    // 数据统计
    const nodeCount = countAllNodes(projectData.mindmap?.data);
    mdContent += `## 📊 数据统计\n\n`;
    mdContent += `**总节点数**: ${nodeCount}  \n`;
    mdContent += `**根节点ID**: \`${projectData.mindmap?.data?.id || '未知'}\`  \n`;
    mdContent += `**文档生成时间**: ${new Date().toLocaleString('zh-CN')}  \n\n`;
    
    // 节点内容
    mdContent += `## 🌳 节点结构\n\n`;
    
    // 转换根节点及其所有子节点
    if (projectData.mindmap?.data) {
        mdContent += convertNodeToMD(projectData.mindmap.data, 1);
    }
    
    // 文档尾部
    mdContent += `\n---\n\n`;
    mdContent += `## 💡 使用说明\n\n`;
    mdContent += `1. **导入方式**: 将此文档通过NodeMind的"导入文件"功能导入\n`;
    mdContent += `2. **四组件集成**: 导入后自动与四组件按照第三次重构要求关联\n`;
    mdContent += `3. **万能数据架构**: 支持智能标签解析和六要素推断\n`;
    mdContent += `4. **MD格式标准**: 符合NodeMind万能数据架构的MD格式规范\n\n`;
    
    mdContent += `## 🔄 第三次重构特性\n\n`;
    mdContent += `- ✅ **万物皆任务**: 所有节点都可视为不同类型的任务\n`;
    mdContent += `- ✅ **MD格式载体**: 使用MD格式作为统一数据载体\n`;
    mdContent += `- ✅ **智能标签系统**: 支持三层智能标签解析\n`;
    mdContent += `- ✅ **六要素推断**: 基于内容智能推断who/what/when/where/why/whom\n`;
    mdContent += `- ✅ **四组件联动**: 与四组件UI完全集成\n\n`;
    
    mdContent += `**生成于**: ${new Date().toLocaleString('zh-CN')}  \n`;
    mdContent += `**格式版本**: NodeMind第三次重构MD标准  \n`;
    mdContent += `**源文件**: 脑图开发计划.json\n`;
    
    return mdContent;
}

// 计算总节点数
function countAllNodes(node) {
    if (!node) return 0;
    
    let count = 1; // 当前节点
    
    if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
            count += countAllNodes(child);
        }
    }
    
    return count;
}

// 保存MD文档
function saveMDDocument(mdContent) {
    try {
        const outputPath = path.join(__dirname, 'nodemind_jsmind.md');
        fs.writeFileSync(outputPath, mdContent, 'utf8');
        console.log(`✅ MD文档已生成: ${outputPath}`);
        console.log(`📄 文档大小: ${Math.round(mdContent.length / 1024)}KB`);
        return outputPath;
    } catch (error) {
        console.error('❌ 保存MD文档失败:', error);
        return null;
    }
}

// 主函数
function main() {
    console.log('🚀 开始转换脑图开发计划.json为MD格式...');
    
    // 加载项目数据
    const projectData = loadProjectData();
    if (!projectData) {
        console.error('❌ 无法加载项目数据');
        return;
    }
    
    console.log('✅ 项目数据加载成功');
    
    // 生成MD文档
    const mdContent = generateMDDocument(projectData);
    console.log(`📝 MD文档生成完成，长度: ${mdContent.length} 字符`);
    
    // 保存文档
    const outputPath = saveMDDocument(mdContent);
    if (outputPath) {
        console.log('🎉 转换完成！');
        console.log(`📁 输出文件: ${outputPath}`);
        console.log('💡 现在可以使用NodeMind的"导入文件"功能导入此MD文档');
    }
}

// 运行转换
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
    main();
}

export {
    loadProjectData,
    convertNodeToMD,
    generateMDDocument,
    saveMDDocument,
    countAllNodes
}; 