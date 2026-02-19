import { useState, useRef, useCallback } from 'react';
import { extractRulesFromImage } from '../parser/rules-extractor';

interface Props {
  apiKey: string;
  onRulesExtracted: (yamlDocs: string[]) => void;
}

export default function RulesImageUpload({ apiKey, onRulesExtracted }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!apiKey) {
      setError('Please set your Claude API key in the Analysis tab first.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const base64 = await fileToBase64(file);
      const yamlDocs = await extractRulesFromImage(apiKey, base64, file.type);
      onRulesExtracted(yamlDocs);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [apiKey, onRulesExtracted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  if (isProcessing) {
    return (
      <div className="border-2 border-clinical-blue/30 bg-blue-50/50 rounded-lg p-6 text-center">
        <div className="inline-block w-8 h-8 border-2 border-clinical-blue border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium text-clinical-navy">Analyzing handwritten rules...</p>
        <p className="text-xs text-clinical-slate mt-1">Claude is interpreting the image and generating YAML</p>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-clinical-blue bg-blue-50'
            : 'border-clinical-border hover:border-clinical-blue/50 hover:bg-slate-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleChange}
          className="hidden"
        />
        <svg className="w-8 h-8 mx-auto text-clinical-slate mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
        <p className="text-sm font-medium text-clinical-navy">Drop a photo of handwritten rules</p>
        <p className="text-xs text-clinical-slate mt-1">or click to browse — JPEG, PNG, or WebP</p>
      </div>

      {error && (
        <div className="mt-3 bg-red-50 border border-clinical-red/30 rounded-lg p-3 text-sm text-clinical-red">
          {error}
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
