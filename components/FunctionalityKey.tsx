import React from 'react';
import { 
  FileText, 
  BarChart3, 
  Grid3X3, 
  BrainCircuit, 
  MessageSquare, 
  Zap, 
  Download, 
  Upload,
  RefreshCw,
  Eye,
  Type
} from 'lucide-react';

const FunctionalityKey: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-24 space-y-6 animate-fade-in">
      <div>
        <h3 className="font-bold text-slate-800 text-lg mb-1">Functionality Key</h3>
        <p className="text-xs text-slate-500">Guide to application features and metrics.</p>
      </div>

      {/* Section 1: Data & Input */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Input & Parsing</h4>
        <div className="flex items-start gap-3">
            <div className="p-1.5 bg-slate-100 rounded text-slate-600">
                <Upload className="w-4 h-4" />
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-700">Multi-Format Ingestion</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                    Drag & drop <strong>.txt</strong> logs or <strong>.csv</strong> summaries. Auto-detects prompt versions (v1, v2) and model names.
                </p>
            </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Section 2: Matrix Visuals */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matrix Visualization</h4>
        
        <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <BrainCircuit className="w-3 h-3 text-slate-400" />
            <span className="font-medium text-slate-700">Thinking Tokens</span>
            <span className="text-xs text-slate-400 ml-auto">(Reasoning)</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <MessageSquare className="w-3 h-3 text-slate-400" />
            <span className="font-medium text-slate-700">Response Tokens</span>
            <span className="text-xs text-slate-400 ml-auto">(Output)</span>
        </div>

        <div className="flex items-start gap-3 mt-2">
             <div className="p-1.5 bg-slate-100 rounded text-slate-600">
                <Grid3X3 className="w-4 h-4" />
            </div>
             <div>
                <p className="text-sm font-semibold text-slate-700">Comparison Grid</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                    Rows align by <strong>Prompt Version</strong>. Columns group by <strong>Iteration</strong>.
                    Icons <Type className="w-3 h-3 inline mx-0.5" /> / <Eye className="w-3 h-3 inline mx-0.5" /> indicate Text or Vision mode.
                </p>
            </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Section 3: Analytics */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analytics Engine</h4>
        
        <div className="flex items-start gap-3">
             <div className="p-1.5 bg-amber-50 rounded text-amber-600">
                <Zap className="w-4 h-4" />
            </div>
             <div>
                <p className="text-sm font-semibold text-slate-700">Performance (TPS)</p>
                <p className="text-xs text-slate-500">
                    Calculates Tokens Per Second to benchmark model latency.
                </p>
            </div>
        </div>

        <div className="flex items-start gap-3">
             <div className="p-1.5 bg-indigo-50 rounded text-indigo-600">
                <BarChart3 className="w-4 h-4" />
            </div>
             <div>
                <p className="text-sm font-semibold text-slate-700">Reasoning Depth</p>
                <p className="text-xs text-slate-500">
                    Tracks how "Thinking" token usage evolves across prompt versions.
                </p>
            </div>
        </div>
      </div>

       <hr className="border-slate-100" />

       {/* Section 4: Actions */}
       <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data Actions</h4>
        <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 p-2 rounded border border-slate-100 flex flex-col items-center justify-center text-center gap-1">
                <Download className="w-4 h-4 text-slate-600" />
                <span className="text-[10px] font-medium text-slate-600">Export CSV</span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-100 flex flex-col items-center justify-center text-center gap-1">
                <RefreshCw className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-medium text-slate-600">Reset Data</span>
            </div>
        </div>
       </div>

    </div>
  );
};

export default FunctionalityKey;
