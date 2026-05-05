import { useCallback, useEffect } from 'react';
import { useDocumentListStore } from '../store/useDocumentListStore';
import { useAnnotationStore } from '../store/useAnnotationStore';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { LeftPanel } from '../components/left-panel/LeftPanel';
import { RightPanel } from '../components/right-panel/RightPanel';
import { ResizableSplit } from '../components/ResizableSplit';
import type { PdfDocument } from '../types/document';
import type { PdfElement } from '../types/omnidoc';

export default function AnnotateScreen() {
  const selectedDocumentId = useDocumentListStore((s) => s.selectedDocumentId);
  const imagesRestored = useDocumentListStore((s) => s.imagesRestored);
  const pdfFile = useAnnotationStore((s) => s.pdfFile);

  const currentPage = useAnnotationStore((s) => s.currentPage);
  const totalPages = useAnnotationStore((s) => s.totalPages);
  const pdfInfo = useAnnotationStore((s) => s.pdfInfo);
  const pageInfo = useAnnotationStore((s) => s.pageInfo);
  const renderedPages = useAnnotationStore((s) => s.renderedPages);

  useEffect(() => {
    if (!selectedDocumentId) return;

    const doc = useDocumentListStore.getState().documents.find((d) => d.id === selectedDocumentId);
    if (!doc) return;

    loadDocument(doc);
  }, [selectedDocumentId]);

  const loadDocument = (doc: PdfDocument) => {
    const totalPages = doc.parsedData.length;
    if (totalPages === 0) return;

    const pdfInfoList: Array<{ pdf_info: PdfElement[]; page_info: { width: number; height: number } }> = [];
    const pageInfoList: Array<{ width: number; height: number }> = [];
    const renderedPagesList: Array<{ imageBase64: string; width: number; height: number }> = [];

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
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
      totalPages,
      currentPage: 1,
      apiStatus: 'done',
      renderedPages: renderedPagesList,
    });
  };

  const handlePageChange = useCallback((page: number) => {
    useAnnotationStore.getState().setCurrentPage(page);
  }, []);

  const currentPageData = pdfInfo[currentPage - 1];
  const currentPageInfo = pageInfo[currentPage - 1];
  const renderedPage = renderedPages[currentPage - 1];

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
      <TopBar onPageChange={handlePageChange} pdfFile={pdfFile} totalPages={totalPages} />
      <ResizableSplit minWidthLeft={320} minWidthRight={320} initialRatio={0.55}>
        {() => (
          <LeftPanel
            pdfFile={pdfFile}
            pageNumber={currentPage}
            pageInfo={{ width: currentPageInfo.width, height: currentPageInfo.height }}
            renderedImage={renderedPage?.imageBase64 || null}
          />
        )}
        {() => <RightPanel />}
      </ResizableSplit>
      <BottomNav onPageChange={handlePageChange} />
    </div>
  );
}
