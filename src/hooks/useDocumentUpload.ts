import { useState, useCallback } from 'react';
import { extractTextFromFile } from '../parser/pdf-extractor';

interface UploadState {
  file: File | null;
  rawText: string;
  isExtracting: boolean;
  error: string | null;
}

export function useDocumentUpload() {
  const [state, setState] = useState<UploadState>({
    file: null,
    rawText: '',
    isExtracting: false,
    error: null,
  });

  const handleFile = useCallback(async (file: File) => {
    setState({ file, rawText: '', isExtracting: true, error: null });
    try {
      const text = await extractTextFromFile(file);
      if (!text.trim()) {
        setState((s) => ({ ...s, isExtracting: false, error: 'No text could be extracted from this file.' }));
        return;
      }
      setState((s) => ({ ...s, rawText: text, isExtracting: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        isExtracting: false,
        error: `Failed to extract text: ${err instanceof Error ? err.message : String(err)}`,
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({ file: null, rawText: '', isExtracting: false, error: null });
  }, []);

  return { ...state, handleFile, reset };
}
