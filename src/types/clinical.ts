// ── Clinical Data Schema ─────────────────────────────────────────────

export interface VitalSigns {
  heartRate: number | null;
  respiratoryRate: number | null;
  temperatureF: number | null;
  systolicBP: number | null;
  diastolicBP: number | null;
  meanArterialPressure: number | null;
}

export interface LabValues {
  wbc: number | null;                 // x1000/µL
  creatinine: number | null;          // mg/dL
  creatinineBaseline: number | null;  // mg/dL (if available)
  creatinine48hAgo: number | null;    // mg/dL (for delta calculation)
  ck: number | null;                  // U/L (creatine kinase)
  lvedp: number | null;              // mmHg (LV end-diastolic pressure)
  sofaScore: number | null;
  fena: number | null;               // fractional excretion of sodium (%)
}

export interface Medications {
  ivAntibiotics: boolean | null;
  oralAntibiotics: boolean | null;
  diureticsGiven: boolean | null;
  nsaidUse: boolean | null;
  nephrotoxicMedication: boolean | null;
}

export interface Symptoms {
  shortnessOfBreath: boolean | null;
  cough: boolean | null;
  chestPain: boolean | null;
  fever: boolean | null;
  changeInMentalStatus: boolean | null;
}

export interface ImagingFindings {
  pulmonaryInfiltrate: boolean | null;
  groundGlassOpacity: boolean | null;
  consolidation: boolean | null;
}

export interface UrineAnalysis {
  muddyBrownCasts: boolean | null;
}

export interface FraminghamCriteria {
  paroxysmalNocturnalDyspnea: boolean | null;
  neckVeinDistention: boolean | null;
  rales: boolean | null;
  cardiomegaly: boolean | null;
  acutePulmonaryEdema: boolean | null;
  s3Gallop: boolean | null;
  hepatojugularReflux: boolean | null;
  weightLossOnDiuretics: boolean | null;
  // Minor criteria
  ankleEdema: boolean | null;
  nocturnalCough: boolean | null;
  dyspneaOnExertion: boolean | null;
  hepatomegaly: boolean | null;
  pleuralEffusion: boolean | null;
  tachycardia: boolean | null;
}

export interface ClinicalData {
  vitals: VitalSigns;
  labs: LabValues;
  medications: Medications;
  symptoms: Symptoms;
  imaging: ImagingFindings;
  urine: UrineAnalysis;
  framingham: FraminghamCriteria;
}

// ── Rules Engine Types ───────────────────────────────────────────────

export type CriterionStatus = 'met' | 'not_met' | 'unknown';

export interface CriterionResult {
  name: string;
  status: CriterionStatus;
  detail: string;
  conceptGroup?: string;  // for collapsing OR-pairs (e.g., "temperature" for temp high/low)
}

export interface CriteriaGroupResult {
  name: string;
  met: boolean;
  indeterminate: boolean;
  criteria: CriterionResult[];
  requiredCount?: number;
  metCount: number;
}

export type DiagnosisStatus = 'present' | 'absent' | 'indeterminate';

export interface DiagnosisResult {
  ruleName: string;
  status: DiagnosisStatus;
  groups: CriteriaGroupResult[];
  summary: string;
}

// ── Criteria Group Definition Types ──────────────────────────────────

export type GroupLogic = 'ALL' | 'ANY' | 'AT_LEAST_N';

export interface CriterionDef {
  name: string;
  evaluate: (data: ClinicalData) => CriterionStatus;
  detail: (data: ClinicalData) => string;
  conceptGroup?: string;
}

export interface CriteriaGroupDef {
  name: string;
  logic: GroupLogic;
  requiredCount?: number;  // for AT_LEAST_N
  criteria: CriterionDef[];
  useConceptGroups?: boolean; // collapse OR-pairs before counting
}

export interface RuleDef {
  name: string;
  evaluate: (groupResults: CriteriaGroupResult[]) => { status: DiagnosisStatus; summary: string };
  groups: CriteriaGroupDef[];
}

// ── Empty Clinical Data Factory ──────────────────────────────────────

export function emptyClinicalData(): ClinicalData {
  return {
    vitals: {
      heartRate: null,
      respiratoryRate: null,
      temperatureF: null,
      systolicBP: null,
      diastolicBP: null,
      meanArterialPressure: null,
    },
    labs: {
      wbc: null,
      creatinine: null,
      creatinineBaseline: null,
      creatinine48hAgo: null,
      ck: null,
      lvedp: null,
      sofaScore: null,
      fena: null,
    },
    medications: {
      ivAntibiotics: null,
      oralAntibiotics: null,
      diureticsGiven: null,
      nsaidUse: null,
      nephrotoxicMedication: null,
    },
    symptoms: {
      shortnessOfBreath: null,
      cough: null,
      chestPain: null,
      fever: null,
      changeInMentalStatus: null,
    },
    imaging: {
      pulmonaryInfiltrate: null,
      groundGlassOpacity: null,
      consolidation: null,
    },
    urine: {
      muddyBrownCasts: null,
    },
    framingham: {
      paroxysmalNocturnalDyspnea: null,
      neckVeinDistention: null,
      rales: null,
      cardiomegaly: null,
      acutePulmonaryEdema: null,
      s3Gallop: null,
      hepatojugularReflux: null,
      weightLossOnDiuretics: null,
      ankleEdema: null,
      nocturnalCough: null,
      dyspneaOnExertion: null,
      hepatomegaly: null,
      pleuralEffusion: null,
      tachycardia: null,
    },
  };
}
