import { useCallback, useEffect } from 'react';
import { useDocumentListStore } from '../store/useDocumentListStore';
import { FolderUpload } from '../components/FolderUpload';
import { PdfListView } from '../components/PdfListView';
import { parseAllPendingDocuments } from '../utils/parsePdf';

export default function ListScreen() {
  const addDocuments = useDocumentListStore((s) => s.addDocuments);
  const isParsing = useDocumentListStore((s) => s.hasParsingDocuments);

  const handleFilesSelected = useCallback((files: File[]) => {
    addDocuments(files);
    setTimeout(() => {
      parseAllPendingDocuments();
    }, 100);
  }, [addDocuments]);

  useEffect(() => {
    if (!isParsing) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isParsing]);

  return (
    <div className="list-screen">
      <FolderUpload onFilesSelected={handleFilesSelected} />
      <PdfListView />
    </div>
  );
}
