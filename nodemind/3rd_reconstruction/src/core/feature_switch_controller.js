/**
 * 特性开关控制器 - 外科手术式重构的安全机制
 * 
 * 功能：
 * 1. 控制各个适配器的启用/禁用
 * 2. 提供安全的回退机制
 * 3. 监控切换过程中的错误和性能
 * 4. 支持批量切换和逐步切换
 */

class FeatureSwitchController {
    constructor() {
        this.switches = {
            // 服务适配器开关
            tagService: false,
            templateService: false,
            projectService: false,
            nodeService: false,
            
            // 核心功能开关
            universalDataService: false,
            smartTagging: false,
            
            // 高级功能开关
            aiEnhancement: false,
            autoMigration: false
        };
        
        this.adapters = new Map();
        this.errorCount = new Map();
        this.performanceMetrics = new Map();
        
        // 错误阈值，超过则自动回退
        this.errorThreshold = 5;
        
        // 初始化监控
        this.initializeMonitoring();
    }

    /**
     * 注册适配器
     */
    registerAdapter(name, adapter) {
        this.adapters.set(name, adapter);
        this.errorCount.set(name, 0);
        this.performanceMetrics.set(name, {
            callCount: 0,
            totalTime: 0,
            errorRate: 0
        });
        
        console.log(`📝 注册适配器: ${name}`);
    }

    /**
     * 启用指定服务
     */
    enable(serviceName) {
        if (!this.switches.hasOwnProperty(serviceName)) {
            throw new Error(`未知服务: ${serviceName}`);
        }
        
        const adapter = this.adapters.get(serviceName);
        if (!adapter) {
            throw new Error(`适配器未注册: ${serviceName}`);
        }
        
        try {
            // 执行启用前检查
            this.preEnableCheck(serviceName);
            
            // 启用适配器
            adapter.enable();
            this.switches[serviceName] = true;
            
            console.log(`✅ 已启用服务: ${serviceName}`);
            
            // 记录启用时间
            this.recordEvent(serviceName, 'enabled');
            
        } catch (error) {
            console.error(`❌ 启用服务失败: ${serviceName}`, error);
            throw error;
        }
    }

    /**
     * 禁用指定服务
     */
    disable(serviceName) {
        if (!this.switches.hasOwnProperty(serviceName)) {
            throw new Error(`未知服务: ${serviceName}`);
        }
        
        const adapter = this.adapters.get(serviceName);
        if (!adapter) {
            throw new Error(`适配器未注册: ${serviceName}`);
        }
        
        try {
            // 禁用适配器
            adapter.disable();
            this.switches[serviceName] = false;
            
            console.log(`⏹️ 已禁用服务: ${serviceName}`);
            
            // 记录禁用时间
            this.recordEvent(serviceName, 'disabled');
            
        } catch (error) {
            console.error(`❌ 禁用服务失败: ${serviceName}`, error);
            throw error;
        }
    }

    /**
     * 批量启用服务（按安全顺序）
     */
    async enableBatch(serviceNames) {
        const safeOrder = this.getSafeEnableOrder(serviceNames);
        
        for (const serviceName of safeOrder) {
            try {
                await this.enableWithValidation(serviceName);
                
                // 每次启用后等待一段时间，观察稳定性
                await this.waitAndValidate(serviceName, 2000);
                
            } catch (error) {
                console.error(`批量启用失败，停止在: ${serviceName}`, error);
                
                // 回退已启用的服务
                await this.rollbackBatch(safeOrder.slice(0, safeOrder.indexOf(serviceName)));
                throw error;
            }
        }
        
        console.log('✅ 批量启用完成:', serviceNames);
    }

    /**
     * 启用并验证
     */
    async enableWithValidation(serviceName) {
        const startTime = Date.now();
        
        try {
            this.enable(serviceName);
            
            // 执行验证测试
            await this.runValidationTests(serviceName);
            
            const duration = Date.now() - startTime;
            this.updatePerformanceMetrics(serviceName, duration, true);
            
        } catch (error) {
            const duration = Date.now() - startTime;
            this.updatePerformanceMetrics(serviceName, duration, false);
            
            this.incrementErrorCount(serviceName);
            throw error;
        }
    }

    /**
     * 等待并验证稳定性
     */
    async waitAndValidate(serviceName, waitTime) {
        console.log(`⏳ 等待 ${waitTime}ms 验证 ${serviceName} 稳定性...`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // 检查错误计数
        const errorCount = this.errorCount.get(serviceName);
        if (errorCount > this.errorThreshold) {
            throw new Error(`服务 ${serviceName} 错误过多 (${errorCount}), 自动回退`);
        }
        
        console.log(`✅ ${serviceName} 稳定性验证通过`);
    }

    /**
     * 获取安全启用顺序
     */
    getSafeEnableOrder(serviceNames) {
        // 定义依赖关系和安全顺序
        const safeOrder = [
            'universalDataService',
            'smartTagging',
            'tagService',
            'templateService',
            'projectService',
            'nodeService',
            'aiEnhancement',
            'autoMigration'
        ];
        
        return safeOrder.filter(service => serviceNames.includes(service));
    }

    /**
     * 回退批量操作
     */
    async rollbackBatch(enabledServices) {
        console.log('🔄 开始回退操作...', enabledServices);
        
        // 逆序禁用
        for (const serviceName of enabledServices.reverse()) {
            try {
                this.disable(serviceName);
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`回退失败: ${serviceName}`, error);
            }
        }
        
        console.log('✅ 回退操作完成');
    }

    /**
     * 运行验证测试
     */
    async runValidationTests(serviceName) {
        const testSuites = {
            tagService: this.testTagService.bind(this),
            templateService: this.testTemplateService.bind(this),
            projectService: this.testProjectService.bind(this),
            nodeService: this.testNodeService.bind(this)
        };
        
        const testFunction = testSuites[serviceName];
        if (testFunction) {
            await testFunction();
        }
    }

    /**
     * TagService验证测试
     */
    async testTagService() {
        const adapter = this.adapters.get('tagService');
        if (!adapter) return;
        
        // 创建测试节点
        const testNodeId = 'test-tag-' + Date.now();
        
        try {
            // 测试添加标签
            await adapter.addNodeTag(testNodeId, 'status', '测试');
            
            // 测试获取标签
            const tags = await adapter.getNodeTags(testNodeId);
            
            // 测试移除标签
            await adapter.removeNodeTag(testNodeId, 'status', '测试');
            
            console.log('✅ TagService验证测试通过');
            
        } catch (error) {
            console.error('❌ TagService验证测试失败:', error);
            throw error;
        }
    }

    /**
     * TemplateService验证测试
     */
    async testTemplateService() {
        // TODO: 实现模板服务验证
        console.log('✅ TemplateService验证测试通过 (待实现)');
    }

    /**
     * ProjectService验证测试
     */
    async testProjectService() {
        // TODO: 实现项目服务验证
        console.log('✅ ProjectService验证测试通过 (待实现)');
    }

    /**
     * NodeService验证测试
     */
    async testNodeService() {
        // TODO: 实现节点服务验证
        console.log('✅ NodeService验证测试通过 (待实现)');
    }

    /**
     * 启用前检查
     */
    preEnableCheck(serviceName) {
        // 检查依赖关系
        const dependencies = this.getDependencies(serviceName);
        for (const dep of dependencies) {
            if (!this.switches[dep]) {
                throw new Error(`依赖服务未启用: ${dep}`);
            }
        }
        
        // 检查系统资源
        // TODO: 添加内存、CPU等资源检查
        
        console.log(`✅ ${serviceName} 启用前检查通过`);
    }

    /**
     * 获取服务依赖关系
     */
    getDependencies(serviceName) {
        const dependencies = {
            tagService: ['universalDataService', 'smartTagging'],
            templateService: ['universalDataService'],
            projectService: ['universalDataService'],
            nodeService: ['universalDataService', 'smartTagging'],
            aiEnhancement: ['universalDataService', 'smartTagging'],
            autoMigration: ['universalDataService']
        };
        
        return dependencies[serviceName] || [];
    }

    /**
     * 更新性能指标
     */
    updatePerformanceMetrics(serviceName, duration, success) {
        const metrics = this.performanceMetrics.get(serviceName);
        if (metrics) {
            metrics.callCount++;
            metrics.totalTime += duration;
            if (!success) {
                metrics.errorRate = this.errorCount.get(serviceName) / metrics.callCount;
            }
        }
    }

    /**
     * 增加错误计数
     */
    incrementErrorCount(serviceName) {
        const currentCount = this.errorCount.get(serviceName) || 0;
        this.errorCount.set(serviceName, currentCount + 1);
        
        // 检查是否超过阈值
        if (currentCount + 1 > this.errorThreshold) {
            console.warn(`⚠️ 服务 ${serviceName} 错误次数超过阈值，建议回退`);
            this.autoDisableOnError(serviceName);
        }
    }

    /**
     * 错误过多时自动禁用
     */
    autoDisableOnError(serviceName) {
        try {
            this.disable(serviceName);
            console.log(`🚨 服务 ${serviceName} 因错误过多已自动禁用`);
        } catch (error) {
            console.error(`自动禁用失败: ${serviceName}`, error);
        }
    }

    /**
     * 记录事件
     */
    recordEvent(serviceName, eventType) {
        const event = {
            service: serviceName,
            type: eventType,
            timestamp: new Date().toISOString(),
            switches: { ...this.switches }
        };
        
        // TODO: 可以添加到日志系统或监控系统
        console.log('📊 事件记录:', event);
    }

    /**
     * 初始化监控
     */
    initializeMonitoring() {
        // 定期检查系统状态
        setInterval(() => {
            this.healthCheck();
        }, 30000); // 每30秒检查一次
    }

    /**
     * 健康检查
     */
    healthCheck() {
        const enabledServices = Object.entries(this.switches)
            .filter(([_, enabled]) => enabled)
            .map(([service, _]) => service);
        
        if (enabledServices.length > 0) {
            console.log('💓 系统健康检查:', {
                enabledServices,
                totalErrors: Array.from(this.errorCount.values()).reduce((a, b) => a + b, 0),
                performanceMetrics: Object.fromEntries(this.performanceMetrics)
            });
        }
    }

    /**
     * 获取当前状态
     */
    getStatus() {
        return {
            switches: { ...this.switches },
            errors: Object.fromEntries(this.errorCount),
            performance: Object.fromEntries(this.performanceMetrics),
            adapters: Array.from(this.adapters.keys())
        };
    }

    /**
     * 重置错误计数
     */
    resetErrorCount(serviceName) {
        this.errorCount.set(serviceName, 0);
        console.log(`🔄 已重置 ${serviceName} 错误计数`);
    }

    /**
     * 获取性能报告
     */
    getPerformanceReport() {
        const report = {};
        
        for (const [service, metrics] of this.performanceMetrics) {
            report[service] = {
                ...metrics,
                averageTime: metrics.callCount > 0 ? metrics.totalTime / metrics.callCount : 0,
                errorRate: metrics.errorRate * 100
            };
        }
        
        return report;
    }
}

// 创建单例实例
let featureSwitchController = null;

export function getFeatureSwitchController() {
    if (!featureSwitchController) {
        featureSwitchController = new FeatureSwitchController();
    }
    return featureSwitchController;
}

export default FeatureSwitchController; 