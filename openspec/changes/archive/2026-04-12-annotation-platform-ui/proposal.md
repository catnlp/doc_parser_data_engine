## Why

当前文档解析模型的训练数据存在**覆盖度不足**和**标注质量悖论**两大瓶颈（详见 `openspec/docs/文档解析数据工程方案.md`）。要解决这些问题，需要一个专门的**标注平台**来：

1. **可视化校验模型预标注结果**：将 PP-DocLayoutV3 的版面检测结果和 PaddleOCR-VL 1.5 的元素解析结果以可视化方式呈现给标注员
2. **支持交互式修正**：标注员可以调整 bbox 边界、修改元素类型、拖拽调整阅读顺序，修改后自动触发重新解析
3. **产出高质量训练数据**：标注完成后的数据直接导出为 OmniDocBench 标准 JSON 格式，用于模型训练

该平台是整个文档解析数据工程的**人机协同关键节点**，承载数据引擎管线（DDAS 采样 → CMCV 分层 → 标注增强）的人工介入环节。

## What Changes

本项目将创建一个基于 React + TypeScript 的前端标注平台，主要能力包括：

- **PDF/图片渲染**：左侧面板渲染原始文档，叠加彩色 bbox 显示版面检测结果
- **Bbox 交互**：hover 高亮、点击选中、拖拽调整边界、创建新 bbox
- **内容展示与编辑**：右侧面板以 Markdown 预览/源码双模式展示元素解析结果，支持编辑
- **阅读顺序调整**：右侧列表拖拽排序，实时更新左侧序号
- **重新解析流程**：bbox 修改后触发 PaddleOCR-VL 重新解析，展示新旧结果对比
- **翻页导航**：底部数字导航条 + 脏状态标记
- **数据导出**：导出为 OmniDocBench 标准 JSON 格式

## Capabilities

### New Capabilities

- `annotation-viewer`: PDF/图片文档渲染与版面 bbox 可视化叠加层（左侧面板）
- `annotation-editor`: 元素解析结果展示、编辑与源码切换（右侧面板）
- `bbox-manipulation`: Bbox 的创建、拖拽修正、类型修改、删除操作
- `reading-order-management`: 阅读顺序的拖拽排序、调整与可视化序号
- `reparse-pipeline`: Bbox 修改后触发重新解析、对比视图、结果确认
- `page-navigation`: 页面上下翻页、底部数字导航、脏状态提示
- `data-export`: 标注数据导出为 OmniDocBench 标准 JSON 格式

### Modified Capabilities

（无修改的已有能力）

## Impact

- **前端技术栈新增**：react-pdf、react-markdown、KaTeX、CodeMirror、@dnd-kit、Zustand 等依赖
- **后端 API 新增**：需要 `/api/reparse` 接口接入 PaddleOCR-VL 1.5 解析管线
- **数据格式依赖**：输入数据格式严格对齐 OmniDocBench（`pdf_info` + `page_info`）
- **不影响已有**：数据工程方案的数据获取、难度分层、训练策略等管线不受影响
