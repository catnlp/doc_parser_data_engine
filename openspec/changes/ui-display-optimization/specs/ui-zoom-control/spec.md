## ADDED Requirements

### Requirement: 文档缩放控制

系统 SHALL 提供文档查看器的缩放功能，允许用户通过控件或快捷键调整页面显示比例。

#### Scenario: 通过顶部控件缩放
- **WHEN** 用户点击顶部导航栏的 + 或 - 按钮
- **THEN** 缩放比例增加或减少 10%，范围限制在 50%-200%

#### Scenario: 缩放值持久化
- **WHEN** 用户调整缩放比例后切换页面
- **THEN** 新加载的页面继承当前缩放比例

#### Scenario: 缩放联动渲染
- **WHEN** 缩放比例变化
- **THEN** 左侧文档图片宽度、高度和叠加的 SVG bbox 同步更新

### Requirement: SVG 叠加层自适应

系统 SHALL 确保 SVG 叠加层尺寸与缩放后的图片完全一致，保证边框位置精确对齐。

#### Scenario: SVG 尺寸同步
- **WHEN** 图片缩放到 150%
- **THEN** SVG 的 width/height 属性同步缩放至 150%

#### Scenario: bbox 坐标比例计算
- **WHEN** 缩放比例变化
- **THEN** bbox 坐标乘以相同的 scale 因子，确保边框始终覆盖正确区域
