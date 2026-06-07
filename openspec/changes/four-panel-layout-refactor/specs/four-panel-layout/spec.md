## ADDED Requirements

### Requirement: 四栏弹性布局渲染

系统 SHALL 将标注/阅读界面渲染为四栏弹性布局，支持面板间拖拽调整宽度。

#### Scenario: 默认布局比例

- **WHEN** 用户打开文档进入四栏界面
- **THEN** 四栏宽度比例为 P1:180px, P2:1fr, P3:1fr, P4:280px

#### Scenario: 拖拽调整面板宽度

- **WHEN** 用户拖拽任意两个面板之间的分隔条
- **THEN** 相邻两个面板宽度按拖拽方向调整，其他面板宽度不变

#### Scenario: 面板最小宽度限制

- **WHEN** 用户拖拽分隔条使面板宽度低于最小值（P1:120px, P2:200px, P3:240px, P4:200px）
- **THEN** 该面板宽度停止缩小

### Requirement: 面板独立滚动

每个面板 SHALL 拥有独立的垂直滚动容器，面板间滚动互不影响。

#### Scenario: 面板独立滚动

- **WHEN** 用户在 P2 面板内滚动鼠标
- **THEN** 仅 P2 内容滚动，P1/P3/P4 位置不变
