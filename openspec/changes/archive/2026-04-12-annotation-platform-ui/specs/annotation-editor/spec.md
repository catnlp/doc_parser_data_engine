## ADDED Requirements

### Requirement: 元素列表展示

系统 SHALL 以列表形式展示当前页面所有元素，支持拖拽排序和预览。

#### Scenario: 默认显示元素列表
- **WHEN** 用户进入标注页面
- **THEN** 右侧面板默认显示"元素列表" Tab，按 `order` 升序排列所有元素

#### Scenario: 列表项显示摘要
- **WHEN** 渲染列表项时
- **THEN** 每项显示：阅读序号 ≡N、类型图标（📝/📊/🖼️/📐）、内容摘要（截断至 80 字符）

#### Scenario: 列表项内容预览
- **WHEN** element 类型为 text/title
- **THEN** 内容摘要显示 `markdown` 字段的前 80 字符
- **WHEN** element 类型为 table
- **THEN** 内容摘要渲染 HTML table 预览（缩略渲染）
- **WHEN** element 类型为 figure
- **THEN** 内容摘要显示 `[image: image_path]`
- **WHEN** element 类型为 equation
- **THEN** 内容摘要使用 KaTeX 渲染 `latex` 字段

---

### Requirement: 元素详情预览模式

系统 SHALL 支持元素详情的预览视图（渲染后内容）。

#### Scenario: 切换到详情 Tab
- **WHEN** 用户点击某个 bbox 或列表项
- **THEN** 右侧面板切换到"元素详情" Tab，默认显示预览模式

#### Scenario: 预览模式内容渲染
- **WHEN** element 类型为 text/title/header/footer
- **THEN** 使用 react-markdown + remark-gfm 渲染 `markdown` 字段
- **WHEN** element 类型为 table/table_caption
- **THEN** 渲染 `html` 字段为 HTML 表格（需经 DOMPurify sanitize）
- **WHEN** element 类型为 figure
- **THEN** 显示 `image_path` 对应的图片，figure_caption 显示 `markdown` 内容
- **WHEN** element 类型为 equation
- **THEN** 使用 KaTeX 渲染 `latex` 字段

---

### Requirement: 元素详情源码模式

系统 SHALL 支持切换到源码编辑模式，查看和编辑原始内容。

#### Scenario: 切换到源码模式
- **WHEN** 用户在详情 Tab 点击"源码"按钮
- **THEN** 视图切换为 @uiw/react-codemirror 代码编辑器

#### Scenario: 源码模式高亮规则
- **WHEN** element 类型为 text/title/header/footer
- **THEN** 编辑器语言设置为 Markdown
- **WHEN** element 类型为 table/table_caption
- **THEN** 编辑器语言设置为 HTML
- **WHEN** element 类型为 equation
- **THEN** 编辑器显示 LaTeX 源码（等宽字体，无语法高亮）
- **WHEN** element 类型为 figure
- **THEN** 编辑器显示 `image_path` 的文本路径

#### Scenario: 源码与预览切换
- **WHEN** 用户从源码模式切回预览模式
- **THEN** 系统自动保存当前编辑内容为草稿（不提交到后端），然后渲染预览

---

### Requirement: 元素元信息编辑

系统 SHALL 支持修改元素类型。

#### Scenario: 修改元素类型
- **WHEN** 用户在详情 Tab 的类型下拉框中选择新类型
- **THEN** 系统更新该元素的 `category_type`，左侧 bbox 颜色相应变化，内容区域切换到新类型对应的渲染/编辑器

#### Scenario: 修改类型触发重新解析
- **WHEN** 用户修改了元素类型
- **THEN** 系统弹出确认"修改类型后将重新解析该元素"，用户确认后触发重新解析流程

---

### Requirement: 双向十字高亮

系统 SHALL 在左侧 bbox 和右侧列表项之间实现双向联动。

#### Scenario: 列表项 hover 联动 bbox
- **WHEN** 鼠标悬停在右侧列表项上
- **THEN** 左侧对应 bbox 填充透明度变为 25%，边框变为 2px 虚线

#### Scenario: 列表项点击联动 bbox
- **WHEN** 用户点击右侧列表项
- **THEN** 左侧对应 bbox 高亮（45% 透明度 + 3px 边框），右侧切换到元素详情
