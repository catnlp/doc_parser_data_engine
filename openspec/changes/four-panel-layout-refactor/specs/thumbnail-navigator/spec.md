## ADDED Requirements

### Requirement: 页面缩略图列表

系统 SHALL 在 P1 面板顶部展示所有页面的缩略图列表，当前页面缩略图高亮显示。

#### Scenario: 显示所有页面缩略图

- **WHEN** 文档加载完成且有多页内容
- **THEN** P1 面板顶部显示所有页面的缩略图，按页码排列

#### Scenario: 当前页面缩略图高亮

- **WHEN** P2 文档视图滚动到第 N 页
- **THEN** P1 中第 N 页的缩略图高亮显示（蓝色边框或背景）

### Requirement: 缩略图点击导航

用户点击缩略图 SHALL 触发 P2 文档视图滚动到对应页面。

#### Scenario: 点击缩略图跳转页面

- **WHEN** 用户点击 P1 中第 5 页的缩略图
- **THEN** P2 文档视图平滑滚动到第 5 页页面容器

### Requirement: 文档目录（TOC）

系统 SHALL 从文档元素中提取标题类元素（`doc_title`、`paragraph_title`、`title`）生成文档目录，展示在缩略图列表下方。

#### Scenario: 提取标题生成目录

- **WHEN** 文档包含 `doc_title` 和 `paragraph_title` 类型元素
- **THEN** P1 目录区域按元素顺序列出标题，`doc_title` 为一级，`paragraph_title` 为二级缩进

#### Scenario: 点击目录项跳转到对应位置

- **WHEN** 用户点击目录中的某个标题项
- **THEN** P2 文档视图平滑滚动到该标题元素所在页面和位置
