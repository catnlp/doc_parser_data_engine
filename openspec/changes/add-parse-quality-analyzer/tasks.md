## 1. 数据管线：传递 OCR 置信度

- [x] 1.1 `types/document.ts`：`ParsedPageData.ocrElements` 元素类型增加可选字段 `confidence?: number`
- [x] 1.2 `parsePdf.ts`：`callLocalOcrApi` 返回类型声明加 `confidence: number`
- [x] 1.3 `parsePdf.ts`：`processPage` 构造 `ocrElements[i]` 时传递 `confidence`（普通文本 + 降级回退元素）
- [x] 1.4 `AnnotateScreen.tsx`：`loadDocument` 映射 `ocrElements` 时传递 `confidence`

## 2. 列表页：文档质量摘要

- [x] 2.1 新增 `computeDocQuality(doc)` 工具函数，计算文档级质量指标（布局置信度均值、OCR 置信度均值、降级数、空白数、失败页数）
- [x] 2.2 `PdfListView.tsx`：在已完成文档卡片中新增质量摘要行（紧凑单行，条件显示降级/空白/失败计数）
- [x] 2.3 `styles/document-list.css`：新增 `.quality-summary` 样式 + 颜色编码（绿/橙/红）

## 3. 标注页：解析分析 Tab

- [x] 3.1 `RightPanel.tsx`：新增 Tab 切换栏（"元素列表" / "解析分析"），默认显示元素列表
- [x] 3.2 新增 `ParseQualityPanel.tsx` 组件：综合评分区（布局/OCR 置信度均值）+ 元素类型统计（count + demoted）+ 每元素置信度列表
- [x] 3.3 `styles/annotation.css`：新增 `.panel-tabs`、`.quality-panel`、`.confidence-bar`、`.quality-summary` 样式
- [x] 3.4 翻页时分析面板自动更新（`useAnnotationStore.currentPage` 变化触发重渲染）

## 4. 验证

- [x] 4.1 `npm run build` 编译通过
- [x] 4.2 手动测试：解析新 PDF → 列表页显示质量摘要（置信度百分比 + 降级/空白计数）
- [x] 4.3 手动测试：进入标注页 → 切换到"解析分析"Tab → 看到每元素置信度
- [x] 4.4 手动测试：翻页 → 分析面板数据更新
- [x] 4.5 手动测试：刷新浏览器 → 重新进入 → 旧数据（无 confidence）显示 "—"
