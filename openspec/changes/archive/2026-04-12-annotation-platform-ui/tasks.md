## 1. 项目初始化

- [x] 1.1 使用 Vite + React + TypeScript 初始化前端项目
- [x] 1.2 配置开发环境（ESLint, Prettier, TypeScript strict mode）
- [x] 1.3 安装核心依赖：react-pdf, react-markdown, remark-gfm, remark-math, rehype-katex, katex, @uiw/react-codemirror, @dnd-kit/sortable, react-rnd, zustand, dompurify

## 2. 基础布局与导航

- [x] 2.1 实现整体布局容器（顶部导航栏 + 左右面板 + 底部导航条）
- [x] 2.2 实现可拖拽分隔条（左右面板比例可调，最小各 320px）
- [x] 2.3 实现顶部导航栏（上下翻页、缩放控制、框选/选择工具切换、撤销/重做、保存按钮）
- [x] 2.4 实现底部数字导航条（当前页±3 页、省略号、首页/末页快捷跳转、脏状态圆点标记）

## 3. 文档渲染与 Bbox 叠加

- [x] 3.1 实现 react-pdf 集成（PDF 页面加载、缩放、旋转处理）
- [x] 3.2 实现图片渲染支持（`<img>` 标签 + 自适应）
- [x] 3.3 实现 SVG Bbox 叠加层（`<polygon>` 渲染、poly 坐标缩放）

- [x] 3.4 实现 Bbox 类型颜色区分（text/title/table/figure/equation/header/footer）
- [x] 3.5 实现阅读顺序序号 badge（左上角半透明白色 badge）
- [x] 3.6 实现类型颜色图例（左侧面板底部）
- [x] 3.7 实现 Hover 双向高亮联动（bbox ↔ 右侧列表）

## 4. Bbox 交互

- [x] 4.1 实现 Bbox 点击选中（45% 透明度 + 3px 边框 + 4 角拖拽手柄）
- [ ] 4.2 实现 Bbox 拖拽修正（react-rnd，8 角手柄，poly 坐标实时更新）
- [x] 4.3 实现框选创建模式（十字光标、虚线矩形跟随、松开弹出类型选择）
- [x] 4.4 实现 Bbox 类型修改（下拉菜单、联动颜色变化）
- [ ] 4.5 实现 Bbox 删除（Delete 键 + 按钮，二次确认）
- [x] 4.6 实现缩放联动（bbox 坐标随缩放比例自动适配）

## 5. 右侧面板

- [x] 5.1 实现"元素列表" Tab（按 order 排序、内容摘要、拖拽手柄）
- [x] 5.2 实现列表项内容预览（Markdown/text 渲染、HTML table 渲染、KaTeX equation 渲染、image 占位符）
- [ ] 5.3 实现 @dnd-kit 拖拽排序（列表拖拽、order 重计算、序号 badge 实时更新）
- [x] 5.4 实现"元素详情" Tab（类型下拉框 + 只读坐标 + 预览/源码切换）
- [x] 5.5 实现预览模式渲染（react-markdown + KaTeX + HTML table）
- [x] 5.6 实现源码编辑器（CodeMirror、按类型切换语法高亮模式）
- [ ] 5.7 实现内容编辑脏状态跟踪

## 6. 重新解析管线

- [ ] 6.1 实现 bbox 修改确认对话框（"确认并重新解析" / "撤销" / "取消"）
- [ ] 6.2 实现 `POST /api/reparse` API 调用
- [ ] 6.3 实现解析中进度指示器
- [ ] 6.4 实现新旧内容对比视图（并排展示、差异高亮）
- [ ] 6.5 实现对比视图操作按钮（"使用新结果" / "保留原内容" / "手动编辑"）
- [ ] 6.6 实现批量重新解析（"重新解析全部"按钮）

## 7. 翻页与脏状态

- [x] 7.1 实现上下翻页逻辑（上一页/下一页、数字跳转、首页/末页）
- [x] 7.2 实现脏状态标记（修改检测、底部导航圆点标记）
- [x] 7.3 实现切页保存提示（"保存并切换" / "不保存直接切换" / "取消"）
- [x] 7.4 实现缩放控制（−/+ 10% 步长、50%-200% 范围、适应宽度）

## 8. 数据与状态管理

- [x] 8.1 实现 Zustand store（当前页数据、选中元素、操作模式、脏状态）
- [x] 8.2 实现 OmniDocBench 数据格式的类型定义（TypeScript interfaces）
- [x] 8.3 实现 poly 坐标与 SVG 坐标的双向转换（8 点 ↔ 边界框）

## 9. 数据导出

- [ ] 9.1 实现导出功能（生成 OmniDocBench JSON、触发浏览器下载）
- [ ] 9.2 实现导出格式校验（确保与 OmniDocBench 标准严格对齐）

## 10. 键盘快捷键

- [ ] 10.1 实现全局快捷键（Tab/Shift+Tab 切换元素、Escape 退出模式、Delete 删除、Ctrl+Z/Y 撤销/重做、Ctrl+↑/↓ 调整阅读顺序）
- [ ] 10.2 实现数字键快速切换类型（1=text, 2=table, 3=figure, 4=equation）

## 11. 错误处理与边缘情况

- [x] 11.1 实现文档加载失败提示（错误 UI + 重试）
- [ ] 11.2 实现重新解析失败提示
- [x] 11.3 实现框选过小提示（<20px 取消）
- [x] 11.4 实现 HTML table XSS 防护（DOMPurify sanitize）
