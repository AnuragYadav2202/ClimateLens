"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useClimateMapData } from "@/lib/hooks";
import { useClimateStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { HexagonLayer, GridLayer, HeatmapLayer } from "@deck.gl/aggregation-layers";
import { PathLayer, ArcLayer, ScatterplotLayer } from "@deck.gl/layers";
import Map from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import "maplibre-gl/dist/maplibre-gl.css";
import { CountryInsightModal } from "./CountryInsightModal";
import { Globe, Database, Filter, Maximize2, MousePointer2 } from "lucide-react";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/dark";

const INITIAL_VIEW_STATE = {
  longitude: 20,
  latitude: 25,
  zoom: 1.8,
  pitch: 35,
  bearing: 0,
};

export function ClimateMap({ yearOverride }: { yearOverride?: number } = {}) {
  const { timeRange, selectedVariable, impactTempDelta, mapStyle, userDatasetName } = useClimateStore();
  const isBrowser = typeof window !== "undefined";
  const year = yearOverride ?? timeRange[1];
  const { data, isLoading } = useClimateMapData(year, selectedVariable);

  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);

  // Continent detection
  function detectContinent(lat: number, lon: number): string | null {
    if (lat > 10 && lat < 83 && lon > -170 && lon < -50) return "N_America";
    if (lat > -60 && lat < 15 && lon > -82 && lon < -32) return "S_America";
    if (lat > 35 && lat < 72 && lon > -12 && lon < 45) return "Europe";
    if (lat > -38 && lat < 38 && lon > -18 && lon < 52) return "Africa";
    if (lat > -12 && lat < 78 && lon > 25 && lon < 145) return "Asia";
    if (lat > -48 && lat < -10 && lon > 110 && lon < 158) return "Australia";
    return null;
  }

  const valueKey = useMemo(() => {
    if (selectedVariable === "temperature") return "temp";
    if (selectedVariable === "precipitation") return "precipitation";
    return "windSpeed";
  }, [selectedVariable]);

  const layers = useMemo(() => {
    if (!data?.length) return [];
    
    // Smooth data points for visualization
    const processedData = data.map((d) => {
      const val = (valueKey === "temp" ? d.temp : valueKey === "precipitation" ? (d.precipitation ?? 0) : (d.windSpeed ?? 0)) ?? 0;
      return {
        ...d,
        value: val + (selectedVariable === "temperature" ? impactTempDelta : 0),
      };
    });

    const palettes = {
      temperature: [
        [10, 200, 220, 255], [80, 220, 160, 255], [240, 180, 20, 255], [235, 110, 30, 255], [180, 30, 10, 255]
      ],
      precipitation: [
        [247, 251, 255, 255], [198, 219, 239, 255], [107, 174, 214, 255], [33, 113, 181, 255], [8, 48, 107, 255]
      ],
      wind: [
        [242, 240, 247, 255], [203, 201, 226, 255], [158, 154, 200, 255], [117, 107, 177, 255], [74, 20, 134, 255]
      ]
    };

    const activePalette = selectedVariable === 'temperature' ? palettes.temperature : 
                         selectedVariable === 'precipitation' ? palettes.precipitation : palettes.wind;

    // Lat/Lon grid background
    const gridLines = [];
    for (let lat = -90; lat <= 90; lat += 15) gridLines.push({ path: [[-180, lat], [180, lat]] });
    for (let lon = -180; lon <= 180; lon += 30) gridLines.push({ path: [[lon, -90], [lon, 90]] });

    const gridBaseLayer = new PathLayer({
      id: "map-base-grid",
      data: gridLines,
      getPath: (d: any) => d.path,
      getColor: [255, 255, 255, 12],
      getWidth: 0.5,
      widthUnits: 'pixels',
    });

    if (mapStyle === "hexagon") {
      return [
        gridBaseLayer,
        new HexagonLayer({
          id: "climate-hex",
          data: processedData,
          getPosition: (d: any) => [d.lon, d.lat],
          getElevationValue: (points: any[]) => points[0].value,
          getColorValue: (points: any[]) => points[0].value,
          colorRange: activePalette as any,
          elevationRange: [0, 1500],
          elevationScale: 180,
          extruded: true,
          radius: 110000,
          coverage: 0.95,
          pickable: true,
          transition: { elevationScale: 400 },
          onHover: (info: any) => setHoverInfo(info),
        }),
      ];
    }

    // "Heatmap" suggestion: Using a high-res GridLayer instead of HeatmapLayer
    // for a more "scientific and detailed" look.
    return [
      gridBaseLayer,
      new GridLayer({
        id: "climate-grid",
        data: processedData,
        getPosition: (d: any) => [d.lon, d.lat],
        getColorValue: (points: any[]) => points[0].value,
        colorRange: activePalette as any,
        cellSize: 110000,
        coverage: 0.98,
        gpuAggregation: true,
        pickable: true,
        opacity: 0.85,
        onHover: (info: any) => setHoverInfo(info),
      }),
      // Add a subtle glow/pulsing layer for hotspots
      new ScatterplotLayer({
        id: "hotspot-glow",
        data: processedData.filter(d => d.value > (selectedVariable === 'temperature' ? 32 : 100)),
        getPosition: (d: any) => [d.lon, d.lat],
        getRadius: 250000,
        getFillColor: [255, 255, 255, 20],
        stroked: false,
        pickable: false,
      })
    ];
  }, [data, valueKey, selectedVariable, impactTempDelta, mapStyle]);

  const unit = selectedVariable === 'temperature' ? '°C' : selectedVariable === 'precipitation' ? 'mm' : 'km/h';

  if (isLoading) {
    return (
      <div className="h-full min-h-[500px] rounded-2xl bg-slate-900/50 flex items-center justify-center border border-white/5">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full" />
            <div className="absolute inset-0 border-t-2 border-cyan-400 rounded-full animate-spin" />
            <Globe className="absolute inset-0 m-auto w-5 h-5 text-cyan-400/50" />
          </div>
          <span className="text-xs font-bold text-cyan-400 tracking-[0.3em] uppercase">Syncing Data</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full min-h-[500px] rounded-2xl overflow-hidden glass-card relative border border-white/10 group"
    >
      {isBrowser && (
        <DeckGL
          initialViewState={INITIAL_VIEW_STATE}
          controller={true}
          layers={layers}
          onClick={({ coordinate }: any) => {
            if (coordinate) {
              const continent = detectContinent(coordinate[1], coordinate[0]);
              if (continent) setSelectedContinent(continent);
            }
          }}
          getCursor={() => "crosshair"}
        >
          <Map mapStyle={MAP_STYLE} reuseMaps mapLib={import('maplibre-gl')} />
        </DeckGL>
      )}

      {/* Tooltip HUD */}
      <AnimatePresence>
        {hoverInfo?.object && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute z-50 pointer-events-none px-4 py-3 rounded-xl bg-slate-950/90 backdrop-blur-xl border border-white/10 shadow-2xl"
            style={{ left: hoverInfo.x + 15, top: hoverInfo.y - 10 }}
          >
            <div className="flex items-center gap-2 mb-1.5 text-cyan-400">
              <MousePointer2 className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-widest">Scientific Metric</span>
            </div>
            <div className="flex items-baseline gap-1.5 text-white">
              <span className="text-2xl font-black">{hoverInfo.object.colorValue.toFixed(2)}</span>
              <span className="text-xs font-bold text-slate-400">{unit}</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-500 font-mono">
              {hoverInfo.coordinate[1].toFixed(2)}N, {hoverInfo.coordinate[0].toFixed(2)}E
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Controls HUD */}
      <div className="absolute top-5 left-5 z-10 flex flex-col gap-3">
        {/* Source Badge */}
        <div className="px-4 py-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] leading-none mb-1">Data Engine</span>
            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-cyan-400" />
              {userDatasetName || "ERA5 Historical"}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-3 h-3 text-slate-400" />
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Metrics</span>
          </div>
          <div className="flex flex-col gap-1.5">
             <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
               <span>LOW</span>
               <span>HIGH</span>
             </div>
             <div className="h-1.5 w-full rounded-full" style={{ 
               background: `linear-gradient(to right, ${selectedVariable === 'temperature' ? 'rgb(10,200,220), rgb(240,180,20), rgb(180,30,10)' : 
                            selectedVariable === 'precipitation' ? 'rgb(198,219,239), rgb(33,113,181), rgb(8,48,107)' : 
                            'rgb(203,201,226), rgb(117,107,177), rgb(74,20,134)'})` 
             }} />
          </div>
        </div>
      </div>

      {/* Bottom Context HUD */}
      <div className="absolute bottom-5 left-5 z-10 px-4 py-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Focus Year</span>
          <span className="text-xl font-black text-cyan-400 leading-none">{year}</span>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Analytic View</span>
          <span className="text-xs font-bold text-slate-100 uppercase tracking-wider capitalize">{mapStyle || 'Smooth'}</span>
        </div>
      </div>

      {/* Region Hint */}
      <div className="absolute bottom-5 right-5 z-10 hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full bg-cyan-500/10 backdrop-blur-xl border border-cyan-500/30 text-[10px] text-cyan-400 font-black uppercase tracking-widest group-hover:scale-105 transition-transform cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.1)]">
        <Maximize2 className="w-3 h-3" />
        Analyze Regions
      </div>

      {selectedContinent && (
        <CountryInsightModal
          continentId={selectedContinent}
          onClose={() => setSelectedContinent(null)}
        />
      )}
    </motion.div>
  );
}
