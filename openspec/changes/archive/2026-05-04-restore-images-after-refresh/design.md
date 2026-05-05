## Context

当前文档解析标注平台采用双层存储：
- **localStorage**（`parsedDocuments_v1`）：存储文档元数据（文件名、页数、状态、OCR/布局元素），**刻意省略** `imageBase64` 以避免超出 5MB 限额
- **IndexedDB**（`doc_parser_images`）：存储每页图片的 base64 数据

`idb.ts` 已实现 `saveImage()` / `getImage()` / `getDocImages()` / `deleteDocImages()`，但读取函数从未被调用。

**约束**：
- `useDocumentListStore` 和 `useAnnotationStore` 均为 Zustand 同步 store
- `App.tsx` 在 mount 时调用 `loadFromLocalStorage()` 恢复文档元数据
- `AnnotateScreen` 在 `useEffect` 中同步调用 `loadDocument(doc)`，直接读取 `doc.parsedData[].imageBase64`
- `PdfDocument.id` 格式为 `saved_{name}_{randomId}`，`idb.ts` 中 key 为 `{docId}_{pageIndex}`

## Goals / Non-Goals

**Goals:**
- 刷新页面后能从 IndexedDB 恢复图片数据并正确渲染
- 恢复过程中用户感知到加载状态
- 最小侵入——不改变现有存储架构

**Non-Goals:**
- 不修改 IndexedDB schema 或 key 结构
- 不将图片数据移回 localStorage
- 不重新设计 store 持久化方案（如引入 zustand/middleware）

## Decisions

### 决策 1：在 `loadFromLocalStorage()` 中异步恢复图片

**选择**：在 `useDocumentListStore` 中新增 `restoreFromIndexedDB()` 方法，在 `App.tsx` 的 `useEffect` 中调用。

**备选方案**：
- A. 在 `AnnotateScreen` 中恢复——会导致屏幕层依赖 idb 工具，违反关注点分离
- B. 引入 zustand-persist 中间件——改动过大，且无法处理 IndexedDB（只支持 localStorage）

**具体流程**：
```
App.tsx mounts
  │
  ├─► loadFromLocalStorage()        ← 同步，恢复文档元数据
  │
  └─► restoreFromIndexedDB()        ← 异步，为 saved 文档填充 imageBase64
         │                             遍历 documents where status === 'saved'
         │                             调用 getDocImages(doc.id)
         │                             填充 parsedData[page].imageBase64
         └─► 设置 flag: imagesRestored = true
```

`useDocumentListStore` 新增字段 `imagesRestored: boolean`（初始 `false`），在所有图片恢复完成后设为 `true`。

### 决策 2：`AnnotateScreen` 等待恢复完成再渲染

**选择**：`AnnotateScreen` 增加对 `imagesRestored` 的检查，未完成时显示 loading。

```tsx
const imagesRestored = useDocumentListStore((s) => s.imagesRestored);
// ... if (!imagesRestored) return <div>加载中...</div>;
```

**备选方案**：在 `loadDocument()` 内部等待异步完成——更内聚，但会让同步函数变异步，调用方需要处理。选择 store 级 flag 更简单可靠。

### 决策 3：`pdfFile: null` 的 saved 文档也需恢复

`saved` 状态的文档 `file` 字段为 `null`（`fromPersisted()` 强转的 unknown File）。这不影响图片恢复——图片数据从 IndexedDB 加载，不需要原始文件对象。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|---|---|
| IndexedDB 读取慢，页面显示 loading 时间长 | 图片存储在本地 IndexedDB，通常 < 100ms；大量图片场景可后续优化 |
| 保存文档被从 localStorage 删除但 IndexedDB 残留 | 已有 `deleteDocImages()` 清理机制，无影响 |
| `pdfFile` 为 null 可能导致 TopBar 异常 | `TopBar` 需处理 pdfFile 为 null，属现有行为不受影响 |
