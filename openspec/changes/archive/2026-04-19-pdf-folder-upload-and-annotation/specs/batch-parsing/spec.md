## ADDED Requirements

### Requirement: 批量并发解析
系统 SHALL 对列表中的所有 pending 状态 PDF 文件发起批量解析，采用并发队列方式，最大并发数不超过 3。

#### Scenario: 启动批量解析
- **WHEN** 用户点击"全部解析"按钮或文件夹上传后自动触发
- **THEN** 系统依次对 pending 状态的文件发起解析请求，同时最多 3 个文件处于 parsing 状态

### Requirement: 解析进度追踪
系统 SHALL 为每个文件独立追踪解析进度，并在列表视图中实时更新。

#### Scenario: 单文件解析流程
- **WHEN** 某个 PDF 文件开始解析
- **THEN** 其状态从 pending 变为 parsing，依次调用 Layout API → OCR API → 状态变为 done

#### Scenario: 解析失败处理
- **WHEN** 某个 PDF 文件的 API 调用返回错误
- **THEN** 该文件状态变为 error，并在列表中显示错误信息，不影响其他文件的解析

### Requirement: 解析完成通知
系统 SHALL 在所有文件解析完成后（包括成功和失败），显示整体完成提示。

#### Scenario: 全部解析完成
- **WHEN** 所有文件的解析状态都变为 done 或 error
- **THEN** 系统显示提示："解析完成：X 个成功，Y 个失败"
