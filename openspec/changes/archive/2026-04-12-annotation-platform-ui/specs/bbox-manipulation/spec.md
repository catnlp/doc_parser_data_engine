## ADDED Requirements

### Requirement: Bbox 创建

系统 SHALL 支持用户在页面上手动创建新的 bbox。

#### Scenario: 进入框选模式
- **WHEN** 用户点击工具栏上的"框选"按钮
- **THEN** 鼠标光标变为十字（crosshair），进入框选模式，此时点击已有 bbox 不触发选中

#### Scenario: 绘制新 bbox
- **WHEN** 用户在框选模式下按下鼠标并拖动
- **THEN** 系统实时绘制一个虚线矩形跟随鼠标，松开鼠标后：
  - 若矩形宽度或高度小于 20px，则取消绘制并提示"区域过小"
  - 若矩形有效，则保持虚线矩形，弹出类型选择浮窗

#### Scenario: 选择类型后完成创建
- **WHEN** 用户在类型选择浮窗中点击某个类型（text/table/figure/equation）
- **THEN** 系统创建新元素，poly 坐标为矩形的 4 点坐标（转换为 8 点格式），`order` 自动追加为当前最大值 + 1，右侧面板切换到该元素的详情 Tab

#### Scenario: 退出框选模式
- **WHEN** 用户按 Escape 键或点击工具栏的"选择"按钮
- **THEN** 退出框选模式，鼠标光标恢复默认，虚线矩形清除

---

### Requirement: Bbox 拖拽修正

系统 SHALL 支持拖拽 bbox 的 4 角手柄来调整边界。

#### Scenario: 显示拖拽手柄
- **WHEN** 用户选中某个 bbox
- **THEN** 系统在该 bbox 的 4 个角显示拖拽手柄（8px × 8px 方块）

#### Scenario: 拖拽调整边界
- **WHEN** 用户拖拽某个角手柄
- **THEN** 系统实时更新 bbox 的 `poly` 坐标，保持矩形形状（4 角同步调整）

#### Scenario: 拖拽松手后的确认
- **WHEN** 用户松开拖拽手柄
- **THEN** 系统弹出确认对话框"Bbox 已修改。是否确认修改并重新解析该元素？"，提供三个选项："确认并重新解析"、"撤销"、"取消"

#### Scenario: 确认并重新解析
- **WHEN** 用户点击"确认并重新解析"
- **THEN** 系统保存新 poly 坐标，标记该元素为"待重新解析"状态，触发重新解析流程

#### Scenario: 撤销修改
- **WHEN** 用户点击"撤销"
- **THEN** bbox 恢复到拖拽前的坐标，不触发重新解析

---

### Requirement: Bbox 删除

系统 SHALL 支持删除不需要的 bbox。

#### Scenario: 键盘删除
- **WHEN** 用户选中一个 bbox 后按 Delete 键
- **THEN** 弹出二次确认"确认删除该元素？"，确认后从 `pdf_info` 中移除该元素，重新排列剩余元素的 `order`

#### Scenario: 按钮删除
- **WHEN** 用户在元素详情 Tab 中点击"删除元素"按钮
- **THEN** 同键盘删除行为

---

### Requirement: Bbox 坐标只读展示

系统 SHALL 在元素详情中展示当前 bbox 的 poly 坐标（只读）。

#### Scenario: 显示坐标
- **WHEN** 用户在元素详情 Tab
- **THEN** 系统显示 `poly` 的 8 点坐标文本，标记为只读
