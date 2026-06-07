## ADDED Requirements

### Requirement: 连续页面滚动渲染

P2 文档视图 SHALL 以垂直连续滚动方式渲染所有页面，每页为独立容器。

#### Scenario: 页面垂直排列

- **WHEN** 文档有多页内容
- **THEN** P2 视图中所有页面按页码从上到下垂直排列，页间有明显分隔

### Requirement: 虚拟窗口渲染

系统 SHALL 仅渲染当前可见页及其前后各一页，以控制内存占用。

#### Scenario: 仅渲染附近页面

- **WHEN** 用户正在查看第 10 页
- **THEN** 仅第 9、10、11 页渲染完整内容，其余页面显示占位区域

#### Scenario: 滚动触发新页面渲染

- **WHEN** 用户滚动至第 11 页超过 50% 可见
- **THEN** 系统将第 10、11、12 页标记为渲染，第 9 页替换为占位区域

### Requirement: IntersectionObserver 页面检测

系统 SHALL 使用 IntersectionObserver 监测页面容器可见比例，确定当前活动页面。

#### Scenario: 检测当前可见页面

- **WHEN** 第 3 页在 P2 视口中可见比例超过 50%
- **THEN** 系统将第 3 页标记为当前活动页面，更新 Store 中的当前页状态

### Requirement: 元素点击选中

用户点击 P2 文档视图中的元素 bbox SHALL 选中该元素，并将其 markdown 内容设置为 AI 聊天上下文。

#### Scenario: 点击元素设置上下文

- **WHEN** 用户点击 P2 中某个文本元素的 bbox
- **THEN** 该元素高亮显示，其 markdown 内容存入 `selectedContent`，P4 聊天面板显示上下文指示

### Requirement: 浮动标注工具栏

P2 文档视图 SHALL 在顶部显示浮动标注工具栏，包含选择模式、框选模式和叠加层显隐切换。

#### Scenario: 切换到框选模式

- **WHEN** 用户点击浮动工具栏的"框选"按钮
- **THEN** P2 进入框选模式，鼠标变为十字准星，页面滚动锁定

#### Scenario: 隐藏 bbox 叠加层

- **WHEN** 用户点击浮动工具栏的"显隐"按钮
- **THEN** P2 中所有元素 bbox 叠加层隐藏，再次点击恢复显示
