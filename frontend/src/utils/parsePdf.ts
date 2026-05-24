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

  // pdf.js types are inconsistent across versions; cast through unknown to access render()
  await (page as unknown as { render: (params: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> } }).render({
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

async function callLocalOcrApi(
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
  if (!resp.ok) throw new Error(`Local OCR API ${resp.status}`);
  return resp.json() as unknown as { elements: Array<{ category_type: string; text: string; confidence: number; latex?: string; html?: string }> };
}

async function callOcrApi(
  imageBase64: string,
  layoutBboxes: Array<{ poly: number[]; category_type: string }>,
) {
  // Use local OCR which handles per-bbox OCR correctly
  // Remote /ocr/file returns all text lines for whole page — mapping by index is unreliable
  return callLocalOcrApi(imageBase64, layoutBboxes);
}

export async function parsePdfDocument(docId: string): Promise<void> {
  const doc = useDocumentListStore.getState().documents.find((d) => d.id === docId);
  if (!doc) return;

  try {
    useDocumentListStore.getState().updateDocumentStatus(docId, 'parsing');

    const arrayBuffer = await doc.file.arrayBuffer();
    const pdf = await pdfjs.getDocument(new Uint8Array(arrayBuffer)).promise;
    const totalPages = pdf.numPages;

    useDocumentListStore.getState().setPageCount(docId, totalPages);

    const CONCURRENCY = Math.max(1, API_CONFIG.parseConcurrency || 3);
    const parsedData: ParsedPageData[] = new Array(totalPages);
    const errors: Array<{ page: number; error: string }> = [];

    let nextPageIdx = 1;

    async function processPage(pageIdx: number) {
      try {
        const rendered = await renderPdfPage(pdf, pageIdx);
        const layoutResult = await callLayoutApi(rendered.imageBase64);
        const pageInfo = layoutResult.pageInfo || layoutResult.page_info || { width: rendered.width, height: rendered.height };
        const layoutBboxes = layoutResult.elements.map((e) => ({
          poly: e.poly,
          category_type: e.category_type,
        }));

        const ocrResult = await callOcrApi(rendered.imageBase64, layoutBboxes);

        const toBBox = (p: number[]): number[] => {
          if (p.length >= 8) {
            return [Math.min(p[0],p[2],p[4],p[6]), Math.min(p[1],p[3],p[5],p[7]),
                    Math.max(p[0],p[2],p[4],p[6]), Math.max(p[1],p[3],p[5],p[7])];
          }
          return p;
        };

        const ocrElements = ocrResult.elements.map((el, i) => ({
          category_type: el.category_type,
          text: el.text,
          latex: el.latex,
          html: el.html,
          poly: toBBox(layoutResult.elements[i]?.poly || [0, 0, 0, 0]),
          confidence: el.confidence,
        }));

        parsedData[pageIdx - 1] = {
          imageBase64: rendered.imageBase64,
          width: pageInfo.width,
          height: pageInfo.height,
          layoutElements: layoutResult.elements,
          ocrElements,
        };

        const completedData = parsedData.filter((d): d is ParsedPageData => !!d);
        useDocumentListStore.getState().updateDocumentStatus(docId, 'parsing', completedData);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        errors.push({ page: pageIdx, error: msg });
      }
    }

    if (CONCURRENCY <= 1) {
      for (let pageIdx = 1; pageIdx <= totalPages; pageIdx++) {
        await processPage(pageIdx);
      }
    } else {
      const workers: Promise<void>[] = [];
      for (let w = 0; w < CONCURRENCY; w++) {
        workers.push((async () => {
          while (nextPageIdx <= totalPages) {
            const pageIdx = nextPageIdx++;
            await processPage(pageIdx);
          }
        })());
      }
      await Promise.all(workers);
    }

    if (errors.length === totalPages) {
      useDocumentListStore.getState().updateDocumentStatus(docId, 'error', undefined, '所有页面解析失败');
    } else {
      const finalData = parsedData.filter((d): d is ParsedPageData => !!d);
      useDocumentListStore.getState().updateDocumentStatus(docId, 'done', finalData);
      if (errors.length > 0) {
        console.warn(`Document ${docId}: ${errors.length} pages failed`, errors);
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '解析失败';
    useDocumentListStore.getState().updateDocumentStatus(docId, 'error', undefined, msg);
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
