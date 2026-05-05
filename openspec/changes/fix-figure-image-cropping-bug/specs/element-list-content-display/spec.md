## MODIFIED Requirements

### Requirement: 图片类型元素在列表中展示图片
元素列表中的 figure/image 类型元素 MUST 展示从当前页 PDF 渲染图中正确裁剪的截图。裁剪操作 MUST 等待 base64 图片完全加载后再执行 drawImage，不得使用同步裁剪函数尝试未加载完成的图片。

#### Scenario: 图片类型元素在列表中展示渲染结果
- **WHEN** 页面包含 figure 或 image 类型元素且其 polygon 坐标已设置
- **THEN** 列表中该元素卡片内展示从 PDF 渲染图中裁剪的正确截图，而非空白图片或占位符

#### Scenario: 图片加载失败时显示占位提示
- **WHEN** PDF 页面 base64 数据不可用或坐标无效
- **THEN** 列表中该元素卡片内显示「[未解析]」占位文本
