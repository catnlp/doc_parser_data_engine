## ADDED Requirements

### Requirement: 元素列表展示渲染后的实际内容
元素列表中的每张卡片 MUST 展示元素内容经过渲染后的结果，而非截断的源文本。文本类元素（text/title/header/footer）展示渲染后的 Markdown，表格类元素（table）展示渲染后的 HTML 表格，公式类元素（equation）展示渲染后的 LaTeX，图片类元素（figure）展示图片本身。

#### Scenario: 文本类型元素在列表中展示渲染结果
- **WHEN** 页面包含 text 类型元素且其 markdown 内容为 `**加粗文本**`
- **THEN** 列表中该元素卡片内展示加粗渲染后的文本 `**加粗文本**`，而非源文本

#### Scenario: 表格类型元素在列表中展示渲染结果
- **WHEN** 页面包含 table 类型元素且其 html 内容为完整 HTML 表格
- **THEN** 列表中该元素卡片内展示渲染后的表格结构，而非截断的 HTML 源码

#### Scenario: 公式类型元素在列表中展示渲染结果
- **WHEN** 页面包含 equation 类型元素且其 latex 内容为数学公式
- **THEN** 列表中该元素卡片内展示 KaTeX 渲染后的公式

#### Scenario: 图片类型元素在列表中展示图片
- **WHEN** 页面包含 figure 类型元素且其 image_path 已设置
- **THEN** 列表中该元素卡片内展示对应图片

### Requirement: 折叠态内容区域限制显示高度
折叠态卡片中的渲染内容区域 MUST 通过最大高度限制展示范围，超出部分以渐隐遮罩提示用户可展开查看。

#### Scenario: 长内容元素折叠态显示截断提示
- **WHEN** 元素内容超过卡片可用高度
- **THEN** 卡片底部显示渐变遮罩，提示用户点击可展开查看完整内容

#### Scenario: 短内容元素折叠态完整展示
- **WHEN** 元素内容未超过卡片可用高度
- **THEN** 卡片完整展示所有内容，无需渐变遮罩
