## 1. 修改解析逻辑支持多页

- [x] 1.1 在 useDocumentListStore 中添加 setPageCount 方法用于更新文档页数
- [x] 1.2 修改 parsePdfDocument 函数，在解析开始时用 pdf.js 获取 PDF 总页数并更新 pageCount
- [x] 1.3 将 parsePdfDocument 改为循环处理每一页：对每页执行 renderPdfPage -> callLayoutApi -> callOcrApi
- [x] 1.4 将每页的解析结果依次追加到 parsedData 数组中
- [x] 1.5 处理解析失败：任何一页出错均标记整个文档为 error 状态

## 2. 修改标注页面支持多页

- [x] 2.1 修改 AnnotateScreen 的 loadDocument 函数，将 totalPages 从硬编码 1 改为 doc.parsedData.length
- [x] 2.2 将 pdfInfo、pageInfo、renderedPages 数组从单元素扩展为按页填充的多元素数组
- [x] 2.3 确保 handlePageChange 和 BottomNav 的页码按钮在 totalPages > 1 时正常工作（已有代码支持动态 totalPages）
- [x] 2.4 验证 TopBar 的上一页/下一页按钮在 totalPages > 1 时根据当前页正确启用/禁用（已有代码支持动态 totalPages）

## 3. 列表视图显示页数

- [x] 3.1 确保解析中的文档能动态显示 pageCount（从 0 更新为实际页数）—— setPageCount 触发 Zustand 状态更新，PdfListView 自动重渲染
- [x] 3.2 验证已完成解析的文档在列表中正确显示总页数—— parsedData.length == totalPages，pageCount 已正确设置
