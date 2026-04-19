import { useCallback, useEffect } from 'react';
import './styles/annotation.css';
import './styles/upload.css';
import './styles/document-list.css';
import { useAnnotationStore } from './store/useAnnotationStore';
import { useDocumentListStore } from './store/useDocumentListStore';
import { FolderUpload } from './components/FolderUpload';
import { PdfListView } from './components/PdfListView';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { LeftPanel } from './components/left-panel/LeftPanel';
import { RightPanel } from './components/right-panel/RightPanel';
import { ResizableSplit } from './components/ResizableSplit';
import { parseAllPendingDocuments } from './utils/parsePdf';
import type { PdfDocument } from './types/document';
import type { PdfElement } from './types/omnidoc';

function App() {
  const appView = useDocumentListStore((s) => s.appView);

  if (appView === 'list') {
    return <ListScreen />;
  }
  return <AnnotateScreen />;
}

function ListScreen() {
  const addDocuments = useDocumentListStore((s) => s.addDocuments);
  const isParsing = useDocumentListStore((s) => s.hasParsingDocuments);

  const handleFilesSelected = useCallback((files: File[]) => {
    addDocuments(files);
    setTimeout(() => {
      parseAllPendingDocuments();
    }, 100);
  }, [addDocuments]);

  useEffect(() => {
    if (!isParsing) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isParsing]);

  return (
    <div className="list-screen">
      <FolderUpload onFilesSelected={handleFilesSelected} />
      <PdfListView />
    </div>
  );
}

function AnnotateScreen() {
  const selectedDocumentId = useDocumentListStore((s) => s.selectedDocumentId);
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
        latex: el.category_type === 'equation' ? el.text : '',
        html: el.category_type === 'table' ? el.text : '',
        markdown: el.text || '',
        image_path: '',
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

export default App;
