import type { PdfElement, Chunk, ChunkType, ColumnLayout } from '../types/omnidoc';

type ElementType = PdfElement['category_type'];

const STANDALONE_TYPES: ElementType[] = ['table', 'figure', 'image', 'chart'];
const TITLE_TYPES: ElementType[] = ['title', 'paragraph_title', 'doc_title'];
const IGNORE_TYPES: ElementType[] = ['page_number', 'number'];
const CAPTION_TO_STANDALONE: Record<string, ElementType | undefined> = {
  figure_caption: 'figure',
  table_caption: 'table',
  image_caption: 'figure',
};

function isStandalone(type: ElementType): boolean {
  return STANDALONE_TYPES.includes(type);
}

function isTitle(type: ElementType): boolean {
  return TITLE_TYPES.includes(type);
}

function isIgnored(type: ElementType): boolean {
  return IGNORE_TYPES.includes(type);
}

function unionBbox(elements: PdfElement[]): number[] {
  const bboxes = elements.map((el) => el.poly);
  return [
    Math.min(...bboxes.map((b) => b[0])),
    Math.min(...bboxes.map((b) => b[1])),
    Math.max(...bboxes.map((b) => b[2])),
    Math.max(...bboxes.map((b) => b[3])),
  ];
}

export function detectColumns(elements: PdfElement[], pageWidth: number): ColumnLayout {
  const narrow = elements.filter((el) => {
    const w = el.poly[2] - el.poly[0];
    return w <= pageWidth * 0.6;
  });

  if (narrow.length < 4) {
    return { columnCount: 1, splitX: null };
  }

  const lefts = narrow.map((el) => el.poly[0]).sort((a, b) => a - b);
  const medianLeft = lefts[Math.floor(lefts.length / 2)];

  const leftGroup = lefts.filter((l) => l < medianLeft);
  const rightGroup = lefts.filter((l) => l >= medianLeft);

  if (leftGroup.length < 2 || rightGroup.length < 2) {
    return { columnCount: 1, splitX: null };
  }

  const leftCenter = leftGroup.reduce((a, b) => a + b, 0) / leftGroup.length;
  const rightCenter = rightGroup.reduce((a, b) => a + b, 0) / rightGroup.length;
  const gap = rightCenter - leftCenter;

  if (gap <= pageWidth * 0.15) {
    return { columnCount: 1, splitX: null };
  }

  return { columnCount: 2, splitX: (leftCenter + rightCenter) / 2 };
}

function getColumnIndex(poly: number[], columnLayout: ColumnLayout, pageWidth: number): number {
  if (columnLayout.columnCount === 1) return 0;
  const width = poly[2] - poly[0];
  if (width > pageWidth * 0.6) return -1;
  if (columnLayout.splitX === null) return 0;
  return poly[0] < columnLayout.splitX ? 0 : 1;
}

function elementCharCount(el: PdfElement): number {
  return (el.markdown || el.latex || el.html || '').length;
}

export function getPageWidth(elements: PdfElement[], pageWidth?: number): number {
  if (pageWidth && pageWidth > 0) return pageWidth;
  return elements.reduce((max, el) => Math.max(max, el.poly[2]), 0);
}

export function computeChunks(
  elements: PdfElement[],
  columnLayout: ColumnLayout,
  pageWidth: number,
  maxChars = 500,
): Chunk[] {
  const chunks: Chunk[] = [];
  let active: { type: ChunkType; elements: PdfElement[]; charCount: number } | null = null;
  const labelCounters: Record<string, number> = {};

  function getNextLabel(type: ChunkType): string {
    const nameMap: Record<ChunkType, string> = {
      text_block: '段落',
      table: '表格',
      figure: '图片',
    };
    if (!labelCounters[type]) labelCounters[type] = 0;
    labelCounters[type]++;
    return `${nameMap[type]} ${labelCounters[type]}`;
  }

  function pushActive(): void {
    if (!active || active.elements.length === 0) return;
    const colIdx = getColumnIndex(active.elements[0].poly, columnLayout, pageWidth);
    chunks.push({
      id: `chunk_${chunks.length}`,
      type: active.type,
      elements: [...active.elements],
      label: getNextLabel(active.type),
      columnIndex: colIdx,
      unionBbox: unionBbox(active.elements),
      charCount: active.charCount,
    });
    active = null;
  }

  const sorted = [...elements].sort((a, b) => a.order - b.order);

  for (let i = 0; i < sorted.length; i++) {
    const el = sorted[i];

    if (isIgnored(el.category_type)) continue;

    if (isStandalone(el.category_type)) {
      pushActive();

      const colIdx = getColumnIndex(el.poly, columnLayout, pageWidth);
      const standaloneElements: PdfElement[] = [el];

      for (let lookAhead = 1; lookAhead <= 3 && i + lookAhead < sorted.length; lookAhead++) {
        const nextEl = sorted[i + lookAhead];
        if (isIgnored(nextEl.category_type)) continue;
        const expected = CAPTION_TO_STANDALONE[nextEl.category_type];
        if (expected === el.category_type) {
          standaloneElements.push(nextEl);
          i += lookAhead;
          break;
        }
        if (!CAPTION_TO_STANDALONE[nextEl.category_type]) break;
      }

      const chunkType: ChunkType = el.category_type === 'table' ? 'table' : 'figure';
      const standaloneCharCount = standaloneElements.reduce((sum, e) => sum + elementCharCount(e), 0);
      chunks.push({
        id: `chunk_${chunks.length}`,
        type: chunkType,
        elements: standaloneElements,
        label: getNextLabel(chunkType),
        columnIndex: colIdx,
        unionBbox: unionBbox(standaloneElements),
        charCount: standaloneCharCount,
      });
      continue;
    }

    if (isTitle(el.category_type)) {
      pushActive();
    }

    const chars = elementCharCount(el);

    if (active && active.charCount + chars > maxChars && active.elements.length > 0) {
      pushActive();
    }

    if (!active) {
      active = { type: 'text_block', elements: [], charCount: 0 };
    }
    active.elements.push(el);
    active.charCount += chars;
  }

  pushActive();

  return chunks;
}
