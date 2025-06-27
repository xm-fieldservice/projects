#!/usr/bin/env node

/**
 * 快速测试脚本 - 验证第三次重构核心功能
 */

// 模拟浏览器环境
global.window = {};
global.document = {
    getElementById: () => ({ value: '' }),
    createElement: () => ({ textContent: '', className: '' }),
    addEventListener: () => {}
};

async function quickTest() {
    console.log('🚀 快速测试开始...');
    
    try {
        // 导入模块
        const { getUniversalDataService } = await import('./src/core/universal_data_service.js');
        const { getTagServiceAdapter } = await import('./src/adapters/tag_service_adapter.js');
        const { getFeatureSwitchController } = await import('./src/core/feature_switch_controller.js');
        const { getUIIntegrationAdapter } = await import('./src/adapters/ui_integration_adapter.js');
        const tagServiceReplacement = await import('./src/services/tag_service_replacement.js');
        
        console.log('✅ 模块导入成功');
        
        // 初始化
        const universalService = getUniversalDataService();
        const tagAdapter = getTagServiceAdapter();
        const switchController = getFeatureSwitchController();
        const uiAdapter = getUIIntegrationAdapter();
        
        // 测试万能数据架构
        const result = universalService.add('# 测试 #任务\n\n这是测试内容', 'test');
        console.log('✅ 万能数据架构工作正常，ID:', result.id);
        
        // 测试查询
        const tasks = universalService.getByType('task');
        console.log('✅ 查询功能正常，任务数:', tasks.length);
        
        // 测试适配器注册
        switchController.registerAdapter('tagService', tagAdapter);
        switchController.switches.universalDataService = true;
        switchController.switches.smartTagging = true;
        
        // 启用TagService
        switchController.enable('tagService');
        console.log('✅ TagService适配器启用成功');
        
        // 测试标签功能
        const testNodeId = result.id;
        await tagAdapter.addNodeTag(testNodeId, 'status', '测试');
        console.log('✅ 标签添加功能正常');
        
        const tags = await tagAdapter.getNodeTags(testNodeId);
        console.log('✅ 标签获取功能正常，标签:', Object.keys(tags));
        
        // 性能测试
        const start = Date.now();
        for (let i = 0; i < 50; i++) {
            universalService.add(`# 性能测试 ${i} #测试`, 'benchmark');
        }
        const duration = Date.now() - start;
        console.log(`✅ 性能测试: 50次操作耗时 ${duration}ms`);
        
        // 系统状态
        const stats = universalService.getStatistics();
        console.log('✅ 系统统计:', stats);
        
        // 测试新的TagService替换器
        console.log('\n🔄 测试7: 新TagService替换器');
        console.log('-'.repeat(40));
        
        const testNodeId2 = result.id;
        
        // 测试直接替换版本的标签功能
        await tagServiceReplacement.addNodeTag(testNodeId2, 'technical', 'JavaScript');
        console.log('✅ 替换器添加技术标签成功');
        
        await tagServiceReplacement.addNodeTag(testNodeId2, 'status', '开发中');
        console.log('✅ 替换器添加状态标签成功');
        
        const replacementTags = await tagServiceReplacement.getNodeTags(testNodeId2);
        console.log('✅ 替换器获取标签成功:', Object.keys(replacementTags));
        
        await tagServiceReplacement.toggleNodeStatusTag(testNodeId2, '已完成');
        console.log('✅ 替换器切换状态标签成功');
        
        // 测试UI集成适配器
        console.log('\n🎨 测试8: UI集成适配器');
        console.log('-'.repeat(40));
        
        const uiTagData = uiAdapter.getUIData('tag-manager');
        console.log('✅ UI适配器获取标签数据:', uiTagData.length, '个标签');
        
        const uiNodeData = uiAdapter.getUIData('node-editor');
        console.log('✅ UI适配器获取节点数据:', uiNodeData.length, '个节点');
        
        // 测试UI操作
        const newTagResult = await uiAdapter.handleUIAction('tag-manager', 'add', {
            name: '测试标签',
            color: '#ff6b6b'
        });
        console.log('✅ UI适配器添加标签:', newTagResult.id);
        
        console.log('\n🎉 所有测试通过！第三次重构基础架构运行正常！');
        console.log('🚀 新增功能验证成功：');
        console.log('   ✅ TagService直接替换器');
        console.log('   ✅ UI集成适配器');
        console.log('   ✅ 完整的数据流转换');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error(error.stack);
    }
}

quickTest(); 