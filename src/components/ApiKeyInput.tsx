import { useState, useEffect } from 'react';

const STORAGE_KEY = 'clinical-dx-engine-api-key';

interface Props {
  onApiKey: (key: string) => void;
}

export default function ApiKeyInput({ onApiKey }: Props) {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setKey(stored);
      onApiKey(stored);
      setSaved(true);
    }
  }, [onApiKey]);

  const handleSave = () => {
    if (!key.trim()) return;
    localStorage.setItem(STORAGE_KEY, key.trim());
    onApiKey(key.trim());
    setSaved(true);
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setKey('');
    onApiKey('');
    setSaved(false);
  };

  return (
    <div className="bg-white border border-clinical-border rounded-lg p-4 shadow-sm">
      <label className="block text-sm font-medium text-clinical-navy mb-2">
        Claude API Key
      </label>
      <div className="flex gap-2">
        <input
          type="password"
          value={key}
          onChange={(e) => { setKey(e.target.value); setSaved(false); }}
          placeholder="sk-ant-..."
          className="flex-1 px-3 py-2 border border-clinical-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-clinical-blue focus:border-transparent"
          aria-label="Claude API Key"
        />
        {saved ? (
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm bg-slate-100 text-clinical-slate rounded-md hover:bg-slate-200 transition-colors"
          >
            Clear
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="px-4 py-2 text-sm bg-clinical-blue text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        )}
      </div>
      {saved && (
        <p className="mt-2 text-xs text-green-600">API key saved to localStorage</p>
      )}
    </div>
  );
}
