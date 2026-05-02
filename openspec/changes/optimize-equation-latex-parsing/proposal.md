## Why

当前解析 pipeline 对公式（equation）类型元素统一使用 PaddleOCR 进行文字识别，返回的是纯文本（如 "E = mc2"），丢失了公式的结构化语义（上下标、分式、积分等）。Windows OCR 服务 v5 新增了 `/formula/file` 端点，可独立识别公式并返回标准 LaTeX 表达式（如 `E = mc^{2}`），前端已有 KaTeX 渲染能力，可直接展示。

## What Changes

- 新增远程公式 API 配置（`/formula/file` 端点）
- 修改 `parsePdf.ts` 解析流程：`equation` 类型元素优先调用公式 API，其余类型保持现有 OCR 流程
- 公式 API 返回的 LaTeX 写入 `PdfElement.latex` 字段（前端已支持 KaTeX 渲染）
- 公式 API 调用失败时降级为本地 OCR（保持兼容）
- 图片从 base64 转为 blob 以适配 multipart/form-data 上传格式

## Capabilities

### New Capabilities
- `formula-latex-parsing`: 使用远程 Windows OCR v5 公式 API 识别 equation 元素，返回标准 LaTeX 并由前端渲染

### Modified Capabilities
<!-- 不修改已有 spec，仅新增能力 -->

## Impact

- `frontend/src/api/config.ts` — 新增 `formulaApi` 配置项（URL、endpoint、timeout、enabled）
- `frontend/src/utils/parsePdf.ts` — 新增 `callRemoteFormulaApi()`，修改 `callOcrApi()` 中 equation 元素的路由逻辑
- `frontend/.env.example` — 补全 `VITE_FORMULA_API_URL`、`VITE_USE_FORMULA_API` 环境变量
