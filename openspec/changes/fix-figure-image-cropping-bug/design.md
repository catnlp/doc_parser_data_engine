## Context

当前 `RightPanel.tsx` 中 figure/image 元素通过 `CroppedFigure` 组件从当前页 PDF 渲染图中裁剪截图展示。

**当前 `CroppedFigure` 的异步竞态 bug：**

```
getCroppedImage() [同步函数]
  new Image() → img.src = pageBase64 (异步开始加载)
  ctx.drawImage(img, ...) ← 图片未加载完成！画的是空白
  return canvas.toDataURL() ← 返回空白 base64 (但非 null)

CroppedFigure
  useState(() => getCroppedImage(...)) → cropped = 空白 base64 ✓ truthy
  useEffect(() => { if (cropped) return; ... }) → 直接 return，正确流程不执行
  渲染 <img src={cropped} /> → 显示空白图片
```

## Goals / Non-Goals

**Goals:**
- `CroppedFigure` 组件正确显示从 PDF 页面裁剪的截图
- 保持现有的 cropCache 缓存机制
- 最小侵入式修复

**Non-Goals:**
- 不改变 figure/image 元素的定位/裁剪逻辑
- 不修改 LeftPanel 或其他组件

## Decisions

### 决策 1：移除 getCroppedImage 同步函数

**选择**：删除同步裁剪函数，所有裁剪操作都在 `useEffect` 中异步完成。

**备选方案**：
- A. 添加 `img.onload` 到 `getCroppedImage` — 函数签名需要变更为 Promise，调用方全部需要修改
- B. 使用同步 canvas API — 浏览器不支持同步图片加载
- C. 保持同步尝试 + 备用异步 — 当前方案就是如此，但 bug 在于同步尝试会污染缓存

**结论**：直接移除同步逻辑是最简洁的方案。缓存通过 `useEffect` 填充即可。

### 决策 2：缓存机制保持不变

`cropCache` 仍用于避免重复裁剪相同元素的截图。`useEffect` 在裁剪完成后先写入缓存再设置 state。

### 决策 3：增加 loading 状态

组件在图片裁剪完成前显示空白占位，避免显示空白图像。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|---|---|
| 大页面 base64 图片在多个 figure 元素间重复传递，可能导致性能问题 | 同一页面的缓存仅存储一次，多个元素共享同一裁剪结果 |
| React 严格模式下 useEffect 可能执行两次 | cropCache 检查防止重复计算 |
