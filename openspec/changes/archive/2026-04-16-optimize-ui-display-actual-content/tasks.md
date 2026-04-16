## 1. 移除"元素详情"标签页框架

- [x] 1.1 删除 RightPanel 中的标签页切换 UI（tab-bar、tab-btn 等元素）
- [x] 1.2 从 store 中移除 `rightPanelTab` 和 `setRightPanelTab` 相关引用
- [x] 1.3 移除 RightPanel 中对 `ElementDetail` 组件的引用和条件渲染逻辑

## 2. ElementList 卡片展示渲染后内容

- [x] 2.1 将 `ElementContentPreview` 替换为 `RenderedContent` 组件的折叠态版本
- [x] 2.2 为折叠态内容区域添加 CSS 最大高度和溢出处理（max-height + overflow: hidden）
- [x] 2.3 为长内容元素添加卡片底部渐变遮罩效果（CSS ::after 伪元素提示"点击展开"）

## 3. 卡片折叠/展开交互

- [x] 3.1 在 ElementList 中根据 `selectedElementId` 判断每张卡片的展开/折叠状态
- [x] 3.2 实现点击卡片展开/收起交互（再次点击已展开卡片时清除选中状态并收起）
- [x] 3.3 展开态卡片内添加内容编辑器区域（复用 ContentEditor 组件）
- [x] 3.4 展开态卡片内添加预览/源码切换按钮

## 4. 编辑能力迁移至展开态卡片

- [x] 4.1 将原 `ElementDetail` 中的编辑逻辑（content state、handleSave、类型选择器、保存按钮）迁移至 ElementList 内的展开态组件
- [x] 4.2 确保展开态卡片中的类型选择器、坐标显示等元数据区块正确展示
- [x] 4.3 确保保存逻辑与 store 的 `updateElement` 正确联动

## 5. 样式与视觉优化

- [x] 5.1 在 annotation.css 中添加卡片展开态的视觉样式（背景色变化、展开箭头指示、过渡动画）
- [x] 5.2 确保折叠态内容渲染区域在不同元素类型下均正确显示（文本、表格、公式、图片）
- [x] 5.3 调整卡片内编辑器的最小高度和滚动行为

## 6. 清理与验证

- [x] 6.1 删除不再引用的 ElementDetail、DetailView、RenderedContent 等独立函数
- [x] 6.2 运行 TypeScript 类型检查确保无编译错误
- [x] 6.3 手动验证：元素列表渲染内容正确、展开/收起交互正常、编辑保存功能正常、拖拽排序不受影响
