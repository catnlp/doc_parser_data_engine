## ADDED Requirements

### Requirement: 健康检查端点
后端 MUST 提供 `GET /api/health` 端点，返回 JSON 格式的服务状态信息，包括 OCR 和 Layout 模型的加载状态。

#### Scenario: 模型均已加载
- **WHEN** OCR 管道和 Layout 管道均已初始化完成且 `GET /api/health` 被调用
- **THEN** 返回 HTTP 200，响应体为 `{"status": "ok", "models": {"ocr": "loaded", "layout": "loaded"}}`

#### Scenario: 模型未初始化
- **WHEN** 服务刚启动、模型尚未完成首次懒加载且 `GET /api/health` 被调用
- **THEN** 返回 HTTP 503，响应体为 `{"status": "initializing", "models": {"ocr": "loading", "layout": "loading"}}`

#### Scenario: 模型加载失败
- **WHEN** 任一模型初始化抛出异常且 `GET /api/health` 被调用
- **THEN** 返回 HTTP 503，响应体包含失败的模型名称和错误信息摘要

### Requirement: 结构化请求日志
每个 API 请求 MUST 在完成后输出一行结构化 JSON 日志，包含 method、path、status_code、duration_ms 字段。

#### Scenario: Layout API 调用成功
- **WHEN** `POST /api/layout` 返回 200
- **THEN** 日志输出格式如 `{"method":"POST","path":"/api/layout","status":200,"duration_ms":2345,"elements_count":12}`

#### Scenario: API 调用异常
- **WHEN** `POST /api/parse` 返回 500
- **THEN** 日志输出格式如 `{"method":"POST","path":"/api/parse","status":500,"duration_ms":150,"error":"Invalid image data"}`

#### Scenario: 健康检查端点不记录详细日志
- **WHEN** `GET /api/health` 被调用
- **THEN** 该请求不输出结构化日志（避免日志噪音）

### Requirement: 全局异常处理中间件
后端 MUST 使用全局异常处理中间件捕获未预期的异常，替代当前散落在各端点的 `traceback.print_exc()`。

#### Scenario: 未预期异常被捕获
- **WHEN** OCR 管道处理过程中抛出非预期的 `RuntimeError`
- **THEN** 全局中间件捕获该异常，输出结构化错误日志，返回 HTTP 500 及错误消息，不暴露内部 traceback 给客户端
