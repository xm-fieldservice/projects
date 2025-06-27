const fs = require('fs');
const path = require('path');

// 读取主文件
const indexPath = path.join(__dirname, 'index.html');
const content = fs.readFileSync(indexPath, 'utf8');

console.log('🔍 NodeMind代码冗余分析报告');
console.log('='.repeat(50));

// 1. 分析函数定义
console.log('\n📊 1. 函数定义分析');
const functionPattern = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
const functions = {};
let match;

while ((match = functionPattern.exec(content)) !== null) {
    const funcName = match[1];
    if (!functions[funcName]) {
        functions[funcName] = [];
    }
    functions[funcName].push(match.index);
}

const duplicateFunctions = Object.entries(functions).filter(([name, positions]) => positions.length > 1);
console.log(`总函数数: ${Object.keys(functions).length}`);
console.log(`重复函数数: ${duplicateFunctions.length}`);

if (duplicateFunctions.length > 0) {
    console.log('\n⚠️  重复函数:');
    duplicateFunctions.forEach(([name, positions]) => {
        console.log(`  - ${name}: ${positions.length}次定义`);
    });
}

// 2. 分析四组件相关函数
console.log('\n📊 2. 四组件函数分析');
const fourComponentFunctions = Object.keys(functions).filter(name => 
    name.includes('fourComponent') || 
    name.includes('FourComponent') ||
    name.includes('four_component')
);
console.log(`四组件函数数: ${fourComponentFunctions.length}`);
fourComponentFunctions.forEach(name => {
    console.log(`  - ${name}`);
});

// 3. 分析旧逻辑函数（第三次重构前）
console.log('\n📊 3. 可能的旧逻辑函数');
const oldLogicFunctions = [
    'updateNodeTitle',
    'updateNodeContent', 
    'saveNodeDetails',
    'submitContent',
    'parseContentToSessions',
    'toggleQAMode',
    'copyContentFromEditor',
    'pasteContentToEditor',
    'updateNodeAuthor',
    'updateNodeContentIcon'
];

const foundOldFunctions = oldLogicFunctions.filter(name => functions[name]);
console.log(`发现旧逻辑函数: ${foundOldFunctions.length}/${oldLogicFunctions.length}`);
foundOldFunctions.forEach(name => {
    console.log(`  - ${name}: ${functions[name].length}次定义`);
});

// 4. 分析全局变量和window对象暴露
console.log('\n📊 4. 全局变量暴露分析');
const windowPattern = /window\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
const windowVars = {};

while ((match = windowPattern.exec(content)) !== null) {
    const varName = match[1];
    if (!windowVars[varName]) {
        windowVars[varName] = [];
    }
    windowVars[varName].push(match.index);
}

const duplicateWindowVars = Object.entries(windowVars).filter(([name, positions]) => positions.length > 1);
console.log(`window对象赋值: ${Object.keys(windowVars).length}`);
console.log(`重复赋值: ${duplicateWindowVars.length}`);

if (duplicateWindowVars.length > 0) {
    console.log('\n⚠️  重复的window赋值:');
    duplicateWindowVars.forEach(([name, positions]) => {
        console.log(`  - window.${name}: ${positions.length}次赋值`);
    });
}

// 5. 分析模板相关代码
console.log('\n📊 5. 模板系统分析');
const templateFunctions = Object.keys(functions).filter(name => 
    name.includes('template') || 
    name.includes('Template')
);
console.log(`模板相关函数: ${templateFunctions.length}`);

// 6. 分析存储相关函数
console.log('\n📊 6. 存储系统分析');
const storageFunctions = Object.keys(functions).filter(name => 
    name.includes('save') || 
    name.includes('load') || 
    name.includes('Save') || 
    name.includes('Load') ||
    name.includes('storage') ||
    name.includes('Storage')
);
console.log(`存储相关函数: ${storageFunctions.length}`);
storageFunctions.forEach(name => {
    console.log(`  - ${name}`);
});

// 7. 分析事件处理函数
console.log('\n📊 7. 事件处理分析');
const eventPattern = /addEventListener\s*\(\s*['"]([^'"]+)['"]\s*,\s*function/g;
const events = {};

while ((match = eventPattern.exec(content)) !== null) {
    const eventType = match[1];
    if (!events[eventType]) {
        events[eventType] = 0;
    }
    events[eventType]++;
}

console.log('事件监听器统计:');
Object.entries(events).forEach(([event, count]) => {
    console.log(`  - ${event}: ${count}次`);
});

// 8. 分析可能废弃的代码块
console.log('\n📊 8. 可能废弃的代码');
const suspiciousPatterns = [
    { name: '注释的代码块', pattern: /\/\*[\s\S]*?\*\//g },
    { name: '// TODO 注释', pattern: /\/\/\s*TODO/gi },
    { name: '// FIXME 注释', pattern: /\/\/\s*FIXME/gi },
    { name: '调试console.log', pattern: /console\.log\(/g },
    { name: '旧的injection相关', pattern: /injection/gi },
    { name: 'v1相关引用', pattern: /v1/gi }
];

suspiciousPatterns.forEach(({ name, pattern }) => {
    const matches = content.match(pattern);
    if (matches) {
        console.log(`  - ${name}: ${matches.length}次出现`);
    }
});

// 9. 检查未使用的函数
console.log('\n📊 9. 可能未使用的函数分析');
const functionNames = Object.keys(functions);
const unusedFunctions = [];

functionNames.forEach(funcName => {
    // 检查函数是否在其他地方被调用
    const callPattern = new RegExp(`${funcName}\\s*\\(`, 'g');
    const calls = content.match(callPattern);
    const definitions = functions[funcName].length;
    
    // 如果调用次数等于定义次数，可能未被使用（除了定义处）
    if (!calls || calls.length <= definitions) {
        unusedFunctions.push(funcName);
    }
});

console.log(`可能未使用的函数: ${unusedFunctions.length}`);
if (unusedFunctions.length > 0) {
    console.log('前20个可能未使用的函数:');
    unusedFunctions.slice(0, 20).forEach(name => {
        console.log(`  - ${name}`);
    });
}

// 10. 代码行数统计
console.log('\n📊 10. 代码规模统计');
const lines = content.split('\n');
const codeLines = lines.filter(line => line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('/*'));
const commentLines = lines.filter(line => line.trim().startsWith('//') || line.trim().startsWith('/*'));
const emptyLines = lines.filter(line => !line.trim());

console.log(`总行数: ${lines.length}`);
console.log(`代码行数: ${codeLines.length}`);
console.log(`注释行数: ${commentLines.length}`);
console.log(`空行数: ${emptyLines.length}`);
console.log(`代码密度: ${(codeLines.length / lines.length * 100).toFixed(1)}%`);

// 11. 建议清理的优先级
console.log('\n🎯 清理建议 (按优先级)');
console.log('1. 高优先级 - 功能重复:');
if (duplicateFunctions.length > 0) {
    console.log(`   - 清理 ${duplicateFunctions.length} 个重复函数定义`);
}
if (duplicateWindowVars.length > 0) {
    console.log(`   - 清理 ${duplicateWindowVars.length} 个重复的全局变量赋值`);
}

console.log('2. 中优先级 - 旧逻辑:');
console.log(`   - 评估 ${foundOldFunctions.length} 个旧逻辑函数是否需要保留`);
console.log(`   - 检查 ${fourComponentFunctions.length} 个四组件函数的必要性`);

console.log('3. 低优先级 - 代码优化:');
console.log(`   - 清理调试代码和注释`);
console.log(`   - 移除未使用的函数 (${unusedFunctions.length}个候选)`);

console.log('\n✅ 分析完成！'); 