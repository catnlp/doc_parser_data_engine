## ADDED Requirements

### Requirement: OCR 置信度字段穿透传递
前端解析管线 MUST 保留后端 `/api/parse` 返回的 `confidence` 字段，并将其传递到 `ParsedPageData.ocrElements[]` 中。

#### Scenario: 普通文本元素携带 OCR 置信度
- **WHEN** 后端 `/api/parse` 为某个 text 类型元素返回 `{ text: "...", confidence: 0.87 }`
- **THEN** 前端 `ocrElements[i]` 包含 `confidence: 0.87`
- **AND** 该值在 `ParsedPageData` 中被持久化到 localStorage

#### Scenario: 公式远程识别元素无 OCR 置信度
- **WHEN** 元素通过远程公式 API 识别（未走本地 OCR 流程）
- **THEN** 该元素的 `confidence` 字段为 `undefined`

#### Scenario: 旧版 localStorage 数据无 confidence 字段加载兼容
- **WHEN** 系统加载不包含 `confidence` 字段的旧版 localStorage 数据
- **THEN** 元素正常加载，`confidence` 为 `undefined`，不引发类型错误或运行时崩溃

#### Scenario: callLocalOcrApi 类型声明包含 confidence
- **WHEN** 查看 `parsePdf.ts` 中 `callLocalOcrApi` 的返回类型
- **THEN** 类型声明包含 `confidence: number` 字段

### Requirement: ocrElements 类型定义增加 confidence 字段
`ParsedPageData.ocrElements` 数组元素类型 MUST 增加可选字段 `confidence?: number`。

#### Scenario: 类型定义编译通过
- **WHEN** TypeScript 编译项目
- **THEN** `ParsedPageData.ocrElements` 元素类型包含 `confidence?: number` 且不引发类型错误
