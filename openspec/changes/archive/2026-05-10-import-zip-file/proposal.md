## Why

当前应用支持将解析完成的 PDF 数据导出为 ZIP 文件（含页面图片、切图、元素 JSON），但缺少反向能力——用户无法将之前导出的 ZIP 重新加载回应用中继续编辑。这使得导出的数据成为"死数据"，无法在不同设备或时间点之间迁移工作进度。

## What Changes

- 新增 ZIP 文件导入功能：用户在前端界面选择 `.zip` 文件后，解析其中的 `result.json` 和页面图片，还原为 `PdfDocument` 并加入文档列表
- 修改 `PdfListView` 组件，在界面上增加"导入 ZIP"入口
- 新增 `importDocumentFromZip` 工具函数，负责 ZIP 解压、数据校验、图片提取和文档对象构建
- 导入的文档自动持久化到 localStorage + IndexedDB（与现有"保存"流程一致）

## Capabilities

### New Capabilities

- `zip-import`: 从导出的 ZIP 文件中还原文档数据，包括页面图片、元素坐标、文本/公式/表格内容，并加入文档列表供继续编辑

### Modified Capabilities

无——导入是全新能力，不改变现有导出逻辑。

## Impact

- 受影响文件：`frontend/src/components/PdfListView.tsx`（添加入口按钮和调用逻辑）、`frontend/src/utils/importZip.ts`（新增导入逻辑）
- 依赖：`jszip`（已有依赖，与导出共用）、`idb.ts`（已有 IndexedDB 工具）
- 不涉及后端变更、不新增 npm 依赖
