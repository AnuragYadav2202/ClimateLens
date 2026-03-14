"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Database, MousePointer2, Scan, Info } from "lucide-react";
import { useClimateStore } from "@/lib/store";
import { useClimateMapData } from "@/lib/hooks";

// Dynamically import Globe to avoid SSR issues with Three.js
const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-950/40 backdrop-blur-3xl animate-pulse">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
        <span className="text-[10px] font-black text-emerald-400 tracking-[0.3em] uppercase">Booting Biosphere</span>
      </div>
    </div>
  ),
});

export function GlobeView() {
  const globeEl = useRef<any>(null);
  const { selectedVariable, timeRange, userDatasetName, userDatasetMeta } = useClimateStore();
  const { data, isLoading } = useClimateMapData(timeRange[1], selectedVariable);

  const [countries, setCountries] = useState<any[]>([]);
  const [hoverD, setHoverD] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Load GeoJSON for country polygons
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson")
      .then((res) => res.json())
      .then((data) => setCountries(data.features))
      .catch(err => console.error("GeoJSON load failed:", err));
  }, []);

  // Sync dimensions
  useEffect(() => {
    const updateSize = () => {
      setDimensions({
        width: window.innerWidth - 320, // Subtract sidebar width
        height: window.innerHeight - 80, // Subtract header padding
      });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Configure controls
  useEffect(() => {
    if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.6;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.rotateSpeed = 0.8;
      controls.minDistance = 200;
      controls.maxDistance = 600;
    }
  }, []);

  // Data mapping for points/hexagons
  const dataStats = useMemo(() => {
    if (!data?.length) return { min: 0, max: 0 };
    const vals = data.map(d => {
      if (selectedVariable === "temperature") return d.temp;
      if (selectedVariable === "precipitation") return d.precipitation ?? 0;
      return d.windSpeed ?? 0;
    });
    return {
      min: Math.min(...vals),
      max: Math.max(...vals),
    };
  }, [data, selectedVariable]);

  const unit = selectedVariable === "temperature" ? "°C" : selectedVariable === "precipitation" ? "mm" : "km/h";

  // Color generator for points based on "Life & Heat" palette
  const getColor = useCallback((val: number) => {
    const range = dataStats.max - dataStats.min || 1;
    const t = (val - dataStats.min) / range;
    
    // Emerald Obsidian Scale: Deep Blue -> Emerald -> Mint -> Amber -> Rose
    if (t < 0.2) return `rgba(10, 40, 100, ${0.4 + t})`;
    if (t < 0.45) return `rgba(16, 185, 129, ${0.5 + t})`;
    if (t < 0.65) return `rgba(110, 231, 183, ${0.6 + t})`;
    if (t < 0.85) return `rgba(245, 158, 11, ${0.7 + t})`;
    return `rgba(225, 29, 72, ${0.8 + t})`;
  }, [dataStats]);

  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden cursor-crosshair">
      <AnimatePresence>
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <Globe
              ref={globeEl}
              width={dimensions.width}
              height={dimensions.height}
              backgroundColor="rgba(0,0,0,0)"
              
              // Globe visuals
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
              bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
              
              // Atmosphere
              showAtmosphere={true}
              atmosphereColor="#10b981"
              atmosphereAltitude={0.18}

              // Polygons (Countries)
              polygonsData={countries}
              polygonAltitude={d => d === hoverD ? 0.04 : 0.005}
              polygonCapColor={d => d === hoverD ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.02)"}
              polygonSideColor={() => "rgba(16, 185, 129, 0.1)"}
              polygonStrokeColor={() => "rgba(16, 185, 129, 0.2)"}
              onPolygonHover={setHoverD}
              polygonsTransitionDuration={300}

              // Data Points (Points for scientific look)
              pointsData={data || []}
              pointLat="lat"
              pointLng="lon"
              pointColor={(d: any) => {
                const val = selectedVariable === "temperature" ? d.temp : 
                           selectedVariable === "precipitation" ? (d.precipitation ?? 0) : (d.windSpeed ?? 0);
                return getColor(val);
              }}
              pointAltitude={(d: any) => {
                const val = selectedVariable === "temperature" ? d.temp : 
                           selectedVariable === "precipitation" ? (d.precipitation ?? 0) : (d.windSpeed ?? 0);
                return Math.max(0.01, (val - dataStats.min) / (dataStats.max - dataStats.min || 1) * 0.1);
              }}
              pointRadius={0.35}
              pointsMerge={true}
              pointsTransitionDuration={1000}

              // Ring labels for major hubs/anomalies
              ringsData={data?.filter((d, i) => {
                const val = selectedVariable === "temperature" ? d.temp : 
                           selectedVariable === "precipitation" ? (d.precipitation ?? 0) : (d.windSpeed ?? 0);
                return i % 50 === 0 && val > dataStats.max * 0.9;
              }) || []}
              ringLat="lat"
              ringLng="lon"
              ringColor={() => "rgba(225, 29, 72, 0.5)"}
              ringMaxRadius={2}
              ringPropagationSpeed={2}
              ringRepeatPeriod={800}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic HUD Elements */}
      <div className="absolute inset-0 pointer-events-none z-20">
        
        {/* Top-Left: System Status */}
        <div className="absolute top-8 left-8">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="glass-card p-5 border-emerald-500/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
              <span className="text-[11px] font-black text-white/90 uppercase tracking-[0.3em]">Biosphere Observation Hub</span>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-emerald-400/70 border-b border-white/5 pb-1 mb-1">UNIT_ID: EARTH_AXIS_01</p>
              <div className="flex items-center gap-2">
                <Scan className="w-3 h-3 text-emerald-500/50" />
                <span className="text-[10px] text-slate-400 font-bold uppercase">{selectedVariable} • {timeRange[1]}</span>
              </div>
              {userDatasetName && (
                <div className="flex items-center gap-2">
                  <Database className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-300 font-bold uppercase truncate max-w-[150px]">{userDatasetName}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Top-Right: Telemetry */}
        <div className="absolute top-8 right-8 text-right">
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="glass-card px-4 py-3 border-emerald-500/10 text-[10px]"
          >
            <p className="text-slate-500 font-black uppercase tracking-widest mb-1.5 flex items-center justify-end gap-2">
              Spectral Telemetry <Info className="w-3 h-3" />
            </p>
            <div className="flex flex-col gap-1 font-mono">
              <p className="text-emerald-400"><span className="text-slate-500">PEAK:</span> {dataStats.max.toFixed(2)}{unit}</p>
              <p className="text-emerald-600"><span className="text-slate-500">BASE:</span> {dataStats.min.toFixed(2)}{unit}</p>
              <p className="text-slate-600 mt-1 uppercase text-[8px] font-black">Scanning 18,240 Geo-Points</p>
            </div>
          </motion.div>
        </div>

        {/* Bottom-Right: Color Scale */}
        <div className="absolute bottom-8 right-8">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-card p-5 border-emerald-500/20 min-w-[140px]"
          >
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 text-center">Biosphere Energy</p>
            <div className="flex items-center gap-4">
              <div className="h-40 w-1.5 rounded-full overflow-hidden flex flex-col-reverse" style={{ background: "linear-gradient(to top, rgb(10,40,100), rgb(16,185,129), rgb(110,231,183), rgb(245,158,11), rgb(225,29,72))" }} />
              <div className="flex flex-col justify-between h-40 text-[10px] font-black font-mono">
                <span className="text-rose-500">{dataStats.max.toFixed(0)}{unit}</span>
                <span className="text-amber-500 opacity-50 uppercase text-[8px]">Thermal</span>
                <span className="text-emerald-400 opacity-50 uppercase text-[8px]">Stable</span>
                <span className="text-emerald-700">{dataStats.min.toFixed(0)}{unit}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Interaction Hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/5">
             <MousePointer2 className="w-3 h-3 text-emerald-400" />
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Drag to Navigate • Scroll to Zoom • Hover for Regions</span>
          </div>
        </div>

        {/* Atmospheric Glow Ring (Visual Only) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vh] h-[70vh] rounded-full border border-emerald-500/10 pointer-events-none opacity-40 shadow-[0_0_150px_rgba(16,185,129,0.05)]" />
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl"
          >
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-2 border-emerald-500/10 rounded-full" />
              <div className="absolute inset-0 border-t-2 border-emerald-400 rounded-full animate-spin" />
              <div className="absolute inset-4 border-2 border-emerald-500/5 rounded-full" />
              <div className="absolute inset-4 border-b-2 border-emerald-600 rounded-full animate-spin-reverse" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-[0.5em] mb-2">Reconstructing</h2>
            <p className="text-[10px] text-emerald-400/60 font-mono animate-pulse">MAP_MATRIX_VERSION_4.0.1</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
