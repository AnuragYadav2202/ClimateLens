"use client";

import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, AlertTriangle, Calendar, Activity,
  Thermometer, Droplets, Wind, Database
} from "lucide-react";
import { useTimeSeries } from "@/lib/hooks";
import { useClimateStore } from "@/lib/store";

function getVarMeta(variable: string) {
  if (variable === "temperature") return { unit: "°C", icon: Thermometer, color: "text-orange-400", accent: "via-orange-500/20" };
  if (variable === "precipitation") return { unit: "mm", icon: Droplets, color: "text-cyan-400", accent: "via-cyan-500/20" };
  return { unit: " km/h", icon: Wind, color: "text-purple-400", accent: "via-purple-500/20" };
}

export function SummaryStats() {
  const { timeRange, selectedVariable, userDatasetName, userDatasetMeta } = useClimateStore();
  const { data, isLoading } = useTimeSeries(selectedVariable);
  const vm = getVarMeta(selectedVariable);

  if (isLoading || !data || data.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  const selectedYear = timeRange[1];
  const startValue = data[0].value;
  const endValue   = data[data.length - 1].value;
  const yearDiff   = Math.max(1, data[data.length - 1].year - data[0].year);
  const totalTrend = endValue - startValue;
  const trendPerDecade = (totalTrend / yearDiff) * 10;
  const totalChange    = endValue - startValue;
  const baselineSlice  = data.slice(0, Math.max(1, Math.floor(data.length * 0.3)));
  const baselineAvg    = baselineSlice.reduce((s, d) => s + d.value, 0) / baselineSlice.length;
  const currentAnomaly = endValue - baselineAvg;

  // Source label
  const sourceLabel = userDatasetName
    ? userDatasetName.length > 22 ? userDatasetName.slice(0, 20) + "…" : userDatasetName
    : "Open-Meteo API";

  const stats = [
    {
      label: "Selected Year",
      value: userDatasetMeta
        ? (userDatasetMeta.yearMin === userDatasetMeta.yearMax ? `${userDatasetMeta.yearMin}` : `${userDatasetMeta.yearMin}–${userDatasetMeta.yearMax}`)
        : selectedYear.toString(),
      subtext: `Range: ${timeRange[0]}–${timeRange[1]}`,
      icon: Calendar,
      color: "text-blue-400",
      accent: "via-blue-500/20",
    },
    {
      label: "Trend / Decade",
      value: `${trendPerDecade > 0 ? "+" : ""}${trendPerDecade.toFixed(3)}${vm.unit}`,
      subtext: "per decade",
      icon: trendPerDecade > 0 ? TrendingUp : TrendingDown,
      color: trendPerDecade > 0 ? "text-rose-400" : "text-emerald-400",
      accent: trendPerDecade > 0 ? "via-rose-500/20" : "via-emerald-500/20",
    },
    {
      label: "Total Change",
      value: `${totalChange > 0 ? "+" : ""}${totalChange.toFixed(2)}${vm.unit}`,
      subtext: `since ${data[0].year}`,
      icon: Activity,
      color: vm.color,
      accent: vm.accent,
    },
    {
      label: "Dataset Anomaly",
      value: `${currentAnomaly > 0 ? "+" : ""}${currentAnomaly.toFixed(1)}${vm.unit}`,
      subtext: "vs baseline mean",
      icon: AlertTriangle,
      color: Math.abs(currentAnomaly) > 1 ? "text-orange-400" : "text-emerald-400",
      accent: Math.abs(currentAnomaly) > 1 ? "via-orange-500/20" : "via-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-3 mb-6">
      {/* Source badge */}
      <div className="flex items-center gap-2">
        <Database className={`w-3.5 h-3.5 ${userDatasetName ? "text-emerald-400" : "text-slate-500"}`} />
        <span className={`text-[10px] font-bold uppercase tracking-wider ${userDatasetName ? "text-emerald-400" : "text-slate-500"}`}>
          {userDatasetName ? "Custom Dataset" : "Live Data Source"}:
        </span>
        <span className="text-[10px] text-slate-300 font-mono">{sourceLabel}</span>
        {userDatasetMeta && (
          <span className="text-[10px] text-slate-500">· {userDatasetMeta.pointCount.toLocaleString()} pts</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card p-5 rounded-2xl border border-slate-700/30 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-8 group-hover:opacity-15 transition-opacity">
              <stat.icon className="w-12 h-12 text-current" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-slate-100 mb-1 leading-none">{stat.value}</span>
              <span className="text-xs text-slate-400">{stat.subtext}</span>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent ${stat.accent} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
