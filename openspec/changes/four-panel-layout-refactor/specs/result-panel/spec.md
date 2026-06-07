## ADDED Requirements

### Requirement: 多Tab视图切换

P3 结果展示面板 SHALL 提供 Tab 栏，支持在解析结果、翻译、Markdown、对比四种视图间切换。

#### Scenario: 默认显示解析结果

- **WHEN** 用户首次打开四栏界面
- **THEN** P3 默认选中"解析结果" Tab，显示当前页的分块列表和元素列表

#### Scenario: 手动切换Tab

- **WHEN** 用户点击 P3 Tab 栏的"Markdown"按钮
- **THEN** P3 切换到 Markdown 渲染视图，显示当前页的完整 Markdown 渲染结果

### Requirement: 解析结果视图

"解析结果"视图 SHALL 显示当前页的分块列表（ChunkList）和元素列表（ElementList）。

#### Scenario: 显示分块和元素列表

- **WHEN** P3 处于"解析结果" Tab 且 P2 显示第 2 页
- **THEN** P3 显示第 2 页的分块列表和元素列表

### Requirement: 翻译视图

"翻译"视图 SHALL 显示当前页内容的 AI 翻译结果，以 Markdown 格式渲染。

#### Scenario: 翻译当前页内容

- **WHEN** 用户在 P4 聊天中请求翻译并点击"→查看翻译"按钮
- **THEN** P3 自动切换到"翻译" Tab，显示翻译后的 Markdown 内容

### Requirement: Markdown 视图

"Markdown"视图 SHALL 显示当前页所有元素的合并 Markdown 渲染结果。

#### Scenario: 显示当前页 Markdown

- **WHEN** P3 处于"Markdown" Tab
- **THEN** P3 显示当前页所有元素按顺序合并后的 Markdown 渲染，包含表格、公式、图片

### Requirement: 对比视图

"对比"视图 SHALL 以双栏形式并排显示原文 Markdown 和译文 Markdown。

#### Scenario: 并排对比原文和译文

- **WHEN** P3 处于"对比" Tab 且有翻译结果可用
- **THEN** P3 左侧显示原文 Markdown 渲染，右侧显示译文 Markdown 渲染

### Requirement: AI 结果路由到 P3

P4 聊天面板的 AI 回复 SHALL 提供"→查看结果"按钮，点击后路由到 P3 对应 Tab。

#### Scenario: 翻译结果路由

- **WHEN** P4 收到翻译类 AI 回复
- **THEN** 回复消息底部显示"→查看翻译"按钮

#### Scenario: 点击路由按钮切换P3

- **WHEN** 用户点击 AI 回复中的"→查看翻译"按钮
- **THEN** P3 自动切换到"翻译" Tab 并显示该翻译内容
