import { create } from 'zustand';
import type { PdfInfo, PageInfo, PdfElement } from '../types/omnidoc';
import { pdfjs } from 'react-pdf';

export type ToolMode = 'select' | 'create';
export type ApiStatus = 'idle' | 'calling_layout' | 'calling_ocr' | 'done' | 'loading' | 'error';

interface LayoutResult {
  page_info?: PageInfo;
  pageInfo?: PageInfo;
  elements: Array<{ category_type: string; poly: number[]; order: number; score: number }>;
}

interface RenderedPage {
  imageBase64: string;
  width: number;
  height: number;
}

interface AnnotationStore {
  currentPage: number;
  totalPages: number;
  pdfInfo: PdfInfo[];
  pageInfo: PageInfo[];
  imagePath: string;
  pdfFile: File | null;
  renderedPages: RenderedPage[];

  selectedElementId: string | null;
  hoveredElementId: string | null;
  toolMode: ToolMode;
  rightPanelTab: 'list' | 'detail';
  zoom: number;
  leftPanelWidth: number;

  dirtyPages: Set<number>;
  elementDraftContent: string | null;
  apiStatus: ApiStatus;
  apiError: string | null;

  loadDocument: (pages: PdfInfo[], pageInfo: PageInfo[], imagePath: string) => void;
  loadDocumentFromApi: (file: File) => Promise<void>;
  setCurrentPage: (page: number) => void;
  setSelectedElementId: (id: string | null) => void;
  setHoveredElementId: (id: string | null) => void;
  setToolMode: (mode: ToolMode) => void;
  setRightPanelTab: (tab: 'list' | 'detail') => void;
  setZoom: (zoom: number) => void;
  setLeftPanelWidth: (width: number) => void;
  getPageElements: () => PdfElement[];
  getPageInfo: () => PageInfo | undefined;
  updateElement: (elementId: string, updates: Partial<PdfElement>) => void;
  addElement: (element: PdfElement) => void;
  removeElement: (elementId: string) => void;
  reorderElements: (fromOrder: number, toOrder: number) => void;
  markPageDirty: () => void;
  markPageClean: () => void;
  isPageDirty: () => boolean;
  updateDraftContent: (content: string | null) => void;
  getNextOrder: () => number;
}

function canvasToImage(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  currentPage: 1,
  totalPages: 0,
  pdfInfo: [],
  pageInfo: [],
  imagePath: '',
  pdfFile: null,
  renderedPages: [],

  selectedElementId: null,
  hoveredElementId: null,
  toolMode: 'select',
  rightPanelTab: 'list',
  zoom: 100,
  leftPanelWidth: 0,

  dirtyPages: new Set<number>(),
  elementDraftContent: null,
  apiStatus: 'idle',
  apiError: null,

  loadDocument: (pages, pageInfo, imagePath) =>
    set({
      pdfInfo: pages,
      pageInfo,
      imagePath,
      totalPages: pages.length,
      currentPage: 1,
      pdfFile: null,
      renderedPages: [],
      apiStatus: 'done',
      apiError: null,
    }),

  loadDocumentFromApi: async (file: File) => {
    try {
      set({ apiStatus: 'loading', apiError: null });
      
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument(new Uint8Array(arrayBuffer));
      const pdf = await loadingTask.promise;
      
      const page = await pdf.getPage(1);
      const scale = 2.0;
      const viewport = page.getViewport({ scale });
      
      const canvasEl = document.createElement('canvas');
      canvasEl.width = viewport.width;
      canvasEl.height = viewport.height;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');
      
      // 强制填充白色背景，这是解决 "黑框" 最稳妥的方法
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

      await page.render({ 
        canvasContext: ctx, 
        viewport, 
        isEvalSupported: false, 
        enableWebGL: false,
        background: 'white' 
      }).promise;
      
      const imageBase64 = canvasToImage(canvasEl);
      
      set({
        renderedPages: [{ imageBase64, width: viewport.width, height: viewport.height }],
        apiStatus: 'calling_layout'
      });

      const { API_CONFIG } = await import('../api/config');
      const cfg = API_CONFIG.layoutModel;

      const resp = await fetch(`${cfg.url}${cfg.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: imageBase64 }),
      });
      
      if (!resp.ok) throw new Error(`Layout API ${resp.status}`);
      const layoutResult = (await resp.json()) as LayoutResult;
      
      const pageInfoObj = layoutResult.pageInfo || layoutResult.page_info || { width: viewport.width, height: viewport.height };

      set({ apiStatus: 'calling_ocr' });

      const ocrCfg = API_CONFIG.ocrModel;
      
      const ocrResp = await fetch(`${ocrCfg.url}${ocrCfg.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: imageBase64,
          layout_bboxes: layoutResult.elements.map((e) => ({
            poly: e.poly,
            category_type: e.category_type,
          })),
        }),
      });
      
      if (!ocrResp.ok) {
        throw new Error(`OCR API failed with status ${ocrResp.status}`);
      }
      
      const ocrJson = await ocrResp.json();

      const elements = ((ocrJson as any).elements || []).map(
        (el: { category_type: string; text: string }, i: number) => ({
          id: `el_${i}_${Date.now()}`,
          category_type: el.category_type as PdfElement['category_type'],
          poly: layoutResult.elements[i]?.poly || [0, 0, 0, 0, 0, 0, 0, 0],
          order: i,
          latex: el.category_type === 'equation' ? el.text : '',
          html: el.category_type === 'table' ? el.text : '',
          markdown: el.text || '',
          image_path: '',
        }),
      );

      set({
        pdfInfo: [{ pdf_info: elements, page_info: pageInfoObj }],
        pageInfo: [pageInfoObj],
        imagePath: file.name,
        pdfFile: file,
        totalPages: 1,
        currentPage: 1,
        apiStatus: 'done',
      });
    } catch (e: any) {
      console.error('loadDocumentFromApi error:', e);
      set({ apiStatus: 'error', apiError: e.message || 'Unknown error' });
    }
  },

  setCurrentPage: (page) => set({ currentPage: page, selectedElementId: null, hoveredElementId: null }),

  setSelectedElementId: (id) => set({ selectedElementId: id, rightPanelTab: id ? 'detail' : 'list' }),

  setHoveredElementId: (id) => set({ hoveredElementId: id }),

  setToolMode: (mode) => set({ toolMode: mode }),

  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),

  setZoom: (zoom) => set({ zoom }),

  setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),

  getPageElements: () => get().pdfInfo[get().currentPage - 1]?.pdf_info || [],

  getPageInfo: () => get().pageInfo[get().currentPage - 1],

  updateElement: (elementId, updates) =>
    set((state) => {
      const newPdfInfo = [...state.pdfInfo];
      const pageIndex = state.currentPage - 1;
      const elements = [...newPdfInfo[pageIndex].pdf_info];
      const idx = elements.findIndex((e) => e.id === elementId);
      if (idx !== -1) {
        elements[idx] = { ...elements[idx], ...updates };
  newPdfInfo[pageIndex] = { ...newPdfInfo[pageIndex], pdf_info: elements };
      }
      return { pdfInfo: newPdfInfo };
    }),

  addElement: (element) =>
    set((state) => {
      const newPdfInfo = [...state.pdfInfo];
      const pageIndex = state.currentPage - 1;
      const elements = [...newPdfInfo[pageIndex].pdf_info, element];
      newPdfInfo[pageIndex] = { ...newPdfInfo[pageIndex], pdf_info: elements };
      return { pdfInfo: newPdfInfo };
    }),

  removeElement: (elementId) =>
    set((state) => {
      const pageIndex = state.currentPage - 1;
      const elements = state.pdfInfo[pageIndex].pdf_info.filter((e) => e.id !== elementId);
      const reindexed = elements.map((e, i) => ({ ...e, order: i }));
      const newPdfInfo = [...state.pdfInfo];
      newPdfInfo[pageIndex] = { ...newPdfInfo[pageIndex], pdf_info: reindexed };
      return { pdfInfo: newPdfInfo };
    }),

  reorderElements: (fromOrder, toOrder) =>
    set((state) => {
      const pageIndex = state.currentPage - 1;
      const elements = [...state.pdfInfo[pageIndex].pdf_info];
      const [moved] = elements.splice(fromOrder, 1);
      elements.splice(toOrder, 0, moved);
      const reindexed = elements.map((e, i) => ({ ...e, order: i }));
      const newPdfInfo = [...state.pdfInfo];
      newPdfInfo[pageIndex] = { ...newPdfInfo[pageIndex], pdf_info: reindexed };
      return { pdfInfo: newPdfInfo };
    }),

  markPageDirty: () => set((state) => ({ dirtyPages: new Set(state.dirtyPages).add(state.currentPage) })),

  markPageClean: () => set((state) => ({ dirtyPages: new Set(state.dirtyPages).delete(state.currentPage) })),

  isPageDirty: () => get().dirtyPages.has(get().currentPage),

  updateDraftContent: (content) => set({ elementDraftContent: content }),

  getNextOrder: () => get().pdfInfo[get().currentPage - 1]?.pdf_info.length || 0,
}));
