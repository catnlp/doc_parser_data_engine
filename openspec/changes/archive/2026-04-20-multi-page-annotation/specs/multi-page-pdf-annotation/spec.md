## ADDED Requirements

### Requirement: PDF 多页解析
系统 SHALL 解析 PDF 文件的每一页，逐页调用 Layout API 和 OCR API，将每页的渲染图片、布局元素和 OCR 文本依次存入 parsedData 数组。

#### Scenario: 多页 PDF 解析
- **WHEN** 用户上传了一个 5 页的 PDF 文件并开始解析
- **THEN** 系统依次处理第1页到第5页，每页调用 Layout API 然后 OCR API，parsedData 数组包含 5 个元素

#### Scenario: 单页 PDF 解析
- **WHEN** 用户上传了一个仅有 1 页的 PDF 文件
- **THEN** 系统仅处理第1页，行为与现有单页解析一致

#### Scenario: 解析失败
- **WHEN** PDF 文件中某一页的 Layout API 或 OCR API 调用失败
- **THEN** 整个文档状态标记为 error

### Requirement: 获取 PDF 总页数
系统 SHALL 在开始解析前通过 pdf.js 获取 PDF 文件的总页数，并更新到文档的 pageCount 字段。

#### Scenario: 获取页数成功
- **WHEN** 解析开始时读取 PDF 文件头
- **THEN** 使用 pdfjs.getDocument 加载文档并调用 pdf.getNumPages() 获取页数，更新 pageCount 字段

### Requirement: 标注页多页导航
系统 SHALL 在标注页面中根据文档的实际页数启用翻页导航，用户可通过 TopBar 和 BottomNav 在页之间切换。

#### Scenario: 显示正确页数
- **WHEN** 用户进入标注页面
- **THEN** TopBar 显示 "1 / N"（N 为文档总页数），BottomNav 显示 1 到 N 的页码按钮

#### Scenario: 翻页切换
- **WHEN** 用户点击"上一页"或"下一页"按钮
- **THEN** 当前页更新，左侧面板展示对应页的渲染图片和标注元素

#### Scenario: 边界页禁用按钮
- **WHEN** 用户处于第1页
- **THEN** "上一页"按钮禁用；用户处于第 N 页时"下一页"按钮禁用

### Requirement: 页级标注数据隔离
系统 SHALL 为每一页独立存储和展示标注数据（elements、pageInfo、renderedImage），切换页时加载对应页的数据。

#### Scenario: 切换页时数据更新
- **WHEN** 用户从第 1 页切换到第 3 页
- **THEN** pdfInfo 取 index 2 的元素，renderedImage 取 index 2 的图片，右侧面板展示第 3 页的标注元素列表
