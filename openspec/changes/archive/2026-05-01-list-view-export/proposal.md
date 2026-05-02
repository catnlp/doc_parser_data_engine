## Why

当前导出按钮在标注页 TopBar，仅能导出当前页。用户需要在 PDF 列表界面统一操作，导出整份文档的所有标注结果和图片，方便离线查阅和分享。

## What Changes

- 删除 TopBar 中的"📦 导出"按钮
- 在 PdfListView 中为每条"解析完成"文档添加"导出 ZIP"按钮
- 导出内容：所有页面的 annotations.json + 裁剪出的 figure/table 图片
- ZIP 结构以文件名组织，支持多文档导出时不冲突

## Capabilities

### New Capabilities
- `list-view-export`: 在列表界面为已解析文档导出 ZIP（全页标注 + 图片裁剪）

## Impact

- `frontend/src/components/PdfListView.tsx` — 新增导出按钮 + 导出函数
- `frontend/src/components/TopBar.tsx` — 删除导出按钮
- `frontend/src/styles/document-list.css` — 新增导出按钮样式
