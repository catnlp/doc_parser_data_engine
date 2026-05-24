## 1. 类型定义与工具函数

- [x] 1.1 在 `frontend/src/types/omnidoc.ts` 中新增 `Chunk` 和 `ColumnLayout` 类型定义
- [x] 1.2 新建 `frontend/src/utils/chunk.ts`，实现 `detectColumns()` 多栏检测函数（基于 X 坐标聚类，阈值 15% pageWidth）
- [x] 1.3 在 `frontend/src/utils/chunk.ts` 中实现 `computeChunks()` 分块计算主函数（按 order 遍历、合并规则、caption 归属逻辑）

## 2. Store 扩展

- [x] 2.1 在 `useAnnotationStore` 中新增 `selectedChunkId` 和 `hoveredChunkId` 状态字段
- [x] 2.2 新增 `setSelectedChunkId` 和 `setHoveredChunkId` 方法
- [x] 2.3 修改 `setSelectedElementId`，当选中元素时同步清除 `selectedChunkId`（互斥逻辑）
- [x] 2.4 修改 `setCurrentPage`，切换页面时清除 `selectedChunkId` 和 `hoveredChunkId`

## 3. 分块列表 UI

- [x] 3.1 新建 `frontend/src/components/right-panel/ChunkList.tsx`，实现 ChunkList 组件（useMemo 计算 chunks、搜索/筛选、ChunkCard 渲染）
- [x] 3.2 在 ChunkList 中实现 `ChunkCard` 子组件：类型图标、标签（"段落 N"/"表格 N"）、元素数 badge、展开/收起按钮
- [x] 3.3 实现 ChunkCard 展开后的子元素列表（缩进显示，含 order 序号、类型标签、内容预览截断）
- [x] 3.4 实现分块列表的搜索和类型筛选功能（复用元素列表的 filter 样式）
- [x] 3.5 修改 `RightPanel.tsx`，在 panel-tabs 中新增"分块列表"Tab，切换时渲染 ChunkList

## 4. 分块高亮联动（左侧 PDF 视图）

- [x] 4.1 修改 `LeftPanel.tsx`：从 Store 读取 `selectedChunkId` / `hoveredChunkId`
- [x] 4.2 在 SVG overlay 中新增 chunk 高亮渲染逻辑：chunk 内所有元素 bbox 半透明填充（selected: 10% opacity, hovered: 5% opacity）
- [x] 4.3 绘制 chunk 外围虚线边界框（`unionBbox` 计算所有子元素 poly 的并集）
- [x] 4.4 确保 chunk 高亮与元素高亮互斥（chunk 选中时仅显示 chunk 高亮，元素选中时显示元素高亮）

## 5. 样式与验证

- [x] 5.1 添加 ChunkList 和 ChunkCard 的 CSS 样式（卡片样式、展开缩进、选中态、hover 态，复用设计令牌变量）
- [x] 5.2 运行 `npm run build` 验证无编译错误
- [ ] 5.3 手动测试单栏文档的分块合并效果
- [ ] 5.4 手动测试双栏文档的分栏检测和分块效果
- [ ] 5.5 手动测试交互：分块选中高亮、展开收起、拖拽排序后分块重算
