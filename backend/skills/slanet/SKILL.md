---
name: slanet
description: SLANet 表格结构识别服务，运行在 Mac 本机 (localhost:8768)，将表格图片转换为 HTML 结构。基于 PaddlePaddle SLANet_plus 模型。
read_when:
  - 用户需要识别表格图片的结构
  - 用户上传表格截图要求转为 HTML
  - 用户提到"表格识别"、"表格OCR"、"表格转HTML"
  - 需要从文档中提取表格结构
---

# SLANet — 表格结构识别服务

SLANet_plus 表格图片转 HTML 服务，运行在 Mac 本机 (localhost:8768)。

**模型**: PaddlePaddle/SLANet_plus_safetensors
**框架**: FastAPI + HuggingFace Transformers
**设备**: CPU

## 功能

识别表格图片中的行列结构，输出 HTML `<table>` 标签，包含：
- 行列结构 (`<tr>` / `<td>`)
- 单元格合并 (`colspan` / `rowspan`)
- 置信度评分

## API 接口

### 1. GET /health

```bash
curl http://localhost:8768/health
```

### 2. POST /recognize

识别表格结构，返回 HTML

```bash
curl -X POST http://localhost:8768/recognize -F "file=@table.png"
```

返回:
```json
{
  "filename": "table.png",
  "image_size": [551, 132],
  "html": "<html><body><table><tr><td colspan=\"4\"></td></tr>...</table></body></html>",
  "score": 0.9999
}
```

### 3. POST /recognize/batch

批量识别

```bash
curl -X POST http://localhost:8768/recognize/batch \
  -F "files=@table1.jpg" \
  -F "files=@table2.jpg"
```

## 使用流程

### 场景 1：识别表格结构

```bash
curl -s -X POST http://localhost:8768/recognize -F "file=@table_screenshot.png" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Score: {d[\"score\"]}')
print(d['html'])
"
```

### 场景 2：渲染 HTML 表格查看结果

```python
import requests

with open('table.png', 'rb') as f:
    result = requests.post('http://localhost:8768/recognize', files={'file': f}).json()

html = result['html']

# 保存为 HTML 文件
with open('table_output.html', 'w') as f:
    f.write(f'''<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
table {{ border-collapse: collapse; margin: 20px; }}
td {{ border: 1px solid #333; padding: 8px 16px; min-width: 60px; text-align: center; }}
</style></head>
{html[6:-7]}
</html>''')
print(f'置信度: {result[\"score\"]:.2%}')
```

### 场景 3：完整文档处理流水线

```
doclayout(8765) → 找 table 区域 → 裁剪 → slanet(8768) → HTML
```

```python
import requests
from PIL import Image
from io import BytesIO

# 1. 版面分析
with open('document.jpg', 'rb') as f:
    layout = requests.post('http://localhost:8765/analyze', files={'file': f}).json()

# 2. 提取 table 区域
image = Image.open('document.jpg')
tables = []
for r in layout['regions']:
    if r['label'] == 'table':
        box = r['box']
        cropped = image.crop((box['xmin'], box['ymin'], box['xmax'], box['ymax']))
        buf = BytesIO()
        cropped.save(buf, format='JPEG')
        result = requests.post('http://localhost:8768/recognize', files={'file': buf}).json()
        tables.append({'box': box, 'html': result.get('html', ''), 'score': result.get('score', 0)})

print(f'找到 {len(tables)} 个表格')
```

## 服务管理

### 检查状态

```bash
curl -s http://localhost:8768/health | python3 -m json.tool
```

### 启动

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.openclaw.slanet.plist
```

### 停止

```bash
launchctl bootout gui/$(id -u)/ai.openclaw.slanet
```

### 重启

```bash
launchctl bootout gui/$(id -u)/ai.openclaw.slanet 2>/dev/null
sleep 1
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.openclaw.slanet.plist
```

## 服务配置

- **项目路径**: `~/.openclaw/workspace/services/slanet/`
- **虚拟环境**: `~/.openclaw/workspace/services/doclayout/venv/` (复用)
- **launchd plist**: `~/Library/LaunchAgents/ai.openclaw.slanet.plist`
- **端口**: 8768
- **开机自启**: ✅

## 性能

| 图片尺寸 | 耗时 |
|----------|------|
| 551×132 | ~1-2s |
| 800×400 | ~2-3s |

CPU 推理，轻量级 PP-LCNet 骨干网络，速度很快。

## 与 FormulaNet 的区别

| 服务 | 端口 | 模型 | 识别目标 |
|------|------|------|----------|
| formulanet | 8767 | PP-FormulaNet_plus-L | 数学公式 → LaTeX |
| **slanet** | **8768** | **SLANet_plus** | **表格 → HTML** |

## 技术栈

- **模型**: PaddlePaddle SLANet_plus (safetensors)
- **架构**: PP-LCNet + CSP-PAN + SLA Head
- **框架**: PyTorch 2.12 + Transformers 5.9 + FastAPI
- **设备**: CPU

## Mac 本地服务全家福

| # | 服务 | 端口 | 功能 |
|---|------|------|------|
| 1 | doclayout | 8765 | 版面分析 |
| 2 | ocr-det | 8766 | 文字检测 |
| 3 | formulanet | 8767 | 公式识别 → LaTeX |
| 4 | **slanet** | **8768** | **表格识别 → HTML** |
