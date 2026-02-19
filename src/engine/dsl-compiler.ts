import type {
  ClinicalData,
  CriterionDef,
  CriteriaGroupDef,
  CriteriaGroupResult,
  RuleDef,
  DiagnosisStatus,
  GroupLogic,
} from '../types/clinical';

// ── YAML shape interfaces ────────────────────────────────────────────

interface CheckYAML {
  field: string;
  operator: string;
  value?: number;
  label?: string;
  unit?: string;
}

interface CriterionYAML {
  name: string;
  type?: 'delta' | 'ratio' | 'all_of' | 'count_fields';
  // simple field check
  field?: string;
  operator?: string;
  value?: number;
  unit?: string;
  label?: string;
  concept?: string;
  // delta / ratio
  fields?: string[];
  // all_of
  checks?: CheckYAML[];
  // count_fields
  field_groups?: Record<string, string[]>;
  met_when?: string;
  detail_template?: string;
}

interface GroupYAML {
  id: string;
  name: string;
  logic: GroupLogic;
  required?: number;
  concept_groups?: boolean;
  criteria: CriterionYAML[];
}

interface PathYAML {
  formula: string;
  summary: string;
}

interface RuleYAML {
  name: string;
  paths: PathYAML[];
  absent_summary: string;
  indeterminate_summary: string;
  groups: GroupYAML[];
}

// ── Field accessor ───────────────────────────────────────────────────

function makeAccessor(path: string): (d: ClinicalData) => unknown {
  const keys = path.split('.');
  return (d: ClinicalData) => {
    let val: unknown = d;
    for (const key of keys) {
      if (val === null || val === undefined) return null;
      val = (val as Record<string, unknown>)[key];
    }
    return val ?? null;
  };
}

// ── Numeric comparison ───────────────────────────────────────────────

function numCompare(op: string, threshold: number): (n: number) => boolean {
  switch (op) {
    case '>':  return (n) => n > threshold;
    case '<':  return (n) => n < threshold;
    case '>=': return (n) => n >= threshold;
    case '<=': return (n) => n <= threshold;
    case '==': return (n) => n === threshold;
    case '!=': return (n) => n !== threshold;
    default: throw new Error(`Unknown operator: ${op}`);
  }
}

// ── Detail formatting helpers ────────────────────────────────────────

function fmtNum(val: unknown, unit: string): string {
  if (val === null || val === undefined) return 'Not available';
  return `${val} ${unit}`;
}

function fmtBool(val: unknown, label: string): string {
  if (val === null || val === undefined) return `${label}: Unknown`;
  return val ? `${label}: Yes` : `${label}: No`;
}

// ── Criterion compilers ──────────────────────────────────────────────

function compileFieldCheck(c: CriterionYAML): CriterionDef {
  const get = makeAccessor(c.field!);
  const op = c.operator!;

  if (op === 'is_true' || op === 'is_false') {
    const target = op === 'is_true';
    return {
      name: c.name,
      evaluate: (d) => {
        const val = get(d);
        if (val === null) return 'unknown';
        return val === target ? 'met' : 'not_met';
      },
      detail: (d) => fmtBool(get(d), c.label ?? c.name),
      conceptGroup: c.concept,
    };
  }

  // numeric check
  const test = numCompare(op, c.value!);
  return {
    name: c.name,
    evaluate: (d) => {
      const val = get(d);
      if (val === null) return 'unknown';
      return test(val as number) ? 'met' : 'not_met';
    },
    detail: (d) => {
      const val = get(d);
      if (c.label) {
        // labelled numeric (e.g., SOFA)
        return val !== null ? `${c.label}: ${val}` : 'Not available';
      }
      return fmtNum(val, c.unit ?? '');
    },
    conceptGroup: c.concept,
  };
}

function compileDelta(c: CriterionYAML): CriterionDef {
  const [currentPath, previousPath] = c.fields!;
  const getCurrent = makeAccessor(currentPath);
  const getPrevious = makeAccessor(previousPath);
  const test = numCompare(c.operator!, c.value!);

  return {
    name: c.name,
    evaluate: (d) => {
      const cur = getCurrent(d);
      const prev = getPrevious(d);
      if (cur === null || prev === null) return 'unknown';
      const delta = (cur as number) - (prev as number);
      return test(delta) ? 'met' : 'not_met';
    },
    detail: (d) => {
      const cur = getCurrent(d) as number | null;
      const prev = getPrevious(d) as number | null;
      if (cur === null || prev === null) return 'Creatinine values insufficient';
      const delta = (cur - prev).toFixed(2);
      const prevLabel = previousPath.includes('48h') ? '48h ago' : 'previous';
      return `\u0394 Creatinine: ${delta} ${c.unit ?? ''} (current: ${cur}, ${prevLabel}: ${prev})`;
    },
  };
}

function compileRatio(c: CriterionYAML): CriterionDef {
  const [numeratorPath, denominatorPath] = c.fields!;
  const getNum = makeAccessor(numeratorPath);
  const getDen = makeAccessor(denominatorPath);
  const test = numCompare(c.operator!, c.value!);

  return {
    name: c.name,
    evaluate: (d) => {
      const num = getNum(d);
      const den = getDen(d);
      if (num === null || den === null) return 'unknown';
      const ratio = (num as number) / (den as number);
      return test(ratio) ? 'met' : 'not_met';
    },
    detail: (d) => {
      const num = getNum(d) as number | null;
      const den = getDen(d) as number | null;
      if (num === null || den === null) return 'Baseline creatinine not available';
      const ratio = (num / den).toFixed(2);
      return `Creatinine ratio: ${ratio}\u00d7 baseline (current: ${num}, baseline: ${den})`;
    },
  };
}

function compileAllOf(c: CriterionYAML): CriterionDef {
  const checks = c.checks!.map((ch) => ({
    get: makeAccessor(ch.field),
    op: ch.operator,
    value: ch.value,
    label: ch.label ?? ch.field,
    unit: ch.unit,
  }));

  return {
    name: c.name,
    evaluate: (d) => {
      let metCount = 0;
      let unknownCount = 0;
      for (const ch of checks) {
        const val = ch.get(d);
        if (ch.op === 'is_true' || ch.op === 'is_false') {
          const target = ch.op === 'is_true';
          if (val === null) unknownCount++;
          else if (val === target) metCount++;
        } else {
          if (val === null) unknownCount++;
          else if (numCompare(ch.op, ch.value!)(val as number)) metCount++;
        }
      }
      if (metCount === checks.length) return 'met';
      if (metCount + unknownCount >= checks.length && metCount >= 1) return 'unknown';
      return 'not_met';
    },
    detail: (d) => {
      const parts = checks.map((ch) => {
        const val = ch.get(d);
        if (ch.op === 'is_true' || ch.op === 'is_false') {
          return fmtBool(val, ch.label);
        }
        if (val !== null && val !== undefined) {
          return `${ch.label}: ${val}${ch.unit ? ' ' + ch.unit : ''}`;
        }
        return `${ch.label}: Unknown`;
      });
      return parts.join('; ');
    },
  };
}

// ── met_when expression parser for count_fields ──────────────────────

type CountExprNode =
  | { type: 'compare'; variable: string; op: string; value: number }
  | { type: 'and'; left: CountExprNode; right: CountExprNode }
  | { type: 'or'; left: CountExprNode; right: CountExprNode };

function parseCountExpr(expr: string): CountExprNode {
  const tokens = tokenize(expr);
  let pos = 0;

  function peek(): string | undefined { return tokens[pos]; }
  function advance(): string { return tokens[pos++]; }

  function parseOr(): CountExprNode {
    let left = parseAnd();
    while (peek() === 'OR') {
      advance();
      left = { type: 'or', left, right: parseAnd() };
    }
    return left;
  }

  function parseAnd(): CountExprNode {
    let left = parseAtom();
    while (peek() === 'AND') {
      advance();
      left = { type: 'and', left, right: parseAtom() };
    }
    return left;
  }

  function parseAtom(): CountExprNode {
    if (peek() === '(') {
      advance(); // consume '('
      const node = parseOr();
      advance(); // consume ')'
      return node;
    }
    // comparison: variable op number
    const variable = advance();
    const op = advance();
    const value = Number(advance());
    return { type: 'compare', variable, op, value };
  }

  return parseOr();
}

function evalCountExpr(node: CountExprNode, vars: Record<string, number>): boolean {
  switch (node.type) {
    case 'compare': {
      const val = vars[node.variable] ?? 0;
      return numCompare(node.op, node.value)(val);
    }
    case 'and': return evalCountExpr(node.left, vars) && evalCountExpr(node.right, vars);
    case 'or': return evalCountExpr(node.left, vars) || evalCountExpr(node.right, vars);
  }
}

function compileCountFields(c: CriterionYAML): CriterionDef {
  const fieldGroups = c.field_groups!;
  const accessorGroups: Record<string, ((d: ClinicalData) => unknown)[]> = {};
  for (const [groupName, paths] of Object.entries(fieldGroups)) {
    accessorGroups[groupName] = paths.map(makeAccessor);
  }
  const metWhenAst = parseCountExpr(c.met_when!);
  const detailTemplate = c.detail_template ?? '';

  return {
    name: c.name,
    evaluate: (d) => {
      const counts: Record<string, number> = {};
      let totalKnown = 0;
      let totalCount = 0;
      for (const [groupName, accessors] of Object.entries(accessorGroups)) {
        let count = 0;
        for (const get of accessors) {
          const val = get(d);
          totalCount++;
          if (val !== null) {
            totalKnown++;
            if (val) count++;
          }
        }
        counts[groupName] = count;
      }
      // total = sum of all group counts
      counts['total'] = Object.values(counts).reduce((a, b) => a + b, 0);

      if (totalKnown === 0) return 'unknown';
      return evalCountExpr(metWhenAst, counts) ? 'met' : 'not_met';
    },
    detail: (d) => {
      const counts: Record<string, number> = {};
      for (const [groupName, accessors] of Object.entries(accessorGroups)) {
        let count = 0;
        for (const get of accessors) {
          const val = get(d);
          if (val !== null && val) count++;
        }
        counts[groupName] = count;
      }
      let result = detailTemplate;
      for (const [key, val] of Object.entries(counts)) {
        result = result.replace(`{${key}}`, String(val));
      }
      return result;
    },
  };
}

// ── Criterion dispatcher ─────────────────────────────────────────────

function compileCriterion(c: CriterionYAML): CriterionDef {
  switch (c.type) {
    case 'delta':       return compileDelta(c);
    case 'ratio':       return compileRatio(c);
    case 'all_of':      return compileAllOf(c);
    case 'count_fields': return compileCountFields(c);
    default:            return compileFieldCheck(c);
  }
}

// ── Group compiler ───────────────────────────────────────────────────

function compileGroup(g: GroupYAML): CriteriaGroupDef {
  return {
    name: g.name,
    logic: g.logic,
    requiredCount: g.required,
    useConceptGroups: g.concept_groups,
    criteria: g.criteria.map(compileCriterion),
  };
}

// ── Formula parser (boolean expressions over group IDs) ──────────────

type FormulaNode =
  | { type: 'id'; value: string }
  | { type: 'and'; left: FormulaNode; right: FormulaNode }
  | { type: 'or'; left: FormulaNode; right: FormulaNode };

function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    if (expr[i] === ' ') { i++; continue; }
    if (expr[i] === '(' || expr[i] === ')') {
      tokens.push(expr[i]);
      i++;
      continue;
    }
    // read word or number or operator
    let word = '';
    while (i < expr.length && expr[i] !== ' ' && expr[i] !== '(' && expr[i] !== ')') {
      word += expr[i];
      i++;
    }
    tokens.push(word);
  }
  return tokens;
}

function parseFormula(expr: string): FormulaNode {
  const tokens = tokenize(expr);
  let pos = 0;

  function peek(): string | undefined { return tokens[pos]; }
  function advance(): string { return tokens[pos++]; }

  function parseOr(): FormulaNode {
    let left = parseAnd();
    while (peek() === 'OR') {
      advance();
      left = { type: 'or', left, right: parseAnd() };
    }
    return left;
  }

  function parseAnd(): FormulaNode {
    let left = parseAtom();
    while (peek() === 'AND') {
      advance();
      left = { type: 'and', left, right: parseAtom() };
    }
    return left;
  }

  function parseAtom(): FormulaNode {
    if (peek() === '(') {
      advance();
      const node = parseOr();
      advance(); // ')'
      return node;
    }
    return { type: 'id', value: advance() };
  }

  return parseOr();
}

function evalFormula(node: FormulaNode, met: Record<string, boolean>): boolean {
  switch (node.type) {
    case 'id': return met[node.value] ?? false;
    case 'and': return evalFormula(node.left, met) && evalFormula(node.right, met);
    case 'or': return evalFormula(node.left, met) || evalFormula(node.right, met);
  }
}

// ── Rule compiler ────────────────────────────────────────────────────

export function compileRule(raw: unknown): RuleDef {
  const yaml = raw as RuleYAML;
  const groupDefs = yaml.groups.map(compileGroup);
  const groupIdToIndex = new Map<string, number>();
  yaml.groups.forEach((g, i) => groupIdToIndex.set(g.id, i));

  const parsedPaths = yaml.paths.map((p) => ({
    ast: parseFormula(p.formula),
    summary: p.summary,
  }));

  return {
    name: yaml.name,
    groups: groupDefs,
    evaluate: (groupResults: CriteriaGroupResult[]) => {
      // Build lookup maps
      const metMap: Record<string, boolean> = {};
      const optimisticMap: Record<string, boolean> = {};
      for (const [id, idx] of groupIdToIndex) {
        metMap[id] = groupResults[idx].met;
        optimisticMap[id] = groupResults[idx].met || groupResults[idx].indeterminate;
      }

      // Check each path — first match wins
      for (const path of parsedPaths) {
        if (evalFormula(path.ast, metMap)) {
          return { status: 'present' as DiagnosisStatus, summary: path.summary };
        }
      }

      // Check if any path could be true with optimistic (indeterminate) values
      for (const path of parsedPaths) {
        if (evalFormula(path.ast, optimisticMap)) {
          return { status: 'indeterminate' as DiagnosisStatus, summary: yaml.indeterminate_summary };
        }
      }

      return { status: 'absent' as DiagnosisStatus, summary: yaml.absent_summary };
    },
  };
}
