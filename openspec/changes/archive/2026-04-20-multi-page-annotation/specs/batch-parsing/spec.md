## MODIFIED Requirements

### Requirement: 解析进度追踪
系统 SHALL 为每个文件独立追踪解析进度，并在列表视图中实时更新。

#### Scenario: 单文件解析流程
- **WHEN** 某个 PDF 文件开始解析
- **THEN** 其状态从 pending 变为 parsing，依次获取总页数，逐页调用 Layout API 和 OCR API，解析完所有页后状态变为 done。解析开始前更新 pageCount 字段为实际页数。

#### Scenario: 解析失败处理
- **WHEN** 某个 PDF 文件的 API 调用返回错误
- **THEN** 该文件状态变为 error，并在列表中显示错误信息，不影响其他文件的解析
