## Context

当前 `AnnotateScreen` 采用 `ResizableSplit`（两栏）布局：左侧 `LeftPanel`（PDF渲染 + bbox覆盖层）+ 右侧 `RightPanel`（三Tab面板）。阅读模式通过 `ReadMode` 组件替换右侧面板实现。标注工具（选择/框选）和标注/阅读模式切换在 `TopBar` 中。

重构目标：将所有功能整合进统一的四栏弹性布局，移除模式切换的概念。

## Goals / Non-Goals

**Goals:**
- 四栏弹性布局，每栏可独立拖拽调整宽度
- P1 缩略图 + TOC，与 P2 双向联动
- P2 连续页面滚动，虚拟窗口渲染以节省内存
- P3 多Tab结果展示，可独立浏览或接收 P4 路由
- P4 AI 聊天面板，AI 回复可一键路由到 P3
- 标注工具整合为 P2 浮动覆盖层
- 移除旧的 `viewMode`/`toolMode` 状态

**Non-Goals:**
- 不改动后端 API
- 不修改数据解析流水线
- 不新增文档格式支持

## Decisions

### 1. 布局实现：CSS Grid + resize handles

**选择**：使用 CSS `display: grid` + 列宽由 state 控制 + 分隔条监听 mousedown/move/up。

```
grid-template-columns: [state-driven px/fr values]
```

**替代方案**：`react-rnd` 库（已有依赖）提供可拖拽面板，但对四栏场景支持有限，需要自定义逻辑。

**理由**：Grid 布局天然支持弹性（`fr` 单位），结合简单的事件监听即可实现拖拽调整。不引入新依赖。

### 2. P2 虚拟窗口渲染

**选择**：仅渲染 `currentPage - 1`、`currentPage`、`currentPage + 1` 三页。使用 `IntersectionObserver` 检测当前页变化。未渲染页面使用占位 `div` + `content-visibility: auto`。

**替代方案**：渲染全部页面，使用 `content-visibility: auto` 委托浏览器处理。简单但大文档（100+页）内存压力大。

**理由**：PDF 页面图像可能较大（base64），多页渲染内存占用不可控。虚拟窗口确保内存稳定。

### 3. P3 Tab 路由机制

**选择**：P3 有独立 Tab 栏，用户可手动切换。P4 AI 回复中提供"→查看结果"按钮，点击后切换到对应 Tab 并加载内容。

**理由**：保持 P3 和 P4 的独立性，AI 是辅助工具而非主控界面。用户可随时查看解析结果，无需经过 AI 对话。

### 4. P1↔P2 同步策略

**选择**：P1 点击缩略图 → P2 `scrollIntoView`（smooth）。P2 使用 `IntersectionObserver` 监测各页面容器可见比例，>50% 视为当前页 → 更新 P1 高亮。

**理由**：`IntersectionObserver` 性能优于 scroll 事件节流，浏览器原生优化。

### 5. 标注工具整合

**选择**：P2 顶部悬浮工具栏，包含 [选择][框选][显示/隐藏叠加层]。框选模式激活时阻止页面滚动（`overflow: hidden`），在 P2 范围内绘制选区。

**替代方案**：保留单独的标注模式。增加复杂度，与四栏一体化理念冲突。

**理由**：标注是 PDF 视图的本地操作，浮动工具栏比全局模式切换更直观。

### 6. 废弃组件处理

**选择**：`LeftPanel`、`RightPanel`、`ReadMode`、`ResizableSplit`、`BottomNav` 保留源文件但不再被主路由引用。之后可安全删除。

## Risks / Trade-offs

- **[风险] P2 连续滚动 + 大量页面可能卡顿** → 虚拟窗口渲染 + `content-visibility: auto` 缓解
- **[风险] 标注框选与页面滚动冲突** → 框选模式激活时锁定滚动
- **[风险] P1 缩略图加载大量 base64 图像** → 使用小型 canvas 重绘缩略图（而非完整 base64），延迟加载不可见缩略图
- **[权衡] 四栏布局在小屏幕上拥挤** → 设置面板最小宽度（P1: 120px, P2: 200px, P3: 240px, P4: 200px），小于断点时提供折叠按钮
- **[迁移] 旧组件路径变更影响已有导入** → 新组件通过 `AnnotateScreen` 统一入口引用，一次性切换

## Open Questions

- TopBar 的页面导航是否保留？（P1 已提供缩略图导航）
- P3 "对比"视图（原文/译文 side-by-side）是否需要双栏渲染？
