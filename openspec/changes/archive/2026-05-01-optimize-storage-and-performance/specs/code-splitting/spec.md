## ADDED Requirements

### Requirement: 视图级懒加载
`App.tsx` MUST 使用 `React.lazy()` 对 ListScreen 和 AnnotateScreen 进行代码分割，两个视图的组件树及其依赖（含 CodeMirror、KaTeX 等重型库）仅在对应视图被激活时加载。

#### Scenario: 首次加载仅加载列表视图依赖
- **WHEN** 用户首次打开应用且处于列表视图（`appView === 'list'`）
- **THEN** 浏览器仅加载 `ListScreen` 及其依赖的 chunk，不加载 CodeMirror、KaTeX、react-pdf 等标注视图专用库

#### Scenario: 切换到标注视图时按需加载
- **WHEN** 用户点击列表中一份已完成文档进入标注视图
- **THEN** 浏览器开始加载 `AnnotateScreen` 的 chunk（含 CodeMirror、KaTeX 等），加载期间显示 Suspense fallback

#### Scenario: 返回列表视图不重新加载
- **WHEN** 用户从标注视图点击"返回列表"
- **THEN** 列表视图组件从缓存中恢复，不发起额外网络请求

### Requirement: Vendor 库拆分为独立 chunk
Vite 构建配置 MUST 将以下重型依赖拆分为独立 vendor chunk：
- `vendor-pdf`: react-pdf, pdfjs-dist
- `vendor-editor`: @codemirror/*, @uiw/react-codemirror
- `vendor-markdown`: react-markdown, remark-*, rehype-*, katex

#### Scenario: 构建产物包含独立 vendor chunk
- **WHEN** 运行 `npm run build`
- **THEN** dist 目录中包含 `vendor-pdf.[hash].js`、`vendor-editor.[hash].js`、`vendor-markdown.[hash].js` 等独立文件

#### Scenario: 库版本更新时缓存失效仅影响对应 chunk
- **WHEN** 仅 katex 版本升级
- **THEN** 仅有 `vendor-markdown.[hash].js` 的哈希值变化，其他 vendor chunk 保持缓存命中

### Requirement: Vite 构建配置补全
Vite 配置 MUST 包含以下项：
- 开发代理：`/api` 路径代理至后端服务
- 路径别名：`@/` 映射至 `src/`
- Chunk 大小警告：阈值设为 500KB

#### Scenario: 开发模式下 API 请求被代理
- **WHEN** 开发模式下前端向 `/api/layout` 发起请求
- **THEN** Vite dev server 将请求代理至 `localhost:8002`，无需前端配置 CORS

#### Scenario: 构建时超过 500KB 的 chunk 触发警告
- **WHEN** 构建生成超过 500KB 的 chunk
- **THEN** 终端输出 chunk 大小警告，提示开发者考虑进一步拆分

#### Scenario: 路径别名在开发和生产环境均生效
- **WHEN** 代码中使用 `import { useAnnotationStore } from '@/store/useAnnotationStore'`
- **THEN** 开发模式和构建模式下均可正确解析为 `src/store/useAnnotationStore`
