## Why

当前 OCR 调用的是本地 FastAPI 服务（localhost:8002/api/parse），该服务在同一台机器上运行，需要安装 PaddleOCR/PyTorch 等重型依赖。Windows 节点 192.168.3.10:8899 已部署了基于 RapidOCR（PaddleOCR ONNX）的独立 OCR 服务，性能更好、维护成本更低。应将 OCR 调用切换至 Windows 远程服务。

## What Changes

- 新增独立的 `callRemoteOcrApi` 函数，直接调用 Windows 节点 `http://192.168.3.10:8899/ocr/base64`
- 新 OCR 接口返回格式不同：`{text, details: [{text, confidence, box}]}`，需适配为现有的 `{elements: Array<{category_type, text}>}` 格式
- 旧的 `callOcrApi` 保留为可选 fallback（通过环境变量切换）
- API 配置增加 `remoteOcr` 条目

## Capabilities

### New Capabilities
- `remote-ocr-service`: 通过 HTTP 直接调用 Windows 节点上的 RapidOCR 服务

### Modified Capabilities
- `batch-parsing`: 解析流程中的 OCR 步骤改为调用远程服务

## Impact

- `frontend/src/api/config.ts` — 增加 remoteOcr 配置项
- `frontend/src/utils/parsePdf.ts` — OCR 调用逻辑从本地 FastAPI 改为远程服务
- 后端 `api_ocr.py` — 无需修改（仅前端直调 OCR 服务）
- 不再依赖本地 FastAPI 的 `/api/parse` 端点
