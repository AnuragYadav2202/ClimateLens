"use client";

import { useInsights, useTimeSeries } from "@/lib/hooks";
import { useClimateStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, BrainCircuit } from "lucide-react";
import { useEffect, useState } from "react";
import { predictFutureTrend, PredictionResult } from "@/lib/prediction";

export function InsightPanel() {
  const { timeRange, selectedVariable } = useClimateStore();
  const { data: insights, isLoading: insightsLoading } = useInsights(
    timeRange[1],
    timeRange,
    selectedVariable
  );

  const { data: history } = useTimeSeries(selectedVariable, timeRange[0], timeRange[1]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);

  useEffect(() => {
    if (history && history.length > 5) {
      setIsPredicting(true);
      predictFutureTrend(history, 15).then(res => {
        setPredictions(res);
        setIsPredicting(false);
      });
    }
  }, [history]);

  const isLoading = insightsLoading || isPredicting;

  if (isLoading) {
    return (
      <div className="rounded-xl glass-card p-4 space-y-3 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-slate-700/50" />
          <div className="h-4 w-32 bg-slate-700/50 rounded" />
        </div>
        {[80, 90, 70].map((w, i) => (
          <div key={i} className="p-3 rounded-lg bg-slate-800/50">
            <div className={`h-3 bg-slate-700/50 rounded w-${w === 80 ? '4/5' : w === 90 ? 'full' : '3/4'}`} />
            <div className="h-3 bg-slate-700/30 rounded w-1/2 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl glass-card p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-cyan-400" />
        </div>
        <h3 className="font-semibold text-slate-200">Climate Insight</h3>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {insights?.map((insight, i) => (
            <motion.div
              key={`${insight}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
            >
              <p className="text-sm text-slate-300 leading-relaxed">{insight}</p>
            </motion.div>
          ))}

          {predictions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.15)] overflow-hidden relative group"
            >
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-400/20">
                    <BrainCircuit className="w-5 h-5 text-cyan-300" />
                  </div>
                  <span className="text-sm font-bold text-white uppercase tracking-wider">AI Future Forecast</span>
                </div>
                <div className="px-2 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-[10px] text-cyan-300 font-bold uppercase tracking-tighter">
                  Real-time ML
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
                  <p className="text-xs text-cyan-100/70 mb-1 font-medium italic">
                    Projected {selectedVariable} trend by {predictions[predictions.length-1].year}:
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white leading-none drop-shadow-md">
                      {predictions[predictions.length-1].value}
                      <span className="text-base ml-1 text-cyan-400 font-medium">
                        {selectedVariable === "temperature" ? "°C" : selectedVariable === "precipitation" ? "mm" : "km/h"}
                      </span>
                    </span>
                    <div className="flex flex-col text-[10px] text-cyan-400/40 font-semibold leading-tight">
                      <span>95% CONFIDENCE</span>
                      <span>TREND LINE</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-cyan-400" />
                    <h4 className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest">How it works</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    This forecast is generated using a **Linear Regression** model powered by **Tensorflow.js**. 
                    It analyzes historical data from {timeRange[0]}–{timeRange[1]} to detect secular trends and 
                    projects them forward. Note: Predictions are for educational visualization and may vary from 
                    official scientific models.
                  </p>
                </div>
              </div>

              <div className="absolute -right-6 -bottom-6 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-700 pointer-events-none">
                <BrainCircuit className="w-32 h-32 text-cyan-200" />
              </div>

              {/* Decorative Glow */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-2 text-xs text-slate-500">
        <TrendingUp className="w-3 h-3" />
        Data-driven insights • Data through {timeRange[1]}
      </div>
    </motion.div>
  );
}
