"use client";

import { useClimateStore } from "@/lib/store";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const ClimateMap = dynamic(() => import("./ClimateMap").then((m) => m.ClimateMap), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[300px] rounded-xl bg-slate-800/50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  ),
});

export function ComparisonView() {
  const { compareMode, compareYear1, compareYear2 } = useClimateStore();

  if (!compareMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl overflow-hidden glass-card"
      >
        <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
          <span className="text-cyan-400 font-medium">{compareYear1}</span>
        </div>
        <div className="h-[300px]">
          <ComparisonMapWrapper year={compareYear1} />
        </div>
      </motion.div>
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl overflow-hidden glass-card"
      >
        <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
          <span className="text-cyan-400 font-medium">{compareYear2}</span>
        </div>
        <div className="h-[300px]">
          <ComparisonMapWrapper year={compareYear2} />
        </div>
      </motion.div>
    </motion.div>
  );
}

function ComparisonMapWrapper({ year }: { year: number }) {
  return (
    <div className="h-full min-h-[300px]">
      <ClimateMap yearOverride={year} />
    </div>
  );
}
