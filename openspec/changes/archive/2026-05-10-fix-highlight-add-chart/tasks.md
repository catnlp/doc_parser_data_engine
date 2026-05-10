## 1. 高亮透明修复

- [x] 1.1 在 `components/left-panel/LeftPanel.tsx` 中添加 `hexToRgba` 辅助函数（兼容 3 位和 6 位 hex）
- [x] 1.2 将 `${color}30` 替换为 `hexToRgba(color, 0.19)`，`${color}15` 替换为 `hexToRgba(color, 0.08)`

## 2. chart 类型定义

- [x] 2.1 `constants/elementTypes.ts`: 在 `BBOX_COLORS` 中添加 `chart: '#722ED1'`
- [x] 2.2 在 `TYPE_LABELS` 中添加 `chart: 'Chart'`
- [x] 2.3 在 `TYPE_ICONS` 中添加 `chart: '📊'`
- [x] 2.4 在 `ELEMENT_TYPES` 数组中添加 `'chart'`
- [x] 2.5 `types/omnidoc.ts`: 在 `ElementType` 联合类型中添加 `'chart'`

## 3. chart 渲染

- [x] 3.1 `components/right-panel/RightPanel.tsx`: 在 `RenderedContent` 的 figure/image 分支添加 `|| element.category_type === 'chart'`

## 4. 验证

- [x] 4.1 `npm run build` 确认构建无错误
- [ ] 4.2 确认标注页 bbox 高亮为透明色（需用户在浏览器验证）
- [ ] 4.3 确认 chart 类型元素可正确渲染裁切图（需用户在浏览器验证）
