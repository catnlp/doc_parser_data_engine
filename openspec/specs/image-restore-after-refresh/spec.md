## ADDED Requirements

### Requirement: 刷新后必须从 IndexedDB 恢复图片数据
页面刷新后，系统必须从 IndexedDB 中读取保存文档对应的图片数据（imageBase64），并将其填充回 `parsedData` 的每个页面。

#### Scenario: 刷新保存状态的文档
- **WHEN** 用户刷新页面，且存在状态为 `saved` 的文档（已从 localStorage 恢复）
- **THEN** 系统调用 `getDocImages(docId)` 从 IndexedDB 获取该文档所有页面的图片
- **THEN** 将每张图的 `imageBase64` 填充回 `parsedData[pageIdx].imageBase64`

#### Scenario: IndexedDB 中无对应图片
- **WHEN** 某文档在 localStorage 中存在但 IndexedDB 中无对应图片数据
- **THEN** 该文档的 `parsedData` 中 `imageBase64` 保持为空
- **THEN** 左侧面板显示「未加载文档图片」提示

#### Scenario: IndexedDB 数据库不可用
- **WHEN** IndexedDB 不可用（如隐私模式、存储限额）
- **THEN** 图片恢复失败不应阻塞页面加载
- **THEN** 控制台输出警告日志

### Requirement: 图片恢复完成前标注页面应显示加载状态
在图片从 IndexedDB 恢复到完成期间，标注页面应显示加载指示器，而非渲染空白面板或崩溃。

#### Scenario: 进入标注页面等待图片恢复
- **WHEN** 用户从列表页进入标注页面（或刷新后自动进入标注页）
- **THEN** 在图片恢复完成前，左侧面板显示加载提示
- **THEN** 图片恢复完成后，标注页面完整渲染

#### Scenario: 进入标注页面时图片已全部加载
- **WHEN** 图片已在恢复完成后（如非保存态文档、首次解析完成）
- **THEN** 直接进入标注页面，无需显示加载状态

### Requirement: 恢复后 ID 必须与 localStorage docId 一致
从 IndexedDB 恢复的图片必须通过 `docId` 精确匹配对应的文档。

#### Scenario: 文档 ID 匹配
- **WHEN** localStorage 中存在文档 `{ id: "saved_xxx_abc123", status: "saved" }`
- **THEN** 调用 `getDocImages("saved_xxx_abc123")` 读取对应图片
- **THEN** 按页码顺序（0, 1, 2, ...）填充 `imageBase64`
