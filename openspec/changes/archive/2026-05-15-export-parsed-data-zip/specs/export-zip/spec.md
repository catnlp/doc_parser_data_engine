## MODIFIED Requirements

### Requirement: 列表页导出 ZIP
系统 SHALL 为每条"解析完成"的文档提供"导出 ZIP"按钮，点击后生成并下载包含该文档所有页标注数据和图片的 ZIP 文件。ZIP 中 MUST 包含：
- 每页整页图片文件 `page_NNN.png`
- 解析结果 JSON 文件，包含文档名称、总页数、每页的图片路径引用、页面尺寸和完整元素信息（类型、坐标、OCR 文本、LaTeX、HTML、排序）
- 可选：裁剪的 figure/table 图片

#### Scenario: 导出单份文档
- **WHEN** 用户点击"导出 ZIP"按钮
- **THEN** 生成 ZIP 文件，包含 `page_NNN.png` 整页图片 + `result.json` 解析结果
- **THEN** `result.json` 中每页数据包含 `image_path`、`page_info`、`elements` 数组
- **AND** 浏览器自动下载 `{文档名}.zip`

#### Scenario: 导出元素信息完整性
- **WHEN** 文档包含 text、table、formula 等多种类型元素
- **THEN** 导出 JSON 中 text 类型元素包含 `text` 字段
- **AND** table 类型元素包含 `html` 字段
- **AND** formula 类型元素包含 `latex` 字段
