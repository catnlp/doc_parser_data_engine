/**
 * OmniDocBench 数据格式类型定义
 * 参考: https://github.com/opendatalab/OmniDocBench
 */

export type ElementType =
  | 'text'
  | 'title'
  | 'header'
  | 'footer'
  | 'table'
  | 'table_caption'
  | 'figure'
  | 'figure_caption'
  | 'equation';

export interface BBox {
  poly: number[]; // 8点坐标 [x1,y1,x2,y2,x3,y3,x4,y4]
}

export interface PageInfo {
  height: number;
  width: number;
}

export interface PdfElement {
  id: string; // 前端生成的唯一标识
  category_type: ElementType;
  poly: number[]; // [x1,y1,x2,y2,x3,y3,x4,y4]
  order: number;
  latex: string;
  html: string;
  markdown: string;
  image_path: string;
}

export interface PdfInfo {
  pdf_info: PdfElement[];
  page_info: PageInfo;
  image_path?: string;
}

/**
 * 前端扩展的 PDF 文档模型（多页）
 */
export interface DocumentModel {
  image_path: string;
  pages: PdfInfo[];
}
