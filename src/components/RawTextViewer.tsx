import { useState } from 'react';

interface Props {
  text: string;
}

export default function RawTextViewer({ text }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-clinical-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
        aria-expanded={expanded}
      >
        <span className="text-sm font-medium text-clinical-navy">
          Raw Document Text
        </span>
        <svg
          className={`w-4 h-4 text-clinical-slate transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <pre className="p-4 text-xs text-clinical-slate bg-white overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap font-mono">
          {text}
        </pre>
      )}
    </div>
  );
}
