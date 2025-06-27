/**
 * NodeMind 模板列表显示修复脚本
 * 解决模板选择功能中容器缺失的问题
 */

(function() {
    console.log('🔧 开始修复模板列表显示问题...');

    // 1. 检查当前状态
    function checkCurrentState() {
        console.log('=== 当前状态检查 ===');
        console.log('选中节点ID:', typeof selectedNodeId !== 'undefined' ? selectedNodeId : '未定义');
        console.log('节点数据库:', typeof nodeDatabase !== 'undefined' ? `${Object.keys(nodeDatabase).length}个节点` : '未定义');
        console.log('模板容器数量:', document.querySelectorAll('.selected-templates-list').length);
        console.log('详细面板存在:', document.querySelector('.details-panel') ? '是' : '否');
    }

    // 2. 确保有选中的节点
    function ensureNodeSelected() {
        console.log('=== 确保节点选中 ===');
        
        if (typeof selectedNodeId === 'undefined' || !selectedNodeId) {
            console.log('没有选中节点，尝试选择第一个可用节点...');
            
            if (typeof nodeDatabase !== 'undefined' && nodeDatabase) {
                const nodeIds = Object.keys(nodeDatabase);
                if (nodeIds.length > 0) {
                    const firstNodeId = nodeIds[0];
                    console.log('选择节点:', firstNodeId);
                    
                    // 尝试显示节点详情
                    if (typeof showNodeDetails === 'function') {
                        showNodeDetails(firstNodeId, nodeDatabase[firstNodeId]);
                        console.log('✅ 已显示节点详情');
                    } else {
                        console.log('⚠️ showNodeDetails函数不存在，尝试其他方法...');
                        // 设置全局选中节点ID
                        if (typeof window !== 'undefined') {
                            window.selectedNodeId = firstNodeId;
                        }
                    }
                } else {
                    console.log('❌ 没有可用的节点');
                    return false;
                }
            } else {
                console.log('❌ 节点数据库不存在');
                return false;
            }
        } else {
            console.log('✅ 已有选中节点:', selectedNodeId);
        }
        return true;
    }

    // 3. 确保模板容器存在
    function ensureTemplateContainer() {
        console.log('=== 确保模板容器存在 ===');
        
        let containers = document.querySelectorAll('.selected-templates-list');
        console.log('现有容器数量:', containers.length);
        
        if (containers.length === 0) {
            console.log('创建模板容器...');
            
            // 查找合适的父容器
            let parentContainer = document.querySelector('.details-panel');
            if (!parentContainer) {
                parentContainer = document.querySelector('.detail-side-panel');
            }
            if (!parentContainer) {
                parentContainer = document.querySelector('#tab-detail');
            }
            if (!parentContainer) {
                console.log('在body中创建临时容器...');
                parentContainer = document.body;
            }

            // 创建模板容器
            const templateContainer = document.createElement('div');
            templateContainer.className = 'selected-templates-list';
            templateContainer.id = 'fix-template-container';
            templateContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                width: 300px;
                max-height: 400px;
                background: white;
                border: 2px solid #007bff;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 9999;
                overflow-y: auto;
            `;
            
            templateContainer.innerHTML = `
                <div style="border-bottom: 1px solid #dee2e6; padding-bottom: 10px; margin-bottom: 15px;">
                    <h4 style="margin: 0; color: #007bff;">🔧 模板测试容器</h4>
                    <small style="color: #6c757d;">临时创建用于测试模板功能</small>
                </div>
                <div class="empty-template-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-text">暂无选中模板</div>
                    <div class="empty-hint">在模板管理器中双击选择模板后将在此显示</div>
                </div>
            `;

            parentContainer.appendChild(templateContainer);
            console.log('✅ 已创建模板容器');
            
            // 添加关闭按钮
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '❌';
            closeBtn.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: none;
                border: none;
                font-size: 16px;
                cursor: pointer;
                color: #6c757d;
            `;
            closeBtn.onclick = () => {
                templateContainer.remove();
                console.log('🗑️ 已移除临时模板容器');
            };
            templateContainer.appendChild(closeBtn);
            
        } else {
            console.log('✅ 模板容器已存在');
        }
        
        return document.querySelectorAll('.selected-templates-list').length > 0;
    }

    // 4. 测试模板功能
    function testTemplateFunction() {
        console.log('=== 测试模板功能 ===');
        
        // 清空现有选择
        if (typeof selectedTemplates !== 'undefined' && Array.isArray(selectedTemplates)) {
            selectedTemplates.length = 0;
            console.log('已清空现有选择');
        }

        // 选择测试模板
        if (typeof toggleTemplateSelection === 'function') {
            console.log('选择测试模板...');
            toggleTemplateSelection('自然模式');
            toggleTemplateSelection('代码自查');
            
            console.log('当前选中模板:', selectedTemplates.map(t => t.name));
        } else {
            console.log('❌ toggleTemplateSelection函数不存在');
            return false;
        }

        // 更新显示
        if (typeof updateSelectedTemplatesList === 'function') {
            console.log('更新模板列表显示...');
            updateSelectedTemplatesList();
            console.log('✅ 已更新模板列表显示');
        } else {
            console.log('❌ updateSelectedTemplatesList函数不存在');
            return false;
        }

        return true;
    }

    // 5. 验证结果
    function verifyResults() {
        console.log('=== 验证修复结果 ===');
        
        const containers = document.querySelectorAll('.selected-templates-list');
        console.log('模板容器数量:', containers.length);
        
        containers.forEach((container, index) => {
            console.log(`容器 ${index}:`);
            console.log('  - 位置:', container.offsetTop, container.offsetLeft);
            console.log('  - 可见:', container.offsetHeight > 0 && container.offsetWidth > 0);
            console.log('  - 内容:', container.children.length > 0 ? '有内容' : '空');
            
            if (container.children.length > 0) {
                console.log('  - 第一个子元素:', container.children[0].className);
            }
        });
        
        if (typeof selectedTemplates !== 'undefined') {
            console.log('选中模板数量:', selectedTemplates.length);
            selectedTemplates.forEach((template, index) => {
                console.log(`  ${index + 1}. ${template.name}`);
            });
        }
    }

    // 主修复流程
    function runFix() {
        console.log('🚀 开始执行修复流程...');
        
        // 1. 检查当前状态
        checkCurrentState();
        
        // 2. 确保有选中节点
        if (!ensureNodeSelected()) {
            console.log('❌ 无法确保节点选中，修复失败');
            return false;
        }
        
        // 等待一下让界面更新
        setTimeout(() => {
            // 3. 确保模板容器存在
            if (!ensureTemplateContainer()) {
                console.log('❌ 无法创建模板容器，修复失败');
                return false;
            }
            
            // 4. 测试模板功能
            if (!testTemplateFunction()) {
                console.log('❌ 模板功能测试失败');
                return false;
            }
            
            // 5. 验证结果
            setTimeout(() => {
                verifyResults();
                console.log('🎉 修复流程完成！请检查页面上的模板列表显示');
            }, 100);
            
        }, 200);
        
        return true;
    }

    // 导出到全局
    window.fixTemplateDisplay = runFix;
    
    // 自动执行修复
    runFix();
    
})();

console.log('💡 修复脚本已加载，如需重新执行，请运行: fixTemplateDisplay()'); 