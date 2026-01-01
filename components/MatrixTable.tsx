import React, { useMemo } from 'react';
import { ParsedFile } from '../types';
import { BrainCircuit, MessageSquare, Download, Clock, Image as ImageIcon, Type, AlertCircle } from 'lucide-react';

interface MatrixTableProps {
  data: ParsedFile[];
}

const MatrixTable: React.FC<MatrixTableProps> = ({ data }) => {
  // 1. Group Data by Model
  const groupedByModel = useMemo(() => {
    const groups: Record<string, ParsedFile[]> = {};
    const allVersions = new Set<string>();

    data.forEach((file) => {
      if (!groups[file.modelName]) {
        groups[file.modelName] = [];
      }
      groups[file.modelName].push(file);
      allVersions.add(file.promptVersion);
    });

    // Custom sort for versions: No Prompt -> Baseline -> v1 -> v2 ...
    const sortedVersions = Array.from(allVersions).sort((a, b) => {
      const getRank = (v: string) => {
        const s = v.toLowerCase();
        if (s.includes('no_prompt') || s.includes('control')) return 0;
        if (s.includes('baseline')) return 1;
        const match = s.match(/^v(\d+(\.\d+)?)/);
        if (match) return 10 + parseFloat(match[1]);
        return 100; // everything else
      };
      
      const rankA = getRank(a);
      const rankB = getRank(b);
      
      if (rankA !== rankB) return rankA - rankB;
      return a.localeCompare(b);
    });

    // Also sort models alphabetically
    const sortedModels = Object.keys(groups).sort();

    return { groups, sortedModels, globalVersions: sortedVersions };
  }, [data]);

  const { groups, sortedModels, globalVersions } = groupedByModel;

  const exportCSV = () => {
    // Basic CSV export of raw data
    let csv = 'Model,Prompt Version,Iteration,Input Mode,Thinking Tokens,Response Tokens,Duration (s),Valid JSON\n';
    data.forEach(f => {
      csv += `"${f.modelName}","${f.promptVersion}",${f.iteration},"${f.inputMode}",${f.thinkingTokens},${f.responseTokens},${f.duration},${f.isValidJson}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'model_eval_matrix.csv';
    a.click();
  };

  const getInputModeIcon = (mode: string) => {
    const m = mode.toLowerCase();
    if (m.includes('image') || m.includes('vision')) return <ImageIcon className="w-3 h-3" />;
    return <Type className="w-3 h-3" />;
  };

  // Helper to prettify label
  const formatVersionLabel = (v: string) => {
      const s = v.toLowerCase();
      if (s.includes('no_prompt') || s.includes('control')) return 'No Prompt';
      if (s === 'baseline') return 'Baseline';
      return v;
  };

  if (data.length === 0) return null;

  return (
    <div className="w-full animate-fade-in space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Model Performance Cards</h2>
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {sortedModels.map((modelName) => {
          const modelFiles = groups[modelName];
          
          // Identify Iterations specific to this model for columns
          const modelIterations: number[] = Array.from<number>(new Set(modelFiles.map(f => f.iteration))).sort((a: number, b: number) => a - b);
          
          // Rows are versions (using global set to keep alignment across cards)
          const rows = globalVersions;

          // Organize files for quick lookup: [iteration][version] -> File[]
          const lookup: Record<number, Record<string, ParsedFile[]>> = {};
          modelFiles.forEach(f => {
             if (!lookup[f.iteration]) lookup[f.iteration] = {};
             if (!lookup[f.iteration][f.promptVersion]) lookup[f.iteration][f.promptVersion] = [];
             lookup[f.iteration][f.promptVersion].push(f);
          });

          return (
            <div key={modelName} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Card Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                 <div>
                    <h3 className="text-lg font-bold text-slate-800 break-all">{modelName}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {modelFiles.length} runs across {modelIterations.length} iterations
                    </p>
                 </div>
              </div>

              {/* Grid Content */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      {/* Top-Left Corner: Axis Label */}
                      <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase w-48 sticky left-0 bg-white z-10 border-r border-slate-100 text-left pl-6">
                        Prompt Version
                      </th>
                      {/* Top Header: Iterations */}
                      {modelIterations.map(iter => (
                        <th key={iter} className="px-4 py-3 font-semibold text-slate-600 text-xs text-center border-l border-slate-100 min-w-[160px]">
                           Iteration {iter}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {rows.map(ver => (
                       <tr key={ver} className="hover:bg-slate-50/30 transition-colors">
                         {/* Left Sidebar: Version */}
                         <td className="px-4 py-4 font-bold text-slate-700 text-left sticky left-0 bg-white border-r border-slate-100 z-10 pl-6">
                            {formatVersionLabel(ver)}
                         </td>
                         
                         {/* Columns: Iterations */}
                         {modelIterations.map(iter => {
                            const files = lookup[iter]?.[ver];
                            
                            if (!files || files.length === 0) {
                              return (
                                <td key={iter} className="px-2 py-2 border-l border-slate-100 bg-slate-50/30 text-center">
                                  <span className="text-slate-300 text-xs">-</span>
                                </td>
                              );
                            }

                            return (
                              <td key={iter} className="px-2 py-2 border-l border-slate-100 align-top">
                                <div className="flex flex-col gap-2">
                                  {files.map((run, idx) => {
                                      const thinkingIntensity = Math.min(run.thinkingTokens / 4000, 1);
                                      return (
                                        <div key={idx} className="bg-white border border-slate-200 rounded p-2 shadow-sm relative overflow-hidden group">
                                            {/* Header: Duration & Mode */}
                                            <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-slate-50">
                                              <div className="flex items-center gap-1.5" title={run.inputMode}>
                                                <div className="text-slate-400">{getInputModeIcon(run.inputMode)}</div>
                                                <span className="text-[10px] uppercase font-bold text-slate-500">{run.inputMode.slice(0,4)}</span>
                                              </div>
                                              {run.duration > 0 && (
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                                                  <Clock className="w-3 h-3" />
                                                  <span>{run.duration.toFixed(1)}s</span>
                                                </div>
                                              )}
                                            </div>

                                            {/* Thinking */}
                                            {run.hasThinking ? (
                                              <div 
                                                className="relative rounded bg-blue-50/50 border border-blue-100 px-1.5 py-1 flex items-center justify-between gap-2 mb-1"
                                                title="Reasoning Tokens"
                                              >
                                                  <div 
                                                    className="absolute top-0 left-0 bottom-0 bg-blue-100/50 transition-all duration-500 rounded"
                                                    style={{ width: `${thinkingIntensity * 100}%` }}
                                                  />
                                                  <div className="relative z-10 flex items-center gap-1">
                                                    <BrainCircuit className="w-3 h-3 text-blue-600" />
                                                    <span className="font-mono text-xs font-semibold text-blue-700">{run.thinkingTokens.toLocaleString()}</span>
                                                  </div>
                                              </div>
                                            ) : (
                                              <div className="px-1.5 py-1 mb-1 flex items-center gap-1 opacity-30">
                                                <BrainCircuit className="w-3 h-3 text-slate-400" />
                                                <span className="text-[10px] text-slate-400">0</span>
                                              </div>
                                            )}

                                            {/* Response */}
                                            <div className="rounded bg-green-50/50 border border-green-100 px-1.5 py-1 flex items-center justify-between gap-2">
                                              <div className="flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3 text-green-600" />
                                                <span className="font-mono text-xs font-semibold text-green-700">{run.responseTokens.toLocaleString()}</span>
                                              </div>
                                              {!run.isValidJson && (
                                                <AlertCircle className="w-3 h-3 text-red-500" title="Invalid JSON Output" />
                                              )}
                                            </div>
                                        </div>
                                      );
                                  })}
                                </div>
                              </td>
                            );
                         })}
                       </tr>
                     ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatrixTable;