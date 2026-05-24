# Markdown to HTML（侧栏 + 正文居中）

将 Markdown 内容转换为**左侧固定目录 + 正文居中**的精美 HTML。

## ⚠️ 流程图默认使用 Mermaid

**所有流程图、架构图、时序图、状态图，默认使用 Mermaid 语法。**

## 核心流程

### 1. 确认内容来源
```bash
ls -la <文件路径>
# 或
find ~/.openclaw/workspace/output -name "*关键词*" -type f
```

### 2. 读取 Markdown
用 `read` 工具读取完整内容。

### 3. MD 预处理
```python
# 移除 TOC 章节
md = re.sub(r'##\s*目录\s*\n(.*?)\n---\s*\n', '', md, flags=re.DOTALL)
# 移除阿拉伯数字编号（## 1. xxx → ## xxx）
md = re.sub(r'^##\s+\d+\.\s+', '## ', md, flags=re.MULTILINE)
# 添加代码示例、延伸阅读等增强内容
```

### 4. 解析章节（关键：跳过代码块内的 ##）
```python
# 先找所有代码块范围
code_ranges = [(m.start(), m.end()) for m in re.finditer(r'```[\s\S]*?```', md)]
# 只在代码块外匹配 ## 标题
def in_code_block(pos):
    for s, e in code_ranges:
        if s <= pos < e: return True
    return False
sections = [(m.group(1).strip(), m.start(), m.end())
            for m in re.finditer(r'^##\s+(.*)$', md, re.MULTILINE)
            if not in_code_block(m.start())]
```

### 5. 生成 HTML（必须用 python3 exec，不用 write 工具）

**必须用 exec 运行 Python 脚本写文件**（内存写限制）

```python
# 全局计数器（不重置！）
GLOBAL_MERMAID_ID = [0]

def render_mermaid(raw):
    """raw: 纯 mermaid 源码"""
    mid = f'mermaid-{GLOBAL_MERMAID_ID[0]}'
    GLOBAL_MERMAID_ID[0] += 1
    escaped = htmlmod.escape(raw).replace('"', '&quot;')
    return f'<div class="mermaid-container"><div class="mermaid" id="{mid}" data-graph="{escaped}"></div></div>'
```

### 6. 发送到飞书
```bash
openclaw message send --channel feishu --target ou_8930657653fd7f8d10cd69476c542c3f \
  --media "<文件路径>.html" --message "🦐 文件说明"
```

## 10 条铁律（必须遵守）

| # | 规则 | ❌ 错误 | ✅ 正确 |
|---|------|---------|--------|
| 1 | **源码存储** | `textContent` / `<pre>` 存源码 | `data-graph` 属性 |
| 2 | **容器** | `<div class="mermaid">` | `<div class="mermaid" id="..." data-graph="...">` |
| 3 | **语法** | `graph LR` | `flowchart LR` |
| 4 | **换行** | 节点内有 `<br/>` | 用 `\n` 或直接去掉 |
| 5 | **style** | `style A fill:#e1f5fe; style B...` | 每行独立 `style A fill:#e1f5fe` |
| 6 | **初始化** | `startOnLoad: true` | `startOnLoad: false` + 手动渲染 |
| 7 | **渲染方式** | `mermaid.run()` | 逐个 `mermaid.render(id, graph)` |
| 8 | **读取源码** | `el.textContent` | `el.getAttribute('data-graph')` |
| 9 | **JS 加载** | DOMContentLoaded | `window.load` + `setTimeout(500ms)` |
| 10 | **字体** | 默认 16px | CSS 强制 13px |

## 生成 Checklist

- [ ] MD 预处理：移除 `## 目录` + 去阿拉伯数字
- [ ] 解析章节：跳过代码块内的 `##`
- [ ] Mermaid 容器：`data-graph` 属性，全局计数器
- [ ] 表格：收集所有 `|` 行 → 过滤分隔行 → `<thead>` + `<tbody>`
- [ ] Mermaid 加载：CDN + fallback（不要内联）
- [ ] 初始化：`startOnLoad: false` + `window.load` + `setTimeout(500ms)`
- [ ] 渲染：逐个 `mermaid.render()` 从 `data-graph` 读取
- [ ] 后处理：font-size 13px、节点颜色、线条颜色
- [ ] 验证：tables = theads = tbodys，无分隔符泄露，mermaid IDs 唯一
- [ ] 发送：`openclaw message send --media`

## 增强功能

### 学习路径卡片（P1-5）
在文档开头添加 3 卡学习路径：
```html
<div class="card-grid">
  <div class="card"><h4>🌱 新手路线</h4><p>...</p></div>
  <div class="card warning"><h4>🌿 进阶路线</h4><p>...</p></div>
  <div class="card danger"><h4>🌳 专家路线</h4><p>...</p></div>
</div>
```

### 延伸阅读（P1-4）
每节末尾添加参考链接：
```html
<div class="references">
  <h4>📚 延伸阅读</h4>
  <ul>
    <li><a href="..." target="_blank">链接</a></li>
  </ul>
</div>
```

### 代码示例（P1-3）
核心概念配 1-2 个代码块。

### TOC 子导航（P2-6）
左侧导航包含 h2 + h3：
```html
<a href="#s1" class="toc-h2">章节名</a>
<a href="#s1" class="toc-h3">子章节</a>
```

### 引用图标（P2-7）
```css
blockquote::before { content: '💡'; position: absolute; left: -28px; top: 8px; font-size: 1.2em; }
```

## 完整 HTML 骨架

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>标题</title>
  <!-- Mermaid CDN + fallback -->
  <script src="https://unpkg.com/mermaid@10.9.0/dist/mermaid.min.js"
    onerror="var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js';
    s.onerror=function(){/* 显示错误提示 */};document.head.appendChild(s);"></script>
  <style>
    /* CSS 见 layout.md */
  </style>
</head>
<body>
  <div class="header">...</div>
  <div class="progress-bar" id="progressBar"></div>
  <aside class="sidebar"><nav id="toc">...</nav></aside>
  <div class="content-area"><div class="container">
    <!-- 学习路径卡片 -->
    <!-- Section 卡片 -->
  </div></div>
  <script>
    // Mermaid 初始化 + 渲染
    // Scroll Spy + 进度条
  </script>
</body>
</html>
```

## CSS 核心变量
```css
--primary: #6366f1;
--primary-light: #eef2ff;
--sidebar-w: 260px;
--header-h: 60px;
--radius: 12px;
```

完整 CSS + 布局 → [layout.md](references/layout.md)
Mermaid 完整指南 → [mermaid.md](references/mermaid.md)
组件模板 → [components.md](references/components.md)
问题排查 → [troubleshooting.md](references/troubleshooting.md)
