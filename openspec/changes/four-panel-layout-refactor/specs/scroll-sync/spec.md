## MODIFIED Requirements

### Requirement: 左侧点击元素→右侧列表自动滚到对应卡片

当用户在 P2 文档视图中点击一个 bbox 时，P3 解析结果视图 SHALL 自动滚动使对应元素卡片垂直居中。

#### Scenario: 点击 bbox 后右侧居中

- **WHEN** 用户在 P2 文档视图点击某个元素的 bbox
- **THEN** 右侧 P3 面板（当处于"解析结果" Tab 时）滚动至该元素的 ElementCard 位于可视区域中央

### Requirement: 右侧点击卡片→左侧 PDF 自动滚到对应 bbox

当用户在 P3 解析结果视图点击一个元素卡片时，P2 文档视图 SHALL 自动滚动使该元素所在页面与该元素 bbox 在 P2 中可见。

#### Scenario: 点击卡片后文档视图定位

- **WHEN** 用户在 P3"解析结果"视图点击某个元素卡片
- **THEN** P2 文档视图滚动至该元素所在页面的对应 bbox 位置

## ADDED Requirements

### Requirement: P1 缩略图高亮与 P2 同步

当 P2 文档视图滚动导致当前可见页变化时，P1 缩略图列表 SHALL 同步高亮对应页面。

#### Scenario: 滚动切换当前页

- **WHEN** P2 通过连续滚动使第 5 页超过 50% 可见
- **THEN** P1 缩略图列表将第 5 页缩略图标记为高亮状态

### Requirement: P3 Tab 切换联动页面内容

当 P2 当前页面改变时，P3 结果面板 SHALL 自动刷新为当前页对应的内容。

#### Scenario: 翻页后 P3 自动更新

- **WHEN** P2 滚动使当前页从第 1 页变为第 2 页
- **THEN** P3 各 Tab 的内容自动更新为第 2 页对应的解析结果/翻译/Markdown
