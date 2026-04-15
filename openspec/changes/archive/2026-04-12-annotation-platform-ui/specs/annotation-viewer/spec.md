## ADDED Requirements

### Requirement: 文档页面渲染

系统 SHALL 能够渲染 PDF 页面或图片文件，为版面 bbox 叠加提供画布。

#### Scenario: 渲染 PDF 页面
- **WHEN** 用户进入标注页面且输入数据为 PDF
- **THEN** 系统使用 react-pdf 渲染当前页的完整内容

#### Scenario: 渲染图片
- **WHEN** 用户进入标注页面且输入数据为图片路径
- **THEN** 系统使用 `<img>` 标签渲染图片，保持原始宽高比

#### Scenario: 渲染失败处理
- **WHEN** PDF 或图片加载失败
- **THEN** 系统显示错误提示"文档加载失败"，并提供重试按钮

---

### Requirement: Bbox 叠加可视化

系统 SHALL 在文档画布上叠加显示 PP-DocLayoutV3 的版面检测结果。

#### Scenario: 渲染所有顶层 bbox
- **WHEN** 页面数据加载完成
- **THEN** 系统为 `pdf_info` 中的每个元素渲染一个 SVG `<polygon>` 叠加层，仅展示外层 bbox，不展示嵌套关系

#### Scenario: Bbox 颜色按类型区分
- **WHEN** bbox 渲染时
- **THEN** 系统根据 `category_type` 使用不同颜色：
  - `text` / `title`: #3B82F6 (蓝色) 15% 半透明填充 + 1px 边框
  - `table` / `table_caption`: #10B981 (绿色) 15% 半透明填充 + 1px 边框
  - `figure` / `figure_caption`: #F59E0B (琥珀色) 15% 半透明填充 + 1px 边框
  - `equation`: #8B5CF6 (紫色) 15% 半透明填充 + 1px 边框
  - `header` / `footer`: #9CA3AF (灰色) 15% 半透明填充 + 1px 边框

#### Scenario: 坐标缩放适配
- **WHEN** 页面显示尺寸与 `page_info` 中的原始尺寸不一致
- **THEN** 系统将 `poly` 坐标按比例缩放，确保 bbox 精确定位到文档对应位置

#### Scenario: 阅读顺序序号 badge
- **WHEN** bbox 渲染时
- **THEN** 系统在 bbox 左上角显示一个半透明 badge，数值为 `order + 1`，白色文字，加粗

---

### Requirement: Hover 交互

系统 SHALL 支持鼠标悬停时的双向高亮。

#### Scenario: Hover bbox 高亮
- **WHEN** 鼠标悬停在某个 bbox 上
- **THEN** 该 bbox 填充透明度变为 25%，边框变为 2px 虚线，右侧对应元素卡片背景微高亮

#### Scenario: Hover 离开恢复
- **WHEN** 鼠标移开 bbox
- **THEN** bbox 恢复默认样式（15% 透明度，1px 实线边框）

---

### Requirement: Bbox 选中

系统 SHALL 支持点击选中 bbox。

#### Scenario: 点击 bbox 选中
- **WHEN** 用户点击某个 bbox
- **THEN** 该 bbox 填充透明度变为 45%，边框变为 3px 实线，显示 4 角拖拽手柄，右侧面板切换到"元素详情" Tab

#### Scenario: 点击空白区域取消选中
- **WHEN** 用户点击 bbox 外的空白区域
- **THEN** 取消当前选中，bbox 恢复默认样式，右侧面板切回"元素列表" Tab

---

### Requirement: 类型颜色图例

系统 SHALL 在左侧面板底部显示类型颜色图例。

#### Scenario: 显示图例
- **WHEN** 页面加载完成
- **THEN** 底部显示图例：■ text(蓝) ■ title(蓝) ■ table(绿) ■ figure(琥珀) ■ equation(紫) ■ header(灰) ■ footer(灰)
