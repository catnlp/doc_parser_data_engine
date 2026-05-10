## ADDED Requirements

### Requirement: 左侧点击元素→右侧列表自动滚到对应卡片

当用户在左侧 PDF 覆盖层点击一个 bbox 时，右侧元素列表 SHALL 自动滚动使对应元素卡片垂直居中。

#### Scenario: 点击 bbox 后右侧居中

- **WHEN** 用户在左侧 PDF 覆盖层点击某个元素的 bbox
- **THEN** 右侧面板滚动至该元素的 ElementCard 位于可视区域中央

### Requirement: 右侧点击卡片→左侧 PDF 自动滚到对应 bbox

当用户在右侧元素列表点击一个元素卡片时，左侧 PDF 视图 SHALL 自动滚动使该元素的 bbox 居中显示。

#### Scenario: 点击卡片后左侧居中

- **WHEN** 用户在右侧面板点击某个元素卡片
- **THEN** 左侧 PDF 视图滚动至该元素的 bbox 中心位于可视区域中央
