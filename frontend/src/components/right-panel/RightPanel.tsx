import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { TypeSelector } from './TypeSelector';
import { ContentEditor } from './ContentEditor';
import { TYPE_ICONS } from '../../constants/elementTypes';
import DOMPurify from 'dompurify';
import type { PdfElement, ElementType } from '../../types/omnidoc';

export function RightPanel() {
  return (
    <div className="right-panel">
      <div className="right-panel-content">
        <ElementList />
      </div>
    </div>
  );
}

function ElementList() {
  const elements = useAnnotationStore((s) => s.getPageElements());
  const selectedElementId = useAnnotationStore((s) => s.selectedElementId);
  const hoveredElementId = useAnnotationStore((s) => s.hoveredElementId);
  const setSelectedElementId = useAnnotationStore((s) => s.setSelectedElementId);
  const setHoveredElementId = useAnnotationStore((s) => s.setHoveredElementId);
  const reorderElements = useAnnotationStore((s) => s.reorderElements);

  const sorted = [...elements].sort((a, b) => a.order - b.order);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (fromIndex !== targetIndex) reorderElements(fromIndex, targetIndex);
  };

  return (
    <div className="element-list">
      {sorted.map((el, idx) => (
        <ElementCard
          key={el.id}
          element={el}
          isEditing={el.id === selectedElementId}
          isHovered={el.id === hoveredElementId}
          onSelect={() => setSelectedElementId(el.id)}
          onToggleEdit={() => setSelectedElementId(el.id === selectedElementId ? null : el.id)}
          onHover={() => setHoveredElementId(el.id)}
          onLeave={() => setHoveredElementId(null)}
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, idx)}
        />
      ))}
    </div>
  );
}

function ElementCard({
  element,
  isEditing,
  isHovered,
  onSelect,
  onToggleEdit,
  onHover,
  onLeave,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  element: PdfElement;
  isEditing: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onToggleEdit: () => void;
  onHover: () => void;
  onLeave: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div
      className={`element-card ${isEditing ? 'editing' : ''} ${isHovered ? 'hovered' : ''}`}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="card-header">
        <span className="drag-handle" title="拖拽排序">≡</span>
        <span className="order-badge">≡{element.order + 1}</span>
        <span className="type-icon">{TYPE_ICONS[element.category_type] || '📝'}</span>
        <span className="type-label">{element.category_type}</span>
        <button className="edit-btn" onClick={(e) => { e.stopPropagation(); onToggleEdit(); }} title="编辑">
          {isEditing ? '收起' : '编辑'}
        </button>
      </div>

      <div className="content-display">
        <RenderedContent element={element} />
      </div>

      {isEditing && <ExpandedCardContent element={element} />}
    </div>
  );
}

function ExpandedCardContent({ element }: { element: PdfElement }) {
  const isFormulaType = element.category_type === 'equation' || element.category_type === 'formula' || element.category_type === 'display_formula';
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  const updateElement = useAnnotationStore((s) => s.updateElement);
  const [content, setContent] = useState(
    element.category_type === 'table' ? element.html :
    isFormulaType ? element.latex :
    element.markdown,
  );

  useEffect(() => {
    setContent(
      element.category_type === 'table' ? element.html :
      isFormulaType ? element.latex :
      element.markdown,
    );
  }, [element]);

  const handleSave = () => {
    const field = element.category_type === 'table' ? 'html' : isFormulaType ? 'latex' : 'markdown';
    updateElement(element.id, { [field]: content });
  };

  return (
    <div className="expanded-card-content">
      <div className="edit-toolbar">
        <div className="view-toggle">
          <button className={viewMode === 'preview' ? 'active' : ''} onClick={(e) => { e.stopPropagation(); setViewMode('preview'); }}>预览</button>
          <button className={viewMode === 'source' ? 'active' : ''} onClick={(e) => { e.stopPropagation(); setViewMode('source'); }}>源码</button>
        </div>
      </div>

      {viewMode === 'preview' ? (
        <div className="content-preview-area">
          <RenderedContent element={element} />
        </div>
      ) : (
        <ContentEditor
          value={content}
          onChange={setContent}
          elementType={element.category_type}
        />
      )}

      <div className="element-meta">
        <label>
          类型:
          <TypeSelector
            value={element.category_type}
            onChange={(type) => updateElement(element.id, { category_type: type as ElementType })}
          />
        </label>
        <label>
          坐标:
          <input type="text" readOnly value={JSON.stringify(element.poly)} />
        </label>
      </div>

      <button className="save-btn" onClick={(e) => { e.stopPropagation(); handleSave(); }}>保存修改</button>
    </div>
  );
}

function RenderedContent({ element }: { element: PdfElement }) {
  const renderedPages = useAnnotationStore((s) => s.renderedPages);
  const currentPage = useAnnotationStore((s) => s.currentPage);

  if (['text', 'title', 'header', 'footer'].includes(element.category_type)) {
    return (
      <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {element.markdown}
      </Markdown>
    );
  }
  if (element.category_type === 'table') {
    return (
      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(element.html) }} />
    );
  }
  if (element.category_type === 'equation' || element.category_type === 'formula' || element.category_type === 'display_formula') {
    return (
      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {element.latex}
      </Markdown>
    );
  }
  if (element.category_type === 'figure' || element.category_type === 'image') {
    const renderedPage = renderedPages[currentPage - 1];
    if (renderedPage?.imageBase64 && element.poly.length >= 8) {
      const xs = [element.poly[0], element.poly[2], element.poly[4], element.poly[6]];
      const ys = [element.poly[1], element.poly[3], element.poly[5], element.poly[7]];
      const sx = Math.min(...xs);
      const sy = Math.min(...ys);
      const sw = Math.max(...xs) - sx;
      const sh = Math.max(...ys) - sy;
      if (sw > 0 && sh > 0) {
        return (
          <div style={{ textAlign: 'center', position: 'relative' }}>
            <img
              src={renderedPage.imageBase64}
              alt="figure"
              style={{
                maxWidth: '100%',
                objectFit: 'none',
                objectPosition: `${-sx}px ${-sy}px`,
                width: `${sw}px`,
                height: `${sh}px`,
              }}
            />
          </div>
        );
      }
    }
    return <span style={{ color: '#999' }}>[未解析]</span>;
  }
  return <span>{element.markdown}</span>;
}
