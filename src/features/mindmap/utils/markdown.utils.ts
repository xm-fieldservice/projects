import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import type { Root, Heading, Text, List, ListItem } from 'mdast';
import { v4 as uuidv4 } from 'uuid';
import type { MindNode, TreeData, ExportOptions } from '../types/mindmap.types';

// Markdown解析器
export class MarkdownParser {
  private processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml', 'toml']);

  // 解析Markdown文本为脑图数据
  parseMarkdown(markdown: string): TreeData {
    try {
      const ast = this.processor.parse(markdown);
      const nodes: MindNode[] = [];
      let rootId: string | null = null;

      // 遍历AST构建节点
      this.traverseAST(ast, nodes, null, (nodeId) => {
        if (!rootId) rootId = nodeId;
      });

      return { nodes, rootId };
    } catch (error) {
      console.error('Markdown解析失败:', error);
      return { nodes: [], rootId: null };
    }
  }

  // 遍历AST节点
  private traverseAST(
    node: any,
    nodes: MindNode[],
    parentId: string | null,
    onRootNode?: (nodeId: string) => void
  ): string | null {
    switch (node.type) {
      case 'root':
        return this.handleRoot(node, nodes, parentId, onRootNode);
      case 'heading':
        return this.handleHeading(node, nodes, parentId, onRootNode);
      case 'list':
        return this.handleList(node, nodes, parentId);
      case 'listItem':
        return this.handleListItem(node, nodes, parentId);
      default:
        // 处理其他类型的节点
        if (node.children) {
          let lastNodeId = parentId;
          for (const child of node.children) {
            const childNodeId = this.traverseAST(child, nodes, lastNodeId, onRootNode);
            if (childNodeId) lastNodeId = childNodeId;
          }
          return lastNodeId;
        }
        return null;
    }
  }

  // 处理根节点
  private handleRoot(
    node: Root,
    nodes: MindNode[],
    parentId: string | null,
    onRootNode?: (nodeId: string) => void
  ): string | null {
    let lastNodeId = parentId;
    
    for (const child of node.children) {
      const childNodeId = this.traverseAST(child, nodes, lastNodeId, onRootNode);
      if (childNodeId) {
        lastNodeId = childNodeId;
        if (onRootNode && !parentId) {
          onRootNode(childNodeId);
        }
      }
    }
    
    return lastNodeId;
  }

  // 处理标题节点
  private handleHeading(
    node: Heading,
    nodes: MindNode[],
    parentId: string | null,
    onRootNode?: (nodeId: string) => void
  ): string {
    const id = uuidv4();
    const title = this.extractTextContent(node);
    const level = node.depth;

    // 解析标签
    const { cleanTitle, tags } = this.parseTagsFromTitle(title);

    const mindNode: MindNode = {
      id,
      title: cleanTitle,
      content: '',
      parentId,
      position: { x: 0, y: 0 },
      tags,
      children: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    nodes.push(mindNode);

    // 更新父节点的children数组
    if (parentId) {
      const parent = nodes.find(n => n.id === parentId);
      if (parent) {
        parent.children.push(id);
      }
    }

    // 如果是一级标题且没有父节点，设为根节点
    if (level === 1 && !parentId && onRootNode) {
      onRootNode(id);
    }

    return id;
  }

  // 处理列表
  private handleList(
    node: List,
    nodes: MindNode[],
    parentId: string | null
  ): string | null {
    let lastNodeId = parentId;
    
    for (const item of node.children) {
      const itemNodeId = this.handleListItem(item, nodes, parentId);
      if (itemNodeId) lastNodeId = itemNodeId;
    }
    
    return lastNodeId;
  }

  // 处理列表项
  private handleListItem(
    node: ListItem,
    nodes: MindNode[],
    parentId: string | null
  ): string {
    const id = uuidv4();
    
    // 提取列表项的文本内容
    let title = '';
    let content = '';
    
    for (const child of node.children) {
      if (child.type === 'paragraph') {
        const text = this.extractTextContent(child);
        if (!title) {
          title = text;
        } else {
          content += text + '\n';
        }
      } else if (child.type === 'text') {
        title = this.extractTextContent(child);
      }
    }

    // 解析标签
    const { cleanTitle, tags } = this.parseTagsFromTitle(title);

    const mindNode: MindNode = {
      id,
      title: cleanTitle || '未命名节点',
      content: content.trim(),
      parentId,
      position: { x: 0, y: 0 },
      tags,
      children: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    nodes.push(mindNode);

    // 更新父节点的children数组
    if (parentId) {
      const parent = nodes.find(n => n.id === parentId);
      if (parent) {
        parent.children.push(id);
      }
    }

    // 处理嵌套列表
    for (const child of node.children) {
      if (child.type === 'list') {
        this.handleList(child, nodes, id);
      }
    }

    return id;
  }

  // 提取文本内容
  private extractTextContent(node: any): string {
    if (node.type === 'text') {
      return node.value;
    }
    
    if (node.children) {
      return node.children
        .map((child: any) => this.extractTextContent(child))
        .join('');
    }
    
    return '';
  }

  // 从标题中解析标签
  private parseTagsFromTitle(title: string): {
    cleanTitle: string;
    tags: MindNode['tags'];
  } {
    const tags: MindNode['tags'] = {};
    let cleanTitle = title;

    // 解析状态标签 [状态:已完成]
    const statusMatch = title.match(/\[状态:([^\]]+)\]/);
    if (statusMatch) {
      const status = statusMatch[1] as MindNode['tags']['status'];
      if (['未开始', '进行中', '已完成', '暂停'].includes(status)) {
        tags.status = status;
      }
      cleanTitle = cleanTitle.replace(statusMatch[0], '').trim();
    }

    // 解析优先级标签 [优先级:高]
    const priorityMatch = title.match(/\[优先级:([^\]]+)\]/);
    if (priorityMatch) {
      const priority = priorityMatch[1] as MindNode['tags']['priority'];
      if (['低', '中', '高', '紧急'].includes(priority)) {
        tags.priority = priority;
      }
      cleanTitle = cleanTitle.replace(priorityMatch[0], '').trim();
    }

    // 解析分类标签 [分类:技术]
    const categoryMatch = title.match(/\[分类:([^\]]+)\]/);
    if (categoryMatch) {
      tags.category = categoryMatch[1];
      cleanTitle = cleanTitle.replace(categoryMatch[0], '').trim();
    }

    return { cleanTitle, tags };
  }
}

// Markdown导出器
export class MarkdownExporter {
  // 导出脑图数据为Markdown
  exportToMarkdown(tree: TreeData, options: ExportOptions = { format: 'markdown' }): string {
    if (!tree.rootId || tree.nodes.length === 0) {
      return '';
    }

    const nodeMap = new Map<string, MindNode>();
    tree.nodes.forEach(node => nodeMap.set(node.id, node));

    const lines: string[] = [];
    
    // 添加文档头部
    if (options.includeMetadata) {
      lines.push('---');
      lines.push(`title: ${nodeMap.get(tree.rootId)?.title || '脑图'}`);
      lines.push(`created: ${new Date().toISOString()}`);
      lines.push(`nodes: ${tree.nodes.length}`);
      lines.push('---');
      lines.push('');
    }

    // 递归导出节点
    this.exportNode(tree.rootId, nodeMap, lines, 0, options);

    return lines.join('\n');
  }

  // 导出单个节点
  private exportNode(
    nodeId: string,
    nodeMap: Map<string, MindNode>,
    lines: string[],
    level: number,
    options: ExportOptions
  ): void {
    const node = nodeMap.get(nodeId);
    if (!node) return;

    // 构建标题
    let title = node.title;
    
    // 添加标签信息
    if (node.tags.status) {
      title += ` [状态:${node.tags.status}]`;
    }
    if (node.tags.priority) {
      title += ` [优先级:${node.tags.priority}]`;
    }
    if (node.tags.category) {
      title += ` [分类:${node.tags.category}]`;
    }

    // 根据层级决定格式
    if (level === 0) {
      lines.push(`# ${title}`);
    } else if (level <= 6) {
      lines.push(`${'#'.repeat(level + 1)} ${title}`);
    } else {
      // 超过6级使用列表格式
      const indent = '  '.repeat(level - 6);
      lines.push(`${indent}- ${title}`);
    }

    // 添加内容
    if (node.content.trim()) {
      lines.push('');
      lines.push(node.content);
      lines.push('');
    }

    // 添加位置信息（如果需要）
    if (options.includePosition && node.position) {
      lines.push(`<!-- 位置: x=${node.position.x}, y=${node.position.y} -->`);
    }

    // 添加元数据（如果需要）
    if (options.includeMetadata && node.metadata) {
      lines.push(`<!-- 创建时间: ${node.metadata.createdAt} -->`);
      lines.push(`<!-- 更新时间: ${node.metadata.updatedAt} -->`);
    }

    // 递归导出子节点
    node.children.forEach(childId => {
      this.exportNode(childId, nodeMap, lines, level + 1, options);
    });
  }
}

// 示例数据生成器
export const sampleDataGenerator = {
  // 生成项目管理示例
  generateProjectSample(): TreeData {
    const nodes: MindNode[] = [
      {
        id: 'root',
        title: '项目管理中心',
        content: '统一管理所有项目的进度和资源',
        parentId: null,
        position: { x: 0, y: 0 },
        tags: { status: '进行中', category: '管理' },
        children: ['frontend', 'backend', 'design'],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'frontend',
        title: '前端开发',
        content: 'React + TypeScript + Vite技术栈',
        parentId: 'root',
        position: { x: 0, y: 0 },
        tags: { status: '进行中', priority: '高', category: '技术' },
        children: ['ui', 'api'],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'backend',
        title: '后端开发',
        content: 'Node.js + Express + MongoDB',
        parentId: 'root',
        position: { x: 0, y: 0 },
        tags: { status: '未开始', priority: '中', category: '技术' },
        children: ['database', 'auth'],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'design',
        title: '设计系统',
        content: 'UI/UX设计规范和组件库',
        parentId: 'root',
        position: { x: 0, y: 0 },
        tags: { status: '已完成', priority: '低', category: '设计' },
        children: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'ui',
        title: '用户界面',
        content: '响应式设计，支持移动端',
        parentId: 'frontend',
        position: { x: 0, y: 0 },
        tags: { status: '进行中', priority: '高' },
        children: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'api',
        title: 'API集成',
        content: 'RESTful API和GraphQL支持',
        parentId: 'frontend',
        position: { x: 0, y: 0 },
        tags: { status: '未开始', priority: '中' },
        children: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'database',
        title: '数据库设计',
        content: '用户数据和业务数据模型',
        parentId: 'backend',
        position: { x: 0, y: 0 },
        tags: { status: '未开始', priority: '高' },
        children: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'auth',
        title: '用户认证',
        content: 'JWT + OAuth2.0认证系统',
        parentId: 'backend',
        position: { x: 0, y: 0 },
        tags: { status: '未开始', priority: '中' },
        children: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    ];

    return { nodes, rootId: 'root' };
  },

  // 生成学习计划示例
  generateLearningSample(): TreeData {
    const nodes: MindNode[] = [
      {
        id: 'learning-root',
        title: '技能提升计划',
        content: '2024年个人技能发展规划',
        parentId: null,
        position: { x: 0, y: 0 },
        tags: { status: '进行中', category: '学习' },
        children: ['tech-skills', 'soft-skills'],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'tech-skills',
        title: '技术技能',
        content: '编程和技术相关技能提升',
        parentId: 'learning-root',
        position: { x: 0, y: 0 },
        tags: { status: '进行中', priority: '高', category: '技术' },
        children: ['react', 'nodejs', 'ai'],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'soft-skills',
        title: '软技能',
        content: '沟通、管理和领导力技能',
        parentId: 'learning-root',
        position: { x: 0, y: 0 },
        tags: { status: '未开始', priority: '中', category: '管理' },
        children: ['communication', 'leadership'],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'react',
        title: 'React 18',
        content: '学习React 18新特性和最佳实践',
        parentId: 'tech-skills',
        position: { x: 0, y: 0 },
        tags: { status: '已完成', priority: '高' },
        children: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'nodejs',
        title: 'Node.js',
        content: '深入学习Node.js后端开发',
        parentId: 'tech-skills',
        position: { x: 0, y: 0 },
        tags: { status: '进行中', priority: '中' },
        children: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'ai',
        title: '人工智能',
        content: 'AI/ML基础知识和应用',
        parentId: 'tech-skills',
        position: { x: 0, y: 0 },
        tags: { status: '未开始', priority: '低' },
        children: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'communication',
        title: '沟通技巧',
        content: '提升团队协作和客户沟通能力',
        parentId: 'soft-skills',
        position: { x: 0, y: 0 },
        tags: { status: '未开始', priority: '中' },
        children: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        id: 'leadership',
        title: '领导力',
        content: '团队管理和项目领导技能',
        parentId: 'soft-skills',
        position: { x: 0, y: 0 },
        tags: { status: '未开始', priority: '低' },
        children: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    ];

    return { nodes, rootId: 'learning-root' };
  }
}; 