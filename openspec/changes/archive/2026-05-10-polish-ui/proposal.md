## Why

前端界面目前存在视觉不一致问题：同一蓝色在 4 处用了 4 个不同值（`#3B82F6` / `#33B1FF` / `#1890ff` / `#2563EB`），CSS 变量虽已定义但未被实际使用，间距和圆角值缺乏统一规则，annotiation.css 中存在约 100 行重复声明。这导致开发时无法依靠一致的 Design Token 做决策，视觉上显得粗糙。

## What Changes

- 将 `:root` 中已定义的 CSS 自定义属性全面落实，替换所有硬编码颜色为 `var(--color-xxx)`
- 统一颜色值：将 `constants/elementTypes.ts` 中的类型颜色与 annotation.css 中的 bbox 颜色对齐
- 移除 annotation.css 中重复的 `.element-meta` 和 `.save-btn` 声明块（L530–576）
- 收敛圆角值：小元素 4px，按钮/输入框 6px，卡片 8px
- 完善所有 `<button>` 的 `:hover` / `:active` / `:focus-visible` 状态样式
- 确保 spinner CSS class 在加载场景中实际使用
- 清理 `:root` 中未被引用的 CSS 变量

## Capabilities

### New Capabilities

- `design-tokens`: 基于 CSS 自定义属性的设计令牌体系，覆盖颜色、间距、圆角、阴影，确保视觉一致性

### Modified Capabilities

无——本次变更不触及现有 spec 级别的行为定义。

## Impact

- 受影响文件：`frontend/src/styles/annotation.css`（主变更）、`frontend/src/styles/document-list.css`（颜色对齐）、`frontend/src/styles/upload.css`（颜色对齐）、`frontend/src/constants/elementTypes.ts`（颜色值同步）、`frontend/src/index.css`（全局样式补充）
- 不影响任何组件逻辑、Store 逻辑或 API 调用
- 不改变布局结构，不增加新依赖
