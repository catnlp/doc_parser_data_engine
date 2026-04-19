## Context

当前 OCR 通过 `callOcrApi()` 调用本地 `http://localhost:8002/api/parse`，POST 请求体包含 `image_base64` 和 `layout_bboxes`。返回格式为 `{elements: Array<{category_type, text}>}`。

Windows 节点 192.168.3.10:8899 运行了 RapidOCR 服务，端点 `/ocr/base64` 接受 `{"image": "base64字符串"}`，返回 `{text, details: [{text, confidence, box}]}`。

技术栈：
- 前端：React + TypeScript（浏览器环境）
- OCR 远程服务：FastAPI + RapidOCR（Windows 节点，端口 8899）
- 网络：浏览器可直接访问 192.168.3.10:8899（同一局域网）

## Goals / Non-Goals

**Goals:**
- `callOcrApi` 改为直接调用 `http://192.168.3.10:8899/ocr/base64`
- 将远程 OCR 返回的 `details[].text` 映射到 `layoutElements` 的 `category_type` 上
- 通过环境变量可切换回旧 OCR 服务（兼容性）

**Non-Goals:**
- 不修改 Layout API 调用方式（仍走 localhost:8002/api/layout）
- 不修改后端 api_ocr.py
- 不在 OCR 调用链路中增加代理层

## Decisions

### 1. 调用方式：前端直调 vs 后端代理
**决策**: 前端通过环境变量配置 OCR 服务地址，直接调用 `192.168.3.10:8899/ocr/base64`。
**理由**: 浏览器与 Windows 节点在同一局域网，无需代理；减少后端耦合。

### 2. OCR 结果映射：保持 category_type 不变
**决策**: 新 OCR 服务不返回 category_type，因此保留 Layout API 返回的 `category_type`，仅从 OCR 结果中提取 `text`。
**理由**: Layout API 和 OCR 服务职责分离，Layout 负责分类，OCR 负责文字识别，category_type 由 Layout 决定是合理的架构。

### 3. 环境变量切换
**决策**: 通过 `VITE_USE_REMOTE_OCR=true/false` 环境变量控制调用哪个 OCR 服务，默认使用远程服务。
**理由**: 开发环境可能需要本地回退，提供切换能力。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| Windows 节点离线导致 OCR 失败 | 保留本地 OCR fallback；设置合理的超时（60s） |
| 跨域问题（CORS） | 确保 Windows 节点的 FastAPI 服务已配置 CORS |
| base64 图片过大导致传输慢 | 当前缩放比例 2.0x 已控制图片大小；可增加质量参数 |

## Migration Plan

无需部署步骤。修改前端代码后刷新页面即生效。如出现问题，设置 `VITE_USE_REMOTE_OCR=false` 回退到旧 OCR 服务。
