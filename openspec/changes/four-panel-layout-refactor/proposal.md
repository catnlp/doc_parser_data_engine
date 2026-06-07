## Why

当前两栏式布局（PDF + 右侧面板Tab）无法满足文档伴随阅读场景的需求：用户需要在浏览文档的同时查看解析结果、AI翻译、Markdown渲染，并与AI助手对话。页面导航依赖顶部页码输入，缺少缩略图预览和标题跳转。界面空间利用不足，四栏模式能提供更高效的文档工作台体验。

## What Changes

- **界面布局重构**：从两栏式弹性布局升级为四栏式弹性布局，支持面板间拖拽调整宽度
- **P1 缩略图导航**：新增页面缩略图列表 + 文档目录（TOC），与 P2 文档视图双向联动
- **P2 文档连续滚动**：页面以连续流方式纵向排列，滚动到页面边界自动翻页；标注工具改为浮动工具栏覆盖层；元素点击选中用于 AI 上下文
- **P3 结果展示面板**：多 Tab 动态视图（解析结果/翻译/Markdown/对比），可独立浏览或接收来自 P4 的 AI 结果
- **P4 AI 聊天面板**：上下文感知的聊天界面，AI 回复可一键路由到 P3 对应 Tab 展示
- **Store 精简**：移除 `viewMode` 和 `toolMode`，新增 `activeResultView`、`chatMessages`、`selectedContent`
- **TopBar 精简**：移除标注/阅读模式切换、框选/选择工具按钮，保留翻页、缩放、导出
- **废弃旧组件**：`LeftPanel.tsx`、`RightPanel.tsx`、`ReadMode.tsx`、`ResizableSplit.tsx`、`BottomNav.tsx` 被新组件替代
- 标签/导航按钮改为**纯中文**

## Capabilities

### New Capabilities

- `four-panel-layout`: 四栏弹性布局组件，支持三个可拖拽分隔条，面板间独立滚动
- `thumbnail-navigator`: 页面缩略图列表与文档目录（TOC），与文档视图双向联动同步
- `continuous-page-scroll`: 连续页面滚动视图，支持虚拟窗口渲染（仅渲染前后3页），滚动到边界自动翻页
- `result-panel`: 多Tab结果展示面板，支持解析结果、翻译、Markdown渲染、原文/译文对比视图
- `chat-panel`: AI聊天面板，上下文感知（包含当前页内容和选中元素），回复可路由到结果面板

### Modified Capabilities

- `scroll-sync`: 从元素/分块滚动居中 → 缩略图视角同步 + 页面级位置联动

## Impact

- **前端组件**：新增 5 个组件（`FourPanelLayout`, `ThumbnailNavigator`, `DocViewer`, `ResultPanel`, `ChatPanel`），修改 `AnnotateScreen` 和 `TopBar`，废弃 5 个旧组件
- **Store**：`useAnnotationStore` 新增 3 个状态字段，移除 2 个旧字段
- **CSS**：新增约 300 行四栏布局和面板样式
- **无后端变更**：复用现有 `/api/ai/action` 和 `/api/convert` 端点
- **BREAKING**：移除标注/阅读模式切换，标注工具改为 P2 浮动覆盖层
