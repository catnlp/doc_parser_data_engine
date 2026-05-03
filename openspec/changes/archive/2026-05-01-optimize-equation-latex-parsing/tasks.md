## 1. API 配置

- [x] 1.1 在 `src/api/config.ts` 中新增 `formulaApi` 配置项（url 默认 `http://192.168.3.10:8899`，endpoint `/formula/file`，timeout 60000，enabled 从 `VITE_USE_FORMULA_API` 读取）
- [x] 1.2 更新 `.env.example`，新增 `VITE_USE_FORMULA_API=true` 和 `VITE_FORMULA_API_URL=http://192.168.3.10:8899`

## 2. 核心实现

- [x] 2.1 在 `src/utils/parsePdf.ts` 中新增 `base64ToBlob()` 工具函数
- [x] 2.2 在 `src/utils/parsePdf.ts` 中新增 `callRemoteFormulaApi(imageBase64: string)` 函数，将 base64 转 Blob 后以 `multipart/form-data` 上传至 `/formula/file`，解析返回的 `formulas[0].latex`
- [x] 2.3 修改 `callOcrApi()` 函数：遍历 `layoutBboxes` 时，对 `category_type === 'equation'` 的元素调用 `callRemoteFormulaApi()`，失败时降级为本地 OCR
- [x] 2.4 公式 API 返回的 LaTeX 写入结果元素的 `latex` 字段，同时 `markdown` 字段保留降级文本

## 3. 前端验证

- [x] 3.1 确认 `RightPanel.tsx` 中 `RenderedContent` 对 `equation` 类型的 KaTeX 渲染逻辑无需修改（已使用 `remark-math` + `rehype-katex` 渲染 `element.latex`）
- [x] 3.2 运行 `npx tsc --noEmit` 确认零类型错误
- [x] 3.3 运行 `npm run build` 确认构建成功
