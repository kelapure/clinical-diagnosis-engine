import type { ClinicalData } from '../types/clinical';
import { emptyClinicalData } from '../types/clinical';

const ANTHROPIC_API_URL = '/api/anthropic/v1/messages';

const CLINICAL_DATA_TOOL = {
  name: 'extract_clinical_data',
  description: 'Extract structured clinical data from a medical document. Return null for any value not found in the document.',
  input_schema: {
    type: 'object' as const,
    properties: {
      vitals: {
        type: 'object' as const,
        properties: {
          heartRate: { type: ['number', 'null'] as const, description: 'Heart rate in BPM' },
          respiratoryRate: { type: ['number', 'null'] as const, description: 'Respiratory rate in breaths/min' },
          temperatureF: { type: ['number', 'null'] as const, description: 'Temperature in Fahrenheit. Convert from Celsius if needed (C*9/5+32).' },
          systolicBP: { type: ['number', 'null'] as const, description: 'Systolic blood pressure in mmHg' },
          diastolicBP: { type: ['number', 'null'] as const, description: 'Diastolic blood pressure in mmHg' },
          meanArterialPressure: { type: ['number', 'null'] as const, description: 'Mean arterial pressure in mmHg. Calculate from SBP/DBP if not given: (SBP + 2*DBP)/3' },
        },
        required: ['heartRate', 'respiratoryRate', 'temperatureF', 'systolicBP', 'diastolicBP', 'meanArterialPressure'],
      },
      labs: {
        type: 'object' as const,
        properties: {
          wbc: { type: ['number', 'null'] as const, description: 'White blood cell count in thousands/µL (e.g., 12.5 means 12,500)' },
          creatinine: { type: ['number', 'null'] as const, description: 'Current creatinine in mg/dL' },
          creatinineBaseline: { type: ['number', 'null'] as const, description: 'Baseline creatinine in mg/dL if mentioned' },
          creatinine48hAgo: { type: ['number', 'null'] as const, description: 'Creatinine from 48 hours ago in mg/dL if mentioned' },
          ck: { type: ['number', 'null'] as const, description: 'Creatine kinase in U/L' },
          lvedp: { type: ['number', 'null'] as const, description: 'Left ventricular end-diastolic pressure in mmHg' },
          sofaScore: { type: ['number', 'null'] as const, description: 'SOFA score if explicitly mentioned' },
          fena: { type: ['number', 'null'] as const, description: 'Fractional excretion of sodium in percent' },
        },
        required: ['wbc', 'creatinine', 'creatinineBaseline', 'creatinine48hAgo', 'ck', 'lvedp', 'sofaScore', 'fena'],
      },
      medications: {
        type: 'object' as const,
        properties: {
          ivAntibiotics: { type: ['boolean', 'null'] as const, description: 'Whether IV antibiotics are being administered. Look for: vancomycin, piperacillin-tazobactam, meropenem, ceftriaxone, etc.' },
          oralAntibiotics: { type: ['boolean', 'null'] as const, description: 'Whether oral antibiotics are being administered. Look for: amoxicillin, azithromycin, levofloxacin, doxycycline, etc.' },
          diureticsGiven: { type: ['boolean', 'null'] as const, description: 'Whether diuretics are being given. Look for: furosemide/Lasix, bumetanide, hydrochlorothiazide, etc.' },
          nsaidUse: { type: ['boolean', 'null'] as const, description: 'Whether NSAIDs are being used. Look for: ibuprofen, naproxen, ketorolac, indomethacin, etc.' },
          nephrotoxicMedication: { type: ['boolean', 'null'] as const, description: 'Whether nephrotoxic medications are being given. Look for: aminoglycosides, amphotericin B, contrast dye, cisplatin, etc.' },
        },
        required: ['ivAntibiotics', 'oralAntibiotics', 'diureticsGiven', 'nsaidUse', 'nephrotoxicMedication'],
      },
      symptoms: {
        type: 'object' as const,
        properties: {
          shortnessOfBreath: { type: ['boolean', 'null'] as const, description: 'Patient reports or shows shortness of breath / dyspnea' },
          cough: { type: ['boolean', 'null'] as const, description: 'Patient has cough' },
          chestPain: { type: ['boolean', 'null'] as const, description: 'Patient reports chest pain' },
          fever: { type: ['boolean', 'null'] as const, description: 'Patient has fever (temperature > 100.4°F / 38°C)' },
          changeInMentalStatus: { type: ['boolean', 'null'] as const, description: 'Change in mental status / altered mental status / confusion / delirium' },
        },
        required: ['shortnessOfBreath', 'cough', 'chestPain', 'fever', 'changeInMentalStatus'],
      },
      imaging: {
        type: 'object' as const,
        properties: {
          pulmonaryInfiltrate: { type: ['boolean', 'null'] as const, description: 'Imaging shows pulmonary infiltrate' },
          groundGlassOpacity: { type: ['boolean', 'null'] as const, description: 'Imaging shows ground glass opacity/opacities' },
          consolidation: { type: ['boolean', 'null'] as const, description: 'Imaging shows consolidation' },
        },
        required: ['pulmonaryInfiltrate', 'groundGlassOpacity', 'consolidation'],
      },
      urine: {
        type: 'object' as const,
        properties: {
          muddyBrownCasts: { type: ['boolean', 'null'] as const, description: 'Urine analysis shows muddy brown casts / granular casts' },
        },
        required: ['muddyBrownCasts'],
      },
      framingham: {
        type: 'object' as const,
        properties: {
          paroxysmalNocturnalDyspnea: { type: ['boolean', 'null'] as const, description: 'Major: Paroxysmal nocturnal dyspnea (PND)' },
          neckVeinDistention: { type: ['boolean', 'null'] as const, description: 'Major: Neck vein distention / JVD' },
          rales: { type: ['boolean', 'null'] as const, description: 'Major: Rales / crackles on lung exam' },
          cardiomegaly: { type: ['boolean', 'null'] as const, description: 'Major: Cardiomegaly on imaging' },
          acutePulmonaryEdema: { type: ['boolean', 'null'] as const, description: 'Major: Acute pulmonary edema' },
          s3Gallop: { type: ['boolean', 'null'] as const, description: 'Major: S3 gallop on cardiac exam' },
          hepatojugularReflux: { type: ['boolean', 'null'] as const, description: 'Major: Hepatojugular reflux' },
          weightLossOnDiuretics: { type: ['boolean', 'null'] as const, description: 'Major: Weight loss > 4.5kg in 5 days in response to diuretics' },
          ankleEdema: { type: ['boolean', 'null'] as const, description: 'Minor: Ankle edema / peripheral edema' },
          nocturnalCough: { type: ['boolean', 'null'] as const, description: 'Minor: Nocturnal cough' },
          dyspneaOnExertion: { type: ['boolean', 'null'] as const, description: 'Minor: Dyspnea on exertion' },
          hepatomegaly: { type: ['boolean', 'null'] as const, description: 'Minor: Hepatomegaly' },
          pleuralEffusion: { type: ['boolean', 'null'] as const, description: 'Minor: Pleural effusion' },
          tachycardia: { type: ['boolean', 'null'] as const, description: 'Minor: Tachycardia (HR > 120)' },
        },
        required: [
          'paroxysmalNocturnalDyspnea', 'neckVeinDistention', 'rales', 'cardiomegaly',
          'acutePulmonaryEdema', 's3Gallop', 'hepatojugularReflux', 'weightLossOnDiuretics',
          'ankleEdema', 'nocturnalCough', 'dyspneaOnExertion', 'hepatomegaly',
          'pleuralEffusion', 'tachycardia',
        ],
      },
    },
    required: ['vitals', 'labs', 'medications', 'symptoms', 'imaging', 'urine', 'framingham'],
  },
};

const SYSTEM_PROMPT = `You are a clinical data extraction assistant. Given a medical document, extract all relevant clinical data points into structured format.

Rules:
- Return null for any value not explicitly stated or inferable from the document.
- Convert temperature to Fahrenheit if given in Celsius.
- WBC should be in thousands (e.g., 12.5 for 12,500).
- Recognize common medication brand names and map them to their categories.
- If MAP is not stated but SBP and DBP are available, calculate it as (SBP + 2*DBP)/3.
- Look for both explicit statements and implied values (e.g., "febrile" implies fever=true, "temp 101.2" implies temperatureF=101.2).
- For Framingham criteria, look for both the clinical term and layperson descriptions.`;

export async function extractClinicalData(
  documentText: string,
): Promise<ClinicalData> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [CLINICAL_DATA_TOOL],
      tool_choice: { type: 'tool', name: 'extract_clinical_data' },
      messages: [
        {
          role: 'user',
          content: `Extract all clinical data from the following medical document:\n\n${documentText}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorBody}`);
  }

  const result = await response.json();

  const toolUseBlock = result.content?.find(
    (block: { type: string }) => block.type === 'tool_use',
  );

  if (!toolUseBlock) {
    throw new Error('No structured data returned from Claude API');
  }

  // Merge with empty data to fill any missing fields
  const empty = emptyClinicalData();
  const extracted = toolUseBlock.input as Partial<ClinicalData>;

  return {
    vitals: { ...empty.vitals, ...extracted.vitals },
    labs: { ...empty.labs, ...extracted.labs },
    medications: { ...empty.medications, ...extracted.medications },
    symptoms: { ...empty.symptoms, ...extracted.symptoms },
    imaging: { ...empty.imaging, ...extracted.imaging },
    urine: { ...empty.urine, ...extracted.urine },
    framingham: { ...empty.framingham, ...extracted.framingham },
  };
}
