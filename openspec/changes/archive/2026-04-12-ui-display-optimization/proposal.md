## Why

当前标注平台在显示效果和文本解析准确性上存在三个核心痛点：左侧文档图片无法灵活缩放、右侧元素列表在内容较多时无法滚动、OCR 解析结果经常截断导致文本不完整。这些问题直接影响标注员的工作效率和标注质量。

## What Changes

- 左侧面板增加文档图片缩放功能（支持通过 Ctrl+/- 快捷或滑块调节 50%-200%）
- 右侧元素列表添加垂直滚动条，确保大量元素时可完整浏览
- 优化 OCR 裁剪策略，增加边距以提升文本识别完整性
- 调整页面布局样式，确保 Flexbox 滚动行为正常

## Capabilities

### New Capabilities

- `ui-zoom-control`: 文档查看器的缩放控制功能（图片放大缩小、自适应容器）
- `ui-scroll-layout`: 列表滚动条与 Flex 布局优化，修复内容溢出时的滚动问题
- `ocr-crop-optimization`: 优化 OCR 裁剪逻辑，增加边缘边距以提升识别准确率

### Modified Capabilities

（无修改的已有能力）

## Impact

- **前端**：`LeftPanel.tsx`（缩放逻辑）、`annotation.css`（布局修复）、`TopBar.tsx`（缩放控件）
- **后端**：`api_ocr.py`（裁剪边距调整）
- **用户交互**：新增缩放快捷键/控件，不影响现有标注流程
