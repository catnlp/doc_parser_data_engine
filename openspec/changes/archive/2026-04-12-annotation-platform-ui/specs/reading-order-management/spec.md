## ADDED Requirements

### Requirement: 拖拽排序

系统 SHALL 支持通过拖拽调整元素的阅读顺序。

#### Scenario: 拖拽排序列表项
- **WHEN** 用户在右侧"元素列表" Tab 中拖拽某个列表项到新位置
- **THEN** 系统显示放置位置指示线，松手后自动重新计算所有受影响元素的 `order` 值

#### Scenario: 排序实时更新序号 badge
- **WHEN** 拖拽过程中和完成后
- **THEN** 左侧 bbox 左上角的序号 badge 实时更新为新的 `order + 1` 值

#### Scenario: 排序后同步更新数据
- **WHEN** 拖拽排序完成
- **THEN** 系统更新 `pdf_info` 中所有相关元素的 `order` 字段，标记页面为脏状态

---

### Requirement: 阅读顺序可视化

系统 SHALL 在左侧面板中持续展示当前阅读顺序。

#### Scenario: 序号 badge 常显
- **WHEN** 页面渲染时
- **THEN** 每个 bbox 左上角显示半透明白色背景的序号 badge，数值为 `order + 1`

#### Scenario: 排序变更时的视觉反馈
- **WHEN** 拖拽排序过程中
- **THEN** 被拖拽元素对应的 bbox 短暂（500ms）显示蓝色脉冲动画，提示序号已变更
