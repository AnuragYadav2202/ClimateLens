"use client";

import { useTimeSeries } from "@/lib/hooks";
import { useClimateStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export function TimeSeriesChart() {
  const { timeRange, selectedVariable } = useClimateStore();
  const { data, isLoading } = useTimeSeries(
    selectedVariable,
    timeRange[0],
    timeRange[1]
  );

  const chartData = data?.map((d) => ({
    ...d,
    name: d.label,
  }));

  const unit =
    selectedVariable === "temperature"
      ? "°C"
      : selectedVariable === "precipitation"
        ? "mm"
        : "m/s";

  if (isLoading) {
    return (
      <div className="h-64 rounded-xl bg-slate-800/50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-64 rounded-xl glass-card p-4"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedVariable}-${timeRange.join("-")}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient
                  id="colorValue"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148, 163, 184, 0.1)"
              />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `${v}${unit}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(value: unknown) => [`${value ?? 0} ${unit}`, "Value"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#38bdf8"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>
      <div className="text-xs text-slate-500 mt-2 capitalize">
        {selectedVariable} trend over time
      </div>
    </motion.div>
  );
}
