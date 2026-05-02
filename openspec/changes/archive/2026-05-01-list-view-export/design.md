## Context

当前 `TopBar.tsx` 的 `handleExport` 只导出当前页：生成 annotations.json + 从 canvas 裁剪 figure 图片。数据全来自 `useAnnotationStore`（单页）。

PdfListView 中每个"解析完成"的 document 已有 `parsedData: ParsedPageData[]`，包含所有页的 imageBase64 / layoutElements / ocrElements，可直接用于导出，无需重新调用 API。

## Goals / Non-Goals

**Goals:**
- 从列表页一键导出整份文档的标注数据 (ZIP)
- ZIP 包含：每页 annotations.json、每页渲染图、每张裁剪 figure
- 支持单文档导出

**Non-Goals:**
- 不批量导出整个列表为一个大 ZIP（可后续扩展）
- 不修改后端 API

## Decisions

### 1. 数据来源：documentListStore.parsedData
**决策**: 直接用 `PdfDocument.parsedData` 组装导出数据，而非从 annotationStore 取。
**理由**: 用户在列表看到的文档可能没有加载到 annotationStore（如 saved 状态文档），但 parsedData 始终完整可用。这也意味着导出的是**解析原始结果**，不含用户在标注界手工编辑的元素——与"解析结果交付"语义一致。

### 2. ZIP 结构
```
document_name/
├── metadata.json          # 文档名、页数、导出时间
├── annotations.json       # 全部页的标注数据
├── page_001.png
├── page_002.png
└── images/
    ├── page_001_figure_001.png
    ├── page_001_table_001.png
    └── ...
```

### 3. 移除 TopBar 导出
**决策**: 删除 TopBar 的导出按钮，统一用列表页导出。
**理由**: 功能重复，减少维护面。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 多页大文档 ZIP 体积过大 | 仅存 base64 转 blob，JSZip 内存处理上限约 500MB；超大文档提示 |

## Migration Plan

前端代码改动，删除 TopBar 按钮、PdfListView 新增按钮，刷新即生效。
