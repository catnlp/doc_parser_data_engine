## ADDED Requirements

### Requirement: 导出 OmniDocBench JSON 格式

系统 SHALL 将当前标注数据导出为 OmniDocBench 标准 JSON 格式。

#### Scenario: 导出当前页
- **WHEN** 用户点击"导出当前页"按钮
- **THEN** 系统生成 JSON 文件并触发浏览器下载，文件命名为 `{image_path_stem}_page_{page_no}.json`

#### Scenario: 导出格式对齐 OmniDocBench
- **WHEN** 导出 JSON 时
- **THEN** 数据结构严格遵循 OmniDocBench 格式：
  ```jsonc
  {
    "image_path": "原始图片路径",
    "pdf_info": [
      {
        "category_type": "text",
        "poly": [x1,y1,x2,y2,x3,y3,x4,y4],
        "order": 0,
        "latex": "",
        "html": "",
        "markdown": "...",
        "image_path": ""
      }
    ],
    "page_info": { "height": 2339, "width": 1654 }
  }
  ```

#### Scenario: 导出包含修改后的 bbox 坐标
- **WHEN** 用户调整了 bbox 并确认保存
- **THEN** 导出的 `poly` 坐标为调整后的最新坐标

#### Scenario: 导出包含修改后的解析内容
- **WHEN** 用户编辑了元素的解析内容（markdown/html/latex）
- **THEN** 导出的对应字段为编辑后的最新内容

#### Scenario: 导出包含新增/删除的元素
- **WHEN** 用户新增了 bbox 或删除了 bbox
- **THEN** 导出的 `pdf_info` 包含新增元素，不包含已删除元素
