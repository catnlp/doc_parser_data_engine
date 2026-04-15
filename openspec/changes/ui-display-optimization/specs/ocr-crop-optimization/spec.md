## ADDED Requirements

### Requirement: OCR 裁剪边距扩大

系统 SHALL 在裁剪每个元素区域时增加足够的边缘边距，确保 OCR 模型能够识别紧靠边缘的文本。

#### Scenario: 边距参数调整
- **WHEN** 后端处理元素的 bbox 裁剪
- **THEN** 每个边向外扩展 60 像素的边距

#### Scenario: 边界限制
- **WHEN** 边距扩展后超出图片边界
- **THEN** 裁剪坐标被限制在图片范围内（`max(0, x1-MARGIN)`, `min(w, x2+MARGIN)`）

### Requirement: 文本识别完整性提升

系统 SHALL 确保裁剪后的文本块能被 PaddleOCR 完整识别，不再截断边缘文字。

#### Scenario: 边缘文本识别
- **WHEN** 文本紧贴 bbox 上/下/左/右边缘
- **THEN** 扩展的边距区域为 OCR 模型提供上下文，使文字能被正确识别

#### Scenario: 窄区域处理
- **WHEN** 元素高度或宽度小于 MARGIN 的两倍
- **THEN** 裁剪逻辑自动缩小边距，确保裁剪框有效（`x2 > x1`, `y2 > y1`）
