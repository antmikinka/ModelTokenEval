import React, { useState } from 'react';
import { ParsedFile } from './types';
import Dropzone from './components/Dropzone';
import MatrixTable from './components/MatrixTable';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import FunctionalityKey from './components/FunctionalityKey';
import { Activity, Database, FileCode, Layers, Image as ImageIcon, Type, BarChart3, Grid3X3 } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<ParsedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'analytics'>('matrix');

  const handleFilesParsed = (newFiles: ParsedFile[]) => {
    setData((prev) => [...prev, ...newFiles]);
  };

  const clearData = () => setData([]);

  // Calculate simple stats
  const stats = React.useMemo(() => {
     const models = new Set(data.map(d => d.modelName)).size;
     const totalRuns = data.length;
     const textOnly = data.filter(d => d.inputMode.toLowerCase().trim() === 'text').length;
     const multimodal = totalRuns - textOnly;
     
     return { models, totalRuns, textOnly, multimodal };
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Model Token Eval
            </h1>
          </div>
          <div className="flex items-center gap-4">
             {data.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                <Database className="w-4 h-4" />
                <span>{data.length} files parsed</span>
              </div>
            )}
            <a 
               href="#" 
               className="text-slate-400 hover:text-slate-600 transition-colors"
               title="View Python Script equivalent"
            >
              <FileCode className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-[95%] mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        
        {/* Intro / Empty State */}
        {data.length === 0 ? (
          <div className="max-w-3xl mx-auto mt-12 animate-fade-in-up">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Visualize your Model Benchmarks</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Upload your raw text logs to generate a comprehensive matrix of thinking tokens vs. response tokens.
                <br />
                <span className="text-sm text-slate-500 block mt-2">
                  Supports JSON logs and Text logs with metadata headers.
                </span>
              </p>
            </div>
            <Dropzone 
              onFilesParsed={handleFilesParsed} 
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content Column */}
            <div className="flex-1 space-y-6 min-w-0">
              {/* Action Bar / Stats */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm gap-4">
                
                {/* Left Side: Reset & Quick Stats */}
                <div className="flex items-center gap-6 px-4">
                  <button 
                    onClick={clearData}
                    className="text-sm font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Reset
                  </button>
                  
                  <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{stats.models}</span>
                        <span className="text-slate-500">Models</span>
                      </div>
                      <div className="w-px h-4 bg-slate-200"></div>
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{stats.textOnly}</span>
                        <span className="text-slate-500">Text</span>
                      </div>
                  </div>
                </div>

                {/* Center: Tab Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('matrix')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'matrix' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                    Matrix View
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'analytics' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </button>
                </div>

                {/* Right: Total Runs */}
                <div className="hidden sm:block text-xs text-slate-400 font-mono px-4">
                  {stats.totalRuns} runs
                </div>
              </div>

              {/* Content Area */}
              {activeTab === 'matrix' ? (
                <MatrixTable data={data} />
              ) : (
                <AnalyticsDashboard data={data} />
              )}
            </div>

            {/* Right Sidebar: Functionality Key */}
            <div className="w-full lg:w-72 shrink-0">
               <FunctionalityKey />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;