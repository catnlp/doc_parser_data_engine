---
name: ocr-det
description: PP-OCRv5 文字检测服务，运行在 Mac 本机 (localhost:8766)，基于 PaddlePaddle PP-OCRv5_server_det 模型。检测图片中的文字区域位置，支持多语言、多方向、弯曲文字。
read_when:
  - 用户需要检测图片中的文字区域位置
  - 用户上传图片要求找出文字在哪里
  - 用户提到"文字检测"、"OCR检测"、"找文字位置"
  - 需要提取文档中文字区域的边界框
  - 作为 OCR 流水线的第一步（先检测再识别）
---

# OCR Detection — 文字检测服务

PP-OCRv5_server_det 文字检测服务，运行在 Mac 本机 (localhost:8766)。

**模型**: PaddlePaddle/PP-OCRV5_server_det_safetensors
**框架**: FastAPI + HuggingFace Transformers
**设备**: CPU

## 功能

检测图片中的文字区域位置，支持：
- **多语言**: 简体中文、繁体中文、英文、日文
- **多方向**: 水平、垂直、旋转文字
- **特殊场景**: 弯曲文字、手写文字、复杂背景

输出每个文字区域的：
- **box**: 轴对齐边界框 {xmin, ymin, xmax, ymax}
- **polygon**: 旋转边界框的多边形顶点坐标
- **score**: 置信度
- **order**: 检测顺序

## API 接口

### 1. GET /health

```bash
curl http://localhost:8766/health
```

### 2. POST /detect

检测单张图片中的文字区域

```bash
curl -X POST http://localhost:8766/detect -F "file=@image.png"
```

返回:
```json
{
  "filename": "image.png",
  "image_size": [720, 1150],
  "text_region_count": 4,
  "regions": [
    {
      "order": 1,
      "label": "text",
      "score": 0.90,
      "box": {"xmin": 76, "ymin": 77, "xmax": 575, "ymax": 587},
      "polygon": [[76, 399], [550, 538], [400, 77], [575, 587]]
    }
  ]
}
```

### 3. POST /detect/batch

批量检测多张图片

```bash
curl -X POST http://localhost:8766/detect/batch \
  -F "files=@page1.jpg" \
  -F "files=@page2.jpg"
```

## 使用流程

### 场景 1：检测图片中的文字位置

```bash
curl -s -X POST http://localhost:8766/detect -F "file=@screenshot.png" | python3 -m json.tool
```

### 场景 2：标注文字区域

```python
import requests, json
from PIL import Image, ImageDraw

with open('screenshot.png', 'rb') as f:
    resp = requests.post('http://localhost:8766/detect', files={'file': f})
result = resp.json()

# 在原图上绘制检测框
image = Image.open('screenshot.png')
draw = ImageDraw.Draw(image)
for r in result['regions']:
    box = r['box']
    draw.rectangle([box['xmin'], box['ymin'], box['xmax'], box['ymax']], outline='red', width=2)
    # 如果有旋转多边形，也画出来
    if 'polygon' in r:
        draw.polygon([tuple(p) for p in r['polygon']], outline='blue', width=1)
image.save('annotated.png')
```

### 场景 3：裁剪文字区域用于后续识别

```python
import requests
from PIL import Image
from io import BytesIO

with open('document.jpg', 'rb') as f:
    resp = requests.post('http://localhost:8766/detect', files={'file': f})
result = resp.json()

image = Image.open('document.jpg')
for i, r in enumerate(result['regions']):
    box = r['box']
    cropped = image.crop((box['xmin'], box['ymin'], box['xmax'], box['ymax']))
    cropped.save(f'text_region_{i+1}.jpg')
```

### 场景 4：结合版面分析做完整文档处理

DocLayout (8765) 先分析版面结构 → 找出 text 区域 → OCR Detection (8766) 检测文字行位置

```python
import requests

# 1. 版面分析
with open('document.jpg', 'rb') as f:
    layout = requests.post('http://localhost:8765/analyze', files={'file': f}).json()

# 2. 对每个 text 区域做文字检测
for region in layout['regions']:
    if region['label'] in ('text', 'paragraph_title'):
        box = region['box']
        # 裁剪区域
        cropped = image.crop((box['xmin'], box['ymin'], box['xmax'], box['ymax']))
        buf = BytesIO()
        cropped.save(buf, format='JPEG')
        # 检测文字行
        lines = requests.post('http://localhost:8766/detect', files={'file': buf}).json()
        print(f"区域 {region['order']}: {lines['text_region_count']} 行文字")
```

## 服务管理

### 检查状态

```bash
curl -s http://localhost:8766/health | python3 -m json.tool
```

### 启动

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.openclaw.ocr-det.plist
```

### 停止

```bash
launchctl bootout gui/$(id -u)/ai.openclaw.ocr-det
```

### 重启

```bash
launchctl bootout gui/$(id -u)/ai.openclaw.ocr-det 2>/dev/null
sleep 1
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.openclaw.ocr-det.plist
```

### 日志

```bash
tail -f ~/.openclaw/workspace/services/ocr-det/logs/stdout.log
```

## 服务配置

- **项目路径**: `~/.openclaw/workspace/services/ocr-det/`
- **虚拟环境**: `~/.openclaw/workspace/services/doclayout/venv/` (复用)
- **启动脚本**: `server.py`
- **launchd plist**: `~/Library/LaunchAgents/ai.openclaw.ocr-det.plist`
- **端口**: 8766
- **开机自启**: ✅

## 性能

| 图片尺寸 | 耗时 |
|----------|------|
| 720×1150 | ~2-3s |
| 1654×2339 (A4) | ~4-6s |

## 技术栈

- **模型**: PaddlePaddle PP-OCRv5_server_det (safetensors)
- **架构**: RT-DETR based text detection
- **框架**: PyTorch 2.12 + Transformers 5.9 + FastAPI
- **图像处理**: PIL + OpenCV
- **设备**: CPU

## 与其他服务的关系

| 服务 | 端口 | 功能 |
|------|------|------|
| doclayout (版面分析) | 8765 | 检测版面区域类型 |
| ocr-det (文字检测) | **8766** | 检测文字行位置 |
| ocr-service (Windows) | 8899 | 完整 OCR (检测+识别) |

文字检测 → 文字识别 两步走：先用本服务检测文字位置，再用其他识别服务做 OCR。

## 注意事项

- 这是一个**文字检测**模型，只输出文字区域位置，不识别文字内容
- 如需完整 OCR（识别文字内容），需配合文字识别模型使用
- 支持旋转/弯曲文字，输出包含旋转多边形坐标
- 模型缓存: `~/.cache/huggingface/hub/models--PaddlePaddle--PP-OCRv5_server_det_safetensors/`
