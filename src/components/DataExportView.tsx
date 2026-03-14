"use client";

import { useMemo } from "react";
import { Download, Table as TableIcon, FileJson, Globe } from "lucide-react";
import { useClimateMapData, useTimeSeries } from "@/lib/hooks";
import { useClimateStore } from "@/lib/store";

export function DataExportView() {
  const { selectedVariable, selectedDataset, timeRange } = useClimateStore();
  const { data: spatialData, isLoading: isSpatialLoading } = useClimateMapData(
    Number(timeRange[1]),
    selectedVariable
  );
  const { data: timeSeriesData, isLoading: isTSLoading } = useTimeSeries(
    selectedVariable
  );

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => JSON.stringify(row[header])).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-cyan-400" />
            Data Preview & Export
          </h2>
          <p className="text-sm text-slate-400">
            Preview raw values and export to CSV for external analysis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Spatial Slice Table */}
        <div className="glass-card rounded-2xl border border-slate-700/30 overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-700/30 flex items-center justify-between bg-slate-800/30">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-slate-200">
                Spatial slice — {selectedVariable.charAt(0).toUpperCase() + selectedVariable.slice(1)} · {timeRange[1]}
              </span>
            </div>
            <button
              onClick={() => downloadCSV(spatialData || [], `climate_spatial_${timeRange[1]}.csv`)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-medium transition-colors"
            >
              <Download className="w-3 h-3" />
              Download spatial (CSV)
            </button>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            {isSpatialLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic">
                Loading spatial data...
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-900 shadow-sm z-10">
                  <tr>
                    <th className="p-3 font-semibold text-slate-500 border-b border-slate-700/50">lat</th>
                    <th className="p-3 font-semibold text-slate-500 border-b border-slate-700/50">lon</th>
                    <th className="p-3 font-semibold text-slate-500 border-b border-slate-700/50">year</th>
                    <th className="p-3 font-semibold text-slate-500 border-b border-slate-700/50">value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {(spatialData?.slice(0, 100) || []).map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 text-slate-400">{row.lat.toFixed(2)}</td>
                      <td className="p-3 text-slate-400">{row.lon.toFixed(2)}</td>
                      <td className="p-3 text-slate-400">{timeRange[1]}</td>
                      <td className="p-3 text-cyan-400 font-medium">{row.value.toFixed(4)}</td>
                    </tr>
                  ))}
                  {spatialData && spatialData.length > 100 && (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-slate-500 italic border-t border-slate-800">
                        Showing first 100 of {spatialData.length} records...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Global Mean Table */}
        <div className="glass-card rounded-2xl border border-slate-700/30 overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-700/30 flex items-center justify-between bg-slate-800/30">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-slate-200">
                Global mean time series — {selectedVariable.charAt(0).toUpperCase() + selectedVariable.slice(1)}
              </span>
            </div>
            <button
              onClick={() => downloadCSV(timeSeriesData || [], `climate_timeseries.csv`)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-medium transition-colors"
            >
              <Download className="w-3 h-3" />
              Download time series (CSV)
            </button>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            {isTSLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic">
                Loading time series...
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-900 shadow-sm z-10">
                  <tr>
                    <th className="p-3 font-semibold text-slate-500 border-b border-slate-700/50">year</th>
                    <th className="p-3 font-semibold text-slate-500 border-b border-slate-700/50">value</th>
                    <th className="p-3 font-semibold text-slate-500 border-b border-slate-700/50">unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {(timeSeriesData || []).map((row, i) => (
                    <tr key={i} className={`hover:bg-slate-800/30 transition-colors ${row.year === timeRange[1] ? 'bg-cyan-500/5' : ''}`}>
                      <td className="p-3 text-slate-200 font-medium">{row.year}</td>
                      <td className="p-3 text-cyan-400 font-bold">{row.value.toFixed(4)}</td>
                      <td className="p-3 text-slate-500">{selectedVariable === 'temperature' ? '°C' : '%'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Activity } from "lucide-react";
