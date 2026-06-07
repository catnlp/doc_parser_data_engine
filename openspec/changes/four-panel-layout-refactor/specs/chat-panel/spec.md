## ADDED Requirements

### Requirement: 聊天消息列表

P4 聊天面板 SHALL 显示聊天消息历史列表，用户消息右对齐，AI 回复左对齐，均以 Markdown 渲染。

#### Scenario: 显示用户消息

- **WHEN** 用户发送"翻译这段文字"
- **THEN** P4 消息列表底部出现右对齐的用户消息气泡

#### Scenario: 显示 AI 回复

- **WHEN** AI 返回翻译结果
- **THEN** P4 消息列表底部出现左对齐的 AI 回复，内容以 Markdown 渲染（支持表格、公式等）

### Requirement: 上下文感知

P4 聊天面板 SHALL 自动感知当前上下文，包括当前页码和选中的元素内容。

#### Scenario: 显示上下文指示

- **WHEN** 用户在 P2 点击选中某个元素且 P2 正在显示第 3 页
- **THEN** P4 输入框上方显示上下文指示："第 3 页 · 文本元素"

#### Scenario: 发送消息包含上下文

- **WHEN** 用户发送消息且当前有选中元素
- **THEN** 发送给 AI 的消息内容包含选中元素的 markdown 内容作为附加上下文

### Requirement: AI 回复结果路由

AI 回复消息 SHALL 底部包含"→查看结果"按钮，可将回复内容路由到 P3 对应视图。

#### Scenario: 翻译结果提供路由按钮

- **WHEN** AI 返回翻译类回复
- **THEN** 回复底部显示"→查看翻译"按钮

#### Scenario: 解析分析结果提供路由按钮

- **WHEN** AI 返回文档解析相关的分析结果
- **THEN** 回复底部显示"→查看解析"按钮
