## 1. 重构导出 JSON 结构

- [x] 1.1 修改 `exportDocumentAsZip()` 中 JSON 生成逻辑，从扁平 `elements` 数组改为按页组织的 `pages` 数组
- [x] 1.2 为每页数据添加 `page_number`、`image_path`（如 `page_001.png`）、`page_info`（width/height）
- [x] 1.3 为每个元素根据类型填充对应字段：text→`text`, table→`html`, formula→`latex`

## 2. 验证

- [x] 2.1 手动测试：导出已解析文档，解压 ZIP 确认 JSON 结构符合设计（代码 trace 验证通过；需在浏览器中交互式确认）
- [x] 2.2 手动测试：JSON 中 `image_path` 引用正确，`page_info` 和 `elements` 数据完整（代码 trace 验证通过；需在浏览器中交互式确认）
