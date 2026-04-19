## Why

当前标注工具缺少数据导出功能，用户完成标注后无法将标注结果保存为结构化文件，导致标注数据无法持久化或与其他系统对接。增加完整的导出功能（包含标注数据和引用的图片资源）是标注工具的基础能力。

## What Changes

- 在顶部工具栏（TopBar）右侧操作区新增"导出"按钮
- 点击后将当前页标注数据导出为 JSON 文件，并将所有引用的图片单独保存为文件
- JSON 和图片文件打包为 zip 格式并触发浏览器下载
- JSON 结构中图片路径修改为相对路径（相对于导出的图片文件夹）

## Capabilities

### New Capabilities
- `zip-export`: 将当前页标注数据和引用的图片资源打包为 zip 文件并触发浏览器下载

### Modified Capabilities
<!-- 无现有 spec 需要修改 -->

## Impact

- `frontend/src/components/TopBar.tsx`：新增导出按钮及 zip 打包导出逻辑
- 新增前端依赖 `jszip` 用于 zip 文件生成
- 前端 store 无需修改，仅需读取现有数据
- 无后端依赖，纯前端实现
