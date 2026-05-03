import { create } from 'zustand';
import type { PdfInfo, PageInfo, PdfElement } from '../types/omnidoc';

export type ToolMode = 'select' | 'create';
export type ApiStatus = 'idle' | 'calling_layout' | 'calling_ocr' | 'done' | 'loading' | 'error';

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
  zoom: number;
  leftPanelWidth: number;

  dirtyPages: Set<number>;
  elementDraftContent: string | null;
  apiStatus: ApiStatus;
  apiError: string | null;

  loadDocument: (pages: PdfInfo[], pageInfo: PageInfo[], imagePath: string) => void;
  resetState: () => void;
  setCurrentPage: (page: number) => void;
  setSelectedElementId: (id: string | null) => void;
  setHoveredElementId: (id: string | null) => void;
  setToolMode: (mode: ToolMode) => void;
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

  resetState: () => set({
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
    zoom: 100,
    dirtyPages: new Set<number>(),
    elementDraftContent: null,
    apiStatus: 'idle',
    apiError: null,
  }),

  setCurrentPage: (page) => set({ currentPage: page, selectedElementId: null, hoveredElementId: null }),

  setSelectedElementId: (id) => set({ selectedElementId: id }),

  setHoveredElementId: (id) => set({ hoveredElementId: id }),

  setToolMode: (mode) => set({ toolMode: mode }),

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

  markPageClean: () => set((state) => { const next = new Set(state.dirtyPages); next.delete(state.currentPage); return { dirtyPages: next }; }),

  isPageDirty: () => get().dirtyPages.has(get().currentPage),

  updateDraftContent: (content) => set({ elementDraftContent: content }),

  getNextOrder: () => get().pdfInfo[get().currentPage - 1]?.pdf_info.length || 0,
}));
