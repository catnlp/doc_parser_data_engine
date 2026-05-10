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
  | 'equation'
  | 'formula'
  | 'display_formula'
  | 'image'
  | 'image_caption'
  | 'chart';

export interface BBox {
  poly: number[]; // bbox [left, top, right, bottom]
}

export interface PageInfo {
  height: number;
  width: number;
}

export interface PdfElement {
  id: string; // 前端生成的唯一标识
  category_type: ElementType;
  poly: number[]; // [left, top, right, bottom]
  order: number;
  latex: string;
  html: string;
  markdown: string;
  image_path: string;
  demoted?: boolean;
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
