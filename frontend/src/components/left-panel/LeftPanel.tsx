import { useRef, useState, useCallback, useEffect } from 'react';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { BBOX_COLORS, TYPE_LABELS, TYPE_ICONS } from '../../constants/elementTypes';

interface LeftPanelProps {
  pdfFile: File | null;
  pageNumber: number;
  pageInfo: { width: number; height: number };
  renderedImage: string | null;
}

function polyToSvgPoints(poly: number[], scale: number): string {
  return poly
    .map((v) => (v * scale).toFixed(2))
    .reduce((acc, val, i) => (i % 2 === 0 ? `${acc}${val},` : `${acc}${val} `), '')
    .trim();
}

function polyToBBox(poly: number[]) {
  const xs = poly.filter((_, i) => i % 2 === 0);
  const ys = poly.filter((_, i) => i % 2 !== 0);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

export function LeftPanel({ pdfFile, pageNumber, pageInfo, renderedImage }: LeftPanelProps) {
  const selectedElementId = useAnnotationStore((s) => s.selectedElementId);
  const toolMode = useAnnotationStore((s) => s.toolMode);
  const zoom = useAnnotationStore((s) => s.zoom);
  const setSelectedElementId = useAnnotationStore((s) => s.setSelectedElementId);
  const currentPageData = useAnnotationStore((s) => s.pdfInfo[pageNumber - 1]);
  const elements = currentPageData?.pdf_info || [];

  const containerRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(1);
  const [displayWidth, setDisplayWidth] = useState(800);

  const [creationStart, setCreationStart] = useState<{ x: number; y: number } | null>(null);
  const [creationCurrent, setCreationCurrent] = useState<{ x: number; y: number } | null>(null);
  const [typeSelectorPos, setTypeSelectorPos] = useState<{ x: number; y: number } | null>(null);
  const hoveredElementId = useAnnotationStore((s) => s.hoveredElementId);
  const setHoveredElementId = useAnnotationStore((s) => s.setHoveredElementId);

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 32;
      const zoomFactor = zoom / 100;
      const baseWidth = Math.min(containerWidth, pageInfo.width);
      
      const finalWidth = baseWidth * zoomFactor;
      const s = finalWidth / pageInfo.width;
      
      setDisplayScale(s);
      setDisplayWidth(finalWidth);
    }
  }, [pageInfo.width, pageInfo.height, zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (toolMode !== 'create' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCreationStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setCreationCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [toolMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!creationStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCreationCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [creationStart]);

  const handleMouseUp = useCallback(() => {
    if (!creationStart || !creationCurrent) {
      setCreationStart(null); setCreationCurrent(null); return;
    }
    const w = Math.abs(creationCurrent.x - creationStart.x);
    const h = Math.abs(creationCurrent.y - creationStart.y);
    if (w < 20 || h < 20) {
      alert('区域过小');
      setCreationStart(null); setCreationCurrent(null); return;
    }
    setTypeSelectorPos({ x: Math.max(creationCurrent.x, 20), y: Math.max(creationCurrent.y, 20) });
    setCreationStart(null); setCreationCurrent(null);
  }, [creationStart, creationCurrent]);

  const handleTypeSelect = useCallback((type: string) => {
    if (!creationStart || !creationCurrent) return;
    const x = Math.min(creationStart.x, creationCurrent.x);
    const y = Math.min(creationStart.y, creationCurrent.y);
    const w = Math.abs(creationCurrent.x - creationStart.x);
    const h = Math.abs(creationCurrent.y - creationStart.y);
    const poly = [x, y, x + w, y, x + w, y + h, x, y + h].map(v => v / displayScale);
    const getNextOrder = useAnnotationStore.getState().getNextOrder;
    useAnnotationStore.getState().addElement({
      id: Math.random().toString(36).slice(2, 10),
      category_type: type as never,
      poly,
      order: getNextOrder(),
      latex: '', html: '', markdown: '', image_path: '',
    });
    setTypeSelectorPos(null);
  }, [creationStart, creationCurrent, displayScale]);

  if (!renderedImage) {
    return (
      <div className="left-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <div style={{ color: '#999' }}>未加载文档图片</div>
      </div>
    );
  }

  return (
    <div className="left-panel">
      <div
        ref={containerRef}
        className={`pdf-container ${toolMode === 'create' ? 'create-mode' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          cursor: toolMode === 'create' ? 'crosshair' : 'default',
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '16px',
          backgroundColor: '#f3f4f6',
          overflow: 'auto',
        }}
      >
        <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0, backgroundColor: '#ffffff' }}>
          <img
            src={renderedImage}
            alt={`Page ${pageNumber}`}
            style={{ width: displayWidth, height: 'auto', display: 'block' }}
          />
          <svg
            className="bbox-overlay"
            width={displayWidth}
            height={pageInfo.height * displayScale}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          >
            {elements.map((el) => {
              const color = BBOX_COLORS[el.category_type as keyof typeof BBOX_COLORS] || '#666';
              const points = polyToSvgPoints(el.poly, displayScale);
              const bbox = polyToBBox(el.poly);
              const isSelected = el.id === selectedElementId;
              const isHovered = el.id === hoveredElementId;
              const bx = bbox.minX * displayScale;
              const by = bbox.minY * displayScale;
              return (
                <g key={el.id}>
                  <polygon
                    className="bbox-rect"
                    points={points}
                    fill={isSelected ? `${color}40` : isHovered ? `${color}25` : `${color}15`}
                    stroke={isSelected || isHovered ? color : color}
                    strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                    strokeDasharray={isHovered && !isSelected ? '5,3' : 'none'}
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    onClick={() => toolMode === 'select' && setSelectedElementId(el.id)}
                    onMouseEnter={() => setHoveredElementId(el.id)}
                    onMouseLeave={() => setHoveredElementId(null)}
                  />
                  <text x={bx + 4} y={by + 14} fill="#fff" fontSize="10px" fontWeight="700" style={{ pointerEvents: 'none' }}>
                    {el.order + 1}
                  </text>
                </g>
              );
            })}
            {creationStart && creationCurrent && (
              <rect
                className="creation-rect"
                x={Math.min(creationStart.x, creationCurrent.x)}
                y={Math.min(creationStart.y, creationCurrent.y)}
                width={Math.abs(creationCurrent.x - creationStart.x)}
                height={Math.abs(creationCurrent.y - creationStart.y)}
              />
            )}
          </svg>
        </div>
        {typeSelectorPos && (
          <div className="type-selector" style={{ left: typeSelectorPos.x, top: typeSelectorPos.y }}>
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <div key={type} className="type-option" onClick={() => handleTypeSelect(type)}>
                <div className="type-color" style={{ background: BBOX_COLORS[type as keyof typeof BBOX_COLORS] }} />
                <span>{TYPE_ICONS[type as keyof typeof TYPE_ICONS]} {label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <TypeLegend />
    </div>
  );
}

function TypeLegend() {
  const types = ['text', 'title', 'table', 'figure', 'equation', 'header', 'footer'] as const;
  return (
    <div className="type-legend">
      {types.map((type) => (
        <div key={type} className="legend-item">
          <div className="legend-color" style={{ background: BBOX_COLORS[type] }} />
          <span>{TYPE_LABELS[type]}</span>
        </div>
      ))}
    </div>
  );
}
