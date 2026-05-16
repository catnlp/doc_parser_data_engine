## Why

用户在标注界面编辑元素内容并保存后，退出文档再重新进入，修改内容全部丢失。根因是 `useAnnotationStore.updateElement()` 只修改了标注 Store 的内存副本，从未同步回 `useDocumentListStore` 数据源，也从未触发 localStorage 持久化。标注 Store 在页面切换时被重建（从 documentListStore 重新读取），所有编辑随之丢失。

## What Changes

- `annotationStore.updateElement()` 执行后，同步更新 `documentListStore.documents[].parsedData[]` 中对应元素的数据
- 编辑保存时触发 localStorage 持久化，将最新的 `parsedData` 写入本地存储
- `AnnotateScreen` 退出时，若标注 Store 中有未持久化的编辑，自动触发一次同步保存

## Capabilities

### New Capabilities

- `element-edit-persistence`: 元素编辑内容在标注 Store 和文档列表 Store 之间保持一致，并在 localStorage 中持久化，确保退出重进后修改不丢失

### Modified Capabilities

- `inline-element-editing`: Requirement "保存修改后的内容" 的行为从"仅写入 annotationStore"扩展为"写入 annotationStore + 同步到 documentListStore + 持久化到 localStorage"

## Impact

- **Store**: `useAnnotationStore.updateElement()` — 增加同步回调
- **Store**: `useDocumentListStore` — 新增 `syncElementEdit` action 用于接收标注 Store 的编辑同步
- **Screen**: `AnnotateScreen` — 增加 unmount 时自动保存逻辑
- **Persistence**: 编辑保存路径中新增 localStorage 写入调用
