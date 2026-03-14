"use client";

import { useClimateStore } from "@/lib/store";
import { useSeasonalData } from "@/lib/hooks";
import { motion } from "framer-motion";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { Activity, Thermometer, Droplets, Wind } from "lucide-react";

export function SeasonalPulse() {
  const { timeRange, selectedVariable } = useClimateStore();
  const year = timeRange[1];
  const { data, isLoading } = useSeasonalData(year, selectedVariable);

  const colors = {
    temperature: { stroke: "#10b981", fill: "url(#tempGradient)", color: "#10b981" },
    precipitation: { stroke: "#34d399", fill: "url(#precipGradient)", color: "#34d399" },
    wind: { stroke: "#6ee7b7", fill: "url(#windGradient)", color: "#6ee7b7" }
  };

  const activeColor = colors[selectedVariable];
  const Icon = selectedVariable === 'temperature' ? Thermometer : selectedVariable === 'precipitation' ? Droplets : Wind;

  if (isLoading) {
    return (
      <div className="h-full min-h-[300px] flex items-center justify-center bg-slate-900/40 rounded-2xl border border-white/5">
        <div className="animate-pulse text-slate-500 text-xs font-bold tracking-widest uppercase">Calculating Pulse...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">Seasonal Pulse</h3>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{year} Environmental Distribution</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
          <Icon className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-300 capitalize">{selectedVariable}</span>
        </div>
      </div>

      <div className="flex-1 min-h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.05)" />
            <PolarAngleAxis 
              dataKey="month" 
              tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 'auto']} 
              tick={false}
              axisLine={false}
            />
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="precipGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="windGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Radar
              name={selectedVariable}
              dataKey="value"
              stroke={activeColor.stroke}
              fill={activeColor.fill}
              fillOpacity={0.5}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '12px'
              }}
              itemStyle={{ color: activeColor.stroke }}
            />
          </RadarChart>
        </ResponsiveContainer>
        
        {/* Center label */}
        <div className="absolute inset-0 m-auto w-12 h-12 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Domain</span>
          <span className="text-xs font-black text-emerald-400/50">{year}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest italic">
          Nature Cyclic Analysis
        </span>
        <div className="w-2 h-2 rounded-full bg-emerald-400/50 animate-ping shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
      </div>
    </motion.div>
  );
}
