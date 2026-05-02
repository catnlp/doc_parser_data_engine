## Why

当前解析 pipeline 对表格（table）类型元素统一使用 PaddleOCR 进行文字识别，返回的是纯文本列表，丢失了表格的行列结构和 HTML 语义。Windows OCR 服务 v5 新增了 `/table/file` 端点，可独立识别表格并返回标准 HTML 代码（含 `<table>`、`<thead>`、`<tbody>`、`<tr>`、`<td>` 等结构），前端已有 HTML 渲染能力（DOMPurify + dangerouslySetInnerHTML），可直接展示。

## What Changes

- 新增远程表格 API 配置（`/table/file` 端点）
- 修改 `parsePdf.ts` 解析流程：`table` 类型元素优先调用表格 API，其余类型保持现有 OCR 流程
- 表格 API 返回的 HTML 写入 `PdfElement.html` 字段（前端已支持 HTML 渲染）
- 表格 API 调用失败时降级为本地 OCR（保持兼容）
- 复用已有的 `base64ToBlob()` 和 `cropImageFromBase64()` 工具函数（公式优化变更中已实现）

## Capabilities

### New Capabilities
- `table-html-parsing`: 使用远程 Windows OCR v5 表格 API 识别 table 元素，返回标准 HTML 并由前端渲染

### Modified Capabilities
<!-- 不修改已有 spec -->

## Impact

- `frontend/src/api/config.ts` — 新增 `tableApi` 配置项（URL、endpoint、timeout、enabled）
- `frontend/src/utils/parsePdf.ts` — 新增 `callRemoteTableApi()`，在 processPage 中为 `table` 类型元素增加公式 API 相似的路由逻辑
- `frontend/.env.example` — 补全 `VITE_TABLE_API_URL`、`VITE_USE_TABLE_API` 环境变量
