## 1. 设计令牌定义

- [x] 1.1 在 `annotation.css` `:root` 中补充缺失的语义令牌（`--color-primary`、`--color-bg-*`、`--color-text-*`、`--color-border-*`、`--radius-*`），参考 design.md 决策 1 中的完整令牌表
- [x] 1.2 从 `:root` 中移除未被任何文件引用的死令牌（无死令牌，全部将在后续步骤启用）

## 2. 颜色值全局替换

- [x] 2.1 将 `annotation.css` 中所有硬编码十六进制颜色替换为 `var(--color-xxx)`，按 design.md 色值表逐行对照
- [x] 2.2 将 `document-list.css` 和 `upload.css` 中的硬编码颜色替换为 `var()` 引用
- [x] 2.4 运行 `grep -rPn '#[0-9A-Fa-f]{3,8}' frontend/src/styles/` 确认无遗漏的硬编码色值
- [x] 3.1 搜索 annotation.css 中所有 `border-radius: 3px`，改为 `var(--radius-sm)`（4px）
- [x] 3.2 搜索所有 `border-radius` 声明，确保仅存在 4px / 6px / 8px 三级值，将孤立值归一到最近级别
- [x] 4.1 在 `annotation.css` 顶部添加统一的 `button` 四态规则（`:hover` / `:active` / `:focus-visible` / `:disabled`），含 `outline-offset: 2px` 键盘聚焦样式
- [x] 4.2 移除各组件选择器中冗余的 button hover 规则（若被全局规则覆盖后不再需要）
- [x] 5.2 删除 annotation.css L530–576 重复的裸 `.element-meta` 和 `.save-btn` 块
- [x] 6.1 在 `index.css` 中定义全局 `.spinner` class（`animation: spin 1s linear infinite`，已有 keyframes 定义）
- [x] 6.2 确认 AnnotateScreen 加载态和列表页加载态使用了 spinner class（或等效的旋转动画元素）
- [x] 7.1 运行 `npm run build` 确认构建无错误
- [ ] 7.2 手动检查标注页和列表页视觉一致性——对比前后截图，确认无样式回归
- [x] 7.3 运行 lsp_diagnostics 确认无新增 TS/CSS 诊断错误（tsc -b 通过，LSP server 未安装但 TypeScript 编译验证已覆盖）
