import { useState, useCallback } from 'react';

interface NumberFieldProps {
  label: string;
  value: number | null;
  unit: string;
  onChange: (val: number | null) => void;
}

interface BooleanFieldProps {
  label: string;
  value: boolean | null;
  onChange: (val: boolean | null) => void;
}

export function NumberField({ label, value, unit, onChange }: NumberFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const startEdit = useCallback(() => {
    setDraft(value !== null ? String(value) : '');
    setEditing(true);
  }, [value]);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft.trim() === '') {
      onChange(null);
    } else {
      const num = parseFloat(draft);
      if (!isNaN(num)) onChange(num);
    }
  }, [draft, onChange]);

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="text-sm text-clinical-slate w-44 shrink-0">{label}</span>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          className="w-24 px-2 py-1 text-sm border border-clinical-blue rounded focus:outline-none focus:ring-1 focus:ring-clinical-blue"
          autoFocus
          aria-label={label}
        />
        <span className="text-xs text-clinical-slate">{unit}</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 py-1 cursor-pointer hover:bg-blue-50/50 rounded px-1 -mx-1 transition-colors"
      onClick={startEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') startEdit(); }}
      aria-label={`${label}: ${value !== null ? `${value} ${unit}` : 'Not available'}. Click to edit.`}
    >
      <span className="text-sm text-clinical-slate w-44 shrink-0">{label}</span>
      <span className={`text-sm font-medium ${value !== null ? 'text-clinical-navy' : 'text-slate-400 italic'}`}>
        {value !== null ? `${value} ${unit}` : '—'}
      </span>
    </div>
  );
}

export function BooleanField({ label, value, onChange }: BooleanFieldProps) {
  const cycle = useCallback(() => {
    if (value === null) onChange(true);
    else if (value === true) onChange(false);
    else onChange(null);
  }, [value, onChange]);

  const display = value === null ? '—' : value ? 'Yes' : 'No';
  const color = value === null ? 'text-slate-400 italic' : value ? 'text-green-700' : 'text-red-700';

  return (
    <div
      className="flex items-center gap-2 py-1 cursor-pointer hover:bg-blue-50/50 rounded px-1 -mx-1 transition-colors"
      onClick={cycle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cycle(); } }}
      aria-label={`${label}: ${display}. Click to toggle.`}
    >
      <span className="text-sm text-clinical-slate w-44 shrink-0">{label}</span>
      <span className={`text-sm font-medium ${color}`}>{display}</span>
      <span className="text-xs text-slate-400 ml-auto">click to toggle</span>
    </div>
  );
}
