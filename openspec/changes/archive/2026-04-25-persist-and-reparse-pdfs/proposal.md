## Why

当前文档列表数据存储在内存中（Zustand store），页面刷新后所有已解析的 PDF 信息（文件名、页数、解析结果）全部丢失。用户每次打开页面都需要重新上传、重新解析，无法复用之前的解析结果。同时，已完成的文档缺少"重新解析"按钮，解析结果不理想时无法快速重试。

## What Changes

- 解析完成后自动持久化文档元数据（文件名、页数、parsedData）到 localStorage
- 页面加载时自动恢复已持久化的文档列表（"已保存"状态，无 File 对象）
- 点击"已保存"文档时提示用户选择原始文件，选择后直接进入标注页
- 已完成/失败的文档增加"重新解析"按钮，可一键重新运行解析流程
- 支持手动清除已保存的文档记录

## Capabilities

### New Capabilities
- `document-persistence`: 使用 localStorage 持久化已解析文档的元数据和解析结果
- `document-reparse`: 对已完成/失败的文档重新发起解析

### Modified Capabilities
- `pdf-list-view`: 列表视图增加重新解析按钮、已保存文档加载入口
- `folder-upload`: 上传时自动匹配本地已保存的同名文档，避免重复解析

## Impact

- `frontend/src/store/useDocumentListStore.ts` — 增加持久化/加载逻辑
- `frontend/src/components/PdfListView.tsx` — 增加重新解析按钮、已保存文档加载交互
- `frontend/src/components/FolderUpload.tsx` — 上传时跳过已存在的同名文档
- `frontend/src/types/document.ts` — 增加持久化相关类型
- 不修改后端 API
