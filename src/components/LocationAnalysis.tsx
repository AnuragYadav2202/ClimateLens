"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import regression from "regression";
import { MapPin, Calendar, Zap, Activity, Globe, Info, ArrowRight, MousePointer2 } from "lucide-react";
import { useLocationTimeSeries } from "@/lib/hooks";
import { useClimateStore } from "@/lib/store";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
}) as any;

const StepBadge = ({ num, active }: { num: number; active: boolean }) => (
  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-500 ${
    active ? "bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "bg-slate-800 text-slate-500 border border-slate-700"
  }`}>
    {num}
  </div>
);

const GhostChart = () => (
  <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden group">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)]" />
    <motion.div 
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 4, repeat: Infinity }}
      className="relative z-10 flex flex-col items-center"
    >
      <div className="relative w-16 h-16 mb-6">
        <Activity className="absolute inset-0 w-full h-full text-emerald-500/20" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border border-dashed border-emerald-500/10 rounded-full"
        />
      </div>
      <h3 className="text-emerald-400/40 text-[11px] font-black uppercase tracking-[0.3em]">Awaiting Geo-Lock</h3>
      <p className="text-slate-600 text-[9px] uppercase tracking-widest mt-2 px-12 text-center leading-relaxed">
        Input coordinates above to initiate localized spectral analysis
      </p>
    </motion.div>
    
    {/* Blueprint Grid Lines */}
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
  </div>
);

export function LocationAnalysis() {
  const { selectedVariable, timeRange } = useClimateStore();
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [fromYear, setFromYear] = useState(timeRange[0]);
  const [toYear, setToYear] = useState(timeRange[1]);

  const { data, isLoading } = useLocationTimeSeries(
    submitted ? lat : null,
    submitted ? lon : null,
    selectedVariable,
    fromYear,
    toYear
  );

  const unit = selectedVariable === "temperature" ? "°C" : selectedVariable === "precipitation" ? "mm" : "km/h";
  const isValid = lat !== null && lon !== null && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;

  const { seriesYears, seriesValues, trendValues, slope, change, mean } = useMemo(() => {
    if (!data || data.length === 0) {
      return { seriesYears: [], seriesValues: [], trendValues: [], slope: 0, change: 0, mean: 0 };
    }
    const years = data.map((d) => d.year);
    const values = data.map((d) => d.value);
    const points = years.map((y, i) => [y, values[i]]);
    const result = regression.linear(points);
    const trendValues = years.map((y) => result.predict(y)[1]);
    return { 
      seriesYears: years, 
      seriesValues: values, 
      trendValues, 
      slope: result.equation[0], 
      change: trendValues[trendValues.length - 1] - trendValues[0], 
      mean: values.reduce((a, b) => a + b, 0) / (values.length || 1) 
    };
  }, [data]);

  const handleSubmit = () => {
    if (isValid) setSubmitted(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Configuration Column */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:col-span-4 space-y-4"
      >
        <div className="glass-card p-6 border-emerald-500/10 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Globe className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Target Selection</h2>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Localized Trend Analysis</p>
            </div>
          </div>

          <div className="space-y-8 flex-1">
            {/* Step 1: Coordinates */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <StepBadge num={1} active={!submitted || !isValid} />
                <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Geo-Coordinates</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Latitude</label>
                    {lat !== null && (lat < -90 || lat > 90) && (
                      <span className="text-[8px] font-black text-rose-500 uppercase">Range: -90 / 90</span>
                    )}
                  </div>
                  <input
                    type="number"
                    placeholder="0.0"
                    step="0.01"
                    value={lat ?? ""}
                    onChange={(e) => {
                      setLat(e.target.value === "" ? null : Number(e.target.value));
                      setSubmitted(false);
                    }}
                    className={`w-full px-4 py-3 rounded-xl bg-slate-900/80 border ${lat !== null && (lat < -90 || lat > 90) ? 'border-rose-500/50' : 'border-emerald-500/5'} focus:border-emerald-500/30 text-emerald-300 text-xs font-mono transition-all outline-none`}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Longitude</label>
                    {lon !== null && (lon < -180 || lon > 180) && (
                      <span className="text-[8px] font-black text-rose-500 uppercase">Range: -180 / 180</span>
                    )}
                  </div>
                  <input
                    type="number"
                    placeholder="0.0"
                    step="0.01"
                    value={lon ?? ""}
                    onChange={(e) => {
                      setLon(e.target.value === "" ? null : Number(e.target.value));
                      setSubmitted(false);
                    }}
                    className={`w-full px-4 py-3 rounded-xl bg-slate-900/80 border ${lon !== null && (lon < -180 || lon > 180) ? 'border-rose-500/50' : 'border-emerald-500/5'} focus:border-emerald-500/30 text-emerald-300 text-xs font-mono transition-all outline-none`}
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Time Horizon */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <StepBadge num={2} active={isValid && !submitted} />
                <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Time Horizon</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">From</label>
                  <input
                    type="number"
                    value={fromYear}
                    onChange={(e) => setFromYear(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-emerald-500/5 text-slate-300 text-xs font-mono outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">To</label>
                  <input
                    type="number"
                    value={toYear}
                    onChange={(e) => setToYear(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-emerald-500/5 text-slate-300 text-xs font-mono outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Action */}
            <div className="pt-4 space-y-3">
              <button
                disabled={!isValid || isLoading}
                onClick={handleSubmit}
                className={`w-full group relative flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-black uppercase tracking-[0.3em] text-[10px] transition-all duration-500 ${
                  isValid && !isLoading
                    ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.4)] active:scale-95"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700"
                }`}
              >
                {isLoading ? (
                  <Activity className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Zap className={`w-4 h-4 transition-transform group-hover:scale-125 ${isValid ? "text-slate-900" : "text-slate-600"}`} />
                    {isValid ? "Analyze Vector" : "Locked"}
                  </>
                )}
              </button>
              
              {!isValid && (lat !== null || lon !== null) && (
                <motion.p 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-[9px] text-rose-500 font-bold uppercase tracking-widest text-center"
                >
                  Planetary Boundary Error: Check Lat/Lon Range
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Analysis Column */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:col-span-8 flex flex-col gap-6"
      >
        <div className="glass-card flex-1 min-h-[450px] border-emerald-500/10 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-emerald-500/5 flex items-center justify-between bg-slate-900/30">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Localized Spectral Sweep</span>
            </div>
            {submitted && data && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-mono text-emerald-400">{lat?.toFixed(2)}°, {lon?.toFixed(2)}°</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-[350px]">
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.div 
                  key="ghost"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <GhostChart />
                </motion.div>
              ) : isLoading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="w-full h-full flex items-center justify-center p-12"
                >
                  <div className="flex flex-col items-center gap-6 text-center">
                    <div className="relative w-20 h-20">
                      <div className="absolute inset-0 border-2 border-emerald-500/10 rounded-full" />
                      <div className="absolute inset-0 border-t-2 border-emerald-400 rounded-full animate-spin" />
                      <Activity className="absolute inset-0 m-auto w-8 h-8 text-emerald-500 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-white text-[11px] font-black uppercase tracking-[.4em]">Extracting Matrix Data</p>
                      <p className="text-slate-500 text-[9px] font-mono uppercase tracking-widest">Querying planetary datasets...</p>
                    </div>
                  </div>
                </motion.div>
              ) : data && data.length > 0 ? (
                <motion.div 
                   key="plot"
                   initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                   className="w-full h-full"
                >
                  <Plot
                    data={[
                      {
                        type: "scatter", mode: "lines+markers",
                        x: seriesYears, y: seriesValues,
                        name: "Actual Data",
                        line: { color: "#10b981", width: 3 },
                        marker: { size: 6, color: "#064e3b", line: { width: 2, color: "#34d399" } }
                      },
                      {
                        type: "scatter", mode: "lines",
                        x: seriesYears, y: trendValues,
                        name: "Climate Trend",
                        line: { color: "#f59e0b", width: 2, dash: "dot" }
                      }
                    ]}
                    layout={{
                      autosize: true,
                      margin: { l: 60, r: 40, t: 40, b: 60 },
                      paper_bgcolor: "rgba(0,0,0,0)",
                      plot_bgcolor: "rgba(0,0,0,0)",
                      font: { family: "'Outfit', sans-serif", color: "#64748b", size: 10 },
                      xaxis: { showgrid: true, gridcolor: "rgba(16,185,129,0.05)", zeroline: false, title: { text: "OBSERVATION YEAR", font: { size: 9, weight: 900 } } },
                      yaxis: { showgrid: true, gridcolor: "rgba(16,185,129,0.05)", zeroline: false, title: { text: `${selectedVariable.toUpperCase()} (${unit})`, font: { size: 9, weight: 900 } } },
                      legend: { x: 0.05, y: 1.1, orientation: "h", font: { size: 9, weight: 600 } },
                      hovermode: "x unified",
                      hoverlabel: { bgcolor: "#0f172a", bordercolor: "#1e293b", font: { color: "#fff" } }
                    }}
                    style={{ width: "100%", height: "100%" }}
                    config={{ displaylogo: false, responsive: true }}
                  />
                </motion.div>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-12 text-center">
                  <p className="text-rose-400 text-[11px] font-black uppercase tracking-widest">No data signatures found for these coordinates.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Results Summary HUD */}
          {submitted && !isLoading && data && data.length > 0 && (
            <div className="px-6 py-6 border-t border-emerald-500/5 bg-slate-900/50 flex flex-wrap gap-8 items-center">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <Zap className="w-3 h-3 text-amber-500" /> Linear Slope
                </p>
                <div className="text-xl font-black text-white tabular-nums">
                  {slope >= 0 ? "+" : ""}{slope.toFixed(3)} 
                  <span className="text-slate-400 text-[10px] ml-2 font-black tracking-widest">{unit}/YR</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <Activity className="w-3 h-3 text-emerald-400" /> Total Drift
                </p>
                <div className={`text-xl font-black tabular-nums ${change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {change >= 0 ? "+" : ""}{change.toFixed(2)}
                  <span className="text-slate-400 text-[10px] ml-2 font-black tracking-widest">{unit}</span>
                </div>
              </div>

              <div className="space-y-1 flex-1 min-w-[200px]">
                <div className="flex items-center justify-between mb-1.5">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Atmospheric Stability</p>
                   <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{Math.abs(slope) > 0.05 ? "CRITICAL" : "STABLE"}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden p-[2px]">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min(100, Math.abs(slope) * 500)}%` }}
                     className={`h-full rounded-full ${Math.abs(slope) > 0.05 ? "bg-rose-500" : "bg-emerald-500"}`}
                   />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Context Note */}
        <div className="flex gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
           <Info className="w-5 h-5 text-emerald-400 shrink-0" />
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
             Vector analysis incorporates high-resolution ERA5 reanalysis data. Regional trends may differ from global averages due to localized polar amplification or urban heat island effects. Multi-year smoothing is applied to mitigate seasonal noise.
           </p>
        </div>
      </motion.div>
    </div>
  );
}
