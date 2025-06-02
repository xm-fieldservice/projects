# MindMap Modern v3.0

现代化React脑图应用，基于React 18 + TypeScript + Konva + Zustand技术栈构建。

## ✨ 特性

### 🎯 核心功能
- **📊 可视化脑图** - 基于Konva的高性能Canvas渲染
- **📝 Markdown支持** - 双向Markdown解析和导出
- **🏷️ 智能标签** - 状态、优先级、分类标签系统
- **🎨 现代UI** - 响应式设计，支持移动端
- **⚡ 高性能** - 支持500+节点，流畅交互

### 🛠️ 技术特性
- **React 18** - 并发渲染，最新特性
- **TypeScript** - 类型安全，开发体验优秀
- **Zustand** - 轻量级状态管理
- **Konva** - 高性能2D Canvas渲染
- **Vite** - 闪电般的开发体验

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装依赖
```bash
npm install
# 或
yarn install
```

### 开发模式
```bash
npm run dev
# 或
yarn dev
```

应用将在 http://localhost:3000 启动

### 构建生产版本
```bash
npm run build
# 或
yarn build
```

### 预览生产版本
```bash
npm run preview
# 或
yarn preview
```

## 📖 使用指南

### 基本操作
1. **加载示例** - 点击顶部工具栏的"项目示例"或"学习示例"
2. **编辑节点** - 双击节点进入编辑模式
3. **拖拽节点** - 拖拽节点可改变父子关系
4. **缩放视图** - 鼠标滚轮缩放，拖拽画布平移
5. **导出数据** - 点击"导出MD"获取Markdown格式

### Markdown格式
```markdown
# 项目管理中心 [状态:进行中] [分类:管理]

## 前端开发 [状态:进行中] [优先级:高] [分类:技术]
React + TypeScript + Vite技术栈

### 用户界面 [状态:进行中] [优先级:高]
响应式设计，支持移动端

### API集成 [状态:未开始] [优先级:中]
RESTful API和GraphQL支持
```

### 标签系统
- **状态标签**: `[状态:未开始|进行中|已完成|暂停]`
- **优先级标签**: `[优先级:低|中|高|紧急]`
- **分类标签**: `[分类:自定义分类名]`

## 🏗️ 项目结构

```
src/
├── features/mindmap/          # 脑图功能模块
│   ├── components/           # React组件
│   │   ├── MindMapCanvas.tsx # 主画布组件
│   │   └── NodeDetailPanel.tsx # 详情面板
│   ├── store/               # 状态管理
│   │   └── mindmap.store.ts # Zustand store
│   ├── types/               # 类型定义
│   │   └── mindmap.types.ts # 核心类型
│   └── utils/               # 工具函数
│       ├── layout.utils.ts  # 布局算法
│       └── markdown.utils.ts # Markdown处理
├── shared/                  # 共享模块
│   ├── components/         # 通用组件
│   ├── hooks/             # 自定义Hooks
│   └── utils/             # 工具函数
├── App.tsx                # 主应用组件
├── main.tsx              # 应用入口
└── App.css              # 全局样式
```

## 🎨 设计系统

### 颜色主题
- **主色调**: `#667eea` (渐变紫蓝)
- **成功色**: `#4CAF50` (绿色)
- **警告色**: `#FF9800` (橙色)
- **错误色**: `#F44336` (红色)
- **信息色**: `#2196F3` (蓝色)

### 节点状态颜色
- **未开始**: `#9E9E9E` (灰色)
- **进行中**: `#2196F3` (蓝色)
- **已完成**: `#4CAF50` (绿色)
- **暂停**: `#FF9800` (橙色)

## 🔧 配置选项

### 脑图配置
```typescript
interface MindMapConfig {
  nodeWidth: number;        // 节点宽度 (默认: 200)
  nodeHeight: number;       // 节点高度 (默认: 80)
  horizontalSpacing: number; // 水平间距 (默认: 250)
  verticalSpacing: number;   // 垂直间距 (默认: 120)
  margin: {                 // 边距
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}
```

### 性能配置
- **最大节点数**: 500 (可配置)
- **渲染优化**: 虚拟化渲染
- **内存管理**: 自动垃圾回收

## 📊 性能指标

### 目标性能
- **初始加载**: ≤ 3秒
- **节点渲染**: ≤ 100ms (500节点)
- **交互响应**: ≤ 50ms
- **内存占用**: ≤ 100MB

### 优化策略
- Canvas渲染替代DOM操作
- 状态管理优化
- 组件懒加载
- 代码分割

## 🧪 测试

### 运行测试
```bash
npm run test
# 或
yarn test
```

### 类型检查
```bash
npm run type-check
# 或
yarn type-check
```

### 代码检查
```bash
npm run lint
# 或
yarn lint
```

## 📦 部署

### 静态部署
构建后的文件可直接部署到任何静态文件服务器：
- Vercel
- Netlify
- GitHub Pages
- 阿里云OSS
- 腾讯云COS

### Docker部署
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 贡献指南

### 开发流程
1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

### 代码规范
- 使用TypeScript严格模式
- 遵循ESLint规则
- 组件使用函数式写法
- 状态管理使用Zustand
- 样式使用CSS Modules或styled-components

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [React](https://reactjs.org/) - 用户界面库
- [Konva](https://konvajs.org/) - 2D Canvas渲染
- [Zustand](https://github.com/pmndrs/zustand) - 状态管理
- [Vite](https://vitejs.dev/) - 构建工具
- [TypeScript](https://www.typescriptlang.org/) - 类型系统

## 📞 联系方式

- 项目主页: [GitHub Repository](https://github.com/your-username/mindmap-modern)
- 问题反馈: [Issues](https://github.com/your-username/mindmap-modern/issues)
- 功能建议: [Discussions](https://github.com/your-username/mindmap-modern/discussions)

---

**MindMap Modern v3.0** - 让思维可视化更简单 🚀 