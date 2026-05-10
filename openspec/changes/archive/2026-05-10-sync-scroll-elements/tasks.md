## 1. 左→右滚动

- [x] 1.1 `RightPanel.tsx`: 给 ElementCard 根 div 添加 `data-element-id={element.id}` 属性
- [x] 1.2 `LeftPanel.tsx`: bbox onClick 中追加 `document.querySelector([data-element-id="${id}"])?.scrollIntoView({ block: 'center', behavior: 'smooth' })`

## 2. 右→左滚动

- [x] 2.1 `LeftPanel.tsx`: 将 `containerRef` 传递给需要计算滚动的函数，或通过 store 触发
- [x] 2.2 `RightPanel.tsx`: ElementCard onSelect 中追加左侧滚动逻辑（通过 store action 或直接计算）

## 3. 验证

- [x] 3.1 `npm run build` 确认无错误
- [x] 3.2 点击左侧 bbox → 右侧列表滚动到对应卡片
- [x] 3.3 点击右侧卡片 → 左侧 PDF 滚动到对应 bbox
