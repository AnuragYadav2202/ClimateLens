"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useClimateStore } from "@/lib/store";
import { DatasetSelector } from "./DatasetSelector";
import {
  Thermometer,
  Droplets,
  Wind,
  UploadCloud,
  X,
  FolderOpen,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Activity,
  Calendar,
} from "lucide-react";
import { parseNetCDFFile } from "@/lib/netcdf";

export function Sidebar() {
  const {
    timeRange,
    setTimeRange,
    selectedVariable,
    setVariable,
    userDatasetName,
    setUserDataset,
    clearUserDataset,
  } = useClimateStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(async (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".nc")) {
      setError("Please upload a NetCDF (.nc) file.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const points = await parseNetCDFFile(file, timeRange[1]);
      if (!points.length) {
        setError("No valid data points found in this NetCDF file.");
      } else {
        // Compute rich metadata from the parsed points
        const temps = points.map((p) => p.temp).filter((t) => t !== 0);
        const precs = points.map((p) => p.precipitation ?? 0).filter((p) => p !== 0);
        const winds = points.map((p) => p.windSpeed ?? 0).filter((w) => w !== 0);
        const years = points.map((p) => p.year ?? timeRange[1]);
        const meta = {
          name: file.name,
          pointCount: points.length,
          latMin: Math.min(...points.map((p) => p.lat)),
          latMax: Math.max(...points.map((p) => p.lat)),
          lonMin: Math.min(...points.map((p) => p.lon)),
          lonMax: Math.max(...points.map((p) => p.lon)),
          yearMin: Math.min(...years),
          yearMax: Math.max(...years),
          detectedVariables: [
            temps.length > 0 ? "temperature" : null,
            precs.length > 0 ? "precipitation" : null,
            winds.length > 0 ? "wind" : null,
          ].filter(Boolean) as string[],
          tempRange: temps.length ? [Math.min(...temps), Math.max(...temps)] as [number,number] : undefined,
          precipRange: precs.length ? [Math.min(...precs), Math.max(...precs)] as [number,number] : undefined,
          windRange: winds.length ? [Math.min(...winds), Math.max(...winds)] as [number,number] : undefined,
        };
        setUserDataset(file.name, points, meta);
        setSuccess(`Loaded ${points.length.toLocaleString()} data points from ${file.name}`);
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to read NetCDF file.");
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, setUserDataset]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  }, [handleFile]);

  const variables = [
    { id: "temperature", label: "Temperature (°C)", icon: Thermometer },
    { id: "precipitation", label: "Precipitation (mm)", icon: Droplets },
    { id: "wind", label: "Wind Speed (km/h)", icon: Wind },
  ] as const;

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-80 h-fit glass-card rounded-2xl p-6 flex flex-col gap-8 sticky top-8 shadow-xl shadow-cyan-900/5"
    >
      {/* Dataset Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-200">Dataset</h3>
        </div>

        <div className="space-y-4">
          {/* Upload Area */}
          <div className="relative">
            <label
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={onDrop}
              className="block cursor-pointer"
            >
              <div className={`
                flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed 
                transition-all duration-300 select-none
                ${isLoading ? "bg-cyan-500/5 border-cyan-500/30 animate-pulse" :
                  isDragOver ? "bg-cyan-500/10 border-cyan-400/60 scale-[1.01]" :
                  userDatasetName ? "border-cyan-500/40 bg-cyan-500/5" :
                  "bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/40 hover:border-cyan-500/30"}
              `}>
                <div className={`p-3 rounded-full transition-colors ${
                  userDatasetName ? "bg-cyan-500/20 text-cyan-400" :
                  isDragOver ? "bg-cyan-500/30 text-cyan-300" :
                  "bg-slate-800 text-slate-500"
                }`}>
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-300">
                    {isLoading ? "Parsing file…" :
                     isDragOver ? "Drop to upload" :
                     userDatasetName ? userDatasetName :
                     "Drag and drop file here"}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Any NetCDF (.nc) file
                  </p>
                </div>
                <span className="mt-1 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-colors">
                  Browse files
                </span>
              </div>
              <input
                type="file"
                accept=".nc"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>

            {userDatasetName && (
              <button
                onClick={clearUserDataset}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors"
                title="Clear Dataset"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Success message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30"
            >
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-green-300 leading-snug font-medium">{success}</p>
            </motion.div>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-300 leading-snug font-medium">{error}</p>
            </motion.div>
          )}

          <DatasetSelector />
        </div>
      </section>

      {/* Variable Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-200">Variable</h3>
        </div>
        <div className="flex flex-col gap-2">
          {variables.map((v) => (
            <button
              key={v.id}
              onClick={() => setVariable(v.id)}
              className={`
                flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all group
                ${selectedVariable === v.id
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/5"
                  : "bg-slate-800/40 text-slate-400 hover:bg-slate-800/60 border border-transparent"}
              `}
            >
              <div className="flex items-center gap-3">
                <v.icon className={`w-4 h-4 transition-colors ${selectedVariable === v.id ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                {v.label}
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${selectedVariable === v.id ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)]" : "bg-transparent"}`} />
            </button>
          ))}
        </div>
      </section>

      {/* Year Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-200">Year</h3>
        </div>
        <div className="px-2">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">1990</span>
            <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30">
              <span className="text-sm font-bold text-cyan-400">{timeRange[1]}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">2024</span>
          </div>
          <input
            type="range"
            min="1990"
            max="2024"
            value={timeRange[1]}
            onChange={(e) => setTimeRange([timeRange[0], Number(e.target.value)])}
            className="w-full h-1.5 rounded-full appearance-none bg-slate-800 accent-cyan-500 cursor-pointer"
          />
        </div>
      </section>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-slate-700/30">
        <div className="flex items-center gap-3 opacity-60">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Powered by ClimateLens</span>
            <span className="text-[11px] text-slate-300 font-medium">NASA GISS · NOAA · ERA5</span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
