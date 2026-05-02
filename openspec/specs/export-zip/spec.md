## ADDED Requirements

### Requirement: 列表页导出 ZIP
系统 SHALL 为每条"解析完成"的文档提供"导出 ZIP"按钮，点击后生成并下载包含该文档所有页标注数据和图片的 ZIP 文件。

#### Scenario: 导出单份文档
- WHEN 用户点击"导出 ZIP"按钮
- THEN 生成 ZIP 文件，包含 annotations.json + 每页渲染图 + 裁剪的 figure/table 图片
- AND 浏览器自动下载 `{文档名}.zip`
