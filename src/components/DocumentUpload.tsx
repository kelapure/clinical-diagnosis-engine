import { useState, useCallback, useRef } from 'react';

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export default function DocumentUpload({ onFile, disabled = false }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile, disabled],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!disabled) inputRef.current?.click();
        }
      }}
      aria-label="Upload clinical document"
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
        ${disabled ? 'opacity-50 cursor-not-allowed border-slate-300 bg-slate-50' : ''}
        ${isDragOver ? 'border-clinical-blue bg-blue-50' : 'border-clinical-border bg-white hover:border-clinical-blue hover:bg-blue-50/50'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.text"
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
      />
      <svg className="w-12 h-12 mx-auto text-clinical-slate mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
      <p className="text-lg font-medium text-clinical-navy">
        {isDragOver ? 'Drop file here' : 'Drop a clinical document here'}
      </p>
      <p className="text-sm text-clinical-slate mt-1">
        or click to browse — PDF or TXT
      </p>
    </div>
  );
}
