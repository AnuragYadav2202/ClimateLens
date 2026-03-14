"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useClimateMapData } from "@/lib/hooks";
import { useClimateStore } from "@/lib/store";
import { Maximize2, Box, Layers, ArrowRightLeft } from "lucide-react";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as any;

export function PlotlyComparisonView() {
  const { compareYear1, compareYear2, selectedVariable, compareMode } = useClimateStore();

  const { data: data1, isLoading: loading1 } = useClimateMapData(compareYear1, selectedVariable);
  const { data: data2, isLoading: loading2 } = useClimateMapData(compareYear2, selectedVariable);

  const valueKey = selectedVariable === "temperature" ? "temp" : selectedVariable === "precipitation" ? "precipitation" : "windSpeed";
  const unit = selectedVariable === "temperature" ? "°C" : selectedVariable === "precipitation" ? "mm" : "km/h";

  // Shared matrix transformation helper
  const transformToMatrix = (points: any[]) => {
    if (!points?.length) return null;
    
    // Sort and identify unique lats/lons
    const uniqueLons = Array.from(new Set(points.map(p => p.lon))).sort((a, b) => a - b);
    const uniqueLats = Array.from(new Set(points.map(p => p.lat))).sort((a, b) => a - b);
    
    // Create matrix
    const z: number[][] = [];
    uniqueLats.forEach(lat => {
      const row: number[] = [];
      uniqueLons.forEach(lon => {
        const p = points.find(pt => pt.lat === lat && pt.lon === lon);
        row.push(p ? (p[valueKey] ?? 0) : 0);
      });
      z.push(row);
    });
    
    return { z, x: uniqueLons, y: uniqueLats };
  };

  const matrix1 = useMemo(() => transformToMatrix(data1 || []), [data1, valueKey]);
  const matrix2 = useMemo(() => transformToMatrix(data2 || []), [data2, valueKey]);

  if (!compareMode) return null;

  const isLoading = loading1 || loading2;

  if (isLoading) {
    return (
      <div className="h-[500px] rounded-2xl bg-slate-900/60 flex items-center justify-center border border-white/5 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs font-black text-cyan-400 tracking-widest uppercase">Initializing Matrices</span>
        </div>
      </div>
    );
  }

  const commonLayout = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 0, r: 0, t: 40, b: 0 },
    font: { color: "#94a3b8", family: "Inter, sans-serif" },
    showlegend: false,
    scene: {
      xaxis: { gridcolor: "rgba(255,255,255,0.05)", zeroline: false, showgrid: true },
      yaxis: { gridcolor: "rgba(255,255,255,0.05)", zeroline: false, showgrid: true },
      zaxis: { gridcolor: "rgba(255,255,255,0.1)", title: unit },
      aspectmode: "manual",
      aspectratio: { x: 2, y: 1.2, z: 0.5 },
      camera: { eye: { x: 1.5, y: 1.5, z: 1 } }
    }
  };

  const surfaceTrace = (matrix: any, colorscale: string) => ({
    type: "surface",
    z: matrix.z,
    x: matrix.x,
    y: matrix.y,
    colorscale: colorscale,
    showscale: false,
    contours: {
       z: { show: true, usecolormap: true, highlightcolor: "#fff", project: { z: true } }
    }
  });

  const contourTrace = (matrix: any, colorscale: string) => ({
    type: "contour",
    z: matrix.z,
    x: matrix.x,
    y: matrix.y,
    colorscale: colorscale,
    showscale: false,
    line: { width: 0.5, color: "rgba(255,255,255,0.1)" },
    smoothing: 1.3
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
               <Box className="w-4 h-4 text-indigo-400" />
             </div>
             <div>
               <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest leading-none mb-1">Topographic 3D Surface Analysis</h3>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Morphological comparison of climate peaks</p>
             </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-black text-slate-500">
             <span className="text-cyan-400">{compareYear1}</span>
             <ArrowRightLeft className="w-3 h-3" />
             <span className="text-cyan-400">{compareYear2}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
          {matrix1 && (
            <div className="relative rounded-xl overflow-hidden bg-black/20 border border-white/5">
              <div className="absolute top-3 left-4 z-10 text-[10px] font-black text-slate-500 uppercase tracking-widest">{compareYear1} SURFACE</div>
              <Plot
                data={[surfaceTrace(matrix1, "Viridis")]}
                layout={commonLayout}
                style={{ width: "100%", height: "100%" }}
                config={{ displaylogo: false, responsive: true }}
              />
            </div>
          )}
          {matrix2 && (
            <div className="relative rounded-xl overflow-hidden bg-black/20 border border-white/5">
              <div className="absolute top-3 left-4 z-10 text-[10px] font-black text-slate-500 uppercase tracking-widest">{compareYear2} SURFACE</div>
              <Plot
                data={[surfaceTrace(matrix2, "Plasma")]}
                layout={commonLayout}
                style={{ width: "100%", height: "100%" }}
                config={{ displaylogo: false, responsive: true }}
              />
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
               <Layers className="w-4 h-4 text-emerald-400" />
             </div>
             <div>
               <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest leading-none mb-1">Scientific Contour Isograms</h3>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">High-precision boundary shift analysis</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[350px]">
          {matrix1 && (
            <div className="relative rounded-xl overflow-hidden bg-black/20 border border-white/5">
              <div className="absolute top-3 left-4 z-10 text-[10px] font-black text-slate-500 uppercase tracking-widest">{compareYear1} CONTOUR</div>
              <Plot
                data={[contourTrace(matrix1, "Hot")]}
                layout={{ ...commonLayout, margin: { l: 30, r: 10, t: 30, b: 30 }, scene: undefined }}
                style={{ width: "100%", height: "100%" }}
                config={{ displaylogo: false, responsive: true }}
              />
            </div>
          )}
          {matrix2 && (
            <div className="relative rounded-xl overflow-hidden bg-black/20 border border-white/5">
              <div className="absolute top-3 left-4 z-10 text-[10px] font-black text-slate-500 uppercase tracking-widest">{compareYear2} CONTOUR</div>
              <Plot
                data={[contourTrace(matrix2, "Hot")]}
                layout={{ ...commonLayout, margin: { l: 30, r: 10, t: 30, b: 30 }, scene: undefined }}
                style={{ width: "100%", height: "100%" }}
                config={{ displaylogo: false, responsive: true }}
              />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
