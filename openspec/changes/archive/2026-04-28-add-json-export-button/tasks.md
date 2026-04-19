## 1. 安装依赖

- [x] 1.1 安装 jszip 库：`npm install jszip`

## 2. 实现导出功能

- [x] 2.1 在 TopBar actions 区域添加"导出"按钮
- [x] 2.2 实现 handleExport 函数：从 store 获取当前页数据，构建 JSON 结构
- [x] 2.3 收集所有 figure 元素的图片，按序号重命名（1.png, 2.png, ...）
- [x] 2.4 将 annotations.json 和图片文件添加到 JSZip 实例
- [x] 2.5 生成 zip Blob 并触发浏览器下载
- [x] 2.6 实现文件命名逻辑：基于 PDF 文件名和页码生成 zip 文件名
- [x] 2.7 添加空文档状态检测，未加载文档时点击导出给出提示

## 3. 样式与验证

- [x] 3.1 为导出按钮添加合适的样式（复用现有 .primary 或 .topbar button 样式）
- [x] 3.2 运行 TypeScript 类型检查确保无编译错误
- [x] 3.3 手动验证：导出 zip 文件结构正确、annotations.json 内容正确、图片文件完整、下载行为正常
