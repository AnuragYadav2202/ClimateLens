"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useClimateStore } from "@/lib/store";
import { datasets } from "@/lib/mockData";
import { 
  Database, Upload, CheckCircle2, Thermometer, Droplets, Wind,
  MapPin, Calendar, BarChart3, X, ArrowRight
} from "lucide-react";

const VAR_ICONS: Record<string, React.ReactNode> = {
  temperature: <Thermometer className="w-3.5 h-3.5" />,
  precipitation: <Droplets className="w-3.5 h-3.5" />,
  wind: <Wind className="w-3.5 h-3.5" />,
};

const VAR_COLORS: Record<string, string> = {
  temperature: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  precipitation: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  wind: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

export default function DatasetsPage() {
  const { userDatasetName, userDatasetMeta, userPoints, clearUserDataset, setVariable } = useClimateStore();

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-100">Datasets</h1>
            <p className="text-sm text-slate-400">Manage data sources for all visualizations</p>
          </div>
        </div>
      </motion.div>

      {/* ── Uploaded Dataset Card ─────────────────────────────── */}
      {userDatasetName && userDatasetMeta ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-6 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/30 relative overflow-hidden"
        >
          {/* Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(52,211,153,0.06),transparent)] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Upload</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <h2 className="text-lg font-black text-white font-mono">{userDatasetMeta.name}</h2>
                </div>
              </div>
              <button
                onClick={clearUserDataset}
                className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                title="Remove uploaded dataset"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { icon: BarChart3, label: "Data Points", value: userDatasetMeta.pointCount.toLocaleString(), color: "text-cyan-400" },
                { icon: Calendar, label: "Year Range", value: userDatasetMeta.yearMin === userDatasetMeta.yearMax ? `${userDatasetMeta.yearMin}` : `${userDatasetMeta.yearMin}–${userDatasetMeta.yearMax}`, color: "text-blue-400" },
                { icon: MapPin, label: "Latitude", value: `${userDatasetMeta.latMin.toFixed(0)}° to ${userDatasetMeta.latMax.toFixed(0)}°`, color: "text-orange-400" },
                { icon: MapPin, label: "Longitude", value: `${userDatasetMeta.lonMin.toFixed(0)}° to ${userDatasetMeta.lonMax.toFixed(0)}°`, color: "text-purple-400" },
              ].map((spec) => (
                <div key={spec.label} className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/30">
                  <spec.icon className={`w-4 h-4 ${spec.color} mb-1.5`} />
                  <div className="text-sm font-bold text-white">{spec.value}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{spec.label}</div>
                </div>
              ))}
            </div>

            {/* Variables */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="text-xs text-slate-400 font-medium">Variables detected:</span>
              {userDatasetMeta.detectedVariables.length > 0 ? (
                userDatasetMeta.detectedVariables.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVariable(v as any)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer hover:opacity-80 transition-opacity ${VAR_COLORS[v] ?? "text-slate-400 bg-slate-400/10 border-slate-400/20"}`}
                  >
                    {VAR_ICONS[v]}
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                    {v === "temperature" && userDatasetMeta.tempRange && ` (${userDatasetMeta.tempRange[0].toFixed(1)}–${userDatasetMeta.tempRange[1].toFixed(1)}°C)`}
                    {v === "precipitation" && userDatasetMeta.precipRange && ` (${userDatasetMeta.precipRange[0].toFixed(0)}–${userDatasetMeta.precipRange[1].toFixed(0)}mm)`}
                    {v === "wind" && userDatasetMeta.windRange && ` (${userDatasetMeta.windRange[0].toFixed(1)}–${userDatasetMeta.windRange[1].toFixed(1)}km/h)`}
                  </button>
                ))
              ) : (
                <span className="text-xs text-slate-500">None detected — using first numeric variable</span>
              )}
            </div>

            <div className="flex gap-3">
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-bold flex items-center gap-2"
                >
                  View in Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </Link>
              <p className="text-xs text-slate-500 self-center">
                All charts, maps, and the globe are showing data from this file
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Upload prompt card */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 p-6 rounded-2xl border-2 border-dashed border-slate-700/60 bg-slate-900/30 flex flex-col items-center gap-3 text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
            <Upload className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-300">No custom dataset uploaded</p>
            <p className="text-xs text-slate-500 mt-1">Upload a NetCDF (.nc) file from the dashboard sidebar to drive all visualizations</p>
          </div>
          <Link href="/dashboard">
            <button className="mt-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-bold">
              Go to Dashboard
            </button>
          </Link>
        </motion.div>
      )}

      {/* ── Available Data Sources ────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Available Data Sources</h2>
        <div className="grid gap-4">
          {datasets.map((ds, i) => (
            <motion.div
              key={ds.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 rounded-2xl glass-card border border-slate-700/30 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-200">{ds.name}</h3>
                  {!userDatasetName && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Active</span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-2">{ds.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Calendar className="w-3 h-3" /> {ds.coverage}
                  </span>
                  {ds.variables.map((v) => (
                    <span key={v} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700/30">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
              {!userDatasetName && (
                <Link href="/dashboard">
                  <button className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0">
                    Explore <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
