"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Thermometer, Droplets, Wind, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// Country-level climate profiles (representative data per country)
const COUNTRY_PROFILES: Record<
  string,
  {
    flag: string;
    tempBaseline: number;
    tempTrend: number; // °C change per decade
    precipMm: number;
    windKmh: number;
    risk: "critical" | "high" | "moderate" | "low";
    insight: string;
    projection2050: string;
  }
> = {
  "N_America": {
    flag: "🇺🇸",
    tempBaseline: 12.5,
    tempTrend: 0.35,
    precipMm: 715,
    windKmh: 14,
    risk: "high",
    insight: "North America's temperature has risen 0.35°C per decade since 1980. Wildfires and hurricane intensity are increasing significantly in the West and Gulf Coast regions.",
    projection2050: "Western US faces 2.3°C warming above 1990 baseline; drought probability increases 60%.",
  },
  "S_America": {
    flag: "🇧🇷",
    tempBaseline: 25.2,
    tempTrend: 0.28,
    precipMm: 1200,
    windKmh: 9,
    risk: "critical",
    insight: "The Amazon basin — the world's largest carbon sink — is losing 2.3 million hectares of forest per year. This destabilizes rainfall for the entire continent.",
    projection2050: "Amazon dieback risk by 2045 if deforestation continues; Brazil's agricultural heartland could become semi-arid.",
  },
  "Europe": {
    flag: "🇪🇺",
    tempBaseline: 10.8,
    tempTrend: 0.45,
    precipMm: 640,
    windKmh: 16,
    risk: "high",
    insight: "Europe is warming faster than the global average — at nearly 0.45°C per decade. The 2023 summer was the hottest on record, with extreme heat from Portugal to Greece affecting 100+ million people.",
    projection2050: "Southern Europe faces 3°C+ warming; Mediterranean countries risk desertification. Northern Europe sees increased flooding.",
  },
  "Africa": {
    flag: "🌍",
    tempBaseline: 28.4,
    tempTrend: 0.31,
    precipMm: 680,
    windKmh: 11,
    risk: "critical",
    insight: "Africa contributes less than 4% of global emissions yet faces the most severe climate impacts. The Sahel region is experiencing the most rapid desertification on earth at 48km/year.",
    projection2050: "Over 250 million Africans face water scarcity by 2050. Sub-Saharan crop yields could fall 50%.",
  },
  "Asia": {
    flag: "🌏",
    tempBaseline: 18.6,
    tempTrend: 0.38,
    precipMm: 890,
    windKmh: 12,
    risk: "critical",
    insight: "Asia is home to 60% of the world's population and is highly vulnerable. Monsoon disruptions in South Asia are already causing agricultural losses of $50B+ per year.",
    projection2050: "Sea level rise threatens 1 billion coastal residents. India and Pakistan face 50+ day 'wet-bulb' heat events annually by 2050.",
  },
  "Australia": {
    flag: "🇦🇺",
    tempBaseline: 22.1,
    tempTrend: 0.41,
    precipMm: 465,
    windKmh: 19,
    risk: "high",
    insight: "Australia has warmed 1.5°C since 1910. The 2019-20 Black Summer bushfires burned 18.6 million hectares — an area the size of Syria — and caused ecological devastation across multiple ecosystems.",
    projection2050: "Great Barrier Reef coral bleaching becomes permanent above 2°C; fire seasons extend to 9+ months per year.",
  },
};

// Generate historical trend data for a region
function generateTrend(baseline: number, trend: number): { year: number; value: number }[] {
  const data = [];
  for (let y = 1990; y <= 2024; y++) {
    const delta = ((y - 1990) / 10) * trend;
    const noise = (Math.sin(y * 1.3) * 0.3 + Math.cos(y * 0.7) * 0.2);
    data.push({ year: y, value: Math.round((baseline + delta + noise) * 10) / 10 });
  }
  return data;
}

interface Props {
  continentId: string;
  onClose: () => void;
}

const RISK_COLORS = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", label: "CRITICAL RISK" },
  high: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", label: "HIGH RISK" },
  moderate: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", label: "MODERATE RISK" },
  low: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", label: "LOW RISK" },
};

const CONTINENT_NAMES: Record<string, string> = {
  N_America: "North America",
  S_America: "South America",
  Europe: "Europe",
  Africa: "Africa",
  Asia: "Asia",
  Australia: "Australia / Oceania",
};

export function CountryInsightModal({ continentId, onClose }: Props) {
  const profile = COUNTRY_PROFILES[continentId];
  const name = CONTINENT_NAMES[continentId] ?? continentId;
  const trend = profile ? generateTrend(profile.tempBaseline, profile.tempTrend) : [];
  const risk = profile ? RISK_COLORS[profile.risk] : RISK_COLORS["moderate"];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!profile) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
          className="relative z-10 w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-700/50 shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 pb-0 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{profile.flag}</span>
                <div>
                  <h2 className="text-xl font-black text-white">{name}</h2>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${risk.bg} ${risk.border} ${risk.text} border`}>
                    {risk.label}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 p-6">
            {[
              { icon: Thermometer, label: "Avg Temp", value: `${profile.tempBaseline}°C`, sub: `+${profile.tempTrend}°C/decade`, color: "text-orange-400" },
              { icon: Droplets, label: "Annual Rain", value: `${profile.precipMm}mm`, sub: "average", color: "text-cyan-400" },
              { icon: Wind, label: "Wind Speed", value: `${profile.windKmh}km/h`, sub: "average", color: "text-purple-400" },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/30">
                <stat.icon className={`w-4 h-4 ${stat.color} mb-2`} />
                <div className="text-lg font-black text-white">{stat.value}</div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{stat.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Temperature trend chart */}
          <div className="px-6">
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/30">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Temperature Trend (1990–2024)</h3>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => v % 5 === 0 ? v.toString() : ""} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => `${v}°C`} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: "#94a3b8" }}
                    itemStyle={{ color: "#f97316" }}
                    formatter={(v: any) => [`${v}°C`, "Temperature"]}
                  />
                  <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insight */}
          <div className="p-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">AI Climate Insight</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{profile.insight}</p>
            </div>

            {/* 2050 Projection */}
            <div className={`mt-3 p-4 rounded-2xl ${risk.bg} ${risk.border} border`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`w-4 h-4 ${risk.text}`} />
                <span className={`text-xs font-bold ${risk.text} uppercase tracking-wider`}>2050 Projection</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{profile.projection2050}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
