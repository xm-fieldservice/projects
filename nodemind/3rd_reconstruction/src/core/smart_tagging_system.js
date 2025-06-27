/**
 * 智能标记系统 - 三层数据识别架构
 * 
 * 架构层次：
 * 1. 隐性解析 - 从自然MD内容推断特征
 * 2. 显性标记 - 辅助标签标记系统
 * 3. 智能解读 - 综合判断和数据完善
 */

import { SmartMDParser } from './smart_md_parser.js';

class SmartTaggingSystem {
    constructor() {
        this.parser = new SmartMDParser();
        
        // 显性标记系统定义
        this.explicitMarkers = {
            // 数据类型标记
            dataType: {
                note: ['#笔记', '#备忘', '#想法', '#记录'],
                task: ['#任务', '#开发', '#实现', '#修复', '#功能'],
                template: ['#模板', '#提示词', '#规范', '#示例'],
                tag: ['#标签', '#分类', '#类别'],
                project: ['#项目', '#产品', '#系统'],
                team: ['#团队', '#成员', '#人员']
            },
            
            // 状态标记
            status: {
                pending: ['#待办', '#未开始', '#等待'],
                progress: ['#进行中', '#开发中', '#处理中'],
                done: ['#完成', '#已完成', '#结束'],
                blocked: ['#阻塞', '#暂停', '#延期']
            },
            
            // 优先级标记
            priority: {
                high: ['#高优先级', '#紧急', '#重要', '#🔴'],
                medium: ['#中优先级', '#普通', '#🟡'],
                low: ['#低优先级', '#可选', '#🟢']
            },
            
            // 场景标记
            context: {
                meeting: ['#会议', '#讨论', '#沟通'],
                learning: ['#学习', '#研究', '#调研'],
                bug: ['#Bug', '#问题', '#错误'],
                feature: ['#新功能', '#需求', '#增强'],
                refactor: ['#重构', '#优化', '#改进']
            },
            
            // 技术栈标记
            tech: {
                frontend: ['#前端', '#React', '#Vue', '#JavaScript'],
                backend: ['#后端', '#Node.js', '#Python', '#API'],
                database: ['#数据库', '#SQL', '#MongoDB'],
                devops: ['#运维', '#部署', '#CI/CD']
            }
        };
        
        // 界面隐性职责定义
        this.interfaceImplicitTags = {
            'note-editor': ['#笔记'],
            'task-manager': ['#任务'],
            'template-editor': ['#模板'],
            'project-dashboard': ['#项目'],
            'team-panel': ['#团队'],
            'bug-tracker': ['#Bug'],
            'meeting-notes': ['#会议', '#笔记']
        };
    }

    /**
     * 综合解析 - 三层架构核心方法
     * @param {string} mdContent - MD文档内容
     * @param {string} sourceInterface - 来源界面标识
     * @param {Array} additionalTags - 额外显性标签
     * @returns {Object} 完整的结构化数据
     */
    comprehensiveParse(mdContent, sourceInterface = null, additionalTags = []) {
        // 第一层：隐性解析
        const implicitData = this.parser.parse(mdContent);
        
        // 第二层：显性标记提取
        const explicitData = this.extractExplicitMarkers(mdContent);
        
        // 第三层：界面隐性标记
        const interfaceTags = this.getInterfaceImplicitTags(sourceInterface);
        
        // 第四层：智能综合解读
        const comprehensiveData = this.intelligentSynthesis(
            implicitData, 
            explicitData, 
            interfaceTags, 
            additionalTags
        );
        
        return comprehensiveData;
    }

    /**
     * 提取显性标记
     */
    extractExplicitMarkers(content) {
        const markers = {
            dataType: null,
            status: null,
            priority: null,
            context: [],
            tech: [],
            allTags: []
        };
        
        // 提取所有标签
        const tags = content.match(/#[\w\u4e00-\u9fa5]+/g) || [];
        markers.allTags = tags;
        
        // 分类标记
        for (const [category, typeMap] of Object.entries(this.explicitMarkers)) {
            for (const [type, tagList] of Object.entries(typeMap)) {
                const found = tagList.some(tag => tags.includes(tag));
                if (found) {
                    if (category === 'context' || category === 'tech') {
                        markers[category].push(type);
                    } else {
                        markers[category] = type;
                    }
                }
            }
        }
        
        return markers;
    }

    /**
     * 获取界面隐性标记
     */
    getInterfaceImplicitTags(sourceInterface) {
        if (!sourceInterface || !this.interfaceImplicitTags[sourceInterface]) {
            return [];
        }
        return this.interfaceImplicitTags[sourceInterface];
    }

    /**
     * 智能综合解读 - 核心算法
     */
    intelligentSynthesis(implicitData, explicitData, interfaceTags, additionalTags) {
        const result = {
            ...implicitData,
            explicitMarkers: explicitData,
            interfaceTags: interfaceTags,
            additionalTags: additionalTags,
            finalClassification: {}
        };

        // 数据类型综合判断
        result.finalClassification.type = this.determineDataType(
            implicitData.type,
            explicitData.dataType,
            interfaceTags
        );

        // 状态综合判断
        result.finalClassification.status = this.determineStatus(
            implicitData.metadata?.status,
            explicitData.status,
            result.finalClassification.type
        );

        // 优先级综合判断
        result.finalClassification.priority = this.determinePriority(
            implicitData.metadata?.priority,
            explicitData.priority
        );

        // 六要素补完
        result.sixElements = this.enhanceSixElements(
            implicitData.sixElements,
            result.finalClassification,
            explicitData
        );

        // 生成智能标签建议
        result.suggestedTags = this.generateSuggestedTags(result);

        return result;
    }

    /**
     * 数据类型综合判断
     */
    determineDataType(implicitType, explicitType, interfaceTags) {
        // 优先级：显性标记 > 界面标记 > 隐性推断
        if (explicitType) return explicitType;
        
        // 从界面标记推断类型
        const interfaceTypeMap = {
            '#笔记': 'note',
            '#任务': 'task',
            '#模板': 'template',
            '#项目': 'project',
            '#团队': 'team',
            '#标签': 'tag'
        };
        
        for (const tag of interfaceTags) {
            if (interfaceTypeMap[tag]) {
                return interfaceTypeMap[tag];
            }
        }
        
        return implicitType;
    }

    /**
     * 状态综合判断
     */
    determineStatus(implicitStatus, explicitStatus, dataType) {
        if (explicitStatus) return explicitStatus;
        if (implicitStatus) return implicitStatus;
        
        // 根据数据类型设置默认状态
        const defaultStatus = {
            task: 'pending',
            note: 'active',
            template: 'available',
            project: 'planning',
            team: 'active',
            tag: 'available'
        };
        
        return defaultStatus[dataType] || 'pending';
    }

    /**
     * 优先级综合判断
     */
    determinePriority(implicitPriority, explicitPriority) {
        if (explicitPriority) return explicitPriority;
        if (implicitPriority) return implicitPriority;
        return 'medium'; // 默认中等优先级
    }

    /**
     * 六要素智能补完
     */
    enhanceSixElements(originalElements, classification, explicitData) {
        const enhanced = { ...originalElements };
        
        // 基于类型补完默认值
        const typeDefaults = {
            note: {
                who: enhanced.who || '我',
                whom: enhanced.whom || '我自己'
            },
            task: {
                who: enhanced.who || '开发者',
                when: enhanced.when || '待安排'
            },
            template: {
                who: enhanced.who || 'AI助手',
                whom: enhanced.whom || '用户'
            },
            tag: {
                who: enhanced.who || '任何人',
                whom: enhanced.whom || '需要分类的内容'
            }
        };
        
        const defaults = typeDefaults[classification.type] || {};
        Object.assign(enhanced, defaults);
        
        // 从技术标记推断"用什么"
        if (explicitData.tech.length > 0 && !enhanced.what) {
            enhanced.what = explicitData.tech.join(', ');
        }
        
        return enhanced;
    }

    /**
     * 生成智能标签建议
     */
    generateSuggestedTags(data) {
        const suggestions = [];
        
        // 基于类型的标签建议
        const typeTags = this.explicitMarkers.dataType[data.finalClassification.type] || [];
        if (typeTags.length > 0) {
            suggestions.push(typeTags[0]);
        }
        
        // 基于状态的标签建议
        const statusTags = this.explicitMarkers.status[data.finalClassification.status] || [];
        if (statusTags.length > 0) {
            suggestions.push(statusTags[0]);
        }
        
        // 基于优先级的标签建议
        const priorityTags = this.explicitMarkers.priority[data.finalClassification.priority] || [];
        if (priorityTags.length > 0) {
            suggestions.push(priorityTags[0]);
        }
        
        // 基于内容的智能标签建议
        const contentBasedTags = this.generateContentBasedTags(data.content);
        suggestions.push(...contentBasedTags);
        
        // 去重并过滤已存在的标签
        const existingTags = data.explicitMarkers.allTags;
        return [...new Set(suggestions)].filter(tag => !existingTags.includes(tag));
    }

    /**
     * 基于内容生成标签建议
     */
    generateContentBasedTags(content) {
        const suggestions = [];
        const lowerContent = content.toLowerCase();
        
        // 技术栈检测
        const techKeywords = {
            '#React': ['react', 'jsx', 'component'],
            '#Vue': ['vue', 'vuex', 'nuxt'],
            '#JavaScript': ['javascript', 'js', 'es6'],
            '#CSS': ['css', 'style', 'stylesheet'],
            '#API': ['api', 'rest', 'endpoint'],
            '#数据库': ['database', 'sql', 'mysql', 'mongodb']
        };
        
        for (const [tag, keywords] of Object.entries(techKeywords)) {
            if (keywords.some(keyword => lowerContent.includes(keyword))) {
                suggestions.push(tag);
            }
        }
        
        // 场景检测
        const contextKeywords = {
            '#Bug': ['bug', '错误', '问题', '修复'],
            '#会议': ['会议', '讨论', '沟通'],
            '#学习': ['学习', '研究', '了解'],
            '#重构': ['重构', '优化', '改进']
        };
        
        for (const [tag, keywords] of Object.entries(contextKeywords)) {
            if (keywords.some(keyword => lowerContent.includes(keyword))) {
                suggestions.push(tag);
            }
        }
        
        return suggestions;
    }

    /**
     * 标记验证和补充建议
     */
    validateAndSuggest(mdContent, sourceInterface = null) {
        const parsed = this.comprehensiveParse(mdContent, sourceInterface);
        
        return {
            original: mdContent,
            parsed: parsed,
            validation: {
                hasTypeMarker: !!parsed.explicitMarkers.dataType,
                hasStatusMarker: !!parsed.explicitMarkers.status,
                hasPriorityMarker: !!parsed.explicitMarkers.priority,
                completeness: this.calculateCompleteness(parsed)
            },
            suggestions: {
                missingTags: parsed.suggestedTags,
                enhancedContent: this.generateEnhancedContent(mdContent, parsed)
            }
        };
    }

    /**
     * 计算数据完整性
     */
    calculateCompleteness(parsed) {
        const checks = [
            !!parsed.finalClassification.type,
            !!parsed.finalClassification.status,
            !!parsed.finalClassification.priority,
            !!parsed.sixElements.who,
            !!parsed.sixElements.why,
            parsed.explicitMarkers.allTags.length > 0
        ];
        
        return Math.round((checks.filter(Boolean).length / checks.length) * 100);
    }

    /**
     * 生成增强版MD内容
     */
    generateEnhancedContent(originalContent, parsed) {
        let enhanced = originalContent;
        
        // 添加建议的标签
        if (parsed.suggestedTags.length > 0) {
            const tagLine = '\n\n**建议标签:** ' + parsed.suggestedTags.join(' ') + '\n';
            enhanced += tagLine;
        }
        
        // 添加分类信息
        const classification = `\n**数据分类:** ${parsed.finalClassification.type} | ${parsed.finalClassification.status} | ${parsed.finalClassification.priority}\n`;
        enhanced += classification;
        
        return enhanced;
    }
}

// 使用示例和演示
class TaggingSystemDemo {
    static testCases = [
        {
            name: "简单笔记（来自笔记界面）",
            content: "# 今天的想法\n\n我觉得React组件可以优化。",
            interface: "note-editor"
        },
        {
            name: "带显性标记的任务",
            content: "# 实现用户登录功能\n\n使用JWT认证。#任务 #高优先级 #React",
            interface: "task-manager"
        },
        {
            name: "会议记录",
            content: "# 项目进度会议\n\n讨论了前端重构方案。需要@张三处理API接口。",
            interface: "meeting-notes"
        },
        {
            name: "Bug报告",
            content: "# 登录页面样式错误\n\n用户反馈登录按钮样式有问题。#Bug #紧急",
            interface: "bug-tracker"
        }
    ];

    static demo() {
        const system = new SmartTaggingSystem();
        
        console.log('🏷️ 智能标记系统演示:\n');
        
        this.testCases.forEach(testCase => {
            console.log(`📋 ${testCase.name}:`);
            console.log(`输入: ${testCase.content.replace(/\n/g, '\\n')}`);
            console.log(`界面: ${testCase.interface}`);
            
            const result = system.validateAndSuggest(testCase.content, testCase.interface);
            
            console.log('解析结果:', {
                type: result.parsed.finalClassification.type,
                status: result.parsed.finalClassification.status,
                priority: result.parsed.finalClassification.priority,
                explicitTags: result.parsed.explicitMarkers.allTags,
                interfaceTags: result.parsed.interfaceTags,
                suggestedTags: result.suggestions.missingTags,
                completeness: result.validation.completeness + '%'
            });
            console.log('---\n');
        });
    }
}

export { SmartTaggingSystem, TaggingSystemDemo }; 