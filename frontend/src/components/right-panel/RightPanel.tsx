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

export function RightPanel() {
  const rightPanelTab = useAnnotationStore((s) => s.rightPanelTab);
  const setRightPanelTab = useAnnotationStore((s) => s.setRightPanelTab);

  return (
    <div className="right-panel">
      <div className="tab-bar">
        <button
          className={`tab-btn ${rightPanelTab === 'list' ? 'active' : ''}`}
          onClick={() => setRightPanelTab('list')}
        >
          元素列表
        </button>
        <button
          className={`tab-btn ${rightPanelTab === 'detail' ? 'active' : ''}`}
          onClick={() => setRightPanelTab('detail')}
        >
          元素详情
        </button>
      </div>
      <div className="tab-content">
        {rightPanelTab === 'list' ? <ElementList /> : <ElementDetail />}
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
        <div
          key={el.id}
          className={`element-card ${el.id === selectedElementId ? 'selected' : ''} ${el.id === hoveredElementId ? 'hovered' : ''}`}
          onClick={() => setSelectedElementId(el.id)}
          onMouseEnter={() => setHoveredElementId(el.id)}
          onMouseLeave={() => setHoveredElementId(null)}
          draggable
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, idx)}
        >
          <div className="card-header">
            <span className="drag-handle" title="拖拽排序">≡</span>
            <span className="order-badge">≡{el.order + 1}</span>
            <span className="type-icon">{TYPE_ICONS[el.category_type] || '📝'}</span>
            <span className="type-label">{el.category_type}</span>
          </div>
          <div className="content-preview">
            <ElementContentPreview element={el} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ElementContentPreview({ element }: { element: { category_type: string; markdown: string; html: string; latex: string; image_path: string } }) {
  if (['text', 'title', 'header', 'footer'].includes(element.category_type)) {
    return <span>{element.markdown.slice(0, 80)}{element.markdown.length > 80 ? '...' : ''}</span>;
  }
  if (element.category_type === 'table') {
    return <span>{element.html.slice(0, 80)}...</span>;
  }
  if (element.category_type === 'equation') {
    return <span>{element.latex.slice(0, 80)}</span>;
  }
  if (element.category_type === 'figure') {
    return <span>{element.image_path ? `[image: ${element.image_path}]` : '[未解析]'}</span>;
  }
  return <span>{element.markdown.slice(0, 80)}</span>;
}

function ElementDetail() {
  const selectedElementId = useAnnotationStore((s) => s.selectedElementId);
  const elements = useAnnotationStore((s) => s.getPageElements());
  const element = elements.find((e) => e.id === selectedElementId);

  if (!element) {
    return <div style={{ color: '#999', textAlign: 'center', padding: 40 }}>请从左侧选择一个元素</div>;
  }

  return <DetailView element={element} />;
}

function DetailView({ element }: { element: { id: string; category_type: string; poly: number[]; markdown: string; html: string; latex: string; image_path: string } }) {
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  const updateElement = useAnnotationStore((s) => s.updateElement);
  const [content, setContent] = useState(
    element.category_type === 'table' ? element.html :
    element.category_type === 'equation' ? element.latex :
    element.markdown,
  );

  useEffect(() => {
    setContent(
      element.category_type === 'table' ? element.html :
      element.category_type === 'equation' ? element.latex :
      element.markdown,
    );
  }, [element]);

  const handleSave = () => {
    const field = element.category_type === 'table' ? 'html' : element.category_type === 'equation' ? 'latex' : 'markdown';
    updateElement(element.id, { [field]: content });
  };

  return (
    <div className="element-detail">
      <div className="detail-header">
        <span>{TYPE_ICONS[element.category_type as keyof typeof TYPE_ICONS] || '📝'} 元素 #{element.order + 1}: {element.category_type}</span>
        <div className="view-toggle">
          <button className={viewMode === 'preview' ? 'active' : ''} onClick={() => setViewMode('preview')}>预览</button>
          <button className={viewMode === 'source' ? 'active' : ''} onClick={() => setViewMode('source')}>源码</button>
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
            onChange={(type) => updateElement(element.id, { category_type: type })}
          />
        </label>
        <label>
          坐标:
          <input type="text" readOnly value={JSON.stringify(element.poly)} />
        </label>
      </div>

      <button className="save-btn" onClick={handleSave}>保存修改</button>
    </div>
  );
}

function RenderedContent({ element }: { element: { category_type: string; markdown: string; html: string; latex: string; image_path: string } }) {
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
  if (element.category_type === 'equation') {
    return (
      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {element.latex}
      </Markdown>
    );
  }
  if (element.category_type === 'figure') {
    return element.image_path ? (
      <div style={{ textAlign: 'center' }}>
        <img src={element.image_path} alt="figure" style={{ maxWidth: '100%' }} />
      </div>
    ) : (
      <span style={{ color: '#999' }}>[未解析]</span>
    );
  }
  return <span>{element.markdown}</span>;
}
