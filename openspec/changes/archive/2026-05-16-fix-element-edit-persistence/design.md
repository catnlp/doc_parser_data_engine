## Context

当前系统有两个 Zustand Store：
- **`useDocumentListStore`**：数据源，持有 `documents[]`，其中 `parsedData[pageIdx].ocrElements[i]` 包含解析出的元素内容（text/html/latex/category_type/poly）
- **`useAnnotationStore`**：标注工作区，`AnnotateScreen.loadDocument()` 从 documentListStore 读取数据后构建 `pdfInfo[]`（独立副本），编辑操作通过 `updateElement()` 仅修改 annotationStore

两个 Store 之间无同步机制，且 localStorage 持久化只在解析完成时触发一次（`updateDocumentStatus`），后续编辑不再保存。

## Goals / Non-Goals

**Goals:**
- 用户编辑元素并保存后，修改同步到 `documentListStore.documents[].parsedData[]`
- 每次保存编辑时触发 localStorage 持久化（覆盖写入该文档的最新数据）
- 用户退出标注页后重新进入，编辑内容完整可见

**Non-Goals:**
- 不改变 IndexedDB 的图片存储逻辑（图片不涉及此 bug）
- 不改变元素创建/删除的流程（本次只修编辑持久化）
- 不引入 undo/redo（超出范围）

## Decisions

### 1. 同步机制：annotationStore.updateElement 内部触发

**选择**：在 `useAnnotationStore.updateElement()` 内部，更新完自身状态后，调用 `useDocumentListStore.getState().syncElementEdit()` 完成同步。

```typescript
// useAnnotationStore
updateElement: (elementId, updates) =>
  set((state) => {
    // ... 现有更新逻辑 ...
    return { pdfInfo: newPdfInfo };
  }),
//  ← 在这里新增同步调用
```

**替代方案被否决**：
- *Zustand subscribe*：需要维护变更 diff，过度设计，对于单次编辑场景没有必要
- *仅在 RightPanel.handleSave 中同步*：如果未来有其他入口调用 updateElement（如快捷键），会漏掉同步

### 2. 元素定位：通过 element.id 中的索引 + currentPage 反查

annotationStore 中元素 ID 格式为 `el_{pageIdx}_{i}_{doc.id}`，其中：
- `pageIdx` 直接映射到 `parsedData[pageIdx]`
- `i` 是该页元素列表中的原始索引（order 字段也是 `i`）

同步时从 ID 中解析出 `pageIdx` 和 `i`，直接定位到 `parsedData[pageIdx].ocrElements[i]` 进行更新。

```typescript
// ID 格式: el_0_3_doc_1234abc
// pageIdx = 0, elementIdx = 3
```

### 3. 持久化策略：每次保存编辑即写入 localStorage

**选择**：在 `syncElementEdit` 完成后，调用 `savePersisted()` 将更新后的 `documents` 完整序列化写入 localStorage。

**理由**：编辑是低频用户操作，写入开销可忽略。立即持久化保证浏览器崩溃也不丢数据。

### 4. documentListStore 新增 action：syncElementEdit

```typescript
syncElementEdit: (docId: string, pageIdx: number, elementIdx: number, updates: Partial<OcrElement>) => {
  set((state) => {
    const docs = state.documents.map((doc) => {
      if (doc.id !== docId) return doc;
      const newParsedData = [...doc.parsedData];
      const page = { ...newParsedData[pageIdx] };
      const elements = [...page.ocrElements];
      elements[elementIdx] = { ...elements[elementIdx], ...updates };
      page.ocrElements = elements;
      newParsedData[pageIdx] = page;
      return { ...doc, parsedData: newParsedData };
    });
    return { documents: docs };
  });
  // 写入 localStorage
  const updatedDoc = get().documents.find(d => d.id === docId);
  if (updatedDoc) {
    const allDocs = loadPersisted().filter(d => d.name !== updatedDoc.name);
    allDocs.push(toPersisted(updatedDoc));
    savePersisted(allDocs);
  }
}
```

### 5. elementId 到 (pageIdx, elementIdx) 的解析

在 `annotationStore.updateElement()` 中解析 elementId：

```typescript
const [_, pageIdxStr, elemIdxStr] = elementId.split('_');
const pageIdx = parseInt(pageIdxStr, 10);
const elemIdx = parseInt(elemIdxStr, 10);
```

注意：`AnnotateScreen.loadDocument()` 中生成的 ID 使用 `pageIdx`（从 0 开始循环变量），而 `annotationStore.currentPage` 从 1 开始。此处应使用从 ID 解析出的 `pageIdx`，而非 `currentPage - 1`。

## Risks / Trade-offs

- **[Risk] 多页编辑时 currentPage 切换导致定位错误** → Mitigation: 从 elementId 解析 pageIdx，不依赖 currentPage
- **[Risk] 旧版本 localStorage 数据中无 elementId** → Mitigation: `syncElementEdit` 只在 annotationStore 中的元素被编辑时触发，这些元素一定有 ID（由 loadDocument 生成），不受旧数据影响
- **[Risk] parseId 解析失败（非预期 ID 格式）** → Mitigation: 加 try-catch，解析失败时静默跳过同步（不在 UI 层面报错，避免影响用户体验）
