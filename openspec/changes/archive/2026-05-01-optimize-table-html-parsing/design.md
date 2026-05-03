## Context

此前 `optimize-equation-latex-parsing` 变更已为公式识别实现了 `base64ToBlob()`、`cropImageFromBase64()` 等基础工具函数和 equation 元素的路由逻辑。本次变更在此基础上，将表格（table）类型元素也接入 Windows OCR v5 的专用识别端点。

当前 processPage 中，equation 已通过公式 API 路由，table 仍走通用 OCR 流程返回纯文本。Windows OCR v5 提供 `/table/file` 端点，可返回结构化 HTML（`<table>` 含 thead/tbody/tr/td），前端已有 DOMPurify 安全渲染。

## Goals / Non-Goals

**Goals:**
- 解析时对 `table` 类型元素调用远程表格 API，获取 HTML 结构
- HTML 写入 `PdfElement.html`，前端渲染为可视化表格
- 表格 API 不可用时降级为本地 PaddleOCR（保持兼容）
- 复用已有的 `base64ToBlob()` 和 `cropImageFromBase64()` 工具函数

**Non-Goals:**
- 不新增独立工具函数（复用公式变更已实现的基础函数）
- 不修改后端 `api_ocr.py`
- 不修改前端 HTML 渲染逻辑（RightPanel 已支持）

## Decisions

### 1. 复用公式变更的工具函数

**决策**: 表格 API 调用直接使用 `cropImageFromBase64()` 裁剪 + `base64ToBlob()` 转 Blob 上传，不重复实现。

**理由**: 公式和表格的上传格式完全相同（multipart/form-data + PNG），仅 API 端点和响应字段不同。

### 2. 表格路由与公式路由并列

**决策**: 在 processPage 中，将 `table` 与 `equation` 一同从 `nonEqBboxes` 中分离，独立调用表格 API。两种元素类型各自并行处理各自的 API 调用。

```typescript
// 分离: 非 eq 且 非 table → 通用 OCR
// table → 表格 API 并行处理
// equation → 公式 API 并行处理（已有）
```

**理由**: 表格和公式各有专门 API，分开处理可最大化识别质量。

### 3. 表格 API 响应格式

**决策**: 表格 API 返回 `{"success": true, "tables": [{"html": "...", "texts": [...], "region_id": 0}]}`，提取 `tables[0].html` 写入 `PdfElement.html`。同时保留 `texts` 数组作为降级纯文本。

**理由**: HTML 提供完整表格结构，texts 可用于搜索/导出等不需要渲染的场景。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 表格 API 返回的 HTML 包含不安全内容 | 前端渲染时已使用 DOMPurify.sanitize() |
| 合并 equation + table 路由增加 processPage 复杂度 | 抽取为独立函数简化流程 |

## Migration Plan

1. 更新 `config.ts` 和 `.env.example`
2. 修改 `processPage` 增加 table 路由
3. 刷新页面即生效，`VITE_USE_TABLE_API=false` 可回滚
