import type { DiagnosisResult } from '../types/clinical';
import RuleResultCard from './RuleResultCard';

interface Props {
  results: DiagnosisResult[];
}

export default function DiagnosisResultsPanel({ results }: Props) {
  const visibleResults = results.filter((r) =>
    r.groups.some((g) => g.criteria.some((c) => c.status === 'met'))
  );

  return (
    <div>
      <div className="bg-slate-50 px-4 py-3 border border-clinical-border rounded-t-lg border-b-0">
        <h2 className="font-semibold text-clinical-navy">Diagnosis Results</h2>
        <p className="text-xs text-clinical-slate mt-0.5">Based on extracted clinical data</p>
      </div>
      <div className="space-y-3 border border-clinical-border rounded-b-lg border-t-0 p-4 bg-white">
        {visibleResults.length > 0 ? (
          visibleResults.map((result) => (
            <RuleResultCard key={result.ruleName} result={result} />
          ))
        ) : (
          <p className="text-sm text-clinical-slate text-center py-4">
            No diagnosis criteria met for the extracted clinical data.
          </p>
        )}
      </div>
    </div>
  );
}
