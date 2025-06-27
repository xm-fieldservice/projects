// This is a new file. 

export const mindData = {
    meta: {
        name: "jsMind本地拖拽演示",
        author: "NodeMind Demo",
        version: "1.0.0"
    },
    format: "node_tree",
    data: {
        id: "root",
        topic: "🧠 jsMind 本地拖拽演示",
        children: [
            {
                id: "features",
                topic: "🚀 核心特性",
                direction: "right",
                children: [
                    { id: "feature1", topic: "纯JavaScript实现" },
                    { id: "feature2", topic: "HTML5 Canvas渲染" },
                    { id: "feature3", topic: "节点拖拽功能" },
                    { id: "feature4", topic: "本地库文件支持" }
                ]
            },
            {
                id: "drag_features",
                topic: "🔀 拖拽特性",
                direction: "right",
                children: [
                    { id: "drag1", topic: "拖拽节点移动" },
                    { id: "drag2", topic: "跨分支重组" },
                    { id: "drag3", topic: "实时视觉反馈" },
                    { id: "drag4", topic: "自动布局调整" }
                ]
            },
            {
                id: "applications",
                topic: "📋 应用场景",
                direction: "right",
                children: [
                    { id: "app1", topic: "知识管理" },
                    { id: "app2", topic: "项目规划" },
                    { id: "app3", topic: "学习笔记" },
                    { id: "app4", topic: "团队协作" }
                ]
            },
            {
                id: "advantages",
                topic: "⭐ 技术优势",
                direction: "right",
                children: [
                    { id: "adv1", topic: "离线使用" },
                    { id: "adv2", topic: "高性能渲染" },
                    { id: "adv3", topic: "易于集成" },
                    { id: "adv4", topic: "开源免费" }
                ]
            }
        ]
    }
};

export const mindmapData = {
    workspace: {
        meta: {
            name: "标签管理",
            author: "NodeMind",
            version: "1.0.0"
        },
        format: "node_tree",
        data: {
            id: "workspace_root",
            topic: "🏷️ 标签管理",
            children: [
                {
                    id: "tag_group_normal",
                    topic: "常规组",
                    direction: "right",
                    children: [
                        { id: "tag_project", topic: "项目", direction: "right" },
                        { id: "tag_milestone", topic: "里程碑", direction: "right" },
                        { id: "tag_completed", topic: "完成", direction: "right" },
                        { id: "tag_inprogress", topic: "进行中", direction: "right" },
                        { id: "tag_planned", topic: "计划", direction: "right" }
                    ]
                },
                {
                    id: "tag_group_ai",
                    topic: "AI组",
                    direction: "right",
                    children: [
                        { id: "tag_attention", topic: "注意力", direction: "right" },
                        { id: "tag_hallucination", topic: "幻觉", direction: "right" }
                    ]
                }
            ]
        }
    },
    knowledge: {
        meta: {
            name: "临时工作区B",
            author: "NodeMind",
            version: "1.0.0"
        },
        format: "node_tree",
        data: {
            id: "knowledge_root",
            topic: "📋 临时工作区B",
            children: []
        }
    },
    project: {
        meta: {
            name: "项目管理",
            author: "NodeMind",
            version: "1.0.0"
        },
        format: "node_tree",
        data: {
            id: "project_root",
            topic: "🚀 项目管理",
            children: [
                { id: "pj_1", topic: "需求分析", direction: "right" },
                { id: "pj_2", topic: "设计阶段", direction: "right" },
                { id: "pj_3", topic: "开发实施", direction: "left" },
                { id: "pj_4", topic: "测试部署", direction: "left" }
            ]
        }
    }
};

export const baseOptions = {
    editable: true,
    theme: 'primary',
    view: {
        engine: 'canvas',
        hmargin: 120,
        vmargin: 60,
        line_width: 2,
        line_color: '#566'
    },
    layout: {
        hspace: 30,
        vspace: 20,
        pspace: 13
    },
    shortcut: {
        enable: true,
        handles: {},
        mapping: {
            addchild: 4096 + 13,  // Ctrl+Enter 添加子节点
            addbrother: 13,  // Enter
            editnode: 113,   // F2
            delnode: 46,     // Delete
            toggle: 32,      // Space
            left: 37, up: 38, right: 39, down: 40
        }
    },
    default_direction: 'right'
};

export const themes = [
    { name: 'primary', label: '蓝色主题' },
    { name: 'success', label: '成功绿' },
    { name: 'warning', label: '警告橙' },
    { name: 'danger', label: '危险红' },
    { name: 'info', label: '信息青' },
    { name: 'greensea', label: '海绿色' },
    { name: 'nephritis', label: '翡翠绿' },
    { name: 'belizehole', label: '深蓝色' },
    { name: 'wisteria', label: '紫藤色' },
    { name: 'asphalt', label: '沥青灰' },
    { name: 'orange', label: '橙红色' },
    { name: 'pumpkin', label: '南瓜色' },
    { name: 'pomegranate', label: '石榴红' },
    { name: 'clouds', label: '云朵白' },
    { name: 'asbestos', label: '石棉灰' }
];

export const NODEMIND_UNIFIED_STRUCTURE = {
    id: '',
    topic: '',
    title: '',
    content: '',
    statusTags: [],
    tags: {
        categories: [],
        technical: [],
        status: [],
        custom: [],
        future: []
    },
    time: {
        created: '',
        modified: ''
    },
    author: '',
    relations: {
        parent: null,
        children: []
    }
};

export const STORAGE_KEYS = {
    MINDMAP_DATA: 'nodemind_mindmap_data',
    NODE_DATABASE: 'nodemind_node_database',
    CURRENT_THEME: 'nodemind_current_theme',
    DRAG_ENABLED: 'nodemind_drag_enabled',
    SELECTED_NODE: 'nodemind_selected_node',
    VIEW_DATA: 'nodemind_view_data',
    LAST_SAVED_PATH: 'nodemind_last_saved_path'
}; 