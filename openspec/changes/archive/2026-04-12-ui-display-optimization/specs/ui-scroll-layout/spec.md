## ADDED Requirements

### Requirement: 列表滚动条可见

系统 SHALL 确保右侧元素列表在内容溢出时显示垂直滚动条，用户可以通过滚动查看所有元素。

#### Scenario: 大量元素时的滚动
- **WHEN** 页面包含超过可视区域的元素数量
- **THEN** 右侧列表区域显示垂直滚动条，用户可以上下滚动查看

#### Scenario: Flex 子项收缩
- **WHEN** 列表内容超出父容器高度
- **THEN** 父容器的 `min-height: 0` 允许子项收缩，overflow-y: auto 正常生效

### Requirement: 详情面板滚动

系统 SHALL 确保元素详情面板在内容较长时同样支持滚动查看。

#### Scenario: 长文本源码模式
- **WHEN** 用户切换到源码模式查看较长的 HTML Table
- **THEN** 代码编辑器区域显示滚动条
