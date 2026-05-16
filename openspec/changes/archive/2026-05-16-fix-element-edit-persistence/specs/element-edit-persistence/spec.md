## ADDED Requirements

### Requirement: 编辑保存后同步到数据源 Store
`useAnnotationStore.updateElement()` 在更新完标注 Store 内部状态后，MUST 将编辑内容同步写入 `useDocumentListStore.documents[].parsedData[]` 中对应元素的字段。

#### Scenario: 编辑 text 类型元素后同步
- **WHEN** 用户在标注界面修改 text 元素的 markdown 内容并保存
- **THEN** `annotationStore.pdfInfo` 中对应元素 markdown 更新
- **AND** `documentListStore.documents[].parsedData[pageIdx].ocrElements[i]` 中对应元素的 text 字段同步更新

#### Scenario: 编辑 table 类型元素后同步
- **WHEN** 用户在标注界面修改 table 元素的 html 内容并保存
- **THEN** `documentListStore` 中对应元素的 html 字段同步更新

#### Scenario: 编辑 formula 类型元素后同步
- **WHEN** 用户在标注界面修改 formula 元素的 latex 内容并保存
- **THEN** `documentListStore` 中对应元素的 latex 字段同步更新

#### Scenario: 修改元素类型后同步
- **WHEN** 用户在标注界面通过类型选择器更改元素的 category_type
- **THEN** `documentListStore` 中对应元素的 category_type 字段同步更新

#### Scenario: 监听非当前页的元素编辑也能正确定位
- **WHEN** 用户通过左侧 bbox 联动切换到非当前页的某个元素并编辑保存
- **THEN** 系统从 elementId 中解析 pageIdx 定位正确的页和元素索引，而非依赖 annotationStore.currentPage

#### Scenario: elementId 解析失败时静默跳过
- **WHEN** annotationStore 中的 elementId 格式不符合预期（非 `el_<pageIdx>_<elemIdx>_<docId>` 格式）
- **THEN** 同步操作静默跳过，不影响核心编辑功能，不向 UI 抛出异常

### Requirement: 元素编辑后触发 localStorage 持久化
每次元素编辑保存后，系统 MUST 将当前文档的最新 `parsedData` 写入 localStorage，覆盖该文档的旧持久化记录。

#### Scenario: 编辑后 localStorage 记录更新
- **WHEN** 用户编辑任意元素并保存
- **THEN** localStorage 中对应文档的持久化记录被更新为包含最新编辑内容的数据
- **AND** `parsedData` 中各页 `ocrElements` 反映最新的 text/html/latex/category_type 值

#### Scenario: 旧持久化记录被覆盖
- **WHEN** 某文档已有旧的 localStorage 记录，用户编辑后保存
- **THEN** 新持久化记录覆盖旧记录（不再保留旧版本）

### Requirement: 重新进入文档时编辑内容可见
用户退出标注页后重新进入同一文档时，MUST 看到之前编辑保存的内容。

#### Scenario: 退出再进入看到编辑后的内容
- **WHEN** 用户编辑文档中某元素的 markdown 内容并保存后回到列表页，再重新进入该文档
- **THEN** 右侧元素列表中该元素展示编辑后的 markdown 渲染结果

#### Scenario: 修改类型后再进入生效
- **WHEN** 用户将某元素类型从 text 改为 title 并保存后，退出再重新进入
- **THEN** 元素卡片显示标题类型图标，渲染内容仍为编辑后的文本
