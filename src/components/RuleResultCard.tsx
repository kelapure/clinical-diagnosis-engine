import { useState } from 'react';
import type { DiagnosisResult, CriterionResult } from '../types/clinical';

interface Props {
  result: DiagnosisResult;
}

const STATUS_STYLES = {
  present: {
    border: 'border-clinical-red',
    bg: 'bg-red-50',
    badge: 'bg-clinical-red text-white',
    badgeText: 'PRESENT',
  },
  absent: {
    border: 'border-clinical-green',
    bg: 'bg-green-50',
    badge: 'bg-clinical-green text-white',
    badgeText: 'ABSENT',
  },
  indeterminate: {
    border: 'border-clinical-amber',
    bg: 'bg-amber-50',
    badge: 'bg-clinical-amber text-white',
    badgeText: 'INSUFFICIENT DATA',
  },
};

function CriterionIcon({ status }: { status: CriterionResult['status'] }) {
  if (status === 'met') {
    return (
      <svg className="w-4 h-4 text-clinical-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (status === 'not_met') {
    return (
      <svg className="w-4 h-4 text-clinical-red shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-clinical-amber shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" />
    </svg>
  );
}

export default function RuleResultCard({ result }: Props) {
  const [expanded, setExpanded] = useState(result.status === 'present');
  const style = STATUS_STYLES[result.status];

  return (
    <div className={`border-2 ${style.border} ${style.bg} rounded-lg overflow-hidden shadow-sm`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        aria-expanded={expanded}
        aria-label={`${result.ruleName}: ${style.badgeText}`}
      >
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-clinical-navy">{result.ruleName}</h3>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
            {style.badgeText}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-clinical-slate transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-clinical-border/50">
          <p className="text-sm text-clinical-slate mt-3 mb-3">{result.summary}</p>
          {result.groups.map((group) => (
            <div key={group.name} className="mb-3 last:mb-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-clinical-navy">
                  {group.name}
                </h4>
                {group.requiredCount !== undefined && (
                  <span className="text-xs text-clinical-slate">
                    ({group.metCount}/{group.requiredCount} required)
                  </span>
                )}
                {group.met && (
                  <span className="text-xs font-medium text-clinical-green">MET</span>
                )}
              </div>
              <ul className="space-y-1">
                {group.criteria.map((criterion) => (
                  <li key={criterion.name} className="flex items-start gap-2 text-sm">
                    <CriterionIcon status={criterion.status} />
                    <div>
                      <span className="font-medium text-clinical-navy">{criterion.name}</span>
                      <span className="text-clinical-slate ml-1.5">{criterion.detail}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
