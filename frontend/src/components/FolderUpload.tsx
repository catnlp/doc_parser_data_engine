import { useRef, useState } from 'react';
import '../styles/upload.css';

interface FolderUploadProps {
  onFilesSelected: (files: File[]) => void;
}

export function FolderUpload({ onFilesSelected }: FolderUploadProps) {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    const pdfFiles = files.filter((f) => f.name.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      alert('所选文件夹中未找到 PDF 文件');
      return;
    }

    onFilesSelected(pdfFiles);
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (e.target.value) e.target.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (e.target.value) e.target.value = '';
  };

  const handleFolderClick = () => {
    folderInputRef.current?.click();
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={`upload-area ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="upload-content">
        <div className="upload-icon">📂</div>
        <h2 className="upload-title">上传 PDF 文件</h2>
        <p className="upload-description">
          选择文件夹以批量上传，或选择单个/多个 PDF 文件
        </p>
        <div className="upload-buttons">
          <button className="upload-btn primary" onClick={handleFolderClick}>
            📁 选择文件夹
          </button>
          <button className="upload-btn secondary" onClick={handleFileClick}>
            📄 选择文件
          </button>
        </div>
      </div>

      <input
        ref={folderInputRef}
        type="file"
        {...({ webkitdirectory: '' } as any)}
        accept=".pdf"
        onChange={handleFolderChange}
        className="hidden-input"
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden-input"
      />
    </div>
  );
}
