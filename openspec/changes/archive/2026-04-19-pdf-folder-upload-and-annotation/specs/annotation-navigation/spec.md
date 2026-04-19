## ADDED Requirements

### Requirement: 视图切换机制
系统 SHALL 支持两种视图模式：列表视图（list）和标注视图（annotate），通过 Zustand 状态管理进行切换。

#### Scenario: 从列表进入标注
- **WHEN** 用户在列表视图点击已解析完成的 PDF 条目
- **THEN** 系统切换到标注视图，展示该 PDF 的标注界面

#### Scenario: 从标注返回列表
- **WHEN** 用户在标注视图点击"返回列表"按钮
- **THEN** 系统切换回列表视图，所有文件的解析状态保持不变

### Requirement: 标注上下文隔离
系统 SHALL 在切换 PDF 时，确保不同文档的标注数据互不干扰。每次切换文档时，标注 store 的状态完全重置为目标文档的数据。

#### Scenario: 切换文档时重置标注状态
- **WHEN** 用户从文档 A 切换到文档 B
- **THEN** 标注 store 中的 pdfInfo、pageInfo、currentPage 等数据完全替换为文档 B 的数据

### Requirement: 标注页导航按钮
系统 SHALL 在 TopBar 组件中添加"返回列表"按钮，仅在标注视图下可见。

#### Scenario: 显示返回按钮
- **WHEN** 用户处于标注视图
- **THEN** TopBar 左侧显示"返回列表"按钮，点击后返回 PDF 列表
