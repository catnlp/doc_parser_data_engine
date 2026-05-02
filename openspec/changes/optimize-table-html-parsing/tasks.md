## 1. API 配置

- [x] 1.1 在 `src/api/config.ts` 中新增 `tableApi` 配置项（url 默认 `http://192.168.3.10:8899`，endpoint `/table/file`，timeout 60000，enabled 从 `VITE_USE_TABLE_API` 读取）
- [x] 1.2 更新 `.env.example`，新增 `VITE_USE_TABLE_API=true` 和 `VITE_TABLE_API_URL=http://192.168.3.10:8899`

## 2. 核心实现

- [x] 2.1 在 `src/utils/parsePdf.ts` 中新增 `callRemoteTableApi(croppedImageBase64: string)` 函数，复用 `base64ToBlob()` 以 `multipart/form-data` 上传至 `/table/file`，解析返回的 `tables[0].html`
- [x] 2.2 修改 `processPage` 函数：在 equation 分离的基础上增加 table 分离，table 元素并行调用表格 API，失败时降级本地 OCR
- [x] 2.3 表格 API 返回的 HTML 写入结果元素的 `html` 字段，同时 `markdown` 字段保留降级文本

## 3. 前端验证

- [x] 3.1 确认 `RightPanel.tsx` 中 `RenderedContent` 对 `table` 类型的 HTML 渲染逻辑无需修改（已使用 `DOMPurify.sanitize(element.html)`）
- [x] 3.2 运行 `npx tsc --noEmit` 确认零类型错误
- [x] 3.3 运行 `npm run build` 确认构建成功
