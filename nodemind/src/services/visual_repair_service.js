/**
 * 可视化修复服务
 * 提供用户友好的数据结构修复界面
 * 替代控制台命令操作
 */

class VisualRepairService {
    constructor() {
        this.isInitialized = false;
        this.repairUI = null;
        this.isRepairInProgress = false;
    }

    /**
     * 初始化可视化修复服务
     */
    initialize() {
        if (this.isInitialized) return;
        
        console.log('🛠️ 初始化可视化修复服务...');
        this.createRepairUI();
        this.setupAutoDetection();
        this.isInitialized = true;
        console.log('✅ 可视化修复服务已初始化');
    }

    /**
     * 创建修复界面UI
     */
    createRepairUI() {
        // 创建修复提示容器
        this.repairUI = document.createElement('div');
        this.repairUI.id = 'visual-repair-notice';
        this.repairUI.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff6b6b, #feca57);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            display: none;
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        this.repairUI.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <span style="font-size: 20px;">⚠️</span>
                <div>
                    <div style="font-weight: bold; font-size: 14px;">节点染色异常</div>
                    <div style="font-size: 12px; opacity: 0.9;">检测到数据结构问题</div>
                </div>
            </div>
            <button onclick="visualRepairService.startQuickRepair()" style="
                margin-top: 10px;
                padding: 8px 12px;
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 4px;
                color: white;
                cursor: pointer;
                font-size: 12px;
                width: 100%;
                font-weight: 600;
            ">🛠️ 一键修复</button>
            <button onclick="visualRepairService.hideNotice()" style="
                position: absolute;
                top: 5px;
                right: 8px;
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
                opacity: 0.7;
            ">×</button>
        `;

        document.body.appendChild(this.repairUI);
    }

    /**
     * 设置自动检测
     */
    setupAutoDetection() {
        // 页面加载后检测
        setTimeout(() => this.checkForIssues(), 2000);
        
        // 定期检测（每30秒）
        setInterval(() => this.checkForIssues(), 30000);
    }

    /**
     * 检查是否需要修复
     */
    checkForIssues() {
        if (this.isRepairInProgress) return;

        const issues = this.detectIssues();
        if (issues.length > 0) {
            console.log('🔍 检测到问题:', issues);
            this.showNotice();
        }
    }

    /**
     * 检测系统问题
     */
    detectIssues() {
        const issues = [];

        // 检查数据结构统一状态
        if (!window.NODEMIND_UNIFIED_MODE) {
            issues.push('数据结构未统一');
        }

        // 检查染色服务状态
        if (!window.unifiedNodeStyling?.isInitialized) {
            issues.push('染色服务未初始化');
        }

        // 检查已染色节点数量
        const styledNodes = document.querySelectorAll('[data-styled="true"]').length;
        const totalNodes = Object.keys(window.nodeDatabase || {}).length;
        
        if (totalNodes > 0 && styledNodes === 0) {
            issues.push('节点未正确染色');
        }

        return issues;
    }

    /**
     * 显示修复提示
     */
    showNotice() {
        if (this.repairUI) {
            this.repairUI.style.display = 'block';
        }
    }

    /**
     * 隐藏修复提示
     */
    hideNotice() {
        if (this.repairUI) {
            this.repairUI.style.display = 'none';
        }
    }

    /**
     * 开始快速修复
     */
    async startQuickRepair() {
        if (this.isRepairInProgress) {
            console.log('⚠️ 修复正在进行中...');
            return;
        }

        this.isRepairInProgress = true;
        this.hideNotice();
        
        // 显示修复进度
        this.showRepairProgress();

        try {
            console.log('🚀 开始一键修复...');
            
            // 检查修复函数是否存在
            if (typeof window.executeMainFix !== 'function') {
                throw new Error('修复函数未找到，请确保修复脚本已加载');
            }

            // 执行修复
            const result = await window.executeMainFix();
            
            // 显示成功结果
            this.showRepairSuccess(result);
            console.log('✅ 修复完成!', result);

        } catch (error) {
            console.error('❌ 修复失败:', error);
            this.showRepairError(error.message);
        } finally {
            this.isRepairInProgress = false;
        }
    }

    /**
     * 显示修复进度
     */
    showRepairProgress() {
        // 创建进度提示
        const progressNotice = document.createElement('div');
        progressNotice.id = 'repair-progress-notice';
        progressNotice.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            z-index: 1001;
            text-align: center;
            min-width: 300px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        progressNotice.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">🛠️</div>
                <div style="font-size: 18px; font-weight: 600; color: #2c3e50;">正在修复数据结构</div>
                <div style="font-size: 14px; color: #6c757d; margin-top: 5px;">请稍候，修复进行中...</div>
            </div>
            <div style="width: 100%; height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden;">
                <div style="width: 0%; height: 100%; background: linear-gradient(90deg, #28a745, #20c997); animation: progress 3s ease-in-out infinite;"></div>
            </div>
            <style>
                @keyframes progress {
                    0% { width: 0%; }
                    50% { width: 70%; }
                    100% { width: 100%; }
                }
            </style>
        `;

        document.body.appendChild(progressNotice);
    }

    /**
     * 显示修复成功
     */
    showRepairSuccess(result) {
        this.removeProgressNotice();

        const successNotice = document.createElement('div');
        successNotice.id = 'repair-success-notice';
        successNotice.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        // 提取结果统计
        let stats = { processedNodes: 0, styledNodes: 0, skippedNodes: 0, errors: 0 };
        if (result && result.phase4 && result.phase4.details && result.phase4.details.stylingResult) {
            const results = result.phase4.details.stylingResult.results;
            stats.processedNodes = results.processedNodes || 0;
            stats.styledNodes = results.styledNodes || 0;
            stats.skippedNodes = results.skippedNodes?.length || 0;
            stats.errors = results.errors?.length || 0;
        }

        successNotice.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                <span style="font-size: 24px;">✅</span>
                <div>
                    <div style="font-weight: bold; font-size: 16px;">修复完成！</div>
                    <div style="font-size: 12px; opacity: 0.9;">数据结构已统一，染色已应用</div>
                </div>
            </div>
            <div style="font-size: 12px; line-height: 1.4;">
                <div>• 处理节点: ${stats.processedNodes}</div>
                <div>• 成功染色: ${stats.styledNodes}</div>
                <div>• 跳过节点: ${stats.skippedNodes}</div>
                <div>• 错误数量: ${stats.errors}</div>
            </div>
            <button onclick="this.parentElement.remove()" style="
                position: absolute;
                top: 5px;
                right: 8px;
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
                opacity: 0.7;
            ">×</button>
        `;

        document.body.appendChild(successNotice);

        // 3秒后自动消失
        setTimeout(() => {
            if (successNotice.parentElement) {
                successNotice.remove();
            }
        }, 5000);
    }

    /**
     * 显示修复错误
     */
    showRepairError(errorMessage) {
        this.removeProgressNotice();

        const errorNotice = document.createElement('div');
        errorNotice.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #dc3545, #e74c3c);
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        errorNotice.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <span style="font-size: 20px;">❌</span>
                <div>
                    <div style="font-weight: bold; font-size: 14px;">修复失败</div>
                    <div style="font-size: 12px; opacity: 0.9;">${errorMessage}</div>
                </div>
            </div>
            <button onclick="this.parentElement.remove()" style="
                position: absolute;
                top: 5px;
                right: 8px;
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
                opacity: 0.7;
            ">×</button>
        `;

        document.body.appendChild(errorNotice);

        // 5秒后自动消失
        setTimeout(() => {
            if (errorNotice.parentElement) {
                errorNotice.remove();
            }
        }, 5000);
    }

    /**
     * 移除进度提示
     */
    removeProgressNotice() {
        const progressNotice = document.getElementById('repair-progress-notice');
        if (progressNotice) {
            progressNotice.remove();
        }
    }

    /**
     * 手动触发检测
     */
    triggerCheck() {
        this.checkForIssues();
    }

    /**
     * 获取服务状态
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            repairInProgress: this.isRepairInProgress,
            issues: this.detectIssues()
        };
    }
}

// 创建全局实例
const visualRepairService = new VisualRepairService();

// 导出服务
window.visualRepairService = visualRepairService;

// 页面加载后自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        visualRepairService.initialize();
    });
} else {
    visualRepairService.initialize();
}

console.log('🛠️ 可视化修复服务已加载'); 