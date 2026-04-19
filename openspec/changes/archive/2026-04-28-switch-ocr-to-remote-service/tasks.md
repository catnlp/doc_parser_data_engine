## 1. 修改 OCR 调用逻辑

- [x] 1.1 在 api/config.ts 中增加 remoteOcr 配置项，默认指向 192.168.3.10:8899
- [x] 1.2 新增 callRemoteOcrApi 函数，调用 /ocr/base64 接口
- [x] 1.3 修改 parsePdf.ts 中的 callOcrApi，改为调用远程服务
- [x] 1.4 适配远程 OCR 返回格式：details 数组转为 elements 数组
- [x] 1.5 保留本地 OCR fallback 兼容（通过环境变量切换）
