## Why

当前标注界面右侧面板仅以"元素列表"展示每个独立的解析元素（文本、表格、图片等），缺乏更高层次的结构化视图。用户无法快速了解文档的段落组织结构，也无法按语义块批量定位和高亮相关元素。引入分块列表功能，按照书写顺序将相邻文本元素合并为段落块，同时保持表格/图片独立，使文档结构一目了然。

## What Changes

- 新增分块列表 Tab，与"元素列表"和"解析分析"并列展示
- 分块基于元素的 `order` 序列计算：相邻文本元素合并，遇到标题停止，表格/图片/图表独立成块
- 公式（equation/formula/display_formula）与相邻文字合并，不独立分块
- figure_caption / table_caption 自动归入前一个对应类型的独立块
- 支持多栏文档：通过元素 X 坐标聚类自动检测列布局，各栏独立合并
- 分块只读展示，不可手动编辑或拆分
- 新增 Store 中的 `selectedChunkId` / `hoveredChunkId` 状态
- 分块选中时左侧 PDF 视图同时高亮该分块内所有元素的 bbox，并显示分块外围虚线边界框
- 分块选中与元素选中互相独立（同时只有一个生效，元素优先）
- 支持分块展开查看其包含的子元素列表（缩进显示）
- Chunk 数据通过 `useMemo` 从 `pdfInfo` 派生计算，不持久化存储

## Capabilities

### New Capabilities
- `chunk-list`: 新增分块列表功能，按书写顺序将元素合并为段落块，支持多栏检测、分块级高亮、子元素展开查看

### Modified Capabilities
<!-- 无现有 spec 的需求变更，分块列表是纯新增功能 -->

## Impact

- **frontend/src/components/right-panel/RightPanel.tsx** - 新增"分块列表"Tab 和 ChunkList 组件
- **frontend/src/components/left-panel/LeftPanel.tsx** - 新增 chunk 级高亮渲染（多元素填充 + 外围虚线框）
- **frontend/src/store/useAnnotationStore.ts** - 新增 selectedChunkId / hoveredChunkId 状态
- **新增文件**:
  - `frontend/src/utils/chunk.ts` - 分块计算算法（合并规则、多栏检测）
  - `frontend/src/components/right-panel/ChunkList.tsx` - 分块列表组件
  - `frontend/src/types/omnidoc.ts` - 新增 Chunk 类型定义
- 无后端变更，无新增依赖
