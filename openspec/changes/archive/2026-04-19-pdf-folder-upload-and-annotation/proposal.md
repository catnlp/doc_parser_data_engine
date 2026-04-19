## Why

当前系统仅支持单文件 PDF 上传，上传后立即进入单页标注界面。用户需要批量处理多个 PDF 文件时，必须逐个上传、等待解析、标注后再返回重新上传，流程低效。同时，解析完成后的标注结果缺乏集中查看入口，用户无法快速浏览和管理多份文档的标注状态。

## What Changes

- 支持文件夹上传（`webkitdirectory`），一次性选择多个 PDF 文件
- 新增 PDF 列表视图，展示已选文件及其解析状态（待解析、解析中、解析完成、解析失败）
- 支持批量解析所有选中的 PDF 文件，显示整体解析进度
- 解析完成后可点击任意 PDF 条目进入标注详情页，查看该 PDF 的标注结果
- 支持在标注详情页返回列表，继续处理其他文档

## Capabilities

### New Capabilities
- `folder-upload`: 支持文件夹上传及多文件选择能力
- `pdf-list-view`: PDF 列表视图，展示文件信息与解析状态
- `batch-parsing`: 批量解析多个 PDF 文件，支持进度追踪
- `annotation-navigation`: 从列表点击进入标注详情页，支持返回导航

### Modified Capabilities
<!-- 现有能力需求无变更，仅新增功能 -->

## Impact

- **Frontend**: `App.tsx` 初始化流程需重构，新增文件夹上传组件、PDF 列表视图组件
- **Store**: `useAnnotationStore.ts` 需扩展以支持多文档状态管理（当前仅支持单文档）
- **API**: 后端 `api_ocr.py` 无需改动（当前按页调用的 API 设计已支持多文件并发请求）
- **路由/导航**: 需引入简单的视图状态管理（列表视图 ↔ 标注视图）
