## Context

当前 `poly` 字段为 8 元素数组 `[x1,y1,x2,y2,x3,y3,x4,y4]`。几乎所有消费方都将其转为包围盒使用——`polyToBBox()` 被 5+ 处调用或内联重写。8 点格式源于 OmniDocBench 输出规范，但前端标注工具只需包围盒即可完成 SVG 渲染和区域裁剪。

## Goals / Non-Goals

**Goals:**
- `PdfElement.poly` 改为 `[left, top, right, bottom]`（4 元素）
- 简化 `polyToBBox()` / `polyToSvgPoints()` / canvas 裁剪逻辑
- 保持 SVG bbox 渲染效果不变
- 保持导出 ZIP 中 poly 语义正确

**Non-Goals:**
- 不修改后端 API 返回格式（本次仅改前端）
- 不改变 `layoutElements`（来自后端，保持不变）
- 不改变 `ocrElements` 的其他字段

## Decisions

### 1. BBox 格式：`[left, top, right, bottom]`

**决定**: 4 元素数组，像素坐标，整数或浮点数均可。

```
当前 8 点:  [x1,y1, x2,y2, x3,y3, x4,y4]
新 bbox:   [left, top, right, bottom]

转换:
  left = Math.min(x1,x2,x3,x4)
  top  = Math.min(y1,y2,y3,y4)
  right = Math.max(x1,x2,x3,x4)
  bottom = Math.max(y1,y2,y3,y4)
```

### 2. API 层适配：前端做转换

**决定**: 后端 API 返回的 `poly` 仍是 8 元素格式（不修改后端）。前端在 `parsePdf.ts` 的 API 调用处做 8→4 转换。

**理由**: 最小化变更范围，后端不变。

### 3. `polyToSvgPoints()` 重写

**决定**: 从 bbox 生成 4 点 SVG polygon 字符串。

```typescript
export function polyToSvgPoints(bbox: number[], scale: number): string {
  const [left, top, right, bottom] = [bbox[0]*scale, bbox[1]*scale, bbox[2]*scale, bbox[3]*scale];
  return `${left},${top} ${right},${top} ${right},${bottom} ${left},${bottom}`;
}
```

### 4. `polyToBBox()` 简化

**决定**: 仍保留函数签名兼容，内部直接解构：

```typescript
export function polyToBBox(bbox: number[]): BBoxRect {
  return { x: bbox[0], y: bbox[1], width: bbox[2] - bbox[0], height: bbox[3] - bbox[1] };
}
```

### 5. Canvas 裁剪简化

**决定**: 所有 `Math.min(poly[0], poly[2], poly[4], poly[6])` 替换为 `poly[0]`，`Math.max(...)` 替换为 `poly[2]`/`poly[3]`。

### 6. 导入兼容旧 ZIP

**决定**: `importZip.ts` 中检测 poly 数组长度。若为 8 元素（旧格式），自动转换为 4 元素 bbox。

```typescript
if (el.poly.length === 8) {
  bbox = [Math.min(el.poly[0],el.poly[2],el.poly[4],el.poly[6]),
          Math.min(el.poly[1],el.poly[3],el.poly[5],el.poly[7]),
          Math.max(el.poly[0],el.poly[2],el.poly[4],el.poly[6]),
          Math.max(el.poly[1],el.poly[3],el.poly[5],el.poly[7])];
}
```

### 7. 新建 bbox 元素时的 poly

**决定**: `LeftPanel.tsx` 中创建新 bbox 时，`poly` 直接赋为 `[x, y, x+w, y+h]`。

## Risks / Trade-offs

- **[风险] 旧 ZIP 导入 poly.length=8** → 导入时做兼容转换（决策 6）
- **[风险] 后端 API 仍返回 8 点格式** → 前端入口 `parsePdf.ts` 做统一转换
- **[取舍] 失去四边形精确形状** → 当前工具不支持旋转/倾斜 bbox，包围盒足够
