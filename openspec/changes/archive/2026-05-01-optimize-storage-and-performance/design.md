## Context

当前系统前端使用 `localStorage` 存储完整解析结果（含 `imageBase64` 渲染图），受 5MB 上限限制，多页文档极易溢出。PDF 解析采用逐页串行模式（Layout → OCR 顺序调用），10 页文档耗时约 60-120 秒。后端为单一 `api_ocr.py` 文件，缺少可观测性基础设施。前端存在多处 `any` 类型和 `@ts-ignore`，导出 ZIP 功能缺少错误处理。

## Goals / Non-Goals

**Goals:**
- 将 PDF 渲染图从 localStorage 迁移至 IndexedDB，仅保留轻量元数据于 localStorage
- 实现文档内页面并发解析，可配置并发数，提升 2-3 倍解析速度
- 为导出 ZIP 流程添加完整的错误处理与用户反馈
- 后端新增健康检查端点与结构化请求日志
- 前端代码分割，列表视图与标注视图按需加载
- 消除全部 `any` 类型标注与 `@ts-ignore` 注解

**Non-Goals:**
- 不修改后端 API 接口签名（Layout/OCR 端点保持不变）
- 不引入新的第三方持久化库（IndexedDB 使用原生 API 封装）
- 不改变现有 state 管理架构（仍使用 Zustand）
- 不添加测试（非本次变更范围）

## Decisions

### 1. 存储层：IndexedDB + localStorage 双轨

**决策**: 拆分存储为两层：
- `localStorage`: 文档列表元数据（id, name, pageCount, status, savedAt）及每页布局/OCR 文本结果（不含 imageBase64）
- `IndexedDB`: 所有 `imageBase64` 渲染图，以 `docId + pageIndex` 为 key

**理由**: IndexedDB 按文件存储，无大小上限。localStorage 保留轻量列表元数据可在页面加载时瞬间展示文档列表（无需等待 IndexedDB 异步初始化完成）。

**替代方案评估**:
- ❌ 全部存 IndexedDB：列表加载需异步等待，首屏渲染延迟
- ❌ 维持现状 + 增大截断阈值：治标不治本，大文档仍然丢失

### 2. 并发模型：包内并行、逐页追加

**决策**: 文档内页面以可配置并发数并行处理（默认 3），使用"信号量+队列"模型：
```
parsePdfDocument(docId):
  对每一页并发: renderPage → callLayoutApi → callOcrApi
  每完成一页: updateDocumentStatus(docId, 'parsing', [pageData])  // append to store
  全部完成:  updateDocumentStatus(docId, 'done')
```

**理由**: 页面间无依赖，Layout + OCR 每页可独立发起。逐页追加 store 可让用户看到进度（例如 "3/10 页已完成"），而非等待全部完成。

**替代方案评估**:
- ❌ 全量并发（10 页同时发 30 个 API 请求）：对后端 PaddleOCR 压力过大，可能 OOM

### 3. IndexedDB 抽象：简易 Promise 封装

**决策**: 创建 `utils/idb.ts`，提供 `saveImage(docId, pageIndex, base64)` / `getImage(docId, pageIndex)` / `deleteDoc(docId)` 三个方法。使用原生 IndexedDB API，不引入 `idb`/`dexie` 等第三方库。

**数据库结构**:
```
Database: doc_parser_images v1
ObjectStore: page_images (keyPath: docId_pageIndex)
  key: "{docId}_{pageIndex}"
  value: { imageBase64: string, width: number, height: number }
```

### 4. 错误处理模式：用户可见反馈

**决策**: `exportDocumentAsZip` 内每个可能失败步骤使用 try/catch，通过 `alert()` 向用户反馈具体错误原因（如"页面 3 图表裁剪失败"），而非静默跳过。同时避免使用 `console.error` 作为唯一错误输出。

### 5. 代码分割：视图级 lazy loading

**决策**: 在 `App.tsx` 中使用 `React.lazy()` + `Suspense` 拆分两个视图：
- `ListScreen` → 延迟加载 `PdfListView`、`FolderUpload`
- `AnnotateScreen` → 延迟加载 `LeftPanel`、`RightPanel`（含 CodeMirror、KaTeX）

在 vite.config.ts 中配置 `rollupOptions.output.manualChunks` 将 vendor 库拆分：
- `vendor-pdf`: react-pdf, pdfjs-dist
- `vendor-editor`: codemirror, @codemirror/*
- `vendor-markdown`: react-markdown, katex, remark-*, rehype-*

### 6. 后端改动：最小侵入

**决策**: 在当前 `api_ocr.py` 中直接追加健康检查端点和日志中间件。不拆分为多文件模块——后端改进优先做影响大的低成本改动。

**健康检查端点**: `GET /api/health` 返回 `{"status": "ok", "models":{"ocr":"loaded","layout":"loaded"}}`

**请求日志中间件**: 使用 FastAPI middleware 记录 method/path/status/duration，输出为结构化 JSON 行。

### 7. 类型安全：零容忍 any/@ts-ignore

**决策**: 逐一替换所有 `any` 为具名类型或 `unknown` + 类型守卫：
- `RightPanel.tsx` element → 使用 `PdfElement` 类型
- `models.ts` ocrJson → 定义 `OcrResponse` 接口替代 `as any`
- `parsePdf.ts` @ts-ignore → 使用 `(page.render as (params: RenderParams) => RenderTask)` 断言

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| IndexedDB 在隐私模式下不可用 | try/catch 降级为内存存储，仅对当前会话可用 |
| 并发解析增加后端负载 | 默认并发数 3，环境变量可调；后端 PaddleOCR 单个实例串行处理 |
| `React.lazy` 可能影响开发体验（HMR 闪动） | 仅在 `vite build` 时生效，开发模式下直接 import |
| 图片裁剪失败时导出部分成功 | 收集失败列表，全部完成后统一提示用户 |

## Migration Plan

1. `npm run build` 验证无 TS 错误
2. 前端部署：刷新后 localStorage 旧数据仍可读取（`loadFromLocalStorage` 兼容），新增解析结果写入 IndexedDB
3. 旧 localStorage 数据不自动迁移——用户重新解析后自动切换至 IndexedDB
4. 后端：直接替换容器镜像，无数据库迁移

## Open Questions

- 并发数 3 是否足够？可根据后端 PaddleOCR 内存压力后续调优
- IndexedDB 旧图片是否需要定期清理？（当前靠 `removeDocument` 触发删除即可）
