## Why

当前元素坐标使用 8 点四边形格式 `[x1,y1,x2,y2,x3,y3,x4,y4]`，但几乎所有使用场景都是取其包围盒（minX/minY/maxX/maxY）。`poly.ts` 中的 `polyToBBox()` 在 5+ 处被重复调用或内联重写，坐标格式与实际需求不匹配，增加了代码复杂度和维护成本。

改为 bbox 格式 `[left, top, right, bottom]` 后，包围盒直接可得，`polyToBBox` 从 17 行简化到 1 行，多处坐标提取代码可删除。

## What Changes

- `PdfElement.poly` 类型从 `number[]`（8 元素）改为 `number[]`（4 元素 `[left, top, right, bottom]`）
- `poly.ts` 中 `polyToBBox()` 简化为直接解构 bbox；`polyToSvgPoints()` 从 bbox 生成 4 点 SVG polygon
- 移除代码库中所有 `poly[0..7]` 索引访问，改为 `poly[0..3]`
- 移除所有 `Math.min(poly[0], poly[2], poly[4], poly[6])` 包围盒计算，直接用 `poly[0]`/`poly[2]`
- API 层 `OcrResponse` 类型同步调整；mock 数据适配
- ZIP 导出/导入中的 poly 序列化格式同步

## Capabilities

### New Capabilities

- `bbox-coordinates`: 元素坐标统一使用 bbox 格式 `[left, top, right, bottom]`，替代当前 8 点四边形格式

### Modified Capabilities

- `export-zip`: 导出 ZIP 中元素的 `poly` 字段格式变更（从 8 元素改为 4 元素 **BREAKING**）

## Impact

- 受影响文件：`types/omnidoc.ts`、`utils/poly.ts`、`utils/parsePdf.ts`、`utils/importZip.ts`、`api/models.ts`、`screens/AnnotateScreen.tsx`、`components/PdfListView.tsx`、`components/left-panel/LeftPanel.tsx`、`components/right-panel/RightPanel.tsx`、`mock/mockData.ts`
- **BREAKING**: 旧版 ZIP 导出文件与新格式不兼容。导入时需检测并转换
