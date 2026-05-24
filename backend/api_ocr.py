from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import base64
import cv2
import json
import numpy as np
import os
import time

from paddleocr import LayoutDetection
from paddleocr import PaddleOCR
from pipeline import parse_elements, check_all_services, layout_analyze

app = FastAPI(title="Document Parsing Services")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ocr_pipeline = None
layout_pipeline = None

def get_ocr():
    global ocr_pipeline
    if ocr_pipeline is None:
        os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"
        print("Initializing OCR (PP-OCRv5)...")
        ocr_pipeline = PaddleOCR(ocr_version="PP-OCRv5", lang="ch")
    return ocr_pipeline

def get_layout():
    global layout_pipeline
    if layout_pipeline is None:
        os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"
        print("Initializing Layout Analysis (PP-DocLayoutV2)...")
        layout_pipeline = LayoutDetection(model_name="PP-DocLayoutV2")
    return layout_pipeline

class LayoutBBox(BaseModel):
    poly: List[float]
    category_type: str

class OCRParseRequest(BaseModel):
    image_base64: str
    layout_bboxes: List[LayoutBBox]
    merge_text: bool = True

class LayoutRequest(BaseModel):
    image_base64: str
    threshold: float = 0.50
    layout_nms: bool = True

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000)
    path = request.url.path
    if path == "/api/health":
        return response
    print(json.dumps({
        "method": request.method,
        "path": path,
        "status": response.status_code,
        "duration_ms": duration_ms,
    }))
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    path = request.url.path
    error_msg = str(exc)[:500]
    print(json.dumps({
        "method": request.method,
        "path": path,
        "status": 500,
        "duration_ms": 0,
        "error": error_msg,
    }))
    return JSONResponse(status_code=500, content={"detail": str(exc)})

@app.get("/api/health")
async def health_check():
    ocr_status = "loaded" if ocr_pipeline is not None else "loading"
    layout_status = "loaded" if layout_pipeline is not None else "loading"
    
    remote_status = {}
    try:
        report = await check_all_services()
        for s in report.services:
            remote_status[s.name] = {
                "available": s.available,
                "latency_ms": s.latency_ms,
            }
    except Exception:
        remote_status["error"] = "unable to check remote services"

    return JSONResponse(
        status_code=200,
        content={
            "status": "ok",
            "models": {"ocr": ocr_status, "layout": layout_status},
            "remote_services": remote_status,
        },
    )

@app.post("/api/layout")
async def detect_layout(req: LayoutRequest):
    try:
        img_data = req.image_base64.split(",")[-1] if "," in req.image_base64 else req.image_base64
        img_bytes = base64.b64decode(img_data)
        img = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        pipeline = get_layout()
        result = pipeline.predict(img, batch_size=1, threshold=req.threshold, layout_nms=req.layout_nms)

        if not result:
            return {"page_info": {"height": img.shape[0], "width": img.shape[1]}, "elements": []}

        page_result = result[0]
        elements = []
        boxes = page_result.get('boxes', []) if isinstance(page_result, dict) else page_result.boxes
        for i, item in enumerate(boxes):
            # item coordinate format: [ymin, xmin, ymax, xmax] or [xmin, ymin, xmax, ymax]
            # Based on test, it is [xmin, ymin, xmax, ymax]
            x1, y1, x2, y2 = item['coordinate']

            # 8-point polygon format expected by frontend
            # Format: [top-left-x, top-left-y, top-right-x, top-right-y, bottom-right-x, bottom-right-y, bottom-left-x, bottom-left-y]
            poly = [x1, y1, x2, y1, x2, y2, x1, y2]

            elements.append({
                "category_type": item['label'],
                "poly": [round(v, 2) for v in poly],
                "score": round(item['score'], 4),
                "order": i
            })

        return {
            "page_info": {"height": int(img.shape[0]), "width": int(img.shape[1])},
            "elements": elements
        }
    except Exception as e:
        raise

@app.post("/api/parse")
async def parse_elements_endpoint(req: OCRParseRequest):
    try:
        img_data = req.image_base64.split(",")[-1] if "," in req.image_base64 else req.image_base64
        img_bytes = base64.b64decode(img_data)
        img = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        results = await parse_elements(
            image_base64=req.image_base64,
            layout_bboxes=req.layout_bboxes,
            merge_text=req.merge_text,
        )
        return {"elements": results}
    except Exception as e:
        raise

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

