"use client";

import Link from "next/link";
import { useDatasets } from "@/lib/hooks";
import { useClimateStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Check, CheckCircle2, X, ExternalLink } from "lucide-react";

export function DatasetSelector() {
  const { data: datasets, isLoading } = useDatasets();
  const { selectedDataset, setDataset, userDatasetName, userDatasetMeta, clearUserDataset } = useClimateStore();

  return (
    <div className="space-y-2">
      {/* Uploaded dataset — shows at top if present */}
      {userDatasetName && userDatasetMeta ? (
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              Custom File Active
            </span>
          </div>
          <div className="flex flex-col p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/25 relative">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-emerald-300 truncate max-w-[160px]" title={userDatasetName}>
                {userDatasetName}
              </span>
              <button
                onClick={clearUserDataset}
                className="p-0.5 rounded-md text-slate-500 hover:text-slate-300 transition-colors shrink-0"
                title="Remove uploaded dataset"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/30">
                {userDatasetMeta.pointCount.toLocaleString()} pts
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/30">
                {userDatasetMeta.yearMin === userDatasetMeta.yearMax ? userDatasetMeta.yearMin : `${userDatasetMeta.yearMin}–${userDatasetMeta.yearMax}`}
              </span>
              {userDatasetMeta.detectedVariables.slice(0, 2).map((v) => (
                <span key={v} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/30">
                  {v}
                </span>
              ))}
            </div>
            <Link href="/datasets" className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400/70 hover:text-emerald-300 transition-colors">
              View full specs <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Data Source
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {datasets?.map((d) => (
              <button
                key={d.id}
                onClick={() => setDataset(d.id)}
                className={`
                  flex flex-col p-3 rounded-xl border transition-all text-left relative overflow-hidden group
                  ${selectedDataset === d.id
                    ? "bg-slate-800/80 border-cyan-500/40"
                    : "bg-slate-900/40 border-slate-800 hover:border-slate-700"}
                `}
              >
                <div className="flex items-center justify-between gap-2 z-10">
                  <span className={`text-xs font-bold ${selectedDataset === d.id ? "text-cyan-400" : "text-slate-300"}`}>
                    {d.name}
                  </span>
                  {selectedDataset === d.id && <Check className="w-3 h-3 text-cyan-400" />}
                </div>
                <AnimatePresence>
                  {selectedDataset === d.id && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-[10px] text-slate-500 mt-1 leading-tight line-clamp-2 pr-4 z-10"
                    >
                      {d.description}
                    </motion.p>
                  )}
                </AnimatePresence>
                {selectedDataset === d.id && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 blur-2xl rounded-full -mr-4 -mt-4" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
