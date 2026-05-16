## 1. documentListStore 新增同步 action

- [x] 1.1 在 `useDocumentListStore` 中新增 `syncElementEdit(docId, pageIdx, elementIdx, updates)` action，按索引更新 `parsedData[pageIdx].ocrElements[elementIdx]` 中对应字段
- [x] 1.2 `syncElementEdit` 更新 memory 数据后，调用 `toPersisted()` + `savePersisted()` 将更新后的文档写入 localStorage

## 2. annotationStore 增加同步调用

- [x] 2.1 在 `updateElement()` 中解析 elementId（格式 `el_<pageIdx>_<elemIdx>_<docId>`），提取 pageIdx 和 elemIdx
- [x] 2.2 `updateElement()` 更新完自身 state 后，调用 `useDocumentListStore.getState().syncElementEdit()` 完成同步
- [x] 2.3 对解析失败的 elementId 进行 try-catch 静默处理，不阻断编辑功能

## 3. 验证

- [x] 3.1 手动测试：编辑 text 元素 markdown → 保存 → 返回列表 → 重新进入 → 确认内容已更新
- [x] 3.2 手动测试：编辑 table 元素 html → 保存 → 退出重进 → 确认内容已更新
- [x] 3.3 手动测试：修改元素类型 → 保存 → 退出重进 → 类型切换生效
- [x] 3.4 手动测试：刷新浏览器后重新进入 → 编辑内容仍在（localStorage 持久化验证）
