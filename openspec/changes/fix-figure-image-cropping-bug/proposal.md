## Why

当前标注页面右侧面板中，`figure` 和 `image` 类型元素的截图无法正常显示。

根本原因：`RightPanel.tsx` 中的 `getCroppedImage` 函数使用 `new Image()` 异步加载图片，但在 `img.onload` 之前就调用了 `ctx.drawImage()`，导致裁剪出的是空白图像。返回的空白 data URL 是 truthy 的，使得 `CroppedFigure` 组件的 `useEffect` 防御逻辑失效（`if (cropped) return;`），正确的异步裁剪永远不会执行。

## What Changes

- 移除 `getCroppedImage` 同步函数，改为纯异步裁剪流程
- `CroppedFigure` 组件始终在 `useEffect` 中执行异步图片裁剪
- 增加缓存机制避免相同元素的重复裁剪计算
- 保持现有 UI 交互不变

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `element-list-content-display`: figure/image 元素应在右侧面板中正确显示从 PDF 页面裁剪的截图预览

## Impact

- `frontend/src/components/right-panel/RightPanel.tsx`：重写 `getCroppedImage` 和 `CroppedFigure` 组件
