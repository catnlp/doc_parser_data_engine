## ADDED Requirements

### Requirement: 触发重新解析

系统 SHALL 在用户确认 bbox 修改后调用后端解析 API。

#### Scenario: bbox 调整后确认重新解析
- **WHEN** 用户拖拽 bbox 手柄后点击"确认并重新解析"
- **THEN** 系统向 `POST /api/reparse` 发送请求，携带 `{ page_no, element_id, new_poly }`

#### Scenario: 类型修改后确认重新解析
- **WHEN** 用户修改元素类型并确认
- **THEN** 系统向 `POST /api/reparse` 发送请求，携带 `{ page_no, element_id, new_poly, new_category_type }`

#### Scene: 解析进行中
- **WHEN** 重新解析请求已发出但未返回
- **THEN** 系统显示进度指示器（进度条 + 文字"正在重新解析... (PaddleOCR-VL 1.5)"），元素卡片标记为"解析中"状态

#### Scenario: 解析成功
- **WHEN** 重新解析 API 返回 200 和新解析结果
- **THEN** 系统弹出新旧内容对比视图

#### Scenario: 解析失败
- **WHEN** 重新解析 API 返回错误
- **THEN** 系统显示错误提示"解析失败，请重试"，保留原有内容

---

### Requirement: 新旧内容对比视图

系统 SHALL 提供新旧解析结果的并排对比功能。

#### Scenario: 对比视图展示
- **WHEN** 重新解析成功
- **THEN** 系统弹出对比对话框，左侧显示旧内容，右侧显示新内容，差异部分用红色/绿色高亮

#### Scenario: 使用新结果
- **WHEN** 用户点击"使用新结果"
- **THEN** 系统更新该元素的解析内容（`markdown`/`html`/`latex`），关闭对比视图，标记页面为脏状态

#### Scenario: 保留原内容
- **WHEN** 用户点击"保留原内容"
- **THEN** 系统丢弃新解析结果，保留原内容，关闭对比视图，bbox 坐标已保存

#### Scenario: 手动编辑
- **WHEN** 用户点击"手动编辑"
- **THEN** 系统关闭对比视图，切换到元素详情的"源码"编辑模式，新解析内容预填入编辑器

---

### Requirement: 批量重新解析

系统 SHALL 支持一键重新解析当前页所有元素。

#### Scenario: 批量解析
- **WHEN** 用户点击"重新解析全部"按钮
- **THEN** 系统依次对当前页所有 bbox 调用重新解析 API，逐个展示对比视图或自动应用新结果（根据用户设置）
