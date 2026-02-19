import { useState } from 'react';
import type { RuleEntry } from '../hooks/useRulesManager';
import RuleYamlEditor from './RuleYamlEditor';
import RulesImageUpload from './RulesImageUpload';

const BLANK_RULE_TEMPLATE = `name: "New Rule"

paths:
  - formula: "group_a"
    summary: "Rule criteria met."

absent_summary: "Rule criteria not met."
indeterminate_summary: "Insufficient data."

groups:
  - id: group_a
    name: "Criteria Group"
    logic: ANY
    criteria:
      - name: "Example Criterion"
        field: vitals.heartRate
        operator: ">"
        value: 100
        unit: BPM
`;

interface Props {
  apiKey: string;
  entries: RuleEntry[];
  onUpdate: (id: string, yaml: string) => void;
  onRemove: (id: string) => void;
  onAdd: (yaml: string) => void;
  onReset: () => void;
}

export default function RulesEditorPanel({ apiKey, entries, onUpdate, onRemove, onAdd, onReset }: Props) {
  const [showUpload, setShowUpload] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    if (confirmReset) {
      onReset();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
    }
  };

  const handleRulesExtracted = (yamlDocs: string[]) => {
    for (const yaml of yamlDocs) {
      onAdd(yaml);
    }
    setShowUpload(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-clinical-blue text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          Upload Handwritten Rules
        </button>

        <button
          onClick={() => onAdd(BLANK_RULE_TEMPLATE)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-clinical-navy bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New Rule
        </button>

        <div className="flex-1" />

        <button
          onClick={handleReset}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            confirmReset
              ? 'bg-clinical-amber text-white hover:bg-amber-600'
              : 'text-clinical-slate bg-slate-100 hover:bg-slate-200'
          }`}
        >
          {confirmReset ? 'Confirm Reset' : 'Reset to Defaults'}
        </button>
      </div>

      {/* Image upload area */}
      {showUpload && (
        <RulesImageUpload
          apiKey={apiKey}
          onRulesExtracted={handleRulesExtracted}
        />
      )}

      {/* Rule editors */}
      <div className="space-y-3">
        {entries.map((entry) => (
          <RuleYamlEditor
            key={entry.id}
            id={entry.id}
            name={entry.name}
            yamlSource={entry.yamlSource}
            error={entry.error}
            onSave={onUpdate}
            onRemove={onRemove}
          />
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12 text-clinical-slate">
          <p className="text-sm">No rules configured. Add a new rule or reset to defaults.</p>
        </div>
      )}
    </div>
  );
}
