import { useMemo, useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import DOMPurify from 'dompurify';
import { useAnnotationStore } from '../store/useAnnotationStore';
import { ElementList } from './right-panel/RightPanel';
import { ChunkList } from './right-panel/ChunkList';
import type { PdfElement } from '../types/omnidoc';

const FORMULA_TYPES = new Set(['equation', 'formula', 'display_formula']);
const FIGURE_TYPES = new Set(['figure', 'image', 'chart']);

const cropCache = new Map<string, string>();

function CroppedFigure({ pageBase64, poly }: { pageBase64: string; poly: number[] }) {
  const [cropped, setCropped] = useState<string | null>(null);

  useEffect(() => {
    const key = `${pageBase64.slice(-40)}_${poly.join(',')}`;
    if (cropCache.has(key)) { setCropped(cropCache.get(key)!); return; }
    if (poly.length < 4) return;
    const sx = poly[0], sy = poly[1], sw = poly[2] - sx, sh = poly[3] - sy;
    if (sw <= 0 || sh <= 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = sw; canvas.height = sh;
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

  if (cropped) return <img src={cropped} alt="figure" style={{ maxWidth: '100%', display: 'block', margin: '8px 0' }} />;
  return <div style={{ height: 40, background: '#f0f0f0', borderRadius: 4, margin: '8px 0' }} />;
}

export function ResultPanel() {
  const p3Content = useAnnotationStore((s) => s.p3Content);
  const setP3Content = useAnnotationStore((s) => s.setP3Content);
  const selectedElementId = useAnnotationStore((s) => s.selectedElementId);
  const currentPage = useAnnotationStore((s) => s.currentPage);
  const setCurrentPage = useAnnotationStore((s) => s.setCurrentPage);
  const pdfInfo = useAnnotationStore((s) => s.pdfInfo);
  const renderedPages = useAnnotationStore((s) => s.renderedPages);
  const contentRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const currentPageRef = useRef(currentPage);
  const lastFlipTimeRef = useRef(0);

  currentPageRef.current = currentPage;

  const allPages = useMemo(() => {
    return pdfInfo.map((info, pageIdx) => ({
      pageNum: pageIdx + 1,
      elements: [...info.pdf_info].sort((a, b) => a.order - b.order),
      pageBase64: renderedPages[pageIdx]?.imageBase64,
    }));
  }, [pdfInfo, renderedPages]);

  useEffect(() => {
    if (!contentRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() - lastFlipTimeRef.current < 800) return;
        let maxRatio = 0;
        let maxPage = currentPageRef.current;
        for (const e of entries) {
          if (e.intersectionRatio > maxRatio) {
            maxRatio = e.intersectionRatio;
            maxPage = Number((e.target as HTMLElement).dataset.page);
          }
        }
        if (maxRatio > 0.3 && maxPage !== currentPageRef.current) {
          setCurrentPage(maxPage);
        }
      },
      { threshold: [0, 0.3, 0.5, 0.8], root: contentRef.current },
    );

    observerRef.current = observer;
    return () => observer.disconnect();
  }, [setCurrentPage]);

  useEffect(() => {
    const observer = observerRef.current;
    if (!observer || !contentRef.current) return;
    contentRef.current.querySelectorAll('[data-page]').forEach((el) => observer.observe(el));
  }, [allPages]);

  useEffect(() => {
    lastFlipTimeRef.current = Date.now();
  }, [currentPage]);

  useEffect(() => {
    if (!selectedElementId || !contentRef.current) return;
    setTimeout(() => {
      const el = contentRef.current?.querySelector(`[data-el-id="${selectedElementId}"]`);
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 50);
  }, [selectedElementId]);

  return (
    <div className="result-panel">
      <div className="result-header">
        <div className="result-tabs">
          <button className={p3Content === '__CHUNK__' ? 'active' : ''} onClick={() => setP3Content('__CHUNK__', '分块列表')}>分块</button>
          <button className={p3Content === '__PARSE__' ? 'active' : ''} onClick={() => setP3Content('__PARSE__', '元素')}>元素</button>
          <button className={!p3Content || p3Content === '__MARKDOWN__' ? 'active' : ''} onClick={() => setP3Content('', 'Markdown')}>Markdown</button>
        </div>
      </div>
      <div className="result-content" ref={contentRef}>
        {p3Content === '__CHUNK__' ? (
          <ChunkList />
        ) : p3Content === '__PARSE__' ? (
          <ElementList />
        ) : p3Content ? (
          <div className="result-markdown">
            <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {p3Content}
            </Markdown>
          </div>
        ) : (
          <div className="result-markdown">
            {allPages.map(({ pageNum, elements, pageBase64 }) => (
              <div key={pageNum} data-page={pageNum} className="result-page-section">
                <div className="result-page-divider">— 第 {pageNum} 页 —</div>
                {elements.map((el) => renderElement(el, pageBase64))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function renderElement(el: PdfElement, pageBase64?: string) {
  if (FIGURE_TYPES.has(el.category_type)) {
    if (pageBase64 && el.poly.length >= 4) {
      return (
        <div key={el.id} data-el-id={el.id}>
          <CroppedFigure pageBase64={pageBase64} poly={el.poly} />
        </div>
      );
    }
    return null;
  }

  if (el.category_type === 'table' && el.html) {
    return (
      <div key={el.id} data-el-id={el.id} className="result-table-wrap">
        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(el.html) }} />
      </div>
    );
  }

  const md = elementToMd(el);
  if (!md) return null;

  return (
    <div key={el.id} data-el-id={el.id}>
      <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {md}
      </Markdown>
    </div>
  );
}

function elementToMd(el: PdfElement): string {
  if (FORMULA_TYPES.has(el.category_type)) return el.latex ? `$$\n${el.latex}\n$$` : '';
  if (el.category_type === 'doc_title') return `# ${el.markdown}`;
  if (el.category_type === 'paragraph_title') return `## ${el.markdown}`;
  return el.markdown || '';
}
