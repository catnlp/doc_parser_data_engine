## Context

当前 `useDocumentListStore` 完全在内存中，使用 Zustand 管理状态。`PdfDocument` 类型包含 `file: File` 字段，File 对象无法通过 JSON.stringify 持久化。刷新页面后整个 store 重置为空数组。

## Goals / Non-Goals

**Goals:**
- 解析完成后，将文档的 name、pageCount、parsedData 持久化到 localStorage
- 页面加载时从 localStorage 恢复文档列表，状态为 "saved"（无 File 对象）
- 用户点击 saved 文档时，弹出文件选择器，选择后恢复 File 对象并进入标注页
- 已完成/失败的文档支持"重新解析"，重新运行 Layout + OCR 流程
- 支持清除单条或全部已保存记录

**Non-Goals:**
- 不使用 IndexedDB 存储 File blob（增加复杂度，用户重新选择文件即可）
- 不修改后端 API
- 不实现云端同步

## Decisions

### 1. 存储策略：localStorage vs IndexedDB
**决策**: 使用 localStorage。
**理由**: parsedData（base64 图片 + layout/ocr 元素）总大小通常在几 MB 以内，localStorage 的 5-10MB 限制在可接受范围内。超出限制时捕获异常并清理最旧记录。

### 2. 持久化字段：只存元数据 + 解析结果
**决策**: 存储 schema 为 `{ name, pageCount, status, parsedData, error }`，不存储 File 对象。
**理由**: File 对象不可序列化。恢复时通过用户重新选择文件来重建。

### 3. "已保存" 状态：复用 existing DocumentStatus vs 新增 status
**决策**: 新增 status 'saved'，与 done/error 区分。saved 表示有解析数据但无 File 对象。
**理由**: done/error 都表示当前会话中的状态，saved 表示持久化后的跨会话状态，需要区分以提供不同的 UI 交互。

### 4. 重新解析流程
**决策**: 将文档状态从 saved/done/error 改回 pending，然后复用现有的 `parsePdfDocument` 流程。用户上传文件后自动触发解析。
**理由**: 复用现有解析逻辑，最小化代码改动。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| localStorage 空间不足 | 捕获 QuotaExceededError，清理最旧记录或提示用户 |
| 大文件解析数据超过 5MB | 压缩存储（仅存必要字段）、超限警告 |
| 用户误删已保存数据 | 提供确认对话框 |

## Migration Plan

纯前端改动，无迁移。刷新页面即生效。
