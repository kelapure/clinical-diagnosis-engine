import type {
  ClinicalData,
  RuleDef,
  CriteriaGroupDef,
  CriteriaGroupResult,
  CriterionResult,
  DiagnosisResult,
} from '../types/clinical';

function evaluateGroup(group: CriteriaGroupDef, data: ClinicalData): CriteriaGroupResult {
  const criteriaResults: CriterionResult[] = group.criteria.map((c) => ({
    name: c.name,
    status: c.evaluate(data),
    detail: c.detail(data),
    conceptGroup: c.conceptGroup,
  }));

  let metCount: number;
  let unknownCount: number;
  let totalCount: number;

  if (group.useConceptGroups) {
    // Collapse OR-pairs by conceptGroup: a concept is "met" if ANY criterion in that group is met
    const conceptMap = new Map<string, CriterionResult[]>();
    for (const cr of criteriaResults) {
      const key = cr.conceptGroup ?? cr.name;
      if (!conceptMap.has(key)) conceptMap.set(key, []);
      conceptMap.get(key)!.push(cr);
    }

    metCount = 0;
    unknownCount = 0;
    totalCount = conceptMap.size;

    for (const results of conceptMap.values()) {
      const anyMet = results.some((r) => r.status === 'met');
      const allNotMet = results.every((r) => r.status === 'not_met');
      if (anyMet) metCount++;
      else if (!allNotMet) unknownCount++;
    }
  } else {
    metCount = criteriaResults.filter((c) => c.status === 'met').length;
    unknownCount = criteriaResults.filter((c) => c.status === 'unknown').length;
    totalCount = criteriaResults.length;
  }

  let met = false;
  let indeterminate = false;

  switch (group.logic) {
    case 'ALL':
      met = metCount === totalCount;
      indeterminate = !met && unknownCount > 0 && (metCount + unknownCount) === totalCount;
      break;
    case 'ANY':
      met = metCount > 0;
      indeterminate = !met && unknownCount > 0;
      break;
    case 'AT_LEAST_N': {
      const required = group.requiredCount ?? 1;
      met = metCount >= required;
      indeterminate = !met && (metCount + unknownCount) >= required;
      break;
    }
  }

  return {
    name: group.name,
    met,
    indeterminate,
    criteria: criteriaResults,
    requiredCount: group.logic === 'AT_LEAST_N' ? group.requiredCount : undefined,
    metCount,
  };
}

export function evaluateRule(rule: RuleDef, data: ClinicalData): DiagnosisResult {
  const groupResults = rule.groups.map((g) => evaluateGroup(g, data));
  const { status, summary } = rule.evaluate(groupResults);

  return {
    ruleName: rule.name,
    status,
    groups: groupResults,
    summary,
  };
}

export function evaluateAllRules(rules: RuleDef[], data: ClinicalData): DiagnosisResult[] {
  return rules.map((rule) => evaluateRule(rule, data));
}
