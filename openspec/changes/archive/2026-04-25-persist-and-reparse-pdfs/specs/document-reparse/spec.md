## ADDED Requirements

### Requirement: 重新解析
系统 SHALL 允许用户对已完成或失败的文档重新发起解析。

#### Scenario: 重新解析已完成文档
- WHEN 用户点击已完成文档的"重新解析"按钮
- THEN 系统弹出文件选择器，选择后重新运行解析流程（saved/done -> pending -> parsing -> done）

#### Scenario: 重新解析失败文档
- WHEN 用户点击失败文档的"重新解析"按钮
- THEN 系统弹出文件选择器，选择后重新运行解析流程（error -> pending -> parsing -> done/error）

### Requirement: 清除已保存记录
系统 SHALL 允许用户删除已保存的文档记录。

#### Scenario: 清除单条记录
- WHEN 用户点击某条已保存文档的删除按钮
- THEN 系统从 localStorage 中移除该记录，UI 列表同步更新
