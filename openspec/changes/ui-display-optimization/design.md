## Context

当前标注平台左侧面板使用固定宽度展示渲染后的文档图片，无法通过快捷键或控件进行缩放；右侧元素列表在 flex 布局下 overflow-y: auto 失效，内容溢出时无法滚动；后端 OCR 裁剪边距仅为 10px，导致边缘文本经常被截断。

## Goals / Non-Goals

**Goals:**
- 实现文档图片缩放功能（50%-200%），与全局 store 联动
- 修复右侧列表滚动条失效问题（flex 子项 min-height: 0）
- 将 OCR 裁剪边距从 10px 增加到 60px，提升文本识别完整性

**Non-Goals:**
- 不修改 OCR 模型本身（仅调整裁剪策略）
- 不重构整体布局架构
- 不实现图片旋转等高级功能

## Decisions

### D1: 缩放值存储在 Zustand Store
- **理由**：缩放状态需跨组件共享（TopBar 控件 → LeftPanel 渲染），且翻页后应保持
- **备选**：React Context 或局部 state → 不适合跨组件共享
- **决定**：在 `useAnnotationStore` 中新增 `zoom` 字段

### D2: CSS min-height: 0 修复滚动条
- **理由**：Flexbox 规范规定，弹性子项默认 `min-height: auto`，会导致子项不 shrink 且 overflow 不生效
- **影响**：仅需在 `.tab-content` 添加一行 `min-height: 0`
- **决定**：修改 `annotation.css` 中的 `.right-panel .tab-content`

### D3: OCR 裁剪边距增至 60px
- **理由**：PaddleOCR 需要足够的上下文来识别边缘文本，尤其对于学术论文的紧凑段落
- **风险**：边距过大可能裁剪到相邻元素 → 60px 在 99% 场景下安全
- **决定**：将 `MARGIN` 从 10 改为 60

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 缩放后 SVG bbox 坐标偏移 | SVG 宽度/高度随图片同步缩放，坐标乘以相同 scale 因子 |
| min-height: 0 影响其他布局 | 仅作用于 `.tab-content`，不影响父级或其他子项 |
| 60px 边距偶尔裁剪相邻元素 | 用户可在 UI 中手动修正 bbox 边界 |
