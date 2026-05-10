## ADDED Requirements

### Requirement: CSS 设计令牌体系

系统 SHALL 在 `:root` 中定义完整的 CSS 自定义属性（设计令牌），覆盖颜色、间距、圆角、阴影四个维度。所有样式文件 SHALL 通过 `var(--token)` 引用令牌，不得使用硬编码色值。

#### Scenario: 颜色令牌被引用

- **WHEN** 检查 annotation.css、document-list.css、upload.css 中的所有 `color`、`background`、`border-color`、`fill`、`stroke` 属性
- **THEN** 每个颜色值均以 `var(--color-xxx)` 形式引用，不存在原始十六进制颜色字面量

#### Scenario: 间距令牌一致

- **WHEN** 检查所有 `padding`、`margin`、`gap` 属性的值
- **THEN** 所有值均为 4 的倍数（4px、8px、12px、16px、20px、24px、32px），不存在 2px、5px、6px、10px 等孤例

#### Scenario: 圆角令牌收敛

- **WHEN** 检查所有 `border-radius` 属性的值
- **THEN** 仅出现三种值：4px（小元素/徽章）、6px（按钮/输入框/弹出层）、8px（卡片/面板），不存在 3px 或其他孤立值

### Requirement: 元素类型颜色一致性

`constants/elementTypes.ts` 中 CATEGORY_COLORS 的颜色值 SHALL 与 annotation.css `:root` 中对应的 `--color-*` 令牌值完全相同。

#### Scenario: text 类型颜色对齐

- **WHEN** 读取 `constants/elementTypes.ts` 中 `text` 的颜色值
- **THEN** 其值为 `#3B82F6`（与 `--color-text` 一致），而非当前的 `#33B1FF`

#### Scenario: figure 类型颜色对齐

- **WHEN** 读取 `constants/elementTypes.ts` 中 `figure` 的颜色值
- **THEN** 其值为 `#F59E0B`（与 `--color-figure` 一致），而非当前的 `#FA8C16`

#### Scenario: equation 类型颜色对齐

- **WHEN** 读取 `constants/elementTypes.ts` 中 `equation` 的颜色值
- **THEN** 其值为 `#8B5CF6`（与 `--color-equation` 一致），而非当前的 `#722ED1`

### Requirement: 按钮交互状态完整

所有 `<button>` 元素 SHALL 具备完整的四态样式：默认（base）、悬停（hover）、按下（active）、键盘聚焦（focus-visible）。禁用态（disabled）SHALL 降低透明度并禁止点击。

#### Scenario: 按钮 hover 有视觉反馈

- **WHEN** 鼠标悬停在任意按钮上
- **THEN** 按钮背景色或边框色发生变化，transition 持续时间为 0.15s

#### Scenario: 按钮 active 有按下反馈

- **WHEN** 鼠标按下任意按钮（mousedown）
- **THEN** 按钮透明度降至 0.8，产生"被按下"的视觉感受

#### Scenario: 键盘聚焦可见

- **WHEN** 用户通过 Tab 键将焦点移至按钮
- **THEN** 按钮周围出现 2px 的 `--color-primary` 色轮廓线（outline-offset: 2px）

#### Scenario: 禁用态不可交互

- **WHEN** 按钮处于 `disabled` 状态
- **THEN** 按钮透明度为 0.4，光标样式为 `not-allowed`，点击无响应

### Requirement: 无冗余 CSS 声明

annotation.css SHALL 不包含重复的样式规则块。

#### Scenario: element-meta 无重复

- **WHEN** 搜索 annotation.css 中 `.element-meta` 的声明
- **THEN** 该选择器仅在 `.expanded-card-content .element-meta` 上下文中出现一次，不存在裸顶层 `.element-meta` 块

#### Scenario: save-btn 无重复

- **WHEN** 搜索 annotation.css 中 `.save-btn` 的声明
- **THEN** 该选择器仅在 `.expanded-card-content .save-btn` 上下文中出现一次，不存在裸顶层 `.save-btn` 块

### Requirement: 加载状态使用 spinner

加载中的视觉反馈 SHALL 使用项目中已有的 `.spinner` CSS class（animation: spin），而非纯文本。

#### Scenario: 列表页加载使用 spinner

- **WHEN** AnnotateScreen 处于加载状态（`imagesRestored` 为 false 且有已保存文档）
- **THEN** 显示旋转动画元素，而非仅有文字"加载中..."
