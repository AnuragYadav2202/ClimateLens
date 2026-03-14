"use client";

import { useClimateStore } from "@/lib/store";
import { useZonalData } from "@/lib/hooks";
import { motion } from "framer-motion";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from "recharts";
import { Layers, Thermometer, Droplets, Wind, ArrowUp, ArrowDown } from "lucide-react";

export function ZonalMean() {
  const { timeRange, selectedVariable } = useClimateStore();
  const year = timeRange[1];
  const { data, isLoading } = useZonalData(year, selectedVariable);

  const colors = {
    temperature: { stroke: "#10b981", fill: "url(#tempGradient)", color: "#10b981" },
    precipitation: { stroke: "#34d399", fill: "url(#precipGradient)", color: "#34d399" },
    wind: { stroke: "#6ee7b7", fill: "url(#windGradient)", color: "#6ee7b7" }
  };

  const activeColor = colors[selectedVariable];
  const Icon = selectedVariable === 'temperature' ? Thermometer : selectedVariable === 'precipitation' ? Droplets : Wind;

  if (isLoading) {
    return (
      <div className="h-full min-h-[300px] flex items-center justify-center bg-slate-950/40 rounded-2xl border border-white/5">
        <div className="animate-pulse text-slate-600 text-xs font-bold tracking-widest uppercase text-center">
          <Layers className="w-5 h-5 mx-auto mb-2 opacity-20" />
          Scanning Zonal Planes...
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">Latitudinal Mean</h3>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Earth Plane Distribution</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-emerald-500/60">
           <span className="text-[10px] font-black uppercase tracking-tighter">Equator</span>
           <div className="w-2 h-px bg-emerald-500/30" />
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} layout="vertical" margin={{ left: -10, right: 20 }}>
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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              hide={true}
              domain={['auto', 'auto']}
            />
            <YAxis 
              dataKey="lat" 
              type="number" 
              domain={[-90, 90]} 
              tick={{ fill: "#475569", fontSize: 10, fontWeight: 800 }}
              tickFormatter={(val) => val === 0 ? 'EQ' : val > 0 ? `${val}N` : `${Math.abs(val)}S`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{ stroke: 'rgba(16, 185, 129, 0.2)', strokeWidth: 1 }}
              contentStyle={{ 
                backgroundColor: '#020617', 
                border: '1px solid rgba(16,185,129,0.1)',
                borderRadius: '12px',
                fontSize: '12px'
              }}
              formatter={(value: any) => [Number(value).toFixed(2), "Mean Value"]}
              labelFormatter={(label) => `Latitude: ${label}°`}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={activeColor.stroke}
              fill={activeColor.fill}
              strokeWidth={3}
              animationDuration={1500}
            />
            <ReferenceLine y={0} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Equator', fill: '#475569', fontSize: 10, position: 'insideRight' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-col gap-2">
         <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-600">
           <div className="flex items-center gap-1"><ArrowUp className="w-2.5 h-2.5" /> North Pole</div>
           <div className="flex items-center gap-1">South Pole <ArrowDown className="w-2.5 h-2.5" /></div>
         </div>
         <p className="text-[10px] text-slate-500 leading-relaxed italic border-l-2 border-emerald-500/20 pl-3">
           Scanning the environmental gradient from polar regions to the tropics. This is used for detecting Arctic amplification and atmospheric energy shifts.
         </p>
      </div>
    </motion.div>
  );
}
