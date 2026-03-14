"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import regression from "regression";
import { useLocationTimeSeries } from "@/lib/hooks";
import { useClimateStore } from "@/lib/store";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
}) as any;

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

  const unit =
    selectedVariable === "temperature"
      ? "°C"
      : selectedVariable === "precipitation"
        ? "mm"
        : "m/s";

  const { seriesYears, seriesValues, trendValues, slope, change, mean } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        seriesYears: [],
        seriesValues: [],
        trendValues: [],
        slope: 0,
        change: 0,
        mean: 0,
      };
    }
    const years = data.map((d) => d.year);
    const values = data.map((d) => d.value);
    const points = years.map((y, i) => [y, values[i]]);
    const result = regression.linear(points);
    const trendValues = years.map((y) => result.predict(y)[1]);
    const slope = result.equation[0]; // per year
    const change = trendValues[trendValues.length - 1] - trendValues[0];
    const mean =
      values.reduce((a, b) => a + b, 0) / (values.length || 1);
    return { seriesYears: years, seriesValues: values, trendValues, slope, change, mean };
  }, [data]);

  const handleSubmit = () => {
    setSubmitted(lat != null && lon != null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Location Point Analysis
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter a latitude and longitude to see the local climate trend.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-slate-500 mb-1">Latitude</label>
          <input
            type="number"
            step="0.1"
            value={lat ?? ""}
            onChange={(e) => setLat(e.target.value === "" ? null : Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-100"
          />
        </div>
        <div>
          <label className="block text-slate-500 mb-1">Longitude</label>
          <input
            type="number"
            step="0.1"
            value={lon ?? ""}
            onChange={(e) => setLon(e.target.value === "" ? null : Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-100"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSubmit}
            className="w-full px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-medium hover:bg-cyan-500/30 transition-colors"
          >
            Analyze
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-slate-500 mb-1">From year</label>
          <input
            type="number"
            value={fromYear}
            min={timeRange[0]}
            max={toYear}
            onChange={(e) =>
              setFromYear(
                Math.min(Number(e.target.value) || timeRange[0], toYear)
              )
            }
            className="w-full px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-100"
          />
        </div>
        <div>
          <label className="block text-slate-500 mb-1">To year</label>
          <input
            type="number"
            value={toYear}
            min={fromYear}
            max={timeRange[1]}
            onChange={(e) =>
              setToYear(
                Math.max(Number(e.target.value) || timeRange[1], fromYear)
              )
            }
            className="w-full px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-100"
          />
        </div>
      </div>
      <div className="h-[260px] bg-slate-900/40 rounded-lg">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : data && data.length > 0 && seriesYears.length > 0 ? (
          <Plot
            data={[
              {
                type: "scatter",
                mode: "lines+markers",
                x: seriesYears,
                y: seriesValues,
                name: "Annual mean",
                line: { color: "#38bdf8" },
              },
              {
                type: "scatter",
                mode: "lines",
                x: seriesYears,
                y: trendValues,
                name: "Trend",
                line: { color: "#f97316", dash: "dash" },
              },
            ]}
            layout={{
              autosize: true,
              margin: { l: 40, r: 10, t: 10, b: 30 },
              paper_bgcolor: "rgba(15,23,42,0)",
              plot_bgcolor: "rgba(15,23,42,0)",
              xaxis: {
                title: "Year",
                tickfont: { color: "#94a3b8" },
                gridcolor: "rgba(148,163,184,0.1)",
              },
              yaxis: {
                title: `${selectedVariable} (${unit})`,
                tickfont: { color: "#94a3b8" },
                gridcolor: "rgba(148,163,184,0.1)",
              },
            }}
            style={{ width: "100%", height: "100%" }}
            config={{ displaylogo: false, responsive: true }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
            Enter coordinates and click Analyze to see a local trend.
          </div>
        )}
      </div>
      {data && data.length > 0 && (
        <div className="text-xs text-slate-400 flex flex-wrap gap-4">
          <div>
            <span className="text-slate-500">Trend: </span>
            <span className="text-cyan-300">
              {slope >= 0 ? "+" : ""}
              {slope.toFixed(3)} {unit}/yr
            </span>
          </div>
          <div>
            <span className="text-slate-500">Change over period: </span>
            <span className={change >= 0 ? "text-emerald-300" : "text-rose-300"}>
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)} {unit}
            </span>
          </div>
          <div>
            <span className="text-slate-500">
              Mean ({fromYear}–{toYear}):{" "}
            </span>
            <span className="text-slate-100">
              {mean.toFixed(2)} {unit}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

