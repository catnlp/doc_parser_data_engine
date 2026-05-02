## ADDED Requirements

### Requirement: 文档内页面并发解析
系统 MUST 支持文档内多个页面并发解析，每页独立执行 "渲染 PDF → 调用 Layout API → 调用 OCR API" 流程。并发数 SHALL 可配置，默认值为 3。

#### Scenario: 单页文档解析不变
- **WHEN** 文档仅有 1 页
- **THEN** 解析流程与当前串行模式行为一致，无额外并发开销

#### Scenario: 多页文档并发解析
- **WHEN** 文档有 5 页且并发数设置为 3
- **THEN** 系统同时发起页面 1、2、3 的解析，第 4 页在任一前序页面完成后立即开始，总耗时显著低于串行模式

#### Scenario: 逐页增量更新状态
- **WHEN** 并发解析中某一页完成
- **THEN** 系统调用 `updateDocumentStatus` 将该页的 `ParsedPageData` 追加至 store，前端列表可实时显示已解析页数

#### Scenario: 某页解析失败不影响其他页
- **WHEN** 并发解析中第 2 页 OCR API 返回错误
- **THEN** 第 2 页标记为失败（记录错误信息），第 1、3、4、5 页继续正常解析，最终文档状态为 "done"（部分成功）

#### Scenario: 全部页解析失败
- **WHEN** 并发解析中所有页均失败
- **THEN** 文档状态更新为 "error"，`parsedData` 为空数组

#### Scenario: 并发数可通过环境变量配置
- **WHEN** 环境变量 `VITE_PARSE_CONCURRENCY` 设置为 5
- **THEN** 系统以并发数 5 执行解析

### Requirement: 解析进度可观测
系统 MUST 在解析过程中将已完成的页数写入 store，使得 UI 可展示进度（如 "3/10 页"）。进度信息 SHALL 与当前 "🔄 解析中" 状态共存。

#### Scenario: 列表页展示解析进度
- **WHEN** 一份 10 页文档正在解析且 4 页已完成
- **THEN** 列表页该文档行显示 "🔄 解析中 (4/10)"
