## 1. 类型安全加固

- [x] 1.1 新建 `src/api/models.ts` 中 `OcrResponse` 接口，替换 `ParseResult` 中的 `(ocrJson as any)` 为 `OcrResponse` 类型
- [x] 1.2 修改 `RightPanel.tsx` 中 `ElementCard` 的 `element: any` → `element: PdfElement`，移除所有 `any` 参数类型
- [x] 1.3 修改 `useAnnotationStore.ts` 中 `loadDocumentFromApi` 方法的 `(ocrJson as any)` → `OcrResponse` 类型
- [x] 1.4 修改 `parsePdf.ts:24` 移除 `@ts-ignore`，使用 `(page.render as (params: RenderParameters) => RenderTask)` 显式类型断言
- [x] 1.5 修改 `FolderUpload.tsx:86` 移除 `{...({ webkitdirectory: '' } as any)}`，使用接口扩展
- [x] 1.6 运行 `npx tsc --noEmit` 确认零类型错误

## 2. 后端可观测性

- [x] 2.1 在 `api_ocr.py` 中新增 `GET /api/health` 端点，返回 OCR/Layout 模型加载状态
- [x] 2.2 新增 FastAPI middleware 实现结构化请求日志（method/path/status/duration），排除 `/api/health`
- [x] 2.3 新增全局异常处理中间件，替换端内 `traceback.print_exc()` 为结构化日志 + 通用 500 响应
- [x] 2.4 验证：`curl http://localhost:8002/api/health` 返回模型状态 JSON

## 3. IndexedDB 存储迁移

- [x] 3.1 新建 `src/utils/idb.ts`，封装 IndexedDB 操作：`openDB()`、`saveImage()`、`getImage()`、`deleteDocImages()`
- [x] 3.2 新建 `src/types/storage.ts`，定义 `StoredImage` 和 `PersistedDocMeta`（不含 imageBase64）接口
- [x] 3.3 修改 `useDocumentListStore.ts` 的 `savePersisted()` —— 写入 localStorage 前剥离 `imageBase64`，写入 IndexedDB 图片
- [x] 3.4 修改 `useDocumentListStore.ts` 的 `loadFromLocalStorage()` —— 兼容读取含 `imageBase64` 的旧数据
- [x] 3.5 修改 `useDocumentListStore.ts` 的 `removeDocument()` —— 追加 IndexedDB 清理调用 `deleteDocImages(id)`
- [x] 3.6 修改 `App.tsx` 的 `loadDocument()` —— 进入标注视图时从 IndexedDB 读取 `imageBase64` 组装 `renderedPages`
- [x] 3.7 移除 `savePersisted()` 中不稳定的 trim 降级逻辑（`docs.slice(Math.max(0, ...))`）

## 4. PDF 解析并行化

- [x] 4.1 在 `parsePdf.ts` 中新增 `async function parsePdfDocumentParallel(docId)`，使用信号量模式控制并发数
- [x] 4.2 实现逐页追加 store：每完成一页调用 `updateDocumentStatus(docId, 'parsing', [...existing, newPage])`
- [x] 4.3 替换 `parsePdfDocument` 为并行版本（保留串行版本作为 `MAX_CONCURRENT=1` 的兜底）
- [x] 4.4 在 `useDocumentListStore.ts` 中新增 `parsedPages` 字段，支持列表页展示 "3/10 页" 进度
- [x] 4.5 在 `PdfListView.tsx` 中文档行展示解析进度文本（如 `🔄 解析中 (3/10)`）
- [x] 4.6 配置 `VITE_PARSE_CONCURRENCY` 环境变量（默认 3），在 `config.ts` 中导出
- [x] 4.7 验证：上传 5 页 PDF，观察解析耗时显著下降、进度实时更新

## 5. 导出 ZIP 错误处理

- [x] 5.1 在 `exportDocumentAsZip` 外层包裹 try/catch，捕获 JSZip 生成异常并 `alert()` 提示
- [x] 5.2 图片加载步骤增加 `img.onerror` 处理 —— 失败时收集错误信息而非静默 `resolve()`
- [x] 5.3 新增裁剪区域有效性检查 —— poly 点数 < 8、宽/高 ≤ 0 时跳过并记录
- [x] 5.4 汇总所有失败信息，导出结束后弹出统一提示（如"导出部分失败：第 3 页图片加载失败…"）
- [x] 5.5 验证：传入无效坐标元素，确认弹窗提示包含具体失败信息

## 6. 代码分割与构建配置

- [x] 6.1 在 `App.tsx` 中使用 `React.lazy(() => import('./ListScreen'))` 拆分 ListScreen，包 `Suspense`
- [x] 6.2 在 `App.tsx` 中使用 `React.lazy(() => import('./AnnotateScreen'))` 拆分 AnnotateScreen
- [x] 6.3 在 `vite.config.ts` 的 `rollupOptions.output.manualChunks` 中配置 `vendor-pdf`、`vendor-editor`、`vendor-markdown` 三个 chunk
- [x] 6.4 在 `vite.config.ts` 中追加 `resolve.alias: { '@': '/src' }` 路径别名
- [x] 6.5 在 `vite.config.ts` 中追加 `server.proxy: { '/api': 'http://localhost:8002' }` 开发代理
- [x] 6.6 在 `vite.config.ts` 中追加 `build.chunkSizeWarningLimit: 500`（KB）
- [x] 6.7 更新 `tsconfig.app.json` 追加 `"paths": { "@/*": ["./src/*"] }` 映射
- [x] 6.8 更新 `.env.example` 补全 `VITE_USE_REMOTE_OCR`、`VITE_REMOTE_OCR_API_URL`、`VITE_PARSE_CONCURRENCY`
- [x] 6.9 验证：`npm run build` 后 dist 目录含独立 vendor chunk，文件体积合理

## 7. 最终验证

- [x] 7.1 运行 `npx tsc --noEmit` 确认全项目零类型错误
- [x] 7.2 运行 `npm run build` 确认构建成功
- [x] 7.3 功能回归：上传 PDF → 解析 → 标注编辑 → 导出 ZIP → 返回列表 → 重新加载页面验证持久化
