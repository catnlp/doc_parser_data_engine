## ADDED Requirements

### Requirement: 文件夹上传入口
系统 SHALL 提供一个文件夹上传入口，允许用户选择包含 PDF 文件的本地文件夹。

#### Scenario: 点击文件夹上传按钮
- **WHEN** 用户点击"选择文件夹"按钮
- **THEN** 系统弹出原生文件夹选择对话框

### Requirement: PDF 文件筛选
系统 SHALL 从所选文件夹中提取所有 `.pdf` 后缀文件，并过滤掉非 PDF 文件。

#### Scenario: 文件夹中包含混合文件类型
- **WHEN** 用户选择的文件夹中包含 5 个 PDF 文件和 3 个 JPG 图片
- **THEN** 系统仅识别并加载 5 个 PDF 文件

### Requirement: 降级单文件上传
系统 SHALL 同时保留单文件上传入口，作为 `webkitdirectory` 不可用时的降级方案。

#### Scenario: 使用单文件上传
- **WHEN** 用户通过单文件上传入口选择 3 个 PDF 文件
- **THEN** 系统将这 3 个 PDF 文件加入待解析列表，行为与文件夹上传一致

### Requirement: 空文件夹处理
系统 SHALL 在用户选择的文件夹中不包含任何 PDF 文件时，显示友好的提示信息。

#### Scenario: 文件夹中无 PDF 文件
- **WHEN** 用户选择的文件夹中没有任何 PDF 文件
- **THEN** 系统显示提示："所选文件夹中未找到 PDF 文件"
