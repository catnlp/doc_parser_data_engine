## ADDED Requirements

### Requirement: 远程 OCR 服务调用
系统 SHALL 调用 Windows 节点 POST /ocr/base64 接口进行页面文字识别。

#### Scenario: 调用远程 OCR
- **WHEN** 解析流程到达 OCR 步骤且远程 OCR 已启用
- THEN 系统发送 base64 图片到远程 OCR 服务

### Requirement: OCR 结果格式适配
系统 SHALL 将远程 OCR 返回的 details 数组转换为内部元素格式。

#### Scenario: 结果映射
- WHEN 远程 OCR 返回 N 个 text 块
- THEN 系统将每个 text 块与对应 layout 元素合并，保留 layout 的 category_type
