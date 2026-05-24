# 组件模板

## 卡片网格

```html
<div class="card-grid">
  <div class="card"><h4>标题</h4><p>描述</p></div>
  <div class="card success"><h4>成功</h4><p>绿色</p></div>
  <div class="card warning"><h4>警告</h4><p>黄色</p></div>
  <div class="card danger"><h4>危险</h4><p>红色</p></div>
</div>
```

## Badge

```html
<span class="badge success">✅ 适合</span>
<span class="badge warning">⚠️ 视情况</span>
<span class="badge danger">❌ 不适合</span>
```

## 引用块

```html
<blockquote><p>"引用内容"</p></blockquote>
```

## 表格

```html
<div class="table-wrap">
  <table>
    <thead><tr><th>列1</th><th>列2</th></tr></thead>
    <tbody>
      <tr><td>数据1</td><td>数据2</td></tr>
      <tr><td>数据3</td><td>数据4</td></tr>
    </tbody>
  </table>
</div>
```

**Python 脚本中的表格渲染逻辑**：

```python
def render_tbl():
    # 1. 过滤 markdown 分隔行
    filtered = [c for c in table_buf if not re.match(r'^[\s\-|:]+$', '|'.join(c))]
    if not filtered: return
    # 2. 第一行为 thead
    header = '<tr>' + ''.join(f'<th>{c}</th>' for c in filtered[0]) + '</tr>'
    # 3. 其余为 tbody
    body = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in row) + '</tr>' for row in filtered[1:])
    if len(filtered) > 1:
        out.append(f'<div class="table-wrap"><table><thead>{header}</thead><tbody>{body}</tbody></table></div>')
    else:
        out.append(f'<div class="table-wrap"><table>{header}</table></div>')
```

**CSS 样式**：

```css
.table-wrap {
  overflow-x: auto; margin: 12px 0;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--bd); border-radius: 8px;
}
.table-wrap table {
  width: 100%; border-collapse: collapse; font-size: .9em; min-width: 400px;
}
.table-wrap th {
  background: #f1f5f9; padding: 10px 14px; text-align: left;
  font-weight: 600; border-bottom: 2px solid var(--bd); white-space: nowrap;
}
.table-wrap td {
  padding: 10px 14px; border-bottom: 1px solid var(--bd);
}
.table-wrap tbody tr:last-child td { border-bottom: none; }
.table-wrap tbody tr:hover { background: #f8fafc; }
```

## 阅读进度条

```html
<div class="progress-bar" id="progressBar"></div>
```

```css
.progress-bar {
  position: fixed; top: var(--hh); left: 0; height: 3px;
  background: linear-gradient(90deg, #10b981, #6366f1);
  z-index: 101; width: 0; transition: width .15s;
}
```

```javascript
// Scroll 更新进度
var y = window.scrollY, h = document.body.scrollHeight - window.innerHeight;
document.getElementById('progressBar').style.width = Math.min(y/h*100, 100) + '%';
```

## 回到顶部按钮

```html
<button class="back-top" id="backTop" onclick="window.scrollTo({top:0,behavior:'smooth'})">↑</button>
```

```css
.back-top {
  display: none; position: fixed; bottom: 24px; right: 24px;
  width: 44px; height: 44px; border-radius: 50%; background: var(--p);
  color: #fff; border: none; font-size: 1.3em; cursor: pointer; z-index: 200;
  box-shadow: 0 4px 12px rgba(99,102,241,.3);
}
```

## 代码复制按钮

```html
<div class="code-block">
  <pre><code>code here</code></pre>
  <button class="copy-btn" onclick="copyCode(this)">📋</button>
</div>
```

```css
.code-block { position: relative; margin: 12px 0; }
.code-block .copy-btn {
  position: absolute; top: 8px; right: 8px;
  background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2);
  color: #e2e8f0; border-radius: 6px; padding: 4px 8px;
  cursor: pointer; font-size: .8em; z-index: 2;
}
```

```javascript
function copyCode(btn) {
  var code = btn.parentElement.querySelector('code').textContent;
  navigator.clipboard.writeText(code).then(function() {
    btn.textContent = '✅'; setTimeout(function() { btn.textContent = '📋' }, 2000);
  });
}
```

## Footer

```html
<div class="footer">
  <div class="divider"></div>
  <p>🦐 作者 · 说明 · 日期</p>
</div>
```
