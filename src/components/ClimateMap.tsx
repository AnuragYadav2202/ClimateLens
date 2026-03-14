"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useClimateMapData } from "@/lib/hooks";
import { useClimateStore } from "@/lib/store";
import { motion } from "framer-motion";
import { HexagonLayer, HeatmapLayer } from "@deck.gl/aggregation-layers";
import { PathLayer } from "@deck.gl/layers";
import Map from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import "maplibre-gl/dist/maplibre-gl.css";
import { CountryInsightModal } from "./CountryInsightModal";

// Free OpenFreeMap dark style - no token required
const MAP_STYLE = "https://tiles.openfreemap.org/styles/dark";

const INITIAL_VIEW_STATE = {
  longitude: 20,
  latitude: 30,
  zoom: 2,
  pitch: 0,
  bearing: 0,
};

interface ClimateMapProps {
  /** Override year (e.g. for comparison view). Uses store timeRange when not set. */
  yearOverride?: number;
}

export function ClimateMap({ yearOverride }: ClimateMapProps = {}) {
  const { timeRange, selectedVariable, impactTempDelta, mapStyle } =
    useClimateStore();
  const isBrowser = typeof window !== "undefined";
  const year = yearOverride ?? timeRange[1];
  const { data, isLoading } = useClimateMapData(year, selectedVariable);
  const [hoverInfo, setHoverInfo] = useState<{
    lat: number;
    lon: number;
    value: number;
  } | null>(null);
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);

  // Detect continent from lat/lon with simple polygon check
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
    const adjustedData = data.map((d) => {
      const val = valueKey === "temp" ? d.temp : valueKey === "precipitation" ? (d.precipitation ?? 0) : (d.windSpeed ?? 0);
      return {
        ...d,
        [valueKey]: val + (selectedVariable === "temperature" ? impactTempDelta : 0),
      };
    });

    const colorPalettes = {
      turbo: [
        [48, 18, 59, 255],
        [70, 107, 227, 255],
        [40, 187, 235, 255],
        [50, 242, 152, 255],
        [169, 252, 60, 255],
        [238, 203, 56, 255],
        [254, 118, 37, 255],
        [207, 39, 13, 255],
        [122, 4, 3, 255],
      ],
      viridis: [
        [68, 1, 84, 255],
        [71, 44, 122, 255],
        [59, 81, 139, 255],
        [44, 113, 142, 255],
        [33, 144, 141, 255],
        [39, 173, 129, 255],
        [92, 200, 99, 255],
        [170, 220, 50, 255],
        [253, 231, 37, 255],
      ],
      magma: [
        [0, 0, 4, 255],
        [27, 12, 64, 255],
        [81, 18, 124, 255],
        [131, 33, 135, 255],
        [182, 54, 121, 255],
        [230, 81, 100, 255],
        [251, 135, 97, 255],
        [254, 194, 135, 255],
        [252, 253, 191, 255],
      ]
    };

    const currentPalette = selectedVariable === 'precipitation' ? colorPalettes.viridis : colorPalettes.turbo;

    const gridData = [];
    for (let lat = -90; lat <= 90; lat += 20) {
      gridData.push({ path: [[-180, lat], [180, lat]] });
    }
    for (let lon = -180; lon <= 180; lon += 20) {
      gridData.push({ path: [[lon, -90], [lon, 90]] });
    }

    const gridLayer = new PathLayer({
      id: "grid-layer",
      data: gridData,
      getPath: (d: any) => d.path,
      getColor: [255, 255, 255, 15],
      getWidth: 0.5,
      widthUnits: 'pixels',
    });

    if (mapStyle === "hexagon") {
      return [
        new HexagonLayer({
          id: "climate-hexagon",
          data: adjustedData,
          getPosition: (d: { lon: number; lat: number }) => [d.lon, d.lat],
          getColorValue: (d: {
            temp?: number;
            precipitation?: number;
            windSpeed?: number;
          }) =>
            (valueKey === "temp"
              ? d.temp
              : valueKey === "precipitation"
                ? d.precipitation
                : d.windSpeed) ?? 0,
          colorRange: currentPalette as any,
          elevationRange: [0, 1200],
          elevationScale: 140,
          extruded: true,
          radius: 120000,
          coverage: 0.98,
          pickable: true,
          onHover: (info: any) => {
            const val = info.object && (info.object as any)[valueKey];
            if (info.object && val != null && Number.isFinite(val)) {
              setHoverInfo({
                lat: info.object.lat,
                lon: info.object.lon,
                value: val,
              });
            } else {
              setHoverInfo(null);
            }
            return false;
          },
        }),
        gridLayer
      ];
    }

    return [
      new HeatmapLayer({
        id: "climate-heatmap",
        data: adjustedData,
        getPosition: (d: { lon: number; lat: number }) => [d.lon, d.lat],
        getWeight: (d: any) => {
          const val = (valueKey === "temp"
            ? d.temp
            : valueKey === "precipitation"
              ? d.precipitation
              : d.windSpeed) ?? 0;
          // Subtly normalize/boost for heatmap visualization
          return selectedVariable === 'temperature' ? val + 20 : val;
        },
        aggregation: 'MEAN',
        colorRange: currentPalette as any,
        radiusPixels: 15,
        intensity: 8,
        threshold: 0.05,
        opacity: 0.9,
        pickable: true,
        onHover: (info: any) => {
          if (info.object && info.object.lat != null) {
            setHoverInfo({
              lat: info.object.lat,
              lon: info.object.lon,
              value: (info.object as any)[valueKey] || 0,
            });
          } else if (info.coordinate) {
            // Heatmap aggregation objects aren't direct, so we use coordinates for tooltip
            setHoverInfo({
              lat: info.coordinate[1],
              lon: info.coordinate[0],
              value: 0, // Placeholder as heatmap object access is complex
            });
          } else {
            setHoverInfo(null);
          }
          return false;
        },
      }),
      gridLayer
    ];
  }, [data, valueKey, selectedVariable, impactTempDelta, mapStyle]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full min-h-[400px] rounded-xl bg-slate-800/50 flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-slate-400">Loading map data...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full min-h-[400px] rounded-xl overflow-hidden glass-card relative"
    >
      {isBrowser && (
        <DeckGL
          initialViewState={INITIAL_VIEW_STATE}
          controller={true}
          layers={layers}
          onError={(error: any) => console.error("DeckGL Error:", error)}
          onClick={({ coordinate }: any) => {
            if (coordinate) {
              const continent = detectContinent(coordinate[1], coordinate[0]);
              if (continent) setSelectedContinent(continent);
            }
          }}
          getCursor={() => "crosshair"}
          getTooltip={({ object, coordinate }: any) => {
            if (object) {
              const val = object.value ?? (object as any)[valueKey] ?? 0;
              return {
                html: `<div class="p-2 text-xs font-sans">
                  <b class="text-cyan-400">VALUE:</b> ${Number(val).toFixed(2)}<br/>
                  <b class="text-slate-400">LAT:</b> ${Number(object.lat || 0).toFixed(2)}°<br/>
                  <b class="text-slate-400">LON:</b> ${Number(object.lon || 0).toFixed(2)}°
                </div>`,
                style: {
                  backgroundColor: "#0f172a",
                  color: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #1e293b",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
                },
              };
            }
            if (coordinate) {
               return {
                html: `<div class="p-2 text-xs font-sans text-slate-400">
                  Lat: ${coordinate[1].toFixed(2)}°, Lon: ${coordinate[0].toFixed(2)}°
                </div>`,
                 style: {
                  backgroundColor: "#0f172a",
                  color: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #1e293b",
                },
               }
            }
            return null;
          }}
        >
          <Map 
            mapStyle={MAP_STYLE} 
            reuseMaps 
            mapLib={import('maplibre-gl')}
          />
        </DeckGL>
      )}

      {/* Source Badge */}
      <div className="absolute top-4 left-4 z-10 p-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/50 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">
            Live Stream
          </span>
          <span className="text-xs font-bold text-slate-200">
            Source: {useClimateStore.getState().userDatasetName || "Pre-provided ERA5"}
          </span>
        </div>
      </div>

      {/* Country Insight Modal */}
      {selectedContinent && (
        <CountryInsightModal
          continentId={selectedContinent}
          onClose={() => setSelectedContinent(null)}
        />
      )}

      {/* Click hint */}
      <div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-slate-700/40 text-[10px] text-slate-400 font-medium">
        Click any region for climate insights
      </div>

      <div className="absolute bottom-4 left-4 px-3 py-2 rounded-lg glass text-sm z-10">
        <span className="text-slate-400">Year: </span>
        <span className="text-cyan-400 font-semibold">{year}</span>
        <span className="text-slate-400 ml-2">Variable: </span>
        <span className="capitalize text-cyan-400">{selectedVariable}</span>
      </div>
    </motion.div>
  );
}
