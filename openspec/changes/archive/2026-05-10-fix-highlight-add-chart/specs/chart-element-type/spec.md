## ADDED Requirements

### Requirement: bbox 高亮使用 rgba 透明填充

元素选中/悬停时的 SVG polygon 填充色 SHALL 使用 `rgba()` 格式，确保跨浏览器透明效果一致。

#### Scenario: 选中元素透明填充

- **WHEN** 用户选中一个 text 类型元素（颜色 `#3B82F6`）
- **THEN** 该元素的填充色为 `rgba(59, 130, 246, 0.19)`，呈现半透明蓝色

#### Scenario: 悬停元素透明填充

- **WHEN** 鼠标悬停在一个 table 类型元素上（颜色 `#52C41A`）
- **THEN** 该元素的填充色为 `rgba(82, 196, 26, 0.08)`，呈现极浅绿色

### Requirement: chart 类型元素支持

系统 SHALL 支持 `chart` 作为元素类型，在右侧面板中以裁切图方式渲染，与 `figure`/`image` 类型行为一致。

#### Scenario: chart 元素渲染为裁切图

- **WHEN** 当前页面有一个 `category_type === 'chart'` 的元素
- **THEN** 右侧面板显示该元素对应区域的裁切图片

#### Scenario: chart 在 bbox 覆盖层中有唯一颜色

- **WHEN** 标注页 PDF 覆盖层渲染 chart 类型元素
- **THEN** 该元素 bbox 使用 `#722ED1` 颜色（与 formula 一致）

#### Scenario: chart 可选择和编辑

- **WHEN** 用户点击 chart 元素
- **THEN** 该元素被选中（高亮），可像其他类型一样编辑
