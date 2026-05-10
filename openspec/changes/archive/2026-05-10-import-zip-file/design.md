## Context

当前应用支持将解析完成的 PDF 导出为 ZIP 文件（`{name}.zip`），内含 `result.json`、页面 PNG 图片、切图。用户需要能将此类 ZIP 文件重新导入应用，还原为可编辑的文档。

导出 ZIP 的结构（`exportDocumentAsZip` in `PdfListView.tsx` L23-168）：
```
{docBaseName}/
├── result.json          ← pages, elements, page_info
├── page_001.png ...     ← full page renders
└── images/              ← cropped figures/tables
```

## Goals / Non-Goals

**Goals:**
- 用户点击"导入 ZIP"按钮，选择 `.zip` 文件后，解析并还原为 `PdfDocument` 加入文档列表
- 导入后文档可立即打开标注、编辑，并能二次导出
- 导入的文档自动持久化（localStorage + IndexedDB），刷新后不丢失

**Non-Goals:**
- 不支持导入非本应用导出的 ZIP（格式校验不符时给出明确错误提示）
- 不还原原始 PDF 文件（ZIP 中不含 PDF，标注页将使用页面 PNG 作为渲染源）
- 不合并/去重已有文档（简单策略：同名加后缀）
- 不修改导出逻辑

## Decisions

### 1. 创建独立工具文件 `utils/importZip.ts`

**决定**: 新建 `frontend/src/utils/importZip.ts`，导出 `importDocumentFromZip(file: File): Promise<PdfDocument>`。与导出对称，保持关注点分离。

**替代方案**: 放在 PdfListView 组件内 → 拒绝，组件文件已近 300 行，导入逻辑不轻。

### 2. ZIP → PdfDocument 数据映射

**决定**: 从 `result.json` 和页面图片重建 `ParsedPageData[]`：

| ZIP 中的字段 | PdfDocument / ParsedPageData 映射 |
|---|---|
| `document_name` | `doc.name` |
| `total_pages` | `doc.pageCount = doc.parsedPageCount` |
| `pages[].page_info.width/height` | `ParsedPageData.width / height` |
| `pages[].image_path` → 读取对应 PNG | `ParsedPageData.imageBase64 = data:image/png;base64,{pngBase64}` |
| `pages[].elements[]` | `ParsedPageData.ocrElements[]` |
| 缺失字段（score、demoted、id） | `score: 1.0`（默认满分）、`demoted: false`、`id` 由 loadDocument 生成 |
| `layoutElements`（导出中不包含原始数据）| 设为空数组 `[]` |

**替代方案**: 从 element.poly 重建 layoutElements → 拒绝，element.poly 已足够，不需要重复。

### 3. 文件选择方式

**决定**: 复用 `PdfListView` 中已有的隐藏 `<input type="file">` 模式（类似 `FolderUpload`），添加 `accept=".zip"` 的限制。不引入新的上传组件。

### 4. 导入后文档 ID 生成

**决定**: `imported_{timestamp}_{randomSuffix}`，确保不与已有文档冲突。

### 5. 导入结果反馈

**决定**: 成功时用现有 `alert` 提示"导入成功：{name}"（后续可统一改为 toast），失败时提示具体原因（格式无效/文件损坏/不是本应用的导出文件）。

**替代方案**: toast 通知 → 属于更大范围的 UI 改进，不在此变更中做。

### 6. 同名文档处理

**决定**: 检查 `documents` 中是否已有同名文档。若有，在名称后追加 `(导入 N)`，N 为递增数字。不做合并/替换。

### 7. 不依赖 File 对象（导入文档无原始 File）

**决定**: 导入的 `PdfDocument.file` 设为 `new File([], name)` 空占位。标注页靠 `renderedPages`（含 imageBase64）渲染，不依赖原始 PDF File。

## Risks / Trade-offs

- **[风险] 大 ZIP 文件解压耗内存** → 导入时显示加载状态（已有模式），JSZip 单线程处理。若未来有 100MB+ ZIP 需求，考虑 Web Worker 解压
- **[风险] result.json 格式变化导致旧导出无法导入** → 添加 schema 版本字段到 result.json？当前跳过，格式稳定；导入时用字段校验容错（缺失字段给默认值）
- **[取舍] layoutElements 丢失** → 导出时未包含 layoutElements 数组，导入后标注页的 bbox 覆盖层仅基于 ocrElements。若需完整还原，应修改导出逻辑加入 layoutElements — 但这是另一个变更
- **[取舍] 切图（images/ 目录）不导入** → 切图在标注时按需从 page image 裁剪，无需单独导入
