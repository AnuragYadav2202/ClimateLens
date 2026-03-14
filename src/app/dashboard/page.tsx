"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Sidebar } from "@/components/Sidebar";
import { TimeSeriesChart } from "@/components/TimeSeriesChart";
import { InsightPanel } from "@/components/InsightPanel";
import { ComparisonView } from "@/components/ComparisonView";
import { PlotlyClimateView } from "@/components/PlotlyClimateView";
import { LocationAnalysis } from "@/components/LocationAnalysis";
import { YearComparisonView } from "@/components/YearComparisonView";
import { SummaryStats } from "@/components/SummaryStats";
import { SeasonalPulse } from "@/components/SeasonalPulse";
import { ZonalMean } from "@/components/ZonalMean";
import { PlotlyComparisonView } from "@/components/PlotlyComparisonView";
import { Globe, Map, BarChart3, Info, CheckCircle2, X, Activity, Layers } from "lucide-react";
import { useClimateStore } from "@/lib/store";

const ClimateMap = dynamic(
  () => import("@/components/ClimateMap").then((m) => ({ default: m.ClimateMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] rounded-xl bg-slate-800/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-slate-400">Loading map...</span>
        </div>
      </div>
    ),
  }
);

const GlobeView = dynamic(
  () => import("@/components/GlobeView").then((m) => m.GlobeView),
  { ssr: false }
);

type TabType = "overview" | "comparison" | "location" | "3d-globe";


export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const { userDatasetName, userPoints, clearUserDataset } = useClimateStore();

  const tabs = [
    { id: "overview", label: "Overview", icon: Map },
    { id: "comparison", label: "Comparison", icon: BarChart3 },
    { id: "location", label: "Location", icon: Info },
    { id: "3d-globe", label: "3D Globe", icon: Globe },
  ] as const;

  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          <Sidebar />

          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2 border-b border-slate-700/30">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                  <span className="w-2 h-8 bg-cyan-500 rounded-full" />
                  Interactive Climate Explorer
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Analyze ERA5, NASA, and NOAA datasets with real-time AI insights.
                </p>
              </div>

              <div className="flex bg-slate-800/40 p-1 rounded-xl border border-slate-700/50 self-start sm:self-auto overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Dataset Banner */}
            {userDatasetName && userPoints && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-300">
                      Custom Dataset Active: <span className="font-mono">{userDatasetName}</span>
                    </p>
                    <p className="text-[11px] text-emerald-400/70">
                      {userPoints.length.toLocaleString()} data points — all charts and maps are driven by your uploaded data
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearUserDataset}
                  className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400/60 hover:text-emerald-300 transition-colors"
                  title="Return to default data"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}

            {/* Stats Summary (Visible on Overview) */}
            {activeTab === "overview" && <SummaryStats />}

            {/* Tab Content */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      <ClimateMap />
                      
                      {/* Advanced Scientific Analytics Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <SeasonalPulse />
                        <ZonalMean />
                        <InsightPanel />
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        <TimeSeriesChart />
                      </div>
                    </div>
                  )}

                  {activeTab === "comparison" && (
                    <div className="space-y-6">
                      <PlotlyComparisonView />
                      <YearComparisonView />
                      <PlotlyClimateView />
                    </div>
                  )}

                  {activeTab === "location" && (
                    <LocationAnalysis />
                  )}

                  {activeTab === "3d-globe" && (
                    <GlobeView />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
