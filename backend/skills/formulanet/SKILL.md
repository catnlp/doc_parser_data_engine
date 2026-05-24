---
name: formulanet
description: PP-FormulaNet 公式识别服务，运行在 Mac 本机 (localhost:8767)，将数学公式图片转换为 LaTeX 代码。基于 PaddlePaddle PP-FormulaNet_plus-L 模型。
read_when:
  - 用户需要识别数学公式图片
  - 用户上传公式截图要求转为 LaTeX
  - 用户提到"公式识别"、"公式OCR"、"数学公式转LaTeX"
  - 需要从文档中提取数学公式
---

# FormulaNet — 公式识别服务

PP-FormulaNet_plus-L 公式图片转 LaTeX 服务，运行在 Mac 本机 (localhost:8767)。

**模型**: PaddlePaddle/PP-FormulaNet_plus-L_safetensors
**框架**: FastAPI + HuggingFace Transformers
**设备**: CPU

## 功能

将数学公式图片转换为 LaTeX 代码，支持：
- 各类数学符号、希腊字母
- 上下标、分式、根式
- 积分、求和、极限
- 矩阵、括号
- 多行公式

## API 接口

### 1. GET /health

```bash
curl http://localhost:8767/health
```

### 2. POST /recognize

识别单张公式图片，返回 LaTeX 代码

```bash
curl -X POST http://localhost:8767/recognize -F "file=@formula.png"
```

返回:
```json
{
  "filename": "formula.png",
  "image_size": [448, 64],
  "latex": "\\zeta_{0}(\\nu) = -\\frac{\\nu\\varrho^{-2\\nu}}{\\pi}\\int_{\\mu}^{\\infty} d\\omega ..."
}
```

### 3. POST /recognize/batch

批量识别

```bash
curl -X POST http://localhost:8767/recognize/batch \
  -F "files=@formula1.png" \
  -F "files=@formula2.png"
```

## 使用流程

### 场景 1：识别数学公式

```bash
# 截图公式 → 得到 LaTeX
curl -s -X POST http://localhost:8767/recognize -F "file=@formula_screenshot.png" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d['latex'])
"
```

### 场景 2：结合文字检测 + 公式识别

文档图片 → ocr-det(8766) 检测文字行 → 对疑似公式区域调用 formulanet(8767)

```python
import requests
from PIL import Image
from io import BytesIO

# 1. 检测文字区域
with open('document.jpg', 'rb') as f:
    det_result = requests.post('http://localhost:8766/detect', files={'file': f}).json()

# 2. 对每个区域，尝试公式识别
image = Image.open('document.jpg')
formulas = []
for r in det_result['regions']:
    box = r['box']
    cropped = image.crop((box['xmin'], box['ymin'], box['xmax'], box['ymax']))
    buf = BytesIO()
    cropped.save(buf, format='PNG')

    # 尝试公式识别
    resp = requests.post('http://localhost:8767/recognize', files={'file': buf})
    if resp.status_code == 200:
        latex = resp.json().get('latex', '')
        if latex and ('\\frac' in latex or '\\int' in latex or '\\sum' in latex):
            formulas.append({'box': box, 'latex': latex})

print(f"找到 {len(formulas)} 个公式")
```

### 场景 3：渲染 LaTeX 为图片（验证）

```python
import matplotlib.pyplot as plt

latex = r'\zeta_{0}(\nu) = -\frac{\nu\varrho^{-2\nu}}{\pi}\int_{\mu}^{\infty} d\omega'

fig, ax = plt.subplots(figsize=(10, 2))
ax.text(0.5, 0.5, f'${latex}$', fontsize=16, ha='center', va='center')
ax.axis('off')
plt.savefig('rendered_formula.png', dpi=150, bbox_inches='tight')
```

## 服务管理

### 检查状态

```bash
curl -s http://localhost:8767/health | python3 -m json.tool
```

### 启动

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.openclaw.formulanet.plist
```

### 停止

```bash
launchctl bootout gui/$(id -u)/ai.openclaw.formulanet
```

### 重启

```bash
launchctl bootout gui/$(id -u)/ai.openclaw.formulanet 2>/dev/null
sleep 1
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.openclaw.formulanet.plist
```

## 服务配置

- **项目路径**: `~/.openclaw/workspace/services/formulanet/`
- **虚拟环境**: `~/.openclaw/workspace/services/doclayout/venv/` (复用)
- **启动脚本**: `server.py`
- **launchd plist**: `~/Library/LaunchAgents/ai.openclaw.formulanet.plist`
- **端口**: 8767
- **开机自启**: ✅

## 性能

| 图片尺寸 | 耗时 |
|----------|------|
| 448×64 (单行公式) | ~5-10s |
| 800×200 (多行公式) | ~15-30s |

> 使用 generate() 生成方式，首推理较慢，后续会利用缓存加速。

## 模型变体

| 模型 | 大小 | 说明 |
|------|------|------|
| PP-FormulaNet-L | 较小 | 轻量版，速度更快 |
| PP-FormulaNet_plus-L | 较大 | 增强版，精度更高 ✅当前使用 |

## 技术栈

- **模型**: PaddlePaddle PP-FormulaNet_plus-L (safetensors)
- **架构**: Encoder-Decoder (Vision + Text)
- **框架**: PyTorch 2.12 + Transformers 5.9 + FastAPI
- **设备**: CPU

## 当前 Mac 服务全家福

| 服务 | 端口 | 功能 |
|------|------|------|
| doclayout | 8765 | 版面分析（段落/标题/表格等） |
| ocr-det | 8766 | 文字检测（行位置+旋转框） |
| **formulanet** | **8767** | **公式识别（图片→LaTeX）** |
