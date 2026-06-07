import { useState, useMemo, useCallback } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import DOMPurify from 'dompurify';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { callAiAction, convertDocument } from '../../api/models';
import type { PdfElement } from '../../types/omnidoc';

const FORMULA_TYPES = new Set(['equation', 'formula', 'display_formula']);
const FIGURE_TYPES = new Set(['figure', 'image', 'chart']);
const TABLE_TYPE = 'table';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CroppedFigure({ pageBase64, poly }: { pageBase64: string; poly: number[] }) {
  const [cropped, setCropped] = useState<string | null>(null);
  const key = `${pageBase64.slice(-40)}_${poly.join(',')}`;
  const cache = useMemo(() => new Map<string, string>(), []);
  const cached = cache.get(key);

  if (cached && !cropped) {
    setCropped(cached);
  }

  if (cropped) {
    return <img src={cropped} alt="figure" className="markdown-preview-img" />;
  }

  if (poly.length < 4) return null;
  const sx = poly[0], sy = poly[1], sw = poly[2] - sx, sh = poly[3] - sy;
  if (sw <= 0 || sh <= 0) return null;

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const dataUrl = canvas.toDataURL('image/png');
    cache.set(key, dataUrl);
    setCropped(dataUrl);
  };
  img.src = pageBase64;
  return <div style={{ height: 40, background: '#f0f0f0', borderRadius: 4 }} />;
}

export function ReadMode() {
  const elements = useAnnotationStore((s) => s.getPageElements());
  const currentPage = useAnnotationStore((s) => s.currentPage);
  const renderedPages = useAnnotationStore((s) => s.renderedPages);
  const pageBase64 = renderedPages[currentPage - 1]?.imageBase64;

  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [targetLang, setTargetLang] = useState('Chinese');

  const sorted = useMemo(() => [...elements].sort((a, b) => a.order - b.order), [elements]);

  const handleAiAction = useCallback(async (action: string) => {
    if (!selectedContent) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const result = await callAiAction(action, selectedContent, { target_lang: targetLang });
      setAiResult(result);
    } catch (e) {
      setAiResult(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setAiLoading(false);
    }
  }, [selectedContent, targetLang]);

  const handleExport = useCallback(async (format: string) => {
    const md = buildPageMarkdown(elements);
    try {
      if (format === 'md') {
        const blob = new Blob([md], { type: 'text/markdown' });
        downloadBlob(blob, 'document.md');
        return;
      }
      const blob = await convertDocument(format, md, 'document');
      downloadBlob(blob, `document.${format}`);
    } catch (e) {
      alert(`Export failed: ${e instanceof Error ? e.message : 'Unknown'}`);
    }
  }, [elements]);

  return (
    <div className="read-mode">
      <ReadToolbar
        hasSelection={!!selectedContent}
        aiLoading={aiLoading}
        targetLang={targetLang}
        onTargetLangChange={setTargetLang}
        onAction={handleAiAction}
        onSearchToggle={() => setShowSearch(!showSearch)}
        onExport={handleExport}
      />

      {showSearch && (
        <SearchPanel
          elements={elements}
          onSelect={(el) => setSelectedContent(elToMarkdown(el))}
          onClose={() => setShowSearch(false)}
        />
      )}

      <div className="read-content" id="read-content">
        {sorted.map((el) => {
          const md = elToMarkdown(el);
          if (!md && !FIGURE_TYPES.has(el.category_type) && el.category_type !== TABLE_TYPE) return null;

          return (
            <div
              key={el.id}
              data-el-id={el.id}
              className={`read-element ${selectedContent === md ? 'read-selected' : ''}`}
              onClick={() => { setSelectedContent(md); setAiResult(null); }}
            >
              {FIGURE_TYPES.has(el.category_type) ? (
                pageBase64 && el.poly.length >= 4 ? (
                  <CroppedFigure pageBase64={pageBase64} poly={el.poly} />
                ) : null
              ) : el.category_type === TABLE_TYPE ? (
                <div
                  className="read-table"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(el.html || '<p><em>[Table]</em></p>') }}
                />
              ) : (
                <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {md}
                </Markdown>
              )}
            </div>
          );
        })}
      </div>

      {aiResult && (
        <AIResultPanel
          result={aiResult}
          onClose={() => setAiResult(null)}
        />
      )}
    </div>
  );
}

function ReadToolbar({
  hasSelection, aiLoading, targetLang, onTargetLangChange,
  onAction, onSearchToggle, onExport,
}: {
  hasSelection: boolean;
  aiLoading: boolean;
  targetLang: string;
  onTargetLangChange: (l: string) => void;
  onAction: (action: string) => void;
  onSearchToggle: () => void;
  onExport: (format: string) => void;
}) {
  return (
    <div className="read-toolbar">
      <div className="read-toolbar-actions">
        <button disabled={!hasSelection || aiLoading} onClick={() => onAction('translate')}>
          🌐 翻译
        </button>
        <button disabled={!hasSelection || aiLoading} onClick={() => onAction('explain')}>
          🤖 解释
        </button>
        <button disabled={!hasSelection || aiLoading} onClick={() => onAction('summarize')}>
          📝 摘要
        </button>
        <button onClick={onSearchToggle}>🔍 搜索</button>
      </div>
      <div className="read-toolbar-options">
        <select value={targetLang} onChange={(e) => onTargetLangChange(e.target.value)}>
          <option value="Chinese">译中文</option>
          <option value="English">译英文</option>
          <option value="Japanese">译日文</option>
          <option value="Korean">译韩文</option>
        </select>
        <div className="read-export-group">
          <button onClick={() => onExport('html')}>HTML</button>
          <button onClick={() => onExport('docx')}>DOCX</button>
          <button onClick={() => onExport('md')}>MD</button>
        </div>
      </div>
    </div>
  );
}

function SearchPanel({
  elements, onSelect, onClose,
}: {
  elements: PdfElement[];
  onSelect: (el: PdfElement) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return elements
      .filter((el) => {
        const text = el.markdown || el.latex || el.html || '';
        return text.toLowerCase().includes(q);
      })
      .slice(0, 20);
  }, [elements, query]);

  return (
    <div className="read-search-panel">
      <div className="read-search-header">
        <input
          type="text"
          placeholder="搜索文档内容..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button onClick={onClose}>✕</button>
      </div>
      <div className="read-search-results">
        {results.length === 0 && query && <div className="read-search-empty">无匹配结果</div>}
        {results.map((el) => (
          <div
            key={el.id}
            className="read-search-item"
            onClick={() => { onSelect(el); onClose(); }}
          >
            <span className="read-search-type">{el.category_type}</span>
            <span className="read-search-preview">{(el.markdown || el.latex || el.html || '').slice(0, 100)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIResultPanel({ result, onClose }: { result: string; onClose: () => void }) {
  return (
    <div className="read-ai-result">
      <div className="read-ai-result-header">
        <span>AI 结果</span>
        <div className="read-ai-result-actions">
          <button onClick={() => navigator.clipboard.writeText(result)}>复制</button>
          <button onClick={onClose}>✕</button>
        </div>
      </div>
      <div className="read-ai-result-content">
        <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
          {result}
        </Markdown>
      </div>
    </div>
  );
}

function elToMarkdown(el: PdfElement): string {
  if (FORMULA_TYPES.has(el.category_type)) {
    return el.latex ? `$$${el.latex}$$` : '';
  }
  if (el.category_type === 'doc_title') return `# ${el.markdown}`;
  if (el.category_type === 'paragraph_title') return `## ${el.markdown}`;
  return el.markdown || '';
}

function buildPageMarkdown(elements: PdfElement[]): string {
  return [...elements]
    .sort((a, b) => a.order - b.order)
    .map((el) => {
      if (FORMULA_TYPES.has(el.category_type)) return el.latex ? `$$\n${el.latex}\n$$` : '';
      if (el.category_type === TABLE_TYPE) return el.html || '';
      if (FIGURE_TYPES.has(el.category_type)) return '';
      return el.markdown || '';
    })
    .filter(Boolean)
    .join('\n\n');
}
