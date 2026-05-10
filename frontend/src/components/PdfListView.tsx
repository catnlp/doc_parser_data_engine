import { useRef, useCallback } from 'react';
import JSZip from 'jszip';
import { useDocumentListStore } from '../store/useDocumentListStore';
import { parsePdfDocument } from '../utils/parsePdf';
import { importDocumentFromZip } from '../utils/importZip';
import type { DocumentStatus, PdfDocument } from '../types/document';

const STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: '⏳ 待解析',
  parsing: '',
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

async function exportDocumentAsZip(doc: PdfDocument) {
  const pages = doc.parsedData;
  if (!pages || pages.length === 0) {
    alert('No parsed data to export');
    return;
  }

  const failures: string[] = [];

  try {
    const zip = new JSZip();
    const baseName = doc.name.replace(/\.pdf$/i, '');
    let figureIdx = 0;
    const exportPages: Array<{
      page_number: number;
      image_path: string;
      page_info: { width: number; height: number };
      elements: Array<Record<string, unknown>>;
    }> = [];

    for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
      const pageData = pages[pageIdx];
      if (!pageData) continue;

      const imageName = `page_${String(pageIdx + 1).padStart(3, '0')}.png`;

      // Add page image
      if (pageData.imageBase64) {
        const imgBase64 = pageData.imageBase64.split(',')[1] || pageData.imageBase64;
        zip.file(`${baseName}/${imageName}`, imgBase64, { base64: true });
      }

      const elements = pageData.ocrElements.map((el, i) => {
        const element: Record<string, unknown> = {
          category_type: el.category_type,
          poly: el.poly,
          order: i,
        };

        if (el.category_type === 'table' && el.html) {
          element.html = el.html;
        } else if ((el.category_type === 'equation' || el.category_type === 'formula' || el.category_type === 'display_formula') && el.latex) {
          element.latex = el.latex;
        } else {
          element.text = el.text || '';
        }

        return element;
      });

      // Extract figures/tables as separate images
      if (pageData.imageBase64) {
        const layoutElements = pageData.layoutElements;
        for (const el of layoutElements) {
          if (el.category_type !== 'figure' && el.category_type !== 'table') continue;
          const poly = el.poly;
          if (poly.length < 4) continue;

          const xMin = poly[0];
          const yMin = poly[1];
          const xMax = poly[2];
          const yMax = poly[3];

          const cropWidth = Math.round(xMax - xMin);
          const cropHeight = Math.round(yMax - yMin);
          if (cropWidth <= 0 || cropHeight <= 0) {
            figureIdx++;
            failures.push(`页面 ${pageIdx + 1} ${el.category_type} 元素坐标无效（宽=${cropWidth}, 高=${cropHeight}），已跳过`);
            continue;
          }

          figureIdx++;
          const idxStr = String(figureIdx).padStart(3, '0');

          // Crop the region from the rendered page image
          const img = new Image();
          try {
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error(`页面 ${pageIdx + 1} 图片加载失败`));
              img.src = pageData.imageBase64;
            });
          } catch (e: any) {
            failures.push(e.message || `页面 ${pageIdx + 1} ${el.category_type} 图片加载异常`);
            continue;
          }

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            failures.push(`页面 ${pageIdx + 1} ${el.category_type} 无法获取 Canvas 上下文`);
            continue;
          }
          canvas.width = cropWidth;
          canvas.height = cropHeight;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            img,
            xMin, yMin, canvas.width, canvas.height,
            0, 0, canvas.width, canvas.height,
          );

          const cropDataUrl = canvas.toDataURL('image/png');
          const cropBase64 = cropDataUrl.split(',')[1];
          zip.file(`${baseName}/images/page_${String(pageIdx + 1).padStart(3, '0')}_${el.category_type}_${idxStr}.png`, cropBase64, { base64: true });
        }
      }

      exportPages.push({
        page_number: pageIdx + 1,
        image_path: imageName,
        page_info: { width: pageData.width, height: pageData.height },
        elements,
      });
    }

    const result = {
      document_name: doc.name,
      total_pages: pages.length,
      pages: exportPages,
    };
    zip.file(`${baseName}/result.json`, JSON.stringify(result, null, 2));

    let content: Blob;
    try {
      content = await zip.generateAsync({ type: 'blob' });
    } catch (e: any) {
      alert('导出失败：文件过大，无法生成 ZIP。请尝试减少页数。');
      return;
    }

    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    if (failures.length > 0) {
      alert(`导出部分失败：\n${failures.join('\n')}`);
    }
  } catch (e: any) {
    alert('导出失败：' + (e.message || '未知错误'));
  }
}

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

  const handleExport = useCallback(async (doc: PdfDocument) => {
    await exportDocumentAsZip(doc);
  }, []);

  const zipInputRef = useRef<HTMLInputElement>(null);

  const handleImportZip = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const doc = await importDocumentFromZip(file);

      // Deduplicate name
      const existingDocs = useDocumentListStore.getState().documents;
      let name = doc.name;
      let counter = 1;
      while (existingDocs.some(d => d.name === name)) {
        name = `${doc.name}(导入 ${counter})`;
        counter++;
      }
      doc.name = name;

      // Directly insert into store (bypass addDocuments which creates pending docs)
      useDocumentListStore.setState((state) => ({
        documents: [...state.documents, doc],
      }));

      const STORAGE_KEY = 'parsedDocuments_v1';
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const existing: any[] = raw ? JSON.parse(raw) : [];
        const persisted = existing.filter((d: any) => d.name !== name);
        persisted.push({
          name: doc.name,
          pageCount: doc.pageCount,
          status: 'saved' as const,
          parsedData: doc.parsedData.map(({ imageBase64, ...rest }) => rest),
          error: null,
          parsedPageCount: doc.parsedData.length,
          savedAt: Date.now(),
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
      } catch {}

      const { saveImage } = await import('../utils/idb');
      for (let i = 0; i < doc.parsedData.length; i++) {
        saveImage(`persisted_${name}`, i, doc.parsedData[i].imageBase64, doc.parsedData[i].width, doc.parsedData[i].height);
      }

      alert('导入成功：' + name);
    } catch (e: any) {
      alert('导入失败：' + (e.message || '未知错误'));
    }
    e.target.value = '';
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
        <button className="action-btn" onClick={() => zipInputRef.current?.click()}>📥 导入 ZIP</button>
        <input
          ref={zipInputRef}
          type="file"
          accept=".zip"
          style={{ display: 'none' }}
          onChange={handleImportZip}
        />
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
                  <>
                    <span className="status-badge" style={{ color: '#3B82F6' }}>
                      {doc.parsedPageCount && doc.pageCount > 0
                        ? `🔄 解析中 (${doc.parsedPageCount}/${doc.pageCount})`
                        : '🔄 解析中'}
                    </span>
                    <div className="spinner-mini" />
                  </>
                )}

                {doc.status === 'done' && (
                  <>
                    <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleExport(doc); }}>导出 ZIP</button>
                    <button className="action-btn" onClick={(e) => { e.stopPropagation(); triggerFileSelect(doc.id, 'reparse'); }}>重新解析</button>
                  </>
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
