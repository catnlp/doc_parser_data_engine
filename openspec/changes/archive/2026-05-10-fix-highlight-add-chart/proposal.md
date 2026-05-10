## Why

两个体验问题：
1. PDF 覆盖层上元素高亮使用 8 位十六进制颜色（如 `#3B82F630`），部分浏览器/渲染环境下可能渲染异常或显示为深色背景。改用 `rgba()` 格式确保透明效果一致。
2. `chart` (图表) 类型未支持。后端可返回 chart 元素，前端应像 `figure`/`image` 一样用裁切图展示。

## What Changes

- 将 LeftPanel 中 bbox 填充色从 `${color}30` 格式改为 `rgba(r, g, b, alpha)` 格式
- 新增 `chart` 元素类型：颜色、标签、图标、元素类型列表、右侧面板渲染（复用 CroppedFigure）

## Capabilities

### New Capabilities

- `chart-element-type`: chart 类型元素，渲染方式与 figure/image 一致（裁切图展示）

### Modified Capabilities

无

## Impact

- 受影响文件：`components/left-panel/LeftPanel.tsx`（填充色格式）、`constants/elementTypes.ts`（新增 chart 条目）、`components/right-panel/RightPanel.tsx`（chart 渲染分支）
- 不涉及后端、存储、导出格式变更
