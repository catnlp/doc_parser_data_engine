## Why

当前导出功能虽已支持 ZIP 导出（包含 page images + annotations.json），但 JSON 文件中的元素信息不够完整。用户需要导出的 JSON 包含图片路径引用以及完整的解析元素信息（类型、坐标、OCR 文本、LaTeX/HTML 等），以便后续离线处理或与其他工具对接。

## What Changes

- 完善导出 ZIP 的 JSON 文件结构，包含：
  - `image_path`: 引用 ZIP 内的图片文件名
  - 每页完整解析元素信息（类型、坐标、OCR 文本、表格 HTML、公式 LaTeX 等）
- 保持导出结构简洁：每页一个整页图片 + 一个 JSON 文件描述所有元素

## Capabilities

### New Capabilities

无

### Modified Capabilities

- `export-zip`: JSON 文件结构变更，增加图片路径引用和完整元素信息字段

## Impact

- `frontend/src/components/PdfListView.tsx`：修改 `exportDocumentAsZip()` 函数的 JSON 生成逻辑
