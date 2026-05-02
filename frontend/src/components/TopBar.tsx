import { useRef } from 'react';
import { useAnnotationStore } from '../store/useAnnotationStore';
import { useDocumentListStore } from '../store/useDocumentListStore';

interface TopBarProps {
  onPageChange: (page: number) => void;
  pdfFile: File | null;
  totalPages: number;
}

export function TopBar({ onPageChange, pdfFile, totalPages }: TopBarProps) {
  const currentPage = useAnnotationStore((s) => s.currentPage);
  const zoom = useAnnotationStore((s) => s.zoom);
  const toolMode = useAnnotationStore((s) => s.toolMode);
  const setZoom = useAnnotationStore((s) => s.setZoom);
  const setToolMode = useAnnotationStore((s) => s.setToolMode);
  const loadDocumentFromApi = useAnnotationStore((s) => s.loadDocumentFromApi);
  const goBackToList = useDocumentListStore((s) => s.goBackToList);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBack = () => {
    goBackToList();
    useAnnotationStore.getState().resetState();
  };

  const handleReload = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadDocumentFromApi(file);
  };

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };
  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };
  const handleZoomIn = () => setZoom(Math.min(200, zoom + 10));
  const handleZoomOut = () => setZoom(Math.max(50, zoom - 10));

  return (
    <div className="topbar">
      <div className="page-nav">
        <button className="back-btn" onClick={handleBack}>← 返回列表</button>
        <span>|</span>
        <button onClick={handlePrev} disabled={currentPage <= 1}>上一页</button>
        {pdfFile && <span style={{ fontSize: 11, color: '#999', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdfFile.name}</span>}
        <span>{currentPage} / {totalPages}</span>
        <button onClick={handleNext} disabled={currentPage >= totalPages}>下一页</button>
      </div>
      <div className="zoom-control">
        <span>Zoom:</span>
        <button onClick={handleZoomOut}>−</button>
        <span style={{ minWidth: 40, textAlign: 'center' }}>{zoom}%</span>
        <button onClick={handleZoomIn}>+</button>
      </div>
      <div className="tool-toggle">
        <button
          className={`tool-btn ${toolMode === 'select' ? 'active' : ''}`}
          onClick={() => setToolMode('select')}
        >
          ◇ 选择
        </button>
        <button
          className={`tool-btn ${toolMode === 'create' ? 'active' : ''}`}
          onClick={() => setToolMode('create')}
        >
          ▭ 框选
        </button>
      </div>
      <div className="actions">
        <button className="primary" onClick={handleReload}>📂 打开</button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
