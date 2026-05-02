## ADDED Requirements

### Requirement: PDF 渲染图存储于 IndexedDB
系统 MUST 将 PDF 各页的 `imageBase64` 渲染图存储于 IndexedDB，每张图片以 `{docId}_{pageIndex}` 为唯一键。文档列表元数据（文档名、状态、页数、布局/OCR 文本结果）SHALL 继续存储于 localStorage。

#### Scenario: 解析完成后图片写入 IndexedDB
- **WHEN** 一份 PDF 文档解析完成且 `updateDocumentStatus` 收到 `parsedData`（含 `imageBase64`）
- **THEN** 每页的 `imageBase64` 被写入 IndexedDB，写入成功后从 `parsedData` 存储副本中移除 `imageBase64` 字段再存入 localStorage

#### Scenario: 列表页加载时读取 localStorage 元数据
- **WHEN** 用户打开列表页
- **THEN** 系统从 localStorage 读取文档列表元数据并立即展示，无需等待 IndexedDB

#### Scenario: 进入标注视图时读取 IndexedDB 图片
- **WHEN** 用户选择一份 "done" 或 "saved" 状态的文档进入标注视图
- **THEN** 系统从 IndexedDB 按页逐个读取 `imageBase64`，重新组装为 `renderedPages` 存入 annotationStore

#### Scenario: 删除文档时清理 IndexedDB
- **WHEN** 用户在列表页删除一份文档
- **THEN** 系统同时从 localStorage 移除元数据，并从 IndexedDB 删除该文档所有页面的图片记录

#### Scenario: IndexedDB 不可用时降级
- **WHEN** 浏览器不支持 IndexedDB 或处于隐私模式导致打开失败
- **THEN** 系统降级为内存存储，仅在当前会话中保留图片数据，并向控制台输出警告

### Requirement: 数据存储拆分结构
localStorage 中存储的文档对象 MUST 不包含 `imageBase64` 字段。每页的 OCR 文本结果和布局坐标 SHALL 保留在 localStorage 中以支持列表页展示和导出。

#### Scenario: localStorage 条目不包含图片
- **WHEN** 系统将文档持久化至 localStorage
- **THEN** 写入的 JSON 对象中每页的 `imageBase64` 字段为空字符串或被移除，`layoutElements` 和 `ocrElements` 保留

### Requirement: 旧数据兼容读取
系统 MUST 兼容读取旧版本（含 `imageBase64` 的 localStorage 数据），旧数据中的 `imageBase64` SHALL 在读取后标记为"旧格式"但不自动迁移。

#### Scenario: 读取含 imageBase64 的旧数据
- **WHEN** `loadFromLocalStorage` 读取到包含 `imageBase64` 字段的旧版本文档
- **THEN** 该文档正常展示在列表中，`imageBase64` 不被自动迁移至 IndexedDB，状态标记为 "saved"
