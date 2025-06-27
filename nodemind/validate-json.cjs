const fs = require('fs');

function validateNodeMindJSON(filename) {
    try {
        console.log('正在验证文件:', filename);
        
        // 读取文件
        const content = fs.readFileSync(filename, 'utf8');
        console.log('文件大小:', Math.round(content.length / 1024), 'KB');
        
        // 解析JSON
        const data = JSON.parse(content);
        console.log('✅ JSON格式正确');
        
        // 检查NodeMind结构
        if (data.mindmap) {
            console.log('✅ 包含mindmap结构');
            
            if (data.mindmap.meta) {
                console.log('✅ 包含meta信息:', data.mindmap.meta.name || '未命名');
            }
            
            if (data.mindmap.data) {
                console.log('✅ 包含数据结构');
                console.log('   根节点ID:', data.mindmap.data.id);
                console.log('   根节点主题:', data.mindmap.data.topic);
                
                if (data.mindmap.data.children) {
                    console.log('   子节点数量:', data.mindmap.data.children.length);
                }
            }
        }
        
        if (data.documents) {
            console.log('✅ 包含文档数据');
            console.log('   文档数量:', Object.keys(data.documents).length);
        }
        
        if (data.exportInfo) {
            console.log('✅ 包含导出信息');
            console.log('   导出时间:', data.exportInfo.timestamp);
            console.log('   导出类型:', data.exportInfo.export_type);
        }
        
        console.log('\n🎉 文件验证通过！这是一个有效的NodeMind项目文件。');
        console.log('\n💡 建议的解决方案：');
        console.log('1. 检查导入功能的JSON解析器是否正确处理大文件');
        console.log('2. 确认导入功能是否支持完整的NodeMind格式');
        console.log('3. 可能需要检查文件编码（当前为UTF-8）');
        return true;
        
    } catch (error) {
        console.error('❌ 验证失败:', error.message);
        
        if (error instanceof SyntaxError) {
            console.error('   这是一个JSON语法错误');
            console.error('   错误位置附近的内容可能有问题');
        }
        
        return false;
    }
}

// 验证文件
const filename = 'NodeMind-项目管理-2025-06-25.json';
validateNodeMindJSON(filename); 