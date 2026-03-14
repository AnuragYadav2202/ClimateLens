"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, X } from "lucide-react";
import { useClimateStore } from "@/lib/store";
import { parseNetCDFFile } from "@/lib/netcdf";

export function UploadDatasetPanel() {
  const { timeRange, userDatasetName, userPoints, setUserDataset, clearUserDataset } =
    useClimateStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      const points = await parseNetCDFFile(file, timeRange[1]);
      if (!points.length) {
        setError("No points found in file.");
      } else {
        setUserDataset(file.name, points);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to read NetCDF file.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasDataset = !!userPoints?.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 pt-3 border-t border-slate-700/50"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 uppercase tracking-wider">
          Upload NetCDF v3 (.nc)
        </span>
        {hasDataset && (
          <button
            onClick={clearUserDataset}
            className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
      <label className="block">
        <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-900/60 border border-dashed border-slate-700 hover:border-cyan-500/40 cursor-pointer text-xs text-slate-400">
          <UploadCloud className="w-3 h-3" />
          <span>{isLoading ? "Reading file…" : "Choose .nc file"}</span>
        </div>
        <input
          type="file"
          accept=".nc"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {userDatasetName && hasDataset && (
        <div className="mt-2 text-[11px] text-slate-400">
          <div className="truncate">Using: {userDatasetName}</div>
          <div>{userPoints!.length} grid points loaded</div>
        </div>
      )}
      {error && (
        <div className="mt-2 text-[11px] text-rose-400">
          {error}
        </div>
      )}
      {!error && !hasDataset && !isLoading && (
        <p className="mt-2 text-[11px] text-slate-500">
          Optional: upload a classic NetCDF v3 grid with lat/lon/temp to override map data for the selected year. NetCDF‑4 / HDF5 files are not supported in the browser.
        </p>
      )}
    </motion.div>
  );
}

