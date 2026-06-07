import { useEffect } from 'react';
import { useDocumentListStore } from '../store/useDocumentListStore';
import { useAnnotationStore } from '../store/useAnnotationStore';
import { FourPanelLayout } from '../components/FourPanelLayout';
import { ThumbnailNavigator } from '../components/ThumbnailNavigator';
import { DocViewer } from '../components/DocViewer';
import { ResultPanel } from '../components/ResultPanel';
import { ChatPanel } from '../components/ChatPanel';
import type { PdfDocument } from '../types/document';
import type { PdfElement } from '../types/omnidoc';

export default function AnnotateScreen() {
  const selectedDocumentId = useDocumentListStore((s) => s.selectedDocumentId);
  const imagesRestored = useDocumentListStore((s) => s.imagesRestored);

  const pdfInfo = useAnnotationStore((s) => s.pdfInfo);
  const pageInfo = useAnnotationStore((s) => s.pageInfo);

  useEffect(() => {
    if (!selectedDocumentId) return;
    const doc = useDocumentListStore.getState().documents.find((d) => d.id === selectedDocumentId);
    if (!doc) return;
    loadDocument(doc);
  }, [selectedDocumentId, imagesRestored]);

  const loadDocument = (doc: PdfDocument) => {
    const tp = doc.parsedData.length;
    if (tp === 0) return;

    const pdfInfoList: Array<{ pdf_info: PdfElement[]; page_info: { width: number; height: number } }> = [];
    const pageInfoList: Array<{ width: number; height: number }> = [];
    const renderedPagesList: Array<{ imageBase64: string; width: number; height: number }> = [];

    for (let pageIdx = 0; pageIdx < tp; pageIdx++) {
      const data = doc.parsedData[pageIdx];
      if (!data) break;

      const elements: PdfElement[] = data.ocrElements.map((el, i) => ({
        id: `el_${pageIdx}_${i}_${doc.id}`,
        category_type: el.category_type as PdfElement['category_type'],
        poly: el.poly,
        order: i,
        latex: (el.category_type === 'equation' || el.category_type === 'formula' || el.category_type === 'display_formula') ? (el.latex || el.text) : '',
        html: el.category_type === 'table' ? (el.html || el.text) : '',
        markdown: (el.category_type !== 'equation' && el.category_type !== 'formula' && el.category_type !== 'display_formula' && el.category_type !== 'table') ? (el.text || '') : '',
        image_path: '',
        demoted: !!el.demoted,
        confidence: el.confidence,
      }));

      pdfInfoList.push({ pdf_info: elements, page_info: { width: data.width, height: data.height } });
      pageInfoList.push({ width: data.width, height: data.height });
      renderedPagesList.push({ imageBase64: data.imageBase64, width: data.width, height: data.height });
    }

    useAnnotationStore.setState({
      pdfInfo: pdfInfoList,
      pageInfo: pageInfoList,
      imagePath: doc.name,
      pdfFile: doc.file,
      totalPages: tp,
      currentPage: 1,
      apiStatus: 'done',
      renderedPages: renderedPagesList,
      currentDocId: doc.id,
      activeResultView: 'parse',
      chatMessages: [],
      selectedContent: '',
      bboxVisible: true,
    });
  };

  const currentPage = useAnnotationStore((s) => s.currentPage);
  const currentPageData = pdfInfo[currentPage - 1];
  const currentPageInfo = pageInfo[currentPage - 1];

  if (!currentPageData || !currentPageInfo) return null;

  const hasSavedDocs = useDocumentListStore.getState().documents.some((d) => d.status === 'saved');
  if (!imagesRestored && hasSavedDocs) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#666' }}>
        加载中...
      </div>
    );
  }

  return (
    <div className="annotation-app">
      <FourPanelLayout
        panels={[
          { initialWidth: 14, minWidth: 10 },
          { initialWidth: 30, minWidth: 18 },
          { initialWidth: 36, minWidth: 22 },
          { initialWidth: 20, minWidth: 15 },
        ]}
      >
        <ThumbnailNavigator />
        <DocViewer />
        <ResultPanel />
        <ChatPanel />
      </FourPanelLayout>
    </div>
  );
}
