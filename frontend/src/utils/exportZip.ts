import JSZip from 'jszip';
import { computeChunks, detectColumns } from './chunk';
import type { PdfDocument } from '../types/document';
import type { PdfElement } from '../types/omnidoc';

interface ExportChunk {
  label: string;
  type: string;
  element_indices: number[];
  column_index: number;
  char_count: number;
}

function computeExportChunks(elements: PdfElement[], pageWidth: number): ExportChunk[] {
  const columnLayout = detectColumns(elements, pageWidth);
  const chunks = computeChunks(elements, columnLayout, pageWidth);
  return chunks.map((c) => ({
    label: c.label,
    type: c.type,
    element_indices: c.elements.map((el) => el.order),
    column_index: c.columnIndex,
    char_count: c.charCount,
  }));
}

export async function exportDocumentAsZip(doc: PdfDocument) {
  const pages = doc.parsedData;
  if (!pages || pages.length === 0) {
    alert('No parsed data to export');
    return;
  }

  const failures: string[] = [];

  try {
    const zip = new JSZip();
    const baseName = doc.name.replace(/\.pdf$/i, '');
    let figureIdx = 0;
    const exportPages: Array<{
      page_number: number;
      image_path: string;
      page_info: { width: number; height: number };
      elements: Record<string, unknown>[];
      chunks: ExportChunk[];
    }> = [];

    for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
      const pageData = pages[pageIdx];
      if (!pageData) continue;

      const imageName = `page_${String(pageIdx + 1).padStart(3, '0')}.png`;

      if (pageData.imageBase64) {
        const imgBase64 = pageData.imageBase64.split(',')[1] || pageData.imageBase64;
        zip.file(`${baseName}/${imageName}`, imgBase64, { base64: true });
      }

      const elements = pageData.ocrElements.map((el, i) => {
        const element: Record<string, unknown> = {
          category_type: el.category_type,
          poly: el.poly,
          order: i,
        };

        if (el.category_type === 'table' && el.html) {
          element.html = el.html;
        } else if ((el.category_type === 'equation' || el.category_type === 'formula' || el.category_type === 'display_formula') && el.latex) {
          element.latex = el.latex;
        } else {
          element.text = el.text || '';
        }

        return element;
      });

      const pdfElements: PdfElement[] = pageData.ocrElements.map((el, i) => ({
        id: `export_${pageIdx}_${i}`,
        category_type: el.category_type as PdfElement['category_type'],
        poly: el.poly,
        order: i,
        latex: el.latex || '',
        html: el.html || '',
        markdown: el.text || '',
        image_path: '',
      }));

      if (pageData.imageBase64) {
        const layoutElements = pageData.layoutElements;
        for (const el of layoutElements) {
          if (el.category_type !== 'figure' && el.category_type !== 'table') continue;
          const poly = el.poly;
          if (poly.length < 4) continue;

          const xMin = poly[0];
          const yMin = poly[1];
          const xMax = poly[2];
          const yMax = poly[3];

          const cropWidth = Math.round(xMax - xMin);
          const cropHeight = Math.round(yMax - yMin);
          if (cropWidth <= 0 || cropHeight <= 0) {
            figureIdx++;
            failures.push(`页面 ${pageIdx + 1} ${el.category_type} 元素坐标无效（宽=${cropWidth}, 高=${cropHeight}），已跳过`);
            continue;
          }

          figureIdx++;
          const idxStr = String(figureIdx).padStart(3, '0');

          const img = new Image();
          try {
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error(`页面 ${pageIdx + 1} 图片加载失败`));
              img.src = pageData.imageBase64;
            });
          } catch (e: any) {
            failures.push(e.message || `页面 ${pageIdx + 1} ${el.category_type} 图片加载异常`);
            continue;
          }

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            failures.push(`页面 ${pageIdx + 1} ${el.category_type} 无法获取 Canvas 上下文`);
            continue;
          }
          canvas.width = cropWidth;
          canvas.height = cropHeight;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            img,
            xMin, yMin, canvas.width, canvas.height,
            0, 0, canvas.width, canvas.height,
          );

          const cropDataUrl = canvas.toDataURL('image/png');
          const cropBase64 = cropDataUrl.split(',')[1];
          zip.file(`${baseName}/images/page_${String(pageIdx + 1).padStart(3, '0')}_${el.category_type}_${idxStr}.png`, cropBase64, { base64: true });
        }
      }

      exportPages.push({
        page_number: pageIdx + 1,
        image_path: imageName,
        page_info: { width: pageData.width, height: pageData.height },
        elements,
        chunks: computeExportChunks(pdfElements, pageData.width),
      });
    }

    const result = {
      document_name: doc.name,
      total_pages: pages.length,
      pages: exportPages,
    };
    zip.file(`${baseName}/result.json`, JSON.stringify(result, null, 2));

    let content: Blob;
    try {
      content = await zip.generateAsync({ type: 'blob' });
    } catch (e: any) {
      alert('导出失败：文件过大，无法生成 ZIP。请尝试减少页数。');
      return;
    }

    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    if (failures.length > 0) {
      alert(`导出部分失败：\n${failures.join('\n')}`);
    }
  } catch (e: any) {
    alert('导出失败：' + (e.message || '未知错误'));
  }
}
