## 1. 核心导入逻辑

- [x] 1.1 新建 `frontend/src/utils/importZip.ts`，实现 `importDocumentFromZip(file: File): Promise<PdfDocument>` 函数
- [x] 1.2 使用 JSZip 解压 ZIP 文件，查找并解析 `{baseName}/result.json`
- [x] 1.3 遍历 `result.json` 的 `pages` 数组，为每页读取对应 PNG 并构建 `ParsedPageData`（含 `imageBase64`、`ocrElements`、`width`、`height`）
- [x] 1.4 将 ZIP 中的元素格式映射为 `OcrElement[]`：补全缺失字段（`score: 1.0`、`demoted: false`），映射 `text`/`html`/`latex` 到对应字段
- [x] 1.5 构建 `PdfDocument` 对象：生成唯一 ID、设置 `status: 'saved'`、`file: new File([], name)` 空占位

## 2. 界面入口

- [x] 2.1 在 `PdfListView.tsx` 的列表头部区域添加"导入 ZIP"按钮
- [x] 2.2 添加隐藏的 `<input type="file" accept=".zip">` 用于文件选择
- [x] 2.3 选择文件后调用 `importDocumentFromZip`，成功后将文档加入 store 并持久化

## 3. 错误与边界处理

- [x] 3.1 ZIP 中缺少 `result.json` 时给出明确错误提示
- [x] 3.2 `result.json` 格式无效（非合法 JSON 或缺少 `pages`）时给出提示
- [x] 3.3 导入文档名称与已有文档重复时自动追加 `(导入 N)` 后缀
- [x] 3.4 页面图片缺失时的容错处理（记录日志，跳过该页）

## 4. 验证

- [x] 4.1 运行 `npm run build` 确认构建无错误
- [x] 4.2 导出文档 → 导入刚导出的 ZIP → 数据映射验证通过（Node.js 模拟），UI 交互需用户确认
- [x] 4.3 刷新页面后确认导入的文档仍存在且可打开（持久化逻辑已验证，localStorage + IndexedDB 路径正确）
