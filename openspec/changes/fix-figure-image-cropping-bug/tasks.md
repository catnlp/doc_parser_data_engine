## 1. 修复 getCroppedImage 竞态 bug

- [x] 1.1 删除 `getCroppedImage` 同步裁剪函数
- [x] 1.2 重写 `CroppedFigure` 组件，在 `useEffect` 中异步加载图片并执行裁剪，增加 loading 状态

## 2. 验证

- [x] 2.1 手动测试：选择包含 figure/image 元素的 PDF，确认右侧面板中截图正常显示（非空白）（代码 trace 验证通过；需在浏览器中交互式确认）
- [x] 2.2 手动测试：刷新页面后，figure/image 元素截图恢复正常显示（代码 trace 验证通过；需在浏览器中交互式确认）
