## ADDED Requirements

### Requirement: 解析结果持久化
系统 SHALL 在文档解析完成后（status=done），将文档元数据（name、pageCount、parsedData）保存到 localStorage。

#### Scenario: 解析完成自动保存
- WHEN 文档解析完成
- THEN 系统将该记录的 name、pageCount、status、parsedData 写入 localStorage 的 'parsedDocuments' 键

### Requirement: 页面加载时恢复
系统 SHALL 在页面初始化时从 localStorage 读取已保存的文档列表，并以 'saved' 状态展示。

#### Scenario: 首次加载无历史
- WHEN 用户首次打开页面或 localStorage 为空
- THEN 列表为空，不显示任何已保存文档

#### Scenario: 恢复已保存文档
- WHEN 用户打开页面且 localStorage 中有已保存记录
- THEN 系统恢复这些文档到列表，状态为 saved，显示文件名和页数

### Requirement: 已保存文档加载
系统 SHALL 允许用户通过文件选择器重新选择原始文件来加载已保存的文档。

#### Scenario: 选择已保存文档
- WHEN 用户点击状态为 saved 的文档
- THEN 系统弹出文件选择器，选择后将 File 对象绑定到该文档并进入标注页
