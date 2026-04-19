## Why

当前标注页面硬编码仅解析和展示PDF第一页（pageCount=0, totalPages=1），任何多页PDF的后续页面均被忽略。用户需要在标注页面浏览和标注PDF的每一页内容，这是文档标注工具的核心功能。

## What Changes

- 解析流程：`parsePdfDocument` 从仅处理第1页改为遍历所有页，逐页调用Layout+OCR API
- 标注页面：`AnnotateScreen` 根据文档的实际页数（`doc.pageCount`）动态设置 totalPages，不再硬编码为1
- 页面切换：TopBar和BottomNav中的翻页导航根据实际页数启用/禁用，支持用户在多页之间切换
- 解析进度：对页数超过1的PDF，在列表视图显示解析进度（如"解析中 2/5页"）

## Capabilities

### New Capabilities
- `multi-page-pdf-annotation`: 解析并标注PDF所有页面，标注页支持多页导航

### Modified Capabilities
- `batch-parsing`: 解析流程从单页扩展为多页，状态显示细化到页级别进度

## Impact

- `frontend/src/utils/parsePdf.ts` — 改为循环处理每页
- `frontend/src/App.tsx` — 删除 totalPages=1 硬编码，改为按doc页数加载
- `frontend/src/store/useDocumentListStore.ts` — 增加 setPageCount 方法
- Backend API — 无需改动（Layout/OCR API 以图片为单位，天然支持多页）
