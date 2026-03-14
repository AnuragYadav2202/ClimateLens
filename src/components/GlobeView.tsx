"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useClimateMapData } from "@/lib/hooks";
import { useClimateStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, MapPin, Thermometer, Droplets, Wind, Database } from "lucide-react";

// Major cities
const CITIES = [
  { name: "Moscow",       lat: 55.7,  lon: 37.6  },
  { name: "Cairo",        lat: 30.0,  lon: 31.2  },
  { name: "Dubai",        lat: 25.2,  lon: 55.3  },
  { name: "Mumbai",       lat: 19.1,  lon: 72.9  },
  { name: "New York",     lat: 40.7,  lon: -74.0 },
  { name: "Tokyo",        lat: 35.7,  lon: 139.7 },
  { name: "London",       lat: 51.5,  lon: -0.1  },
  { name: "São Paulo",    lat: -23.5, lon: -46.6 },
  { name: "Sydney",       lat: -33.9, lon: 151.2 },
  { name: "Beijing",      lat: 39.9,  lon: 116.4 },
];

const CONTINENTS: Array<{ name: string; poly: [number, number][] }> = [
  { name: "N_America", poly: [[72,-140],[83,-80],[75,-65],[60,-55],[47,-53],[45,-66],[25,-77],[15,-83],[8,-77],[6,-75],[10,-62],[15,-61],[25,-77],[30,-81],[32,-80],[35,-75],[45,-66],[47,-85],[55,-85],[55,-95],[60,-95],[68,-100],[72,-110],[72,-140]] },
  { name: "S_America", poly: [[12,-72],[10,-63],[5,-52],[0,-50],[-5,-35],[-15,-39],[-22,-41],[-33,-53],[-55,-64],[-55,-68],[-45,-74],[-30,-71],[-10,-75],[-5,-80],[5,-77],[10,-75],[12,-72]] },
  { name: "Europe", poly: [[71,25],[70,30],[65,35],[60,30],[55,25],[50,30],[45,35],[42,30],[38,27],[37,23],[38,15],[43,13],[45,7],[47,8],[51,3],[53,5],[55,8],[57,10],[58,15],[60,20],[65,25],[68,20],[70,20],[71,25]] },
  { name: "Africa", poly: [[38,-5],[37,10],[37,15],[33,12],[30,32],[25,37],[20,38],[12,43],[5,41],[0,42],[-10,40],[-20,35],[-25,33],[-30,30],[-35,19],[-35,18],[-25,15],[-5,10],[0,9],[5,2],[5,5],[10,15],[20,15],[23,10],[30,2],[38,-5]] },
  { name: "Asia", poly: [[75,60],[77,100],[73,140],[65,140],[55,140],[50,130],[45,135],[40,125],[35,120],[25,120],[20,110],[10,105],[5,100],[1,104],[5,115],[10,120],[25,90],[15,80],[10,77],[20,63],[22,59],[25,57],[28,60],[32,62],[38,48],[38,40],[42,42],[45,42],[45,37],[42,34],[38,36],[37,28],[40,27],[42,28],[45,30],[50,42],[55,50],[60,55],[67,60],[72,55],[72,70],[75,60]] },
  { name: "Australia", poly: [[-12,131],[-14,136],[-15,130],[-16,124],[-22,114],[-25,114],[-34,115],[-38,140],[-38,145],[-34,151],[-28,153],[-22,150],[-18,146],[-14,144],[-12,136],[-12,131]] },
];

function getHeatmapColor(value: number, variable: string, minVal: number, maxVal: number): [number, number, number] {
  const range = maxVal - minVal || 1;
  const t = Math.max(0, Math.min(1, (value - minVal) / range));
  const stops: Array<[number, [number, number, number]]> = [
    [0.0,  [10,  40, 100]],
    [0.2,  [16,  185, 129]],
    [0.45, [110, 231, 183]],
    [0.6,  [245, 158, 11]],
    [0.78, [225, 29, 72]],
    [0.9,  [180,  20, 40]],
    [1.0,  [100,  10, 20]],
  ];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const alpha = (t - stops[i-1][0]) / (stops[i][0] - stops[i-1][0]);
      const [r1,g1,b1] = stops[i-1][1], [r2,g2,b2] = stops[i][1];
      return [Math.round(r1+alpha*(r2-r1)), Math.round(g1+alpha*(g2-g1)), Math.round(b1+alpha*(b2-b1))];
    }
  }
  return stops[stops.length-1][1];
}

function isOnContinent(latDeg: number, lonDeg: number): boolean {
  for (const continent of CONTINENTS) {
    const poly = continent.poly;
    let inside = false;
    for (let i=0, j=poly.length-1; i<poly.length; j=i++) {
      const [xi,yi]=poly[i], [xj,yj]=poly[j];
      if ((yi>lonDeg)!==(yj>lonDeg) && latDeg<((xj-xi)*(lonDeg-yi))/(yj-yi)+xi) inside=!inside;
    }
    if (inside) return true;
  }
  return false;
}

function getUnit(variable: string) {
  if (variable === "temperature") return "°C";
  if (variable === "precipitation") return "mm";
  return "km/h";
}

interface HoverState { screenX: number; screenY: number; lat: number; lon: number; value: number | null }
interface ClickPopup { lat: number; lon: number; value: number; screenX: number; screenY: number }

export function GlobeView() {
  const { selectedVariable, timeRange, userDatasetName, userDatasetMeta } = useClimateStore();
  const { data, isLoading } = useClimateMapData(Number(timeRange[1]), selectedVariable);

  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rotDegRef   = useRef(0);
  const isDragging  = useRef(false);
  const lastX       = useRef(0);
  const animRef     = useRef<number>(0);

  const [hover, setHover]   = useState<HoverState | null>(null);
  const [popup, setPopup]   = useState<ClickPopup | null>(null);

  // Build data range for adaptive color scaling
  const dataStats = useMemo(() => {
    if (!data || data.length === 0) return { min: -30, max: 40 };
    const vals = data.map(p =>
      selectedVariable === "temperature" ? (p.temp ?? 0) :
      selectedVariable === "precipitation" ? (p.precipitation ?? 0) :
      (p.windSpeed ?? 0)
    ).filter(v => v !== 0);
    if (!vals.length) return { min: -30, max: 40 };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [data, selectedVariable]);

  // Build lookup grid
  const dataGrid = useMemo(() => {
    if (!data || data.length === 0) return null;
    const grid = new Map<string, number>();
    for (const pt of data) {
      const val = selectedVariable === "temperature" ? (pt.temp ?? 0) :
                  selectedVariable === "precipitation" ? (pt.precipitation ?? 0) :
                  (pt.windSpeed ?? 0);
      const key = `${Math.round(pt.lat / 5) * 5},${Math.round(pt.lon / 5) * 5}`;
      if (!grid.has(key)) grid.set(key, val);
    }
    return grid;
  }, [data, selectedVariable]);

  // Canvas-coord → lat/lon
  const screenToLatLon = useCallback((sx: number, sy: number, cx: number, cy: number, radius: number, rotDeg: number) => {
    const dx = sx - cx, dy = sy - cy;
    const dist2 = dx*dx + dy*dy;
    if (dist2 > radius*radius) return null;
    const z = Math.sqrt(radius*radius - dist2);
    const lonRad = Math.atan2(dx, z) + (rotDeg * Math.PI)/180;
    const latRad = Math.asin(-dy / radius);
    let lonDeg = (lonRad * 180/Math.PI);
    lonDeg = ((lonDeg + 180) % 360) - 180;
    return { lat: (latRad * 180/Math.PI), lon: lonDeg };
  }, []);

  const sampleValue = useCallback((latDeg: number, lonDeg: number): number | null => {
    if (!dataGrid) return null;
    const step = 5;
    for (let r = 0; r <= 3; r++) {
      for (let dlat = -r; dlat <= r; dlat++) {
        for (let dlon = -r; dlon <= r; dlon++) {
          if (Math.abs(dlat) !== r && Math.abs(dlon) !== r) continue;
          const la = Math.round(latDeg / step) * step + dlat * step;
          const lo = Math.round(lonDeg / step) * step + dlon * step;
          const key = `${la},${lo}`;
          if (dataGrid.has(key)) return dataGrid.get(key)!;
        }
      }
    }
    // Fallback: approximate
    if (selectedVariable === "temperature") return 30 - Math.abs(latDeg) * 0.4;
    return null;
  }, [dataGrid, selectedVariable]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const radius = Math.min(container.clientWidth, container.clientHeight) * 0.42;
    const stars = Array.from({ length: 350 }, () => ({
      x: Math.random(), y: Math.random(),
      r: 0.3 + Math.random() * 1.4,
      alpha: 0.4 + Math.random() * 0.6,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    const draw = () => {
      const w = container.clientWidth, h = container.clientHeight;
      const r = Math.min(w, h) * 0.42;
      ctx.clearRect(0, 0, w, h);
      const cx = w/2, cy = h/2;

      ctx.fillStyle = "#000005";
      ctx.fillRect(0, 0, w, h);

      // Stars
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x*w, s.y*h, s.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
        ctx.fill();
      }

      // Atmosphere glow
      const atm = ctx.createRadialGradient(cx, cy, r*0.88, cx, cy, r*1.45);
      atm.addColorStop(0, "rgba(16,185,129,0.12)");
      atm.addColorStop(0.5, "rgba(16,185,129,0.05)");
      atm.addColorStop(1, "transparent");
      ctx.fillStyle = atm;
      ctx.beginPath(); ctx.arc(cx, cy, r*1.45, 0, Math.PI*2); ctx.fill();

      // Heatmap surface
      const STEP = 3;
      for (let sy2 = cy-r; sy2 <= cy+r; sy2 += STEP) {
        for (let sx2 = cx-r; sx2 <= cx+r; sx2 += STEP) {
          const dx = sx2-cx, dy = sy2-cy;
          const d2 = dx*dx + dy*dy;
          if (d2 > r*r) continue;
          const z = Math.sqrt(r*r - d2);
          const lonRad = Math.atan2(dx, z) + (rotDegRef.current * Math.PI)/180;
          const latRad = Math.asin(-dy / r);
          const latDeg = latRad*180/Math.PI;
          let lonDeg = lonRad*180/Math.PI;
          lonDeg = ((lonDeg+180)%360)-180;

          const val = sampleValue(latDeg, lonDeg) ?? (30 - Math.abs(latDeg)*0.4);
          let [rc, gc, bc] = getHeatmapColor(val, selectedVariable, dataStats.min, dataStats.max);

          if (!isOnContinent(latDeg, lonDeg)) {
            rc = Math.round(rc * 0.65); gc = Math.round(gc * 0.7); bc = Math.round(bc * 0.78 + 28);
          }

          const shade = 0.38 + 0.72 * (z/r);
          const lx = (dx + r*0.3)/(r*1.3), ly = (dy + r*0.3)/(r*1.3);
          const spec = Math.max(0, 1 - Math.sqrt(lx*lx + ly*ly)) * 0.2;
          const bright = Math.max(0.18, shade) + spec;
          ctx.fillStyle = `rgb(${Math.min(255,Math.round(rc*bright))},${Math.min(255,Math.round(gc*bright))},${Math.min(255,Math.round(bc*bright))})`;
          ctx.fillRect(sx2, sy2, STEP, STEP);
        }
      }

      // Lat/Lon grid lines
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.clip();
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 0.7;
      for (let lat = -60; lat <= 60; lat += 30) {
        const fy = -Math.sin(lat * Math.PI/180) * r;
        const rLat = Math.cos(lat * Math.PI/180) * r;
        ctx.beginPath(); ctx.arc(cx, cy + fy, rLat, 0, Math.PI*2, false);
        ctx.stroke();
      }
      for (let lon = 0; lon < 360; lon += 30) {
        const lonR = ((lon + rotDegRef.current) * Math.PI) / 180;
        const sx2 = cx + Math.sin(lonR) * r;
        const sy2 = cy;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.abs(Math.cos(lonR)*r), r, 0, 0, Math.PI*2);
        ctx.stroke();
      }
      ctx.restore();

      // Rim
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
      const rim = ctx.createRadialGradient(cx, cy, r*0.84, cx, cy, r);
      rim.addColorStop(0, "transparent"); rim.addColorStop(1, "rgba(16,185,129,0.35)");
      ctx.fillStyle = rim; ctx.fill();

      // Cities
      for (const city of CITIES) {
        const phi = (90 - city.lat) * Math.PI/180;
        const theta = ((city.lon + rotDegRef.current) * Math.PI)/180;
        const x3 = r * Math.sin(phi) * Math.sin(theta);
        const z3 = r * Math.sin(phi) * Math.cos(theta);
        const y3 = r * Math.cos(phi);
        if (z3 > 5) {
          const sx2 = cx + x3, sy2 = cy - y3;
          ctx.beginPath(); ctx.arc(sx2, sy2, 2.5, 0, Math.PI*2);
          ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.fill();
          ctx.font = "bold 10px Inter, sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 5;
          ctx.fillText(city.name, sx2+5, sy2-4); ctx.shadowBlur = 0;
        }
      }

      // Specular
      const sp = ctx.createRadialGradient(cx-r*0.3, cy-r*0.35, 0, cx-r*0.3, cy-r*0.35, r*0.5);
      sp.addColorStop(0, "rgba(255,255,255,0.08)"); sp.addColorStop(1, "transparent");
      ctx.fillStyle = sp; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
    };

    const animate = () => {
      if (!isDragging.current) rotDegRef.current += 0.1;
      if (rotDegRef.current > 360) rotDegRef.current -= 360;
      draw();
      animRef.current = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    animate();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, [dataGrid, selectedVariable, dataStats, sampleValue]);

  // Mouse interactions
  const getCanvasCoords = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const getCxCyR = () => {
    const el = containerRef.current!;
    const w = el.clientWidth, h = el.clientHeight;
    return { cx: w/2, cy: h/2, r: Math.min(w, h)*0.42 };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      const dx = e.clientX - lastX.current;
      rotDegRef.current += dx * 0.35;
      lastX.current = e.clientX;
      setHover(null);
      return;
    }
    const { x, y } = getCanvasCoords(e);
    const { cx, cy, r } = getCxCyR();
    const ll = screenToLatLon(x, y, cx, cy, r, rotDegRef.current);
    if (!ll) { setHover(null); return; }
    const val = sampleValue(ll.lat, ll.lon);
    setHover({ screenX: e.clientX, screenY: e.clientY, lat: ll.lat, lon: ll.lon, value: val });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
    setPopup(null);
  };
  const onMouseUp = (e: React.MouseEvent) => {
    const wasDragging = isDragging.current;
    isDragging.current = false;
    if (!wasDragging || Math.abs(e.clientX - lastX.current) < 3) {
      const { x, y } = getCanvasCoords(e);
      const { cx, cy, r } = getCxCyR();
      const ll = screenToLatLon(x, y, cx, cy, r, rotDegRef.current);
      if (ll) {
        const val = sampleValue(ll.lat, ll.lon);
        if (val !== null) setPopup({ lat: ll.lat, lon: ll.lon, value: val, screenX: e.clientX, screenY: e.clientY });
      }
    }
  };
  const onMouseLeave = () => { isDragging.current = false; setHover(null); };

  const unit = getUnit(selectedVariable);

  return (
    <div className="h-[680px] rounded-3xl overflow-hidden relative select-none" style={{ background: "#000005" }}>
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* HUD top-left */}
      <div className="absolute top-5 left-5 z-10">
        <div className="px-4 py-3 rounded-xl bg-black/65 backdrop-blur-xl border border-emerald-500/20 text-white min-w-[170px]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-xs font-black tracking-widest uppercase text-white/90">3D Climate Biosphere</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-mono text-emerald-300/80 uppercase tracking-wider">
              {selectedVariable} · {timeRange[1]}
            </p>
            {userDatasetName && (
              <p className="text-[9px] text-emerald-400/80 font-bold uppercase tracking-wide flex items-center gap-1">
                <Database className="w-2.5 h-2.5" /> Earth Dataset
              </p>
            )}
            <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">Interaction: Rotate · Scan</p>
          </div>
        </div>
      </div>

      {/* Data range HUD — top-right */}
      <div className="absolute top-5 right-5 z-10">
        <div className="px-3 py-2 rounded-xl bg-black/65 backdrop-blur-xl border border-emerald-500/20 text-white text-right">
          <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 font-black">Data Sweep</p>
          <p className="text-[11px] font-black text-emerald-400">{dataStats.min.toFixed(1)}{unit} – {dataStats.max.toFixed(1)}{unit}</p>
          {userDatasetMeta && (
            <p className="text-[9px] text-emerald-500/50 mt-0.5 font-bold uppercase tracking-tighter">
              {userDatasetMeta.pointCount.toLocaleString()} Vectors
            </p>
          )}
        </div>
      </div>

      {/* Color scale legend — bottom right */}
      <div className="absolute bottom-5 right-5 z-10">
        <div className="px-4 py-4 rounded-xl bg-black/75 backdrop-blur-2xl border border-emerald-500/20">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3 text-center">Spectral Scale</p>
          <div className="flex items-center gap-3">
            <div className="h-32 w-1.5 rounded-full overflow-hidden" style={{ background: "linear-gradient(to bottom, rgb(225,29,72), rgb(245,158,11), rgb(110,231,183), rgb(16,185,129), rgb(10,40,100))" }} />
            <div className="flex flex-col justify-between h-32">
              <span className="text-[10px] font-black text-rose-500 leading-none">{dataStats.max.toFixed(0)}{unit}</span>
              <span className="text-[8px] text-slate-600 font-black uppercase tracking-tighter">Hyper</span>
              <span className="text-[8px] text-emerald-600 font-black uppercase tracking-tighter">Neutral</span>
              <span className="text-[10px] font-black text-emerald-400 leading-none">{dataStats.min.toFixed(0)}{unit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hover && !isDragging.current && (
          <motion.div
            key="hover"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed z-50 pointer-events-none"
            style={{ left: hover.screenX + 16, top: hover.screenY - 10 }}
          >
            <div className="px-3 py-2 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 shadow-2xl text-white text-xs min-w-[140px]">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin className="w-3 h-3 text-cyan-400" />
                <span className="font-mono text-cyan-300">
                  {hover.lat.toFixed(2)}° {hover.lat >= 0 ? "N" : "S"}, {Math.abs(hover.lon).toFixed(2)}° {hover.lon >= 0 ? "E" : "W"}
                </span>
              </div>
              {hover.value !== null && (
                <div className="flex items-center gap-1.5">
                  {selectedVariable === "temperature" ? <Thermometer className="w-3 h-3 text-orange-400" /> :
                   selectedVariable === "precipitation" ? <Droplets className="w-3 h-3 text-cyan-400" /> :
                   <Wind className="w-3 h-3 text-purple-400" />}
                  <span className="font-black text-white">{hover.value.toFixed(1)}{unit}</span>
                  <span className="text-slate-400 capitalize">{selectedVariable}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click popup */}
      <AnimatePresence>
        {popup && (
          <motion.div
            key="popup"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50"
            style={{ left: Math.min(popup.screenX + 16, window.innerWidth - 220), top: popup.screenY - 80 }}
          >
            <div className="px-4 py-3 rounded-2xl bg-slate-900/98 backdrop-blur-xl border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-white w-52">
              <button onClick={() => setPopup(null)} className="absolute top-2 right-2 text-slate-500 hover:text-white text-xs">✕</button>
              <div className="flex items-center gap-1.5 mb-2">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Location Data</span>
              </div>
              <div className="font-mono text-sm text-white mb-2">
                {popup.lat.toFixed(3)}°{popup.lat >= 0 ? "N" : "S"}<br />
                {Math.abs(popup.lon).toFixed(3)}°{popup.lon >= 0 ? "E" : "W"}
              </div>
              <div className={`flex items-center gap-2 p-2 rounded-xl ${
                selectedVariable === "temperature" ? "bg-orange-500/10 border border-orange-500/20" :
                selectedVariable === "precipitation" ? "bg-cyan-500/10 border border-cyan-500/20" :
                "bg-purple-500/10 border border-purple-500/20"}`}>
                {selectedVariable === "temperature" ? <Thermometer className="w-4 h-4 text-orange-400" /> :
                 selectedVariable === "precipitation" ? <Droplets className="w-4 h-4 text-cyan-400" /> :
                 <Wind className="w-4 h-4 text-purple-400" />}
                <div>
                  <div className="text-lg font-black">{popup.value.toFixed(2)}{unit}</div>
                  <div className="text-[10px] text-slate-400 capitalize">{selectedVariable} · {timeRange[1]}</div>
                </div>
              </div>
              {userDatasetName && (
                <p className="text-[9px] text-emerald-400/70 mt-2 text-center">from {userDatasetName}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full" />
              <div className="absolute inset-0 border-t-2 border-cyan-400 rounded-full animate-spin" />
            </div>
            <span className="text-xs font-bold text-cyan-400 tracking-[0.3em] uppercase">Loading Globe</span>
          </div>
        </div>
      )}
    </div>
  );
}
