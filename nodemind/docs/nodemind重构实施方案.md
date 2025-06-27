# Nodemind 重构实施方案 (精简务实版)

**版本**: 1.0  
**目标**: 将 `jsmind-project.html` 中的 5000+ 行混合代码，重构为清晰、可维护、模块化的 JavaScript 代码结构，同时确保 **100% 覆盖现有功能**。

---

## 1. 指导原则 (Guiding Principles)

1.  **务实高效**: 我们的目标是解决混乱，而不是追求完美的架构。只做必要的抽象，避免过度设计。
2.  **功能完整**: 严格对照**第4节的核心功能映射清单**进行重构，确保不遗漏任何一个现有功能。这是本次重构的"宪法"。
3.  **UI 保持不变**: 重构仅限于 JavaScript 逻辑，不涉及对现有 HTML 结构和 CSS 样式的任何改动。
4.  **平滑迁移**: 采用渐进式重构策略，允许一部分代码在新架构中运行，一部分仍在旧文件中，直到全部迁移完毕。

---

## 2. 简化架构设计 (Simplified Architecture)

我们将采用一个简单、直观的模块化结构，而不是复杂的分层架构。

### 2.1 目标文件结构

```
nodemind/
├── docs/
│   ├── jsmind-project.html  (最终会被一个更简洁的HTML替代)
│   └── ...
├── src/
│   ├── app.js                 # 应用总入口和初始化
│   ├── state.js               # 全局状态管理
│   ├── mindmap_service.js     # 核心脑图数据逻辑
│   ├── ui_controller.js       # 所有DOM操作和UI事件
│   ├── storage_service.js     # 本地存储和文件操作
│   ├── event_bus.js           # 简单的事件总线
│   └── utils.js               # 通用辅助函数
└── ... (其他文件如node_modules)
```

### 2.2 核心模块职责

*   **`app.js` (应用入口)**
    *   职责：初始化所有模块，调用 `StorageService` 加载数据，启动整个应用。是所有模块的总指挥。

*   **`state.js` (全局状态)**
    *   职责：管理所有之前散乱的全局变量，如 `currentMindmap`, `nodeDatabase`, `projectInfo`, `currentEditingNodeId` 等。提供统一的获取和设置方法。

*   **`mindmap_service.js` (脑图服务)**
    *   职责：管理三个 `jsMind` 实例的生命周期。封装所有对 `nodeDatabase` 的直接操作（增删改查）、节点关系处理、标签逻辑等。**这是核心业务逻辑层**。

*   **`ui_controller.js` (UI 控制器)**
    -   职责：**负责所有与 DOM 的交互**。包括：
        1.  绑定所有 UI 事件监听器 (按钮点击、表单输入等)。
        2.  封装所有 DOM 更新函数 (`showNodeDetails`, `render...` 系列, `switchTab` 等)。
        3.  响应 `EventBus` 的事件来更新界面。

*   **`storage_service.js` (存储服务)**
    -   职责：封装所有数据的持久化逻辑。
        1.  处理 `localStorage` 的读写 (`autoSaveData`, `loadSavedData`)。
        2.  处理文件系统的导入导出 (`exportToCustomFile`, `handleFileImport`)。

*   **`event_bus.js` (事件总线)**
    *   职责：提供一个极简的发布/订阅模型，用于模块间解耦通信。例如 `MindmapService` 完成节点选中后，只需 `eventBus.emit('node_selected', ...)`，而 `UIController` 则 `eventBus.on('node_selected', ...)` 来更新UI，两者无需直接调用。

---

## 3. 重构实施步骤 (Refactoring Steps)

我们将分三步走，逐步将旧代码迁移到新架构中。

### **步骤 1: 准备工作 - 建立新架构骨架**

1.  在项目根目录下创建 `src` 文件夹。
2.  在 `src` 内创建上述所有 `.js` 文件 (`app.js`, `state.js`, ...)。
3.  在 `jsmind-project.html` 的 `<head>` 部分，**引入**这些新的 JavaScript 文件。
4.  将 `jsmind-project.html` 中巨大的 `<script>` 标签内的所有代码，**复制**到 `app.js` 中，并用 `(function() { ... })();` 包裹，暂时保证现有功能不受影响。

### **步骤 2: 迁移核心逻辑 - 从数据到服务**

此阶段，我们将 `app.js` 中的代码逐块"搬家"到对应的模块中。

1.  **迁移状态**: 将 `app.js` 中的全局变量 (`mindmaps`, `nodeDatabase`, `projectInfo` 等) 剪切到 `state.js` 中，并导出。
2.  **迁移存储**: 将 `app.js` 中与 `localStorage` 和文件操作相关的函数 (`autoSaveData`, `loadSavedData`, `exportToCustomFile`, `handleFileImport` 等) 剪切到 `storage_service.js`。
3.  **迁移脑图逻辑**: 将 `app.js` 中与 `jsMind` 实例交互和 `nodeDatabase` 核心操作相关的函数 (`initMindmaps`, `initNodeDatabase`, `toggleStatusTag`, `copyNodeTree` 等) 剪切到 `mindmap_service.js`。

### **步骤 3: 解耦 UI - 分离视图与控制**

这是最关键的一步，目标是让 `jsmind-project.html` 最终只剩下 HTML 和 CSS。

1.  **迁移 UI 更新逻辑**: 将 `app.js` 中所有直接操作 DOM 的函数 (`showNodeDetails`, `renderBasicInfo`, `switchTab`, `toggleDetailsPanel` 等) 剪切到 `ui_controller.js`。
2.  **迁移事件监听器**: 将 `app.js` 中所有的 `addEventListener` 和 `onclick` 逻辑集中到 `ui_controller.js` 的一个初始化函数中。
3.  **引入事件总线**:
    *   改造 `MindmapService`：当数据变化时（如节点被选中），不再直接调用 UI 函数，而是触发一个事件，如 `eventBus.emit('state:node_selected', nodeId)`。
    *   改造 `UIController`：监听 `EventBus` 的事件，并在回调中调用自己的 DOM 更新方法，如 `eventBus.on('state:node_selected', (nodeId) => { this.showNodeDetails(nodeId); })`。

---

## 4. 核心功能映射清单 (Function Mapping Checklist)

这是重构的**核心清单**。每完成一项迁移，就打一个勾。

### 初始化与设置
- [ ] `updateLayoutHeight()` → `UIController::updateLayoutHeight()`
- [ ] `initMindmaps()` → `MindmapService::initialize()`
- [ ] `initNodeDatabase()` & `traverseNode()` → `MindmapService::initNodeDatabase()`
- [ ] `initializeNodeMindTool()` & `validateAndFixNodeDatabase()` → `MindmapService` 内部数据处理
- [ ] `bindEnhancedEvents()` & `addEventListenersToAllMindmaps()` → `UIController::bindEvents()`
- [ ] `setupAutoSave()` → `StorageService::initAutoSave()`
- [ ] `getProjectInfoFromURL()` & `parseURLParamsAndUpdateProject()` → `App::init` 调用 `StorageService` 或 `State` 的方法
- [ ] `initializeTemplateManager()` → `TemplateService` (或暂时并入 `UIController`)

### UI 控制与渲染
- [ ] `switchMindmapTab()` → `UIController::switchMindmapTab()`
- [ ] `switchTab()` (详情页) → `UIController::switchDetailTab()`
- [ ] `showNodeDetails()` → `UIController::showNodeDetails()` (将调用 `MindmapService` 获取数据)
- [ ] `renderBasicInfo()` → `UIController::renderBasicInfo()`
- [ ] `renderDetailInfo()` → `UIController::renderDetailInfo()`
- [ ] `renderHistoryInfo()` → `UIController::renderHistoryInfo()`
- [ ] `updateCurrentNodeStatusTagsDisplay()` → `UIController::updateStatusTags()`
- [ ] `clearNodeDetails()` → `UIController::clearDetailsPanel()`
- [ ] `toggleDetailsPanel()` → `UIController::toggleDetailsPanel()`
- [ ] `toggleExtensionPanel()` → `UIController::toggleExtensionPanel()`
- [ ] `showContextMenu()` & `hideContextMenu()` → `UIController::contextMenuHandler()`
- [ ] `showUserGuide()` → `UIController::showUserGuide()`
- [ ] `showMessage()` → `UIController::showMessage()` (或移入 `utils.js`)
- [ ] `updateProjectInfoDisplay()` → `UIController::updateProjectInfoDisplay()`

### 数据与业务逻辑
- [ ] `getCurrentJsMind()` → `MindmapService::getCurrentMindmap()`
- [ ] `saveNodeDetails()` & `autoSaveCurrentNodeDetails()` & `saveAllEditingNodeDetails()` → `MindmapService::saveNodeDetails()`
- [ ] `resetNodeDetails()` → `UIController` 调用 `MindmapService` 重新获取数据渲染
- [ ] `updateNodeTitle()` & `updateNodeAuthor()` → `MindmapService::updateNodeProperty()`
- [ ] `addTag()` & `removeTag()` & `toggleStatusTag()` → `MindmapService::manageTags()`
- [ ] `setNodeStatus()` → `MindmapService::setNodeStatus()`
- [ ] `updateNodeRelations()` → `MindmapService` 内部处理
- [ ] `focusNodeToWorkspaces()` & `copyNodeTree()` → `MindmapService::focusNode()`

### 存储与文件
- [ ] `autoSaveData()` → `StorageService::saveToLocal()`
- [ ] `loadSavedData()` → `StorageService::loadFromLocal()`
- [ ] `exportToCustomFile()` → `StorageService::exportToFile()`
- [ ] `saveFileWithModernAPI()` & `saveFileWithTraditionalMethod()` → `StorageService` 内部实现
- [ ] `handleFileImport()` → `StorageService::importFromFile()`
- [ ] `checkStorageStatus()` → `StorageService::checkStatus()`

### MD 浏览器 & 模板管理器 (可作为独立模块)
- [ ] `initMdBrowser()` 及相关函数 → `MDBrowser` 类或 `UIController` 的一部分
- [ ] `initializeTemplateManager()` 及相关函数 → `TemplateManager` 类或 `UIController` 的一部分

---

**结论**: 请确认这份实施方案。一旦你同意，我们就可以立刻开始**第一步：准备工作**，创建新的文件结构。 