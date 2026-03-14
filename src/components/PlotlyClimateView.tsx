"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useClimateMapData } from "@/lib/hooks";
import { useClimateStore } from "@/lib/store";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as any;

function classifyRegion(lat: number, lon: number): string {
  if (lat >= -35 && lat <= 35 && lon >= -20 && lon <= 55) return "Africa";
  if (lat >= -50 && lat <= 0 && lon < -30) return "South America";
  if (lat > 0 && lon < -30) return "North America";
  if (lon >= 55 && lon <= 180 && lat >= -10) return "Asia";
  if (lon >= -30 && lon <= 55 && lat > 35) return "Europe";
  if (lat < -10 && lon >= 110) return "Oceania";
  return "Other";
}

export function PlotlyClimateView() {
  const { timeRange, selectedVariable } = useClimateStore();
  const year = timeRange[1];
  const { data, isLoading } = useClimateMapData(year, selectedVariable);

  const valueKey =
    selectedVariable === "temperature"
      ? "temp"
      : selectedVariable === "precipitation"
        ? "precipitation"
        : "windSpeed";

  const unit =
    selectedVariable === "temperature"
      ? "°C"
      : selectedVariable === "precipitation"
        ? "mm"
        : "m/s";

  const { scatter, bars } = useMemo(() => {
    if (!data?.length) {
      return { scatter: null, bars: null };
    }

    const values = data.map((d: any) => d[valueKey] ?? 0);
    const lats = data.map((d) => d.lat);
    const lons = data.map((d) => d.lon);

    const min = Math.min(...values);
    const max = Math.max(...values);

    const scatter = {
      type: "scattergeo",
      mode: "markers",
      lon: lons,
      lat: lats,
      text: values.map((v) => `${v.toFixed(1)} ${unit}`),
      marker: {
        size: 6,
        color: values,
        colorscale: "Turbo",
        cmin: min,
        cmax: max,
        colorbar: {
          title: `${selectedVariable} (${unit})`,
        },
      },
    } as any;

    const regionMap = new Map<string, { sum: number; count: number }>();
    data.forEach((d: any) => {
      const val = d[valueKey];
      if (val == null) return;
      const region = classifyRegion(d.lat, d.lon);
      const entry = regionMap.get(region) ?? { sum: 0, count: 0 };
      entry.sum += val;
      entry.count += 1;
      regionMap.set(region, entry);
    });

    const regions = Array.from(regionMap.entries()).filter(
      ([, v]) => v.count > 0
    );
    regions.sort((a, b) => b[1].sum / b[1].count - a[1].sum / a[1].count);

    const barTrace =
      regions.length > 0
        ? {
            type: "bar",
            orientation: "h",
            y: regions.map(([name]) => name),
            x: regions.map(([, v]) => v.sum / v.count),
            marker: {
              color: regions.map(([, v]) => v.sum / v.count),
              colorscale: "Turbo",
            },
          }
        : null;

    return { scatter, bars: barTrace };
  }, [data, valueKey, unit, selectedVariable]);

  if (isLoading) {
    return (
      <div className="h-[420px] rounded-xl bg-slate-800/50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!scatter) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Plotly Maps & Regional Averages
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Interactive Plotly views for {selectedVariable} in {year}.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="h-[320px] bg-slate-900/40 rounded-lg">
          <Plot
            data={[scatter]}
            layout={{
              autosize: true,
              margin: { l: 0, r: 0, t: 0, b: 0 },
              paper_bgcolor: "rgba(15,23,42,0)",
              plot_bgcolor: "rgba(15,23,42,0)",
              geo: {
                projection: { type: "natural earth" },
                showland: true,
                landcolor: "rgba(15,23,42,1)",
                bgcolor: "rgba(15,23,42,0)",
                showcountries: true,
              },
            }}
            style={{ width: "100%", height: "100%" }}
            config={{ displaylogo: false, responsive: true }}
          />
        </div>
        <div className="h-[320px] bg-slate-900/40 rounded-lg">
          {bars && (
            <Plot
              data={[bars]}
              layout={{
                autosize: true,
                margin: { l: 80, r: 10, t: 10, b: 40 },
                paper_bgcolor: "rgba(15,23,42,0)",
                plot_bgcolor: "rgba(15,23,42,0)",
                xaxis: {
                  title: `${selectedVariable} (${unit})`,
                  tickfont: { color: "#94a3b8" },
                  gridcolor: "rgba(148,163,184,0.1)",
                },
                yaxis: {
                  tickfont: { color: "#94a3b8" },
                },
              }}
              style={{ width: "100%", height: "100%" }}
              config={{ displaylogo: false, responsive: true }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

