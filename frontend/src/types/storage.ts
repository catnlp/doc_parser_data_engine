export interface PersistedDocMeta {
  name: string;
  pageCount: number;
  status: string;
  parsedData: Array<{
    width: number;
    height: number;
    layoutElements: Array<{ category_type: string; poly: number[]; order: number; score: number }>;
    ocrElements: Array<{ category_type: string; text: string; poly: number[] }>;
    // NOTE: no imageBase64 here! Images are stored in IndexedDB.
  }>;
  error: string | null;
  parsedPageCount: number;
  savedAt: number;
}
