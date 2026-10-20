import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, X, FileText, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  label?: string;
  title?: string;
  subtitle?: string;
  accept?: string;
  value?: string | null;
  fileName?: string;
  onChange?: (fileUrl: string, fileName: string) => void;
  error?: string;
  defaultSampleUrl?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  title = 'Upload Image',
  subtitle = 'JPG / PNG / PDF',
  accept = 'image/*,.pdf',
  value,
  fileName,
  onChange,
  error,
  defaultSampleUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [selectedFileName, setSelectedFileName] = useState<string>(fileName || '');
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    setSelectedFileName(file.name);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        onChange?.(result, file.name);
      };
      reader.readAsDataURL(file);
    } else {
      // PDF or other document
      setPreview('pdf');
      onChange?.('pdf', file.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setSelectedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onChange?.('', '');
  };

  const handleUseSample = (e: React.MouseEvent) => {
    e.stopPropagation();
    const sample = defaultSampleUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80';
    setPreview(sample);
    setSelectedFileName('sample_document.png');
    onChange?.(sample, 'sample_document.png');
  };

  const isPdf = preview === 'pdf' || (typeof preview === 'string' && (preview.endsWith('.pdf') || preview.includes('.pdf') || preview.startsWith('data:application/pdf')));

  return (
    <div className="w-full text-left">
      {label && (
        <label className="block text-xs font-bold text-[#075B64] mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative w-full rounded-xl p-4 transition-all duration-200 cursor-pointer
          flex items-center justify-between border-2 bg-white
          ${isDragging ? 'border-[#075B64] bg-[#DDF0F0]/50 scale-[1.01]' : 'border-[#6FA5A5] hover:border-[#075B64]'}
          ${error ? 'border-red-500' : ''}
          shadow-sm
        `}
      >
        <div className="flex items-center space-x-3.5 flex-1 min-w-0">
          {preview ? (
            isPdf ? (
              <div className="w-12 h-12 rounded-lg bg-[#075B64]/10 border border-[#075B64]/30 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-[#075B64]" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#6FA5A5] shrink-0 bg-slate-100 shadow-inner">
                <img src={preview} alt="Upload Preview" className="w-full h-full object-cover" />
              </div>
            )
          ) : (
            <div className="w-12 h-12 rounded-lg bg-[#DDF0F0] border border-[#6FA5A5]/60 flex items-center justify-center shrink-0 text-[#075B64]">
              <UploadCloud className="w-6 h-6 text-[#075B64] stroke-[2]" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            {preview ? (
              <div>
                <p className="text-xs font-bold text-[#075B64] truncate flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1 shrink-0" />
                  {selectedFileName || 'File selected'}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Click to replace document</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-[#075B64] tracking-tight">{title}</p>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">{subtitle}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 pl-2">
          {preview ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleUseSample}
              className="text-[10px] font-bold text-[#075B64] bg-[#DDF0F0] hover:bg-[#c9e7e7] px-2 py-1 rounded-md transition-colors"
              title="Quickly fill with sample"
            >
              Use Sample
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
};
