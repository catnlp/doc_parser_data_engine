import { create } from 'zustand';
import type { PdfDocument, DocumentStatus, ParsedPageData } from '../types/document';
import { saveImage, getDocImages, deleteDocImages } from '../utils/idb';
import type { PersistedDocMeta } from '../types/storage';

export type AppView = 'list' | 'annotate';

const STORAGE_KEY = 'parsedDocuments_v1';

function imageKey(docName: string): string {
  return `persisted_${docName}`;
}

interface PersistedDoc extends PersistedDocMeta {
  parsedData: ParsedPageData[];
}

function toPersisted(doc: PdfDocument): PersistedDoc {
  return {
    name: doc.name,
    pageCount: doc.pageCount,
    status: doc.status,
    parsedData: doc.parsedData.map(({ imageBase64, ...rest }) => rest) as unknown as ParsedPageData[],
    error: doc.error,
    parsedPageCount: doc.parsedData.length,
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
    parsedPageCount: p.parsedPageCount ?? p.parsedData.length,
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
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
  imagesRestored: boolean;

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
  restoreFromIndexedDB: () => Promise<void>;
}

function generateId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const useDocumentListStore = create<DocumentListStore>((set, get) => ({
  documents: [],
  selectedDocumentId: null,
  appView: 'list',
  imagesRestored: false,

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
    set((state) => {
      const existingNames = new Set(state.documents.map((d) => d.name));
      const savedDocs: PdfDocument[] = persisted
        .filter((p) => !existingNames.has(p.name))
        .map((p) => fromPersisted(p, Math.random().toString(36).slice(2, 9)));
      return { documents: [...state.documents, ...savedDocs] };
    });
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
          parsedPageCount: 0,
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
              ...(parsedData !== undefined ? { parsedData, parsedPageCount: parsedData.length } : {}),
              ...(error !== undefined ? { error } : {}),
            }
          : doc,
      );

      // Persist if done
      const updatedDoc = docs.find((d) => d.id === id);
      if (updatedDoc && status === 'done' && updatedDoc.parsedData.length > 0) {
        const key = imageKey(updatedDoc.name);
        for (let i = 0; i < updatedDoc.parsedData.length; i++) {
          const page = updatedDoc.parsedData[i];
          if (page.imageBase64) {
            saveImage(key, i, page.imageBase64, page.width, page.height)
              .catch(err => console.warn('Failed to save image to IndexedDB:', err));
          }
        }
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
          ? { ...d, file, status: 'pending' as DocumentStatus, error: null, parsedData: [], parsedPageCount: 0 }
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
      if (doc) {
        removePersisted(doc.name);
        deleteDocImages(imageKey(doc.name)).catch(err => console.warn('Failed to delete images from IndexedDB:', err));
      }
      return {
        documents: state.documents.filter((doc) => doc.id !== id),
        selectedDocumentId: state.selectedDocumentId === id ? null : state.selectedDocumentId,
      };
    }),

  restoreFromIndexedDB: async () => {
    const savedDocs = get().documents.filter((d) => d.status === 'saved');

    for (const doc of savedDocs) {
      const pages = doc.parsedData;
      if (pages.length === 0 || pages[0]?.imageBase64) continue;

      const key = imageKey(doc.name);
      const images = await getDocImages(key);
      if (!images || images.size === 0) continue;

      const restored = pages.map((page, idx) => {
        const stored = images.get(idx);
        if (stored?.imageBase64) {
          return { ...page, imageBase64: stored.imageBase64 };
        }
        return page;
      });

      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === doc.id ? { ...d, parsedData: restored } : d,
        ),
      }));
    }

    set({ imagesRestored: true });
  },
}));
