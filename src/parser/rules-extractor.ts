const ANTHROPIC_API_URL = '/api/anthropic/v1/messages';

const SYSTEM_PROMPT = `You are a clinical rules DSL expert. Given an image of handwritten clinical diagnosis rules, convert them into YAML format for our Clinical Diagnosis Engine.

## YAML Rule Schema

Each rule follows this structure:

\`\`\`yaml
name: "Rule Name"

paths:
  - formula: "boolean expression combining group IDs with AND / OR"
    summary: "Human-readable summary when this diagnosis is present."

absent_summary: "Summary when diagnosis is absent."
indeterminate_summary: "Summary when data is insufficient."

groups:
  - id: group_identifier
    name: "Display Name"
    logic: ALL | ANY | AT_LEAST_N
    required: 3          # only for AT_LEAST_N
    concept_groups: true  # for OR-pair collapsing (e.g., temp high/low)
    criteria:
      - name: "Criterion description"
        field: section.fieldName
        operator: ">"
        value: 90
        unit: BPM
        concept: heartRate  # groups OR-pairs under one concept
\`\`\`

## Available Clinical Data Fields

Numeric fields (use operators: >, <, >=, <=):
- vitals: heartRate, respiratoryRate, temperatureF, systolicBP, diastolicBP, meanArterialPressure
- labs: wbc, creatinine, creatinineBaseline, creatinine48hAgo, ck, lvedp, sofaScore, fena

Boolean fields (use operators: is_true, is_false):
- medications: ivAntibiotics, oralAntibiotics, diureticsGiven, nsaidUse, nephrotoxicMedication
- symptoms: shortnessOfBreath, cough, chestPain, fever, changeInMentalStatus
- imaging: pulmonaryInfiltrate, groundGlassOpacity, consolidation
- urine: muddyBrownCasts
- framingham (major): paroxysmalNocturnalDyspnea, neckVeinDistention, rales, cardiomegaly, acutePulmonaryEdema, s3Gallop, hepatojugularReflux, weightLossOnDiuretics
- framingham (minor): ankleEdema, nocturnalCough, dyspneaOnExertion, hepatomegaly, pleuralEffusion, tachycardia

## Special Criterion Types

Delta (difference between two numeric fields):
  type: delta
  fields: [labs.creatinine, labs.creatinine48hAgo]
  operator: ">"
  value: 0.3
  unit: "mg/dL"

Ratio (ratio of two numeric fields):
  type: ratio
  fields: [labs.creatinine, labs.creatinineBaseline]
  operator: ">="
  value: 1.5

Compound (all sub-checks must pass):
  type: all_of
  checks:
    - field: symptoms.cough
      operator: is_true
      label: Cough
    - field: symptoms.fever
      operator: is_true
      label: Fever

Count fields (count boolean fields in named groups):
  type: count_fields
  field_groups:
    major: [framingham.rales, framingham.cardiomegaly, ...]
    minor: [framingham.ankleEdema, ...]
  met_when: "major >= 2 OR (major >= 1 AND minor >= 2)"
  detail_template: "{major} major, {minor} minor criteria present"

## Multiple Rules — Horizontal Line Separation

A single image may contain MULTIPLE diagnosis rules. Horizontal lines drawn on the paper
separate one rule from the next. Each section between horizontal lines is a SEPARATE,
INDEPENDENT diagnosis rule with its own name, paths, groups, and criteria.

Output each rule as a separate YAML document separated by a line containing only \`---\`.

Example with two rules on one page:
\`\`\`
name: "First Rule"
paths: ...
groups: ...
---
name: "Second Rule"
paths: ...
groups: ...
\`\`\`

If the image contains only one rule (no horizontal separators), output just that one rule
with no \`---\` separator.

## Critical Instructions — Faithful Interpretation

Your job is to be a LITERAL TRANSCRIBER, not a clinical expert. Convert EXACTLY what is written in the image — nothing more, nothing less.

DO:
- Translate every criterion, threshold, and logical relationship that appears in the handwriting
- Use the exact numeric thresholds written (e.g., if it says "> 100", use 100, not 90)
- Preserve the exact grouping and logic structure shown (AND vs OR, how many required)
- Use the closest matching field name from the Available Fields list above
- If the handwriting says "HR > 100", map to vitals.heartRate > 100
- Treat each section between horizontal lines as a SEPARATE diagnosis rule
- Output ONLY valid YAML, no markdown fences or explanation

DO NOT:
- Merge criteria from different sections (between horizontal lines) into a single rule
- Add criteria that are NOT in the image (e.g., don't add WBC criteria if only HR and RR are written)
- Substitute standard medical protocol values for what's actually written
- Expand a simple rule into a comprehensive clinical guideline
- Infer additional groups or criteria beyond what is explicitly shown
- Add concept_groups, count_fields, or other advanced features unless the image clearly calls for them
- Change thresholds to match textbook values — use the EXACT values from the handwriting

If the image shows a simple 2-criterion rule, produce a simple 2-criterion rule.
If the image shows a complex multi-group rule, produce that complex rule.
Match the scope and complexity of what is written — do not inflate or reduce it.

Each group must have a unique id (lowercase, underscores).
The paths formula must reference group ids using AND / OR with optional parentheses.`;

export async function extractRulesFromImage(
  imageBase64: string,
  mediaType: string,
): Promise<string[]> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'Convert the handwritten clinical diagnosis rules in this image into YAML following the schema described. Output only the YAML, nothing else.',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorBody}`);
  }

  const result = await response.json();

  const textBlock = result.content?.find(
    (block: { type: string }) => block.type === 'text',
  );

  if (!textBlock?.text) {
    throw new Error('No text returned from Claude API');
  }

  // Strip markdown fences if present
  let yamlText: string = textBlock.text.trim();
  if (yamlText.startsWith('```')) {
    yamlText = yamlText.replace(/^```(?:yaml)?\n?/, '').replace(/\n?```$/, '');
  }

  // Split on YAML document separator --- (each section is a separate rule)
  const documents = yamlText
    .split(/\n---\n/)
    .map((doc) => doc.trim())
    .filter((doc) => doc.length > 0);

  return documents;
}
