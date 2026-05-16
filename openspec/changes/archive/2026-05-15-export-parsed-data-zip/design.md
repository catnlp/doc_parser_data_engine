## Context

当前 `PdfListView.tsx` 中的 `exportDocumentAsZip` 函数已实现基础 ZIP 导出：
- 每页渲染图 `page_NNN.png`（base64 → PNG）
- 裁剪的 figure/table 图片 `images/page_NNN_figure_NNN.png`
- `annotations.json`：仅包含 `{ category_type, poly, text, page }` 数组

用户需要更完整的导出结构，JSON 需包含图片路径引用和完整元素信息。

## Goals / Non-Goals

**Goals:**
- 导出 ZIP 包含每页整页图片和对应 JSON 解析结果
- JSON 中包含图片路径引用和所有解析元素信息
- 保持导出流程稳定可靠

**Non-Goals:**
- 不修改裁剪 figure/table 图片的逻辑（这部分作为附加功能保留）
- 不改变导出触发入口

## Decisions

### 决策 1：JSON 结构

```json
{
  "document_name": "example.pdf",
  "total_pages": 3,
  "pages": [
    {
      "page_number": 1,
      "image_path": "page_001.png",
      "page_info": { "width": 1200, "height": 1600 },
      "elements": [
        {
          "category_type": "text",
          "poly": [x1,y1,x2,y2,x3,y3,x4,y4],
          "text": "...",
          "order": 0
        },
        {
          "category_type": "display_formula",
          "poly": [...],
          "latex": "$$\\frac{a}{b}$$",
          "order": 1
        },
        {
          "category_type": "table",
          "poly": [...],
          "html": "<table>...</table>",
          "order": 2
        }
      ]
    }
  ]
}
```

**备选方案：**
- A. 每页一个 JSON 文件 — 文件过多，不便管理
- B. 单个 JSON + 图片路径引用 — 简洁统一

**选择：B**，保持单 JSON 文件，通过 `image_path` 引用图片。

### 决策 2：保留裁剪图片生成

现有的 figure/table 裁剪图片作为附加功能保留，但 JSON 中只引用整页图片路径。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|---|---|
| 大文件 ZIP 体积过大 | 已有错误提示 "文件过大，无法生成 ZIP" |
| 图片 base64 → PNG 转换内存占用 | 逐页处理，避免同时加载所有页 |
