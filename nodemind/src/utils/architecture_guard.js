/**
 * 架构守护工具 - 检测和修复架构违规
 * 用于确保代码始终遵循模块化规范
 */

class ArchitectureGuard {
    constructor() {
        this.violations = [];
        this.moduleMapping = {
            // 函数名模式 -> 目标模块的映射
            mindmap: 'src/services/mindmap_service.js',
            node: 'src/services/node_service.js', 
            tag: 'src/services/tag_service.js',
            template: 'src/services/template_service.js',
            session: 'src/services/session_service.js',
            ui: 'src/controllers/ui_controller.js',
            storage: 'src/services/storage_service.js',
            project: 'src/services/project_service.js'
        };
        
        // 启动实时监控
        this.startRealTimeMonitoring();
    }
    
    /**
     * 检测HTML中的内联JavaScript代码
     */
    detectInlineJavaScript() {
        const violations = [];
        const scripts = document.querySelectorAll('script:not([src])');
        
        scripts.forEach((script, index) => {
            const content = script.textContent.trim();
            
            // 跳过允许的内联脚本
            if (this.isAllowedInlineScript(content)) {
                return;
            }
            
            // 检测是否包含业务逻辑
            if (this.containsBusinessLogic(content)) {
                violations.push({
                    type: 'INLINE_JAVASCRIPT',
                    element: script,
                    content: content,
                    severity: 'HIGH',
                    message: `内联脚本 #${index} 包含业务逻辑，应移动到模块中`,
                    suggestedModule: this.suggestTargetModule(content)
                });
            }
        });
        
        return violations;
    }
    
    /**
     * 检测全局函数定义
     */
    detectGlobalFunctions() {
        const violations = [];
        const globalFunctions = [];
        
        // 检查window对象上的自定义函数
        for (let prop in window) {
            if (typeof window[prop] === 'function' && 
                !this.isNativeFunction(prop) &&
                !this.isAllowedGlobalFunction(prop)) {
                globalFunctions.push(prop);
            }
        }
        
        globalFunctions.forEach(funcName => {
            violations.push({
                type: 'GLOBAL_FUNCTION',
                name: funcName,
                severity: 'MEDIUM',
                message: `全局函数 ${funcName} 应封装到模块中`,
                suggestedModule: this.suggestModuleForFunction(funcName)
            });
        });
        
        return violations;
    }
    
    /**
     * 自动修复架构违规
     */
    async autoFix(violations) {
        const results = [];
        
        for (const violation of violations) {
            try {
                let result;
                
                switch (violation.type) {
                    case 'INLINE_JAVASCRIPT':
                        result = await this.fixInlineJavaScript(violation);
                        break;
                    case 'GLOBAL_FUNCTION':
                        result = await this.fixGlobalFunction(violation);
                        break;
                    default:
                        result = { success: false, message: '未知的违规类型' };
                }
                
                results.push({
                    violation,
                    result
                });
                
            } catch (error) {
                results.push({
                    violation,
                    result: { success: false, error: error.message }
                });
            }
        }
        
        return results;
    }
    
    /**
     * 修复内联JavaScript
     */
    async fixInlineJavaScript(violation) {
        const { content, suggestedModule } = violation;
        
        // 1. 分析代码结构
        const analysis = this.analyzeCode(content);
        
        // 2. 生成模块化代码
        const moduleCode = this.generateModuleCode(analysis);
        
        // 3. 写入目标模块
        const writeResult = await this.writeToModule(suggestedModule, moduleCode);
        
        // 4. 更新HTML，移除内联代码
        if (writeResult.success) {
            violation.element.remove();
            
            // 5. 添加模块引用
            this.addModuleReference(suggestedModule);
            
            return {
                success: true,
                message: `已将内联代码迁移到 ${suggestedModule}`,
                moduleCode
            };
        }
        
        return { success: false, message: '写入模块失败' };
    }
    
    /**
     * 分析代码结构
     */
    analyzeCode(code) {
        const analysis = {
            functions: [],
            variables: [],
            eventListeners: [],
            dependencies: []
        };
        
        // 提取函数定义
        const functionPattern = /function\s+(\w+)\s*\([^)]*\)\s*{/g;
        let match;
        while ((match = functionPattern.exec(code)) !== null) {
            analysis.functions.push({
                name: match[1],
                fullCode: this.extractFunctionCode(code, match.index)
            });
        }
        
        // 提取变量定义
        const varPattern = /(var|let|const)\s+(\w+)/g;
        while ((match = varPattern.exec(code)) !== null) {
            analysis.variables.push({
                type: match[1],
                name: match[2]
            });
        }
        
        // 提取事件监听器
        const eventPattern = /\.addEventListener\s*\(\s*['"`]([^'"`]+)['"`]/g;
        while ((match = eventPattern.exec(code)) !== null) {
            analysis.eventListeners.push(match[1]);
        }
        
        return analysis;
    }
    
    /**
     * 生成模块化代码
     */
    generateModuleCode(analysis) {
        let moduleCode = `
// 自动生成的模块化代码 - ${new Date().toISOString()}
// 原始内联代码已迁移到此模块

import { EventBus } from '../event_bus.js';
import { showMessage } from './utils.js';

`;
        
        // 生成函数代码
        analysis.functions.forEach(func => {
            moduleCode += `
/**
 * ${func.name} - 从内联代码迁移
 */
${func.fullCode}

`;
        });
        
        // 生成导出
        if (analysis.functions.length > 0) {
            moduleCode += `
// 导出函数
export {
${analysis.functions.map(f => `    ${f.name}`).join(',\n')}
};

`;
        }
        
        return moduleCode;
    }
    
    /**
     * 实时监控架构违规
     */
    startRealTimeMonitoring() {
        // 监控DOM变化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.tagName === 'SCRIPT' && !node.src) {
                            this.checkNewInlineScript(node);
                        }
                    });
                }
            });
        });
        
        observer.observe(document, {
            childList: true,
            subtree: true
        });
        
        // 定期检查全局函数
        setInterval(() => {
            this.checkGlobalFunctions();
        }, 5000);
    }
    
    /**
     * 检查新添加的内联脚本
     */
    checkNewInlineScript(scriptElement) {
        const content = scriptElement.textContent.trim();
        
        if (this.containsBusinessLogic(content)) {
            console.warn('🚨 架构违规检测: 发现新的内联JavaScript代码');
            console.warn('建议将以下代码移动到模块中:');
            console.warn(content);
            
            // 显示警告消息
            if (typeof showMessage === 'function') {
                showMessage('⚠️ 检测到内联代码，建议移动到模块中', 'warning');
            }
        }
    }
    
    /**
     * 辅助方法：判断是否为允许的内联脚本
     */
    isAllowedInlineScript(content) {
        const allowedPatterns = [
            /jsMind/,           // jsMind库相关
            /allowInline/,      // 明确标记为允许的
            /^\/\*\s*config\s*\*\//,  // 配置脚本
        ];
        
        return allowedPatterns.some(pattern => pattern.test(content)) ||
               content.length < 50; // 短小的配置代码
    }
    
    /**
     * 辅助方法：判断是否包含业务逻辑
     */
    containsBusinessLogic(content) {
        const businessLogicPatterns = [
            /function\s+\w+/,           // 函数定义
            /\.addEventListener/,       // 事件监听
            /nodeDatabase/,            // 数据操作
            /mindmaps\[/,              // 思维导图操作
            /updateNode/,              // 节点更新
            /showMessage/,             // UI交互
        ];
        
        return businessLogicPatterns.some(pattern => pattern.test(content));
    }
    
    /**
     * 建议目标模块
     */
    suggestTargetModule(content) {
        for (const [keyword, module] of Object.entries(this.moduleMapping)) {
            if (content.toLowerCase().includes(keyword)) {
                return module;
            }
        }
        
        return 'src/utils/utils.js'; // 默认模块
    }
    
    /**
     * 为函数建议模块
     */
    suggestModuleForFunction(funcName) {
        const name = funcName.toLowerCase();
        
        for (const [keyword, module] of Object.entries(this.moduleMapping)) {
            if (name.includes(keyword)) {
                return module;
            }
        }
        
        return 'src/utils/utils.js';
    }
    
    /**
     * 生成架构违规报告
     */
    generateViolationReport() {
        const inlineViolations = this.detectInlineJavaScript();
        const globalViolations = this.detectGlobalFunctions();
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalViolations: inlineViolations.length + globalViolations.length,
                inlineJavaScript: inlineViolations.length,
                globalFunctions: globalViolations.length
            },
            violations: {
                inlineJavaScript: inlineViolations,
                globalFunctions: globalViolations
            },
            recommendations: this.generateRecommendations(inlineViolations, globalViolations)
        };
        
        return report;
    }
    
    /**
     * 生成修复建议
     */
    generateRecommendations(inlineViolations, globalViolations) {
        const recommendations = [];
        
        if (inlineViolations.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                action: '立即迁移内联JavaScript代码',
                description: `发现 ${inlineViolations.length} 处内联代码违规，建议立即迁移到对应模块`,
                autoFixAvailable: true
            });
        }
        
        if (globalViolations.length > 0) {
            recommendations.push({
                priority: 'MEDIUM', 
                action: '封装全局函数到模块',
                description: `发现 ${globalViolations.length} 个全局函数，建议封装到对应模块中`,
                autoFixAvailable: true
            });
        }
        
        if (inlineViolations.length === 0 && globalViolations.length === 0) {
            recommendations.push({
                priority: 'INFO',
                action: '架构状态良好',
                description: '当前代码符合模块化规范',
                autoFixAvailable: false
            });
        }
        
        return recommendations;
    }
}

// 导出架构守护工具
export { ArchitectureGuard };

// 全局实例（用于开发时监控）
if (typeof window !== 'undefined') {
    window.architectureGuard = new ArchitectureGuard();
    
    // 开发者工具支持
    window.checkArchitecture = () => {
        const report = window.architectureGuard.generateViolationReport();
        console.table(report.summary);
        if (report.summary.totalViolations > 0) {
            console.group('🚨 架构违规详情');
            report.violations.inlineJavaScript.forEach(v => {
                console.warn('内联JS违规:', v.message);
            });
            report.violations.globalFunctions.forEach(v => {
                console.warn('全局函数违规:', v.message);
            });
            console.groupEnd();
        }
        return report;
    };
    
    // 快捷修复命令
    window.fixArchitecture = async () => {
        const guard = window.architectureGuard;
        const violations = [
            ...guard.detectInlineJavaScript(),
            ...guard.detectGlobalFunctions()
        ];
        
        if (violations.length === 0) {
            console.log('✅ 架构状态良好，无需修复');
            return;
        }
        
        console.log(`🔧 开始修复 ${violations.length} 个架构违规...`);
        const results = await guard.autoFix(violations);
        
        const success = results.filter(r => r.result.success).length;
        console.log(`✅ 成功修复 ${success}/${violations.length} 个违规`);
        
        return results;
    };
} 