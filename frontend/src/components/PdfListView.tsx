import { useDocumentListStore } from '../store/useDocumentListStore';
import type { DocumentStatus } from '../types/document';

const STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: '⏳ 待解析',
  parsing: '🔄 解析中',
  done: '✅ 解析完成',
  error: '❌ 解析失败',
};

const STATUS_COLORS: Record<DocumentStatus, string> = {
  pending: '#94A3B8',
  parsing: '#3B82F6',
  done: '#10B981',
  error: '#EF4444',
};

export function PdfListView() {
  const documents = useDocumentListStore((s) => s.documents);
  const selectDocument = useDocumentListStore((s) => s.selectDocument);

  const stats = {
    pending: documents.filter((d) => d.status === 'pending').length,
    parsing: documents.filter((d) => d.status === 'parsing').length,
    done: documents.filter((d) => d.status === 'done').length,
    error: documents.filter((d) => d.status === 'error').length,
  };

  return (
    <div className="pdf-list-view">
      <div className="list-header">
        <h2>PDF 列表</h2>
        <div className="list-stats">
          <span>共 {documents.length} 份</span>
          {stats.pending > 0 && <span className="stat-pending">待解析 {stats.pending}</span>}
          {stats.parsing > 0 && <span className="stat-parsing">解析中 {stats.parsing}</span>}
          {stats.done > 0 && <span className="stat-done">已完成 {stats.done}</span>}
          {stats.error > 0 && <span className="stat-error">失败 {stats.error}</span>}
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="empty-state">
          <p>尚未选择任何 PDF 文件</p>
        </div>
      ) : (
        <div className="document-list">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`document-row ${doc.status === 'done' ? 'clickable' : ''} ${doc.status === 'parsing' ? 'parsing' : ''}`}
              onClick={() => doc.status === 'done' && selectDocument(doc.id)}
            >
              <div className="doc-info">
                <span className="doc-name" title={doc.name}>{doc.name}</span>
                {doc.pageCount > 0 && (
                  <span className="doc-pages">{doc.pageCount} 页</span>
                )}
              </div>
              <div className="doc-actions">
                <span
                  className="status-badge"
                  style={{ color: STATUS_COLORS[doc.status] }}
                >
                  {STATUS_LABELS[doc.status]}
                </span>
                {doc.status === 'error' && doc.error && (
                  <span className="error-msg" title={doc.error}>{doc.error.slice(0, 30)}...</span>
                )}
                {doc.status === 'parsing' && (
                  <div className="spinner-mini" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
