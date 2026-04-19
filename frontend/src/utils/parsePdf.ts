import { pdfjs } from 'react-pdf';
import type { ParsedPageData } from '../types/document';
import { useDocumentListStore } from '../store/useDocumentListStore';
import { API_CONFIG } from '../api/config';

const MAX_CONCURRENT = 3;

async function renderPdfPage(
  pdf: ReturnType<typeof pdfjs.getDocument> extends { promise: Promise<infer T> } ? T : never,
  pageIndex: number,
  scale: number = 2.0,
): Promise<{ imageBase64: string; width: number; height: number }> {
  const page = await pdf.getPage(pageIndex);
  const viewport = page.getViewport({ scale });

  const canvasEl = document.createElement('canvas');
  canvasEl.width = viewport.width;
  canvasEl.height = viewport.height;
  const ctx = canvasEl.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

  // @ts-ignore - pdf.js types are inconsistent across versions
  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  return { imageBase64: canvasEl.toDataURL('image/png'), width: viewport.width, height: viewport.height };
}

async function callLayoutApi(imageBase64: string) {
  const cfg = API_CONFIG.layoutModel;
  const resp = await fetch(`${cfg.url}${cfg.endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
  if (!resp.ok) throw new Error(`Layout API ${resp.status}`);
  return resp.json() as unknown as { page_info?: { width: number; height: number }; pageInfo?: { width: number; height: number }; elements: Array<{ category_type: string; poly: number[]; order: number; score: number }> };
}

async function callOcrApi(
  imageBase64: string,
  layoutBboxes: Array<{ poly: number[]; category_type: string }>,
) {
  const cfg = API_CONFIG.ocrModel;
  const resp = await fetch(`${cfg.url}${cfg.endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64: imageBase64,
      layout_bboxes: layoutBboxes,
    }),
  });
  if (!resp.ok) throw new Error(`OCR API ${resp.status}`);
  return resp.json() as unknown as { elements: Array<{ category_type: string; text: string }> };
}

export async function parsePdfDocument(docId: string): Promise<void> {
  const doc = useDocumentListStore.getState().documents.find((d) => d.id === docId);
  if (!doc) return;

  try {
    // Mark as parsing
    useDocumentListStore.getState().updateDocumentStatus(docId, 'parsing');

    // Get total page count
    const arrayBuffer = await doc.file.arrayBuffer();
    const pdf = await pdfjs.getDocument(new Uint8Array(arrayBuffer)).promise;
    const totalPages = pdf.numPages;

    // Update page count in store
    useDocumentListStore.getState().setPageCount(docId, totalPages);

    const parsedData: ParsedPageData[] = [];

    // Process each page sequentially
    for (let pageIdx = 1; pageIdx <= totalPages; pageIdx++) {
      const rendered = await renderPdfPage(pdf, pageIdx);

      const layoutResult = await callLayoutApi(rendered.imageBase64);
      const pageInfo = layoutResult.pageInfo || layoutResult.page_info || { width: rendered.width, height: rendered.height };

      const layoutBboxes = layoutResult.elements.map((e) => ({
        poly: e.poly,
        category_type: e.category_type,
      }));
      const ocrResult = await callOcrApi(rendered.imageBase64, layoutBboxes);

      parsedData.push({
        imageBase64: rendered.imageBase64,
        width: pageInfo.width,
        height: pageInfo.height,
        layoutElements: layoutResult.elements,
        ocrElements: ocrResult.elements.map((el, i) => ({
          category_type: el.category_type,
          text: el.text,
          poly: layoutResult.elements[i]?.poly || [0, 0, 0, 0, 0, 0, 0, 0],
        })),
      });
    }

    useDocumentListStore.getState().updateDocumentStatus(docId, 'done', parsedData);
  } catch (e: any) {
    useDocumentListStore.getState().updateDocumentStatus(docId, 'error', undefined, e.message || '解析失败');
  }
}

export async function parseAllPendingDocuments(): Promise<{ success: number; failed: number }> {
  const store = useDocumentListStore.getState();
  const pendingIds = store.documents
    .filter((d) => d.status === 'pending')
    .map((d) => d.id);

  if (pendingIds.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;

  const queue = [...pendingIds];
  const workers: Promise<void>[] = [];

  async function worker() {
    while (queue.length > 0) {
      const docId = queue.shift()!;
      try {
        await parsePdfDocument(docId);
        success++;
      } catch {
        failed++;
      }
    }
  }

  const workerCount = Math.min(MAX_CONCURRENT, pendingIds.length);
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  if (success > 0 || failed > 0) {
    alert(`解析完成：${success} 个成功，${failed} 个失败`);
  }

  return { success, failed };
}
