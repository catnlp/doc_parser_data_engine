## REMOVED Requirements

### Requirement: 用户可导出当前页标注数据为 JSON 文件
**Reason**: 升级为 zip 打包导出，将标注数据和图片一起打包
**Migration**: 使用新的 zip-export 能力替代

### Requirement: 导出的 JSON 文件格式规范
**Reason**: 升级为 zip 打包导出，JSON 内嵌在 zip 中
**Migration**: JSON 格式保留，但作为 annotations.json 存在于 zip 包内

### Requirement: 导出文件命名规范
**Reason**: 文件名从 .json 改为 .zip
**Migration**: 命名格式不变，扩展名改为 .zip

## ADDED Requirements

### Requirement: 用户可导出当前页标注数据和图片为 zip 文件
系统 MUST 在顶部工具栏提供导出按钮，用户点击后将当前页所有标注数据和引用的图片打包为 zip 文件并触发浏览器下载。zip 文件 MUST 包含 annotations.json 和 images 文件夹。

#### Scenario: 用户点击导出按钮
- **WHEN** 用户点击顶部工具栏的"导出"按钮
- **THEN** 系统生成包含标注数据和图片的 zip 文件并触发浏览器下载

#### Scenario: 标注文档不存在时的导出
- **WHEN** 用户未加载任何 PDF 文档时点击导出按钮
- **THEN** 系统不触发下载，并提示用户先加载文档

### Requirement: 导出 zip 文件结构规范
导出的 zip 文件 MUST 包含以下结构：顶层 `annotations.json`（标注数据）+ `images/` 文件夹（所有 figure 类型元素引用的图片）。annotations.json 中 figure 元素的 `image_path` 字段 MUST 更新为相对于 zip 根目录的路径（如 `images/1.png`）。

#### Scenario: 无 figure 元素的导出
- **WHEN** 当前页不包含 figure 类型标注元素
- **THEN** 导出 zip 仅包含 annotations.json，不包含 images 文件夹

#### Scenario: 包含 figure 元素的导出
- **WHEN** 当前页包含 figure 类型标注元素且 image_path 有效
- **THEN** 标注数据 JSON 包含对应图片文件，路径更新为相对路径

#### Scenario: 多个 figure 元素的导出
- **WHEN** 当前页包含多个 figure 类型标注元素
- **THEN** 所有图片按出现序号命名（1.png, 2.png, ...）并保存到 images 文件夹

### Requirement: 导出文件命名规范
导出的 zip 文件名 MUST 以 `{原始PDF文件名}_{页码}.zip` 格式命名，其中原始 PDF 文件名不含扩展名。

#### Scenario: 基于 PDF 文件名的导出命名
- **WHEN** 用户加载了名为 `report.pdf` 的文档并在第 3 页点击导出
- **THEN** 下载的文件名为 `report_3.zip`

#### Scenario: 无 PDF 文件名时的导出命名
- **WHEN** 用户未通过文件选择加载 PDF（如直接加载数据）时点击导出
- **THEN** 下载的文件名为 `page_{页码}.zip`
