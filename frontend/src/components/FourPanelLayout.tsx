import { useState, useRef, useCallback, useEffect } from 'react';
import type React from 'react';

interface PanelConfig { initialWidth: number; minWidth: number }

interface FourPanelLayoutProps {
  panels: [PanelConfig, PanelConfig, PanelConfig, PanelConfig];
  children: [React.ReactNode, React.ReactNode, React.ReactNode, React.ReactNode];
}

export function FourPanelLayout({ panels, children }: FourPanelLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widths, setWidths] = useState(panels.map((p) => p.initialWidth));
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleMouseDown = useCallback((idx: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setDragIdx(idx);
  }, []);

  useEffect(() => {
    if (dragIdx === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalWidth = rect.width;
      const xPct = ((e.clientX - rect.left) / totalWidth) * 100;

      setWidths((prev) => {
        const next = [...prev];
        const l = dragIdx;
        const r = dragIdx + 1;

        const leftMin = panels[l].minWidth;
        const rightMin = panels[r].minWidth;

        const newLeft = Math.max(leftMin, Math.min(xPct, 100 - rightMin - next.filter((_, i) => i !== l && i !== r).reduce((a, b) => a + b, 0)));
        next[l] = newLeft;
        next[r] = 100 - next.filter((_, i) => i !== r).reduce((a, b) => a + b, 0);
        return next;
      });
    };

    const handleMouseUp = () => setDragIdx(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragIdx, panels]);

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: widths.map((w) => `${w}%`).join(' '),
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    userSelect: dragIdx !== null ? 'none' : undefined,
  };

  return (
    <div ref={containerRef} className="four-panel-layout" style={gridStyle}>
      {children.map((child, i) => (
        <div key={i} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {child}
        </div>
      ))}
      {[0, 1, 2].map((i) => (
        <div
          key={`handle-${i}`}
          className={`panel-resize-handle ${dragIdx === i ? 'dragging' : ''}`}
          onMouseDown={handleMouseDown(i)}
        />
      ))}
    </div>
  );
}
