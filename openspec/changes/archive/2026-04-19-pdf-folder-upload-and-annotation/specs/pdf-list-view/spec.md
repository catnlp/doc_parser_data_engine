## ADDED Requirements

### Requirement: PDF 列表展示
系统 SHALL 在用户选择文件夹后，展示一个包含所有待处理 PDF 文件的列表视图。

#### Scenario: 显示 PDF 列表
- **WHEN** 用户完成文件夹选择
- **THEN** 系统展示列表，每行包含文件名、页数（如可获取）、解析状态图标

### Requirement: 解析状态展示
系统 SHALL 为列表中的每个 PDF 文件展示其当前解析状态，状态包括：pending、parsing、done、error。

#### Scenario: 初始状态为待解析
- **WHEN** PDF 文件刚被加入列表且尚未开始解析
- **THEN** 该文件的状态显示为"⏳ 待解析"

#### Scenario: 解析完成状态
- **WHEN** 某个 PDF 文件的 Layout 和 OCR 解析全部完成
- **THEN** 该文件的状态显示为"✅ 解析完成"，且该行变为可点击

#### Scenario: 解析失败状态
- **WHEN** 某个 PDF 文件在解析过程中发生错误
- **THEN** 该文件的状态显示为"❌ 解析失败"，并显示错误摘要

### Requirement: 点击查看详情
系统 SHALL 允许用户点击解析状态为 done 的 PDF 条目，进入该 PDF 的标注详情页面。

#### Scenario: 点击已解析完成的 PDF
- **WHEN** 用户点击状态为"✅ 解析完成"的 PDF 行
- **THEN** 系统切换到标注详情视图，展示该 PDF 的标注结果

### Requirement: 返回列表导航
系统 SHALL 在标注详情页面中提供"返回列表"入口，允许用户返回 PDF 列表继续处理其他文档。

#### Scenario: 从标注页返回列表
- **WHEN** 用户在标注详情页点击"返回列表"按钮
- **THEN** 系统切换回 PDF 列表视图，保留所有文件的解析状态
