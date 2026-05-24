"""
文档解析流水线 - 协调本地 ML 服务

流水线:
  doclayout:8765 (版面分析 V3) → 按类型路由:
    formula  → formulanet:8767 → LaTeX
    table    → slanet:8768     → HTML
    text/... → PP-OCRv5 本地    → 文字
"""

import base64
import time
from typing import Optional
from dataclasses import dataclass, field

import httpx
import cv2
import numpy as np

from paddleocr import PaddleOCR


# ── 服务配置 ──────────────────────────────────────────────

SERVICE_CONFIG = {
    "doclayout":  {"host": "localhost", "port": 8765, "path": "/analyze"},
    "formulanet": {"host": "localhost", "port": 8767, "path": "/recognize"},
    "slanet":     {"host": "localhost", "port": 8768, "path": "/recognize"},
}

SERVICE_TIMEOUT = 60


# ── 本地 OCR (PP-OCRv5) ────────────────────────────────────

_ocr_pipeline: Optional[PaddleOCR] = None


def _get_ocr() -> PaddleOCR:
    global _ocr_pipeline
    if _ocr_pipeline is None:
        import os
        os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"
        _ocr_pipeline = PaddleOCR(ocr_version="PP-OCRv5", lang="ch")
    return _ocr_pipeline


# ── 健康检查 ───────────────────────────────────────────────

@dataclass
class ServiceStatus:
    name: str
    available: bool
    latency_ms: float = 0

@dataclass
class HealthReport:
    services: list[ServiceStatus] = field(default_factory=list)

    @property
    def all_available(self) -> bool:
        return all(s.available for s in self.services)


async def check_service_health(name: str) -> ServiceStatus:
    config = SERVICE_CONFIG.get(name)
    if not config:
        return ServiceStatus(name=name, available=False)

    url = f"http://{config['host']}:{config['port']}/health"
    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(url)
            latency = round((time.time() - start) * 1000)
            return ServiceStatus(name=name, available=resp.status_code == 200, latency_ms=latency)
    except Exception:
        return ServiceStatus(name=name, available=False)


async def check_all_services() -> HealthReport:
    statuses = []
    for name in SERVICE_CONFIG:
        statuses.append(await check_service_health(name))
    return HealthReport(services=statuses)


# ── 图片编解码 ─────────────────────────────────────────────

def _decode_base64(img_b64: str) -> np.ndarray:
    data = img_b64.split(",")[-1] if "," in img_b64 else img_b64
    buf = base64.b64decode(data)
    img = cv2.imdecode(np.frombuffer(buf, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("无法解码图片")
    return img


def _encode_base64(img: np.ndarray, fmt: str = ".png") -> str:
    _, buf = cv2.imencode(fmt, img)
    return base64.b64encode(buf).decode()


# ── 远程服务调用 ───────────────────────────────────────────

async def _call_service(
    name: str,
    image_base64: str,
    extra_files: Optional[dict] = None,
) -> Optional[dict]:
    """调用远程 ML 服务，失败返回 None"""
    config = SERVICE_CONFIG.get(name)
    if not config:
        return None

    url = f"http://{config['host']}:{config['port']}{config['path']}"

    try:
        files = {"file": ("image.png", base64.b64decode(image_base64), "image/png")}
        if extra_files:
            files.update(extra_files)

        async with httpx.AsyncClient(timeout=SERVICE_TIMEOUT) as client:
            resp = await client.post(url, files=files)
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass

    return None


# ── 布局分析 ───────────────────────────────────────────────

async def layout_analyze(image_base64: str) -> dict:
    """版面分析 - 优先使用远程 doclayout V3，失败回退到本地 PP-DocLayoutV2"""
    result = await _call_service("doclayout", image_base64)
    if result and result.get("regions"):
        return _convert_doclayout_v3(result)

    from paddleocr import LayoutDetection

    pipeline = LayoutDetection(model_name="PP-DocLayoutV2")
    img = _decode_base64(image_base64)
    h, w = img.shape[:2]

    raw = pipeline.predict(img, batch_size=1, threshold=0.50, layout_nms=True)
    if not raw:
        return {"page_info": {"height": h, "width": w}, "elements": []}

    page = raw[0]
    boxes = page.get("boxes", []) if isinstance(page, dict) else page.boxes
    elements = []
    for i, item in enumerate(boxes):
        x1, y1, x2, y2 = item["coordinate"]
        elements.append({
            "category_type": item["label"],
            "poly": [x1, y1, x2, y1, x2, y2, x1, y2],
            "score": round(item["score"], 4),
            "order": i,
        })
    return {"page_info": {"height": h, "width": w}, "elements": elements}


def _convert_doclayout_v3(result: dict) -> dict:
    """将 doclayout V3 输出转为前端标准格式"""
    img_size = result.get("image_size", [0, 0])
    regions = result.get("regions", [])
    elements = []
    for r in regions:
        box = r.get("box", {})
        x1 = box.get("xmin", 0)
        y1 = box.get("ymin", 0)
        x2 = box.get("xmax", 0)
        y2 = box.get("ymax", 0)
        elements.append({
            "category_type": r.get("label", "text"),
            "poly": [x1, y1, x2, y1, x2, y2, x1, y2],
            "score": round(r.get("score", 0), 4),
            "order": r.get("order", len(elements)),
        })
    return {
        "page_info": {"height": img_size[1], "width": img_size[0]},
        "elements": elements,
    }


# ── 元素解析（按类型路由）───────────────────────────────────

FORMULA_TYPES = {"equation", "formula", "display_formula"}
TABLE_TYPES = {"table"}
SKIP_OCR_TYPES = {"figure", "image", "chart"}


async def parse_element(
    element_type: str,
    image_base64: str,
    crop_b64: str,
) -> dict:
    """
    按元素类型路由到对应服务：
      formula → formulanet (LaTeX)
      table   → slanet (HTML)
      text    → PP-OCRv5 (文字)
    """
    result: dict = {"category_type": element_type, "text": "", "confidence": 0}

    if element_type in SKIP_OCR_TYPES:
        return result

    if element_type in FORMULA_TYPES:
        resp = await _call_service("formulanet", crop_b64)
        if resp and resp.get("latex"):
            result["latex"] = resp["latex"]
            result["confidence"] = 0.9
            return result

    if element_type in TABLE_TYPES:
        resp = await _call_service("slanet", crop_b64)
        if resp and resp.get("html"):
            result["html"] = resp["html"]
            result["confidence"] = resp.get("score", 0.9)
            return result

    img = _decode_base64(crop_b64)
    pipeline = _get_ocr()
    ocr_result = pipeline.predict(img)

    text_parts = []
    conf = 0.0
    count = 0

    if ocr_result:
        for page in ocr_result:
            texts = page.get("rec_texts") or (page.rec_texts if hasattr(page, "rec_texts") else None)
            if texts:
                text_parts.extend(texts)
                scores = page.get("rec_scores") or (page.rec_scores if hasattr(page, "rec_scores") else None)
                if scores:
                    conf += sum(scores)
                    count += len(scores)

    result["text"] = "\n".join(text_parts)
    result["confidence"] = conf / count if count > 0 else 0
    return result


async def parse_elements(
    image_base64: str,
    layout_bboxes: list,
    merge_text: bool = True,
) -> list[dict]:
    """
    批量解析元素 - 对每个布局区域按类型路由到对应服务
    """
    img = _decode_base64(image_base64)
    h, w = img.shape[:2]
    results = []

    for bbox in layout_bboxes:
        coords = bbox.poly if hasattr(bbox, "poly") else bbox.get("poly", [])
        element_type = bbox.category_type if hasattr(bbox, "category_type") else bbox.get("category_type", "text")

        if len(coords) < 8:
            results.append({"category_type": element_type, "text": "", "confidence": 0})
            continue

        MARGIN = 20
        xs = [coords[i] for i in range(0, 8, 2)]
        ys = [coords[i] for i in range(1, 8, 2)]
        x1 = max(0, int(min(xs)) - MARGIN)
        y1 = max(0, int(min(ys)) - MARGIN)
        x2 = min(w, int(max(xs)) + MARGIN)
        y2 = min(h, int(max(ys)) + MARGIN)

        if x2 <= x1 or y2 <= y1:
            results.append({"category_type": element_type, "text": "", "confidence": 0})
            continue

        crop = img[y1:y2, x1:x2]
        if crop.size == 0:
            results.append({"category_type": element_type, "text": "", "confidence": 0})
            continue

        crop_b64 = _encode_base64(crop)
        parsed = await parse_element(element_type, image_base64, crop_b64)
        results.append(parsed)

    return results
