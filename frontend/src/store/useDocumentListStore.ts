import { create } from 'zustand';
import type { PdfDocument, DocumentStatus, ParsedPageData } from '../types/document';

export type AppView = 'list' | 'annotate';

const STORAGE_KEY = 'parsedDocuments_v1';
const MAX_STORAGE_BYTES = 4 * 1024 * 1024; // 4MB safety margin under 5MB

interface PersistedDoc {
  name: string;
  pageCount: number;
  status: DocumentStatus;
  parsedData: ParsedPageData[];
  error: string | null;
  savedAt: number;
}

function toPersisted(doc: PdfDocument): PersistedDoc {
  return {
    name: doc.name,
    pageCount: doc.pageCount,
    status: doc.status,
    parsedData: doc.parsedData,
    error: doc.error,
    savedAt: Date.now(),
  };
}

function fromPersisted(p: PersistedDoc, id: string): PdfDocument {
  return {
    id: `saved_${p.name}_${id}`,
    file: null as unknown as File,
    name: p.name,
    pageCount: p.pageCount,
    status: 'saved',
    parsedData: p.parsedData,
    error: p.error,
  };
}

function loadPersisted(): PersistedDoc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PersistedDoc[];
  } catch {
    return [];
  }
}

function savePersisted(docs: PersistedDoc[]) {
  try {
    const json = JSON.stringify(docs);
    if (json.length > MAX_STORAGE_BYTES) {
      const trimmed = docs.slice(Math.max(0, docs.length - Math.floor(docs.length * 0.7)));
      const retry = JSON.stringify(trimmed);
      if (retry.length <= MAX_STORAGE_BYTES) {
        localStorage.setItem(STORAGE_KEY, retry);
      }
    } else {
      localStorage.setItem(STORAGE_KEY, json);
    }
  } catch {
    const trimmed = docs.slice(Math.max(0, docs.length - Math.floor(docs.length * 0.7)));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // still failing — clear all
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

function removePersisted(name: string) {
  const docs = loadPersisted().filter((d) => d.name !== name);
  savePersisted(docs);
}

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
  loadFromLocalStorage: () => void;
  reparseDocument: (id: string, file: File) => void;
  loadSavedDocument: (id: string, file: File) => void;
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

  loadFromLocalStorage: () => {
    const persisted = loadPersisted();
    if (persisted.length === 0) return;
    const savedDocs: PdfDocument[] = persisted.map((p) => fromPersisted(p, Math.random().toString(36).slice(2, 9)));
    set((state) => ({ documents: [...savedDocs, ...state.documents] }));
  },

  addDocuments: (files: File[]) =>
    set((state) => {
      const persisted = loadPersisted();
      const persistedNames = new Set(persisted.map((p) => p.name));

      const newDocs: PdfDocument[] = files
        .filter((file) => !persistedNames.has(file.name))
        .map((file) => ({
          id: generateId(),
          file,
          name: file.name,
          pageCount: 0,
          status: 'pending',
          parsedData: [],
          error: null,
        }));

      const existingDocs: PdfDocument[] = files
        .filter((file) => persistedNames.has(file.name))
        .map((file) => {
          const p = persisted.find((d) => d.name === file.name)!;
          return { ...fromPersisted(p, Math.random().toString(36).slice(2, 9)), file };
        });

      return { documents: [...state.documents, ...newDocs, ...existingDocs] };
    }),

  setPageCount: (id, pageCount) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, pageCount } : doc,
      ),
    })),

  updateDocumentStatus: (id, status, parsedData, error) =>
    set((state) => {
      const docs = state.documents.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              status,
              ...(parsedData !== undefined ? { parsedData } : {}),
              ...(error !== undefined ? { error } : {}),
            }
          : doc,
      );

      // Persist if done
      const updatedDoc = docs.find((d) => d.id === id);
      if (updatedDoc && status === 'done' && updatedDoc.parsedData.length > 0) {
        const allDocs = loadPersisted().filter((d) => d.name !== updatedDoc.name);
        allDocs.push(toPersisted(updatedDoc));
        savePersisted(allDocs);
      }
      // Un-persist if error
      if (updatedDoc && status === 'error') {
        removePersisted(updatedDoc.name);
      }

      return { documents: docs };
    }),

  reparseDocument: (id, file) => {
    const doc = get().documents.find((d) => d.id === id);
    if (!doc) return;
    // Restore file, set back to pending, trigger parse
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id
          ? { ...d, file, status: 'pending' as DocumentStatus, error: null, parsedData: [] }
          : d,
      ),
    }));
  },

  loadSavedDocument: (id, file) => {
    const doc = get().documents.find((d) => d.id === id);
    if (!doc) return;
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, file } : d,
      ),
    }));
    get().selectDocument(id);
  },

  selectDocument: (id) => {
    const doc = get().documents.find((d) => d.id === id);
    if (doc && (doc.status === 'done' || doc.status === 'saved')) {
      set({ selectedDocumentId: id, appView: 'annotate' });
    }
  },

  goBackToList: () => set({ appView: 'list', selectedDocumentId: null }),

  getNextPendingDocument: () => {
    return get().documents.find((doc) => doc.status === 'pending') || null;
  },

  resetAll: () => set({ documents: [], selectedDocumentId: null, appView: 'list' }),

  removeDocument: (id) =>
    set((state) => {
      const doc = state.documents.find((d) => d.id === id);
      if (doc) removePersisted(doc.name);
      return {
        documents: state.documents.filter((doc) => doc.id !== id),
        selectedDocumentId: state.selectedDocumentId === id ? null : state.selectedDocumentId,
      };
    }),
}));
