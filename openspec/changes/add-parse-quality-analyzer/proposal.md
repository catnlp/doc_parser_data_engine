## Why

当前系统解析完 PDF 后，用户只能看到元素列表，无法判断解析质量好坏——哪些页的 OCR 置信度低、多少公式/表格识别失败被降级、是否有空白元素漏检。后端已返回每元素的布局置信度（`score`）和 OCR 置信度（`confidence`），但前端丢弃了 OCR 置信度字段，且没有任何分析展示界面。

## What Changes

- **数据管线**：修复 `parsePdf.ts` 中 `callLocalOcrApi` 返回类型，保留后端返回的 `confidence` 字段，传入 `ocrElements`
- **列表页**：每条已完成文档卡片展示解析质量摘要（平均置信度、降级元素数、空白元素数）
- **标注页**：右侧面板新增"解析分析" Tab，展示当前页的详细质量指标（布局置信度分布、OCR 置信度分布、元素类型统计、降级详情）

## Capabilities

### New Capabilities

- `parse-quality-display`: 在列表页和标注页展示解析质量指标，包括文档级摘要和页面级详情
- `data-pipeline-confidence`: 前端数据管线保留并传递每元素的 OCR 置信度（`confidence`）字段

### Modified Capabilities

<!-- 无已有 spec 需要修改 -->

## Impact

- **parsePdf.ts**: `callLocalOcrApi` 返回类型 + `ocrElements` 构造逻辑 — 增加 `confidence` 字段
- **types/document.ts**: `ParsedPageData.ocrElements` 类型 — 增加可选 `confidence?: number`
- **PdfListView.tsx**: 新增文档质量摘要组件
- **styles/document-list.css**: 新增质量摘要行样式
- **RightPanel.tsx**: 新增 Tab 切换 + `ParseQualityPanel` 组件
- **styles/annotation.css**: 新增分析面板样式
