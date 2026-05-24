# Mermaid 图表指南

> **所有流程图、架构图、时序图、状态图默认使用 Mermaid。**

## 关键规则（必须遵守）

| # | 规则 | 说明 |
|---|------|------|
| 1 | **容器** | 用 `<div class="mermaid-container"><div class="mermaid" id="mermaid-N" data-graph="...">` |
| 2 | **源码存储** | **必须用 `data-graph` 属性存储 mermaid 源码**，不能用 textContent（会被 mermaid 注入的 CSS 污染） |
| 3 | **语法** | 用 `flowchart LR/TD/TB`，**不用** `graph` |
| 4 | **换行** | 节点内用 `\n`，**不用** `<br/>` |
| 5 | **style** | 每条独立一行 `style A fill:#e1f5fe`，**不用**分号连接 |
| 6 | **初始化** | `startOnLoad: false` + 手动 `window.load` 调用 |
| 7 | **渲染** | 用 `mermaid.render(id, graphDefinition)` 逐个渲染，**不用** `mermaid.run()` |
| 8 | **背景色** | 容器用 `#ffffff` 纯白，**不用**浅灰 |
| 9 | **线条增强** | CSS 强制节点边框 `#4f46e5`、线条 `#1e293b`、`stroke-width: 2px` |
| 10 | **字体大小** | 所有 mermaid 文字强制 `13px` |
| 11 | **mermaid.js** | 优先内联（下载后嵌入 `<script>`），CDN 仅作 fallback |

## 正确写法

### Python 脚本中的 mermaid 容器生成

```python
# 全局计数器
GLOBAL_MERMAID_ID = [0]

def render_mermaid(raw_code):
    """raw_code: 纯 mermaid 源码，如 'flowchart LR\n    A --> B'"""
    mid = f'mermaid-{GLOBAL_MERMAID_ID[0]}'
    GLOBAL_MERMAID_ID[0] += 1
    # 关键：用 data-graph 属性存储，不用 textContent
    escaped = htmlmod.escape(raw_code).replace('"', '&quot;')
    return f'<div class="mermaid-container"><div class="mermaid" id="{mid}" data-graph="{escaped}"></div></div>'
```

### JavaScript 渲染逻辑

```javascript
function initMermaid() {
  if (typeof mermaid === 'undefined') {
    document.querySelectorAll('.mermaid-container').forEach(function(el) {
      el.innerHTML = '<p style="color:#ef4444">⚠️ Mermaid 未加载</p>';
    });
    return;
  }
  mermaid.initialize({
    startOnLoad: false,  // 必须 false，手动渲染
    theme: 'default',
    securityLevel: 'loose',
    flowchart: { htmlLabels: true, curve: 'basis', padding: 15, nodeSpacing: 45, rankSpacing: 55 }
  });

  var containers = document.querySelectorAll('.mermaid');
  var promises = [];
  containers.forEach(function(el) {
    var id = el.id;
    // 关键：从 data-graph 读取，不是 textContent
    var graphDefinition = el.getAttribute('data-graph');
    if (!graphDefinition) return;
    var p = mermaid.render(id + '-svg', graphDefinition).then(function(result) {
      el.outerHTML = '<div class="mermaid-svg">' + result.svg + '</div>';
    }).catch(function(err) {
      var safe = graphDefinition.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      el.outerHTML = '<pre style="background:#1e293b;color:#e2e8f0;padding:12px">' + safe + '</pre>';
    });
    promises.push(p);
  });

  Promise.all(promises).then(function() {
    // 后处理：强制字体和颜色
    document.querySelectorAll('.mermaid-svg svg text, .mermaid-svg svg tspan').forEach(function(el) {
      el.setAttribute('font-size', '13'); el.style.fontSize = '13px'; el.style.fill = '#1e293b';
    });
    document.querySelectorAll('.mermaid-svg .node rect, .mermaid-svg .node circle').forEach(function(el) {
      el.setAttribute('fill', '#e0e7ff'); el.setAttribute('stroke', '#4f46e5'); el.setAttribute('stroke-width', '2');
    });
    document.querySelectorAll('.mermaid-svg .edgePath path').forEach(function(el) {
      el.setAttribute('stroke', '#1e293b'); el.setAttribute('stroke-width', '2.5');
    });
  });
}

// 在 window.load 后延迟 500ms 渲染
window.addEventListener('load', function() { setTimeout(initMermaid, 500); });
```

## 错误写法

```html
<!-- ❌ 用 textContent 存储源码（会被 mermaid 注入的 CSS 污染） -->
<div class="mermaid-container"><pre class="mermaid">flowchart LR
    A --> B
</pre></div>

<!-- ❌ 用 mermaid.run() 自动渲染（不可靠） -->
mermaid.run()

<!-- ❌ startOnLoad: true 与手动渲染冲突 -->
mermaid.initialize({ startOnLoad: true })

<!-- ❌ 用 textContent 读取（读到的是 CSS 而非源码） -->
el.textContent
```

## 常见图表类型

| 类型 | 语法 | 场景 |
|------|------|------|
| 从左到右 | `flowchart LR` | 流程图/时间线/工作流 |
| 从上到下 | `flowchart TD` | 层级结构/组织架构 |
| 子图 | `subgraph 名称` ... `end` | 分组/模块划分 |
| 菱形判断 | `X{"是否"}` | 条件分支 |
| 虚线边 | `A -.-> B` | 弱关联 |
| 带标签边 | `A -->|"标签"| B` | 标注关系 |

## 避坑清单

| 问题 | 原因 | 解决 |
|------|------|------|
| 不渲染 | 用了 `graph` 语法 | 改用 `flowchart` |
| 不渲染 | 节点内有 `<br/>` | 改用 `\n` 或直接去掉 |
| 不渲染 | style 用分号连接 | 改为每行独立 `style X fill:color` |
| 不渲染 | 用 textContent 读源码 | 改用 `data-graph` 属性 |
| 不渲染 | 用 `mermaid.run()` | 改用逐个 `mermaid.render()` |
| 不渲染 | CDN 加载失败 | 内联 mermaid.js |
| 渲染乱码 | `startOnLoad: true` | 改为 `false` + 手动渲染 |
| 节点文字巨大 | `htmlLabels: false` | 改为 `true` + CSS 控制 |
