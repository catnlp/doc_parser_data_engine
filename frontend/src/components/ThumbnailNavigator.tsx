import { useMemo, useCallback } from 'react';
import { useAnnotationStore } from '../store/useAnnotationStore';

export function ThumbnailNavigator() {
  const currentPage = useAnnotationStore((s) => s.currentPage);
  const pdfInfo = useAnnotationStore((s) => s.pdfInfo);
  const setCurrentPage = useAnnotationStore((s) => s.setCurrentPage);

  const toc = useMemo(() => {
    const items: { page: number; text: string; level: number; elementId: string }[] = [];
    pdfInfo.forEach((info, pageIdx) => {
      info.pdf_info.forEach((el) => {
        if (el.category_type === 'doc_title') {
          items.push({ page: pageIdx + 1, text: el.markdown || 'Untitled', level: 0, elementId: el.id });
        } else if (el.category_type === 'paragraph_title' || el.category_type === 'title') {
          items.push({ page: pageIdx + 1, text: el.markdown || '', level: 1, elementId: el.id });
        }
      });
    });
    return items;
  }, [pdfInfo]);

  const handleTocClick = useCallback((page: number, elementId: string) => {
    setCurrentPage(page);
    setTimeout(() => {
      useAnnotationStore.getState().setSelectedElementId(elementId);
    }, 100);
  }, [setCurrentPage]);

  return (
    <div className="thumbnail-nav">
      <div className="toc-title">目录</div>
      {toc.length > 0 ? (
        <div className="thumbnail-toc">
          {toc.map((item, i) => (
            <div
              key={i}
              className={`toc-item ${item.level === 0 ? 'toc-level-0' : 'toc-level-1'} ${item.page === currentPage ? 'toc-active' : ''}`}
              onClick={() => handleTocClick(item.page, item.elementId)}
            >
              {item.text}
            </div>
          ))}
        </div>
      ) : (
        <div className="toc-empty">当前文档无目录</div>
      )}
    </div>
  );
}
