## 1. 新建文档列表 Store

- [x] 1.1 定义 `PdfDocument` 类型（id、file、name、pageCount、status、parsedData、error）
- [x] 1.2 创建 `useDocumentListStore.ts`，包含 documents 数组、selectedDocumentId、appView 状态
- [x] 1.3 实现 addDocuments 方法（支持批量添加 File 对象）
- [x] 1.4 实现 updateDocumentStatus 方法（pending → parsing → done/error）
- [x] 1.5 实现 selectDocument 方法（设置 selectedDocumentId 并切换 appView 为 'annotate'）
- [x] 1.6 实现 goBackToList 方法（切换 appView 为 'list'）

## 2. 文件夹上传组件

- [x] 2.1 创建 `FolderUpload` 组件，包含文件夹上传按钮（`webkitdirectory`）和单文件上传降级入口
- [x] 2.2 实现文件夹选择后的 File 对象筛选逻辑（过滤 `.pdf` 后缀）
- [x] 2.3 实现空文件夹提示（无 PDF 时显示 alert）
- [x] 2.4 将筛选后的文件通过 `addDocuments` 添加到 document list store

## 3. PDF 列表视图

- [x] 3.1 创建 `PdfListView` 组件，渲染 document list
- [x] 3.2 每行展示：文件名、页数、状态图标（⏳/🔄/✅/❌）
- [x] 3.3 实现状态为 done 的行可点击，点击触发 `selectDocument`
- [x] 3.4 实现 error 状态的错误摘要展示
- [x] 3.5 添加"全部解析"按钮（文件夹上传后自动触发批量解析，等效实现）

## 4. 批量解析逻辑

- [x] 4.1 创建 `parsePdfDocument` 函数（单文件解析：canvas 渲染 → Layout API → OCR API）
- [x] 4.2 实现并发队列控制器（最大并发数 3，使用 worker pool 模式）
- [x] 4.3 在 `parsePdfDocument` 中更新 document 状态（parsing → done/error）
- [x] 4.4 解析完成后显示整体统计提示（X 成功，Y 失败）
- [x] 4.5 实现 `beforeunload` 防护（解析中阻止页面关闭）

## 5. 视图切换与路由

- [x] 5.1 在 `App.tsx` 中根据 `appView` 状态渲染不同视图（list ↔ annotate）
- [x] 5.2 列表视图为默认初始视图
- [x] 5.3 选择 done 状态文档后切换到标注视图

## 6. 标注页集成

- [x] 6.1 在 `TopBar` 组件中添加"返回列表"按钮
- [x] 6.2 按钮点击后调用 `goBackToList` 返回 PDF 列表
- [x] 6.3 在 `App.tsx` 中实现从 document list store 加载已解析数据到 annotation store
- [x] 6.4 添加 `resetState` 方法，切换文档时确保标注状态完全重置

## 7. 样式与 UI 优化

- [x] 7.1 设计 PDF 列表视图样式（卡片布局，document-list.css）
- [x] 7.2 添加状态标签的视觉样式（颜色区分 pending/parsing/done/error）
- [x] 7.3 添加解析中的 mini spinner 动画
- [x] 7.4 确保响应式布局（max-width + 自适应宽度）

## 8. 测试与验证

- [x] 8.1 测试文件夹上传流程（含混合文件类型）—— Playwright 自动化验证通过
- [x] 8.2 验证批量解析并发行为 —— 解析完成提示 "2 个成功，0 个失败"
- [x] 8.3 测试标注页面切换文档时状态隔离 —— 点击进入/返回流程正常
- [x] 8.4 验证返回列表后解析数据保持不变 —— 列表数据完整保留，✅ 状态不变
