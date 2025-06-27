/**
 * 游戏引擎演进逻辑 - 万能数据架构的游戏化扩展
 * 
 * 核心理念：万物皆任务 → 万物皆游戏元素
 * 
 * 演进路径：
 * 1. 现有万能数据架构 (任务管理)
 * 2. 用户权限系统 (基于万能架构)
 * 3. 游戏化机制 (积分、等级、成就)
 * 4. 游戏引擎驱动 (完整游戏化任务管理)
 */

import { UniversalDataService } from '../core/universal_data_service.js';

/**
 * 第一步：用户权限系统 - 基于万能数据架构
 */
class UserPermissionSystem {
    constructor(universalDataService) {
        this.dataService = universalDataService;
        
        // 扩展万能数据架构的类型定义
        this.dataService.typeRegistry.user = {
            label: '用户',
            defaultInterface: 'user-manager',
            autoTags: ['#用户']
        };
        
        this.dataService.typeRegistry.role = {
            label: '角色',
            defaultInterface: 'role-manager', 
            autoTags: ['#角色']
        };
        
        this.dataService.typeRegistry.permission = {
            label: '权限',
            defaultInterface: 'permission-manager',
            autoTags: ['#权限']
        };
    }

    /**
     * 创建用户 - 使用万能数据架构
     */
    createUser(username, email, roleIds = []) {
        const userMD = `# 用户：${username}

**谁:** ${username}
**时间:** ${new Date().toISOString()}
**地点:** 系统
**用什么:** 用户管理系统
**给谁:** 组织团队
**干什么:** 提供系统访问和任务执行能力

## 基本信息
- **邮箱:** ${email}
- **状态:** 激活
- **创建时间:** ${new Date().toISOString()}

## 角色权限
${roleIds.map(id => `- 角色: ${id}`).join('\n')}

#用户 #权限管理`;

        return this.dataService.add(userMD, 'user-manager');
    }

    /**
     * 创建角色 - 使用万能数据架构
     */
    createRole(roleName, permissions = []) {
        const roleMD = `# 角色：${roleName}

**谁:** 系统管理员
**时间:** 任何时候
**地点:** 系统
**用什么:** 权限控制系统
**给谁:** 特定用户群体
**干什么:** 控制系统功能访问权限

## 权限列表
${permissions.map(perm => `- ${perm}`).join('\n')}

#角色 #权限管理`;

        return this.dataService.add(roleMD, 'role-manager');
    }

    /**
     * 权限检查 - 基于万能数据架构
     */
    checkPermission(userId, action, resource) {
        const user = this.dataService.get(userId);
        if (!user) return false;

        // 从用户MD内容中提取角色信息
        const roleMatches = user.content.match(/- 角色: ([^\n]+)/g) || [];
        const userRoles = roleMatches.map(match => match.replace('- 角色: ', ''));

        // 检查角色权限
        for (const roleId of userRoles) {
            const role = this.dataService.get(roleId);
            if (role && role.content.includes(`- ${action}:${resource}`)) {
                return true;
            }
        }

        return false;
    }
}

/**
 * 第二步：游戏化机制 - 扩展万能数据架构
 */
class GameificationSystem {
    constructor(universalDataService) {
        this.dataService = universalDataService;
        
        // 扩展游戏化类型
        this.dataService.typeRegistry.achievement = {
            label: '成就',
            defaultInterface: 'achievement-manager',
            autoTags: ['#成就']
        };
        
        this.dataService.typeRegistry.quest = {
            label: '任务',
            defaultInterface: 'quest-manager',
            autoTags: ['#任务', '#游戏化']
        };
        
        this.dataService.typeRegistry.reward = {
            label: '奖励',
            defaultInterface: 'reward-manager',
            autoTags: ['#奖励']
        };
    }

    /**
     * 创建游戏化任务 - 将普通任务转换为游戏任务
     */
    gamifyTask(taskId, gameConfig = {}) {
        const originalTask = this.dataService.get(taskId);
        if (!originalTask) throw new Error('任务不存在');

        const {
            experiencePoints = 100,
            difficulty = 'medium',
            rewards = [],
            prerequisites = []
        } = gameConfig;

        // 增强原有任务的MD内容
        const gamifiedContent = `${originalTask.content}

## 🎮 游戏化属性

**经验值:** ${experiencePoints} XP
**难度等级:** ${difficulty}
**奖励:** ${rewards.join(', ')}
**前置条件:** ${prerequisites.join(', ')}

### 完成条件
- [ ] 任务验收通过
- [ ] 代码质量达标
- [ ] 文档完整

#游戏化 #任务`;

        return this.dataService.update(taskId, gamifiedContent, 'quest-manager');
    }

    /**
     * 创建成就系统
     */
    createAchievement(name, description, criteria) {
        const achievementMD = `# 🏆 成就：${name}

**谁:** 系统
**时间:** 持续有效
**地点:** 游戏世界
**用什么:** 成就系统
**给谁:** 玩家用户
**干什么:** 激励用户完成特定目标

## 成就描述
${description}

## 解锁条件
${criteria.map(c => `- ${c}`).join('\n')}

## 奖励
- 经验值: +500 XP
- 称号: ${name}大师
- 特殊权限: 解锁新功能

#成就 #游戏化`;

        return this.dataService.add(achievementMD, 'achievement-manager');
    }
}

/**
 * 第三步：游戏引擎核心 - 完整游戏化任务管理
 */
class TaskGameEngine {
    constructor(universalDataService) {
        this.dataService = universalDataService;
        this.userSystem = new UserPermissionSystem(universalDataService);
        this.gameSystem = new GameificationSystem(universalDataService);
        
        // 游戏世界状态
        this.gameWorld = {
            levels: new Map(),      // 用户等级系统
            inventory: new Map(),   // 用户物品库存
            guilds: new Map(),      // 公会/团队系统
            events: []              // 游戏事件队列
        };
    }

    /**
     * 游戏引擎核心：任务-游戏元素映射
     */
    taskToGameElementMapping = {
        // 基础任务类型 → 游戏元素
        'note': 'journal_entry',     // 笔记 → 日志条目
        'task': 'quest',             // 任务 → 任务
        'template': 'spell_scroll',  // 模板 → 法术卷轴
        'project': 'campaign',       // 项目 → 战役
        'team': 'guild',             // 团队 → 公会
        'tag': 'category_magic',     // 标签 → 分类魔法
        
        // 优先级 → 游戏难度
        'high': 'legendary',         // 高优先级 → 传奇难度
        'medium': 'epic',            // 中优先级 → 史诗难度  
        'low': 'normal',             // 低优先级 → 普通难度
        
        // 状态 → 游戏状态
        'pending': 'available',      // 待办 → 可接取
        'progress': 'in_progress',   // 进行中 → 进行中
        'done': 'completed',         // 完成 → 已完成
        'blocked': 'locked'          // 阻塞 → 锁定
    };

    /**
     * 创建游戏化项目世界
     */
    createGameWorld(projectData) {
        const worldMD = `# 🌍 游戏世界：${projectData.name}

**谁:** 游戏世界系统
**时间:** 项目周期
**地点:** 虚拟游戏世界
**用什么:** 游戏引擎
**给谁:** 所有参与者
**干什么:** 提供沉浸式项目管理体验

## 世界设定
- **世界类型:** 项目管理RPG
- **主题:** ${projectData.theme || '科技冒险'}
- **背景故事:** ${projectData.story || '团队共同完成伟大的软件项目'}

## 游戏机制
### 经验值系统
- 完成任务获得XP
- 升级解锁新技能
- 团队协作获得额外奖励

### 物品系统  
- 代码片段 → 装备
- 文档 → 知识卷轴
- 工具 → 魔法道具

### 社交系统
- 团队 → 公会
- 代码审查 → 切磋
- 会议 → 公会集会

#游戏世界 #项目管理`;

        return this.dataService.add(worldMD, 'game-world-manager');
    }

    /**
     * 任务执行的游戏化流程
     */
    executeGameifiedTask(taskId, playerId) {
        const task = this.dataService.get(taskId);
        const player = this.dataService.get(playerId);
        
        if (!task || !player) throw new Error('任务或玩家不存在');

        // 1. 前置条件检查（游戏化）
        const canAccept = this.checkQuestPrerequisites(task, player);
        if (!canAccept) {
            return { success: false, message: '不满足任务前置条件' };
        }

        // 2. 任务接取（游戏化）
        this.acceptQuest(taskId, playerId);

        // 3. 任务执行监控（游戏化）
        this.monitorQuestProgress(taskId, playerId);

        // 4. 任务完成奖励（游戏化）
        return this.completeQuestWithRewards(taskId, playerId);
    }

    /**
     * 检查任务前置条件（游戏化）
     */
    checkQuestPrerequisites(task, player) {
        // 从玩家数据中提取等级、技能等信息
        const playerLevel = this.extractPlayerLevel(player);
        const playerSkills = this.extractPlayerSkills(player);
        
        // 从任务数据中提取要求
        const requiredLevel = this.extractRequiredLevel(task);
        const requiredSkills = this.extractRequiredSkills(task);
        
        return playerLevel >= requiredLevel && 
               requiredSkills.every(skill => playerSkills.includes(skill));
    }

    /**
     * 完成任务并发放奖励（游戏化）
     */
    completeQuestWithRewards(taskId, playerId) {
        const task = this.dataService.get(taskId);
        const player = this.dataService.get(playerId);
        
        // 计算奖励
        const rewards = this.calculateRewards(task, player);
        
        // 更新玩家数据
        this.updatePlayerProgress(playerId, rewards);
        
        // 检查成就解锁
        this.checkAchievementUnlock(playerId);
        
        // 触发游戏事件
        this.triggerGameEvent('quest_completed', { taskId, playerId, rewards });
        
        return {
            success: true,
            rewards: rewards,
            message: `任务完成！获得 ${rewards.experience} XP`
        };
    }

    /**
     * 团队协作的游戏化（公会系统）
     */
    createGuildCollaboration(teamId, questId) {
        const team = this.dataService.get(teamId);
        const quest = this.dataService.get(questId);
        
        const guildQuestMD = `# 🏰 公会任务：${quest.title}

**谁:** ${team.title}公会
**时间:** ${new Date().toISOString()}
**地点:** 公会大厅
**用什么:** 团队协作系统
**给谁:** 公会成员
**干什么:** 共同完成大型任务

## 任务分工
- 前端开发者 → 界面法师
- 后端开发者 → 逻辑工程师  
- 测试工程师 → 质量守护者
- 项目经理 → 任务指挥官

## 协作奖励
- 个人奖励 × 1.5倍
- 公会声望 +100
- 解锁团队成就

#公会任务 #团队协作`;

        return this.dataService.add(guildQuestMD, 'guild-manager');
    }
}

/**
 * 第四步：安全机制设计 - 基于万能数据架构
 */
class SecurityFramework {
    constructor(universalDataService) {
        this.dataService = universalDataService;
    }

    /**
     * 安全机制扩展方案
     */
    securityExtensions = {
        // 1. 数据级安全 - 在万能数据架构基础上添加
        dataLevel: {
            encryption: '数据加密存储',
            access_control: '基于角色的访问控制',
            audit_trail: '操作审计日志',
            data_validation: '输入数据验证'
        },
        
        // 2. 传输级安全
        transportLevel: {
            https: 'HTTPS加密传输',
            token_auth: 'JWT令牌认证',
            rate_limiting: '接口调用限制',
            cors_policy: '跨域访问策略'
        },
        
        // 3. 应用级安全
        applicationLevel: {
            permission_matrix: '权限矩阵控制',
            session_management: '会话管理',
            xss_protection: 'XSS攻击防护',
            sql_injection: 'SQL注入防护'
        }
    };

    /**
     * 安全增强的万能数据架构
     */
    createSecureDataWrapper() {
        return {
            // 在现有数据结构基础上包装安全层
            secureAdd: (data, permissions = []) => {
                // 添加安全元数据
                const secureData = {
                    ...data,
                    security: {
                        permissions: permissions,
                        createdBy: this.getCurrentUser(),
                        accessLog: [],
                        encryptionLevel: 'standard'
                    }
                };
                return this.dataService.add(secureData);
            },
            
            secureGet: (id, userId) => {
                const data = this.dataService.get(id);
                if (this.checkAccess(data, userId)) {
                    this.logAccess(id, userId, 'read');
                    return data;
                }
                throw new Error('访问被拒绝');
            }
        };
    }
}

/**
 * 完整演进路径总结
 */
const evolutionPath = {
    stage1: '万能数据架构 - 统一任务管理',
    stage2: '用户权限系统 - 基于万能架构扩展',
    stage3: '游戏化机制 - 添加游戏元素',
    stage4: '游戏引擎驱动 - 完整游戏化项目管理',
    stage5: '安全机制 - 在现有架构上叠加安全层'
};

export { 
    UserPermissionSystem, 
    GameificationSystem, 
    TaskGameEngine, 
    SecurityFramework,
    evolutionPath 
}; 