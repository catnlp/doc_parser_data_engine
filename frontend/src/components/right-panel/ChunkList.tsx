import { useState, useMemo, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import DOMPurify from 'dompurify';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { computeChunks, detectColumns, getPageWidth } from '../../utils/chunk';
import { TYPE_ICONS } from '../../constants/elementTypes';
import type { Chunk, PdfElement } from '../../types/omnidoc';

const IS_FORMULA = (type: string) => type === 'equation' || type === 'formula' || type === 'display_formula';
const IS_FIGURE = (type: string) => type === 'figure' || type === 'image' || type === 'chart';
const IS_TABLE = (type: string) => type === 'table';

function elementToMarkdown(el: PdfElement): string {
  if (IS_FORMULA(el.category_type)) {
    return el.latex ? `$$${el.latex}$$` : '';
  }
  return el.markdown || '';
}

const cropCache = new Map<string, string>();

function CroppedFigure({ pageBase64, poly }: { pageBase64: string; poly: number[] }) {
  const [cropped, setCropped] = useState<string | null>(null);

  useEffect(() => {
    const key = `${pageBase64.slice(-40)}_${poly.join(',')}`;
    if (cropCache.has(key)) {
      setCropped(cropCache.get(key)!);
      return;
    }
    if (poly.length < 4) return;
    const sx = poly[0], sy = poly[1], sw = poly[2] - sx, sh = poly[3] - sy;
    if (sw <= 0 || sh <= 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      cropCache.set(key, canvas.toDataURL('image/png'));
      setCropped(cropCache.get(key)!);
    };
    img.src = pageBase64;
  }, [pageBase64, poly]);

  if (cropped) return <img src={cropped} alt="figure" className="chunk-preview-img" />;
  return <div style={{ height: 40, background: '#f0f0f0', borderRadius: 4 }} />;
}

function getChunkIcon(type: Chunk['type']): string {
  switch (type) {
    case 'text_block': return '📄';
    case 'table': return '📊';
    case 'figure': return '🖼️';
  }
}

function getChunkTypeLabel(type: Chunk['type']): string {
  switch (type) {
    case 'text_block': return '文本块';
    case 'table': return '表格';
    case 'figure': return '图片';
  }
}

export function ChunkList() {
  const elements = useAnnotationStore((s) => s.getPageElements());
  const pageInfo = useAnnotationStore((s) => s.getPageInfo());
  const currentPage = useAnnotationStore((s) => s.currentPage);
  const renderedPages = useAnnotationStore((s) => s.renderedPages);
  const selectedChunkId = useAnnotationStore((s) => s.selectedChunkId);
  const hoveredChunkId = useAnnotationStore((s) => s.hoveredChunkId);
  const selectedElementId = useAnnotationStore((s) => s.selectedElementId);
  const setSelectedChunkId = useAnnotationStore((s) => s.setSelectedChunkId);
  const setHoveredChunkId = useAnnotationStore((s) => s.setHoveredChunkId);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const pageBase64 = renderedPages[currentPage - 1]?.imageBase64;

  const chunks = useMemo(() => {
    if (elements.length === 0) return [];
    const pageWidth = getPageWidth(elements, pageInfo?.width);
    const columnLayout = detectColumns(elements, pageWidth);
    return computeChunks(elements, columnLayout, pageWidth);
  }, [elements, pageInfo]);

  useEffect(() => {
    if (!selectedElementId) return;
    const chunk = chunks.find((c) => c.elements.some((el) => el.id === selectedElementId));
    if (chunk) {
      const el = document.querySelector(`[data-chunk-id="${chunk.id}"]`);
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [selectedElementId, chunks]);

  const chunkSearchTexts = useMemo(() => {
    return chunks.map((chunk) =>
      chunk.elements
        .map((el) => el.markdown || el.latex || el.html || '')
        .join(' ')
        .toLowerCase()
    );
  }, [chunks]);

  const filtered = chunks.filter((chunk, idx) => {
    if (filterType && chunk.type !== filterType) return false;
    if (searchText) {
      if (!chunkSearchTexts[idx].includes(searchText.toLowerCase())) return false;
    }
    return true;
  });

  const chunkTypes = [...new Set(chunks.map((c) => c.type))].sort();

  const toggleExpand = (chunkId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(chunkId)) next.delete(chunkId);
      else next.add(chunkId);
      return next;
    });
  };

  return (
    <div className="chunk-list">
      <div className="chunk-filters">
        <input
          type="text"
          className="filter-search"
          placeholder="搜索分块内容..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <select
          className="filter-type"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">全部类型</option>
          {chunkTypes.map((t) => (
            <option key={t} value={t}>{getChunkTypeLabel(t as Chunk['type'])}</option>
          ))}
        </select>
        {filtered.length !== chunks.length && (
          <span className="filter-count">{filtered.length}/{chunks.length}</span>
        )}
        <button
          className="chunk-toggle-all-btn"
          onClick={() => setExpandedIds(
            expandedIds.size === chunks.length
              ? new Set()
              : new Set(chunks.map((c) => c.id))
          )}
          title={expandedIds.size === chunks.length ? '全部收起' : '全部展开'}
        >
          {expandedIds.size === chunks.length ? '收起全部' : '展开全部'}
        </button>
      </div>

      {filtered.map((chunk) => (
        <ChunkCard
          key={chunk.id}
          chunk={chunk}
          pageBase64={pageBase64}
          isSelected={chunk.id === selectedChunkId}
          isHovered={chunk.id === hoveredChunkId}
          isExpanded={expandedIds.has(chunk.id)}
          onSelect={() => setSelectedChunkId(chunk.id)}
          onHover={() => setHoveredChunkId(chunk.id)}
          onLeave={() => setHoveredChunkId(null)}
          onToggleExpand={() => toggleExpand(chunk.id)}
        />
      ))}

      {chunks.length === 0 && (
        <div className="chunk-empty">当前页面没有可合并的元素</div>
      )}
    </div>
  );
}

function ChunkCard({
  chunk,
  pageBase64,
  isSelected,
  isHovered,
  isExpanded,
  onSelect,
  onHover,
  onLeave,
  onToggleExpand,
}: {
  chunk: Chunk;
  pageBase64: string | undefined;
  isSelected: boolean;
  isHovered: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
  onToggleExpand: () => void;
}) {
  return (
    <div
      className={`chunk-card ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      data-chunk-id={chunk.id}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="chunk-header">
        <span className="chunk-icon">{getChunkIcon(chunk.type)}</span>
        <span className="chunk-label">{chunk.label}</span>
        <span className="chunk-type-tag">{getChunkTypeLabel(chunk.type)}</span>
        <span className="chunk-count">{chunk.elements.length} 元素 · {chunk.charCount} 字</span>
        {chunk.columnIndex === -1 && <span className="chunk-cross-col">跨栏</span>}
        <button
          className="chunk-expand-btn"
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
        >
          {isExpanded ? '收起' : '展开'}
        </button>
      </div>

      {isExpanded ? (
        <div className="chunk-elements">
          {chunk.elements.map((el) => (
            <SubElement key={el.id} element={el} />
          ))}
        </div>
      ) : (
        <div className="chunk-preview">
          {chunk.elements.map((el) => {
            if (IS_FIGURE(el.category_type)) {
              if (pageBase64 && el.poly.length >= 4) {
                return <CroppedFigure key={el.id} pageBase64={pageBase64} poly={el.poly} />;
              }
              return null;
            }
            if (IS_TABLE(el.category_type) && el.html) {
              return (
                <div
                  key={el.id}
                  className="chunk-preview-table"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(el.html) }}
                />
              );
            }
            const md = elementToMarkdown(el);
            if (!md) return null;
            return (
              <Markdown key={el.id} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {md}
              </Markdown>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SubElement({ element }: { element: PdfElement }) {
  const isFormula = element.category_type === 'equation' || element.category_type === 'formula' || element.category_type === 'display_formula';
  const raw = isFormula ? (element.latex || '') : (element.markdown || element.html || '');
  const preview = raw.slice(0, 80);
  return (
    <div className="sub-element">
      <span className="sub-order">≡{element.order + 1}</span>
      <span className="sub-type-icon">{TYPE_ICONS[element.category_type] || '📝'}</span>
      <span className="sub-type">{element.category_type}</span>
      {isFormula && element.latex ? (
        <span className="sub-formula">
          <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {`$${element.latex}$`}
          </Markdown>
        </span>
      ) : (
        <span className="sub-preview">{preview || '(空)'}</span>
      )}
    </div>
  );
}
