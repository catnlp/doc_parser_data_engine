---
name: doclayout
description: PP-DocLayoutV3 版面分析服务，运行在 Mac 本机 (localhost:8765)，基于 PaddlePaddle PP-DocLayoutV3 模型。可检测文档图片中的版面区域（标题、正文、表格、图片、页眉页脚等），并输出阅读顺序。
read_when:
  - 用户需要分析文档图片的版面结构
  - 用户上传文档截图/扫描件要求识别区域
  - 用户提到"版面分析"、"布局分析"、"文档结构识别"
  - 需要提取 PDF 页面中的文字区域位置
  - 用户需要知道图片中哪些区域是标题/正文/表格
---

# DocLayout — 版面分析服务

PP-DocLayoutV3 文档版面分析服务，运行在 Mac 本机 (localhost:8765)。

**模型**: PaddlePaddle/PP-DocLayoutV3_safetensors
**框架**: FastAPI + HuggingFace Transformers
**设备**: CPU (Apple Silicon MPS 因 float64 兼容问题暂不可用)

## 功能

检测文档图片中的版面元素，输出每个区域的：
- **label**: 区域类型
- **score**: 置信度 (0-1)
- **box**: 边界框坐标
- **order**: 阅读顺序

## 可检测的版面元素

| 标签 | 说明 |
|------|------|
| `text` | 正文段落 |
| `paragraph_title` | 段落标题 |
| `title` | 文档主标题 |
| `figure` | 图片/图表 |
| `table` | 表格 |
| `header` | 页眉 |
| `footer` | 页脚 |
| `footnote` | 脚注 |
| `number` | 页码 |
| `list` | 列表 |
| `formula` | 公式 |

## API 接口

### 1. GET /health

健康检查

```bash
curl http://localhost:8765/health
```

返回:
```json
{
  "status": "ok",
  "model": "PaddlePaddle/PP-DocLayoutV3_safetensors",
  "device": "cpu",
  "loaded": true
}
```

### 2. POST /analyze

分析单张文档图片的版面结构

```bash
curl -X POST http://localhost:8765/analyze -F "file=@document.jpg"
```

返回:
```json
{
  "filename": "document.jpg",
  "image_size": [1654, 2339],
  "region_count": 13,
  "label_distribution": {
    "text": 6,
    "paragraph_title": 1,
    "footnote": 4
  },
  "regions": [
    {
      "order": 1,
      "label": "text",
      "score": 0.96,
      "box": {"xmin": 337, "ymin": 183, "xmax": 895, "ymax": 653}
    }
  ]
}
```

### 3. POST /analyze/batch

批量分析多张图片

```bash
curl -X POST http://localhost:8765/analyze/batch \
  -F "files=@page1.jpg" \
  -F "files=@page2.jpg"
```

## 使用流程

### 场景 1：分析文档图片版面

```bash
# 直接对本地图片进行分析
curl -s -X POST http://localhost:8765/analyze -F "file=@/path/to/image.jpg" | python3 -m json.tool
```

### 场景 2：从 PDF 提取页面后分析

```bash
# 1. 先将 PDF 页面转换为图片
python3 -c "
from pdf2image import convert_from_path
images = convert_from_path('document.pdf', dpi=200)
images[0].save('/tmp/page_0.jpg', 'JPEG')
"

# 2. 分析版面
curl -s -X POST http://localhost:8765/analyze -F "file=@/tmp/page_0.jpg"
```

### 场景 3：分析后提取特定区域

```python
import requests, json
from PIL import Image

# 1. 获取版面分析结果
with open('page.jpg', 'rb') as f:
    resp = requests.post('http://localhost:8765/analyze', files={'file': f})
layout = resp.json()

# 2. 提取所有 text 区域的坐标
image = Image.open('page.jpg')
for region in layout['regions']:
    if region['label'] == 'text':
        box = region['box']
        cropped = image.crop((box['xmin'], box['ymin'], box['xmax'], box['ymax']))
        cropped.save(f"text_region_{region['order']}.jpg")
```

## 服务管理

### 检查服务状态

```bash
curl -s http://localhost:8765/health | python3 -m json.tool
```

### 启动服务

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.openclaw.doclayout.plist
```

### 停止服务

```bash
launchctl bootout gui/$(id -u)/ai.openclaw.doclayout
```

### 查看日志

```bash
tail -f ~/.openclaw/workspace/services/doclayout/logs/stdout.log
tail -f ~/.openclaw/workspace/services/doclayout/logs/stderr.log
```

### 重启服务

```bash
launchctl bootout gui/$(id -u)/ai.openclaw.doclayout 2>/dev/null
sleep 1
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.openclaw.doclayout.plist
```

## 服务配置

- **项目路径**: `~/.openclaw/workspace/services/doclayout/`
- **虚拟环境**: `~/.openclaw/workspace/services/doclayout/venv/`
- **启动脚本**: `server.py`
- **launchd plist**: `~/Library/LaunchAgents/ai.openclaw.doclayout.plist`
- **端口**: 8765
- **开机自启**: 已配置 (RunAtLoad + KeepAlive)

## 性能

| 图片尺寸 | 耗时 |
|----------|------|
| 1654×2339 (A4) | ~3-5s |
| 800×600 | ~1-2s |

CPU 推理，首次启动需加载模型缓存（~3s），后续调用已预热。

## 技术栈

- **模型**: PaddlePaddle PP-DocLayoutV3 (safetensors)
- **架构**: RT-DETR + Instance Segmentation + Global Pointer
- **框架**: PyTorch 2.12 + Transformers 5.9 + FastAPI
- **图像处理**: PIL (Pillow) + OpenCV
- **设备**: CPU (Apple M-series)

## 注意事项

- MPS (Apple GPU) 暂不可用，PP-DocLayoutV3 的 image processor 内部使用 float64 导致 MPS 不兼容
- 模型缓存路径: `~/.cache/huggingface/hub/models--PaddlePaddle--PP-DocLayoutV3_safetensors/`
- 服务运行在 8765 端口，仅监听本机 localhost
- 支持 JPEG/PNG/BMP/WebP 等常见图片格式
