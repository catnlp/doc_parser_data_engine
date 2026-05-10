## Context

项目前端已定义 `:root` CSS 变量（`annotation.css` L1–14），但从未被 `var()` 引用——所有颜色均以硬编码形式散布在 CSS 和 TypeScript 常量中。圆角、间距无统一尺度，按钮状态样式定义分散且不完整。

## Goals / Non-Goals

**Goals:**
- 建立一套可用的 CSS 设计令牌体系，所有视觉属性统一通过 `var()` 引用
- 消除颜色重复定义：`constants/elementTypes.ts` 与 annotation.css 中 bbox 颜色对齐为同一组值
- 清理 annotation.css 中 ~100 行重复声明
- 圆角收敛到三级尺度（4px / 6px / 8px）
- 所有按钮具备完整的 `hover` / `active` / `focus-visible` 状态

**Non-Goals:**
- 不修改任何 TSX 组件逻辑或 JSX 结构
- 不引入 CSS-in-JS、Tailwind 等新工具
- 不改变布局（flex/grid 结构保持不变）
- 不添加 toast/notification 组件
- 不替换组件中的内联 `style`（但确认颜色值不因此产生新的不一致）

## Decisions

### 1. 颜色令牌命名规范

**决定**: 采用语义化命名 `--color-{role}`，不使用色值命名（如 `--blue-500`）。

**理由**: 当前语义命名已满足需求（`--color-text`、`--color-table`）。如果将来需要更多色阶，再引入 `--color-text-100` / `--color-text-500` 模式。

**权威色值表**（以 annotation.css `:root` 为基准）:

| 令牌 | 权威值 | 用途 |
|------|--------|------|
| `--color-text` | `#3B82F6` | 文本类型元素 / 主色调 |
| `--color-title` | `#3B82F6` | 标题类型（与 text 同色） |
| `--color-table` | `#10B981` | 表格类型 |
| `--color-figure` | `#F59E0B` | 图片类型 |
| `--color-figure-caption` | `#F97316` | 图片题注 |
| `--color-table-caption` | `#84CC16` | 表格题注 |
| `--color-equation` | `#8B5CF6` | 公式类型 |
| `--color-header` | `#9CA3AF` | 页眉 |
| `--color-footer` | `#9CA3AF` | 页脚 |
| `--color-create` | `#6366F1` | 新建元素边框 |

**新增语义令牌**（当前 `:root` 缺失但 CSS 中反复出现）:

| 令牌 | 值 | 用途 |
|------|-----|------|
| `--color-primary` | `#3B82F6` | 主操作按钮 / 链接 / 选中态 |
| `--color-primary-hover` | `#2563EB` | 主按钮 hover |
| `--color-danger` | `#EF4444` | 删除/危险操作 |
| `--color-danger-hover` | `#DC2626` | 危险按钮 hover |
| `--color-success` | `#10B981` | 成功状态 |
| `--color-warning` | `#F59E0B` | 警告状态 |
| `--color-bg-page` | `#F5F5F5` | 页面背景 |
| `--color-bg-surface` | `#FFFFFF` | 卡片/面板背景 |
| `--color-bg-hover` | `#F0F0F0` | 通用 hover 背景 |
| `--color-border` | `#E0E0E0` | 默认边框 |
| `--color-border-hover` | `#D0D0D0` | 边框 hover |
| `--color-text-primary` | `#374151` | 主文字 |
| `--color-text-secondary` | `#6B7280` | 辅助文字 |
| `--color-text-muted` | `#94A3B8` | 弱化文字 |

### 2. `elementTypes.ts` 颜色同步

**决定**: `constants/elementTypes.ts` 中的 `CATEGORY_COLORS` 直接 import 或用字面量对齐 annotation.css `:root` 变量。当前两处不一致：

```
              constants/elementTypes.ts    annotation.css :root
text          #33B1FF          ❌          #3B82F6  ✅
figure        #FA8C16          ❌          #F59E0B  ✅
equation      #722ED1          ❌          #8B5CF6  ✅
```

**修改**: `elementTypes.ts` 中三个值改为与 `:root` 对齐。若该常量在 TSX 中用于内联 style，同时需确认其引用处不会产生新的不一致。

### 3. 圆角尺度

**决定**: 收敛为三级 —— 不再出现 `3px`、`5px` 等孤立值。

| 层级 | 值 | 适用 |
|------|-----|------|
| `--radius-sm` | `4px` | 标签/徽章/小元素 |
| `--radius-md` | `6px` | 按钮/输入框/弹出菜单 |
| `--radius-lg` | `8px` | 卡片/面板 |

当前含 `border-radius: 3px` 的行（如 `.bottomnav button`）统一改为 `--radius-sm`（4px）。

### 4. 按钮状态生命周期

**决定**: 所有 `<button>` 统一具备四态：

```css
button {
  /* base */
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, opacity 0.15s;
}
button:hover   { background: var(--color-bg-hover); }
button:active  { opacity: 0.8; }
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

### 5. 重复声明块清理

**决定**: annotation.css 中 L530–576 的 `.element-meta` 和 `.save-btn` 是 L480–528 的完整重复。保留前者（位于 `.expanded-card-content` 上下文中的版本），删除后者（裸顶层版本）。确保删除后无样式丢失。

**验证**: 搜索 `.element-meta` 和 `.save-btn` 的所有引用处，确认只存在于 `.expanded-card-content` 内部。

## Risks / Trade-offs

- **[风险] 颜色替换引入遗漏** → 用 `grep` 列出所有硬编码色值，逐行对照替换，替换后跑一次视觉回归（手动对比前后截图）
- **[风险] 删除重复声明后样式丢失** → 先确认 `.element-meta` 和 `.save-btn` 只在 `.expanded-card-content` 内使用，不在其他位置引用
- **[取舍] 不入场改内联 style** → 组件中的内联 `style={{ color: '#3B82F6' }}` 不会改为 `var()`，保持本次纯 CSS 范围。若将来要统一可再做一轮组件级清理
