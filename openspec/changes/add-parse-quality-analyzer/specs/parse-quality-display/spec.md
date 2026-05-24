## ADDED Requirements

### Requirement: 列表页展示文档解析质量摘要
每条状态为"已完成"的文档，MUST 在文档卡片中展示解析质量摘要，包含平均布局置信度、平均 OCR 置信度、降级元素数和空白元素数。

#### Scenario: 已完成文档显示质量摘要
- **WHEN** 文档解析完成，状态为 "done" 或 "saved"
- **THEN** 文档卡片中显示一行质量摘要，包含布局置信度百分比、OCR 置信度百分比、降级数和空白数
- **AND** 置信度 ≥ 90% 显示为绿色，70%–90% 显示为橙色，< 70% 显示为红色

#### Scenario: 无降级元素时隐藏降级计数
- **WHEN** 文档所有元素均无 `demoted` 标记
- **THEN** 质量摘要中不显示降级计数

#### Scenario: 无空白元素时隐藏空白计数
- **WHEN** 文档所有元素的 OCR 文本均非空
- **THEN** 质量摘要中不显示空白计数

#### Scenario: 旧数据无 confidence 字段
- **WHEN** 加载已有 localStorage 文档，其 `ocrElements` 中无 `confidence` 字段
- **THEN** OCR 置信度显示为 "—"，布局置信度仍正常显示（来自 `layoutElements[].score`）

#### Scenario: 部分页面解析失败的文档
- **WHEN** 文档部分页面解析失败（`parsedPageCount < pageCount`）
- **THEN** 质量摘要额外显示失败页面数，以红色标注

### Requirement: 标注页展示当前页解析质量详情
标注页右侧面板 MUST 提供"解析分析"Tab，展示当前页的详细解析质量指标，包括布局置信度分布、OCR 置信度分布、元素类型统计和降级详情。

#### Scenario: 切换到解析分析 Tab
- **WHEN** 用户在标注页点击右侧面板的"解析分析"Tab
- **THEN** 面板切换为分析视图，显示当前页的综合评分、元素类型统计和每元素置信度列表

#### Scenario: 切回元素列表 Tab
- **WHEN** 用户在分析视图中点击"元素列表"Tab
- **THEN** 面板切换回元素列表视图，保持之前的选中状态

#### Scenario: 翻页时分析面板自动更新
- **WHEN** 用户切换到其他页面（通过翻页按钮或底部页码导航）
- **THEN** 分析面板展示新当前页的解析质量指标

#### Scenario: 每元素置信度列表
- **WHEN** 用户在分析面板中查看元素详情列表
- **THEN** 列表展示每个元素的类型图标、布局置信度色条和 OCR 置信度色条
- **AND** 降级元素标记 ⚠️ 图标
- **AND** 空白 OCR 元素标记 ○ 图标

#### Scenario: 公式/表格远程识别元素无 OCR 置信度
- **WHEN** 元素是通过远程公式/表格 API 识别的（无 OCR 流程）
- **THEN** 该元素的 OCR 置信度显示为 "N/A"

#### Scenario: 分析面板颜色编码
- **WHEN** 展示置信度数值或色条
- **THEN** 使用绿色（≥0.90）、橙色（0.70–0.89）、红色（<0.70）三档编码，颜色值引用 CSS 变量 `--color-success`、`--color-warning`、`--color-danger`

### Requirement: 存在活跃变更时保持默认元素列表视图
系统 MUST 在右侧面板新增 Tab 后仍以"元素列表"为默认视图，避免影响用户的既有标注工作流。

#### Scenario: 首次进入标注页
- **WHEN** 用户首次进入某文档的标注页
- **THEN** 右侧面板默认显示"元素列表"Tab

#### Scenario: 页面刷新后
- **WHEN** 用户刷新标注页
- **THEN** 右侧面板重置为"元素列表"Tab
