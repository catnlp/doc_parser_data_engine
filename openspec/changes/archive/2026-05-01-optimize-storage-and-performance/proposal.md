## Why

项目存在三个层面的问题亟需修复：(1) `localStorage` 存储 `imageBase64` 导致多页文档数据溢出丢失，(2) PDF 解析采用串行逐页处理，单份 10 页文档需 60+ 秒，(3) 多处 `any` 类型和 `@ts-ignore` 破坏类型安全，导出功能缺少错误处理导致静默失败。这些问题直接影响数据可靠性与用户体验。

## What Changes

### 数据持久化修复 (P0)
- 将 `parsedData.imageBase64` 从 `localStorage` 迁移至 **IndexedDB** 存储，消除 4MB 溢出风险
- 保留非图片元数据（文档名、页数、布局/OCR 结果）在 `localStorage` 以便快速加载列表
- `savePersisted()` 移除不稳定的 trim 降级逻辑

### 导出错误处理修复 (P0)
- `exportDocumentAsZip()` 添加完整 try/catch 错误处理
- 图片加载失败时（img.onerror）正确抛出错误而非静默忽略

### PDF 解析并行化 (P1)
- 文档内页面支持 N 路并发（Layout + OCR API 请求并行发出，可配置并发数 3-5）
- 解析结果逐页追加至 store，无需等待全部完成才展示进度

### 后端可观测性 (P1)
- 新增 `/api/health` 健康检查端点
- 请求日志增加结构化字段（耗时、状态码、页数）
- 全局异常处理中间件，替代散落的 `traceback.print_exc()`

### 类型安全加固 (P2)
- 消除所有 `any` 类型标注（`RightPanel.tsx` element 参数、`models.ts` 响应类型）
- 处理 `parsePdf.ts` 的 `@ts-ignore` 为正确的 pdfjs 类型断言

### 前端代码分割 (P2)
- `React.lazy()` 拆分 ListScreen 与 AnnotateScreen，分别按需加载依赖
- CodeMirror / KaTeX 等重型库仅在标注视图加载

### 构建配置补全 (P2)
- Vite 配置追加开发代理、`@/` 路径别名、chunk 大小警告
- `.env.example` 补充 `VITE_USE_REMOTE_OCR` 等缺失变量

## Capabilities

### New Capabilities
- `indexeddb-storage`: 使用 IndexedDB 存储 PDF 渲染图片，localStorage 仅保留轻量元数据
- `parallel-parse`: 文档内页面并发解析，可配置并发数，逐页增量更新 store
- `zip-export-error-handling`: 导出 ZIP 功能的完整错误处理与用户提示
- `backend-health-check`: 后端 `/api/health` 端点与结构化请求日志
- `code-splitting`: 基于 React.lazy 的视图级代码分割
- `type-safety-cleanup`: 消除 any 类型与 @ts-ignore 的代码规范要求

### Modified Capabilities
- `list-view-export`: 导出 ZIP 流程增加错误处理 —— 当图片裁剪失败时向用户反馈而非静默跳过。当前仅在 `openspec/changes/list-view-export/` 中定义了成功路径。

## Impact

- `frontend/src/store/useDocumentListStore.ts` — localStorage 逻辑改为 IndexedDB，移除 `savePersisted` trim 回退
- `frontend/src/utils/parsePdf.ts` — 页面并发解析模型，移除 `@ts-ignore`
- `frontend/src/App.tsx` — 懒加载 ListScreen 与 AnnotateScreen
- `frontend/src/components/PdfListView.tsx` — 导出函数错误处理
- `frontend/src/api/models.ts` — 消除 `(ocrJson as any)` 为具名类型
- `frontend/src/components/right-panel/RightPanel.tsx` — `element: any` 改为 `PdfElement`
- `frontend/vite.config.ts` — 追加代理/别名/chunk 警告
- `frontend/.env.example` — 补全环境变量
- `backend/api_ocr.py` — 新增健康检查端点、日志中间件、全局异常处理
