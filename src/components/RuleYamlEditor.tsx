import { useState, useRef, useEffect } from 'react';

interface Props {
  id: string;
  name: string;
  yamlSource: string;
  error: string | null;
  onSave: (id: string, yaml: string) => void;
  onRemove: (id: string) => void;
}

export default function RuleYamlEditor({ id, name, yamlSource, error, onSave, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(yamlSource);
  const [confirming, setConfirming] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDirty = draft !== yamlSource;

  // Sync draft when external source changes (e.g., after save recompiles)
  useEffect(() => {
    setDraft(yamlSource);
  }, [yamlSource]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && expanded) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [draft, expanded]);

  const handleSave = () => {
    onSave(id, draft);
  };

  const handleRevert = () => {
    setDraft(yamlSource);
  };

  const handleDelete = () => {
    if (confirming) {
      onRemove(id);
      setConfirming(false);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab inserts 2 spaces instead of moving focus
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = draft.substring(0, start) + '  ' + draft.substring(end);
      setDraft(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
    // Ctrl/Cmd+S saves
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (isDirty) handleSave();
    }
  };

  return (
    <div className={`border-2 rounded-lg overflow-hidden shadow-sm ${error ? 'border-clinical-red/50 bg-red-50/50' : 'border-clinical-border bg-white'}`}>
      {/* Header */}
      <div className="flex items-center px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
          aria-expanded={expanded}
        >
          <svg
            className={`w-4 h-4 text-clinical-slate transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <h3 className="font-semibold text-clinical-navy">{name}</h3>
          {error && (
            <span className="text-xs font-medium text-clinical-red bg-red-100 px-2 py-0.5 rounded-full">
              Error
            </span>
          )}
          {!error && (
            <span className="text-xs font-medium text-clinical-green bg-green-100 px-2 py-0.5 rounded-full">
              Valid
            </span>
          )}
          {isDirty && (
            <span className="text-xs font-medium text-clinical-amber bg-amber-100 px-2 py-0.5 rounded-full">
              Unsaved
            </span>
          )}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
          className={`ml-2 p-1.5 rounded-md transition-colors ${
            confirming
              ? 'bg-clinical-red text-white'
              : 'text-clinical-slate hover:text-clinical-red hover:bg-red-50'
          }`}
          title={confirming ? 'Click again to confirm' : 'Delete rule'}
          aria-label={confirming ? 'Confirm delete' : 'Delete rule'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-clinical-border/50">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full mt-3 p-3 font-mono text-sm bg-slate-50 border border-clinical-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-clinical-blue/30 focus:border-clinical-blue leading-relaxed"
            style={{ minHeight: '200px', tabSize: 2 }}
            spellCheck={false}
          />

          {/* Validation status */}
          {error && (
            <div className="mt-2 text-xs text-clinical-red bg-red-50 border border-clinical-red/20 rounded p-2 font-mono whitespace-pre-wrap">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className="px-4 py-1.5 text-sm font-medium bg-clinical-blue text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save
            </button>
            {isDirty && (
              <button
                onClick={handleRevert}
                className="px-4 py-1.5 text-sm font-medium text-clinical-slate bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
              >
                Revert
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
