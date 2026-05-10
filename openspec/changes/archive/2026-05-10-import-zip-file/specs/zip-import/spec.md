## ADDED Requirements

### Requirement: 用户可从 ZIP 文件导入文档

系统 SHALL 提供从导出的 ZIP 文件还原文档的功能。用户选择 `.zip` 文件后，系统解析 `result.json` 和页面图片，构建 `PdfDocument` 对象并加入文档列表。

#### Scenario: 成功导入完整 ZIP

- **WHEN** 用户选择包含 `result.json` 和有效页面图片的 ZIP 文件
- **THEN** 系统在文档列表中添加一个新文档，其 `name` 为 `result.json` 中的 `document_name`，`status` 为 `saved`，`parsedData` 包含所有页面的元素和图片，文档可立即打开标注

#### Scenario: ZIP 中缺少 result.json

- **WHEN** 用户选择的 ZIP 文件中不包含 `result.json`
- **THEN** 系统提示错误"无效的导入文件：缺少 result.json"，不向文档列表添加任何内容

#### Scenario: result.json 格式无效

- **WHEN** `result.json` 不是合法的 JSON 或缺少必要的 `pages` 字段
- **THEN** 系统提示错误"导入文件格式不正确，无法解析"，不添加文档

#### Scenario: 同名文档已存在

- **WHEN** 导入的文档名称与现有文档列表中的某个文档同名
- **THEN** 系统自动在新文档名称后追加 `(导入 N)`（N 为递增数字），例如 `报告.pdf(导入 1)`

### Requirement: 导入后元素数据完整性

系统 SHALL 将 ZIP 中的元素数据完整映射到 `PdfDocument.parsedData[].ocrElements`，保留 `category_type`、`poly`、`text/html/latex` 内容字段。

#### Scenario: 文本类型元素还原

- **WHEN** `result.json` 中某元素的 `category_type` 为 `text` 且包含 `text` 字段
- **THEN** 还原后的 `ocrElement.text` 等于原始 `text` 值，`score` 为默认值 `1.0`

#### Scenario: 公式类型元素还原

- **WHEN** `result.json` 中某元素的 `category_type` 为 `equation` 且包含 `latex` 字段
- **THEN** 还原后的 `ocrElement.latex` 等于原始 `latex` 值

#### Scenario: 表格类型元素还原

- **WHEN** `result.json` 中某元素的 `category_type` 为 `table` 且包含 `html` 字段
- **THEN** 还原后的 `ocrElement.html` 等于原始 `html` 值

### Requirement: 导入后文档可持久化

导入的文档 SHALL 自动保存到 localStorage 和 IndexedDB，页面刷新后仍然存在于文档列表中。

#### Scenario: 刷新后导入文档仍存在

- **WHEN** 用户成功导入文档后刷新页面
- **THEN** 导入的文档出现在文档列表中，状态为 `saved`，可正常打开标注
