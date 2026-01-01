import React, { useMemo } from 'react';
import { ParsedFile } from '../types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area
} from 'recharts';
import { BrainCircuit, Zap, Scale } from 'lucide-react';

interface AnalyticsDashboardProps {
  data: ParsedFile[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data }) => {
  // 1. Prepare Data for TPS (Tokens Per Second) Leaderboard
  const tpsData = useMemo(() => {
    const modelStats: Record<string, { totalTPS: number; count: number }> = {};
    
    data.forEach(d => {
      if (d.duration > 0) {
        if (!modelStats[d.modelName]) modelStats[d.modelName] = { totalTPS: 0, count: 0 };
        const tps = d.totalTokens / d.duration;
        modelStats[d.modelName].totalTPS += tps;
        modelStats[d.modelName].count += 1;
      }
    });

    return Object.entries(modelStats)
      .map(([name, stats]) => ({
        name,
        tps: Math.round(stats.totalTPS / stats.count)
      }))
      .sort((a, b) => b.tps - a.tps); // Descending order
  }, [data]);

  // 2. Prepare Data for Reasoning Depth by Version
  const reasoningTrendData = useMemo(() => {
    // We want X-Axis: Prompt Version (sorted), Lines: Models
    const versions = Array.from(new Set(data.map(d => d.promptVersion))).sort((a: string, b: string) => {
        // Custom sort (same as MatrixTable logic)
        const getRank = (v: string) => {
          const s = v.toLowerCase();
          if (s.includes('no_prompt') || s.includes('control')) return 0;
          if (s.includes('baseline')) return 1;
          const match = s.match(/^v(\d+(\.\d+)?)/);
          if (match) return 10 + parseFloat(match[1]);
          return 100;
        };
        return getRank(a) - getRank(b);
    });

    const models = Array.from(new Set(data.map(d => d.modelName)));
    
    return versions.map(ver => {
        const point: any = { version: ver };
        models.forEach((m: string) => {
            const files = data.filter(d => d.modelName === m && d.promptVersion === ver);
            if (files.length > 0) {
                // Average reasoning tokens for this model & version
                const avgThinking = files.reduce((sum, f) => sum + f.thinkingTokens, 0) / files.length;
                point[m] = Math.round(avgThinking);
            }
        });
        return point;
    });
  }, [data]);

  // 3. Prepare Data for Token Composition (Reasoning vs Response)
  const compositionData = useMemo(() => {
    const modelStats: Record<string, { thinking: number; response: number; count: number }> = {};
    
    data.forEach(d => {
        if (!modelStats[d.modelName]) modelStats[d.modelName] = { thinking: 0, response: 0, count: 0 };
        modelStats[d.modelName].thinking += d.thinkingTokens;
        modelStats[d.modelName].response += d.responseTokens;
        modelStats[d.modelName].count += 1;
    });

    return Object.entries(modelStats)
      .map(([name, stats]) => ({
        name,
        avgThinking: Math.round(stats.thinking / stats.count),
        avgResponse: Math.round(stats.response / stats.count)
      }))
      .sort((a, b) => (b.avgThinking + b.avgResponse) - (a.avgThinking + a.avgResponse));
  }, [data]);

  const colors = ["#4f46e5", "#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

  if (data.length === 0) return null;

  return (
    <div className="w-full space-y-8 animate-fade-in">
      
      {/* Row 1: Reasoning Trend Line Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
                <BrainCircuit className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800">Reasoning Depth Analysis</h3>
                <p className="text-sm text-slate-500">How "thinking" intensity changes across prompt versions</p>
            </div>
        </div>
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reasoningTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="version" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Tokens', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px' }}
                    />
                    <Legend iconType="circle" />
                    {Object.keys(reasoningTrendData[0] || {}).filter(k => k !== 'version').map((modelKey, idx) => (
                        <Line 
                            key={modelKey}
                            type="monotone" 
                            dataKey={modelKey} 
                            stroke={colors[idx % colors.length]} 
                            strokeWidth={2}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 2: Speed / TPS */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-amber-100 rounded-lg">
                    <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Speed Leaderboard</h3>
                    <p className="text-sm text-slate-500">Average Tokens Per Second (TPS)</p>
                </div>
            </div>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={tpsData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" width={100} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                        <Bar dataKey="tps" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} name="Tokens/Sec" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Cost Composition */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-emerald-100 rounded-lg">
                    <Scale className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Token Composition</h3>
                    <p className="text-sm text-slate-500">Average Thinking vs. Response tokens</p>
                </div>
            </div>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compositionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={60} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                        <Bar dataKey="avgThinking" stackId="a" fill="#6366f1" name="Thinking Tokens" />
                        <Bar dataKey="avgResponse" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} name="Response Tokens" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;