import React, { useCallback } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { parseContent, parseCSV } from '../utils/parser';
import { ParsedFile } from '../types';

interface DropzoneProps {
  onFilesParsed: (files: ParsedFile[]) => void;
  isProcessing: boolean;
  setIsProcessing: (loading: boolean) => void;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesParsed, isProcessing, setIsProcessing }) => {
  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    setIsProcessing(true);
    const results: ParsedFile[] = [];

    // Use a small timeout to allow UI to update to "Processing" state
    setTimeout(async () => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            const text = await file.text();
            
            if (file.name.endsWith('.csv')) {
                const csvResults = parseCSV(text);
                results.push(...csvResults);
            } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                const parsed = parseContent(file.name, text);
                if (parsed) {
                  results.push(parsed);
                }
            }
        } catch (err) {
            console.error(`Error reading ${file.name}`, err);
        }
      }
      onFilesParsed(results);
      setIsProcessing(false);
    }, 100);
  }, [onFilesParsed, setIsProcessing]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:bg-slate-50 transition-colors cursor-pointer bg-white shadow-sm group"
    >
      <input
        type="file"
        multiple
        accept=".txt,.csv"
        onChange={handleFileInput}
        className="hidden"
        id="fileInput"
      />
      <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center justify-center">
        {isProcessing ? (
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        ) : (
          <Upload className="w-12 h-12 text-slate-400 group-hover:text-indigo-500 transition-colors mb-4" />
        )}
        
        <h3 className="text-lg font-semibold text-slate-700">
          {isProcessing ? 'Processing files...' : 'Drop files here'}
        </h3>
        <p className="text-slate-500 mt-2 max-w-sm mx-auto">
          Drag and drop your .txt logs or .csv evaluation summaries.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          <FileText className="w-3 h-3" />
          <span>Supports .txt & .csv</span>
        </div>
      </label>
    </div>
  );
};

export default Dropzone;