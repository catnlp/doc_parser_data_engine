import { useState, useCallback, useRef } from 'react';
import './styles/annotation.css';
import { useAnnotationStore } from './store/useAnnotationStore';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { LeftPanel } from './components/left-panel/LeftPanel';
import { RightPanel } from './components/right-panel/RightPanel';
import { ResizableSplit } from './components/ResizableSplit';

function App() {
  const loadDocumentFromApi = useAnnotationStore((s) => s.loadDocumentFromApi);
  const apiStatus = useAnnotationStore((s) => s.apiStatus);
  const apiError = useAnnotationStore((s) => s.apiError);
  const initialized = apiStatus === 'done' || apiStatus === 'error';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      console.log('Selected file:', file.name);
      await loadDocumentFromApi(file);
    } catch (err: any) {
      console.error('File upload error:', err);
    }
  };

  if (!initialized) {
    return (
      <div className="loading-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          {(apiStatus === 'idle' || apiStatus === 'loading') && (
            <>
              <p style={{ marginBottom: 16, color: '#666' }}>选择 PDF 文档开始标注</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '12px 32px', fontSize: 16, background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              >
                选择 PDF 文件
              </button>
              {apiStatus === 'loading' && (
                <p style={{ marginTop: 16, color: '#666' }}>正在处理 PDF...</p>
              )}
            </>
          )}
          {apiStatus === 'calling_layout' && (
            <div>
              <p className="spinner" style={{ marginBottom: 12 }}>⏳</p>
              <p>正在分析版面...</p>
            </div>
          )}
          {apiStatus === 'calling_ocr' && (
            <div>
              <p className="spinner" style={{ marginBottom: 12 }}>⏳</p>
              <p>正在调用 OCR 解析文本...</p>
            </div>
          )}
          {apiStatus === 'error' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#ef4444', marginBottom: 12 }}>⚠️ 处理出错</p>
              <p style={{ color: '#666', marginBottom: 16 }}>{apiError}</p>
              <button
                onClick={() => {
                  useAnnotationStore.setState({ apiStatus: 'idle', apiError: null });
                  setTimeout(() => fileInputRef.current?.click(), 100);
                }}
                style={{ padding: '8px 24px', fontSize: 14, background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
              >
                重试
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <PageLoader />;
}

function PageLoader() {
  const currentPage = useAnnotationStore((s) => s.currentPage);
  const totalPages = useAnnotationStore((s) => s.totalPages);
  const pdfInfo = useAnnotationStore((s) => s.pdfInfo);
  const pageInfo = useAnnotationStore((s) => s.pageInfo);
  const renderedPages = useAnnotationStore((s) => s.renderedPages);
  const pdfFile = useAnnotationStore((s) => s.pdfFile);

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
        {(leftWidth) => (
          <LeftPanel
            width={leftWidth}
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

