## Context

当前应用为单文件标注工具：用户选择一个 PDF → 调用 Layout API → 调用 OCR API → 进入标注界面。状态管理完全集中于 `useAnnotationStore.ts`，仅支持单文档上下文（`pdfFile`, `pdfInfo`, `pageInfo` 等均为单值）。

技术栈：
- **Frontend**: React 19 + TypeScript + Vite + Zustand
- **PDF 渲染**: `react-pdf` (pdf.js)
- **Backend**: FastAPI + PaddleOCR (Layout + OCR)
- **导航**: 无路由库，纯条件渲染控制视图

## Goals / Non-Goals

**Goals:**
- 支持文件夹上传（`webkitdirectory`），筛选其中所有 `.pdf` 文件
- 展示 PDF 列表，包含文件名、页数、解析状态、操作按钮
- 批量并发解析所有 PDF（每份文件独立调用 Layout + OCR 流程）
- 点击已完成解析的 PDF 可进入现有标注界面
- 标注界面提供返回列表的导航入口
- 保持现有标注功能和 UI 不变

**Non-Goals:**
- 不引入路由库（react-router 等），用 Zustand 视图状态控制即可
- 不持久化标注结果到服务端/本地存储（后续需求）
- 不修改后端 API 接口（当前 RESTful 设计已支持多文件并发）
- 不支持文件夹嵌套（仅处理所选文件夹根目录及直接子目录中的 PDF）

## Decisions

### 1. 多文档状态管理：扩展 Store vs 新建 Store
**决策**: 在现有 `useAnnotationStore` 之上，新增一个独立的 `useDocumentListStore` 管理文档列表状态。
**理由**: 
- 现有 store 职责为"单份文档的标注数据"（elements、dirtyPages、toolMode 等），耦合度高
- 新建独立的 document list store 职责清晰：管理 `PdfDocument[]` 列表、选中状态、视图模式
- 两者通过 `selectedDocumentId` 关联，标注 store 在选中时切换上下文

### 2. 视图管理：条件渲染 vs 路由
**决策**: 使用 Zustand 状态 `appView: 'list' | 'annotate'` 控制条件渲染。
**理由**: 
- 当前项目无任何路由依赖，引入 react-router 增加不必要的复杂度
- 仅两个视图（列表 ↔ 标注）， Zustand 状态足够
- URL 不敏感，无需分享/书签链接

### 3. 批量解析：顺序 vs 并发
**决策**: 并发解析，但限制最大并发数为 3（可配置）。
**理由**:
- Layout API 和 OCR API 均为本地 FastAPI 服务，并发能力较强
- 但每份 PDF 需渲染为 canvas（占用主线程内存），无限并发可能导致浏览器 OOM
- 并发队列（concurrency=3）平衡速度与稳定性

### 4. 文件夹上传：`webkitdirectory` vs 拖拽上传
**决策**: 采用 `webkitdirectory` 属性，暂不实现拖拽上传。
**理由**:
- `webkitdirectory` 是原生支持，零依赖
- 拖拽上传需要额外处理拖放事件、文件夹递归遍历等逻辑，可后续迭代

### 5. 解析状态存储：内存 vs IndexedDB
**决策**: 解析结果存储在内存（Zustand store），刷新页面后丢失。
**理由**:
- 当前标注数据也未持久化，保持一致性
- 解析结果包含 base64 图片数据，IndexedDB 存储成本较高
- 用户场景为单次会话内批量处理，无需跨会话持久化

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 大文件（100+ 页 PDF）并发解析导致浏览器内存溢出 | 限制并发数为 3；对超大页数文件显示警告 |
| `webkitdirectory` 在部分浏览器不支持 | 同时保留单文件上传入口作为降级方案 |
| 解析中途用户离开页面导致状态丢失 | 解析完成前禁用页面关闭提示（`beforeunload`） |
| 多文档切换时标注状态混乱 | 每次切换文档时重置 annotation store 状态 |

## Migration Plan

无服务端变更，纯前端功能。部署流程：
1. 前端构建新 bundle，替换旧文件
2. 用户刷新页面即生效（无缓存兼容问题）
3. 回滚：替换回旧 bundle 即可

## Open Questions

- 是否需要支持解析进度条精确到"当前正在处理第 N / 共 M 份"？（当前设计为每份文件独立状态指示灯）
- 列表页是否需要排序/筛选功能？（当前按文件名排序）
