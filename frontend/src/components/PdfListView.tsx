import { useRef, useCallback } from 'react';
import { useDocumentListStore } from '../store/useDocumentListStore';
import { parsePdfDocument } from '../utils/parsePdf';
import type { DocumentStatus } from '../types/document';

const STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: '⏳ 待解析',
  parsing: '🔄 解析中',
  done: '✅ 解析完成',
  error: '❌ 解析失败',
  saved: '💾 已保存',
};

const STATUS_COLORS: Record<DocumentStatus, string> = {
  pending: '#94A3B8',
  parsing: '#3B82F6',
  done: '#10B981',
  error: '#EF4444',
  saved: '#F59E0B',
};

export function PdfListView() {
  const documents = useDocumentListStore((s) => s.documents);
  const selectDocument = useDocumentListStore((s) => s.selectDocument);
  const removeDocument = useDocumentListStore((s) => s.removeDocument);
  const reparseDocument = useDocumentListStore((s) => s.reparseDocument);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingActionRef = useRef<{ docId: string; action: 'reparse' | 'load' } | null>(null);

  const handleFileForAction = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const action = pendingActionRef.current;
    if (file && action) {
      if (action.action === 'reparse') {
        reparseDocument(action.docId, file);
        setTimeout(() => parsePdfDocument(action.docId), 100);
      } else if (action.action === 'load') {
        useDocumentListStore.getState().loadSavedDocument(action.docId, file);
      }
    }
    pendingActionRef.current = null;
    if (e.target) e.target.value = '';
  }, [reparseDocument]);

  const triggerFileSelect = useCallback((docId: string, action: 'reparse' | 'load') => {
    pendingActionRef.current = { docId, action };
    setTimeout(() => fileInputRef.current?.click(), 0);
  }, []);

  const stats = {
    pending: documents.filter((d) => d.status === 'pending').length,
    parsing: documents.filter((d) => d.status === 'parsing').length,
    done: documents.filter((d) => d.status === 'done').length,
    error: documents.filter((d) => d.status === 'error').length,
    saved: documents.filter((d) => d.status === 'saved').length,
  };

  return (
    <div className="pdf-list-view">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileForAction}
        style={{ display: 'none' }}
      />

      <div className="list-header">
        <h2>PDF 列表</h2>
        <div className="list-stats">
          <span>共 {documents.length} 份</span>
          {stats.pending > 0 && <span className="stat-pending">待解析 {stats.pending}</span>}
          {stats.parsing > 0 && <span className="stat-parsing">解析中 {stats.parsing}</span>}
          {stats.done > 0 && <span className="stat-done">已完成 {stats.done}</span>}
          {stats.error > 0 && <span className="stat-error">失败 {stats.error}</span>}
          {stats.saved > 0 && <span className="stat-saved">已保存 {stats.saved}</span>}
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
              className={`document-row ${doc.status === 'done' || doc.status === 'saved' ? 'clickable' : ''} ${doc.status === 'parsing' ? 'parsing' : ''}`}
              onClick={() => (doc.status === 'done' || doc.status === 'saved') && selectDocument(doc.id)}
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

                {doc.status === 'done' && (
                  <button className="action-btn" onClick={(e) => { e.stopPropagation(); triggerFileSelect(doc.id, 'reparse'); }}>重新解析</button>
                )}

                {doc.status === 'error' && (
                  <button className="action-btn" onClick={(e) => { e.stopPropagation(); triggerFileSelect(doc.id, 'reparse'); }}>重新解析</button>
                )}

                {doc.status === 'saved' && (
                  <>
                    <button className="action-btn" onClick={(e) => { e.stopPropagation(); triggerFileSelect(doc.id, 'load'); }}>加载</button>
                    <button className="action-btn danger" onClick={(e) => { e.stopPropagation(); removeDocument(doc.id); }}>删除</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
