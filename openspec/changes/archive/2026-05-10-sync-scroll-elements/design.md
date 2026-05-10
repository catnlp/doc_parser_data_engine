## Context

- 左侧滚动容器: `containerRef`（LeftPanel L110），`overflow: 'auto'`
- 右侧滚动容器: `.right-panel-content`（RightPanel L58），CSS `overflow-y: auto`
- 左侧 bbox onClick: 设置 `selectedElementId`
- 右侧 ElementCard onSelect: 设置 `selectedElementId`

## Goals / Non-Goals

**Goals:**
- 点击左/右面板元素时，对侧面板自动滚动使该元素居中
- 使用 `scrollIntoView` 原生 API，零依赖

**Non-Goals:**
- 不改变选中逻辑
- 不添加动画框架

## Decisions

### 1. 滚动触发方式

**决定**: 在现有 onClick/onSelect 处理函数中追加 `scrollIntoView`，不新建事件通道。

**左→右**: 左侧 bbox 的 `onClick` 中，`setSelectedElementId(el.id)` 后，用 `document.querySelector` 找到对应 ElementCard，调 `scrollIntoView({ block: 'center', behavior: 'smooth' })`

**右→左**: 右侧 ElementCard 的 `onSelect` 中，用 bbox 坐标计算目标滚动位置，调 `containerRef.current.scrollTo({ top, left, behavior: 'smooth' })`

### 2. 左侧滚动位置计算

**决定**: 使用 `polyToBBox(el.poly)` 获取元素包围盒，计算其中心点相对于 PDF 页面的位置，结合当前缩放，算出 `containerRef` 需要滚到的位置。

```
centerX = (bbox.x + bbox.width / 2) * displayScale
centerY = (bbox.y + bbox.height / 2) * displayScale
scrollLeft = centerX - containerWidth / 2
scrollTop = centerY - containerHeight / 2
```

### 3. 右侧元素定位

**决定**: 给每个 ElementCard 根 div 添加 `data-element-id={el.id}` 属性，通过 `document.querySelector(`[data-element-id="${id}"]`)` 定位。
