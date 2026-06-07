import { useRef, useState, useEffect, useCallback } from 'react';
import { useAnnotationStore } from '../store/useAnnotationStore';
import { useDocumentListStore } from '../store/useDocumentListStore';
import { BBOX_COLORS, TYPE_LABELS } from '../constants/elementTypes';
import { polyToSvgPoints, polyToBBox } from '../utils/poly';
import type { PdfElement } from '../types/omnidoc';

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function DocViewer() {
  const renderedPages = useAnnotationStore((s) => s.renderedPages);
  const pdfInfo = useAnnotationStore((s) => s.pdfInfo);
  const currentPage = useAnnotationStore((s) => s.currentPage);
  const totalPages = useAnnotationStore((s) => s.totalPages);
  const toolMode = useAnnotationStore((s) => s.toolMode);
  const bboxVisible = useAnnotationStore((s) => s.bboxVisible);
  const selectedElementId = useAnnotationStore((s) => s.selectedElementId);
  const hoveredElementId = useAnnotationStore((s) => s.hoveredElementId);
  const zoom = useAnnotationStore((s) => s.zoom);
  const setCurrentPage = useAnnotationStore((s) => s.setCurrentPage);
  const setSelectedElementId = useAnnotationStore((s) => s.setSelectedElementId);
  const setHoveredElementId = useAnnotationStore((s) => s.setHoveredElementId);
  const setToolMode = useAnnotationStore((s) => s.setToolMode);
  const setBboxVisible = useAnnotationStore((s) => s.setBboxVisible);
  const setSelectedContent = useAnnotationStore((s) => s.setSelectedContent);
  const setZoom = useAnnotationStore((s) => s.setZoom);
  const goBackToList = useDocumentListStore((s) => s.goBackToList);

  const containerRef = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef(currentPage);
  const flipLockRef = useRef(false);
  const [displayScale, setDisplayScale] = useState(1);
  const [displayWidth, setDisplayWidth] = useState(600);

  currentPageRef.current = currentPage;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const containerWidth = el.clientWidth - 32;
    const pageInfo = pdfInfo[0]?.page_info;
    if (!pageInfo) return;
    const zoomFactor = zoom / 100;
    const baseWidth = Math.min(containerWidth, pageInfo.width);
    const finalWidth = baseWidth * zoomFactor;
    setDisplayScale(finalWidth / pageInfo.width);
    setDisplayWidth(finalWidth);
  }, [zoom, pdfInfo]);

  const flipPage = useCallback((delta: number) => {
    if (flipLockRef.current) return;
    const cp = currentPageRef.current;
    const next = delta > 0
      ? Math.min(totalPages, cp + 1)
      : Math.max(1, cp - 1);
    if (next !== cp) {
      flipLockRef.current = true;
      setCurrentPage(next);
      setTimeout(() => { flipLockRef.current = false; }, 500);
    }
  }, [totalPages, setCurrentPage]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (toolMode === 'create') return;
      e.preventDefault();
      flipPage(e.deltaY);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [toolMode, flipPage]);

  const handleElementClick = useCallback((el: PdfElement) => {
    setSelectedElementId(el.id);
    let content = el.markdown;
    if (el.category_type === 'equation' || el.category_type === 'formula' || el.category_type === 'display_formula') {
      content = el.latex || '';
    }
    setSelectedContent(content || el.html || '');
  }, [setSelectedElementId, setSelectedContent]);

  if (renderedPages.length === 0) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>未加载文档</div>;
  }

  const rp = renderedPages[currentPage - 1];
  if (!rp) return null;
  const elements = pdfInfo[currentPage - 1]?.pdf_info || [];
  const height = rp.height * (displayWidth / rp.width);

  return (
    <div className="doc-viewer">
      <div className="doc-viewer-toolbar">
        <button onClick={() => { useAnnotationStore.getState().resetState(); goBackToList(); }}>返回</button>
        <span className="doc-toolbar-sep">|</span>
        <button className={toolMode === 'select' ? 'active' : ''} onClick={() => setToolMode('select')}>选择</button>
        <button className={toolMode === 'create' ? 'active' : ''} onClick={() => setToolMode('create')}>框选</button>
        <button onClick={() => setBboxVisible(!bboxVisible)}>
          {bboxVisible ? '隐藏' : '显示'}标注
        </button>
        <span className="doc-toolbar-sep">|</span>
        <button onClick={() => setZoom(Math.max(50, zoom - 10))}>−</button>
        <span className="doc-toolbar-zoom">{zoom}%</span>
        <button onClick={() => setZoom(Math.min(200, zoom + 10))}>+</button>
        <span className="doc-toolbar-sep">|</span>
        <span>{currentPage} / {totalPages}</span>
      </div>
      <div ref={containerRef} className="doc-viewer-single">
        <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0, backgroundColor: '#fff', width: displayWidth }}>
          <img src={rp.imageBase64} alt={`Page ${currentPage}`} style={{ width: displayWidth, height: 'auto', display: 'block' }} />
          {bboxVisible && (
            <svg
              width={displayWidth} height={height}
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: toolMode === 'create' ? 'none' : 'auto' }}
            >
              {elements.map((el) => {
                const color = BBOX_COLORS[el.category_type as keyof typeof BBOX_COLORS] || '#666';
                const points = polyToSvgPoints(el.poly, displayScale);
                const bbox = polyToBBox(el.poly);
                const isSelected = el.id === selectedElementId;
                const isHovered = el.id === hoveredElementId;
                const labelText = TYPE_LABELS[el.category_type] || el.category_type;

                return (
                  <g key={el.id}>
                    <polygon
                      points={points}
                      fill={isSelected ? hexToRgba(color, 0.19) : isHovered ? hexToRgba(color, 0.08) : 'transparent'}
                      stroke={color} strokeWidth={isSelected ? 2.5 : 1}
                      strokeDasharray={isHovered && !isSelected ? '5,3' : 'none'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleElementClick(el)}
                      onMouseEnter={() => setHoveredElementId(el.id)}
                      onMouseLeave={() => setHoveredElementId(null)}
                    />
                    {(isSelected || isHovered) && (
                      <g style={{ pointerEvents: 'none' }}>
                        <rect x={bbox.x * displayScale} y={bbox.y * displayScale} width={labelText.length * 7 + 12} height={16} rx={3} fill={color} opacity={0.88} />
                        <text x={bbox.x * displayScale + 5} y={bbox.y * displayScale + 11.5} fill="#fff" fontSize="10px" fontWeight="600">
                          {labelText}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
