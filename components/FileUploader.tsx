
import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, Image as ImageIcon } from 'lucide-react';

interface FileUploaderProps {
  onFileSelected: (file: File, base64: string) => void;
  isProcessing: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelected, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);

  const processFile = (file: File) => {
    if (!file) return;
    
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a PDF or Image file (JPEG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1];
      onFileSelected(file, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <label
        className={`
          relative flex flex-col items-center justify-center w-full h-72 
          rounded-3xl border-2 border-dashed transition-all cursor-pointer
          ${dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          shadow-sm hover:shadow-md
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="hidden"
          onChange={handleChange}
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center text-center p-8 space-y-4">
          <div className={`p-5 rounded-2xl transition-colors ${dragActive ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
            <Upload className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Click to upload or drag and drop
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto font-medium">
              Upload clothing labels in PDF, JPG, PNG or WebP format (max 10MB)
            </p>
          </div>
        </div>
      </label>
    </div>
  );
};

interface FilePreviewProps {
  file: File;
  onClear: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, onClear }) => {
  const isPdf = file.type === 'application/pdf';

  return (
    <div className="flex items-center p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 mb-6 max-w-xl mx-auto transition-colors">
      <div className={`p-4 rounded-xl mr-5 shadow-inner ${isPdf ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
        {isPdf ? <FileText className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-slate-900 dark:text-white truncate leading-tight mb-1">{file.name}</p>
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                {file.type.split('/')[1]}
            </span>
            <p className="text-xs font-semibold text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
        </div>
      </div>
      <button 
        onClick={onClear}
        className="p-3 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
        title="Remove file"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
};
