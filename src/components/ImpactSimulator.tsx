"use client";

import { useClimateStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Thermometer } from "lucide-react";

export function ImpactSimulator() {
  const { impactTempDelta, setImpactTempDelta } = useClimateStore();

  return (
    <div className="pt-2 border-t border-slate-700/50">
      <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
        <Thermometer className="w-3 h-3" />
        Impact Simulator
      </label>
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max="3"
          step="0.5"
          value={impactTempDelta}
          onChange={(e) => setImpactTempDelta(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-slate-700 accent-cyan-500"
        />
        <motion.div
          key={impactTempDelta}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <span className="text-2xl font-bold gradient-text">
            +{impactTempDelta}°C
          </span>
          <span className="text-slate-500 text-sm ml-1">global temp increase</span>
        </motion.div>
        <p className="text-xs text-slate-500">
          Simulate warming impact on visualization
        </p>
      </div>
    </div>
  );
}
