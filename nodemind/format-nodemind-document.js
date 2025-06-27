/**
 * NodeMind文档格式标准化脚本
 * 将现有的MD文档格式转换为解析器期望的标准格式
 */

const fs = require('fs');
const path = require('path');

// 状态映射表
const statusMapping = {
    '展开': 'active',
    '折叠': 'collapsed',
    '完成': 'done',
    '进行中': 'in-progress',
    '待处理': 'pending',
    '已完成': 'done'
};

// 优先级推断规则
const priorityRules = {
    high: ['紧急', '重要', '必须', '立刻', '马上', '核心', '关键', '中心', '重构', '修复'],
    medium: ['需要', '应该', '考虑', '建议', '优化', '改进', '增加', '实现'],
    low: ['可以', '或许', '将来', '未来', '备用', '临时', '测试', '笔记']
};

function inferPriority(title, content = '') {
    const text = (title + ' ' + content).toLowerCase();
    
    for (const [priority, keywords] of Object.entries(priorityRules)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            return priority;
        }
    }
    
    return 'medium'; // 默认优先级
}

function generateTimestamp(baseTime, offset = 0) {
    const date = new Date(baseTime.getTime() + offset);
    return date.toISOString();
}

function formatDocument(inputFile, outputFile) {
    console.log(`📖 读取文档: ${inputFile}`);
    
    let content = fs.readFileSync(inputFile, 'utf8');
    const lines = content.split('\n');
    const processedLines = [];
    
    let nodeCount = 0;
    let baseTime = new Date('2025-06-15T14:00:00.000Z');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 检测节点标题
        const titleMatch = line.match(/^(#{2,6})\s+(.+)$/);
        if (titleMatch) {
            nodeCount++;
            const title = titleMatch[2].trim();
            const priority = inferPriority(title);
            
            processedLines.push(line); // 保持标题不变
            
            // 查找后续的节点信息行
            let j = i + 1;
            let hasBlankLine = false;
            
            while (j < lines.length) {
                const nextLine = lines[j];
                
                // 遇到空行
                if (!nextLine.trim()) {
                    if (!hasBlankLine) {
                        hasBlankLine = true;
                        j++;
                        continue;
                    } else {
                        break; // 连续两个空行，结束节点信息区域
                    }
                }
                
                // 遇到下一个标题
                if (nextLine.match(/^#{2,6}\s+/)) {
                    break;
                }
                
                // 处理节点信息行
                if (nextLine.includes('**')) {
                    // 转换展开状态为状态
                    if (nextLine.includes('**展开状态**:')) {
                        const statusMatch = nextLine.match(/\*\*展开状态\*\*:\s*(.+)/);
                        if (statusMatch) {
                            const originalStatus = statusMatch[1].trim();
                            const mappedStatus = statusMapping[originalStatus] || 'pending';
                            const newLine = nextLine.replace('**展开状态**:', '**状态**:').replace(originalStatus, mappedStatus);
                            processedLines.push(newLine);
                            
                            // 添加时间戳和优先级
                            const createdTime = generateTimestamp(baseTime, nodeCount * 300000); // 每个节点间隔5分钟
                            const modifiedTime = generateTimestamp(new Date(), nodeCount * 1000); // 修改时间稍有差异
                            
                            processedLines.push(`**创建时间**: ${createdTime}  `);
                            processedLines.push(`**修改时间**: ${modifiedTime}  `);
                            processedLines.push(`**优先级**: ${priority}  `);
                        }
                    } else {
                        processedLines.push(nextLine);
                    }
                } else {
                    processedLines.push(nextLine);
                }
                
                j++;
            }
            
            i = j - 1; // 调整主循环的索引
        } else {
            processedLines.push(line);
        }
    }
    
    const formattedContent = processedLines.join('\n');
    
    console.log(`💾 保存格式化文档: ${outputFile}`);
    fs.writeFileSync(outputFile, formattedContent, 'utf8');
    
    console.log(`✅ 格式化完成!`);
    console.log(`📊 处理统计:`);
    console.log(`   - 处理节点数: ${nodeCount}`);
    console.log(`   - 输入文件: ${inputFile}`);
    console.log(`   - 输出文件: ${outputFile}`);
    
    return {
        nodeCount,
        inputFile,
        outputFile
    };
}

// 主函数
function main() {
    const inputFile = 'nodemind_jsmind.md';
    const outputFile = 'nodemind_jsmind_formatted.md';
    
    try {
        if (!fs.existsSync(inputFile)) {
            console.error(`❌ 输入文件不存在: ${inputFile}`);
            process.exit(1);
        }
        
        const result = formatDocument(inputFile, outputFile);
        
        console.log('\n🎉 文档格式化成功!');
        console.log(`\n📝 使用方法:`);
        console.log(`1. 检查生成的文件: ${result.outputFile}`);
        console.log(`2. 确认格式正确后，可以替换原文件`);
        console.log(`3. 使用 test-import-fix.html 测试导入功能`);
        
    } catch (error) {
        console.error('❌ 格式化过程中出现错误:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = { formatDocument, statusMapping, priorityRules }; 