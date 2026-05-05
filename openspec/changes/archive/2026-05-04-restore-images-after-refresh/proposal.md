## Why

当前标注页面存在 bug：文档解析完成后图片正常显示，但刷新页面后左侧图片完全消失。

原因：图片在解析完成时被保存到 IndexedDB，但页面刷新后从 localStorage 恢复文档时，`imageBase64` 字段已被剥离（存入 localStorage 时故意省略以避免体积过大）。IndexedDB 的读取函数 `getImage()` / `getDocImages()` 已定义但**从未被调用**，导致刷新后无法恢复图片数据。

## What Changes

- 页面刷新后从 IndexedDB 恢复保存文档的 `imageBase64` 数据，填充回 `parsedData`
- 确保图片恢复过程中标注页面仍显示 loading 状态，避免渲染空页面
- 保持现有 localStorage 元数据+IndexedDB 图片的双层存储架构不变

## Capabilities

### New Capabilities

- `image-restore-after-refresh`: 标注页面刷新后，从 IndexedDB 恢复文档图片数据，确保左侧图片正常显示

### Modified Capabilities

无。

## Impact

- `frontend/src/store/useDocumentListStore.ts`：恢复文档时同步加载 IndexedDB 图片
- `frontend/src/screens/AnnotateScreen.tsx`：异步加载完成后才渲染标注面板
- `frontend/src/utils/idb.ts`：无需修改（读取函数已实现但未使用）
