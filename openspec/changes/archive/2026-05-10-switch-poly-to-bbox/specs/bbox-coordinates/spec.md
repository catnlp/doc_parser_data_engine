## ADDED Requirements

### Requirement: 元素坐标使用 bbox 格式

`PdfElement.poly` 字段 SHALL 为 4 元素数组 `[left, top, right, bottom]`，表示元素的包围盒。不再使用 8 元素四边形格式。

#### Scenario: 读取 bbox 坐标

- **WHEN** 代码访问 `element.poly`
- **THEN** `poly[0]` 为左边界、`poly[1]` 为上边界、`poly[2]` 为右边界、`poly[3]` 为下边界，数组长度为 4

#### Scenario: polyToBBox 返回正确包围盒

- **WHEN** 调用 `polyToBBox([10, 20, 200, 150])`
- **THEN** 返回 `{ x: 10, y: 20, width: 190, height: 130 }`

### Requirement: SVG 渲染基于 bbox 生成 polygon

`polyToSvgPoints()` SHALL 从 4 元素 bbox 生成 4 点 SVG polygon 点串。

#### Scenario: bbox 转 SVG 点串

- **WHEN** 调用 `polyToSvgPoints([0, 0, 100, 50], 2)`
- **THEN** 返回 `"0,0 200,0 200,100 0,100"`（所有坐标 ×2 缩放）

### Requirement: 导入旧 ZIP 时兼容 8 点格式

导入 ZIP 功能 SHALL 检测 `poly` 数组长度。若为 8 元素，自动转换为 4 元素 bbox。

#### Scenario: 旧格式自动转换

- **WHEN** ZIP 中某个元素的 `poly` 字段为 8 元素数组 `[10,20,110,20,110,70,10,70]`
- **THEN** 导入后该元素的 `poly` 为 4 元素 `[10, 20, 110, 70]`

### Requirement: 后端 API 返回的 8 点坐标前端自动转换

`parsePdf.ts` 在处理 API 返回值时 SHALL 将后端返回的 8 元素 `poly` 转换为 4 元素 bbox。

#### Scenario: OCR 结果转换

- **WHEN** 后端 OCR API 返回 `poly: [0,0,100,0,100,50,0,50]`
- **THEN** 存入 store 的 `ocrElement.poly` 为 `[0, 0, 100, 50]`
