# Layout CSS — 完整样式

## 整体布局结构

```
┌────────────┬────────────────────────────────┐
│ 📑 固定侧栏  │  🦐 固定顶栏（紫色渐变 60px）     │
│ 目录导航     │                                │
├────────────┤                                │
│            │  正文居中区域                    │
│            │                                │
└────────────┘                                │
```

## CSS 变量

```css
:root {
  --primary: #6366f1;
  --primary-light: #eef2ff;
  --success: #10b981;
  --success-light: #d1fae5;
  --warning: #f59e0b;
  --warning-light: #fef3c7;
  --danger: #ef4444;
  --danger-light: #fee2e2;
  --bg-gray: #f1f5f9;
  --sidebar-w: 260px;
  --header-h: 60px;
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  --radius: 12px;
}
```

## 固定顶栏

```css
.header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  height: var(--header-h);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff; display: flex; align-items: center; padding: 0 24px;
  box-shadow: var(--shadow-md);
}
.header .title { font-size: 1.1em; font-weight: 600; }
.header .subtitle { font-size: 0.8em; opacity: 0.85; margin-left: 12px; }
```

## 固定侧栏（带滚动高亮）

```css
.sidebar {
  position: fixed; top: var(--header-h); left: 0; bottom: 0;
  width: var(--sidebar-w); background: var(--bg);
  border-right: 1px solid var(--border);
  overflow-y: auto; padding: 16px 0; z-index: 50;
}
.sidebar .toc-title {
  font-size: 0.75em; text-transform: uppercase; color: var(--text-muted);
  padding: 0 20px 8px; letter-spacing: 0.05em; font-weight: 600;
}
.sidebar nav a {
  display: block; padding: 8px 20px; color: var(--text-secondary);
  text-decoration: none; font-size: 0.85em; border-left: 3px solid transparent;
  transition: all 0.15s;
}
.sidebar nav a:hover { background: var(--primary-light); color: var(--primary); }
.sidebar nav a.active {
  color: var(--primary); font-weight: 600;
  background: var(--primary-light); border-left-color: var(--primary);
}
```

## 正文居中容器

```css
.content-area {
  margin-left: var(--sidebar-w); margin-top: var(--header-h);
  min-height: calc(100vh - var(--header-h));
  display: flex; justify-content: center;
  padding: 32px 24px 80px;
}
.container { max-width: 860px; width: 100%; }
```

## Section 卡片

```css
.section {
  background: var(--bg); border-radius: var(--radius);
  padding: 36px; margin-bottom: 28px;
  box-shadow: var(--shadow-md); border: 1px solid var(--border);
  transition: box-shadow 0.2s;
}
.section:hover { box-shadow: var(--shadow-lg); }
.section h2 {
  font-size: 1.4em; color: var(--primary);
  display: flex; align-items: center; gap: 10px;
}
.section h2 .num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; background: var(--primary);
  color: #fff; border-radius: 50%; font-size: 0.8em; font-weight: 700;
}
```

## 滚动高亮 JS（Scroll Spy）

```js
(function(){
  var sections = document.querySelectorAll('.section');
  var navLinks = document.querySelectorAll('#toc a');
  function onScroll(){
    var scrollY = window.scrollY + 100;
    var current = '';
    sections.forEach(function(s){
      if(scrollY >= s.offsetTop) current = s.id;
    });
    navLinks.forEach(function(a){
      a.classList.remove('active');
      if(a.getAttribute('href') === '#' + current) a.classList.add('active');
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();
```

## 移动端适配

```css
.menu-toggle {
  display: none; position: fixed; bottom: 16px; right: 16px; z-index: 200;
  width: 44px; height: 44px; border-radius: 50%;
  background: var(--primary); color: #fff; border: none;
  font-size: 1.3em; cursor: pointer; box-shadow: var(--shadow-md);
}
@media(max-width:800px) {
  .sidebar { display: none }
  .sidebar.open { display: block }
  .content-area { margin-left: 0 }
  .menu-toggle { display: flex; align-items: center; justify-content: center }
  .header .subtitle { display: none }
  .section { padding: 24px 18px }
  .card-grid { grid-template-columns: 1fr }
}
```

## Mermaid 容器样式

```css
.mermaid-container {
  background: #f8fafc; border-radius: 12px; padding: 24px;
  margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid #e2e8f0; overflow-x: auto; text-align: center;
}
.mermaid-container svg { max-width: 100%; height: auto; }
/* Mermaid 节点和线条样式增强 */
.mermaid-container .node rect,
.mermaid-container .node circle,
.mermaid-container .node ellipse,
.mermaid-container .node polygon,
.mermaid-container .node path {
  fill: #fff !important;
  stroke: #6366f1 !important;
  stroke-width: 2px !important;
}
.mermaid-container .edgePath path {
  stroke: #475569 !important;
  stroke-width: 2px !important;
}
.mermaid-container .edgeLabel {
  background: #f8fafc !important;
  color: #1e293b !important;
  font-weight: 500 !important;
}
.mermaid-container .cluster rect {
  fill: #f1f5f9 !important;
  stroke: #94a3b8 !important;
  stroke-width: 1px !important;
}
```

## Footer

```css
.footer { text-align: center; padding: 40px 0 20px; color: var(--text-muted); font-size: 0.85em; }
.footer .divider { height: 1px; background: var(--border); margin-bottom: 20px; }
```
