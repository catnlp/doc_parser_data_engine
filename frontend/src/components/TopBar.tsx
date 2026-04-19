import { useRef, useCallback } from 'react';
import JSZip from 'jszip';
import { useAnnotationStore } from '../store/useAnnotationStore';
import { useDocumentListStore } from '../store/useDocumentListStore';
import type { PdfElement } from '../types/omnidoc';

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
  const pdfInfo = useAnnotationStore((s) => s.pdfInfo);
  const pageInfo = useAnnotationStore((s) => s.pageInfo);
  const renderedPages = useAnnotationStore((s) => s.renderedPages);
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

  const handleExport = useCallback(async () => {
    const pageData = pdfInfo[currentPage - 1];
    const pageInfoObj = pageInfo[currentPage - 1];
    const renderedPage = renderedPages[currentPage - 1];
    if (!pageData || !pageInfoObj) {
      alert('请先加载文档');
      return;
    }

    const elements = pageData.pdf_info || [];
    const zip = new JSZip();
    let figureIndex = 0;

    const processedElements: PdfElement[] = elements.map((el: PdfElement) => {
      const updated = { ...el };
      if (el.category_type === 'figure' && el.image_path && renderedPage) {
        figureIndex++;
        updated.image_path = `images/${figureIndex}.png`;
      }
      return updated;
    });

    const exportData = {
      page: currentPage,
      page_info: pageInfoObj,
      elements: processedElements,
    };

    zip.file('annotations.json', JSON.stringify(exportData, null, 2));

    if (renderedPage && figureIndex > 0) {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = renderedPage.imageBase64;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      for (const el of elements) {
        if (el.category_type !== 'figure' || !el.image_path) continue;
        const idx = elements.indexOf(el) + 1;
        const poly = el.poly;
        const xMin = Math.min(poly[0], poly[2], poly[4], poly[6]);
        const yMin = Math.min(poly[1], poly[3], poly[5], poly[7]);
        const xMax = Math.max(poly[0], poly[2], poly[4], poly[6]);
        const yMax = Math.max(poly[1], poly[3], poly[5], poly[7]);

        // Scale: poly coords are in PDF points, rendered image is at 2x
        const scaleX = renderedPage.width / pageInfoObj.width;
        const scaleY = renderedPage.height / pageInfoObj.height;

        canvas.width = Math.round((xMax - xMin) * scaleX);
        canvas.height = Math.round((yMax - yMin) * scaleY);

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          img,
          xMin * scaleX, yMin * scaleY,
          (xMax - xMin) * scaleX, (yMax - yMin) * scaleY,
          0, 0, canvas.width, canvas.height,
        );

        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        zip.file(`images/${idx}.png`, base64, { base64: true });
      }
    }

    const fileName = pdfFile
      ? `${pdfFile.name.replace(/\.pdf$/i, '')}_${currentPage}.zip`
      : `page_${currentPage}.zip`;

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentPage, pdfInfo, pageInfo, renderedPages, pdfFile]);

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
        <button className="primary" onClick={handleExport} disabled={!pdfInfo[currentPage - 1]}>📦 导出</button>
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
