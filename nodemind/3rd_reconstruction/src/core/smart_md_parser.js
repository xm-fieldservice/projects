/**
 * 智能MD解析引擎 - 隐性六要素提取
 * 
 * 核心理念：
 * 1. 从自然的MD文档中智能推断六要素
 * 2. 不强制显性展示所有字段
 * 3. 根据内容特征自动分类和解析
 */

class SmartMDParser {
    constructor() {
        // 任务类型识别规则
        this.typePatterns = {
            note: [/想法/, /备忘/, /记录/, /思考/, /总结/, /笔记/],
            template: [/模板/, /提示词/, /规范/, /示例/, /格式/],
            tag: [/#\w+/, /标签/, /分类/, /类别/],
            project: [/项目/, /产品/, /系统/, /平台/],
            task: [/任务/, /开发/, /实现/, /完成/, /修复/],
            team: [/团队/, /成员/, /人员/, /组织/]
        };

        // 六要素隐性推断规则
        this.elementPatterns = {
            who: {
                // 从内容中推断"谁"
                explicit: [/\*\*谁:\*\*/, /\*\*负责人:\*\*/, /\*\*执行者:\*\*/],
                implicit: [/我[要|需要|应该]/, /团队/, /开发者/, /用户/, /@\w+/]
            },
            when: {
                explicit: [/\*\*时间:\*\*/, /\*\*何时:\*\*/],
                implicit: [/\d{4}-\d{2}-\d{2}/, /今天/, /明天/, /本周/, /下周/, /紧急/, /立即/]
            },
            where: {
                explicit: [/\*\*地点:\*\*/, /\*\*环境:\*\*/],
                implicit: [/本地/, /远程/, /线上/, /开发环境/, /生产环境/]
            },
            what: {
                explicit: [/\*\*工具:\*\*/, /\*\*方法:\*\*/],
                implicit: [/使用/, /通过/, /借助/, /基于/, /React/, /Vue/, /JavaScript/]
            },
            whom: {
                explicit: [/\*\*给谁:\*\*/, /\*\*目标:\*\*/],
                implicit: [/用户/, /客户/, /自己/, /团队/, /开发者/]
            },
            why: {
                explicit: [/\*\*目标:\*\*/, /\*\*目的:\*\*/],
                implicit: [] // 通常从标题和主要内容推断
            }
        };
    }

    /**
     * 智能解析MD文档
     * @param {string} mdContent - MD文档内容
     * @returns {Object} 解析后的结构化数据
     */
    parse(mdContent) {
        const result = {
            id: this.generateId(),
            type: this.inferType(mdContent),
            title: this.extractTitle(mdContent),
            content: mdContent,
            sixElements: this.extractSixElements(mdContent),
            relations: this.extractRelations(mdContent),
            metadata: this.extractMetadata(mdContent)
        };

        return result;
    }

    /**
     * 推断任务类型
     */
    inferType(content) {
        const lowerContent = content.toLowerCase();
        
        for (const [type, patterns] of Object.entries(this.typePatterns)) {
            if (patterns.some(pattern => pattern.test(lowerContent))) {
                return type;
            }
        }
        
        // 默认类型推断
        if (content.includes('#') && content.split('\n').length <= 5) {
            return 'tag';
        }
        if (content.includes('模板') || content.includes('示例')) {
            return 'template';
        }
        if (content.split('\n').length <= 3) {
            return 'note';
        }
        
        return 'task'; // 默认
    }

    /**
     * 隐性提取六要素 - 核心算法
     */
    extractSixElements(content) {
        const elements = {
            who: this.inferWho(content),
            when: this.inferWhen(content),
            where: this.inferWhere(content),
            what: this.inferWhat(content),
            whom: this.inferWhom(content),
            why: this.inferWhy(content)
        };

        // 只保留非空的要素
        return Object.fromEntries(
            Object.entries(elements).filter(([key, value]) => value && value.trim())
        );
    }

    /**
     * 推断"谁" - 执行者
     */
    inferWho(content) {
        // 显性匹配
        const explicitMatch = content.match(/\*\*(?:谁|负责人|执行者):\*\*\s*([^\n]*)/);
        if (explicitMatch) return explicitMatch[1].trim();

        // 隐性推断
        if (content.includes('我要') || content.includes('我需要')) return '我';
        if (content.includes('团队')) return '开发团队';
        if (content.includes('@')) {
            const mention = content.match(/@(\w+)/);
            if (mention) return mention[1];
        }

        // 根据任务类型推断
        const type = this.inferType(content);
        const defaultWho = {
            note: '我',
            template: 'AI助手',
            tag: '任何人',
            project: '项目团队',
            task: '开发者'
        };

        return defaultWho[type] || '';
    }

    /**
     * 推断"时间"
     */
    inferWhen(content) {
        const explicitMatch = content.match(/\*\*(?:时间|何时):\*\*\s*([^\n]*)/);
        if (explicitMatch) return explicitMatch[1].trim();

        // 时间词匹配
        const timeWords = ['今天', '明天', '本周', '下周', '紧急', '立即'];
        for (const word of timeWords) {
            if (content.includes(word)) return word;
        }

        // 日期匹配
        const dateMatch = content.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) return dateMatch[0];

        return ''; // 很多任务不需要明确时间
    }

    /**
     * 推断"地点"
     */
    inferWhere(content) {
        const explicitMatch = content.match(/\*\*(?:地点|环境):\*\*\s*([^\n]*)/);
        if (explicitMatch) return explicitMatch[1].trim();

        const locations = ['本地', '远程', '线上', '开发环境', '生产环境'];
        for (const loc of locations) {
            if (content.includes(loc)) return loc;
        }

        return ''; // 大多数任务不需要明确地点
    }

    /**
     * 推断"用什么"
     */
    inferWhat(content) {
        const explicitMatch = content.match(/\*\*(?:工具|方法|技术):\*\*\s*([^\n]*)/);
        if (explicitMatch) return explicitMatch[1].trim();

        // 技术栈识别
        const techs = ['React', 'Vue', 'JavaScript', 'Python', 'Node.js', 'jsMind'];
        const foundTechs = techs.filter(tech => content.includes(tech));
        if (foundTechs.length > 0) return foundTechs.join(', ');

        return '';
    }

    /**
     * 推断"给谁"
     */
    inferWhom(content) {
        const explicitMatch = content.match(/\*\*(?:给谁|目标|对象):\*\*\s*([^\n]*)/);
        if (explicitMatch) return explicitMatch[1].trim();

        if (content.includes('用户')) return '用户';
        if (content.includes('自己')) return '我自己';
        if (content.includes('团队')) return '团队成员';

        return '';
    }

    /**
     * 推断"干什么" - 主要从标题推断
     */
    inferWhy(content) {
        const explicitMatch = content.match(/\*\*(?:目标|目的|干什么):\*\*\s*([^\n]*)/);
        if (explicitMatch) return explicitMatch[1].trim();

        // 从标题推断
        const title = this.extractTitle(content);
        if (title) return title.replace(/^#+\s*/, '').replace(/^\[.*?\]\s*/, '');

        return '';
    }

    /**
     * 提取标题
     */
    extractTitle(content) {
        const titleMatch = content.match(/^#+\s*(.+)$/m);
        return titleMatch ? titleMatch[1].trim() : '';
    }

    /**
     * 提取关系信息
     */
    extractRelations(content) {
        const relations = {
            parent: '',
            children: [],
            dependencies: []
        };

        // 依赖关系提取
        const depMatch = content.match(/依赖[:：]\s*([^\n]*)/);
        if (depMatch) {
            relations.dependencies = depMatch[1].split(/[,，\s]+/).filter(Boolean);
        }

        return relations;
    }

    /**
     * 提取元数据
     */
    extractMetadata(content) {
        const metadata = {};
        
        // 提取状态
        const statusMatch = content.match(/(?:状态|Status)[:：]\s*([^\n]*)/);
        if (statusMatch) metadata.status = statusMatch[1].trim();

        // 提取优先级
        const priorityMatch = content.match(/(?:优先级|Priority)[:：]\s*([^\n]*)/);
        if (priorityMatch) metadata.priority = priorityMatch[1].trim();

        // 提取标签
        const tags = content.match(/#\w+/g);
        if (tags) metadata.tags = tags;

        return metadata;
    }

    generateId() {
        return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// 使用示例和测试
class MDParserDemo {
    static testCases = [
        {
            name: "简单笔记",
            content: `# 今天的想法\n\n我觉得这个功能可以优化一下性能。`
        },
        {
            name: "标签定义", 
            content: `# #前端开发\n\n用于标注前端相关的开发任务和笔记。\n\n颜色: #3498db`
        },
        {
            name: "任务描述",
            content: `# 实现用户登录功能\n\n使用React和JWT实现用户认证系统。\n\n状态: 进行中\n优先级: 高`
        },
        {
            name: "项目信息",
            content: `# NodeMind脑图系统\n\n团队协作开发的智能脑图管理平台。\n\n技术栈: React + jsMind\n目标用户: 知识工作者`
        }
    ];

    static demo() {
        const parser = new SmartMDParser();
        
        console.log('🧠 智能MD解析演示:\n');
        
        this.testCases.forEach(testCase => {
            console.log(`📋 ${testCase.name}:`);
            console.log(`输入: ${testCase.content.replace(/\n/g, '\\n')}`);
            
            const result = parser.parse(testCase.content);
            console.log(`输出:`, {
                type: result.type,
                title: result.title,
                sixElements: result.sixElements,
                metadata: result.metadata
            });
            console.log('---\n');
        });
    }
}

export { SmartMDParser, MDParserDemo }; 