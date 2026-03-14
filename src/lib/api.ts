// API layer - real data from Open-Meteo, fallback to mock

import {
  generateMapData,
  generateTimeSeriesData,
  datasets,
  mockInsights,
  type ClimateDataPoint,
  type TimeSeriesPoint,
  type Dataset,
} from "./mockData";
import {
  fetchClimateGrid,
  fetchClimateTimeSeries,
  type OpenMeteoVariable,
} from "./openMeteo";
import { useClimateStore } from "./store";

const USE_REAL_API = true;

function avg(arr: number[]): number {
  const filtered = arr.filter((v) => v != null && !Number.isNaN(v));
  if (filtered.length === 0) return 0;
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
}

export async function fetchMapData(
  year: number,
  variable = "temperature"
): Promise<ClimateDataPoint[]> {
  const { userPoints } = useClimateStore.getState();
  if (userPoints && userPoints.length) {
    // Use uploaded dataset points when present
    return userPoints.filter((p) => !p.year || p.year === year);
  }

  if (!USE_REAL_API) return generateMapData(year);

  try {
    const responses = await fetchClimateGrid(year);
    const data: ClimateDataPoint[] = [];

    for (const loc of responses) {
      const daily = loc.daily;
      const temps = daily.temperature_2m_mean || [];
      const prec = daily.precipitation_sum || [];
      const wind = daily.wind_speed_10m_mean || [];

      const tempVal = avg(temps);
      const precVal = prec.reduce((a, b) => a + (b ?? 0), 0);
      const windVal = avg(wind);

      data.push({
        lat: loc.latitude,
        lon: loc.longitude,
        temp: Math.round(tempVal * 10) / 10,
        year,
        precipitation: Math.round(precVal * 10) / 10,
        windSpeed: Math.round(windVal * 10) / 10,
      });
    }

    if (data.length === 0) throw new Error("No data");
    return data;
  } catch (e) {
    console.warn("Open-Meteo map fetch failed, using mock:", e);
    return generateMapData(year);
  }
}

function mapVariableToOpenMeteo(
  v: "temperature" | "precipitation" | "wind"
): OpenMeteoVariable {
  if (v === "temperature") return "temperature_2m_mean";
  if (v === "precipitation") return "precipitation_sum";
  return "wind_speed_10m_mean";
}

export async function fetchTimeSeries(
  variable: "temperature" | "precipitation" | "wind",
  startYear = 1990,
  endYear = 2024
): Promise<TimeSeriesPoint[]> {
  if (!USE_REAL_API)
    return generateTimeSeriesData(variable, startYear, endYear);

  try {
    const rows = await fetchClimateTimeSeries(
      mapVariableToOpenMeteo(variable),
      startYear,
      endYear
    );
    return rows.map((r) => ({
      year: r.year,
      value: r.value,
      label: `${r.year}`,
    }));
  } catch (e) {
    console.warn("Open-Meteo time series fetch failed, using mock:", e);
    return generateTimeSeriesData(variable, startYear, endYear);
  }
}

export async function fetchLocationTimeSeries(
  variable: "temperature" | "precipitation" | "wind",
  startYear: number,
  endYear: number,
  lat: number,
  lon: number
): Promise<TimeSeriesPoint[]> {
  if (!USE_REAL_API) {
    return generateTimeSeriesData(variable, startYear, endYear);
  }
  try {
    const rows = await fetchClimateTimeSeries(
      mapVariableToOpenMeteo(variable),
      startYear,
      endYear,
      lat,
      lon
    );
    return rows.map((r) => ({
      year: r.year,
      value: r.value,
      label: `${r.year}`,
    }));
  } catch {
    return generateTimeSeriesData(variable, startYear, endYear);
  }
}

export async function fetchDatasets(): Promise<Dataset[]> {
  return datasets;
}

export type TimeRange = [number, number];

function computeInsights(
  timeSeriesData: TimeSeriesPoint[],
  mapData: ClimateDataPoint[],
  variable: "temperature" | "precipitation" | "wind",
  timeRange: TimeRange
): string[] {
  const insights: string[] = [];
  const [startYear, endYear] = timeRange;

  if (timeSeriesData.length >= 2) {
    const first = timeSeriesData[0];
    const last = timeSeriesData[timeSeriesData.length - 1];
    const delta = Math.round((last.value - first.value) * 100) / 100;
    const years = endYear - startYear;
    const perDecade = years >= 10 ? Math.round((delta / years) * 1000) / 100 : delta;

    if (variable === "temperature") {
      insights.push(
        `Mean temperature changed by ${delta >= 0 ? "+" : ""}${delta}°C from ${startYear} to ${endYear}.`
      );
      if (years >= 10) {
        insights.push(`Trend: approximately ${perDecade}°C per decade.`);
      }
    } else if (variable === "precipitation") {
      const pct =
        first.value !== 0
          ? Math.round((delta / first.value) * 100)
          : 0;
      insights.push(
        `Total precipitation changed by ${delta >= 0 ? "+" : ""}${delta.toFixed(1)} mm (${pct}%) from ${startYear} to ${endYear}.`
      );
    } else {
      insights.push(
        `Mean wind speed changed by ${delta >= 0 ? "+" : ""}${delta.toFixed(1)} km/h from ${startYear} to ${endYear}.`
      );
    }
  }

  if (mapData.length > 0 && variable === "temperature") {
    const temps = mapData.map((d) => d.temp).filter((t) => t != null);
    if (temps.length > 0) {
      const globalMean = avg(temps);
      const minT = Math.min(...temps);
      const maxT = Math.max(...temps);
      insights.push(
        `Global mean temperature in ${endYear}: ${globalMean.toFixed(1)}°C (range ${minT.toFixed(1)}–${maxT.toFixed(1)}°C).`
      );
    }
  }

  if (mapData.length > 0 && variable === "precipitation") {
    const prec = mapData.map((d) => d.precipitation ?? 0).filter((p) => p >= 0);
    if (prec.length > 0) {
      const total = prec.reduce((a, b) => a + b, 0);
      const mean = total / prec.length;
      insights.push(
        `Average annual precipitation across grid: ${mean.toFixed(0)} mm in ${endYear}.`
      );
    }
  }

  return insights.length > 0 ? insights : ["Loading more insights…"];
}

export async function fetchInsights(
  year?: number,
  timeRange?: TimeRange,
  variable: "temperature" | "precipitation" | "wind" = "temperature"
): Promise<string[]> {
  const range: TimeRange = timeRange ?? [1990, year ?? 2024];

  try {
    const [timeSeriesData, mapData] = await Promise.all([
      fetchTimeSeries(variable, range[0], range[1]),
      fetchMapData(range[1], variable),
    ]);
    return computeInsights(timeSeriesData, mapData, variable, range);
  } catch {
    const shuffled = [...mockInsights].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }
}
