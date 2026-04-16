## 1. 状态管理

- [x] 1.1 在 useAnnotationStore 中新增 zoom 字段，默认值 100
- [x] 1.2 添加 setZoom action

## 2. 缩放控件

- [x] 2.1 在 TopBar 缩放区域增加 +/- 按钮
- [x] 2.2 按钮点击调用 setZoom，限制范围 50-200
- [x] 2.3 实时显示当前缩放百分比

## 3. 缩放联动渲染

- [x] 3.1 LeftPanel 读取 zoom 状态
- [x] 3.2 将 zoom 加入 useEffect 依赖，重新计算 displayWidth 和 scale
- [x] 3.3 SVG overlay width/height 同步应用缩放比例
- [x] 3.4 bbox 坐标乘以 scale 因子保持对齐

## 4. 滚动条修复

- [x] 4.1 在 annotation.css 的 .tab-content 中添加 min-height: 0
- [x] 4.2 验证右侧列表在内容溢出时可正常滚动
- [x] 4.3 验证详情面板同样支持滚动

## 5. OCR 裁剪优化

- [x] 5.1 将 api_ocr.py 中的 MARGIN 从 10px 改为 60px
- [x] 5.2 验证边缘文本识别完整性
- [x] 5.3 清理调试日志
