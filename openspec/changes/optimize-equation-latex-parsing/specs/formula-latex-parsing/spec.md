## ADDED Requirements

### Requirement: 公式元素使用远程公式 API 识别
解析流程中，当 Layout Detection 返回的 `category_type` 为 `equation` 时，系统 MUST 优先调用远程 Windows OCR v5 公式 API（`POST /formula/file`）获取 LaTeX 表达式，而非使用本地 PaddleOCR 进行文字识别。

#### Scenario: 公式 API 正常返回 LaTeX
- **WHEN** 一个 `equation` 类型的裁剪图片被发送到 `/formula/file`
- **THEN** API 返回 `{"success": true, "formulas": [{"latex": "E = mc^{2}", ...}]}`，系统将 `formulas[0].latex` 写入对应 `PdfElement.latex` 字段

#### Scenario: 多公式页面
- **WHEN** 一页包含 3 个 `equation` 元素且公式 API 均可用
- **THEN** 每个 equation 元素独立调用公式 API，各自的 LaTeX 分别写入对应 `PdfElement.latex`

#### Scenario: 公式 API 不可用时降级
- **WHEN** 公式 API 返回错误（网络不可达、超时、非 200 状态码）或 `VITE_USE_FORMULA_API` 为 `false`
- **THEN** 系统回退至本地 PaddleOCR 进行文字识别，`PdfElement.latex` 为空，`PdfElement.markdown` 填入 PaddleOCR 返回的纯文本

#### Scenario: 公式 API 返回空结果
- **WHEN** 公式 API 返回 `{"success": true, "formulas": []}`
- **THEN** 系统视为识别失败，降级至本地 PaddleOCR

### Requirement: 公式 LaTeX 前端渲染
前端 `PdfElement` 的 `latex` 字段中存储的 LaTeX 表达式 MUST 通过 KaTeX 在右侧面板的元素卡片中渲染为可视化公式。当 `latex` 字段为空时 SHALL 展示降级纯文本。

#### Scenario: 有效 LaTeX 渲染成功
- **WHEN** `PdfElement.latex` 为 `"E = mc^{2}"` 且用户在右侧面板查看该 equation 元素
- **THEN** KaTeX 渲染为 `E = mc²` 的可视化公式

#### Scenario: 无效 LaTeX 降级展示
- **WHEN** `PdfElement.latex` 包含无法渲染的表达式（如语法错误）或为空字符串
- **THEN** 展示 `PdfElement.markdown` 中的纯文本作为降级内容

### Requirement: 图片格式转换
系统 MUST 提供 `base64ToBlob()` 工具函数将 base64 Data URL 转换为 Blob 对象，用于 `multipart/form-data` 上传。

#### Scenario: base64 转 Blob 成功
- **WHEN** 传入格式为 `data:image/png;base64,iVBOR...` 的 base64 字符串
- **THEN** 返回 MIME 类型为 `image/png` 的 Blob 对象

#### Scenario: 无前缀的 base64 处理
- **WHEN** 传入的 base64 字符串不包含 `data:` 前缀（纯 base64 编码）
- **THEN** 直接解码为 Blob，默认 MIME 类型为 `image/png`

### Requirement: 公式 API 配置可开关
公式 API 功能 MUST 通过环境变量 `VITE_USE_FORMULA_API` 控制启停，默认启用。

#### Scenario: 环境变量关闭公式 API
- **WHEN** `VITE_USE_FORMULA_API=false`
- **THEN** 所有 equation 元素使用本地 PaddleOCR 识别，不发起公式 API 请求

#### Scenario: 默认启用
- **WHEN** `VITE_USE_FORMULA_API` 未设置
- **THEN** 公式 API 默认启用
