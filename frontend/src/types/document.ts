export type DocumentStatus = 'pending' | 'parsing' | 'done' | 'error' | 'saved';

export interface ParsedPageData {
  imageBase64: string;
  width: number;
  height: number;
  layoutElements: Array<{ category_type: string; poly: number[]; order: number; score: number }>;
  ocrElements: Array<{ category_type: string; text: string; poly: number[]; latex?: string; html?: string }>;
}

export interface PdfDocument {
  id: string;
  file: File;
  name: string;
  pageCount: number;
  status: DocumentStatus;
  parsedData: ParsedPageData[];
  error: string | null;
  parsedPageCount: number;
}
