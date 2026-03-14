import { create } from "zustand";
import type { ClimateDataPoint } from "./mockData";

export type VariableType = "temperature" | "precipitation" | "wind";
export type TimeRange = [number, number];

export interface UserDatasetMeta {
  name: string;
  pointCount: number;
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
  yearMin: number;
  yearMax: number;
  detectedVariables: string[];
  tempRange?: [number, number];
  precipRange?: [number, number];
  windRange?: [number, number];
}

interface ClimateStore {
  selectedDataset: string;
  selectedVariable: VariableType;
  timeRange: TimeRange;
  compareMode: boolean;
  compareYear1: number;
  compareYear2: number;
  impactTempDelta: number;
  mapStyle: "hexagon" | "heatmap";
  userPoints?: ClimateDataPoint[];
  userDatasetName?: string;
  userDatasetMeta?: UserDatasetMeta;
  setDataset: (id: string) => void;
  setVariable: (v: VariableType) => void;
  setTimeRange: (range: TimeRange) => void;
  setCompareMode: (enabled: boolean) => void;
  setCompareYears: (y1: number, y2: number) => void;
  setImpactTempDelta: (delta: number) => void;
  setMapStyle: (style: "hexagon" | "heatmap") => void;
  setUserDataset: (name: string, points: ClimateDataPoint[], meta?: UserDatasetMeta) => void;
  clearUserDataset: () => void;
}

export const useClimateStore = create<ClimateStore>((set) => ({
  selectedDataset: "openmeteo",
  selectedVariable: "temperature",
  timeRange: [1990, 2024],
  compareMode: false,
  compareYear1: 1990,
  compareYear2: 2020,
  impactTempDelta: 1,
  mapStyle: "heatmap",
  userPoints: undefined,
  userDatasetName: undefined,
  userDatasetMeta: undefined,
  setDataset: (id) => set({ selectedDataset: id }),
  setVariable: (v) => set({ selectedVariable: v }),
  setTimeRange: (range) => set({ timeRange: range }),
  setCompareMode: (enabled) => set({ compareMode: enabled }),
  setCompareYears: (y1, y2) => set({ compareYear1: y1, compareYear2: y2 }),
  setImpactTempDelta: (delta) => set({ impactTempDelta: delta }),
  setMapStyle: (style) => set({ mapStyle: style }),
  setUserDataset: (name, points, meta) => set({ userDatasetName: name, userPoints: points, userDatasetMeta: meta }),
  clearUserDataset: () => set({ userDatasetName: undefined, userPoints: undefined, userDatasetMeta: undefined }),
}));
