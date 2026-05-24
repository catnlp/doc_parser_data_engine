# 问题排查

## Mermaid 渲染问题（2026-05-02 修复总结）

| 问题 | 根因 | 解决 |
|------|------|------|
| 不渲染/显示 CSS | `el.textContent` 读到的是 mermaid 注入的 CSS 而非源码 | **用 `data-graph` 属性存储，`getAttribute('data-graph')` 读取** |
| 不渲染 | 用 `mermaid.run()` 自动渲染 | **用逐个 `mermaid.render(id, graph)`** |
| 不渲染 | `startOnLoad: true` 与手动冲突 | **用 `startOnLoad: false` + `window.load` + `setTimeout(500ms)`** |
| 节点文字巨大 | `htmlLabels: false` 下 SVG text 缩放失控 | **用 `htmlLabels: true` + CSS 强制 13px** |
| ID 冲突 | 每节重置 mermaid 计数器 | **全局计数器，不重置** |
| ```mermaid 被当成代码块 | 先匹配 ` ``` ` 再匹配 ` ```mermaid ` | **先匹配 ` ```mermaid `，再匹配 ` ``` `** |
| CDN 加载失败 | 国内网络不稳定 | **优先内联 mermaid.js，CDN 作 fallback** |

## Markdown → HTML 解析问题

| 问题 | 根因 | 解决 |
|------|------|------|
| 表格每行变成独立表格 | 表格行处理顺序错误，没正确聚合 | **先收集所有 `|` 行，最后统一 `render_tbl()`** |
| 表格出现 `-------` 行 | 没过滤 markdown 分隔行 | **正则 `^[\s\-|:]+$` 匹配并跳过** |
| 表格没有 thead/tbody | 没区分 header 和 body | **第一行为 `<thead>`，其余为 `<tbody>`** |
| 表格小屏溢出 | 没有滚动容器 | **包裹 `<div class="table-wrap" style="overflow-x:auto">`** |

## 内容结构问题

| 问题 | 解决 |
|------|------|
| 正文中出现目录章节 | MD 预处理时移除 `## 目录` 段 |
| 生成脚本写文件失败 | **用 exec 运行 Python 脚本，不用 write 工具** |

## 发送 HTML 到飞书

```bash
openclaw message send --channel feishu --target ou_8930657653fd7f8d10cd69476c542c3f \
  --media "<文件路径>.html" --message "🦐 文件说明"
```

## 生成流程 checklist

1. [ ] MD 预处理：移除 `## 目录` 段
2. [ ] Python 脚本解析：` ```mermaid ` 优先于 ` ``` `
3. [ ] Mermaid 容器：`data-graph` 属性存储，全局计数器 ID
4. [ ] 表格聚合：收集所有 `|` 行 → 过滤分隔行 → 生成 `<thead>` + `<tbody>`
5. [ ] Mermaid 内联：下载 `mermaid.min.js` 嵌入 `<script>`
6. [ ] 初始化：`startOnLoad: false` + `window.load` + `setTimeout(500ms)`
7. [ ] 渲染：逐个 `mermaid.render()` 从 `data-graph` 读取
8. [ ] 后处理：强制 font-size 13px、节点颜色、线条颜色
9. [ ] 验证：tables = theads = tbodys，无分隔符泄露，mermaid IDs 唯一
10. [ ] 发送：`openclaw message send --media`
