from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import base64
import cv2
import numpy as np
import os

from paddleocr import LayoutDetection
from paddleocr import PaddleOCR

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
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/parse")
async def parse_elements(req: OCRParseRequest):
    try:
        img_data = req.image_base64.split(",")[-1] if "," in req.image_base64 else req.image_base64
        img_bytes = base64.b64decode(img_data)
        img = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
            
        pipeline = get_ocr()
        h, w = img.shape[:2]
        results = []
        
        for bbox in req.layout_bboxes:
            coords = bbox.poly
            if len(coords) < 8:
                continue
            
            MARGIN = 60
            xs = [coords[i] for i in range(0, 8, 2)]
            ys = [coords[i] for i in range(1, 8, 2)]
            x1, y1 = max(0, int(min(xs)) - MARGIN), max(0, int(min(ys)) - MARGIN)
            x2, y2 = min(w, int(max(xs)) + MARGIN), min(h, int(max(ys)) + MARGIN)

            if x2 <= x1 or y2 <= y1:
                results.append({"category_type": bbox.category_type, "text": "", "confidence": 0})
                continue
                
            crop = img[y1:y2, x1:x2]
            
            if crop.size == 0:
                results.append({"category_type": bbox.category_type, "text": "", "confidence": 0})
                continue

            ocr_res = pipeline.predict(crop)
            
            text_parts = []
            conf = 0.0
            count = 0

            if ocr_res:
                for page in ocr_res:
                    rec_texts = page.get('rec_texts')
                    if rec_texts:
                        text_parts.extend(rec_texts)
                        rec_scores = page.get('rec_scores')
                        if rec_scores:
                            conf += sum(rec_scores)
                            count += len(rec_scores)
                    elif hasattr(page, 'rec_texts') and page.rec_texts:
                        text_parts.extend(page.rec_texts)
                        if hasattr(page, 'rec_scores'):
                            conf += sum(page.rec_scores)
                            count += len(page.rec_scores)
            
            text_out = "\n".join(text_parts) if req.merge_text else text_parts
            results.append({
                "category_type": bbox.category_type,
                "text": text_out,
                "confidence": conf / count if count > 0 else 0
            })
        return {"elements": results}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

