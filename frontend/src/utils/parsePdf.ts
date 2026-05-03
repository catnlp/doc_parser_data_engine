import { pdfjs } from 'react-pdf';
import type { ParsedPageData } from '../types/document';
import { useDocumentListStore } from '../store/useDocumentListStore';
import { API_CONFIG } from '../api/config';

const MAX_CONCURRENT = 3;

function base64ToBlob(base64: string, mimeType = 'image/png'): Blob {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const byteString = atob(base64Data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

async function cropImageFromBase64(
  imageBase64: string,
  poly: number[],
  pageWidth: number,
  pageHeight: number,
): Promise<string | null> {
  if (poly.length < 8) return null;

  const xs = [poly[0], poly[2], poly[4], poly[6]];
  const ys = [poly[1], poly[3], poly[5], poly[7]];
  const CROP_MARGIN = 40;
  const x1 = Math.max(0, Math.min(...xs) - CROP_MARGIN);
  const y1 = Math.max(0, Math.min(...ys) - CROP_MARGIN);
  const x2 = Math.min(pageWidth, Math.max(...xs) + CROP_MARGIN);
  const y2 = Math.min(pageHeight, Math.max(...ys) + CROP_MARGIN);
  const cropW = x2 - x1;
  const cropH = y2 - y1;

  if (cropW <= 0 || cropH <= 0) return null;

  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, cropW, cropH);
      ctx.drawImage(img, x1, y1, cropW, cropH, 0, 0, cropW, cropH);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = imageBase64;
  });
}

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
  return resp.json() as unknown as { elements: Array<{ category_type: string; text: string }> };
}

async function callOcrApi(
  imageBase64: string,
  layoutBboxes: Array<{ poly: number[]; category_type: string }>,
) {
  // Use local OCR which handles per-bbox OCR correctly
  // Remote /ocr/file returns all text lines for whole page — mapping by index is unreliable
  return callLocalOcrApi(imageBase64, layoutBboxes);
}

async function callRemoteFormulaApi(croppedImageBase64: string): Promise<string | null> {
  const cfg = API_CONFIG.formulaApi;
  if (!cfg.enabled) return null;

  const blob = base64ToBlob(croppedImageBase64);
  const formData = new FormData();
  formData.append('file', blob, 'formula.png');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeout);

  try {
    const resp = await fetch(`${cfg.url}${cfg.endpoint}`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!resp.ok) throw new Error(`Formula API ${resp.status}`);

    const json = await resp.json() as { success?: boolean; formulas?: Array<{ latex?: string }> };
    if (json.success && Array.isArray(json.formulas) && json.formulas.length > 0 && json.formulas[0]?.latex) {
      return json.formulas[0].latex;
    }
    return null;
  } catch (e) {
    clearTimeout(timer);
    console.warn('Formula API failed, falling back to local OCR:', e instanceof Error ? e.message : e);
    return null;
  }
}

async function callRemoteTableApi(croppedImageBase64: string): Promise<string | null> {
  const cfg = API_CONFIG.tableApi;
  if (!cfg.enabled) return null;

  const blob = base64ToBlob(croppedImageBase64);
  const formData = new FormData();
  formData.append('file', blob, 'table.png');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeout);

  try {
    const resp = await fetch(`${cfg.url}${cfg.endpoint}`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!resp.ok) throw new Error(`Table API ${resp.status}`);

    const json = await resp.json() as { success?: boolean; tables?: Array<{ html?: string }> };
    if (json.success && Array.isArray(json.tables) && json.tables.length > 0 && json.tables[0]?.html) {
      return json.tables[0].html;
    }
    return null;
  } catch (e) {
    clearTimeout(timer);
    console.warn('Table API failed, falling back to local OCR:', e instanceof Error ? e.message : e);
    return null;
  }
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

    function isFormulaCategory(type: string): boolean {
      return type === 'equation' || type === 'formula' || type === 'display_formula';
    }

    async function processPage(pageIdx: number) {
      try {
        const rendered = await renderPdfPage(pdf, pageIdx);
        const layoutResult = await callLayoutApi(rendered.imageBase64);
        const pageInfo = layoutResult.pageInfo || layoutResult.page_info || { width: rendered.width, height: rendered.height };
        const layoutBboxes = layoutResult.elements.map((e) => ({
          poly: e.poly,
          category_type: e.category_type,
        }));

        // Separate equations and tables from regular text elements
        const eqIndices: number[] = [];
        const tableIndices: number[] = [];
        const regularBboxes: Array<{ poly: number[]; category_type: string }> = [];
        layoutBboxes.forEach((bbox, i) => {
          if (isFormulaCategory(bbox.category_type)) {
            eqIndices.push(i);
          } else if (bbox.category_type === 'table') {
            tableIndices.push(i);
          } else {
            regularBboxes.push(bbox);
          }
        });

        // Process equations through formula API (parallel)
        const eqResults = await Promise.all(
          eqIndices.map(async (i) => {
            const bbox = layoutBboxes[i];
            try {
              const cropped = await cropImageFromBase64(
                rendered.imageBase64, bbox.poly, rendered.width, rendered.height,
              );
              if (cropped) {
                const latex = await callRemoteFormulaApi(cropped);
                if (latex) {
                  return { index: i, category_type: bbox.category_type, text: latex, latex: `$$${latex}$$` };
                }
              }
            } catch {
              // fall through to local OCR below
            }
            return null;
          }),
        );

        // Process tables through table API (parallel)
        const tableResults = await Promise.all(
          tableIndices.map(async (i) => {
            const bbox = layoutBboxes[i];
            try {
              const cropped = await cropImageFromBase64(
                rendered.imageBase64, bbox.poly, rendered.width, rendered.height,
              );
              if (cropped) {
                const html = await callRemoteTableApi(cropped);
                if (html) {
                  return { index: i, category_type: bbox.category_type, text: html, html };
                }
              }
            } catch {
              // fall through to local OCR
            }
            return null;
          }),
        );

        // Get regular (non-equation, non-table) results through existing OCR flow
        let regularElements: Array<{ category_type: string; text: string }> = [];
        if (regularBboxes.length > 0) {
          const regularResult = await callOcrApi(rendered.imageBase64, regularBboxes);
          regularElements = regularResult.elements;
        }

        // Merge results, maintaining original layout order
        interface OcrElement {
          category_type: string;
          text: string;
          poly: number[];
          latex?: string;
          html?: string;
          demoted?: boolean;
        }
        const ocrElements: Array<OcrElement | null> = new Array(layoutBboxes.length);

        // Fill in formula results
        for (const r of eqResults) {
          if (r !== null) {
            ocrElements[r.index] = {
              category_type: r.category_type,
              text: r.text,
              latex: r.latex,
              poly: layoutResult.elements[r.index]?.poly || [0, 0, 0, 0, 0, 0, 0, 0],
            };
          }
        }

        // Fill in table results
        for (const r of tableResults) {
          if (r !== null) {
            ocrElements[r.index] = {
              category_type: r.category_type,
              text: r.text,
              html: r.html,
              poly: layoutResult.elements[r.index]?.poly || [0, 0, 0, 0, 0, 0, 0, 0],
            };
          }
        }

        // For equations/tables without remote result, fill via local OCR (singly)
        let regularIdx = 0;
        for (let i = 0; i < layoutBboxes.length; i++) {
          if (ocrElements[i]) continue;
          const bbox = layoutBboxes[i];
          if (isFormulaCategory(bbox.category_type)) {
            // Formula API failed to recognize — demote to regular text
            try {
              const fallbackResult = await callOcrApi(rendered.imageBase64, [bbox]);
              const text = fallbackResult.elements.map(e => e.text).filter(Boolean).join('\n') || '';
              ocrElements[i] = {
                category_type: 'text',
                text,
                demoted: true,
                latex: '',
                poly: layoutResult.elements[i]?.poly || [0, 0, 0, 0, 0, 0, 0, 0],
              };
            } catch {
              ocrElements[i] = {
                category_type: 'text',
                text: '',
                demoted: true,
                latex: '',
                poly: layoutResult.elements[i]?.poly || [0, 0, 0, 0, 0, 0, 0, 0],
              };
            }
          } else if (bbox.category_type === 'table') {
            // Fallback: try local OCR for this single table
            try {
              const fallbackResult = await callOcrApi(rendered.imageBase64, [bbox]);
              const text = fallbackResult.elements[0]?.text || '';
              ocrElements[i] = {
                category_type: bbox.category_type,
                text,
                html: '',
                poly: layoutResult.elements[i]?.poly || [0, 0, 0, 0, 0, 0, 0, 0],
              };
            } catch {
              ocrElements[i] = {
                category_type: bbox.category_type,
                text: '',
                html: '',
                poly: layoutResult.elements[i]?.poly || [0, 0, 0, 0, 0, 0, 0, 0],
              };
            }
          } else {
            ocrElements[i] = {
              category_type: bbox.category_type,
              text: regularElements[regularIdx++]?.text || '',
              poly: layoutResult.elements[i]?.poly || [0, 0, 0, 0, 0, 0, 0, 0],
            };
          }
        }

        parsedData[pageIdx - 1] = {
          imageBase64: rendered.imageBase64,
          width: pageInfo.width,
          height: pageInfo.height,
          layoutElements: layoutResult.elements,
          ocrElements: ocrElements.filter((el): el is OcrElement => !!el),
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
