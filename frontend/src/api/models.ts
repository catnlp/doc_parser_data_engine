import { API_CONFIG } from './config';
import type { PageInfo, PdfElement } from '../types/omnidoc';

export interface OcrResponse {
  elements: Array<{ category_type: string; text: string; poly: number[] }>;
}

export interface LayoutResult {
  pageInfo: PageInfo;
  elements: Array<{
    category_type: string;
    poly: number[];
    order: number;
    bbox?: number[];
  }>;
}

export interface ParsedElement {
  category_type: string;
  text: string;
  confidence: number;
}

async function postJson<T>(url: string, body: unknown, timeout = 30000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    return (await resp.json()) as T;
  } catch (e: unknown) {
    clearTimeout(timer);
    if (e instanceof Error && e.name === 'AbortError') throw new Error('API 请求超时');
    throw e;
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function callLayoutModel(file: File): Promise<LayoutResult> {
  const base64 = await fileToBase64(file);
  const cfg = API_CONFIG.layoutModel;
  try {
    return await postJson<LayoutResult>(
      `${cfg.url}${cfg.endpoint}`,
      { image_base64: base64 },
      cfg.timeout,
    );
  } catch {
    return mockLayoutData();
  }
}

export async function mockLayoutData(): Promise<LayoutResult> {
    return {
      pageInfo: { width: 500, height: 500 },
      elements: [
        { category_type: 'text', poly: [50, 50, 450, 50, 450, 250, 50, 250], order: 0 },
        { category_type: 'figure', poly: [50, 270, 450, 270, 450, 480, 50, 480], order: 1 }
      ]
    };
}

export async function callOcrModel(
  file: File,
  layoutResult: LayoutResult,
): Promise<PdfElement[]> {
  const base64 = await fileToBase64(file);
  const cfg = API_CONFIG.ocrModel;
  try {
    const response = await postJson<{ elements: ParsedElement[] }>(
      `${cfg.url}${cfg.endpoint}`,
      {
        image_base64: base64,
        layout_bboxes: layoutResult.elements.map((e) => ({
          poly: e.poly,
          category_type: e.category_type,
        })),
      },
      cfg.timeout,
    );
    return response.elements.map((el, i) => {
      const layoutEl = layoutResult.elements[i];
      return {
        id: `el_${i}_${Date.now()}`,
        category_type: el.category_type as PdfElement['category_type'],
        poly: layoutEl?.poly || [0, 0, 0, 0, 0, 0, 0, 0],
        order: i,
        latex: (el.category_type === 'equation' || el.category_type === 'formula' || el.category_type === 'display_formula') ? el.text : '',
        html: el.category_type === 'table' ? el.text : '',
        markdown: el.text || '',
        image_path: '',
      };
    });
  } catch {
    return mockOcrData(layoutResult);
  }
}

// Mock fallback
function mockOcrData(layout: LayoutResult): PdfElement[] {
  const contents: Record<string, string> = {
    header: 'Attention Is All You Need — ACL 2 Aug 2023',
    title: '# Attention Is All You Need',
    text: 'Provided proper attribution is provided, Google hereby grants permission to reproduce the tables and figures in this paper solely for use in journalistic or scholarly works.',
    figure: '',
    figure_caption: '图 1: 论文首页布局示意图',
    footer: '© 2023 Google Brain',
  };
  return layout.elements.map((el, i) => ({
    id: `el_${i}_${Date.now()}`,
    category_type: el.category_type as PdfElement['category_type'],
    poly: el.poly,
    order: el.order,
    latex: '',
    html: '',
    markdown: contents[el.category_type] || `[${el.category_type}]`,
    image_path: '',
  }));
}
