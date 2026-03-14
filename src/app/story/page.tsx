"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, LineChart, Line,
} from "recharts";
import { ArrowRight, Thermometer, Droplets, Wind, TrendingUp, Database, Upload } from "lucide-react";
import { useClimateStore } from "@/lib/store";
import { useTimeSeries } from "@/lib/hooks";

// ── Static factual data (used when no custom dataset is uploaded) ──────────
const STATIC_TEMP_DATA = [
  { year: 1980, value: 14.18 }, { year: 1985, value: 14.22 }, { year: 1990, value: 14.44 },
  { year: 1995, value: 14.55 }, { year: 1998, value: 14.71 }, { year: 2000, value: 14.52 },
  { year: 2005, value: 14.68 }, { year: 2010, value: 14.70 }, { year: 2015, value: 14.90 },
  { year: 2016, value: 15.05 }, { year: 2020, value: 14.98 }, { year: 2023, value: 15.13 },
  { year: 2024, value: 15.22 },
];

const STATIC_CO2_DATA = [
  { year: 1960, value: 316 }, { year: 1970, value: 325 }, { year: 1980, value: 338 },
  { year: 1990, value: 354 }, { year: 2000, value: 369 }, { year: 2010, value: 389 },
  { year: 2015, value: 401 }, { year: 2020, value: 413 }, { year: 2022, value: 419 },
  { year: 2023, value: 421 }, { year: 2024, value: 423 },
];

const STATIC_ARCTIC_DATA = [
  { year: 1980, value: 7.4 }, { year: 1985, value: 7.1 }, { year: 1990, value: 6.9 },
  { year: 1995, value: 6.5 }, { year: 2000, value: 6.3 }, { year: 2005, value: 5.9 },
  { year: 2007, value: 4.3 }, { year: 2010, value: 5.2 }, { year: 2012, value: 3.4 },
  { year: 2015, value: 4.7 }, { year: 2019, value: 4.1 }, { year: 2023, value: 4.4 },
];

const STATIC_EXTREME_DATA = [
  { year: 1990, value: 3 }, { year: 1995, value: 4 }, { year: 2000, value: 5 },
  { year: 2003, value: 9 }, { year: 2010, value: 12 }, { year: 2015, value: 17 },
  { year: 2019, value: 22 }, { year: 2023, value: 32 },
];

// ── Data-driven section component ─────────────────────────────────────────
function DataSection({
  id, badge, headline, body, stat, statLabel,
  data, dataKey, unit, refLine, refLabel,
  color1, color2, accent, accentLight, gradId, flip,
}: {
  id: string; badge: string; headline: string; body: string;
  stat: string; statLabel: string;
  data: { year: number; value: number }[]; dataKey: string; unit: string;
  refLine?: number; refLabel?: string;
  color1: string; color2: string; accent: string; accentLight: string;
  gradId: string; flip: boolean;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7 }}
      className={`flex flex-col ${flip ? "lg:flex-row-reverse" : "lg:flex-row"} gap-10 items-center`}
    >
      <div className="flex-1 space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-semibold">
          {badge}
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-100 leading-tight">{headline}</h2>
        <p className="text-slate-400 leading-relaxed text-base">{body}</p>
        <div className="inline-block p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-3xl font-black" style={{ color: accentLight }}>{stat}</div>
          <div className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">{statLabel}</div>
        </div>
      </div>

      <div className="flex-1 w-full">
        <div className="p-6 rounded-3xl glass-card border border-slate-700/30">
          <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Historical Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color1} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={color2} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `${v}${unit.trim()}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: accentLight }}
                formatter={(v: any) => [`${v}${unit}`, "Value"]}
              />
              {refLine && (
                <ReferenceLine y={refLine} stroke={accent} strokeDasharray="6 3" strokeOpacity={0.6}
                  label={{ value: refLabel, position: "insideTopRight", fill: accent, fontSize: 10 }} />
              )}
              <Area type="monotone" dataKey={dataKey} stroke={color1} strokeWidth={2.5}
                fill={`url(#${gradId})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.section>
  );
}

// ── Custom dataset story (when user uploads a file) ────────────────────────
function UserDatasetStory() {
  const { userDatasetMeta, selectedVariable, setVariable } = useClimateStore();
  const { data: tempSeries } = useTimeSeries("temperature");
  const { data: precipSeries } = useTimeSeries("precipitation");
  const { data: windSeries } = useTimeSeries("wind");

  if (!userDatasetMeta) return null;

  const meta = userDatasetMeta;

  const SERIES = [
    tempSeries && { id: "user-temp", badge: "🌡️ Temperature", headline: `Your dataset: temperature from ${meta.tempRange?.[0].toFixed(1)}°C to ${meta.tempRange?.[1].toFixed(1)}°C`, body: `This chart shows the temperature trend derived from your uploaded file "${meta.name}". It covers ${meta.pointCount.toLocaleString()} data points across ${meta.latMin.toFixed(0)}°–${meta.latMax.toFixed(0)}° latitude.`, stat: meta.tempRange ? `${((meta.tempRange[0]+meta.tempRange[1])/2).toFixed(1)}°C` : "N/A", statLabel: "Mean temperature", data: tempSeries.map(d => ({year: d.year, value: d.value})), unit: "°C", color1: "#f97316", color2: "#ef4444", accent: "#f97316", accentLight: "rgb(249,115,22)", gradId: "grad-user-temp" },
    precipSeries && meta.precipRange && { id: "user-precip", badge: "💧 Precipitation", headline: `Your dataset: precipitation from ${meta.precipRange?.[0].toFixed(0)} to ${meta.precipRange?.[1].toFixed(0)}mm`, body: `Precipitation data from "${meta.name}" across ${meta.lonMin.toFixed(0)}°–${meta.lonMax.toFixed(0)}° longitude. The variation shows regional rainfall patterns in your dataset.`, stat: meta.precipRange ? `${((meta.precipRange[0]+meta.precipRange[1])/2).toFixed(0)}mm` : "N/A", statLabel: "Mean precipitation", data: precipSeries.map(d => ({year: d.year, value: d.value})), unit: " mm", color1: "#22d3ee", color2: "#3b82f6", accent: "#22d3ee", accentLight: "rgb(34,211,238)", gradId: "grad-user-precip" },
    windSeries && meta.windRange && { id: "user-wind", badge: "💨 Wind Speed", headline: `Your dataset: wind from ${meta.windRange?.[0].toFixed(1)} to ${meta.windRange?.[1].toFixed(1)}km/h`, body: `Wind speed data from "${meta.name}". Higher latitudes typically show stronger wind patterns.`, stat: meta.windRange ? `${((meta.windRange[0]+meta.windRange[1])/2).toFixed(1)}km/h` : "N/A", statLabel: "Mean wind speed", data: windSeries.map(d => ({year: d.year, value: d.value})), unit: " km/h", color1: "#a855f7", color2: "#8b5cf6", accent: "#a855f7", accentLight: "rgb(168,85,247)", gradId: "grad-user-wind" },
  ].filter(Boolean) as any[];

  return (
    <div className="space-y-32">
      {/* Dataset summary hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-4">
          <Database className="w-4 h-4" /> Custom Dataset Active
        </div>
        <h2 className="text-3xl font-black text-white mb-2">{meta.name}</h2>
        <p className="text-slate-400 max-w-xl mx-auto mb-6">
          Showing climate story derived from your uploaded data — {meta.pointCount.toLocaleString()} points,
          lat {meta.latMin.toFixed(0)}°–{meta.latMax.toFixed(0)}°, lon {meta.lonMin.toFixed(0)}°–{meta.lonMax.toFixed(0)}°.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {meta.detectedVariables.map((v: string) => (
            <button key={v} onClick={() => setVariable(v as any)}
              className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700/50 text-slate-300 text-sm font-bold">
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {SERIES.map((s, i) => (
        <DataSection key={s.id} {...s} dataKey="value" refLine={undefined} refLabel={undefined} flip={i % 2 === 1} />
      ))}
    </div>
  );
}

// ── Main Story page ────────────────────────────────────────────────────────
export default function StoryPage() {
  const { userDatasetName } = useClimateStore();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[#020617]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_30%,rgba(56,189,248,0.12),transparent)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:6rem_6rem]" />
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-cyan-500/20 text-cyan-400/80 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            {userDatasetName ? `Showing: ${userDatasetName}` : "Data-Driven Climate Narrative"}
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6">
            {userDatasetName ? (
              <><span className="gradient-text">Your Climate</span><br /><span className="text-slate-200">Data Story</span></>
            ) : (
              <><span className="gradient-text">Our Planet</span><br /><span className="text-slate-200">Is Changing Fast</span></>
            )}
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {userDatasetName
              ? `Scroll through trends derived from your uploaded dataset "${userDatasetName}".`
              : "Four datasets. Four undeniable truths. Scroll through the evidence compiled from ERA5, NOAA, and NASA archives."}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => document.getElementById(userDatasetName ? "user-temp" : "temperature")?.scrollIntoView({ behavior: "smooth" })}
              className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              Explore the Story <ArrowRight className="w-4 h-4" />
            </button>
            <Link href="/dashboard">
              <button className="px-7 py-3.5 rounded-xl glass border border-slate-600/50 text-slate-200 font-semibold">
                Open Dashboard
              </button>
            </Link>
          </div>
        </motion.div>

        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} className="absolute bottom-10">
          <div className="w-5 h-8 border-2 border-slate-600 rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-2 bg-cyan-400 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Content: user data or static facts */}
      <div className="max-w-6xl mx-auto px-6 pb-32 space-y-32">
        {userDatasetName ? (
          <UserDatasetStory />
        ) : (
          <>
            <DataSection id="temperature" badge="🌡️ Rising Temperatures" headline="Earth is 1.2°C warmer than pre-industrial times"
              body="Since the 1880s, the global average surface temperature has increased by approximately 1.2°C. The last decade (2014–2024) has been the hottest ever recorded."
              stat="1.2°C" statLabel="Warming since 1880" data={STATIC_TEMP_DATA} dataKey="value" unit="°C"
              refLine={15.0} refLabel="1.5°C alert zone" color1="#f97316" color2="#ef4444" accent="#f97316" accentLight="rgb(249,115,22)" gradId="grad-temp" flip={false} />

            <DataSection id="co2" badge="💨 CO₂ Concentration" headline="Atmospheric CO₂ hits highest levels in 3 million years"
              body="The Mauna Loa Observatory first measured CO₂ at 316 ppm in 1958. Today it surpasses 423 ppm — rising at 2.5 ppm/year. Every ppm added traps more heat."
              stat="423 ppm" statLabel="Atmospheric CO₂ (2024)" data={STATIC_CO2_DATA} dataKey="value" unit=" ppm"
              refLine={350} refLabel="Safe limit" color1="#facc15" color2="#f59e0b" accent="#eab308" accentLight="rgb(234,179,8)" gradId="grad-co2" flip={true} />

            <DataSection id="arctic" badge="🧊 Arctic Ice Loss" headline="Arctic sea ice declining 13% per decade since 1979"
              body="Summer Arctic sea ice extent has shrunk from over 7 million km² in 1980 to under 4.5 million km² on average — triggering a self-amplifying feedback loop."
              stat="-13% / decade" statLabel="Arctic sea ice decline rate" data={STATIC_ARCTIC_DATA} dataKey="value" unit=" M km²"
              refLine={6.0} refLabel="1980s baseline" color1="#22d3ee" color2="#3b82f6" accent="#22d3ee" accentLight="rgb(34,211,238)" gradId="grad-arctic" flip={false} />

            <DataSection id="extremes" badge="🔥 Extreme Heat Days" headline="Extreme heat events are 5× more likely today than in 1990"
              body="The number of record-breaking heat days globally has more than tripled since 2000. By 2050, over 2 billion people could face more than 45 days of extreme heat each year."
              stat="5×" statLabel="Increase in extreme heat events" data={STATIC_EXTREME_DATA} dataKey="value" unit=" events"
              refLine={10} refLabel="2000 baseline" color1="#d946ef" color2="#8b5cf6" accent="#a855f7" accentLight="rgb(168,85,247)" gradId="grad-extreme" flip={true} />
          </>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center p-16 rounded-3xl glass-card border border-cyan-500/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,rgba(34,211,238,0.06),transparent)]" />
          <h2 className="text-3xl font-black text-slate-100 mb-4 relative z-10">
            {userDatasetName ? "Explore your data in full detail" : "The data is clear — but the story isn't over."}
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-8 relative z-10">
            {userDatasetName
              ? "Your dataset is driving the heatmap, globe, time series, and AI insights in the dashboard."
              : "Upload your own NetCDF datasets and see the impact with AI-powered insights."}
          </p>
          <div className="flex flex-wrap justify-center gap-4 relative z-10">
            <Link href="/dashboard">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold shadow-lg shadow-cyan-500/25 inline-flex items-center gap-2">
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            {!userDatasetName && (
              <Link href="/dashboard">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 rounded-xl glass border border-slate-600/50 text-slate-200 font-bold inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Dataset
                </motion.button>
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
