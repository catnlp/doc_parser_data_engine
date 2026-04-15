import { useMemo } from 'react';
import { useAnnotationStore } from '../store/useAnnotationStore';

interface BottomNavProps {
  onPageChange: (page: number) => void;
}

export function BottomNav({ onPageChange }: BottomNavProps) {
  const currentPage = useAnnotationStore((s) => s.currentPage);
  const totalPages = useAnnotationStore((s) => s.totalPages);
  const dirtyPages = useAnnotationStore((s) => s.dirtyPages);

  const pageButtons = useMemo(() => {
    const pages: (number | '...')[] = [];
    const start = Math.max(1, currentPage - 3);
    const end = Math.min(totalPages, currentPage + 3);
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  const handleGoFirst = () => {
    if (dirtyPages.has(currentPage)) {
      if (!window.confirm('当前页有未保存修改，是否保存后再切换？')) return;
    }
    onPageChange(1);
  };
  const handleGoLast = () => {
    if (dirtyPages.has(currentPage)) {
      if (!window.confirm('当前页有未保存修改，是否保存后再切换？')) return;
    }
    onPageChange(totalPages);
  };

  const handlePageClick = (page: number) => {
    if (dirtyPages.has(currentPage)) {
      if (!window.confirm('当前页有未保存修改，是否保存后再切换？')) return;
    }
    onPageChange(page);
  };

  return (
    <div className="bottomnav">
      <button onClick={handleGoFirst} disabled={currentPage <= 1}>{"<<"}</button>
      <button onClick={() => { if (!dirtyPages.has(currentPage) || window.confirm('保存？')) onPageChange(currentPage - 1); }} disabled={currentPage <= 1}>{"<"}</button>
      {pageButtons.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`page-btn ${p === currentPage ? 'active' : ''} ${dirtyPages.has(p) ? 'dirty' : ''}`}
            onClick={() => handlePageClick(p as number)}
          >
            {p}
          </button>
        )
      )}
      <button onClick={() => { if (!dirtyPages.has(currentPage) || window.confirm('保存？')) onPageChange(currentPage + 1); }} disabled={currentPage >= totalPages}>{">"}</button>
      <button onClick={handleGoLast} disabled={currentPage >= totalPages}>{">>"}</button>
    </div>
  );
}
