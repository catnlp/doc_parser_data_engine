## Context

当前 PDF 解析流程中，Layout Detection 识别出 equation 类型元素后，统一送入 PaddleOCR（PP-OCRv5）进行文字识别。PaddleOCR 返回的是纯文本，丢失了公式的 LaTeX 结构。

Windows OCR 服务 v5（`http://192.168.3.10:8899`）新增了 `/formula/file` 端点，基于专门的公式识别模型（PaddleX Formula Recognition），可返回标准 LaTeX 表达式。前端已集成 KaTeX 渲染（`react-markdown` + `remark-math` + `rehype-katex`），`PdfElement.latex` 字段已存在且 RightPanel 已支持公式渲染。

## Goals / Non-Goals

**Goals:**
- 解析时对 equation 类型元素调用远程公式 API，获取 LaTeX 表达式
- LaTeX 写入 `PdfElement.latex`，前端自动渲染为可视公式
- 公式 API 不可用时降级为本地 PaddleOCR（保持兼容）
- 支持通过环境变量开关公式 API

**Non-Goals:**
- 不修改 Layout Detection 逻辑（equation 元素识别不变）
- 不修改 `api_ocr.py` 后端（公式调用走前端直连 Windows 服务）
- 不修改表格识别流程（table 类型继续用现有 OCR）
- 不新增 npm 依赖

## Decisions

### 1. 公式调用走前端直连，不经后端转发

**决策**: 前端 `parsePdf.ts` 直接向 Windows OCR 服务发起 `/formula/file` 请求，不在 `api_ocr.py` 中增加代理端点。

**理由**:
- Windows 服务已开 CORS（`Access-Control-Allow-Origin: *`）
- 公式图片仅为 equation 元素的裁剪区（通常几十 KB），无代理性能必要
- 减少后端改动面，保持 `api_ocr.py` 职责单一（仅本地 PaddleOCR）

**替代方案**: 后端代理转发 → 增加一跳延迟，且后端需处理 multipart 流转发，复杂度高。

### 2. multipart/form-data 上传格式

**决策**: 公式 API 要求 `multipart/form-data`，当前 remote OCR 使用 `application/json` + base64。需新增 `base64ToBlob()` 工具函数将 equation 裁剪图转为 File/Blob 上传。

**理由**: Windows OCR v5 的 `/formula/file` 只接受 `multipart/form-data`，不接受 base64 JSON。

**替代方案**: 等待 Windows 服务支持 base64 接口 → 不可控，且 v5 已稳定。

### 3. 元素级别路由：equation → formula API，其他 → OCR API

**决策**: 在 `callOcrApi()` 函数中，遍历 `layoutBboxes` 时按 `category_type` 分流：
- `category_type === 'equation'` → 调用 `callRemoteFormulaApi()`
- 其他类型 → 保持现有逻辑（先 remote OCR 后 local OCR）

**理由**: 最小侵入，不改变非 equation 元素的行为。

### 4. 降级策略

**决策**: 公式 API 调用失败时（网络错误、超时、服务不可用），捕获异常并回退到本地 PaddleOCR 结果（纯文本），同时在控制台输出 warning。

**公式 API 启用条件**: 环境变量 `VITE_USE_FORMULA_API` 不为 `'false'`（默认启用）。

### 5. 图片格式转换

**决策**: `base64ToBlob()` 直接将 base64 data URL 转为 Blob，不经过 canvas 重编码。

```typescript
function base64ToBlob(base64: string, mimeType = 'image/png'): Blob {
  const byteString = atob(base64.split(',')[1] || base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new Blob([ab], { type: mimeType });
}
```

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| Windows 服务不可用时公式退化为纯文本 | 降级为本地 OCR，输出 console.warning，用户无感 |
| 公式 API 返回格式与预期不一致 | 对 `result.formulas` 做防御性检查（Array.isArray），空数组时降级 |
| 大图上传超时 | 公式裁剪区通常很小（几十 KB），超时沿用 OCR 的 60s 配置 |
| 前端直连跨域问题 | Windows 服务已配置 CORS `*`，已验证可用 |

## Migration Plan

1. 更新 `.env.example`，新增 `VITE_USE_FORMULA_API`（默认 `true`）和 `VITE_FORMULA_API_URL`
2. 刷新页面后自动生效，无需数据迁移
3. 如需回滚：设置 `VITE_USE_FORMULA_API=false` 恢复纯 PaddleOCR 行为

## Open Questions

- `/formula/file` 的识别准确率（尤其是中英文混合公式）？需实际测试验证
