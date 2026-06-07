## 1. Store 重构

- [ ] 1.1 移除 `viewMode`、`toolMode` 状态及相关 setter
- [ ] 1.2 新增 `activeResultView` 状态（类型：'parse' | 'translate' | 'markdown' | 'compare'）
- [ ] 1.3 新增 `chatMessages` 状态（类型：`{ role, content }[]`）
- [ ] 1.4 新增 `selectedContent` 状态，存储当前选中元素的 markdown 内容
- [ ] 1.5 新增 `setActiveResultView`、`addChatMessage`、`clearChat` setter 方法
- [ ] 1.6 新增 `setSelectedContent` setter 方法

## 2. 四栏布局组件

- [ ] 2.1 创建 `FourPanelLayout.tsx`，使用 CSS Grid + state 控制四栏宽度
- [ ] 2.2 实现三个可拖拽分隔条（mousedown/move/up 事件）
- [ ] 2.3 设置面板最小宽度限制（P1:120px, P2:200px, P3:240px, P4:200px）
- [ ] 2.4 每栏使用独立 `overflow-y: auto` 实现独立滚动
- [ ] 2.5 添加 CSS 样式（分隔条 hover/dragging 状态、面板背景色）

## 3. P1 缩略图导航

- [ ] 3.1 创建 `ThumbnailNavigator.tsx`，渲染 `renderedPages` 缩略图列表
- [ ] 3.2 使用 canvas 重绘小尺寸缩略图（约 140px 宽）以节省内存
- [ ] 3.3 实现当前页缩略图高亮（与 Store 中 `currentPage` 同步）
- [ ] 3.4 点击缩略图触发 P2 滚动到对应页面
- [ ] 3.5 从元素中提取 `doc_title`、`paragraph_title` 生成目录（TOC）
- [ ] 3.6 点击目录项触发 P2 滚动到对应位置

## 4. P2 文档连续滚动视图

- [ ] 4.1 创建 `DocViewer.tsx`，以垂直连续滚动方式渲染所有页面
- [ ] 4.2 实现虚拟窗口：仅渲染 `currentPage ± 1` 三页，其余为占位 div
- [ ] 4.3 使用 `IntersectionObserver` 检测可见页（>50% 视为当前页）
- [ ] 4.4 实现滚动到页面边界自动翻页
- [ ] 4.5 复用 bbox overlay 渲染逻辑（SVG polygon + 类别标签）
- [ ] 4.6 实现元素点击选中（设置 `selectedContent` + 高亮）
- [ ] 4.7 创建浮动标注工具栏：[选择][框选][显隐叠加层]
- [ ] 4.8 框选模式激活时锁定页面滚动

## 5. P3 结果展示面板

- [ ] 5.1 创建 `ResultPanel.tsx`，包含 Tab 栏：[解析结果][翻译][Markdown][对比]
- [ ] 5.2 实现 Tab 切换逻辑（`activeResultView` 驱动）
- [ ] 5.3 "解析结果"视图：集成 ChunkList + ElementList
- [ ] 5.4 "翻译"视图：render 当前页翻译内容（Markdown）
- [ ] 5.5 "Markdown"视图：集成现有 MarkdownPreview 逻辑
- [ ] 5.6 "对比"视图：双栏原文/译文对比
- [ ] 5.7 实现 Tab 切换与 P2 当前页联动（翻页时 P3 自动刷新）

## 6. P4 AI 聊天面板

- [ ] 6.1 创建 `ChatPanel.tsx`，包含消息列表和输入框
- [ ] 6.2 实现消息渲染（用户右对齐、AI 左对齐，Markdown 渲染）
- [ ] 6.3 实现上下文指示器（显示当前页码、选中元素类型）
- [ ] 6.4 发送消息时自动附加上下文（当前页内容 + 选中元素 markdown）
- [ ] 6.5 AI 回复底部添加"→查看结果"路由按钮
- [ ] 6.6 点击路由按钮 → 切换 P3 Tab + 加载内容

## 7. 页面整合

- [ ] 7.1 重构 `AnnotateScreen.tsx`：使用 `FourPanelLayout` 替代 `ResizableSplit`
- [ ] 7.2 移除旧组件引用：`LeftPanel`、`RightPanel`、`ReadMode`、`ResizableSplit`、`BottomNav`
- [ ] 7.3 精简 `TopBar.tsx`：移除标注/阅读切换、选择/框选按钮，保留翻页、缩放、导出
- [ ] 7.4 处理页面参数传递（`pdfFile`、`pageNumber`、`renderedImages`）

## 8. 样式与联动

- [ ] 8.1 添加四栏布局 CSS（grid、分隔条、面板样式）
- [ ] 8.2 P1↔P2 双向联动（IntersectionObserver + scrollIntoView）
- [ ] 8.3 P2↔P3 联动（翻页时 P3 刷新内容、点击元素时 P3 定位）
- [ ] 8.4 P2→P4 上下文联动（元素选中更新上下文）
- [ ] 8.5 P4→P3 路由联动（AI 结果跳转 P3 Tab）

## 9. 验证与清理

- [ ] 9.1 TypeScript 编译无错误
- [ ] 9.2 验证四栏拖拽调整宽度正常工作
- [ ] 9.3 验证 P1↔P2 缩略图→文档联动正确
- [ ] 9.4 验证 P4 聊天发送 + P3 路由正常
- [ ] 9.5 验证标注工具（选择/框选）在 P2 浮动工具栏正常工作
- [ ] 9.6 验证大文档（50+页）虚拟窗口渲染性能
- [ ] 9.7 移除不再使用的组件文件和导入
