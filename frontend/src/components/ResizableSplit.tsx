import React, { useState, useRef, useCallback } from 'react';

interface ResizableSplitProps {
  children: [(leftWidth: number) => React.ReactNode, () => React.ReactNode];
  minWidthLeft: number;
  minWidthRight: number;
  initialRatio?: number;
}

export function ResizableSplit({ children, minWidthLeft, minWidthRight, initialRatio = 0.55 }: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(initialRatio);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = (e.clientX - rect.left) / rect.width;
      const clamped = Math.max(
        minWidthLeft / rect.width,
        Math.min(1 - minWidthRight / rect.width, newRatio),
      );
      setRatio(clamped);
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minWidthLeft, minWidthRight]);

  const [leftContent, rightContent] = children;

  return (
    <div ref={containerRef} className="resizable-split">
      <div style={{ width: `${ratio * 100}%`, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {leftContent(ratio * (containerRef.current?.getBoundingClientRect().width || 0))}
      </div>
      <div
        className={`resize-handle ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
      />
      <div style={{ width: `${(1 - ratio) * 100}%`, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {rightContent()}
      </div>
    </div>
  );
}
