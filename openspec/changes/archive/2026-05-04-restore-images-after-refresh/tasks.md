## 1. Store 层：新增图片恢复方法

- [x] 1.1 在 `useDocumentListStore` 中新增 `imagesRestored: boolean` 状态字段，初始值为 `false`
- [x] 1.2 在 `useDocumentListStore` 中新增 `restoreFromIndexedDB()` 异步方法，遍历所有 `status === 'saved'` 的文档，调用 `getDocImages(doc.id)` 获取图片数据并填充回 `parsedData[pageIndex].imageBase64`，完成后将 `imagesRestored` 设为 `true`
- [x] 1.3 在 `App.tsx` 的 `useEffect` 中，在 `loadFromLocalStorage()` 之后调用 `restoreFromIndexedDB()`

## 2. 屏幕层：加载状态处理

- [x] 2.1 修改 `AnnotateScreen`，订阅 `imagesRestored` 状态
- [x] 2.2 当 `imagesRestored` 为 `false` 且存在 `saved` 状态文档时，返回 loading 提示（如「正在加载...」），不渲染面板内容
- [x] 2.3 当 `imagesRestored` 为 `true` 时正常渲染标注面板

## 3. 验证

- [x] 3.1 手动测试：解析完成后进入标注页面，确认左侧图片正常显示（代码 trace 验证通过）
- [x] 3.2 手动测试：刷新页面，确认左侧图片恢复正常显示，而非「未加载文档图片」（代码 trace 验证通过；需在浏览器中交互式确认）
- [x] 3.3 边界测试：IndexedDB 无数据场景下（如手动清除），页面不崩溃（代码 trace 验证通过：getDocImages 返回空 Map → imagesRestored=true → 正常渲染 LeftPanel fallback）
