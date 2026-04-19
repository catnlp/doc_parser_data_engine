## Context

当前系统解析 PDF 时，`parsePdfDocument()` 函数仅调用一次 `renderPdfPage(doc.file)`，默认渲染第1页，然后调用 Layout API + OCR API，将单页结果存入 `parsedData` 数组。`AnnotateScreen` 加载该文档时，硬编码 `totalPages: 1`，只索引 `parsedData[0]`。

技术栈：
- PDF 渲染：`react-pdf` (pdf.js)，支持 `pdf.getNumPages()` 和 `pdf.getPage(n)`
- Layout/OCR API：以图片 base64 为单位调用，天然支持多页
- 状态管理：`ParsedPageData[]` 数组已存在，但只填充1个元素

## Goals / Non-Goals

**Goals:**
- 解析阶段处理 PDF 的每一页，生成 `parsedData[0..N-1]`，包含每页的图片、布局元素和 OCR 文本
- 标注页面根据文档实际页数动态设置 totalPages，用户可通过 TopBar 和 BottomNav 翻页浏览每一页
- 每页的标注数据（elements、image、pageInfo）独立存储和渲染
- 列表视图显示文档总页数（`pageCount > 0`）
- 并发解析时控制内存：单文档的多页按顺序解析，不并行

**Non-Goals:**
- 不在标注页之间保留跨页的标注数据共享或迁移
- 不修改 Layout/OCR API 接口（保持按页调用）
- 不实现缩略图预览侧边栏
- 不修改后端代码（后端无状态，天然支持多页）

## Decisions

### 1. 解析策略：逐页顺序 vs 并发多页
决策：单文档内逐页顺序解析（同一 PDF 的各页不并发），但多个 PDF 之间仍保持并发队列。
理由：
- 每页渲染需创建 canvas 和 ArrayBuffer，10页并发可能触发浏览器 OOM
- Layout+OCR 均为同步 await 调用，同一文档顺序处理不影响跨文档并发
- 实现简单：在 `parsePdfDocument` 中 for 循环即可

### 2. 获取总页数：File vs pdf.js
决策：使用 pdf.js 的 `pdf.getNumPages()` 获取实际页数，在 `parsePdfDocument` 开始时调用一次。
理由：
- 浏览器 File API 无法直接获取 PDF 页数
- pdf.js 已作为项目依赖
- 解析开始时统一获取，更新 `pageCount` 用于 UI 显示

### 3. 多页解析失败：部分失败 vs 全部失败
决策：任何一页解析失败均标记整个文档为 error 状态。
理由：
- 简化状态管理，避免 "部分页成功，部分页失败" 的复杂状态
- 标注页需要完整的页面数据，缺少任一页将导致页码跳转报错
- 如确需部分成功，可后续增加 `pageStatus: ('done'|'error')[]` 字段

### 4. 标注 store 数据结构
决策：将 `pdfInfo`、`pageInfo`、`renderedPages` 从单元素数组扩展为多元素数组，每个元素对应一页。
理由：
- 现有 store 接口已经是数组形式（`PdfInfo[]`、`PageInfo[]`），只需填充多元素
- 页码切换逻辑（`pdfInfo[currentPage-1]`）天然支持多页
- 最小改动原则

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 100+ 页PDF 逐页解析导致整体耗时过长 | 并发队列仅允许3个文档同时解析，单文档页面数无上限但单页耗时约2-5秒，总耗时可控；可在列表页显示页级进度 |
| 渲染多页时内存占用过高 | 逐页顺序解析，每页解析完后释放 canvas；标注页的 `renderedPages` 仅存储 base64 字符串，每页约数百KB |
| 中途切换文档导致前一个文档的解析被中断 | 单文档顺序解析天然不会中断；并发队列中的文档各自独立 |
| 后端 API 对大尺寸页面响应慢 | 保持现有缩放比例（2.0x），不增加分辨率 |

## Migration Plan

纯前端改动，无需后端配合。部署后用户刷新页面即生效。回滚只需替换旧 bundle。
