## Context

当前 TopBar 右侧 actions 区域已有"撤销"和"打开"按钮。标注数据存储在 Zustand store 中，可通过 `pdfInfo` 和 `currentPage` 获取当前页的完整标注数据。figure 类型元素可能引用了 `image_path` 图片资源。项目为纯前端应用，需要新增 `jszip` 依赖用于 zip 文件打包。

## Goals / Non-Goals

**Goals:**
- 在 TopBar 添加"导出"按钮，点击后下载 zip 文件
- zip 文件包含：`annotations.json`（标注数据）+ `images/` 文件夹（所有 figure 元素引用的图片）
- JSON 中的 `image_path` 字段修改为相对于 images 文件夹的路径
- 导出文件命名规范：`{原始PDF名}_{页码}.zip`

**Non-Goals:**
- 不导出多页数据（仅当前页）
- 不实现导入功能（仅导出）
- 不修改后端或存储格式

## Decisions

### 1. 使用 jszip 库进行 zip 打包
- **决策**：引入 `jszip` npm 包，纯前端生成 zip 文件
- **理由**：浏览器原生不支持 zip 生成，jszip 是最流行的前端 zip 库，体积小且 API 简单
- **备选方案**：通过后端打包——被否决，因为所有数据已在前端，无需网络请求

### 2. 图片资源按相对路径组织
- **决策**：将 `image_path` 重命名为 `images/{序号}.png` 格式，JSON 中路径同步更新
- **理由**：解压后目录结构清晰，JSON 中的路径可以直接引用同级 images 文件夹中的图片

### 3. 导出按钮放在 TopBar actions 区域
- **决策**：在现有"撤销"和"打开"按钮旁添加"导出"按钮
- **理由**：保持 UI 一致性，操作按钮集中在右侧便于发现

## Risks / Trade-offs

- **[包大小]** 新增 jszip 依赖增加构建体积 → jszip 压缩后约 30KB，影响可忽略
- **[大量图片]** figure 元素引用大图片时 zip 打包可能较慢 → 单页图片数量通常有限，jszip 性能可接受；必要时可添加加载提示
- **[图片路径格式]** 原始 image_path 可能包含绝对路径或无效路径 → 导出时按 `images/{序号}.png` 格式重命名，保持结构清晰
