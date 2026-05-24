## Context

当前数据管线：`/api/parse` 返回 `{ elements: [{ category_type, text, confidence }] }`，但 `parsePdf.ts` 的 `callLocalOcrApi` 返回类型声明为 `{ elements: Array<{ category_type: string; text: string }> }`，丢弃了 `confidence` 字段。`ParsedPageData.ocrElements` 类型也不包含 `confidence`。

`layoutElements[]` 已保留 `score` 字段，可直接用于分析。

## Goals / Non-Goals

**Goals:**
- 前端数据管线保留 OCR 置信度字段
- 列表页文档卡片展示解析质量摘要（平均置信度 + 降级/空白计数）
- 标注页右侧面板新增"解析分析"Tab，展示当前页详细指标

**Non-Goals:**
- 不改后端 API（后端已返回所需数据）
- 不引入图表库（纯 CSS + HTML 展示）
- 不改变解析流水线逻辑（仅在数据传递层加字段）

## Decisions

### 1. 质量指标：多项独立指标，非单一组合分

**选择**：列表页展示三项独立指标——平均置信度、降级数、空白数。标注页分析面板额外展示布局置信度分布和元素类型统计。

**理由**：单一组合分会掩盖问题信号。布局好但 OCR 差的页面，和布局差但 OCR 好的页面，需要区分对待。独立指标让用户快速定位问题类型。

### 2. 列表页展示位置：文档卡片内新增质量摘要行

**选择**：在每条已完成文档的状态行下方，新增一行质量摘要，使用紧凑布局。

```
┌──────────────────────────────────────────────────┐
│ [✅ 已完成] 📄 paper.pdf  12页                    │
│ 📊 布局94% · OCR87% · ⚠️3降级 · ○0空白   [操作]  │
└──────────────────────────────────────────────────┘
```

**替代方案被否决**：
- *hover tooltip*：不直观，用户需要主动探索才能看到
- *独立列*：横向空间不足

### 3. 右侧面板 Tab：useState + 条件渲染

**选择**：在 `RightPanel` 组件内用 `useState<'elements' | 'analysis'>` 管理 Tab 状态，条件渲染 `ElementList` 或 `ParseQualityPanel`。Tab 切换按钮复用 `ExpandedCardContent` 中已有的 `.view-toggle` 样式。

```tsx
const [tab, setTab] = useState<'elements' | 'analysis'>('elements');
```

**理由**：最简实现，无外部依赖。Tab 状态不需要跨组件共享。

### 4. 置信度颜色编码

**选择**：使用现有 CSS 设计令牌，三档阈值：

| 范围 | 颜色 | 含义 |
|------|------|------|
| ≥ 0.90 | `var(--color-success)` #10B981 | 优秀 |
| 0.70–0.90 | `var(--color-warning)` #F59E0B | 一般 |
| < 0.70 | `var(--color-danger)` #EF4444 | 较差 |

### 5. 数据管线：最小侵入式加字段

**选择**：在 `ParsedPageData.ocrElements` 类型中增加可选 `confidence?: number`，在 `processPage` 构造 `ocrElements` 时从 OCR 结果中捕获。公式/表格类元素使用远程 API 的，confidence 为 `undefined`（分析 UI 显示 "N/A"）。

**改动点**：
1. `types/document.ts`：`ocrElements` 数组元素类型加 `confidence?: number`
2. `parsePdf.ts` L120：`callLocalOcrApi` 返回类型加 `confidence: number`
3. `parsePdf.ts` L290-386：`ocrElements[i]` 构造时传递 `confidence`
4. `AnnotateScreen.tsx` L44-54：`loadDocument` 映射时传递 `confidence`

### 6. ParseQualityPanel 组件结构

```
ParseQualityPanel
├── 综合评分区
│   ├── 布局置信度均值 + 色条
│   └── OCR 置信度均值 + 色条
├── 元素类型统计
│   ├── text: N 个
│   ├── table: N 个
│   ├── formula: N 个 (降级 M)
│   └── figure: N 个
└── 元素详情列表
    └── 每个元素：类型图标 + 置信度条 + 降级/空白标记
```

## Risks / Trade-offs

- **[Risk] 旧 localStorage 数据无 confidence 字段** → Mitigation: `confidence` 为可选字段（`?: number`），旧数据加载时该字段为 `undefined`，分析 UI 对缺失数据显示 "—"
- **[Risk] 公式/表格远程 API 元素无 OCR 置信度** → Mitigation: 分析面板中对不同来源的元素分别标注（"远程公式" / "远程表格"），其置信度显示为 "N/A"
- **[Risk] 分析面板增加右侧面板复杂度** → Mitigation: Tab 切换是标准 UI 模式，默认仍显示元素列表，不影响核心工作流
