## ADDED Requirements

### Requirement: 禁止 any 类型标注
代码中 MUST 不存在 `any` 类型标注。所有函数参数、返回值、变量声明 SHALL 使用明确的具体类型或 `unknown` + 类型守卫的组合。`as any` 类型断言 MUST 被替换为正确的类型转换。

#### Scenario: ElementCard 使用 PdfElement 类型
- **WHEN** `RightPanel.tsx` 中 `ElementCard` 组件的 props 接口被定义
- **THEN** `element` 参数类型为 `PdfElement`，而非 `any`

#### Scenario: API 响应使用具名接口
- **WHEN** `models.ts` 中 OCR API 响应被解析
- **THEN** 使用 `OcrResponse` 接口替代 `(ocrJson as any)` 类型断言，接口定义包含 `elements: ParsedElement[]`

#### Scenario: 类型守卫处理未知结构
- **WHEN** 数据结构在编译时无法确定（如 fetch 返回的 json）
- **THEN** 使用 `unknown` 作为中间类型，再通过类型守卫（`isOcrResponse()`）窄化为具体类型

### Requirement: 禁止 @ts-ignore 注解
代码中 MUST 不存在 `@ts-ignore` 或 `@ts-expect-error` 注解。当第三方库类型定义与实际 API 不一致时，SHALL 使用显式类型断言（如 `(obj as SpecificType).method()`）或接口扩展。

#### Scenario: pdfjs render 调用类型转换
- **WHEN** `parsePdf.ts` 中调用 `page.render()` 且 pdfjs 类型定义不兼容
- **THEN** 使用 `(page as PDFPageProxy).render(renderParams)` 显式类型断言，并附带注释说明为什么需要类型断言

#### Scenario: webkitdirectory 属性兼容处理
- **WHEN** `FolderUpload.tsx` 中需要设置 `webkitdirectory` 属性且 React 类型定义不支持
- **THEN** 使用 `React.InputHTMLAttributes<HTMLInputElement>` 扩展接口，而非 `{...(attrs as any)}`

### Requirement: TypeScript 严格模式兼容
代码 MUST 通过 `tsc --noEmit` 检查，无类型错误。项目 SHALL 逐步启用 `strict: true`（若当前未启用）。

#### Scenario: 构建命令无类型错误
- **WHEN** 运行 `npm run build`（含 `tsc -b`）
- **THEN** TypeScript 编译零错误，构建成功生成产物
