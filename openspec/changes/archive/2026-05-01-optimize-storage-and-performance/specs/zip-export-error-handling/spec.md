## ADDED Requirements

### Requirement: 导出失败时向用户反馈具体原因
`exportDocumentAsZip` 函数 MUST 在其内部每个可能失败的步骤使用 try/catch，并在失败时通过 `alert()` 或等效 UI 反馈向用户展示具体的错误原因。不得静默跳过任何失败步骤。

#### Scenario: 图片裁剪成功，导出完成
- **WHEN** 用户点击"导出 ZIP"且所有页面的图片裁剪均成功
- **THEN** 系统生成 ZIP 文件并触发浏览器下载，无任何错误提示

#### Scenario: 某页图片加载失败
- **WHEN** 导出过程中某一页的渲染图因 `img.onerror` 触发而无法裁剪
- **THEN** 系统收集该错误，继续处理其余页面，最终弹出提示 "导出部分失败：第 3 页图片加载失败，已跳过。其余内容已导出。"

#### Scenario: JSZip 生成失败
- **WHEN** ZIP 生成过程中 JSZip 抛出异常（如内容过大）
- **THEN** 系统弹出提示 "导出失败：文件过大，无法生成 ZIP。请尝试减少页数。"

#### Scenario: 文档无解析数据
- **WHEN** 用户对无 `parsedData` 的文档点击"导出 ZIP"
- **THEN** 系统弹出提示 "该文档没有可导出的解析数据"

### Requirement: 裁剪图片时坐标有效性检查
导出流程 MUST 对每个 figure/table 元素的坐标进行有效性检查：poly 点数不足 8 个、裁剪区域宽度/高度 ≤ 0、裁剪区域超出图片边界等情况 SHALL 被识别为异常并报告。

#### Scenario: 元素坐标导致裁剪区域无效
- **WHEN** 某 figure 元素的 poly 计算后裁剪宽度 ≤ 0
- **THEN** 系统记录该元素为无效裁剪，不尝试生成图片，最终在汇总提示中包含该信息

#### Scenario: 裁剪区域部分超出图片边界
- **WHEN** 元素 poly 的坐标部分超出渲染图边界
- **THEN** 系统 clamp 坐标至有效范围，正常生成裁剪图（不视为错误）
