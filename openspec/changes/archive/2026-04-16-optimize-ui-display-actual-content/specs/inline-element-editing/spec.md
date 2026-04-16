## ADDED Requirements

### Requirement: 选中元素时展开该卡片
用户点击列表中某元素卡片时，该卡片 MUST 进入展开态并展示内容编辑器。其他已展开的卡片 MUST 自动收起。

#### Scenario: 点击未选中元素卡片
- **WHEN** 用户点击当前未选中的元素卡片
- **THEN** 该卡片展开显示内容编辑器，原已选中的卡片（如有）收起为折叠态

#### Scenario: 再次点击已展开卡片
- **WHEN** 用户点击当前已展开的元素卡片
- **THEN** 该卡片收起为折叠态，选中标状态清除

### Requirement: 展开态卡片内提供内容编辑能力
展开态卡片 MUST 提供与原"元素详情"面板等效的编辑能力，包括：预览/源码切换、内容修改、类型切换、保存修改。

#### Scenario: 编辑文本类元素内容
- **WHEN** 用户展开一个 text 类型元素的卡片并点击"源码"视图
- **THEN** 显示 CodeMirror 编辑器，加载该元素的 markdown 内容，用户可修改并保存

#### Scenario: 预览模式展示渲染结果
- **WHEN** 用户处于展开态卡片的"预览"视图
- **THEN** 显示完整渲染后的内容（markdown 渲染、HTML 表格、KaTeX 公式等），等效于原详情面板的渲染视图

#### Scenario: 修改元素类型
- **WHEN** 用户在展开态卡片中通过类型选择器更改元素类型
- **THEN** 元素的 category_type 更新，对应渲染视图和编辑器随之切换

#### Scenario: 保存修改后的内容
- **WHEN** 用户在展开态卡片的内容编辑器中修改内容并点击"保存"按钮
- **THEN** 修改后的内容写入 store，卡片折叠态展示最新渲染结果

### Requirement: 移除"元素详情"标签页
右侧面板中 MUST 移除原有的"元素详情"标签页及其对应的 ElementDetail 组件逻辑。

#### Scenario: 右侧面板仅保留列表视图
- **WHEN** 用户打开右侧面板
- **THEN** 面板顶部不再显示"元素列表"/"元素详情"标签页切换按钮，直接展示元素列表

#### Scenario: 详情组件从代码中移除
- **WHEN** 代码审计时检查 RightPanel.tsx
- **THEN** ElementDetail 组件及其引用的 DetailView、RenderedContent 不再作为独立函数存在，相关逻辑已迁移至 ElementList 卡片内
