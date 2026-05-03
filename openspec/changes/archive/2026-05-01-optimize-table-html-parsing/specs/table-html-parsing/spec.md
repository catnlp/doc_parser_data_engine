## ADDED Requirements

### Requirement: 表格元素使用远程表格 API 识别
解析流程中，当 Layout Detection 返回的 `category_type` 为 `table` 时，系统 MUST 优先调用远程 Windows OCR v5 表格 API（`POST /table/file`）获取 HTML 结构，而非使用本地 PaddleOCR 进行文字识别。

#### Scenario: 表格 API 正常返回 HTML
- **WHEN** 一个 `table` 类型的裁剪图片被发送到 `/table/file`
- **THEN** API 返回 `{"success": true, "tables": [{"html": "<table>...</table>", ...}]}`，系统将 `tables[0].html` 写入对应 `PdfElement.html` 字段

#### Scenario: 表格 API 不可用时降级
- **WHEN** 表格 API 返回错误（网络不可达、超时、非 200 状态码）或 `VITE_USE_TABLE_API` 为 `false`
- **THEN** 系统回退至本地 PaddleOCR 进行文字识别，`PdfElement.html` 为空，`PdfElement.markdown` 填入 PaddleOCR 返回的纯文本

#### Scenario: 表格 API 返回空结果
- **WHEN** 表格 API 返回 `{"success": true, "tables": []}`
- **THEN** 系统视为识别失败，降级至本地 PaddleOCR

### Requirement: 表格 HTML 前端渲染
前端 `PdfElement` 的 `html` 字段中存储的 HTML 表格 MUST 通过 DOMPurify 安全清洗后在右侧面板渲染。当 `html` 字段为空时 SHALL 展示降级纯文本。

#### Scenario: 有效 HTML 渲染成功
- **WHEN** `PdfElement.html` 为完整的 `<table>` 结构且用户查看该 table 元素
- **THEN** 渲染为带行列结构的可视化表格

#### Scenario: 空 HTML 降级展示
- **WHEN** `PdfElement.html` 为空字符串或仅含空白
- **THEN** 展示 `PdfElement.markdown` 中的纯文本作为降级内容

### Requirement: 表格 API 配置可开关
表格 API 功能 MUST 通过环境变量 `VITE_USE_TABLE_API` 控制启停，默认启用。

#### Scenario: 环境变量关闭表格 API
- **WHEN** `VITE_USE_TABLE_API=false`
- **THEN** 所有 table 元素使用本地 PaddleOCR 识别，不发起表格 API 请求

#### Scenario: 默认启用
- **WHEN** `VITE_USE_TABLE_API` 未设置
- **THEN** 表格 API 默认启用
