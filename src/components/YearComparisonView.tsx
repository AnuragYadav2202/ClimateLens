"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useClimateMapData } from "@/lib/hooks";
import { useClimateStore } from "@/lib/store";

export function YearComparisonView() {
  const { compareYear1, compareYear2, selectedVariable, compareMode } =
    useClimateStore();

  const { data: dataA } = useClimateMapData(compareYear1, selectedVariable);
  const { data: dataB } = useClimateMapData(compareYear2, selectedVariable);

  const unit =
    selectedVariable === "temperature"
      ? "°C"
      : selectedVariable === "precipitation"
        ? "mm"
        : "m/s";

  const stats = useMemo(() => {
    const avg = (arr: any[] | undefined, key: string) => {
      if (!arr || !arr.length) return null;
      const vals = arr
        .map((d: any) => d[key])
        .filter((v: number | null | undefined) => v != null);
      if (!vals.length) return null;
      const sum = vals.reduce((a: number, b: number) => a + b, 0);
      return sum / vals.length;
    };
    const key =
      selectedVariable === "temperature"
        ? "temp"
        : selectedVariable === "precipitation"
          ? "precipitation"
          : "windSpeed";

    const meanA = avg(dataA, key);
    const meanB = avg(dataB, key);
    if (meanA == null || meanB == null) {
      return null;
    }
    const delta = meanB - meanA;
    const pct = meanA !== 0 ? (delta / meanA) * 100 : 0;
    return { meanA, meanB, delta, pct };
  }, [dataA, dataB, selectedVariable]);

  if (!compareMode || !stats) return null;

  const { meanA, meanB, delta, pct } = stats;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-4 space-y-4"
    >
      <h2 className="text-sm font-semibold text-slate-100">
        Year‑over‑Year Climate Comparison
      </h2>
      <p className="text-xs text-slate-500">
        Compare {selectedVariable} between {compareYear1} and {compareYear2} on
        a shared scale.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-3">
          <div className="text-xs text-slate-500 mb-1">
            {compareYear1} average
          </div>
          <div className="text-xl font-semibold text-slate-100">
            {meanA.toFixed(3)} {unit}
          </div>
        </div>
        <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-3">
          <div className="text-xs text-slate-500 mb-1">
            {compareYear2} average
          </div>
          <div className="text-xl font-semibold text-slate-100">
            {meanB.toFixed(3)} {unit}
          </div>
          <div
            className={`mt-1 text-xs ${
              delta >= 0 ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(3)} {unit}
          </div>
        </div>
        <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-3">
          <div className="text-xs text-slate-500 mb-1">% change</div>
          <div
            className={`text-xl font-semibold ${
              pct >= 0 ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {pct >= 0 ? "+" : ""}
            {pct.toFixed(1)}%
          </div>
        </div>
      </div>
    </motion.div>
  );
}

