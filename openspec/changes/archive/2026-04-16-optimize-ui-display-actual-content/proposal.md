## Why

当前元素列表中每项仅显示截断的 80 字符预览（"..."），用户无法在不点击"元素详情"面板的情况下了解元素实际内容，导致需要频繁切换两个标签页才能完成标注工作流，效率低下。同时"元素详情"面板的编辑功能可以通过内联方式整合至主界面，减少不必要的 UI 层级。

## What Changes

- **列表内容增强**：元素列表卡片内直接展示完整内容（markdown/HTML/latex 渲染后的结果），而非截断文本
- **移除"元素详情"标签页**：从右侧面板中移除独立的元素详情视图
- **内联编辑能力**：选中元素后，在列表卡片内直接展开内容编辑器进行编辑

## Capabilities

### New Capabilities
- `element-list-content-display`: 元素列表展示实际渲染后的内容，支持按元素类型差异化展示（文本渲染、表格渲染、公式渲染、图片展示）
- `inline-element-editing`: 在元素列表卡片内进行内容的预览切换和编辑，替代原有独立详情面板

### Modified Capabilities
<!-- 无现有 spec 需要修改 -->

## Impact

- `frontend/src/components/right-panel/RightPanel.tsx`：移除标签页结构、ElementDetail 组件，增强 ElementList 渲染
- `frontend/src/components/right-panel/TypeSelector.tsx`：可能需要内联到 ElementList
- `frontend/src/components/right-panel/ContentEditor.tsx`：保留并在列表卡片内复用
- `frontend/src/styles/annotation.css`：新增列表卡片展开态、内联编辑态样式
- 现有 store 逻辑无需修改，仅 UI 层重构
