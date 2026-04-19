import { create } from 'zustand';
import type { PdfDocument, DocumentStatus, ParsedPageData } from '../types/document';

export type AppView = 'list' | 'annotate';

interface DocumentListStore {
  documents: PdfDocument[];
  selectedDocumentId: string | null;
  appView: AppView;
  selectedDocument: PdfDocument | null;
  hasParsingDocuments: boolean;

  addDocuments: (files: File[]) => void;
  setPageCount: (id: string, pageCount: number) => void;
  updateDocumentStatus: (id: string, status: DocumentStatus, parsedData?: ParsedPageData[], error?: string) => void;
  selectDocument: (id: string) => void;
  goBackToList: () => void;
  getNextPendingDocument: () => PdfDocument | null;
  resetAll: () => void;
  removeDocument: (id: string) => void;
}

function generateId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const useDocumentListStore = create<DocumentListStore>((set, get) => ({
  documents: [],
  selectedDocumentId: null,
  appView: 'list',

  get selectedDocument(): PdfDocument | null {
    const { documents, selectedDocumentId } = get();
    if (!selectedDocumentId) return null;
    return documents.find((doc) => doc.id === selectedDocumentId) || null;
  },

  get hasParsingDocuments(): boolean {
    return get().documents.some((doc) => doc.status === 'parsing');
  },

  addDocuments: (files: File[]) =>
    set((state) => {
      const newDocs: PdfDocument[] = files.map((file) => ({
        id: generateId(),
        file,
        name: file.name,
        pageCount: 0,
        status: 'pending',
        parsedData: [],
        error: null,
      }));
      return { documents: [...state.documents, ...newDocs] };
    }),

  setPageCount: (id, pageCount) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, pageCount } : doc,
      ),
    })),

  updateDocumentStatus: (id, status, parsedData, error) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              status,
              ...(parsedData !== undefined ? { parsedData } : {}),
              ...(error !== undefined ? { error } : {}),
            }
          : doc,
      ),
    })),

  selectDocument: (id) => {
    const doc = get().documents.find((d) => d.id === id);
    if (doc && doc.status === 'done') {
      set({ selectedDocumentId: id, appView: 'annotate' });
    }
  },

  goBackToList: () => set({ appView: 'list', selectedDocumentId: null }),

  getNextPendingDocument: () => {
    return get().documents.find((doc) => doc.status === 'pending') || null;
  },

  resetAll: () => set({ documents: [], selectedDocumentId: null, appView: 'list' }),

  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
      selectedDocumentId: state.selectedDocumentId === id ? null : state.selectedDocumentId,
    })),
}));
