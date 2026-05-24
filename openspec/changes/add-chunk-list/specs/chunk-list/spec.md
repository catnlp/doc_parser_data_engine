## ADDED Requirements

### Requirement: 分块列表 Tab

系统 SHALL 在右侧面板中新增"分块列表"Tab，与"元素列表"和"解析分析"并列展示。

#### Scenario: 显示分块列表 Tab
- **WHEN** 用户进入标注页面
- **THEN** 右侧面板顶部显示三个 Tab："分块列表"、"元素列表"、"解析分析"

#### Scenario: 切换到分块列表
- **WHEN** 用户点击"分块列表"Tab
- **THEN** 面板内容切换为分块列表视图

---

### Requirement: 分块合并策略

系统 SHALL 按元素的 `order` 序列和 `category_type` 自动将元素合并为分块。

#### Scenario: 相邻文本元素合并
- **WHEN** 页面中有连续多个 `text`、`abstract`、`header`、`footer`、`footnote` 等文本类元素
- **THEN** 这些元素 SHALL 合并为同一个 chunk，标记为 `text_block`

#### Scenario: 标题触发新分块
- **WHEN** 遍历到 `title`、`paragraph_title` 或 `doc_title` 类型元素
- **THEN** 系统 SHALL 关闭当前 text 分块，并以该标题开始新分块

#### Scenario: 连续标题各成独立块
- **WHEN** 页面中有连续多个标题类元素
- **THEN** 每个标题 SHALL 独立成为一个 chunk（不合并连续标题）

#### Scenario: 表格独立成块
- **WHEN** 遍历到 `table` 类型元素
- **THEN** 该元素 SHALL 独立成为一个 chunk，标记为 `table`，不与前后元素合并

#### Scenario: 图片独立成块
- **WHEN** 遍历到 `figure`、`image` 或 `chart` 类型元素
- **THEN** 该元素 SHALL 独立成为一个 chunk，标记为 `figure`

#### Scenario: 公式与文字合并
- **WHEN** 遍历到 `equation`、`formula` 或 `display_formula` 类型元素
- **THEN** 该元素 SHALL 合并到当前活跃的 text 分块中

#### Scenario: Caption 归属主体元素
- **WHEN** 遍历到 `figure_caption` 或 `table_caption` 且前一个独立 chunk 类型为对应的主体类型（figure 或 table）
- **THEN** 该 caption SHALL 归入前一个独立 chunk

#### Scenario: Caption 找不到主体
- **WHEN** 遍历到 `figure_caption` 或 `table_caption` 但前一个独立 chunk 不是对应的主体类型
- **THEN** 该 caption SHALL 按 text 类元素处理，合并到当前 text 分块

#### Scenario: 页码元素忽略
- **WHEN** 遍历到 `page_number` 或 `number` 类型元素
- **THEN** 该元素 SHALL 被忽略，不参与任何分块

---

### Requirement: 多栏文档支持

系统 SHALL 自动检测页面是否为多栏布局，并在分栏模式下各栏独立合并元素。

#### Scenario: 单栏布局检测
- **WHEN** 页面元素 left 坐标分布无明显的双峰特征
- **THEN** 系统 SHALL 将页面识别为单栏布局

#### Scenario: 双栏布局检测
- **WHEN** 页面元素 left 坐标分布存在明显的双峰特征（两聚类中心间距 > 15% 页面宽度）
- **THEN** 系统 SHALL 将页面识别为双栏布局

#### Scenario: 各栏独立合并
- **WHEN** 页面为双栏布局且两个栏内分别有文本元素
- **THEN** 左栏和右栏的文本元素 SHALL 分别在各自的活跃分块中独立合并

#### Scenario: 跨栏标题打断所有栏
- **WHEN** 双栏布局中出现跨栏（columnIndex = -1）的标题元素
- **THEN** 系统 SHALL 同时关闭左栏和右栏的活跃分块，并以该标题开始新的跨栏分块

#### Scenario: 跨栏宽图的归属
- **WHEN** 元素 bbox 宽度超过页面宽度的 60%
- **THEN** 该元素 SHALL 被识别为跨栏元素（columnIndex = -1）

---

### Requirement: 分块只读展示

分块 SHALL 以只读方式展示，不支持手动创建、拆分、合并或删除。

#### Scenario: 分块不可编辑
- **WHEN** 用户查看分块列表
- **THEN** 分块卡片的类型标签、包含的元素数、子元素列表 SHALL 均不可编辑

---

### Requirement: 分块高亮联动

系统 SHALL 在分块选中或悬停时，在左侧 PDF 视图中高亮该分块内所有元素的 bbox 区域。

#### Scenario: 选中分块高亮所有子元素
- **WHEN** 用户点击分块卡片选中某个分块
- **THEN** 左侧 PDF 视图中该分块内所有元素的 bbox SHALL 显示半透明填充（10% opacity），并绘制外围虚线边界框

#### Scenario: 悬停分块预览高亮
- **WHEN** 用户鼠标悬停在分块卡片上
- **THEN** 左侧 PDF 视图中该分块内所有元素的 bbox SHALL 显示更淡的预览填充（5% opacity）

#### Scenario: 元素选中与分块选中互斥
- **WHEN** 用户已在分块列表中选中分块，随后点击某个元素的 bbox 或卡片
- **THEN** 系统 SHALL 取消分块选中，切换为元素选中（元素优先）

#### Scenario: 分块选中与元素选中互斥
- **WHEN** 用户已在元素列表中选中某个元素，随后点击某个分块卡片
- **THEN** 系统 SHALL 取消元素选中，切换为分块选中

---

### Requirement: 分块展开查看子元素

分块卡片 SHALL 支持展开以查看其包含的子元素列表。

#### Scenario: 展开分块查看子元素
- **WHEN** 用户点击分块卡片的展开按钮
- **THEN** 分块卡片 SHALL 展开，在其下方以缩进形式显示包含的所有子元素

#### Scenario: 子元素列表缩进显示
- **WHEN** 分块展开后的子元素列表被渲染
- **THEN** 每个子元素 SHALL 以缩进形式显示，包含：order 序号、类型标签、内容预览（截断）

#### Scenario: 收起分块
- **WHEN** 用户再次点击分块卡片的展开按钮
- **THEN** 子元素列表 SHALL 收起

---

### Requirement: 分块数据派生计算

分块数据 SHALL 不持久化存储，而是通过 React `useMemo` 从当前页面的 `pdfInfo` 元素数组派生计算。

#### Scenario: 元素变化触发重算
- **WHEN** 当前页面的元素被编辑、新增、删除或排序
- **THEN** 分块列表 SHALL 自动重新计算并更新显示

#### Scenario: 分块不存入 Store
- **WHEN** 系统运行分块计算
- **THEN** Chunk 数据 SHALL 不写入 Zustand Store，仅存在于组件的 useMemo 中

---

### Requirement: 分块数据计算正确性

系统 SHALL 在元素编辑、移动、删除后重新计算分块，确保分块列表始终反映最新的文档结构和元素顺序。

#### Scenario: 元素拖拽排序后重新分块
- **WHEN** 用户在元素列表中对元素进行拖拽排序
- **THEN** 系统 SHALL 基于新的 order 顺序重新计算分块

#### Scenario: 元素类别修改后重新分块
- **WHEN** 用户将某个元素的 `category_type` 从 `text` 修改为 `table`
- **THEN** 系统 SHALL 重新计算分块，该元素将独立成块（不再与周围文字合并）

---

### Requirement: 分块列表搜索和类型筛选

分块列表 SHALL 支持按分块标签或子元素内容搜索，以及按分块类型筛选，帮助用户快速定位目标分块。

#### Scenario: 搜索分块内容
- **WHEN** 用户在已切换至分块列表 Tab 时输入搜索内容
- **THEN** 系统 SHALL 展示列表中分块标签或子元素内容包含该搜索关键词的分块列表

#### Scenario: 按类型筛选分块
- **WHEN** 用户在已切换至分块列表 Tab 时选择分块类型筛选条件
- **THEN** 系统 SHALL 仅展示匹配该类型的分块（如仅展示表格分块）
