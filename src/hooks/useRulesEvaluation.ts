import { useMemo } from 'react';
import type { ClinicalData, DiagnosisResult, RuleDef } from '../types/clinical';
import { evaluateAllRules } from '../engine/evaluator';

export function useRulesEvaluation(rules: RuleDef[], data: ClinicalData | null): DiagnosisResult[] {
  return useMemo(() => {
    if (!data) return [];
    return evaluateAllRules(rules, data);
  }, [rules, data]);
}
