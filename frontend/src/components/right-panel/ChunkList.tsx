import { useState, useMemo, useEffect } from 'react';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { computeChunks, detectColumns, getPageWidth } from '../../utils/chunk';
import { TYPE_ICONS } from '../../constants/elementTypes';
import type { Chunk, PdfElement } from '../../types/omnidoc';

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
  const selectedChunkId = useAnnotationStore((s) => s.selectedChunkId);
  const hoveredChunkId = useAnnotationStore((s) => s.hoveredChunkId);
  const setSelectedChunkId = useAnnotationStore((s) => s.setSelectedChunkId);
  const setHoveredChunkId = useAnnotationStore((s) => s.setHoveredChunkId);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const chunks = useMemo(() => {
    if (elements.length === 0) return [];
    const pageWidth = getPageWidth(elements, pageInfo?.width);
    const columnLayout = detectColumns(elements, pageWidth);
    return computeChunks(elements, columnLayout, pageWidth);
  }, [elements, pageInfo]);

  useEffect(() => {
    if (chunks.length > 0) {
      setExpandedIds(new Set(chunks.map((c) => c.id)));
    }
  }, [chunks]);

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
  isSelected,
  isHovered,
  isExpanded,
  onSelect,
  onHover,
  onLeave,
  onToggleExpand,
}: {
  chunk: Chunk;
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

      {isExpanded && (
        <div className="chunk-elements">
          {chunk.elements.map((el) => (
            <SubElement key={el.id} element={el} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubElement({ element }: { element: PdfElement }) {
  const preview = (element.markdown || element.latex || element.html || '').slice(0, 80);
  return (
    <div className="sub-element">
      <span className="sub-order">≡{element.order + 1}</span>
      <span className="sub-type-icon">{TYPE_ICONS[element.category_type] || '📝'}</span>
      <span className="sub-type">{element.category_type}</span>
      <span className="sub-preview">{preview || '(空)'}</span>
    </div>
  );
}
