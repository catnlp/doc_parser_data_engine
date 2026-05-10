## Context

当前 bbox 高亮使用 `${color}30`（8 位十六进制 α 格式），chart 类型未定义。

## Goals / Non-Goals

**Goals:**
- 所有元素高亮使用 `rgba()` 格式，确保透明效果
- 新增 `chart` 类型，渲染与 `figure`/`image` 相同

**Non-Goals:**
- 不改变颜色值本身
- 不修改 ELEMENT_TYPES 中其他类型
- 不修改导出/导入逻辑

## Decisions

### 1. hex → rgba 转换

**决定**: 编写 `hexToRgba(hex: string, alpha: number): string` 工具函数，在 LeftPanel 中调用。

```typescript
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
```

替换：
- `${color}30` → `hexToRgba(color, 0.19)`
- `${color}15` → `hexToRgba(color, 0.08)`

### 2. chart 颜色

**决定**: `#722ED1`（紫色），与 formula 同色系，视觉上区分于 figure 的橙色。

### 3. chart 在 RenderedContent 中的渲染

**决定**: 复用 figure/image 分支，添加 `|| element.category_type === 'chart'`。

## Risks

- **[风险] `#666` 等 3 位 hex 回退色无法用 hexToRgba 正确解析** → hexToRgba 需兼容 3 位 hex（如 `#666` → `#666666`）
