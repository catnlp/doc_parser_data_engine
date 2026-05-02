## 1. 删除 TopBar 导出

- [x] 1.1 删除 TopBar.tsx 中的 handleExport 函数及"📦 导出"按钮
- [x] 1.2 删除 TopBar 导入中不再使用的 JSZip

## 2. PdfListView 新增导出功能

- [x] 2.1 新增 exportDocumentAsZip 函数：遍历 parsedData 生成 annotations.json + 每页渲染图 + 裁剪 figure/table 图片
- [x] 2.2 在"解析完成"文档行的操作按钮区添加"导出 ZIP"按钮
- [x] 2.3 添加 document-list.css 导出按钮样式 (复用 action-btn)
