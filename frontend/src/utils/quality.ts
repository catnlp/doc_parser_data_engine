import type { PdfDocument } from '../types/document';

export interface DocQuality {
  avgLayoutScore: number;
  avgOcrConfidence: number | null;
  demotedCount: number;
  emptyCount: number;
  failedPageCount: number;
  hasOcrConfidence: boolean;
}

export function computeDocQuality(doc: PdfDocument): DocQuality {
  const parsedPages = doc.parsedData;

  let layoutScoreSum = 0;
  let layoutCount = 0;
  let ocrConfSum = 0;
  let ocrConfCount = 0;
  let demotedCount = 0;
  let emptyCount = 0;

  for (const page of parsedPages) {
    if (!page) continue;

    for (const el of page.layoutElements) {
      if (el.score != null) {
        layoutScoreSum += el.score;
        layoutCount++;
      }
    }

    for (const el of page.ocrElements) {
      if (el.demoted) demotedCount++;
      if (!el.text || el.text.trim() === '') emptyCount++;
      if (el.confidence != null) {
        ocrConfSum += el.confidence;
        ocrConfCount++;
      }
    }
  }

  return {
    avgLayoutScore: layoutCount > 0 ? layoutScoreSum / layoutCount : 0,
    avgOcrConfidence: ocrConfCount > 0 ? ocrConfSum / ocrConfCount : null,
    demotedCount,
    emptyCount,
    failedPageCount: doc.pageCount - doc.parsedPageCount,
    hasOcrConfidence: ocrConfCount > 0,
  };
}
