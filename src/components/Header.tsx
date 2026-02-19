export type AppTab = 'analysis' | 'rules';

interface Props {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export default function Header({ activeTab, onTabChange }: Props) {
  return (
    <header className="bg-clinical-navy text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3 py-4">
          <svg className="w-8 h-8 text-clinical-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">Clinical Diagnosis Engine</h1>
            <p className="text-sm text-slate-400">AI-Powered Document Analysis & Rules-Based Diagnosis</p>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex gap-1 -mb-px">
          <button
            onClick={() => onTabChange('analysis')}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === 'analysis'
                ? 'bg-clinical-light text-clinical-navy'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Analysis
          </button>
          <button
            onClick={() => onTabChange('rules')}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === 'rules'
                ? 'bg-clinical-light text-clinical-navy'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Rules Editor
          </button>
        </nav>
      </div>
    </header>
  );
}
