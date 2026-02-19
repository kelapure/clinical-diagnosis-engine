import type { ClinicalData } from '../types/clinical';
import { NumberField, BooleanField } from './EditableField';

interface Props {
  data: ClinicalData;
  onChange: (data: ClinicalData) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-clinical-blue mb-2 border-b border-clinical-border pb-1">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export default function ExtractedDataPanel({ data, onChange }: Props) {
  const update = <S extends keyof ClinicalData>(
    section: S,
    field: keyof ClinicalData[S],
    value: ClinicalData[S][keyof ClinicalData[S]],
  ) => {
    onChange({
      ...data,
      [section]: { ...data[section], [field]: value },
    });
  };

  return (
    <div className="bg-white border border-clinical-border rounded-lg shadow-sm overflow-hidden">
      <div className="bg-slate-50 px-4 py-3 border-b border-clinical-border">
        <h2 className="font-semibold text-clinical-navy">Extracted Clinical Data</h2>
        <p className="text-xs text-clinical-slate mt-0.5">Click any value to edit</p>
      </div>
      <div className="p-4 max-h-[calc(100vh-280px)] overflow-y-auto">
        <Section title="Vital Signs">
          <NumberField label="Heart Rate" value={data.vitals.heartRate} unit="BPM" onChange={(v) => update('vitals', 'heartRate', v)} />
          <NumberField label="Respiratory Rate" value={data.vitals.respiratoryRate} unit="/min" onChange={(v) => update('vitals', 'respiratoryRate', v)} />
          <NumberField label="Temperature" value={data.vitals.temperatureF} unit="°F" onChange={(v) => update('vitals', 'temperatureF', v)} />
          <NumberField label="Systolic BP" value={data.vitals.systolicBP} unit="mmHg" onChange={(v) => update('vitals', 'systolicBP', v)} />
          <NumberField label="Diastolic BP" value={data.vitals.diastolicBP} unit="mmHg" onChange={(v) => update('vitals', 'diastolicBP', v)} />
          <NumberField label="MAP" value={data.vitals.meanArterialPressure} unit="mmHg" onChange={(v) => update('vitals', 'meanArterialPressure', v)} />
        </Section>

        <Section title="Lab Values">
          <NumberField label="WBC" value={data.labs.wbc} unit="K/µL" onChange={(v) => update('labs', 'wbc', v)} />
          <NumberField label="Creatinine" value={data.labs.creatinine} unit="mg/dL" onChange={(v) => update('labs', 'creatinine', v)} />
          <NumberField label="Creatinine (Baseline)" value={data.labs.creatinineBaseline} unit="mg/dL" onChange={(v) => update('labs', 'creatinineBaseline', v)} />
          <NumberField label="Creatinine (48h ago)" value={data.labs.creatinine48hAgo} unit="mg/dL" onChange={(v) => update('labs', 'creatinine48hAgo', v)} />
          <NumberField label="Creatine Kinase (CK)" value={data.labs.ck} unit="U/L" onChange={(v) => update('labs', 'ck', v)} />
          <NumberField label="LVEDP" value={data.labs.lvedp} unit="mmHg" onChange={(v) => update('labs', 'lvedp', v)} />
          <NumberField label="SOFA Score" value={data.labs.sofaScore} unit="" onChange={(v) => update('labs', 'sofaScore', v)} />
          <NumberField label="FENa" value={data.labs.fena} unit="%" onChange={(v) => update('labs', 'fena', v)} />
        </Section>

        <Section title="Medications">
          <BooleanField label="IV Antibiotics" value={data.medications.ivAntibiotics} onChange={(v) => update('medications', 'ivAntibiotics', v)} />
          <BooleanField label="Oral Antibiotics" value={data.medications.oralAntibiotics} onChange={(v) => update('medications', 'oralAntibiotics', v)} />
          <BooleanField label="Diuretics Given" value={data.medications.diureticsGiven} onChange={(v) => update('medications', 'diureticsGiven', v)} />
          <BooleanField label="NSAID Use" value={data.medications.nsaidUse} onChange={(v) => update('medications', 'nsaidUse', v)} />
          <BooleanField label="Nephrotoxic Medication" value={data.medications.nephrotoxicMedication} onChange={(v) => update('medications', 'nephrotoxicMedication', v)} />
        </Section>

        <Section title="Symptoms">
          <BooleanField label="Shortness of Breath" value={data.symptoms.shortnessOfBreath} onChange={(v) => update('symptoms', 'shortnessOfBreath', v)} />
          <BooleanField label="Cough" value={data.symptoms.cough} onChange={(v) => update('symptoms', 'cough', v)} />
          <BooleanField label="Chest Pain" value={data.symptoms.chestPain} onChange={(v) => update('symptoms', 'chestPain', v)} />
          <BooleanField label="Fever" value={data.symptoms.fever} onChange={(v) => update('symptoms', 'fever', v)} />
          <BooleanField label="Change in Mental Status" value={data.symptoms.changeInMentalStatus} onChange={(v) => update('symptoms', 'changeInMentalStatus', v)} />
        </Section>

        <Section title="Imaging Findings">
          <BooleanField label="Pulmonary Infiltrate" value={data.imaging.pulmonaryInfiltrate} onChange={(v) => update('imaging', 'pulmonaryInfiltrate', v)} />
          <BooleanField label="Ground Glass Opacity" value={data.imaging.groundGlassOpacity} onChange={(v) => update('imaging', 'groundGlassOpacity', v)} />
          <BooleanField label="Consolidation" value={data.imaging.consolidation} onChange={(v) => update('imaging', 'consolidation', v)} />
        </Section>

        <Section title="Urine Analysis">
          <BooleanField label="Muddy Brown Casts" value={data.urine.muddyBrownCasts} onChange={(v) => update('urine', 'muddyBrownCasts', v)} />
        </Section>

        <Section title="Framingham Criteria (Major)">
          <BooleanField label="Paroxysmal Nocturnal Dyspnea" value={data.framingham.paroxysmalNocturnalDyspnea} onChange={(v) => update('framingham', 'paroxysmalNocturnalDyspnea', v)} />
          <BooleanField label="Neck Vein Distention" value={data.framingham.neckVeinDistention} onChange={(v) => update('framingham', 'neckVeinDistention', v)} />
          <BooleanField label="Rales" value={data.framingham.rales} onChange={(v) => update('framingham', 'rales', v)} />
          <BooleanField label="Cardiomegaly" value={data.framingham.cardiomegaly} onChange={(v) => update('framingham', 'cardiomegaly', v)} />
          <BooleanField label="Acute Pulmonary Edema" value={data.framingham.acutePulmonaryEdema} onChange={(v) => update('framingham', 'acutePulmonaryEdema', v)} />
          <BooleanField label="S3 Gallop" value={data.framingham.s3Gallop} onChange={(v) => update('framingham', 's3Gallop', v)} />
          <BooleanField label="Hepatojugular Reflux" value={data.framingham.hepatojugularReflux} onChange={(v) => update('framingham', 'hepatojugularReflux', v)} />
          <BooleanField label="Weight Loss on Diuretics" value={data.framingham.weightLossOnDiuretics} onChange={(v) => update('framingham', 'weightLossOnDiuretics', v)} />
        </Section>

        <Section title="Framingham Criteria (Minor)">
          <BooleanField label="Ankle Edema" value={data.framingham.ankleEdema} onChange={(v) => update('framingham', 'ankleEdema', v)} />
          <BooleanField label="Nocturnal Cough" value={data.framingham.nocturnalCough} onChange={(v) => update('framingham', 'nocturnalCough', v)} />
          <BooleanField label="Dyspnea on Exertion" value={data.framingham.dyspneaOnExertion} onChange={(v) => update('framingham', 'dyspneaOnExertion', v)} />
          <BooleanField label="Hepatomegaly" value={data.framingham.hepatomegaly} onChange={(v) => update('framingham', 'hepatomegaly', v)} />
          <BooleanField label="Pleural Effusion" value={data.framingham.pleuralEffusion} onChange={(v) => update('framingham', 'pleuralEffusion', v)} />
          <BooleanField label="Tachycardia (HR > 120)" value={data.framingham.tachycardia} onChange={(v) => update('framingham', 'tachycardia', v)} />
        </Section>
      </div>
    </div>
  );
}
