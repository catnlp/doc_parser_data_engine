## Context

当前项目仅有数据工程方案文档，尚未有任何前端代码。标注平台需要从零构建。

输入数据遵循 OmniDocBench 格式：
```jsonc
{
  "image_path": "path/to/image.png",
  "pdf_info": [
    {
      "category_type": "text",    // 元素类型
      "poly": [x1,y1,x2,y2,x3,y3,x4,y4],  // 8点 polygon 坐标
      "order": 0,                  // 阅读顺序
      "latex": "",                 // equation 类型的内容
      "html": "",                  // table 类型的内容
      "markdown": "text content",  // text/title 类型的内容
      "image_path": ""             // figure 类型的图片路径
    }
  ],
  "page_info": { "height": 2339, "width": 1654 }
}
```

版面检测由 PP-DocLayoutV3 提供，元素解析由 PaddleOCR-VL 1.5 提供。标注平台不替代这些模型，而是提供**可视化校验和人工修正能力**。

## Goals / Non-Goals

**Goals:**

1. 标注员能直观查看 PP-DocLayoutV3 的版面检测结果（bbox + 阅读顺序）
2. 标注员能查看和编辑 PaddleOCR-VL 1.5 的元素解析结果
3. 调整 bbox 后能自动触发重新解析，并展示新旧结果对比
4. 支持阅读顺序的拖拽调整
5. 支持新增 bbox、修改 bbox 类型
6. 导出数据格式严格对齐 OmniDocBench JSON 标准
7. 单页内上下翻页导航，标记修改状态

**Non-Goals:**

1. **不实现审核工作流**（LLM 审核、多人协作、任务分配等本期不做）
2. **不展示版面嵌套关系**，只展示外层 bbox
3. **不做多文档对比标注**（单文档单页模式）
4. **不做自动数据合成**（DocMix 等属于后端管线）
5. **不做模型训练集成**（训练管线独立）
6. **不做缩略图侧边栏**（仅底部数字翻页导航）

## Decisions

### D1: 前端框架 — React + TypeScript + Vite

- **理由**：生态成熟，所有依赖库（react-pdf、react-markdown、@dnd-kit）均为 React 生态
- **Vite**：开发体验优于 CRA，构建速度快

### D2: PDF/图片渲染 — react-pdf v10

- **理由**：pdf.js 的 React 封装，声明式组件 `<Document><Page>`，内置 text/annotation layer 支持
- **对于图片输入**：直接用 `<img>` 标签，与 react-pdf 同构渲染

### D3: Bbox 叠加层 — 原生 SVG `<polygon>`

- **理由**：
  - OmniDocBench 的 `poly` 是 8 点坐标（旋转矩形），SVG `<polygon>` 天然支持
  - 只需"显示已有 + 点击选中 + 拖拽手柄调整"，无需 canvas 图形编辑库
  - 零额外依赖，React 声明式渲染，hover/click 事件路由简单
  - 单页 bbox 数量通常 <100，DOM 性能足够
- **不选择 Konva/Fabric.js**：过于重量级，canvas 层与 PDF canvas 叠加会增加坐标转换复杂度

### D4: Bbox 拖拽调整 — react-rnd

- **理由**：轻量（~10KB），支持 resizable + draggable，React 组件式 API
- **适配 polygon**：8 点坐标需要在拖拽时转换为 `{x, y, width, height}` 边界框，拖拽结束后再转换回 8 点坐标

### D5: 内容渲染 — react-markdown + KaTeX

- **Markdown 渲染**：react-markdown + remark-gfm（支持 GFM 表格/列表）
- **LaTeX 渲染**：rehype-katex（与 react-markdown 流水线无缝集成）
- **HTML Table 渲染**：原生 HTML 渲染（table 类型的 `html` 字段）

### D6: 源码编辑器 — @uiw/react-codemirror

- **理由**：30KB（vs Monaco 的 3.4MB），支持 Markdown/HTML/LaTeX 语法高亮
- **够用**：标注场景不需要 VSCode 级别的编辑器功能

### D7: 拖拽排序 — @dnd-kit/sortable

- **理由**：React 生态最活跃的拖拽库，sortable preset 开箱即用
- **替代方案**：react-beautiful-dnd 已停止维护

### D8: 状态管理 — Zustand

- **理由**：极简（2.1KB），无 boilerplate，适合中小型应用
- **管理内容**：当前页数据、选中元素、操作模式、脏状态

### D9: 重新解析交互 — 对比视图

- bbox 修改后弹出确认对话框 → 用户确认 → 调用 API → 新旧内容并排对比 → 用户选择使用新结果/保留原内容/手动编辑
- **理由**：标注员需要看到修改的实际影响，避免"盲改"

### D10: 左右面板比例 — 可拖拽分隔条

- 最小宽度各 320px，初始比例 55/45
- **理由**：不同文档版面复杂度不同，固定比例不灵活

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| SVG polygon 渲染在旋转矩形边缘可能模糊 | 视觉精度下降 | 使用 `shape-rendering="crispEdges"`，确保坐标缩放时取整 |
| react-rnd 基于矩形（4 点），与 8 点 polygon 不完美匹配 | 拖拽手柄调整后形状可能变形 | 拖拽时只调整边界框，松手后保持矩形（不改变四边形性质） |
| 大文件（200+ 页）性能问题 | 翻页卡顿 | 只加载当前页数据，不缓存全部页面 |
| HTML table 直接渲染存在 XSS 风险 | 安全性问题 | 使用 DOMPurify sanitize 后再渲染 |
| 重新解析 API 延迟（5-15 秒） | 用户体验差 | 显示进度条 + 允许用户继续查看其他元素 |
