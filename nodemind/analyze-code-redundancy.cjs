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

// 5. 分析存储相关函数
console.log('\n📊 5. 存储系统分析');
const storageFunctions = Object.keys(functions).filter(name => 
    name.includes('save') || 
    name.includes('load') || 
    name.includes('Save') || 
    name.includes('Load') ||
    name.includes('storage') ||
    name.includes('Storage')
);
console.log(`存储相关函数: ${storageFunctions.length}`);
storageFunctions.slice(0, 10).forEach(name => {
    console.log(`  - ${name}`);
});

// 6. 分析可能废弃的代码块
console.log('\n📊 6. 可能废弃的代码');
const suspiciousPatterns = [
    { name: '调试console.log', pattern: /console\.log\(/g },
    { name: '旧的injection相关', pattern: /injection/gi },
    { name: 'v1相关引用', pattern: /v1/gi },
    { name: 'TODO注释', pattern: /\/\/\s*TODO/gi },
    { name: 'FIXME注释', pattern: /\/\/\s*FIXME/gi }
];

suspiciousPatterns.forEach(({ name, pattern }) => {
    const matches = content.match(pattern);
    if (matches) {
        console.log(`  - ${name}: ${matches.length}次出现`);
    }
});

// 7. 检查可能未使用的函数（简化版）
console.log('\n📊 7. 可能未使用函数分析（样本）');
const functionNames = Object.keys(functions);
const sampleFunctions = functionNames.slice(0, 20);
const potentiallyUnused = [];

sampleFunctions.forEach(funcName => {
    const callPattern = new RegExp(`${funcName}\\s*\\(`, 'g');
    const calls = content.match(callPattern);
    const definitions = functions[funcName].length;
    
    if (!calls || calls.length <= definitions) {
        potentiallyUnused.push(funcName);
    }
});

console.log(`样本中可能未使用: ${potentiallyUnused.length}/${sampleFunctions.length}`);
potentiallyUnused.forEach(name => {
    console.log(`  - ${name}`);
});

// 8. 代码规模统计
console.log('\n📊 8. 代码规模统计');
const lines = content.split('\n');
const codeLines = lines.filter(line => line.trim() && !line.trim().startsWith('//'));
const commentLines = lines.filter(line => line.trim().startsWith('//'));
const emptyLines = lines.filter(line => !line.trim());

console.log(`总行数: ${lines.length}`);
console.log(`代码行数: ${codeLines.length}`);
console.log(`注释行数: ${commentLines.length}`);
console.log(`空行数: ${emptyLines.length}`);
console.log(`代码密度: ${(codeLines.length / lines.length * 100).toFixed(1)}%`);

// 9. 重点问题识别
console.log('\n🚨 重点发现的问题');

// 检查submitContent重复
const submitContentCount = functions['submitContent'] ? functions['submitContent'].length : 0;
if (submitContentCount > 1) {
    console.log(`❌ submitContent函数重复定义 ${submitContentCount} 次`);
}

// 检查四组件函数是否过多
if (fourComponentFunctions.length > 10) {
    console.log(`⚠️  四组件函数过多: ${fourComponentFunctions.length} 个`);
}

// 检查旧逻辑函数
if (foundOldFunctions.length > 5) {
    console.log(`⚠️  存在较多旧逻辑函数: ${foundOldFunctions.length} 个`);
}

console.log('\n🎯 清理建议优先级');
console.log('🔥 高优先级 (立即处理):');
if (duplicateFunctions.length > 0) {
    console.log(`   1. 清理重复函数定义 (${duplicateFunctions.length}个)`);
}
if (duplicateWindowVars.length > 0) {
    console.log(`   2. 清理重复的全局变量赋值 (${duplicateWindowVars.length}个)`);
}

console.log('⚡ 中优先级 (评估后处理):');
console.log(`   1. 评估旧逻辑函数必要性 (${foundOldFunctions.length}个)`);
console.log(`   2. 简化四组件函数结构 (${fourComponentFunctions.length}个)`);

console.log('📋 低优先级 (有时间再处理):');
console.log('   1. 清理调试代码和注释');
console.log('   2. 移除确认无用的函数');

console.log('\n✅ 分析完成！建议先处理高优先级问题。'); 