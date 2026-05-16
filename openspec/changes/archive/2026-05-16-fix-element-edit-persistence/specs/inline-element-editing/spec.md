## MODIFIED Requirements

### Requirement: 保存修改后的内容
用户在展开态卡片的内容编辑器中修改内容并点击"保存"按钮后，修改后的内容 MUST 同时写入 `annotationStore.pdfInfo`、`documentListStore.documents[].parsedData[]` 和 localStorage 持久化存储。卡片折叠态展示最新渲染结果。

#### Scenario: 编辑文本类元素并保存
- **WHEN** 用户在展开态卡片中编辑 text 类型元素的 markdown 内容并点击"保存修改"
- **THEN** 修改后的内容写入 annotationStore，卡片折叠态展示最新渲染结果
- **AND** 修改同步到 documentListStore 对应元素的 text 字段
- **AND** 最新数据持久化到 localStorage

#### Scenario: 编辑表格类元素并保存
- **WHEN** 用户在展开态卡片中编辑 table 类型元素的 html 内容并点击"保存修改"
- **THEN** 修改同步到 documentListStore 对应元素的 html 字段，并持久化到 localStorage

#### Scenario: 修改元素类型并保存
- **WHEN** 用户在展开态卡片中通过类型选择器更改元素类型
- **THEN** 元素的 category_type 更新同步到 documentListStore，并持久化到 localStorage

#### Scenario: 退出重进后编辑持久化可见
- **WHEN** 用户编辑元素内容并保存后，退出标注页回到列表，再重新进入同一文档
- **THEN** 之前编辑保存的内容在右侧面板中正确展示
