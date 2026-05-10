## Why

当前左右面板已实现选中状态同步（共享 `selectedElementId`），但选中元素后需要手动滚动另一侧面板才能看到对应元素。两个面板之间缺乏自动滚动对齐，降低了标注效率。

## What Changes

- **左 → 右**: 点击左侧 PDF 覆盖层上的 bbox → 右侧元素列表自动滚到对应元素卡片（垂直居中）
- **右 → 左**: 点击右侧元素卡片 → 左侧 PDF 视图自动滚到对应 bbox（居中显示）
- 使用 `scrollIntoView({ block: 'center' })` 实现平滑滚动

## Capabilities

### New Capabilities

- `scroll-sync`: 左右面板点击元素时自动滚动对齐，确保两个面板同时定位到同一元素

### Modified Capabilities

无

## Impact

- `components/left-panel/LeftPanel.tsx`: bbox onClick 后触发右侧滚动
- `components/right-panel/RightPanel.tsx`: ElementCard onClick 后触发左侧滚动
- 不涉及 store、类型、API 变更
