# 📷 Windows OCR 服务 API v5 使用文档

> **服务地址**: `http://192.168.3.10:8899`（Windows 节点）
> **版本**: 5.0.0
> **更新日期**: 2026-05-01
> **后端**: PaddleX + RapidOCR

---

## 🔗 接口清单

| 方法 | 路径 | 功能 | 返回 |
|------|------|------|------|
| `GET` | `/health` | 健康检查 | 服务状态 |
| `POST` | `/ocr/file` | 文字识别 | 文字 + 置信度 + 坐标 |
| `POST` | `/formula/file` | 公式识别 | **LaTeX** + 坐标 |
| `POST` | `/table/file` | 表格识别 | **HTML** + 文字 |

---

## 1️⃣ 健康检查

```bash
curl http://192.168.3.10:8899/health
```

**响应**：
```json
{
  "status": "ok",
  "ocr_loaded": true,
  "formula_loaded": true,
  "table_loaded": true,
  "version": "5.0.0",
  "mode": "simple-http"
}
```

---

## 2️⃣ 文字识别 `/ocr/file`

### 请求

`multipart/form-data`，上传一张图片文件。

```bash
curl -X POST http://192.168.3.10:8899/ocr/file \
  -F "file=@/path/to/image.png"
```

**支持的图片格式**: PNG, JPG, JPEG, BMP, WebP 等 PIL 支持的格式

**支持方式**:
- 直接上传文件（multipart form-data）
- 也可在代码中用 `data` + `files` 发送

### 响应

```json
{
  "success": true,
  "text": "第一段文字\n第二段文字\n第三段文字",
  "details": [
    {
      "text": "第一段文字",
      "confidence": 0.9876,
      "box": [[10, 20], [200, 20], [200, 50], [10, 50]]
    }
  ],
  "time_ms": 123.4
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | boolean | 是否成功 |
| `text` | string | 全部文字，`\n` 分隔 |
| `details` | array | 每行详情 |
| `details[].text` | string | 单行文字 |
| `details[].confidence` | number | 置信度 (0~1) |
| `details[].box` | array | 文字区域四边形坐标 |
| `time_ms` | number | 耗时（毫秒） |

---

## 3️⃣ 公式识别 `/formula/file` ⭐

### 请求

```bash
curl -X POST http://192.168.3.10:8899/formula/file \
  -F "file=@/path/to/formula.png"
```

### 响应

```json
{
  "success": true,
  "type": "formula",
  "formulas": [
    {
      "latex": "E = mc^{2}",
      "bbox": [10.0, 20.0, 150.0, 20.0, 150.0, 60.0, 10.0, 60.0],
      "region_id": 0
    },
    {
      "latex": "\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}",
      "bbox": [10.0, 80.0, 300.0, 80.0, 300.0, 120.0, 10.0, 120.0],
      "region_id": 1
    }
  ],
  "latex": "E = mc^{2}\n\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}",
  "formula_count": 2,
  "time_ms": 456.7
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | boolean | 是否成功 |
| `formulas` | array | 每个公式详情 |
| `formulas[].latex` | string | **LaTeX 公式** |
| `formulas[].bbox` | array | 公式区域坐标 |
| `formulas[].region_id` | number | 区域 ID |
| `latex` | string | 全部公式，`\n` 分隔 |
| `formula_count` | number | 公式数量 |

**典型用途**:
- 数学题拍照 → LaTeX 公式
- 论文截图 → 可编辑公式
- 板书照片 → 笔记数字化

---

## 4️⃣ 表格识别 `/table/file`

### 请求

```bash
curl -X POST http://192.168.3.10:8899/table/file \
  -F "file=@/path/to/table.png"
```

### 响应

```json
{
  "success": true,
  "type": "table",
  "tables": [
    {
      "html": "<table><thead><tr><th>姓名</th><th>年龄</th></tr></thead><tbody><tr><td>张三</td><td>25</td></tr></tbody></table>",
      "texts": ["姓名", "年龄", "张三", "25"],
      "region_id": 0
    }
  ],
  "table_count": 1,
  "time_ms": 789.0
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `tables` | array | 每个表格详情 |
| `tables[].html` | string | **HTML 表格代码** |
| `tables[].texts` | array | 表格内文字列表 |
| `tables[].region_id` | number | 区域 ID |
| `table_count` | number | 表格数量 |

**典型用途**:
- 报表截图 → 可编辑 HTML
- 数据表格照片 → 结构化数据

---

## 💻 Python 调用示例

```python
import requests

BASE_URL = "http://192.168.3.10:8899"

# 文字识别
with open("document.png", "rb") as f:
    resp = requests.post(f"{BASE_URL}/ocr/file", files={"file": f})
    print(resp.json()["text"])

# 公式识别 → LaTeX
with open("math.png", "rb") as f:
    resp = requests.post(f"{BASE_URL}/formula/file", files={"file": f})
    result = resp.json()
    for formula in result["formulas"]:
        print(f"LaTeX: {formula['latex']}")

# 表格识别 → HTML
with open("table.png", "rb") as f:
    resp = requests.post(f"{BASE_URL}/table/file", files={"file": f})
    result = resp.json()
    for table in result["tables"]:
        print(f"HTML: {table['html']}")
```

---

## 🚧 服务管理（Windows 端）

### 启动服务
```cmd
cd C:\Users\cat\ocr-service
C:\Users\cat\AppData\Local\Programs\Python\Python312\python.exe ocr_server_v5.py
```

### 启动脚本
```cmd
# 当前最新版 v5
start /min "" C:\Users\cat\AppData\Local\Programs\Python\Python312\python.exe C:\Users\cat\ocr-service\ocr_server_v5.py
```

### 检查服务状态
```cmd
curl http://localhost:8899/health
tasklist | findstr python
```

### 日志
```
C:\Users\cat\ocr-service\ocr_v5.log
```

---

## ⚠️ 注意事项

1. **首次启动慢**: PaddleX 模型加载约需 30-60 秒，等 `formula_loaded: true` 再调用
2. **GPU 要求**: 服务使用 `device='gpu:0'`，Windows 需有 NVIDIA GPU + CUDA 驱动
3. **端口**: 默认 `8899`，确保未被占用
4. **CORS**: 已开启 `Access-Control-Allow-Origin: *`，支持浏览器直接调用
5. **网络**: Mac 访问地址为 `http://192.168.3.10:8899`

---

## 📊 版本历史

| 版本 | 日期 | 更新 |
|------|------|------|
| v5 | 2026-04-26 | 公式识别(LaTeX) + 表格识别(HTML) + 简化 HTTP 服务器 |
| v4 | 2026-04-26 | 公式识别优化 |
| v3 | 2026-04-26 | 公式识别基础版 |
| v2 | 2026-04-26 | 公式→LaTeX 初版 |
| v1 | 2026-04-19 | 基础文字识别 |
