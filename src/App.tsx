import { useState, useCallback } from 'react';
import type { ClinicalData } from './types/clinical';
import { useDocumentUpload } from './hooks/useDocumentUpload';
import { useRulesEvaluation } from './hooks/useRulesEvaluation';
import { useRulesManager } from './hooks/useRulesManager';
import { extractClinicalData } from './parser/ai-extractor';
import Header from './components/Header';
import type { AppTab } from './components/Header';
import DocumentUpload from './components/DocumentUpload';
import ExtractedDataPanel from './components/ExtractedDataPanel';
import DiagnosisResultsPanel from './components/DiagnosisResultsPanel';
import RawTextViewer from './components/RawTextViewer';
import RulesEditorPanel from './components/RulesEditorPanel';

type Phase = 'upload' | 'processing' | 'review';

export default function App() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [activeTab, setActiveTab] = useState<AppTab>('analysis');
  const [clinicalData, setClinicalData] = useState<ClinicalData | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const { file, rawText, isExtracting, error: uploadError, handleFile, reset } = useDocumentUpload();
  const { entries, compiledRules, updateRule, removeRule, addRule, resetToDefaults } = useRulesManager();
  const diagnosisResults = useRulesEvaluation(compiledRules, clinicalData);

  const handleFileUpload = useCallback(
    async (f: File) => {
      setAiError(null);
      setClinicalData(null);
      handleFile(f);
    },
    [handleFile],
  );

  // Trigger AI extraction once raw text is available
  const handleAnalyze = useCallback(async () => {
    if (!rawText) return;
    setPhase('processing');
    setAiError(null);
    try {
      const data = await extractClinicalData(rawText);
      setClinicalData(data);
      setPhase('review');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err));
      setPhase('upload');
    }
  }, [rawText]);

  const handleReset = useCallback(() => {
    reset();
    setClinicalData(null);
    setAiError(null);
    setPhase('upload');
  }, [reset]);

  return (
    <div className="min-h-screen bg-clinical-light">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Analysis Tab ── */}
        {activeTab === 'analysis' && (
          <>
            {/* Upload Phase */}
            {phase === 'upload' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <DocumentUpload onFile={handleFileUpload} />

                {isExtracting && (
                  <div className="text-center py-4">
                    <div className="inline-block w-6 h-6 border-2 border-clinical-blue border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-clinical-slate mt-2">Extracting text from {file?.name}...</p>
                  </div>
                )}

                {uploadError && (
                  <div className="bg-red-50 border border-clinical-red/30 rounded-lg p-4 text-sm text-clinical-red">
                    {uploadError}
                  </div>
                )}

                {aiError && (
                  <div className="bg-red-50 border border-clinical-red/30 rounded-lg p-4 text-sm text-clinical-red">
                    <strong>AI Extraction Error:</strong> {aiError}
                  </div>
                )}

                {rawText && !isExtracting && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-clinical-green/30 rounded-lg p-4 text-sm text-clinical-green">
                      Text extracted from <strong>{file?.name}</strong> ({rawText.length.toLocaleString()} characters)
                    </div>
                    <RawTextViewer text={rawText} />
                    <button
                      onClick={handleAnalyze}
                      className="w-full py-3 bg-clinical-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Analyze with Claude AI
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Processing Phase */}
            {phase === 'processing' && (
              <div className="max-w-md mx-auto text-center py-20">
                <div className="inline-block w-12 h-12 border-3 border-clinical-blue border-t-transparent rounded-full animate-spin mb-6" />
                <h2 className="text-lg font-semibold text-clinical-navy">Analyzing Clinical Document</h2>
                <p className="text-sm text-clinical-slate mt-2">
                  Claude is extracting structured clinical data from your document...
                </p>
              </div>
            )}

            {/* Review Phase */}
            {phase === 'review' && clinicalData && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-clinical-slate">
                    Reviewing: <strong>{file?.name}</strong>
                  </p>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm bg-slate-100 text-clinical-slate rounded-md hover:bg-slate-200 transition-colors"
                  >
                    New Analysis
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ExtractedDataPanel
                    data={clinicalData}
                    onChange={setClinicalData}
                  />
                  <DiagnosisResultsPanel results={diagnosisResults} />
                </div>

                <div className="mt-6">
                  <RawTextViewer text={rawText} />
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Rules Editor Tab ── */}
        {activeTab === 'rules' && (
          <RulesEditorPanel
            entries={entries}
            onUpdate={updateRule}
            onRemove={removeRule}
            onAdd={addRule}
            onReset={resetToDefaults}
          />
        )}
      </main>
    </div>
  );
}
