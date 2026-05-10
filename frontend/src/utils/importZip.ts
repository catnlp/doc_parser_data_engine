import JSZip from 'jszip';
import type { PdfDocument, ParsedPageData } from '../types/document';

interface ZipExportElement {
  category_type: string;
  poly: number[];
  order: number;
  text?: string;
  html?: string;
  latex?: string;
}

interface ZipExportPage {
  page_number: number;
  image_path: string;
  page_info: { width: number; height: number };
  elements: ZipExportElement[];
}

interface ZipExportResult {
  document_name: string;
  total_pages: number;
  pages: ZipExportPage[];
}

export async function importDocumentFromZip(file: File): Promise<PdfDocument> {
  const zip = await JSZip.loadAsync(file);

  // Find the base folder (first folder in ZIP)
  const folderNames = Object.keys(zip.files)
    .filter(name => name.endsWith('/') && !name.includes('__MACOSX'))
    .sort((a, b) => a.length - b.length);
  const baseFolder = folderNames[0];
  if (!baseFolder) throw new Error('无效的导入文件：ZIP 中没有找到数据文件夹');

  // Read result.json
  const jsonPath = baseFolder + 'result.json';
  const jsonFile = zip.file(jsonPath);
  if (!jsonFile) throw new Error('无效的导入文件：缺少 result.json');

  let result: ZipExportResult;
  try {
    const jsonStr = await jsonFile.async('string');
    result = JSON.parse(jsonStr);
  } catch {
    throw new Error('导入文件格式不正确，无法解析 result.json');
  }

  if (!result.pages || !Array.isArray(result.pages)) {
    throw new Error('导入文件格式不正确：result.json 缺少 pages 字段');
  }

  // Build ParsedPageData for each page
  const parsedData: ParsedPageData[] = [];

  for (const page of result.pages) {
    const imagePath = baseFolder + page.image_path;
    const imageFile = zip.file(imagePath);

    if (!imageFile) {
      console.warn(`导入警告：页面 ${page.page_number} 图片 ${page.image_path} 不存在，跳过该页`);
      continue;
    }

    const imageBase64Raw = await imageFile.async('base64');
    const imageBase64 = `data:image/png;base64,${imageBase64Raw}`;

    const ocrElements = page.elements.map((el) => {
      let poly = el.poly;
      if (poly.length === 8) {
        poly = [
          Math.min(poly[0], poly[2], poly[4], poly[6]),
          Math.min(poly[1], poly[3], poly[5], poly[7]),
          Math.max(poly[0], poly[2], poly[4], poly[6]),
          Math.max(poly[1], poly[3], poly[5], poly[7])
        ];
      }
      const element: any = {
        category_type: el.category_type,
        poly,
        text: '',
        score: 1.0,
        demoted: false,
      };

      if (el.html) element.html = el.html;
      if (el.latex) element.latex = el.latex;
      if (el.text) element.text = el.text;

      return element;
    });

    parsedData.push({
      imageBase64,
      width: page.page_info.width,
      height: page.page_info.height,
      layoutElements: [],
      ocrElements,
    });
  }

  if (parsedData.length === 0) {
    throw new Error('导入失败：没有成功解析任何页面');
  }

  const id = `imported_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    file: new File([], result.document_name),
    name: result.document_name,
    pageCount: result.total_pages,
    status: 'saved',
    parsedData,
    error: null,
    parsedPageCount: parsedData.length,
  };
}
