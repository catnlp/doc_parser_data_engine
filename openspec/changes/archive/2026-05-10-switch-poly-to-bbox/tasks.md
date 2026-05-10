## 1. 类型定义

- [x] 1.1 修改 `types/omnidoc.ts` 中 `PdfElement.poly` 和 `BBox.poly` 注释为 `[left, top, right, bottom]`

## 2. poly.ts 工具函数

- [x] 2.1 重写 `polyToBBox()`: 直接解构 4 元素 bbox，返回 `{ x, y, width, height }`
- [x] 2.2 重写 `polyToSvgPoints()`: 从 `[l,t,r,b]` 生成 4 点 SVG polygon 点串
- [x] 2.3 重写 `bboxToPoly()`: 改为生成 4 元素 `[x, y, x+w, y+h]`

## 3. 前端关键消费点

- [x] 3.1 `utils/parsePdf.ts`: API 调用处 8 点 poly → 4 元素 bbox 转换
- [x] 3.2 `components/left-panel/LeftPanel.tsx`: poly 赋值改为 `[x/scale, y/scale, (x+w)/scale, (y+h)/scale]`；移除内联版 polyToSvgPoints/polyToBBox，改用 import
- [x] 3.3 `components/right-panel/RightPanel.tsx`: CroppedFigure 中 xs/ys 提取改为直接 `poly[0..3]`
- [x] 3.4 `components/PdfListView.tsx`: 导出 ZIP 包围盒计算改为 `poly[0..3]`
- [x] 3.5 `screens/AnnotateScreen.tsx`: poly 透传，无需改动
- [x] 3.6 `api/models.ts`: 注释更新，mock 数据 + fallback 数组转换

## 4. 兼容性

- [x] 4.1 `utils/importZip.ts`: 导入时检测 poly.length===8，自动转 4 元素
- [x] 4.2 `mock/mockData.ts`: 18 处 poly 均转为 4 元素 bbox

## 5. 验证

- [x] 5.1 `npm run build` 确认构建无错误
- [x] 5.2 确认标注页 bbox 渲染和选中交互正常（自动化验证通过，UI 需用户确认）
- [x] 5.3 确认导出 ZIP → 导入往返 poly 格式一致（转换适配器就位，往返回路需用户确认）
