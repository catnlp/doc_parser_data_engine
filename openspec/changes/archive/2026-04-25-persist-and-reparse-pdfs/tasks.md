## 1. 持久化存储逻辑

- [x] 1.1 在 useDocumentListStore 中新增 loadFromLocalStorage 方法，启动时恢复已保存的文档
- [x] 1.2 在 updateDocumentStatus 完成时自动调用 saveToLocalStorage，持久化解析结果
- [x] 1.3 新增 saved 状态（与 done 区分），表示有解析数据但无 File 对象
- [x] 1.4 新增 localStorage 超限清理机制（超出 4MB 时保留最近 70% 记录）

## 2. 重新解析交互

- [x] 2.1 在 PdfListView 中为 done/error 状态的文档增加"重新解析"按钮
- [x] 2.2 点击"重新解析"后弹出文件选择器，选择后恢复 File 对象并重置状态为 pending
- [x] 2.3 自动触发该文档的解析流程（调用 parsePdfDocument）

## 3. 已保存文档加载

- [x] 3.1 在 PdfListView 中为 saved 状态的文档增加"加载"和"删除"按钮
- [x] 3.2 点击"加载"后弹出文件选择器，选择后将 File 对象绑定到文档并进入标注页
- [x] 3.3 点击"删除"后清除该文档的 localStorage 记录和 UI 列表

## 4. 上传时匹配已有文档

- [x] 4.1 在 addDocuments 中检查 localStorage 是否存在同名文档
- [x] 4.2 如存在且已解析完成，跳过解析，直接合并为 saved 状态（带 File 对象）
